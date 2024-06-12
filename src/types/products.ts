import { VehicleResponse } from "./vehicle.js";
import { VehicleConfig } from "./vehicle_data.js";

export type ProductsResponse = {
    response: (VehicleProduct | EnergyProduct)[];
    count: number;
};

export type VehicleProduct = VehicleResponse & {
    vehicle_config: VehicleConfig;
    command_signing: string;
    release_notes_supported: boolean;
};

export type EnergyProduct = {
    energy_site_id: number;
    resource_type: string;
    site_name: string;
    id: string;
    gateway_id: string;
    asset_site_id: string;
    warp_site_number: string;
    energy_left: number;
    total_pack_energy: number;
    percentage_charged: number;
    battery_type: string;
    backup_capable: boolean;
    battery_power: number;
    go_off_grid_test_banner_enabled: null | boolean;
    storm_mode_enabled: boolean;
    powerwall_onboarding_settings_set: boolean;
    powerwall_tesla_electric_interested_in: null | boolean;
    vpp_tour_enabled: null | boolean;
    sync_grid_alert_enabled: boolean;
    breaker_alert_enabled: boolean;
    components: Components;
    features: Features;
};

export type Components = {
    battery: boolean;
    battery_type: string;
    solar: boolean;
    solar_type: string;
    grid: boolean;
    load_meter: boolean;
    market_type: string;
    wall_connectors: WallConnector[];
};

export type WallConnector = {
    device_id: string;
    din: string;
    is_active: boolean;
};

export type Features = {
    rate_plan_manager_no_pricing_constraint: boolean;
};
