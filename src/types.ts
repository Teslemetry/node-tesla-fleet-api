export type Method = "GET" | "POST" | "PUT" | "DELETE";

export interface RequestFunction {
    (method: Method, endpoint: string, data?: Record<string, any>): Promise<Record<string, any>>;
}

// Vehicles

export type Trunk = "front" | "rear";
export const Seats = {
    FRONT_LEFT: 0,
    FRONT_RIGHT: 1,
    REAR_LEFT: 2,
    REAR_CENTER: 4,
    REAR_RIGHT: 5,
    THIRD_ROW_LEFT: 6,
    THIRD_ROW_RIGHT: 7,
};
export type Seat = keyof typeof Seats;
export type Level = 0 | 1 | 2 | 3;
export const ClimateModes = { Off: 0, Keep: 1, Dog: 2, Camp: 3 };
export type ClimateMode = keyof typeof ClimateModes;
export type VehicleDataEndpoint =
    | "charge_state"
    | "climate_state"
    | "closures_state"
    | "drive_state"
    | "gui_settings"
    | "location_data"
    | "vehicle_config"
    | "vehicle_state"
    | "vehicle_data_combo";

export type AlertTypes = "customer" | "service";

export interface FleetTelemetryConfig {
    vins: string[];
    config: {
        hostname: string;
        ca: string;
        fields: {
            [key: string]: {
                interval_seconds: number;
            };
        };
        alert_types: AlertTypes[];
        exp: number;
        port: number;
    };
}
