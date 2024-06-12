import EnergySpecific from "./energyspecific.js";
import TeslaFleetApi from "./teslafleetapi.js";
import { LiveStatusResponse } from "./types/live_status.js";
import { SiteInfoResponse } from "./types/site_info.js";

// Energy Class
export default class Energy {
    parent: TeslaFleetApi;

    constructor(parent: TeslaFleetApi) {
        this.parent = parent;
    }

    /**
     * Create an Energy class for a specific site.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @returns `EnergySpecific` class
     */
    specific(energy_site_id: number): EnergySpecific {
        return new EnergySpecific(this, energy_site_id);
    }

    /**
     * Adjust the site's backup reserve.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.ID field of an energy site from /api/1/products endpoint.
     * @param backup_reserve_percent The desired backup reserve percent.
     * @returns
     */
    async backup(energy_site_id: number, backup_reserve_percent: number): Promise<Record<string, any>> {
        return this.parent._request("POST", `api/1/energy_sites/${energy_site_id}/backup`, null, { backup_reserve_percent });
    }

    /**
     * Returns the backup (off-grid) event history of the site in duration of seconds.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @param kind The kind of history to be requested. 'backup', 'charge', 'energy' are all supported.
     * @param start_date Start date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param period Period of the window to retrieve backup events. This can be day, week, month, year, lifetime and should align with the window requested.
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async backup_history(
        energy_site_id: number,
        kind: string,
        start_date: string,
        end_date: string,
        period: string,
        time_zone: string
    ): Promise<Record<string, any>> {
        return this.parent._request("GET", `api/1/energy_sites/${energy_site_id}/calendar_history`, null, { kind, start_date, end_date, period, time_zone });
    }

    /**
     * Returns the charging history of a wall connector.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @param kind The kind of history to be requested. 'backup', 'charge', 'energy' are all supported.
     * @param start_date Start date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async charge_history(energy_site_id: number, kind: string, start_date: string, end_date: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent._request("GET", `api/1/energy_sites/${energy_site_id}/telemetry_history`, null, { kind, start_date, end_date, time_zone });
    }

    /**
     * Returns the energy measurements of the site, aggregated to the requested period.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @param kind The kind of history to be requested. 'backup', 'charge', 'energy' are all supported.
     * @param start_dateStart date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param period Period of the window to retrieve backup events. This can be day, week, month, year, lifetime and should align with the window requested.
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async energy_history(
        energy_site_id: number,
        kind: string,
        start_date: string,
        end_date: string,
        period: string,
        time_zone: string
    ): Promise<Record<string, any>> {
        return this.parent._request("GET", `api/1/energy_sites/${energy_site_id}/calendar_history`, null, { kind, start_date, end_date, period, time_zone });
    }

    /**
     * Allow/disallow charging from the grid and exporting energy to the grid.
     * @param energy_site_id
     * @param disallow_charge_from_grid_with_solar_installed The desired behavior towards importing from the grid. Charging from the grid is disabled when set to true and enabled when set to false.
     * @param customer_preferred_export_rule The desired behavior for grid exporting. The available options are battery_ok, pv_only, and never.
     * @returns
     */
    async grid_import_export(
        energy_site_id: number,
        disallow_charge_from_grid_with_solar_installed: boolean | null = null,
        customer_preferred_export_rule: string | null = null
    ): Promise<Record<string, any>> {
        return this.parent._request("POST", `api/1/energy_sites/${energy_site_id}/grid_import_export`, null, {
            disallow_charge_from_grid_with_solar_installed,
            customer_preferred_export_rule,
        });
    }

    /**
     * Returns the live status of the site (power, state of energy, grid status, storm mode).
     * @param energy_site_id
     * @returns
     */
    async live_status(energy_site_id: number): Promise<LiveStatusResponse> {
        return this.parent._request("GET", `api/1/energy_sites/${energy_site_id}/live_status`).then(({response}) => response);
    }

    /**
     * Adjust the site's off-grid vehicle charging backup reserve.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @param off_grid_vehicle_charging_reserve_percent The desired off grid vehicle charging reserve percent.
     * @returns
     */
    async off_grid_vehicle_charging_reserve(energy_site_id: number, off_grid_vehicle_charging_reserve_percent: number): Promise<Record<string, any>> {
        return this.parent._request("POST", `api/1/energy_sites/${energy_site_id}/off_grid_vehicle_charging_reserve`, null, {
            off_grid_vehicle_charging_reserve_percent,
        });
    }

    /**
     * Set the site's mode.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @param default_real_mode The desired operation mode. Use autonomous for time-based control and self_consumption for self-powered mode.
     * @returns
     */
    async operation(energy_site_id: number, default_real_mode: string): Promise<Record<string, any>> {
        return this.parent._request("POST", `api/1/energy_sites/${energy_site_id}/operation`, null, { default_real_mode });
    }

    /**
     * Returns information about the site. Things like assets (has solar, etc), settings (backup reserve, etc), and features (storm_mode_capable, etc).
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @returns
     */
    async site_info(energy_site_id: number): Promise<SiteInfoResponse> {
        return this.parent._request("GET", `api/1/energy_sites/${energy_site_id}/site_info`).then(({response}) => response);
    }

    /**
     * Update storm watch participation.
     * @param energy_site_id ID field of an energy site from /api/1/products endpoint.
     * @param enabled The storm mode participation value to set.
     * @returns
     */
    async storm_mode(energy_site_id: number, enabled: boolean): Promise<Record<string, any>> {
        return this.parent._request("POST", `api/1/energy_sites/${energy_site_id}/storm_mode`, null, { enabled });
    }
}
