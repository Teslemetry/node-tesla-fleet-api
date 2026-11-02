import { KeyObject } from "crypto";
import {
    AuthorizedClientKeyType,
    AuthorizedClientState,
    AuthorizedClientType,
    EnergyDeviceIdentifierType,
    EnergyIslandMode,
} from "./const.js";
import Energy from "./energy.js";
import { validate_island_mode } from "./energyisland.js";
import { AuthorizedClient, AuthorizedClients, parse_authorized_clients, parse_gateway_address } from "./energyparsers.js";
import EnergySpecific, {
    backupSchedulingInfo,
    publicKeyBase64,
    raise_on_island_rejection,
    validate_dispatch_battery_power,
} from "./energyspecific.js";
import { AuthorizedClientPairingTimedOut, AuthorizedClientWaitExpired } from "./exceptions.js";

export { parse_authorized_clients, parse_gateway_address };
export type { AuthorizedClient, AuthorizedClients } from "./energyparsers.js";

/** Default overall bound on `wait_until_paired`, in milliseconds. */
export const DEFAULT_PAIRING_TIMEOUT = 600_000;
/** Default delay between `wait_until_paired` polls, in milliseconds. */
export const DEFAULT_PAIRING_POLL_INTERVAL = 5_000;

const EXPIRED = Symbol("expired");

/**
 * Settle as `step` does, or resolve `EXPIRED` after `ms`, or reject with the
 * signal's reason. JavaScript cannot cancel `step`, so one that outlives this
 * is abandoned, and its late rejection stays handled here.
 */
function settleWithin<T>(step: () => Promise<T>, ms: number, signal?: AbortSignal): Promise<T | typeof EXPIRED> {
    return new Promise((resolve, reject) => {
        const finish = (settle: () => void) => {
            clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
            settle();
        };
        const onAbort = () => finish(() => reject(signal?.reason));
        const timer = setTimeout(() => finish(() => resolve(EXPIRED)), ms);
        signal?.addEventListener("abort", onAbort, { once: true });
        Promise.resolve()
            .then(step)
            .then(
                (value) => finish(() => resolve(value)),
                (error: unknown) => finish(() => reject(error)),
            );
    });
}

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
        validate_island_mode(mode, force);
        if (this.signing) {
            return super.set_island_mode(mode, force);
        }
        const result = await this._post_route("set_island_mode", force == null ? { mode } : { mode, force });
        raise_on_island_rejection(result);
        return result;
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

    /**
     * Wait for a key already registered with `add_authorized_client` to finish
     * pairing, polling `find_authorized_clients` until its entry is `VERIFIED`.
     *
     * The gateway's presence-proof window is about 9 minutes, and a breaker toggle
     * confirmed a key in as little as 59 s, with no cloud auto-verify observed.
     * A poll that fails counts as no signal.
     * @param public_key The key as passed to `add_authorized_client`, raw DER bytes or base64.
     * @param options.verify_by_use A signed local read. Once the cloud reports `VERIFIED`, one successful call confirms the key is usable. A failure means "not yet" and polling continues, because `VERIFIED` can be seen slightly ahead of local usability.
     * @param options.timeout_ms Overall bound on the wait.
     * @param options.poll_interval_ms Delay between polls.
     * @param options.signal Aborting rejects with the signal's reason. An in-flight call is abandoned, not cancelled.
     * @returns The matched entry, once paired and confirmed.
     * @throws AuthorizedClientPairingTimedOut at once on `PENDING_VERIFICATION_TIMEOUT`. The registration is dead: call `add_authorized_client` again with the same key, which resets the window, then wait again.
     * @throws AuthorizedClientWaitExpired when `timeout_ms` elapses first. The registration is still alive: wait again.
     */
    async wait_until_paired(
        public_key: Uint8Array | string,
        options: {
            verify_by_use?: () => Promise<unknown>;
            timeout_ms?: number;
            poll_interval_ms?: number;
            signal?: AbortSignal;
        } = {},
    ): Promise<AuthorizedClient> {
        const {
            verify_by_use,
            timeout_ms = DEFAULT_PAIRING_TIMEOUT,
            poll_interval_ms = DEFAULT_PAIRING_POLL_INTERVAL,
            signal,
        } = options;
        const target = publicKeyBase64(public_key);
        const deadline = performance.now() + timeout_ms;
        let last_state: AuthorizedClient["state"] = null;
        const expired = () => new AuthorizedClientWaitExpired({ public_key: target, state: last_state });
        /** Run one step under the deadline. A failed step is `undefined`, unless the wait was aborted. */
        const attempt = async <T>(step: () => Promise<T>): Promise<T | undefined> => {
            const result = await settleWithin(step, deadline - performance.now(), signal).catch((error: unknown) => {
                if (signal?.aborted) {
                    throw error;
                }
                return undefined;
            });
            if (result === EXPIRED) {
                throw expired();
            }
            return result;
        };

        while (true) {
            signal?.throwIfAborted();
            if (performance.now() >= deadline) {
                throw expired();
            }
            const clients = await attempt(() => this.find_authorized_clients());
            const match = clients?.clients.find((client) => client.public_key === target);

            if (match !== undefined) {
                last_state = match.state;
                if (match.state === AuthorizedClientState.PENDING_VERIFICATION_TIMEOUT) {
                    throw new AuthorizedClientPairingTimedOut({ public_key: target, state: match.state });
                }
                if (match.state === AuthorizedClientState.VERIFIED) {
                    if (verify_by_use === undefined) {
                        return match;
                    }
                    if (performance.now() >= deadline) {
                        throw expired();
                    }
                    if ((await attempt(async () => (await verify_by_use(), true))) === true) {
                        return match;
                    }
                }
            }

            const remaining = deadline - performance.now();
            if (remaining <= 0) {
                throw expired();
            }
            await settleWithin(() => new Promise<never>(() => {}), Math.min(poll_interval_ms, remaining), signal);
        }
    }
}

/** Creates and holds Teslemetry energy sites. */
export class TeslemetryEnergySites extends Energy {
    static override Site = TeslemetryEnergySite;

    override create(energy_site_id: number, private_key?: KeyObject, din?: string): TeslemetryEnergySite {
        return super.create(energy_site_id, private_key, din) as TeslemetryEnergySite;
    }
}
