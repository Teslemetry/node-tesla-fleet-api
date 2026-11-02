import { LibraryError } from "./exceptions.js";
import TeslaFleetApi, { AccessToken, Logger } from "./teslafleetapi.js";
import { Scope } from "./types/commands.js";
import { VehicleDataResponse } from "./types/vehicle_data.js";

type TessieVehicleResponse = {
    vin: string,
    is_active: boolean,
    last_state: VehicleDataResponse,
}

export default class Tessie extends TeslaFleetApi {
    override readonly _transport_name: string = "tessie";

    constructor(accessToken: AccessToken, options: { debug?: boolean; logger?: Logger; fetch?: typeof fetch; timeout?: number } = {}) {
        super({ ...options, accessToken, server: `https://api.tessie.com`, partnerScope: false, userScope: false });
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

    async list_vehicles(only_active: boolean = false): Promise<TessieVehicleResponse[]> {
        return this._request("GET", "vehicles", { only_active }).then(({ results }) => results);
    }

    async wake(vin: string): Promise<boolean> {
        return this._request("POST", `${vin}/wake`).then(({ result }) => result);
    }
}
