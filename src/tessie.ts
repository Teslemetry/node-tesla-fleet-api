import TeslaFleetApi from "./teslafleetapi.js";
import { Scope } from "./types.js";

export default class Telemetry extends TeslaFleetApi {
    constructor(accessToken: string) {
        super({ accessToken, server: `https://api.tessie.com`, partnerScope: false, userScope: false });
    }

    /**
     * Get your approved Tesla scopes
     */
    async tesla_scopes(): Promise<Scope[]> {
        return this._request("GET", "auth/tesla_scopes");
    }
}
