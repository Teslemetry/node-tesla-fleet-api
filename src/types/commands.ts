export interface CommandResponse {
    response: {
        result: boolean;
        reason: string;
    };
    error?: string;
}

export type { Scope, Trunk, Seat, Level, ClimateMode, VehicleDataEndpoint } from "../const.js";
export { Seats, ClimateModes } from "../const.js";

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
