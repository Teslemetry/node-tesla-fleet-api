import { TeslaFleetApi } from "./teslafleetapi.js";

type Region = "na" | "eu" | "api";

export default class Telemetry extends TeslaFleetApi {
    constructor(accessToken: string, region: Region = "api") {
        super({ accessToken, server: `https://${region}.teslemetry.com`, partnerScope: false, userScope: false });
    }

    async test() {
        return this._request("GET", "/api/test");
    }

    async metadata(update_region = true) {
        this._request("GET", "/api/metadata").then((metadata) => {
            if (update_region) {
                this.server = `https://${metadata.region}.teslemetry.com`;
            }
            return metadata;
        });
    }
}
