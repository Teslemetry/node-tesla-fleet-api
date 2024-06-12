export type LiveStatusResponse = {
    solar_power?: number;
    energy_left?: number;
    total_pack_energy?: number;
    percentage_charged?: number;
    backup_capable?: boolean;
    battery_power?: number;
    load_power?: number;
    grid_status?: string;
    grid_services_active?: boolean;
    grid_power?: number;
    grid_services_power?: number;
    generator_power?: number;
    island_status?: string;
    storm_mode_active?: boolean;
    timestamp: Date;
    wall_connectors?: WallConnector[];
};

export type WallConnector = {
    din: string;
    vin?: string;
    wall_connector_state: number;
    wall_connector_fault_state: number;
    wall_connector_power: number;
    ocpp_status: number;
};
