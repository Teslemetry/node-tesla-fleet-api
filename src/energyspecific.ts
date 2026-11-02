import { KeyObject } from "crypto";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { EnergyDeviceIdentifierType, TeslaEnergyPeriod } from "./const.js";
import Energy from "./energy.js";
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

/** `google.rpc.Code` UNIMPLEMENTED: the gateway firmware has no handler. */
const UNIMPLEMENTED = 12;

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
    const response = (result as { response?: unknown } | null)?.response;
    if (typeof response !== "object" || response === null || Array.isArray(response)) {
        return;
    }
    const encoded = (response as { message_envelope_as_bytes?: unknown }).message_envelope_as_bytes;
    // `Buffer.from` skips what it cannot read, so strict base64 is checked first.
    if (typeof encoded !== "string" || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
        return;
    }
    let envelope: MessageEnvelope;
    try {
        envelope = MessageEnvelope.decode(Buffer.from(encoded, "base64"));
    } catch {
        return;
    }
    const error = envelope.common?.errorResponse;
    if (error === undefined) {
        return;
    }
    const data = { code: error.status?.code ?? 0, message: error.status?.message ?? "" };
    if (data.code === UNIMPLEMENTED) {
        throw new InvalidCommand(data);
    }
    throw new DeviceUnexpectedResponse(data);
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
     * @param private_key RSA key `VERIFIED` on this gateway. `undefined` falls back to the parent's `rsa_private_key`, and `false` disables signing.
     * @param din Gateway DIN (the energy site's `gateway_id` in `products`). Without it a fallback key cannot sign, so the site stays unsigned.
     * @throws TypeError for a key that is not RSA.
     */
    constructor(parent: Energy, energy_site_id: number, private_key?: KeyObject | false, din?: string) {
        if (private_key !== undefined && private_key !== false && !din) {
            throw new Error("A signing private_key requires the gateway din.");
        }
        this.parent = parent;
        this.energy_site_id = energy_site_id;
        this.din = din;
        const key = private_key === undefined ? parent.parent.rsa_private_key : private_key;
        if (key !== false && key !== null && din) {
            this.#signer = new EnergyDeviceSigner(key);
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
