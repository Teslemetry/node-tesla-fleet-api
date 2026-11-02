import { KeyObject } from "crypto";
import {
    AuthorizedClientKeyType,
    AuthorizedClientType,
    EnergyDeviceIdentifierType,
    EnergyIslandMode,
} from "./const.js";
import Energy from "./energy.js";
import { AuthorizedClients, parse_authorized_clients, parse_gateway_address } from "./energyparsers.js";
import EnergySpecific, {
    backupSchedulingInfo,
    publicKeyBase64,
    validate_dispatch_battery_power,
} from "./energyspecific.js";

export { parse_authorized_clients, parse_gateway_address };
export type { AuthorizedClient, AuthorizedClients } from "./energyparsers.js";

/**
 * Teslemetry's energy site.
 *
 * With a signing key (see `EnergySpecific`), every device command except the
 * four pre-pairing reads is signed with that key and sent through Teslemetry's
 * `device_command` route. Without a key, a command uses its Teslemetry route.
 * The `set_island_mode`, `backup_events` and `config` routes sign with
 * Teslemetry's own key, which must be verified on the gateway, or the route
 * answers 409 `energy_site_not_paired` and sends nothing. As of 2026-10-29 the
 * `dispatch_battery_power`, `resume_battery_operation` and backup-event
 * schedule and cancel routes still send unsigned, so Tesla answers HTTP 400:
 * keyless dispatch does not work until Teslemetry signs those routes.
 */
export class TeslemetryEnergySite extends EnergySpecific {
    /** Send a signed `RoutableMessage` through Teslemetry's route, which takes the flat body and adds Tesla's `data` wrapper itself. */
    override async _device_command(
        routable_message: Uint8Array,
        target_id: string,
        identifier_type: EnergyDeviceIdentifierType = EnergyDeviceIdentifierType.GATEWAY_DIN,
    ): Promise<Record<string, any>> {
        return this.parent.parent._request(
            "POST",
            `api/1/energy_sites/${this.energy_site_id}/device_command`,
            null,
            this._device_command_body(routable_message, target_id, identifier_type),
        );
    }

    /** `GET` a Teslemetry command route. */
    protected async _get_route(route: string): Promise<any> {
        return this.parent.parent._request("GET", `api/1/energy_sites/${this.energy_site_id}/command/${route}`);
    }

    /** `POST` to a Teslemetry command route. */
    protected async _post_route(route: string, json: Record<string, any> | null = null): Promise<any> {
        return this.parent.parent._request(
            "POST",
            `api/1/energy_sites/${this.energy_site_id}/command/${route}`,
            null,
            json,
        );
    }

    /**
     * Set the island mode on the energy gateway. With a signing key this signs
     * the command with that key. Without one it calls the Teslemetry route, which
     * signs it with Teslemetry's key. See `EnergySpecific.set_island_mode`.
     */
    override async set_island_mode(
        mode: EnergyIslandMode | number,
        force?: boolean | null,
    ): Promise<Record<string, any>> {
        if (this.signing) {
            return super.set_island_mode(mode, force);
        }
        return this._post_route("set_island_mode", force == null ? { mode } : { mode, force });
    }

    /** Get backup events. Without a signing key, the Teslemetry route signs with Teslemetry's key. */
    override async get_backup_events(): Promise<Record<string, any>> {
        return this.signing ? super.get_backup_events() : this._get_route("backup_events");
    }

    /** Get the TEG configuration. Without a signing key, the Teslemetry route signs with Teslemetry's key. */
    override async get_teg_config(): Promise<Record<string, any>> {
        return this.signing ? super.get_teg_config() : this._get_route("config");
    }

    /** Get energy device system information. A pre-pairing read: never signed, even with a key. */
    override async get_system_info(): Promise<Record<string, any>> {
        return this._get_route("system_info");
    }

    /** Get networking status, which Teslemetry returns already unwrapped. A pre-pairing read: never signed, even with a key. */
    override async raw_networking_status(): Promise<Record<string, any>> {
        return this._get_route("networking_status");
    }

    /** Scan for WiFi networks on the energy gateway. */
    override async wifi_scan(): Promise<Record<string, any>> {
        return this.signing ? super.wifi_scan() : this._get_route("wifi_scan");
    }

    /** Get the energy device certificate. */
    override async get_device_cert(): Promise<Record<string, any>> {
        return this.signing ? super.get_device_cert() : this._get_route("device_cert");
    }

    /** Get cellular modem information. Without a signing key, the Teslemetry route signs with Teslemetry's key. */
    override async get_cellular_info(): Promise<Record<string, any>> {
        return this.signing ? super.get_cellular_info() : this._get_route("cellular_info");
    }

    /** Check for a firmware update. Without a signing key, the Teslemetry route signs with Teslemetry's key. */
    override async check_for_update(): Promise<Record<string, any>> {
        return this.signing ? super.check_for_update() : this._get_route("check_for_update");
    }

    /** Check the urgency of any firmware update. Without a signing key, the Teslemetry route signs with Teslemetry's key. */
    override async check_for_update_urgency(): Promise<Record<string, any>> {
        return this.signing ? super.check_for_update_urgency() : this._get_route("check_for_update_urgency");
    }

    /** Test internet connectivity on the energy gateway. Without a signing key, the Teslemetry route signs with Teslemetry's key. */
    override async check_internet(): Promise<Record<string, any>> {
        return this.signing ? super.check_internet() : this._get_route("check_internet");
    }

    /**
     * Update local site configuration on the energy gateway. This writes gateway
     * configuration and is an undocumented energy device gRPC command.
     * @param params Raw protobuf request fields.
     */
    override async set_local_site_config(params?: Record<string, any> | null): Promise<Record<string, any>> {
        return this.signing ? super.set_local_site_config(params) : this._post_route("set_local_site_config", params ?? {});
    }

    /** Get the gateway's signed commands public key. A pre-pairing read: never signed, even with a key. */
    override async get_signed_commands_public_key(): Promise<Record<string, any>> {
        return this._get_route("signed_commands_public_key");
    }

    /**
     * Schedule a manual backup event on the energy gateway.
     * @param start_time ISO 8601 timestamp for when the backup event should start.
     * @param duration_seconds Duration of the backup event in seconds.
     * @param priority Priority level for the backup event. A string carries values beyond 2^53.
     */
    override async schedule_backup_event(
        start_time?: string | null,
        duration_seconds?: number | null,
        priority?: number | string | null,
    ): Promise<Record<string, any>> {
        if (this.signing) {
            return super.schedule_backup_event(start_time, duration_seconds, priority);
        }
        const scheduling_info = backupSchedulingInfo(start_time, duration_seconds, priority);
        return this._post_route("schedule_backup_event", scheduling_info ? { scheduling_info } : {});
    }

    /** Cancel a scheduled backup event on the energy gateway. */
    override async cancel_backup_event(): Promise<Record<string, any>> {
        return this.signing ? super.cancel_backup_event() : this._post_route("cancel_backup_event", {});
    }

    /**
     * Register an authorized client with the energy gateway. All arguments are
     * optional: if omitted, the Teslemetry server fills in its own key details. A
     * site with a signing key signs the request with that key when `public_key`
     * is given. Without a public key the route registers Teslemetry's own key,
     * which the client key cannot sign for.
     * @param public_key Raw DER bytes in the encoding matching `key_type` (RSA PKCS#1 or ECC SPKI), which are base64-encoded, or an already base64-encoded string.
     * @param description Human-readable description of the client.
     * @param key_type The type of key being registered.
     * @param authorized_client_type The authorized client type.
     */
    override async add_authorized_client(
        public_key?: Uint8Array | string | null,
        description?: string | null,
        key_type?: AuthorizedClientKeyType | null,
        authorized_client_type?: AuthorizedClientType | null,
    ): Promise<Record<string, any>> {
        if (this.signing && public_key != null) {
            return super.add_authorized_client(
                public_key,
                description ?? undefined,
                key_type ?? undefined,
                authorized_client_type ?? undefined,
            );
        }
        return this._post_route("add_authorized_client", {
            public_key: public_key == null ? null : publicKeyBase64(public_key),
            description,
            key_type,
            authorized_client_type,
        });
    }

    /** Get networking status from the gateway's Teslemetry route, including WiFi, Ethernet, and cellular details. */
    override async get_networking_status(): Promise<Record<string, any>> {
        return this._get_route("networking_status");
    }

    /**
     * Discover the gateway's LAN IPv4 address, for pre-filling a local control
     * host. See `parse_gateway_address` for the selection rule.
     * @returns The address, or `null` when the reply is well-formed but no interface yields one.
     * @throws InvalidResponse on a null body or an unrecognized reply.
     * @throws EnergyGatewayUnreachable when Teslemetry cannot reach the gateway.
     */
    async find_gateway_address(): Promise<string | null> {
        return parse_gateway_address(await this.get_networking_status());
    }

    /**
     * List authorized clients on the energy gateway. Teslemetry may return JSON
     * `null` when no payload is available; that value is returned unchanged.
     */
    override async list_authorized_clients(): Promise<Record<string, any>> {
        return this._get_route("authorized_clients");
    }

    /**
     * List authorized clients on the energy gateway, parsed into a typed result.
     * For the unparsed reply, use `list_authorized_clients`.
     * @throws InvalidResponse on a null body or an unrecognized reply, rather than treating either as "no clients".
     */
    async find_authorized_clients(): Promise<AuthorizedClients> {
        return parse_authorized_clients(await this.list_authorized_clients());
    }

    /**
     * Remove an authorized client from the energy gateway. A site with a signing
     * key signs the request with that key. Removal needs no physical presence
     * proof, so any paired key can revoke every other key, including the owner's.
     * @param public_key Raw DER bytes, which are base64-encoded, or an already base64-encoded string as `list_authorized_clients` reports it.
     */
    override async remove_authorized_client(public_key: Uint8Array | string): Promise<Record<string, any>> {
        if (this.signing) {
            return super.remove_authorized_client(public_key);
        }
        return this._post_route("remove_authorized_client", { public_key: publicKeyBase64(public_key) });
    }

    /**
     * Request a timed battery power setpoint on the energy gateway. Without a
     * signing key the Teslemetry route still sends unsigned and gets Tesla's HTTP
     * 400 (2026-10-29). See `EnergySpecific.dispatch_battery_power`.
     * @param power_watts Battery power in watts: positive discharges, negative charges.
     * @param duration_seconds Whole seconds from 1 to 86400.
     */
    override async dispatch_battery_power(power_watts: number, duration_seconds: number): Promise<Record<string, any>> {
        if (this.signing) {
            return super.dispatch_battery_power(power_watts, duration_seconds);
        }
        validate_dispatch_battery_power(power_watts, duration_seconds);
        return this._post_route("dispatch_battery_power", { power_watts, duration_seconds });
    }

    /**
     * Release a `dispatch_battery_power` setpoint. Without a signing key the
     * Teslemetry route still sends unsigned and gets Tesla's HTTP 400 (2026-10-29).
     */
    override async resume_battery_operation(): Promise<Record<string, any>> {
        return this.signing ? super.resume_battery_operation() : this._post_route("resume_battery_operation");
    }
}

/** Creates and holds Teslemetry energy sites. */
export class TeslemetryEnergySites extends Energy {
    static override Site = TeslemetryEnergySite;

    override create(energy_site_id: number, private_key?: KeyObject | false, din?: string): TeslemetryEnergySite {
        return super.create(energy_site_id, private_key, din) as TeslemetryEnergySite;
    }
}
