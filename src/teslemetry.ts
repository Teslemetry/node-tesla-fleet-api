import TeslaFleetApi from "./teslafleetapi.js";
import { Scope } from "./types/index.js";

type Region = "na" | "eu" | "api";

type Test = { response: boolean };

type Metadata = {
    uid: string;
    region: "NA" | "EU";
    scopes: Scope[];
    vins: string[];
};

export default class Telemetry extends TeslaFleetApi {
    constructor(accessToken: string, region: Region = "api") {
        super({ accessToken, server: `https://${region}.teslemetry.com`, partnerScope: false, userScope: false });
    }

    /**
     * Test the connection to Teslemetry
     */
    async test(): Promise<Test> {
        return this._request("GET", "/api/test").then(({ response }) => response);
    }

    /**
     * Get details about your Teslemetry account
     * @param update_region Update the server URL based on the region in the metadata
     */
    async metadata(update_region = true): Promise<Metadata> {
        return this._request("GET", "/api/metadata").then((metadata) => {
            if (update_region) {
                this.server = `https://${metadata.region.toLowerCase()}.teslemetry.com`;
            }
            return metadata;
        });
    }
}
