// The local gateway client over `V1rTransport`. Every method issues a fresh
// request: nothing is cached or coalesced, except `connect`.
import {
    AuthorizationRole,
    authorizationRoleToJSON,
    AuthorizedClientType,
    authorizedClientTypeToJSON,
    authorizedKeyTypeToJSON,
    authorizedStateToJSON,
    authorizedVerificationTypeToJSON,
    type AuthorizationRecord,
} from "@teslemetry/tesla-protocol/energy_device/authorization_types";
import { CommonAPIGetSystemInfoResponse } from "@teslemetry/tesla-protocol/energy_device/common_api";
import { FileStoreAPIDomain } from "@teslemetry/tesla-protocol/energy_device/filestore_api";
import { GraphQLQueryFormat, SignedGraphQLQuery } from "@teslemetry/tesla-protocol/energy_device/graphql_api";
import { LocalParticipant } from "@teslemetry/tesla-protocol/energy_device/local_auth_api";
import {
    controllableDeviceProgramKey_PriorityToJSON,
    controllableDeviceProgramScheduleBoundary_IslandingStateToJSON,
    controllableDeviceProgramScheduleBoundary_StateOfEnergyToJSON,
    controllableDeviceProgramScheduleBoundary_StaticConditionToJSON,
    controllableDeviceProgramSettings_ContactorStateToJSON,
    type ControllableDeviceProgram as ProtoProgram,
    type ControllableDeviceProgramScheduleBoundary,
} from "@teslemetry/tesla-protocol/energy_device/teg_api";
import { DeliveryChannel, MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import {
    PowerwallCommandError,
    PowerwallFaultError,
    PowerwallNotSupportedError,
    PowerwallProtocolError,
} from "./exceptions.js";
import { validate_dispatch_battery_power } from "../energyspecific.js";
import type {
    AuthorizedClientRecord,
    AuthorizedClientsPayload,
    BackupEventsPayload,
    BatteryCalibrationDelayStatus,
    ComponentsPayload,
    ConfigPayload,
    ControllableDeviceProgram,
    ControllableDeviceProgramsPayload,
    ControllerPayload,
    EnumName,
    FirmwareDetails,
    ProgramBoundary,
    StatusPayload,
} from "./models.js";
import {
    COMPONENTS_CODE,
    COMPONENTS_QUERY,
    COMPONENTS_VARIABLES,
    CONTROLLER_CODE,
    CONTROLLER_QUERY,
    CONTROLLER_VARIABLES,
    STATUS_CODE,
    STATUS_QUERY,
} from "./queries.js";
import { V1rTransport } from "./transport.js";

/** The gateway's own Wi-Fi access point. */
export const DEFAULT_GATEWAY_HOST = "192.168.91.1";

/** Values of `default_real_mode`. Each sticks and reads back verbatim on a Powerwall 3. */
export const OPERATION_MODES = ["self_consumption", "autonomous", "backup"] as const;
/** Values of `site_info.customer_preferred_export_rule`. Each sticks and reads back verbatim on a Powerwall 3. */
export const GRID_EXPORT_RULES = ["battery_ok", "pv_only", "never"] as const;

/** The default length of a manual backup event, and the shortest the gateway takes. */
const DEFAULT_BACKUP_DURATION_SECONDS = 7200;
const MIN_BACKUP_DURATION_SECONDS = 60;
/** `2^64 - 1`, which pre-empts any other event. A string because it does not fit a JS number. */
const MAX_PRIORITY = "18446744073709551615";
const MAX_UINT32 = 2 ** 32 - 1;

/** `google.rpc.Code.UNIMPLEMENTED`, for a command the firmware does not implement. */
const STATUS_UNIMPLEMENTED = 12;

/** The bottom 5% of both scales is an inaccessible buffer: `raw = scaled * 0.95 + 5`. */
const SCALE = 0.95;
const OFFSET = 5;

const CONFIG_FILE = "config.json";

type Header = Pick<MessageEnvelope, "deliveryChannel" | "sender" | "recipient">;

/** What a command request does with a reply that lacks its response field. */
type MissingReply =
    /** Raise. */
    | "raise"
    /** Accept any reply, and a fault or protocol failure from the POST: the reply is empty and some firmware omits it. */
    | "tolerate";

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Walk nested objects; `undefined` if any step is missing. */
function lookup(data: unknown, ...keys: string[]): unknown {
    return keys.reduce<unknown>((value, key) => (isRecord(value) ? value[key] : undefined), data);
}

/** Round to 4 decimal places. Within 0.0001 of Python's `round` on exact binary ties. */
function round4(value: number): number {
    return Number(value.toFixed(4));
}

/**
 * Enum name with `prefix` removed. A firmware newer than this package can
 * report a number with no name: that comes back as the number, and never throws.
 */
function enumSuffix(toJSON: (value: number) => string, value: number, prefix: string): EnumName {
    const name = toJSON(value);
    return name === "UNRECOGNIZED" ? value : name.slice(prefix.length);
}

function seconds(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}

function base64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64");
}

function parseJsonObject(text: string, what: string): Record<string, any> {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch (error) {
        throw new PowerwallProtocolError(`${what} payload is not valid JSON`, { cause: error });
    }
    if (!isRecord(data)) {
        throw new PowerwallProtocolError(`${what} payload is not an object`);
    }
    return data;
}

function decodeConfig(blob: Uint8Array): Record<string, any> {
    let text: string;
    try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(blob);
    } catch (error) {
        throw new PowerwallProtocolError("config.json blob is not UTF-8", { cause: error });
    }
    return parseJsonObject(text, "config.json");
}

/** Set a dotted path in `config`. A missing or non-object step becomes `{}`. */
function applyDottedUpdate(config: Record<string, any>, dottedPath: string, value: unknown): void {
    const keys = dottedPath.split(".");
    const last = keys.pop() as string;
    let target = config;
    for (const key of keys) {
        const existing: unknown = Object.hasOwn(target, key) ? target[key] : undefined;
        target = isRecord(existing) ? existing : (target[key] = {});
    }
    target[last] = value;
}

function requireNonEmptyString(value: string, name: string): void {
    if (typeof value !== "string") {
        throw new TypeError(`${name} must be a string`);
    }
    if (!value) {
        throw new RangeError(`${name} must not be empty`);
    }
}

function requireNonNegative(value: number, name: string): void {
    if (typeof value !== "number") {
        throw new TypeError(`${name} must be a number`);
    }
    if (!(value >= 0)) {
        throw new RangeError(`${name} must be non-negative`);
    }
}

function requireIntegerInRange(value: number, name: string, minimum: number, maximum: number): void {
    if (typeof value !== "number") {
        throw new TypeError(`${name} must be a number`);
    }
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}`);
    }
}

function decodeEnvelope(inner: Uint8Array, what: string): MessageEnvelope {
    try {
        return MessageEnvelope.decode(inner);
    } catch (error) {
        throw new PowerwallProtocolError(`Malformed ${what} response`, { cause: error });
    }
}

/** Header for the `filestore`, `teg` and `authorization` messages. */
function commandHeader(din: string): Header {
    return {
        deliveryChannel: DeliveryChannel.DELIVERY_CHANNEL_HERMES_COMMAND,
        sender: { authorizedClient: AuthorizedClientType.AUTHORIZED_CLIENT_TYPE_CUSTOMER_MOBILE_APP },
        recipient: { din },
    };
}

/** Header for GraphQL and system-info reads, sent as a local installer. */
function localHeader(din: string): Header {
    return {
        deliveryChannel: DeliveryChannel.DELIVERY_CHANNEL_LOCAL_HTTPS,
        sender: { local: LocalParticipant.LOCAL_PARTICIPANT_INSTALLER },
        recipient: { din },
    };
}

function programBoundary(boundary: ControllableDeviceProgramScheduleBoundary | undefined): ProgramBoundary | null {
    if (boundary === undefined) {
        return null;
    }
    return {
        static_condition: enumSuffix(
            controllableDeviceProgramScheduleBoundary_StaticConditionToJSON,
            boundary.staticCondition,
            "STATIC_CONDITION_",
        ),
        timestamp: boundary.timestamp ? seconds(boundary.timestamp) : null,
        islanding_state: enumSuffix(
            controllableDeviceProgramScheduleBoundary_IslandingStateToJSON,
            boundary.islandingState,
            "ISLANDING_STATE_",
        ),
        state_of_energy: enumSuffix(
            controllableDeviceProgramScheduleBoundary_StateOfEnergyToJSON,
            boundary.stateOfEnergy,
            "STATE_OF_ENERGY_",
        ),
    };
}

function controllableProgram(program: ProtoProgram): ControllableDeviceProgram {
    return {
        key: {
            device_id: program.key?.deviceId ?? "",
            priority: enumSuffix(controllableDeviceProgramKey_PriorityToJSON, program.key?.priority ?? 0, "PRIORITY_"),
        },
        settings: {
            contactor_state: enumSuffix(
                controllableDeviceProgramSettings_ContactorStateToJSON,
                program.settings?.contactorState ?? 0,
                "CONTACTOR_STATE_",
            ),
        },
        schedule: {
            start: programBoundary(program.schedule?.start),
            end: programBoundary(program.schedule?.end),
            expiry: programBoundary(program.schedule?.expiry),
        },
    };
}

function authorizedClient(record: AuthorizationRecord): AuthorizedClientRecord {
    return {
        public_key: base64(record.publicKey),
        state: enumSuffix(authorizedStateToJSON, record.state, "AUTHORIZED_STATE_"),
        type: enumSuffix(authorizedClientTypeToJSON, record.type, "AUTHORIZED_CLIENT_TYPE_"),
        description: record.description,
        key_type: enumSuffix(authorizedKeyTypeToJSON, record.keyType, "AUTHORIZED_KEY_TYPE_"),
        roles: record.roles.map((role: AuthorizationRole) =>
            enumSuffix(authorizationRoleToJSON, role, "AUTHORIZATION_ROLE_"),
        ),
        verification: enumSuffix(authorizedVerificationTypeToJSON, record.verification, "AUTHORIZED_VERIFICATION_TYPE_"),
        added_time: record.addedTime ? seconds(record.addedTime) : null,
        identifier: record.identifier ?? null,
        authorized_by_public_key: record.authorizedByPublicKey ? base64(record.authorizedByPublicKey) : null,
    };
}

export interface PowerwallClientOptions {
    /** The gateway address, optionally `host:port`. */
    host?: string;
    /** The full gateway/Wi-Fi password, or its last 5 characters. */
    gatewayPassword: string;
    /** An RSA key already paired with the gateway through the cloud. */
    rsaPrivateKeyPem: string | Buffer;
    /** Total time allowed per request. */
    timeoutMs?: number;
}

/**
 * Client for a gateway on the LAN, over `/tedapi/v1r` and its REST reads.
 *
 * The connection is not authenticated: like Python, this accepts any
 * certificate, and replies carry no signature. A device on the LAN that can
 * intercept traffic can read the password and forge readings, but it cannot
 * forge a signed command.
 */
export class PowerwallClient {
    // Native private field: the transport holds the password, token and signing key.
    readonly #transport: V1rTransport;
    #din: string | null = null;
    #connecting: Promise<string> | null = null;
    // What `curtail` replaced. Held only here, so it does not survive a restart.
    #savedRealMode: string | null = null;
    #savedReservePercent: number | null = null;
    #curtailmentActive = false;

    /** @throws PowerwallAuthenticationError for a bad PEM or a key that is not RSA. */
    constructor(options: PowerwallClientOptions, _legacyGateway = false) {
        this.#transport = new V1rTransport({
            host: options.host ?? DEFAULT_GATEWAY_HOST,
            password: options.gatewayPassword,
            rsaPrivateKeyPem: options.rsaPrivateKeyPem,
            timeoutMs: options.timeoutMs,
            legacyGateway: _legacyGateway,
        });
    }

    /**
     * A client for an early Gateway 1 unit, which rejects the last-5 login and
     * needs the full `gatewayPassword`. Everything else is the same.
     */
    static legacy_gateway(options: PowerwallClientOptions): PowerwallClient {
        return new PowerwallClient(options, true);
    }

    get host(): string {
        return this.#transport.host;
    }

    /** The gateway DIN, or `null` until `connect` succeeds. */
    get din(): string | null {
        return this.#din;
    }

    /** True between `curtail` and `restore_from_curtailment`. */
    get curtailment_active(): boolean {
        return this.#curtailmentActive;
    }

    /** Log in and fetch the gateway DIN. Idempotent, and concurrent callers share one attempt. */
    connect(): Promise<string> {
        if (this.#din !== null) {
            return Promise.resolve(this.#din);
        }
        this.#connecting ??= (async () => {
            await this.#transport.login();
            this.#din = await this.#transport.fetch_din();
            return this.#din;
        })().finally(() => {
            this.#connecting = null;
        });
        return this.#connecting;
    }

    /** Destroy the idle sockets. */
    close(): void {
        this.#transport.close();
    }

    /** The cached DIN, connecting first if needed. */
    get_din(): Promise<string> {
        return this.connect();
    }

    /** `/api/meters/aggregates`: instantaneous power per location. */
    async get_meters_aggregates(): Promise<Record<string, any>> {
        await this.connect();
        const data = await this.#transport.api_get("/api/meters/aggregates");
        if (!isRecord(data)) {
            throw new PowerwallProtocolError("meters/aggregates payload is not an object");
        }
        return data;
    }

    /** The raw state of charge, where the bottom 5% is an inaccessible buffer. It reads higher than the Tesla app. */
    async get_battery_soe_raw(): Promise<number> {
        await this.connect();
        const data = await this.#transport.api_get("/api/system_status/soe");
        const percentage = isRecord(data) ? Number(data.percentage ?? NaN) : NaN;
        if (Number.isNaN(percentage)) {
            throw new PowerwallProtocolError("Unexpected SoE payload");
        }
        return percentage;
    }

    /** The state of charge the Tesla app and Fleet API show. */
    async get_battery_soe(): Promise<number> {
        return raw_to_scaled_soc(await this.get_battery_soe_raw());
    }

    /** The gateway grid status string, such as `SystemGridConnected`. */
    async get_grid_status(): Promise<string> {
        await this.connect();
        const data = await this.#transport.api_get("/api/system_status/grid_status");
        if (!isRecord(data) || !("grid_status" in data)) {
            throw new PowerwallProtocolError("Unexpected grid_status payload");
        }
        return String(data.grid_status);
    }

    /** The gateway's `config.json`. `battery_blocks` is always present. */
    async get_config(): Promise<ConfigPayload> {
        const din = await this.connect();
        const { blob } = await this._read_config(din);
        const config = decodeConfig(blob);
        config.battery_blocks ??= [];
        return config;
    }

    /** The gateway status, from the narrow DeviceControllerQuery. */
    async get_status(): Promise<StatusPayload> {
        return parseJsonObject(await this._query_graphql(STATUS_QUERY, STATUS_CODE, "{}"), "status");
    }

    /** The extended DeviceControllerQuery payload. */
    async get_device_controller(): Promise<ControllerPayload> {
        const text = await this._query_graphql(CONTROLLER_QUERY, CONTROLLER_CODE, CONTROLLER_VARIABLES);
        return parseJsonObject(text, "device_controller");
    }

    /** Powerwall 3 component data: `pch`, `pws`, `bms`, `hvp` and `baggr`. */
    async get_components(): Promise<ComponentsPayload> {
        const text = await this._query_graphql(COMPONENTS_QUERY, COMPONENTS_CODE, COMPONENTS_VARIABLES);
        return parseJsonObject(text, "components");
    }

    /** Gateway firmware details. Python's `five` and `six` keys are `update_status` and `device_type` here. */
    async get_firmware_details(): Promise<FirmwareDetails> {
        const din = await this.connect();
        const response = await this._post(
            MessageEnvelope.create({ ...localHeader(din), common: { getSystemInfoRequest: {} } }),
            din,
            "firmware",
        );
        const info = response.common?.getSystemInfoResponse ?? CommonAPIGetSystemInfoResponse.create();
        return {
            system: {
                gateway: {
                    partNumber: info.deviceId?.partNumber ?? "",
                    serialNumber: info.deviceId?.serialNumber ?? "",
                },
                din: info.din,
                version: {
                    text: info.firmwareVersion?.version ?? "",
                    githash: info.firmwareVersion?.githash ?? new Uint8Array(),
                },
                update_status: info.systemUpdate?.updateStatus ?? 0,
                device_type: info.deviceType,
                wireless: { device: [] },
            },
        };
    }

    /** The active manual backup and any scheduled backup events. Times are epoch seconds. */
    async get_backup_events(): Promise<BackupEventsPayload> {
        const din = await this.connect();
        const response = await this._send_command_request(
            din,
            { teg: { getBackupEventsRequest: {} } },
            (reply) => reply.teg?.getBackupEventsResponse,
            "get_backup_events_request",
        );
        const events = response.teg?.getBackupEventsResponse;
        const manual = events?.manualBackupEvent;
        const start_time = manual?.schedulingInfo?.startTime ? seconds(manual.schedulingInfo.startTime) : 0;
        const duration_seconds = manual?.schedulingInfo?.durationSeconds ?? 0;
        const end_time = start_time + duration_seconds;
        return {
            manual_backup: manual
                ? {
                      start_time,
                      duration_seconds,
                      end_time,
                      active: Math.floor(Date.now() / 1000) < end_time,
                      priority: manual.schedulingInfo?.priority ?? "0",
                  }
                : null,
            backup_events: (events?.backupEvents ?? []).map((event) => ({
                id: event.id,
                name: event.name,
                start_time: event.schedulingInfo?.startTime ? seconds(event.schedulingInfo.startTime) : 0,
                duration_seconds: event.schedulingInfo?.durationSeconds ?? 0,
                priority: event.schedulingInfo?.priority ?? "0",
            })),
        };
    }

    /**
     * The battery calibration delay counters.
     * @throws PowerwallNotSupportedError on firmware without this command. Powerwall 3 firmware 26.26.4 is one.
     */
    async get_battery_calibration_delay_status(): Promise<BatteryCalibrationDelayStatus> {
        const din = await this.connect();
        const response = await this._send_command_request(
            din,
            { teg: { getDelayBatteryCalibrationStatusRequest: {} } },
            (reply) => reply.teg?.getDelayBatteryCalibrationStatusResponse,
            "get_delay_battery_calibration_status_request",
        );
        const status = response.teg?.getDelayBatteryCalibrationStatusResponse;
        return {
            calibration_delays_left: status?.calibrationDelaysLeft ?? 0,
            calibration_delay_remaining_seconds: status?.calibrationDelayRemainingSeconds ?? 0,
            max_calibration_delays: status?.maxCalibrationDelays ?? 0,
        };
    }

    /**
     * The load programs of Backup Switch and smart breaker devices. A site with
     * none returns two empty lists.
     * @param device_ids The devices to read, or every device when omitted.
     */
    async get_controllable_device_programs(device_ids?: string[]): Promise<ControllableDeviceProgramsPayload> {
        const din = await this.connect();
        const response = await this._send_command_request(
            din,
            { teg: { getControllableDeviceProgramsRequest: { deviceIds: device_ids ?? [] } } },
            (reply) => reply.teg?.getControllableDeviceProgramsResponse,
            "get_controllable_device_programs_request",
        );
        const programs = response.teg?.getControllableDeviceProgramsResponse;
        return {
            active_programs: (programs?.activePrograms ?? []).map(controllableProgram),
            inactive_programs: (programs?.inactivePrograms ?? []).map(controllableProgram),
        };
    }

    /** The keys paired with the gateway, in the gateway's raw form. */
    async list_authorized_clients(): Promise<AuthorizedClientsPayload> {
        const din = await this.connect();
        const response = await this._send_command_request(
            din,
            { authorization: { listAuthorizedClientsRequest: {} } },
            (reply) => reply.authorization?.listAuthorizedClientsResponse,
            "list_authorized_clients_request",
        );
        const clients = response.authorization?.listAuthorizedClientsResponse;
        return {
            clients: (clients?.clients ?? []).map(authorizedClient),
            enable_line_switch_off: clients?.enableLineSwitchOff ?? false,
        };
    }

    /**
     * Patch `config.json`, a read-modify-write. The update carries the hash from
     * the read unchanged: it is an optimistic lock held by the gateway, and the
     * client never computes one.
     * @param updates Dotted paths to values, such as `{"site_info.backup_reserve_percent": 24}`.
     * @throws PowerwallProtocolError on bad JSON, or a reply with no `filestore`.
     */
    async write_config(updates: Record<string, unknown>): Promise<void> {
        const din = await this.connect();
        const { blob, hash } = await this._read_config(din);
        const config = decodeConfig(blob);
        for (const [dottedPath, value] of Object.entries(updates)) {
            applyDottedUpdate(config, dottedPath, value);
        }

        const response = await this._post(
            MessageEnvelope.create({
                ...commandHeader(din),
                filestore: {
                    updateFileRequest: {
                        domain: FileStoreAPIDomain.FILE_STORE_API_DOMAIN_CONFIG_JSON,
                        file: { name: CONFIG_FILE, blob: Buffer.from(JSON.stringify(config), "utf8") },
                        hash,
                    },
                },
            }),
            din,
            "updateFile",
        );
        if (!response.filestore) {
            throw new PowerwallProtocolError("updateFile response missing filestore payload");
        }
    }

    /**
     * Set the backup reserve on the app's 0-100 scale.
     * @throws RangeError outside 0-100.
     */
    async set_backup_reserve(percent: number): Promise<void> {
        await this.write_config({ "site_info.backup_reserve_percent": scaled_to_raw_reserve(percent) });
    }

    /**
     * Write the backup reserve on the gateway's raw scale, where app 0% is raw 5%.
     * @throws RangeError outside 0-100.
     */
    async set_backup_reserve_raw(percent: number): Promise<void> {
        assertPercent(percent, "percent");
        await this.write_config({ "site_info.backup_reserve_percent": percent });
    }

    /**
     * Set the operation mode, as `operation` does through the cloud.
     * @param mode One of `OPERATION_MODES`.
     * @throws RangeError for any other value.
     */
    async set_operation_mode(mode: string): Promise<void> {
        if (!(OPERATION_MODES as readonly string[]).includes(mode)) {
            throw new RangeError(`mode must be one of ${OPERATION_MODES.join(", ")}`);
        }
        await this.write_config({ default_real_mode: mode });
    }

    /**
     * Set `strategy.TOU_mode`, which is local-only: the cloud API does not expose it.
     *
     * The gateway does not validate this field, so a typo silently sets an
     * unrecognized mode. Only `economic` is confirmed in use. The tariff itself
     * lives in the cloud and cannot be set here.
     * @throws RangeError on an empty string.
     */
    async set_tou_mode(mode: string): Promise<void> {
        requireNonEmptyString(mode, "mode");
        await this.write_config({ "strategy.TOU_mode": mode });
    }

    /**
     * Set the export rule, the grid-charging flag, or both in one write. See
     * `set_export_rule` and `set_grid_charging` for one of each.
     * @throws RangeError for an unknown rule.
     * @throws TypeError when given neither.
     */
    async set_grid_import_export(options: {
        customer_preferred_export_rule?: string | null;
        disallow_charge_from_grid_with_solar_installed?: boolean | null;
    }): Promise<void> {
        const { customer_preferred_export_rule: rule, disallow_charge_from_grid_with_solar_installed: disallow } = options;
        const updates: Record<string, unknown> = {};
        if (rule != null) {
            if (!(GRID_EXPORT_RULES as readonly string[]).includes(rule)) {
                throw new RangeError(`customer_preferred_export_rule must be one of ${GRID_EXPORT_RULES.join(", ")}`);
            }
            updates["site_info.customer_preferred_export_rule"] = rule;
        }
        if (disallow != null) {
            updates["site_info.disallow_charge_from_grid_with_solar_installed"] = Boolean(disallow);
        }
        if (Object.keys(updates).length === 0) {
            throw new TypeError(
                "set_grid_import_export requires customer_preferred_export_rule and/or disallow_charge_from_grid_with_solar_installed",
            );
        }
        await this.write_config(updates);
    }

    /**
     * Set the export rule. `net_meter_mode` is independent and does not move.
     * @param rule `battery_ok` exports solar and battery, `pv_only` solar only, `never` nothing.
     * @throws RangeError for any other value.
     */
    async set_export_rule(rule: string): Promise<void> {
        await this.set_grid_import_export({ customer_preferred_export_rule: rule });
    }

    /**
     * Allow or disallow charging from the grid. The gateway stores the inverse
     * flag and drops the key rather than store `false`, so treat an absent key
     * as "allowed".
     */
    async set_grid_charging(enabled: boolean): Promise<void> {
        await this.set_grid_import_export({ disallow_charge_from_grid_with_solar_installed: !enabled });
    }

    /**
     * Enable on-grid solar curtailment. The gateway drops the key rather than
     * store `false`, so treat an absent key as disabled.
     */
    async set_on_grid_solar_curtailment(enabled: boolean): Promise<void> {
        await this.write_config({ "site_info.on_grid_solar_curtailment_enabled": Boolean(enabled) });
    }

    /**
     * Cap grid import, in kilowatts, stored as given.
     * @throws RangeError on a negative value.
     */
    async set_import_limit(kilowatts: number): Promise<void> {
        requireNonNegative(kilowatts, "kilowatts");
        await this.write_config({ "site_info.max_site_meter_power_ac": kilowatts });
    }

    /**
     * Cap grid export, in kilowatts. Pass a positive magnitude: the gateway
     * represents export as negative site-meter power.
     * @throws RangeError on a negative value.
     */
    async set_export_limit(kilowatts: number): Promise<void> {
        requireNonNegative(kilowatts, "kilowatts");
        await this.write_config({ "site_info.min_site_meter_power_ac": kilowatts === 0 ? 0 : -kilowatts });
    }

    /**
     * Stop grid export by switching to `backup` mode at a high reserve. This uses
     * a config write, so no contactor cycles, but it takes about 90 seconds to
     * apply. `restore_from_curtailment` puts back what this replaced.
     * @param options.reserve_percent The reserve during curtailment, on the **raw** scale.
     * @throws RangeError outside 0-100.
     */
    async curtail(options: { reserve_percent?: number } = {}): Promise<void> {
        const { reserve_percent = 100 } = options;
        assertPercent(reserve_percent, "reserve_percent");

        const config = await this.get_config();
        const reserve = lookup(config, "site_info", "backup_reserve_percent");
        const saved = typeof reserve === "string" ? Number(reserve || NaN) : reserve;
        this.#savedRealMode = String(config.default_real_mode || "self_consumption");
        // Keeps a fractional value: Python's `int()` restores a raw 24.75 as 24.
        this.#savedReservePercent = typeof saved === "number" && Number.isFinite(saved) ? saved : OFFSET;

        await this.write_config({
            default_real_mode: "backup",
            "site_info.backup_reserve_percent": reserve_percent,
        });
        this.#curtailmentActive = true;
    }

    /** Write back what `curtail` replaced, or `self_consumption` at a raw 5 if nothing was saved. */
    async restore_from_curtailment(): Promise<void> {
        await this.write_config({
            default_real_mode: this.#savedRealMode ?? "self_consumption",
            "site_info.backup_reserve_percent": this.#savedReservePercent ?? OFFSET,
        });
        this.#curtailmentActive = false;
    }

    /**
     * Schedule a manual "max backup" event that starts now, at maximum priority.
     * The gateway requires any earlier event to be cancelled first, even an
     * expired one, so this sends that cancel before scheduling.
     * @param duration_seconds At least 60.
     * @throws RangeError on a shorter or fractional duration.
     */
    async schedule_max_backup(duration_seconds: number = DEFAULT_BACKUP_DURATION_SECONDS): Promise<void> {
        requireIntegerInRange(duration_seconds, "duration_seconds", MIN_BACKUP_DURATION_SECONDS, MAX_UINT32);
        const din = await this.connect();
        await this._cancel_manual_backup(din);
        await this._send_command_request(
            din,
            {
                teg: {
                    scheduleManualBackupEventRequest: {
                        schedulingInfo: {
                            startTime: new Date(Math.floor(Date.now() / 1000) * 1000),
                            durationSeconds: duration_seconds,
                            priority: MAX_PRIORITY,
                        },
                    },
                },
            },
            (reply) => reply.teg?.scheduleManualBackupEventResponse,
            "schedule_manual_backup_event_request",
        );
    }

    /** Cancel the active manual backup event, if any. */
    async cancel_max_backup(): Promise<void> {
        await this._cancel_manual_backup(await this.connect());
    }

    /**
     * Request a timed battery power setpoint.
     *
     * The gateway holds it for the duration and then returns to its mode by
     * itself. A new call replaces the active setpoint, power and timer both. The
     * reply only acknowledges the request, so read `get_meters_aggregates` to see
     * what the battery does. Keep durations short and renew them: a third party
     * reports a dispatch discharging below reserve and exporting regardless of the
     * export setting. Verified on Powerwall 3 firmware 26.26.4.
     * @param power_watts Positive discharges, negative charges.
     * @param duration_seconds Whole seconds from 1 to 86400.
     * @throws PowerwallCommandError with code 11 above the site limit. The gateway refuses, and does not clamp.
     * @throws PowerwallNotSupportedError on firmware without this command.
     */
    async dispatch_battery_power(power_watts: number, duration_seconds: number): Promise<void> {
        validate_dispatch_battery_power(power_watts, duration_seconds);
        const din = await this.connect();
        await this._send_command_request(
            din,
            {
                teg: {
                    dispatchBatteryPowerRequest: {
                        realPower: { powerWatts: power_watts, durationSeconds: duration_seconds },
                    },
                },
            },
            (reply) => reply.teg?.dispatchBatteryPowerResponse,
            "dispatch_battery_power_request",
        );
    }

    /** Release a `dispatch_battery_power` setpoint. This does not cancel a manual backup event. */
    async resume_battery_operation(): Promise<void> {
        const din = await this.connect();
        await this._send_command_request(
            din,
            { teg: { dispatchBatteryPowerRequest: { resumeDeviceMode: {} } } },
            (reply) => reply.teg?.dispatchBatteryPowerResponse,
            "dispatch_battery_power_request",
        );
    }

    /**
     * Postpone the next battery calibration. Powerwall 3 firmware 26.26.4
     * acknowledges this, but its effect is unverified: that firmware cannot report
     * the delay status.
     * @param delay_hours An integer from 1 to `2^32 - 1`.
     */
    async delay_battery_calibration(delay_hours: number): Promise<void> {
        requireIntegerInRange(delay_hours, "delay_hours", 1, MAX_UINT32);
        const din = await this.connect();
        await this._send_command_request(
            din,
            { teg: { delayBatteryCalibrationRequest: { delayHours: delay_hours } } },
            (reply) => reply.teg?.delayBatteryCalibrationResponse,
            "delay_battery_calibration_request",
        );
    }

    /**
     * Point the gateway at an OCPP central system.
     * @throws PowerwallNotSupportedError on firmware without this command. Powerwall 3 firmware 26.26.4 is one.
     */
    async configure_ocpp(csms_base_url: string): Promise<void> {
        requireNonEmptyString(csms_base_url, "csms_base_url");
        const din = await this.connect();
        await this._send_command_request(
            din,
            { teg: { configureOcppRequest: { csmsBaseUrl: csms_base_url } } },
            (reply) => reply.teg?.configureOcppResponse,
            "configure_ocpp_request",
        );
    }

    /**
     * Revoke a paired key. This needs no presence proof, and any paired key can
     * remove any other. Removing the signing key locks this client out, and
     * pairing it again needs the usual registration and breaker toggle. A success
     * carries no fields, so call `list_authorized_clients` to confirm.
     * @param public_key Raw DER bytes, or base64 as `list_authorized_clients` reports it.
     * @throws RangeError on an empty key.
     */
    async remove_authorized_client(public_key: Uint8Array | string): Promise<void> {
        const publicKey = typeof public_key === "string" ? Buffer.from(public_key, "base64") : public_key;
        if (!(publicKey instanceof Uint8Array)) {
            throw new TypeError("public_key must be bytes or a base64 string");
        }
        if (publicKey.length === 0) {
            throw new RangeError("public_key must not be empty");
        }
        const din = await this.connect();
        await this._send_command_request(
            din,
            { authorization: { removeAuthorizedClientRequest: { publicKey } } },
            (reply) => reply.authorization?.removeAuthorizedClientResponse,
            "remove_authorized_client_request",
            "tolerate",
        );
    }

    private async _cancel_manual_backup(din: string): Promise<void> {
        await this._send_command_request(
            din,
            { teg: { cancelManualBackupEventRequest: {} } },
            (reply) => reply.teg?.cancelManualBackupEventResponse,
            "cancel_manual_backup_event_request",
            "tolerate",
        );
    }

    private async _query_graphql(query: string, code: Uint8Array, variables: string): Promise<string> {
        const din = await this.connect();
        const response = await this._post(
            MessageEnvelope.create({
                ...localHeader(din),
                graphql: {
                    queryRequest: {
                        format: GraphQLQueryFormat.GRAPH_QL_QUERY_FORMAT_SIGNED_SHA256_ECDSA_ASN1,
                        // `code` is Tesla's signature over this exact text.
                        query: SignedGraphQLQuery.encode({ version: 1, query: Buffer.from(query, "utf8") }).finish(),
                        signature: code,
                        variablesJson: variables,
                    },
                },
            }),
            din,
            "query",
        );
        const reply = response.graphql?.queryResponse;
        if (!reply) {
            throw new PowerwallProtocolError("v1r query response missing payload");
        }
        if (!reply.data) {
            throw new PowerwallProtocolError("v1r query response payload is empty");
        }
        return reply.data;
    }

    private async _read_config(din: string): Promise<{ blob: Uint8Array; hash: Uint8Array }> {
        const response = await this._post(
            MessageEnvelope.create({
                ...commandHeader(din),
                filestore: {
                    readFileRequest: { domain: FileStoreAPIDomain.FILE_STORE_API_DOMAIN_CONFIG_JSON, name: CONFIG_FILE },
                },
            }),
            din,
            "FileStore",
        );
        if (!response.filestore) {
            throw new PowerwallProtocolError("FileStore response missing filestore payload");
        }
        const reply = response.filestore.readFileResponse;
        return { blob: reply?.file?.blob ?? new Uint8Array(), hash: reply?.hash ?? new Uint8Array() };
    }

    /** Sign, send once, and decode the reply envelope. */
    private async _post(envelope: MessageEnvelope, din: string, what: string): Promise<MessageEnvelope> {
        return decodeEnvelope(await this.#transport.post_v1r(MessageEnvelope.encode(envelope).finish(), din), what);
    }

    /**
     * The one path for Command-header messages.
     *
     * Python's tolerated calls swallow every error from the POST, so a dead link
     * reports success and a router never fails over. Here the failover-safe errors
     * always propagate.
     * @param din The gateway DIN.
     * @param payload The message's category and request.
     * @param answered Reads the expected response field from a reply.
     * @param request The request's proto field name, for errors.
     * @param missing What to do when the reply lacks the response.
     */
    private async _send_command_request(
        din: string,
        payload: Partial<MessageEnvelope>,
        answered: (reply: MessageEnvelope) => unknown,
        request: string,
        missing: MissingReply = "raise",
    ): Promise<MessageEnvelope> {
        let inner: Uint8Array;
        try {
            inner = await this.#transport.post_v1r(
                MessageEnvelope.encode(MessageEnvelope.create({ ...commandHeader(din), ...payload })).finish(),
                din,
            );
        } catch (error) {
            if (missing === "tolerate" && (error instanceof PowerwallFaultError || error instanceof PowerwallProtocolError)) {
                return MessageEnvelope.create();
            }
            throw error;
        }

        const response = decodeEnvelope(inner, request);
        if (answered(response) !== undefined || missing === "tolerate") {
            return response;
        }
        const status = response.common?.errorResponse?.status;
        if (status) {
            const ErrorClass = status.code === STATUS_UNIMPLEMENTED ? PowerwallNotSupportedError : PowerwallCommandError;
            throw new ErrorClass(request, status.code, status.message);
        }
        throw new PowerwallProtocolError(`${request} reply missing its response`);
    }
}

/**
 * Convert a reserve percentage from the app's scale to the gateway's raw value.
 * @throws RangeError outside 0-100.
 */
export function scaled_to_raw_reserve(percent: number): number {
    return scaledToRaw(percent);
}

/** Convert a raw gateway reserve value to the app's scale. */
export function raw_to_scaled_reserve(percent: number): number {
    return rawToScaled(percent);
}

/**
 * Convert a state of charge from the app's scale to the raw value.
 * @throws RangeError outside 0-100.
 */
export function scaled_to_raw_soc(percent: number): number {
    return scaledToRaw(percent);
}

/** Convert a raw state of charge to the value the Tesla app and Fleet API show. */
export function raw_to_scaled_soc(percent: number): number {
    return rawToScaled(percent);
}

function scaledToRaw(percent: number): number {
    assertPercent(percent, "percent");
    return round4(percent * SCALE + OFFSET);
}

function rawToScaled(percent: number): number {
    return round4((percent - OFFSET) / SCALE);
}

function assertPercent(value: number, name: string): void {
    if (typeof value !== "number") {
        throw new TypeError(`${name} must be a number`);
    }
    if (!(value >= 0 && value <= 100)) {
        throw new RangeError(`${name} must be between 0 and 100`);
    }
}

/** The raw physical state of charge from a status payload, or `null` when either figure is missing or zero. */
export function battery_level_raw(status: StatusPayload): number | null {
    const remaining = Number(lookup(status, "control", "systemStatus", "nominalEnergyRemainingWh") ?? NaN);
    const full = Number(lookup(status, "control", "systemStatus", "nominalFullPackEnergyWh") ?? NaN);
    return remaining && full ? (remaining / full) * 100 : null;
}

/** The state of charge the Tesla app and Fleet API show, from a status payload, or `null`. */
export function battery_level(status: StatusPayload): number | null {
    const raw = battery_level_raw(status);
    return raw === null ? null : raw_to_scaled_soc(raw);
}

/** Real power in watts by upper-case meter location. Malformed aggregates give `{}`. */
export function current_power(status: StatusPayload): Record<string, number | null> {
    const meters = lookup(status, "control", "meterAggregates");
    if (!Array.isArray(meters)) {
        return {};
    }
    return Object.fromEntries(
        meters
            .filter((meter): meter is Record<string, any> => isRecord(meter) && meter.location != null)
            .map((meter) => [String(meter.location).toUpperCase(), meter.realPowerW]),
    );
}

/** Backup runtime in hours at the current load, or `null` when unknown. */
export function backup_time_remaining(status: StatusPayload): number | null {
    const remaining = Number(lookup(status, "control", "systemStatus", "nominalEnergyRemainingWh") ?? NaN);
    const load = current_power(status).LOAD;
    return remaining && typeof load === "number" && load > 0 ? remaining / load : null;
}
