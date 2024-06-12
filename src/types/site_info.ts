export type SiteInfoResponse = {
    id: string;
    site_name: string;
    backup_reserve_percent: number;
    default_real_mode: string;
    installation_date: Date;
    user_settings: UserSettings;
    components: Components;
    version?: string;
    battery_count?: number;
    tou_settings?: TouSettings;
    nameplate_power?: number;
    nameplate_energy?: number;
    installation_time_zone: string;
    max_site_meter_power_ac?: number;
    min_site_meter_power_ac?: number;
    vpp_backup_reserve_percent?: number;
    tariff_content_v2?: TariffContentV2;
};

export type Components = {
    solar: boolean;
    solar_type?: string;
    battery: boolean;
    grid: boolean;
    backup: boolean;
    gateway: string;
    load_meter: boolean;
    tou_capable: boolean;
    storm_mode_capable: boolean;
    flex_energy_request_capable: boolean;
    car_charging_data_supported: boolean;
    off_grid_vehicle_charging_reserve_supported: boolean;
    vehicle_charging_performance_view_enabled: boolean;
    vehicle_charging_solar_offset_view_enabled: boolean;
    battery_solar_offset_view_enabled: boolean;
    solar_value_enabled?: boolean;
    energy_value_header?: string;
    energy_value_subheader?: string;
    energy_service_self_scheduling_enabled: boolean;
    show_grid_import_battery_source_cards?: boolean;
    set_islanding_mode_enabled?: boolean;
    wifi_commissioning_enabled?: boolean;
    backup_time_remaining_enabled?: boolean;
    battery_type?: string;
    configurable?: boolean;
    grid_services_enabled?: boolean;
    gateways?: Gateway[];
    batteries?: Battery[];
    wall_connectors?: WallConnector[];
    disallow_charge_from_grid_with_solar_installed?: boolean;
    customer_preferred_export_rule?: string;
    net_meter_mode?: string;
    system_alerts_enabled?: boolean;
    nbt_supported?: boolean;
};

export type Battery = {
    device_id: string;
    din: string;
    serial_number: string;
    part_number: string;
    part_type: number;
    part_name: string;
    nameplate_max_charge_power: number;
    nameplate_max_discharge_power: number;
    nameplate_energy: number;
};

export type Gateway = {
    device_id: string;
    din: string;
    serial_number: string;
    part_number: string;
    part_type: number;
    part_name: string;
    is_active: boolean;
    site_id: string;
    firmware_version: string;
    updated_datetime: Date;
};

export type WallConnector = {
    device_id: string;
    din: string;
    part_name: string;
    is_active: boolean;
};

export type TouSettings = {
    optimization_strategy: string;
    schedule: Schedule[];
};

export type Schedule = {
    target: string;
    week_days: number[];
    start_seconds: number;
    end_seconds: number;
};

export type UserSettings = {
    go_off_grid_test_banner_enabled: boolean;
    storm_mode_enabled: boolean;
    powerwall_onboarding_settings_set: boolean;
    powerwall_tesla_electric_interested_in: boolean;
    vpp_tour_enabled: boolean;
    sync_grid_alert_enabled: boolean;
    breaker_alert_enabled: boolean;
    off_grid_vehicle_charging_enabled: boolean;
};

export type TariffContentV2 = {
    version: number;
    monthly_minimum_bill: number;
    min_applicable_demand: number;
    max_applicable_demand: number;
    monthly_charges: number;
    utility: string;
    code: string;
    name: string;
    currency: string;
    daily_charges: Record<string, any>[];
    daily_demand_charges: Record<string, any>;
    demand_charges: Record<string, any>;
    energy_charges: Record<string, any>;
    seasons: Record<string, any>[];
    sell_tariff: Record<string, any>;
};
