import { LibraryError } from "./exceptions.js";
import TeslaFleetApi, { AccessToken, Logger } from "./teslafleetapi.js";
import { TessieVehicles } from "./tessievehicle.js";
import { Scope } from "./types/commands.js";
import { VehicleDataResponse } from "./types/vehicle_data.js";
import Vehicle from "./vehicle.js";

type TessieVehicleResponse = {
    vin: string,
    is_active: boolean,
    last_state: VehicleDataResponse,
}

export type TessieOptions = {
    debug?: boolean;
    logger?: Logger;
    fetch?: typeof fetch;
    timeout?: number;
    /** A short name for the application, sent as `X-Client` on every request. */
    client?: string;
    /** Default for each command's `wait_for_completion`. */
    wait_for_completion?: boolean;
    /** Default for each command's `max_attempts`. */
    max_attempts?: number;
};

/** Options of `all_battery_health`. `start` and `end` are sent as `from` and `to`. */
export type TessieAllBatteryHealthOptions = {
    start?: number | null;
    end?: number | null;
    distance_format?: string;
    only_active?: boolean;
};

/** Options of `charging_invoices`. `start` and `end` are sent as `from` and `to`. */
export type TessieChargingInvoicesOptions = {
    start?: number | null;
    end?: number | null;
    timezone?: string;
    vin?: string;
    format?: string;
    only_active?: boolean;
};

export default class Tessie extends TeslaFleetApi {
    static override Vehicles: new (parent: TeslaFleetApi) => Vehicle = TessieVehicles;

    declare vehicles: TessieVehicles;

    override readonly _transport_name: string = "tessie";
    wait_for_completion: boolean;
    max_attempts: number;

    constructor(accessToken: AccessToken, options: TessieOptions = {}) {
        const { wait_for_completion = true, max_attempts = 3, ...rest } = options;
        super({ ...rest, accessToken, server: `https://api.tessie.com`, partnerScope: false });
        this.wait_for_completion = wait_for_completion;
        this.max_attempts = max_attempts;
    }

    /** Tessie has one server; there is nothing to find. */
    override async find_server(): Promise<string> {
        throw new LibraryError("Do not use this function for Tessie.");
    }

    /**
     * Get your approved Tesla scopes
     */
    async tesla_scopes(): Promise<Scope[]> {
        return this._request("GET", "auth/tesla_scopes").then(({ scopes }) => scopes)
    }

    /** Get the user's scopes. */
    async scopes(): Promise<Scope[]> {
        return this._request("GET", "auth/tesla_scopes").then(({ scopes }) => scopes);
    }

    async metadata(): Promise<{ scopes: Scope[] }> {
        return this._request("GET", "auth/tesla_scopes")
    }

    /** With no VIN, the API status (`"ok"`); with a VIN, that vehicle's sleep status. */
    override async status(): Promise<string>;
    override async status(vin: string): Promise<"asleep" | "waiting_for_sleep" | "awake">;
    override async status(vin?: string): Promise<string> {
        if (vin === undefined) {
            return super.status();
        }
        return this._request("GET", `${vin}/status`).then(({ status }) => status);
    }

    async state(vin: string, use_cache: boolean = true): Promise<VehicleDataResponse> {
        return this._request("GET", `${vin}/state`, { use_cache });
    }

    async list_vehicles(only_active: boolean = false): Promise<{ results: TessieVehicleResponse[] }> {
        return this._request("GET", "vehicles", { only_active });
    }

    async wake(vin: string): Promise<boolean> {
        return this._request("POST", `${vin}/wake`).then(({ result }) => result);
    }

    /** Get battery health data for every vehicle. */
    async all_battery_health(options: TessieAllBatteryHealthOptions = {}): Promise<any> {
        const { start, end, distance_format, only_active = false } = options;
        return this._request("GET", "battery_health", { from: start, to: end, distance_format, only_active });
    }

    /** Get charging costs for every vehicle. */
    async charging_invoices(options: TessieChargingInvoicesOptions = {}): Promise<any> {
        const { start, end, ...params } = options;
        return this._request("GET", "charging_invoices", { from: start, to: end, ...params });
    }
}
