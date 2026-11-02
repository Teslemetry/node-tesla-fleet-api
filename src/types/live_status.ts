// A local gateway has no source for some keys and reports them as `null`, so a
// reader must not assume every key is set.
export type LiveStatusResponse = {
    solar_power?: number | null;
    energy_left?: number | null;
    total_pack_energy?: number | null;
    percentage_charged?: number | null;
    backup_capable?: boolean | null;
    battery_power?: number | null;
    load_power?: number | null;
    grid_status?: string | null;
    grid_services_active?: boolean | null;
    grid_power?: number | null;
    grid_services_power?: number | null;
    generator_power?: number | null;
    island_status?: string | null;
    storm_mode_active?: boolean | null;
    timestamp?: Date | null;
    wall_connectors?: WallConnector[] | null;
};

export type WallConnector = {
    din: string;
    vin?: string;
    wall_connector_state: number;
    wall_connector_fault_state: number;
    wall_connector_power: number;
    ocpp_status: number;
};
