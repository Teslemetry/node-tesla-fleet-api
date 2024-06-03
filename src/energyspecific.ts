import Energy from "./energy.js";

// Energy Class
export default class EnergySpecific {
    parent: Energy;
    energy_site_id: number;

    constructor(parent: Energy, energy_site_id: number) {
        this.parent = parent;
        this.energy_site_id = energy_site_id;
    }

    async backup(backup_reserve_percent: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/backup`, null, { backup_reserve_percent });
    }

    async backup_history(kind: string, start_date: string, end_date: string, period: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/energy_sites/${this.energy_site_id}/calendar_history`, null, {
            kind,
            start_date,
            end_date,
            period,
            time_zone,
        });
    }

    async charge_history(kind: string, start_date: string, end_date: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/energy_sites/${this.energy_site_id}/telemetry_history`, null, {
            kind,
            start_date,
            end_date,
            time_zone,
        });
    }

    async energy_history(kind: string, start_date: string, end_date: string, period: string, time_zone: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/energy_sites/${this.energy_site_id}/calendar_history`, null, {
            kind,
            start_date,
            end_date,
            period,
            time_zone,
        });
    }

    async grid_import_export(
        disallow_charge_from_grid_with_solar_installed: boolean | null = null,
        customer_preferred_export_rule: string | null = null
    ): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/grid_import_export`, null, {
            disallow_charge_from_grid_with_solar_installed,
            customer_preferred_export_rule,
        });
    }

    async live_status(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/energy_sites/${this.energy_site_id}/live_status`);
    }

    async off_grid_vehicle_charging_reserve(off_grid_vehicle_charging_reserve_percent: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/off_grid_vehicle_charging_reserve`, null, {
            off_grid_vehicle_charging_reserve_percent,
        });
    }

    async operation(default_real_mode: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/operation`, null, { default_real_mode });
    }

    async site_info(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/energy_sites/${this.energy_site_id}/site_info`);
    }

    async storm_mode(enabled: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/energy_sites/${this.energy_site_id}/storm_mode`, null, { enabled });
    }
}
