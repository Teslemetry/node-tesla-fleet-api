import { EnergyIslandMode } from "../const.js";
import { validate_island_mode } from "../energyisland.js";
import { parse_authorized_clients, type AuthorizedClients } from "../energyparsers.js";
import type { LiveStatusResponse } from "../types/live_status.js";
import { battery_level, raw_to_scaled_reserve, type PowerwallClient } from "./client.js";
import type { AuthorizedClientsPayload, BackupEventsPayload } from "./models.js";

/** The cloud energy command envelope. */
export type CommandResult = { response: { code: number; message: string; result: boolean } };

/** The subset of `config.json` with a faithful cloud mapping. A key is omitted when its source is absent. */
export type LocalConfig = { backup_reserve_percent?: number; default_real_mode?: string };

type IslandStatus = { grid_status: string; island_status: string };

/** Best-effort cloud `grid_status` and `island_status` for each gateway grid string. */
const GRID_STATUS: Readonly<Record<string, IslandStatus>> = {
    SystemGridConnected: { grid_status: "Active", island_status: "on_grid" },
    SystemIslandedActive: { grid_status: "Inactive", island_status: "off_grid" },
    SystemIslandedReady: { grid_status: "Inactive", island_status: "off_grid" },
    SystemTransitionToGrid: { grid_status: "Active", island_status: "on_grid" },
    SystemTransitionToIsland: { grid_status: "Inactive", island_status: "off_grid" },
    SystemMicroGridFaulted: { grid_status: "Inactive", island_status: "off_grid" },
    SystemWaitForUser: { grid_status: "Inactive", island_status: "island_status_unknown" },
};
const GRID_STATUS_UNKNOWN: IslandStatus = { grid_status: "Unknown", island_status: "island_status_unknown" };

function ok(): CommandResult {
    return { response: { code: 201, message: "", result: true } };
}

function numberOrNull(value: unknown): number | null {
    return typeof value === "number" ? value : null;
}

/**
 * The cloud energy site's surface over a local `PowerwallClient`: the same method
 * names, arguments and reply shapes, so a router can prefer the LAN and fall back
 * to the cloud. It imports nothing from the router.
 *
 * What has no local mapping is absent rather than stubbed, so a router routes it
 * to the cloud: `site_info`, `storm_mode`, the histories and the rest of Python's
 * `NotImplementedError` group. `add_authorized_client` is one of those, because
 * registration goes through the cloud.
 */
export class PowerwallEnergySite {
    readonly #client: PowerwallClient;

    /** @param client An existing client. This never opens its own transport. */
    constructor(client: PowerwallClient) {
        this.#client = client;
    }

    /** The wrapped client, for what has no cloud counterpart. */
    get powerwall(): PowerwallClient {
        return this.#client;
    }

    /**
     * Set the operation mode.
     * @param default_real_mode `self_consumption`, `autonomous` or `backup`.
     */
    async operation(default_real_mode: string): Promise<CommandResult> {
        await this.#client.set_operation_mode(default_real_mode);
        return ok();
    }

    /**
     * Set the backup reserve.
     * @param backup_reserve_percent On the app's 0-100 scale, as the cloud takes it.
     */
    async backup(backup_reserve_percent: number): Promise<CommandResult> {
        await this.#client.set_backup_reserve(backup_reserve_percent);
        return ok();
    }

    /** Set the grid-charging flag and export rule. Both in one call means one `config.json` write. */
    async grid_import_export(
        disallow_charge_from_grid_with_solar_installed: boolean | null = null,
        customer_preferred_export_rule: string | null = null,
    ): Promise<CommandResult> {
        await this.#client.set_grid_import_export({
            customer_preferred_export_rule,
            disallow_charge_from_grid_with_solar_installed,
        });
        return ok();
    }

    /**
     * Open or close the grid contactor. See `PowerwallClient.set_island_mode`:
     * read `islanding.contactorClosed` afterwards.
     * @param mode 6 islands and 1 reconnects. Anything else raises `TypeError`.
     * @param force Defaults to true off grid and false otherwise, like the cloud.
     */
    async set_island_mode(mode: EnergyIslandMode | number, force?: boolean | null): Promise<CommandResult> {
        validate_island_mode(mode, force);
        const off_grid = mode === EnergyIslandMode.OFF_GRID;
        await this.#client.set_island_mode({ off_grid, force: force ?? off_grid, mode_override: mode });
        return ok();
    }

    /** Disconnect from the grid. */
    async go_off_grid(): Promise<CommandResult> {
        await this.#client.go_off_grid();
        return ok();
    }

    /** Reconnect to the grid. */
    async reconnect_grid(): Promise<CommandResult> {
        await this.#client.reconnect_grid();
        return ok();
    }

    /**
     * Schedule a manual backup event. `start_time` and `priority` exist for
     * signature parity and are not honoured: the event always starts now at
     * maximum priority.
     * @param duration_seconds Defaults to 7200.
     */
    async schedule_backup_event(
        _start_time?: string | null,
        duration_seconds?: number | null,
        _priority?: number | string | null,
    ): Promise<CommandResult> {
        await this.#client.schedule_max_backup(duration_seconds ?? undefined);
        return ok();
    }

    /** Cancel the active manual backup event. */
    async cancel_backup_event(): Promise<CommandResult> {
        await this.#client.cancel_max_backup();
        return ok();
    }

    /**
     * Request a timed battery power setpoint.
     * @param power_watts Positive discharges, negative charges.
     * @param duration_seconds Whole seconds from 1 to 86400.
     */
    async dispatch_battery_power(power_watts: number, duration_seconds: number): Promise<CommandResult> {
        await this.#client.dispatch_battery_power(power_watts, duration_seconds);
        return ok();
    }

    /** Release a `dispatch_battery_power` setpoint. */
    async resume_battery_operation(): Promise<CommandResult> {
        await this.#client.resume_battery_operation();
        return ok();
    }

    /** The active manual backup and scheduled events, in the local shape: the cloud's gRPC reply cannot be reproduced. */
    async get_backup_events(): Promise<{ response: BackupEventsPayload }> {
        return { response: await this.#client.get_backup_events() };
    }

    /**
     * A cloud-shaped `live_status`, from three sequential reads. Keys with no local
     * source are `null`, never guessed. A merge with the cloud fills them in.
     */
    async live_status(): Promise<{ response: LiveStatusResponse }> {
        const meters = await this.#client.get_meters_aggregates();
        const status = await this.#client.get_status();
        const gridStatus = await this.#client.get_grid_status();

        const power = (location: string) => numberOrNull(meters[location]?.instant_power);
        const systemStatus = status.control?.systemStatus;
        return {
            response: {
                solar_power: power("solar"),
                energy_left: numberOrNull(systemStatus?.nominalEnergyRemainingWh),
                total_pack_energy: numberOrNull(systemStatus?.nominalFullPackEnergyWh),
                percentage_charged: battery_level(status),
                backup_capable: null,
                battery_power: power("battery"),
                load_power: power("load"),
                grid_power: power("site"),
                grid_services_power: null,
                generator_power: power("generator"),
                ...(Object.hasOwn(GRID_STATUS, gridStatus) ? GRID_STATUS[gridStatus] : GRID_STATUS_UNKNOWN),
                grid_services_active: null,
                storm_mode_active: null,
                timestamp: null,
                wall_connectors: null,
            },
        };
    }

    /** The reserve (on the app's scale) and mode from `config.json`. A bare object, unlike the cloud's reads. */
    async local_config(): Promise<LocalConfig> {
        const config = await this.#client.get_config();
        const result: LocalConfig = {};
        const reserve: unknown = config.site_info?.backup_reserve_percent;
        if (typeof reserve === "number") {
            result.backup_reserve_percent = raw_to_scaled_reserve(reserve);
        }
        if (config.default_real_mode !== undefined) {
            result.default_real_mode = config.default_real_mode;
        }
        return result;
    }

    /** The paired keys in the gateway's raw form. Prefer `find_authorized_clients`. */
    async list_authorized_clients(): Promise<{ response: AuthorizedClientsPayload }> {
        return { response: await this.#client.list_authorized_clients() };
    }

    /** The paired keys, in the same typed form as `TeslemetryEnergySite.find_authorized_clients`. */
    async find_authorized_clients(): Promise<AuthorizedClients> {
        const { response } = await this.list_authorized_clients();
        return parse_authorized_clients(response);
    }

    /**
     * Revoke a paired key. Any paired key can remove any other, and removing the
     * signing key locks this client out.
     * @param public_key Raw DER bytes, or base64 as `list_authorized_clients` reports it.
     */
    async remove_authorized_client(public_key: Uint8Array | string): Promise<CommandResult> {
        await this.#client.remove_authorized_client(public_key);
        return ok();
    }
}
