import Energy from "./energy.js";
import { LiveStatusResponse } from "./types/live_status.js";
import { SiteInfoResponse } from "./types/site_info.js";

// Energy Class
export default class EnergySpecific {
    parent: Energy;
    energy_site_id: number;

    constructor(parent: Energy, energy_site_id: number) {
        this.parent = parent;
        this.energy_site_id = energy_site_id;
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
     * @param kind The kind of history to be requested. 'backup', 'charge', 'energy' are all supported.
     * @param start_date Start date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param period Period of the window to retrieve backup events. This can be day, week, month, year, lifetime and should align with the window requested.
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async backup_history(kind: string, start_date: string, end_date: string, period: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent.backup_history(this.energy_site_id, kind, start_date, end_date, period, time_zone);
    }

    /**
     * Returns the charging history of a wall connector.
     * @param kind The kind of history to be requested. 'backup', 'charge', 'energy' are all supported.
     * @param start_date Start date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async charge_history(kind: string, start_date: string, end_date: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent.charge_history(this.energy_site_id, kind, start_date, end_date, time_zone);
    }

    /**
     * Returns the energy history of the site in duration of seconds.
     * @param kind The kind of history to be requested. 'backup', 'charge', 'energy' are all supported.
     * @param start_date Start date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param end_date End date of the window to retrieve backup events in RFC3339 format. i.e. 2023-01-01T00:00:00-08:00
     * @param period Period of the window to retrieve backup events. This can be day, week, month, year, lifetime and should align with the window requested.
     * @param time_zone Timezone of the requested window in IANA name format. i.e. 'America/Los_Angeles'
     * @returns
     */
    async energy_history(kind: string, start_date: string, end_date: string, period: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent.energy_history(this.energy_site_id, kind, start_date, end_date, period, time_zone);
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
    async live_status(): Promise<LiveStatusResponse> {
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
    async site_info(): Promise<SiteInfoResponse> {
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
}
