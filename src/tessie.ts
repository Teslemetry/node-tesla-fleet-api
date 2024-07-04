import TeslaFleetApi from "./teslafleetapi.js";
import { Scope } from "./types/commands.js";
import { VehicleDataResponse } from "./types/vehicle_data.js";

type TessieVehicleResponse = {
    vin: string,
    is_active: boolean,
    last_state: VehicleDataResponse,
}

export default class Telemetry extends TeslaFleetApi {
    constructor(accessToken: string) {
        super({ accessToken, server: `https://api.tessie.com`, partnerScope: false, userScope: false });
    }

    /**
     * Get your approved Tesla scopes
     */
    async tesla_scopes(): Promise<Scope[]> {
        return this._request("GET", "auth/tesla_scopes").then(({ scopes }) => scopes)
    }

    async metadata(): Promise<{ scopes: Scope[] }> {
        return this._request("GET", "auth/tesla_scopes")
    }

    async status(vin: string): Promise<"asleep" | "waiting_for_sleep" | "awake"> {
        return this._request("GET", `${vin}/status`).then(({ status }) => status);
    }

    async state(vin: string, use_cache: boolean = true): Promise<VehicleDataResponse> {
        return this._request("GET", `${vin}/state`, { use_cache });
    }

    async vehicles(only_active: boolean = false): Promise<TessieVehicleResponse[]> {
        return this._request("GET", "vehicles", { only_active }).then(({ results }) => results);
    }

    async wake(vin: string): Promise<boolean> {
        return this._request("POST", `${vin}/wake`).then(({ result }) => result);
    }
}
