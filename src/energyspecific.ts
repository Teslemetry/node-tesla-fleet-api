import { KeyObject } from "crypto";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import {
    AuthorizedClientKeyType,
    AuthorizedClientType,
    EnergyDeviceIdentifierType,
    EnergyIslandMode,
    TeslaEnergyPeriod,
} from "./const.js";
import Energy from "./energy.js";
import { island_mode_rejection, validate_island_mode } from "./energyisland.js";
import { DeviceUnexpectedResponse, InvalidCommand, SignedCommandRequired } from "./exceptions.js";
import { EnergyDeviceSigner } from "./signing/energy.js";
import { LiveStatusResponse } from "./types/live_status.js";
import { ResponseEnvelope } from "./types/responses.js";
import { SiteInfoResponse } from "./types/site_info.js";

/**
 * The only device commands Tesla's cloud accepts unsigned, as
 * `category.command`: the reads a gateway answers before any key is paired.
 * Unsigned, every other command was refused with HTTP 400 live on a Powerwall 3
 * (2026-10-29), and signed, each one reached the gateway. A site with a signing
 * key signs everything else.
 */
export const UNSIGNED_DEVICE_COMMANDS: ReadonlySet<string> = new Set([
    "common.get_system_info_request",
    "common.get_networking_status_request",
    "authorization.get_signed_commands_public_key_request",
    "authorization.list_authorized_clients_request",
]);

/** Upper bound on a `dispatch_battery_power` setpoint duration (one day). */
export const MAX_DISPATCH_DURATION_SECONDS = 86400;

/**
 * Check `dispatch_battery_power` arguments before any request.
 * @throws TypeError unless both are numbers.
 * @throws RangeError on a non-finite power or a duration that is not a whole number from 1 to `MAX_DISPATCH_DURATION_SECONDS`.
 */
export function validate_dispatch_battery_power(power_watts: number, duration_seconds: number): void {
    if (typeof power_watts !== "number") {
        throw new TypeError("power_watts must be a number");
    }
    if (!Number.isFinite(power_watts)) {
        throw new RangeError("power_watts must be a finite number");
    }
    if (typeof duration_seconds !== "number") {
        throw new TypeError("duration_seconds must be a number");
    }
    if (!Number.isInteger(duration_seconds) || duration_seconds < 1 || duration_seconds > MAX_DISPATCH_DURATION_SECONDS) {
        throw new RangeError(`duration_seconds must be an integer from 1 to ${MAX_DISPATCH_DURATION_SECONDS}`);
    }
}

/** `google.rpc.Code` UNIMPLEMENTED: the gateway firmware has no handler. */
const UNIMPLEMENTED = 12;

/** The `MessageEnvelope` in a `device_command` reply, or `null` for a reply without decodable envelope bytes. */
function replyEnvelope(result: unknown): MessageEnvelope | null {
    const response = (result as { response?: unknown } | null)?.response;
    if (typeof response !== "object" || response === null || Array.isArray(response)) {
        return null;
    }
    const encoded = (response as { message_envelope_as_bytes?: unknown }).message_envelope_as_bytes;
    // `Buffer.from` skips what it cannot read, so strict base64 is checked first.
    if (typeof encoded !== "string" || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
        return null;
    }
    try {
        return MessageEnvelope.decode(Buffer.from(encoded, "base64"));
    } catch {
        return null;
    }
}

/**
 * Raise if a `device_command` reply holds `common.error_response`.
 *
 * The gateway refuses a command inside an HTTP 200 reply, for example code 11
 * (OUT_OF_RANGE) on a dispatch above its power limit. Code 12 raises
 * `InvalidCommand`; any other code raises `DeviceUnexpectedResponse`. Both
 * carry `{code, message}` as `data`. A reply without decodable envelope bytes
 * is left alone.
 */
function _raise_on_error_response(result: unknown): void {
    const error = replyEnvelope(result)?.common?.errorResponse;
    if (error === undefined) {
        return;
    }
    const data = { code: error.status?.code ?? 0, message: error.status?.message ?? "" };
    if (data.code === UNIMPLEMENTED) {
        throw new InvalidCommand(data);
    }
    throw new DeviceUnexpectedResponse(data);
}

/**
 * Raise if a `set_island_mode` reply reports a `REJECTED_*` result, on the same
 * codes as the LAN client. A signed reply carries it in the envelope, and
 * Teslemetry's route decodes that and answers `{ response: { result } }`.
 * @throws DeviceUnexpectedResponse with `{code, message}` as `data`, `message` being the result's name.
 */
export function raise_on_island_rejection(result: unknown): void {
    const reported =
        replyEnvelope(result)?.teg?.setIslandModeResponse?.result ?? (result as { response?: { result?: unknown } } | null)?.response?.result;
    const rejection = island_mode_rejection(reported);
    if (rejection) {
        throw new DeviceUnexpectedResponse({ code: rejection.code, message: rejection.name });
    }
}

/** A public key as the gateway reports it: raw DER bytes are base64-encoded, and a string passes as it is. */
export function publicKeyBase64(public_key: Uint8Array | string): string {
    return typeof public_key === "string" ? public_key : Buffer.from(public_key).toString("base64");
}

/** The `scheduling_info` holding only the given fields, or `null` when none was given. */
export function backupSchedulingInfo(
    start_time?: string | null,
    duration_seconds?: number | null,
    priority?: number | string | null,
): Record<string, string | number> | null {
    const given = Object.entries({ start_time, duration_seconds, priority }).filter(([, value]) => value != null);
    return given.length ? Object.fromEntries(given as [string, string | number][]) : null;
}

// Energy Class
export default class EnergySpecific {
    parent: Energy;
    energy_site_id: number;
    /** Gateway DIN (the energy site's `gateway_id` in `products`), the target of device commands. */
    din?: string;
    // Native private field, like `Commands`'s signing key: unreachable off the instance.
    #signer: EnergyDeviceSigner | null = null;

    /**
     * Pass `private_key` and `din` to send client-signed device commands through
     * the cloud `device_command` endpoint. With a signer, every device command is
     * signed except the four pre-pairing reads in `UNSIGNED_DEVICE_COMMANDS`.
     * Without one, device commands are sent unsigned, and Tesla's cloud refuses
     * most of them with 400.
     * @param parent
     * @param energy_site_id
     * @param private_key RSA key `VERIFIED` on this gateway. Without one the site is unsigned: unlike vehicles, there is no fallback to the parent's key.
     * @param din Gateway DIN (the energy site's `gateway_id` in `products`). Required with `private_key`.
     * @throws TypeError for a key that is not RSA.
     */
    constructor(parent: Energy, energy_site_id: number, private_key?: KeyObject, din?: string) {
        this.parent = parent;
        this.energy_site_id = energy_site_id;
        this.din = din;
        if (private_key != null) {
            if (!din) {
                throw new Error("A signing private_key requires the gateway din.");
            }
            this.#signer = new EnergyDeviceSigner(private_key);
        }
    }

    /** Whether device commands are signed with a client key. */
    get signing(): boolean {
        return this.#signer !== null;
    }

    /**
     * Send a gRPC command to the energy device gateway.
     *
     * With a signing key, this signs every command except the ones in
     * `UNSIGNED_DEVICE_COMMANDS`. Otherwise it sends the unsigned `grpc_command`.
     * Energy device gRPC commands are based on research from
     * https://github.com/jasonacox/pypowerwall (MIT licensed).
     */
    async _command(
        category: string,
        command: string,
        params?: Record<string, any> | null,
        identifier_type: EnergyDeviceIdentifierType = EnergyDeviceIdentifierType.GATEWAY_DIN,
    ): Promise<Record<string, any>> {
        if (this.#signer !== null && !UNSIGNED_DEVICE_COMMANDS.has(`${category}.${command}`)) {
            return this._signed_command(category, command, params);
        }
        return this._unsigned_command(category, command, params, identifier_type);
    }

    /** Send an unsigned `grpc_command` to the energy device gateway. */
    async _unsigned_command(
        category: string,
        command: string,
        params?: Record<string, any> | null,
        identifier_type: EnergyDeviceIdentifierType = EnergyDeviceIdentifierType.GATEWAY_DIN,
    ): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/command`, null, {
            command_type: "grpc_command",
            command_properties: {
                message: { [category]: { [command]: params ?? {} } },
                identifier_type,
            },
        });
    }

    /** Build the flat `device_command` body around a signed message. */
    protected _device_command_body(
        routable_message: Uint8Array,
        target_id: string,
        identifier_type: EnergyDeviceIdentifierType,
    ): Record<string, any> {
        return {
            identifier_type,
            routable_message: Buffer.from(routable_message).toString("base64"),
            target_id,
        };
    }

    /**
     * Send a signed `RoutableMessage` to the energy device. Tesla requires the
     * body wrapped in `data` and `identifier_type` as an integer. The reply is
     * returned unchanged; `_signed_command` checks it for a gateway error.
     */
    async _device_command(
        routable_message: Uint8Array,
        target_id: string,
        identifier_type: EnergyDeviceIdentifierType = EnergyDeviceIdentifierType.GATEWAY_DIN,
    ): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/device_command`, null, {
            data: this._device_command_body(routable_message, target_id, identifier_type),
        });
    }

    /**
     * Sign a gRPC command with the site's key and send it to the gateway.
     *
     * A resend of the same signed bytes inside the TTL executes again, so this
     * never retries.
     * @throws SignedCommandRequired when the site has no signing key.
     * @throws InvalidCommand when the gateway firmware has no handler for the command.
     * @throws DeviceUnexpectedResponse when the gateway refuses the command.
     */
    async _signed_command(
        category: string,
        command: string,
        params?: Record<string, any> | null,
    ): Promise<Record<string, any>> {
        const signer = this.#signer;
        const din = this.din;
        if (signer === null || din === undefined) {
            throw new SignedCommandRequired();
        }
        const envelope = EnergyDeviceSigner.envelope(din, category, command, params);
        const routable_message = await signer.sign(envelope, din);
        const result = await this._device_command(routable_message, din);
        _raise_on_error_response(result);
        return result;
    }

    /** Get energy device system information including firmware version, device type, part number, serial number, and DIN. */
    async get_system_info(): Promise<Record<string, any>> {
        return this._command("common", "get_system_info_request");
    }

    /** Get raw energy device networking status including WiFi, Ethernet, and cellular connectivity. */
    async raw_networking_status(): Promise<Record<string, any>> {
        return this._command("common", "get_networking_status_request");
    }

    /** Get energy device networking status including WiFi, Ethernet, and cellular connectivity. */
    async get_networking_status(): Promise<Record<string, any>> {
        const result = await this.raw_networking_status();
        return result.response?.message?.Payload?.Common?.Message?.GetNetworkingStatusResponse ?? {};
    }

    /** Scan for available WiFi networks from the energy gateway. */
    async wifi_scan(): Promise<Record<string, any>> {
        return this._command("common", "wifi_scan_request");
    }

    /** Get the energy device certificate including subject, issuer, and validity. */
    async get_device_cert(): Promise<Record<string, any>> {
        return this._command("common", "device_cert_request");
    }

    /** Get cellular modem information from the energy gateway including the embedded SIM identifier (EID) and supported cellular profiles. */
    async get_cellular_info(): Promise<Record<string, any>> {
        return this._command("common", "get_cellular_info_request");
    }

    /** Check if a firmware update is available for the energy gateway. */
    async check_for_update(): Promise<Record<string, any>> {
        return this._command("common", "check_for_update_request");
    }

    /** Check the urgency level of any available firmware update for the energy gateway. */
    async check_for_update_urgency(): Promise<Record<string, any>> {
        return this._command("common", "check_for_update_urgency_request");
    }

    /** Test internet connectivity on the energy gateway across all network interfaces (WiFi, Ethernet, GSM). */
    async check_internet(): Promise<Record<string, any>> {
        return this._command("common", "check_internet_request");
    }

    /**
     * Update local site configuration on the energy gateway. This writes gateway
     * configuration and is an undocumented energy device gRPC command.
     * @param params Raw protobuf request fields.
     */
    async set_local_site_config(params?: Record<string, any> | null): Promise<Record<string, any>> {
        return this._command("common", "set_local_site_config_request", params);
    }

    /** List authorized clients (paired keys) on the energy gateway including their roles and state. */
    async list_authorized_clients(): Promise<Record<string, any>> {
        return this._command("authorization", "list_authorized_clients_request");
    }

    /**
     * Register an authorized client (public key) with the energy gateway, to
     * pair a local key with a Powerwall for the LAN TEDapi v1r protocol. The
     * encoding follows `key_type`: RSA is raw PKCS#1 `RSAPublicKey` DER
     * (`rsa_public_der_pkcs1`), and ECC is DER SubjectPublicKeyInfo
     * (`ec_public_der_spki`), not a raw point, which the gateway rejects. A
     * VERIFIED ECC key still cannot sign v1r: `SignatureData` has no ECDSA member.
     *
     * The key stays PENDING_VERIFICATION until a physical breaker toggle confirms
     * it inside a window of about 9 minutes. A missed window is the terminal
     * PENDING_VERIFICATION_TIMEOUT; registering the same key again resets it
     * without a second record.
     * @param public_key Raw DER bytes, which are base64-encoded, or an already base64-encoded string.
     * @param description Human-readable description of the client.
     * @param key_type The type of key being registered.
     * @param authorized_client_type The authorized client type.
     */
    async add_authorized_client(
        public_key: Uint8Array | string,
        description: string = "Powerwall LAN Client",
        key_type: AuthorizedClientKeyType = AuthorizedClientKeyType.RSA,
        authorized_client_type: AuthorizedClientType = AuthorizedClientType.CUSTOMER_MOBILE_APP,
    ): Promise<Record<string, any>> {
        return this._command("authorization", "add_authorized_client_request", {
            key_type,
            public_key: publicKeyBase64(public_key),
            // The signed envelope is parsed against the proto, which names this field `type`.
            [this.signing ? "type" : "authorized_client_type"]: authorized_client_type,
            description,
        });
    }

    /**
     * Remove an authorized client (public key) from the energy gateway. Removal
     * needs no physical presence proof, so any paired key can revoke every other
     * key, including the owner's. The reply is empty, and some firmware may
     * return no body at all. This cloud route is inferred from
     * `add_authorized_client`; removal was only live-verified over local v1r.
     * @param public_key Raw DER bytes, which are base64-encoded, or an already base64-encoded string as `list_authorized_clients` reports it.
     */
    async remove_authorized_client(public_key: Uint8Array | string): Promise<Record<string, any>> {
        return this._command("authorization", "remove_authorized_client_request", {
            public_key: publicKeyBase64(public_key),
        });
    }

    /** Get the energy gateway's public key for signed commands. */
    async get_signed_commands_public_key(): Promise<Record<string, any>> {
        return this._command("authorization", "get_signed_commands_public_key_request");
    }

    /** Get backup events from the energy gateway. May time out on some firmware versions. */
    async get_backup_events(): Promise<Record<string, any>> {
        return this._command("teg", "get_backup_events_request");
    }

    /**
     * Schedule a manual backup event on the energy gateway.
     * @param start_time ISO 8601 timestamp for when the backup event should start.
     * @param duration_seconds Duration of the backup event in seconds.
     * @param priority Priority level for the backup event. A string carries values beyond 2^53.
     */
    async schedule_backup_event(
        start_time?: string | null,
        duration_seconds?: number | null,
        priority?: number | string | null,
    ): Promise<Record<string, any>> {
        const scheduling_info = backupSchedulingInfo(start_time, duration_seconds, priority);
        return this._command(
            "teg",
            "schedule_manual_backup_event_request",
            scheduling_info ? { scheduling_info } : null,
        );
    }

    /** Cancel a scheduled manual backup event on the energy gateway. */
    async cancel_backup_event(): Promise<Record<string, any>> {
        return this._command("teg", "cancel_manual_backup_event_request");
    }

    /** Get Tesla Energy Gateway configuration from the TEG service. */
    async get_teg_config(): Promise<Record<string, any>> {
        return this._command("teg", "get_config_request");
    }

    /**
     * Request a timed battery power setpoint on the energy gateway.
     *
     * The gateway holds the setpoint for `duration_seconds`, then returns to its
     * configured operating mode by itself. A new call replaces an active
     * setpoint. Keep durations short and re-send to renew, so a caller that stops
     * cannot leave the battery on a stale setpoint.
     *
     * The reply is an empty acknowledgement, not readback. A setpoint was seen to
     * discharge below the backup reserve and to export with export set to
     * `pv_only` or `never`. The gateway refuses a request above its power limit
     * rather than clamping it: the signed path raises `DeviceUnexpectedResponse`
     * with code 11.
     *
     * Tesla's cloud refuses this command unsigned (HTTP 400), so it acts only on
     * a site with a signing key.
     * @param power_watts Battery power in watts: positive discharges, negative charges.
     * @param duration_seconds Whole seconds from 1 to 86400.
     * @throws RangeError or TypeError before any request on invalid arguments.
     */
    async dispatch_battery_power(power_watts: number, duration_seconds: number): Promise<Record<string, any>> {
        validate_dispatch_battery_power(power_watts, duration_seconds);
        return this._command("teg", "dispatch_battery_power_request", {
            real_power: { power_watts, duration_seconds },
        });
    }

    /**
     * Release a `dispatch_battery_power` setpoint, returning the gateway to its
     * configured operating mode. The gateway also acknowledges this when no
     * setpoint is active. It acts only on a site with a signing key.
     */
    async resume_battery_operation(): Promise<Record<string, any>> {
        return this._command("teg", "dispatch_battery_power_request", { resume_device_mode: {} });
    }

    /**
     * Set the island mode on the energy gateway.
     *
     * Signed only: gateways acknowledge the unsigned `grpc_command` without
     * operating the grid contactor, so this never sends one. A success-shaped
     * reply still does not prove the contactor moved: confirm `island_status`
     * with a status read before relying on it.
     * @param mode `EnergyIslandMode.OFF_GRID` (6) or `ON_GRID` (1).
     * @param force Sent when given. Some gateways need `true` to open the contactor.
     * @throws TypeError on any other mode, before signing.
     * @throws SignedCommandRequired without a signing key, before any request.
     * @throws DeviceUnexpectedResponse when the gateway refuses, as `REJECTED_LOW_ENERGY` and the like.
     */
    async set_island_mode(mode: EnergyIslandMode | number, force?: boolean | null): Promise<Record<string, any>> {
        validate_island_mode(mode, force);
        const result = await this._signed_command("teg", "set_island_mode_request", force == null ? { mode } : { mode, force });
        raise_on_island_rejection(result);
        return result;
    }

    /** Request off-grid mode, with `force`. Signed only: see `set_island_mode`. */
    async go_off_grid(): Promise<Record<string, any>> {
        return this.set_island_mode(EnergyIslandMode.OFF_GRID, true);
    }

    /** Request on-grid mode. Signed only: see `set_island_mode`. */
    async reconnect_grid(): Promise<Record<string, any>> {
        return this.set_island_mode(EnergyIslandMode.ON_GRID);
    }

    /**
     * Adjust the site's backup reserve.
     * @param backup_reserve_percent The desired backup reserve percent.
     * @returns
     */
    async backup(backup_reserve_percent: number): Promise<Record<string, any>> {
        return this.parent.backup(this.energy_site_id, backup_reserve_percent);
    }

    /**
     * Returns the backup (off-grid) event history of the site in duration of seconds.
     * @param period Period of the window to retrieve backup events. This can be day, week, month, year, lifetime and should align with the window requested.
     * @param start_date Start date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async backup_history(
        period: TeslaEnergyPeriod | string | null,
        start_date?: string | null,
        end_date?: string | null,
        time_zone?: string | null,
    ): Promise<Record<string, any>> {
        return this.parent.backup_history(this.energy_site_id, period, start_date, end_date, time_zone);
    }

    /**
     * Returns the charging history of a wall connector.
     * @param start_date Start date of the window to retrieve charging events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve charging events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async charge_history(start_date: string, end_date: string, time_zone?: string | null): Promise<Record<string, any>> {
        return this.parent.charge_history(this.energy_site_id, start_date, end_date, time_zone);
    }

    /**
     * Returns the energy measurements of the site, aggregated to the requested period.
     * @param period Period of the window to retrieve energy measurements. This can be day, week, month, year, lifetime and should align with the window requested.
     * @param start_date Start date of the window to retrieve energy measurements in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve energy measurements in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async energy_history(
        period: TeslaEnergyPeriod | string | null,
        start_date?: string | null,
        end_date?: string | null,
        time_zone?: string | null,
    ): Promise<Record<string, any>> {
        return this.parent.energy_history(this.energy_site_id, period, start_date, end_date, time_zone);
    }

    /**
     * Allow/disallow charging from the grid and exporting energy to the grid.
     * @param disallow_charge_from_grid_with_solar_installed The desired behavior towards importing from the grid. Charging from the grid is disabled when set to true and enabled when set to false.
     * @param customer_preferred_export_rule The desired behavior for grid exporting. The available options are battery_ok, pv_only, and never.
     * @returns
     */
    async grid_import_export(
        disallow_charge_from_grid_with_solar_installed: boolean | null = null,
        customer_preferred_export_rule: string | null = null
    ): Promise<Record<string, any>> {
        return this.parent.grid_import_export(this.energy_site_id, disallow_charge_from_grid_with_solar_installed, customer_preferred_export_rule);
    }

    /**
     * Returns the live status of the site.
     * @returns
     */
    async live_status(): Promise<ResponseEnvelope<LiveStatusResponse>> {
        return this.parent.live_status(this.energy_site_id);
    }

    /**
     * Adjust the site's off-grid vehicle charging backup reserve.
     * @param off_grid_vehicle_charging_reserve_percent The desired off grid vehicle charging reserve percent.
     * @returns
     */
    async off_grid_vehicle_charging_reserve(off_grid_vehicle_charging_reserve_percent: number): Promise<Record<string, any>> {
        return this.parent.off_grid_vehicle_charging_reserve(this.energy_site_id, off_grid_vehicle_charging_reserve_percent);
    }

    /**
     * Set the site's mode.
     * @param default_real_mode
     * @returns
     */
    async operation(default_real_mode: string): Promise<Record<string, any>> {
        return this.parent.operation(this.energy_site_id, default_real_mode);
    }

    /**
     * Returns information about the site. Things like assets (has solar, etc), settings (backup reserve, etc), and features (storm_mode_capable, etc).
     */
    async site_info(): Promise<ResponseEnvelope<SiteInfoResponse>> {
        return this.parent.site_info(this.energy_site_id);
    }

    /**
     * Update storm watch participation.
     * @param enabled The storm mode participation value to set.
     * @returns
     */
    async storm_mode(enabled: boolean): Promise<Record<string, any>> {
        return this.parent.storm_mode(this.energy_site_id, enabled);
    }

    /**
     * Update the time of use settings for the energy site.
     * @param settings The `tariff_content_v2` document.
     * @returns
     */
    async time_of_use_settings(settings: Record<string, any>): Promise<Record<string, any>> {
        return this.parent.parent._request(
            "POST",
            `api/1/energy_sites/${this.energy_site_id}/time_of_use_settings`,
            null,
            { tou_settings: { tariff_content_v2: settings } },
        );
    }
}
