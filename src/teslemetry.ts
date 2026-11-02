import { is_valid_region } from "./const.js";
import TeslaFleetApi, { AccessToken, Logger } from "./teslafleetapi.js";
import { Scope } from "./types/commands.js";

type Region = "na" | "eu" | "api";

type Metadata = {
  uid: string;
  region: "NA" | "EU";
  scopes: Scope[];
  vins: string[];
};

export type TeslemetryOptions = {
  debug?: boolean;
  logger?: Logger;
  fetch?: typeof fetch;
  timeout?: number;
};

export default class Teslemetry extends TeslaFleetApi {
  override readonly _transport_name: string = "teslemetry";

  constructor(accessToken: AccessToken, region: Region = "api", options: TeslemetryOptions = {}) {
    super({
      ...options,
      accessToken,
      server: `https://${region}.teslemetry.com`,
      partnerScope: false,
      userScope: false,
    });
  }

  /**
   * Set the server from the account's region in `metadata()`.
   * @returns The region, e.g. `"na"`.
   */
  override async find_server(): Promise<string> {
    const { region } = await this.metadata(true);
    return region.toLowerCase();
  }

  async _response(resp: Response) {
    if (resp.headers.has("x-region")) {
      const region = resp.headers.get("x-region")?.toLowerCase();
      if (region) {
        this.server = `https://${region}.teslemetry.com`;
      }
    }
    return super._response(resp);
  }

  /**
   * Test the connection to Teslemetry
   */
  async test(): Promise<boolean> {
    return this._request("GET", "api/test").then(({ response }) => response);
  }

  /**
   * Get details about your Teslemetry account
   * @param update_region Update the server URL based on the region in the metadata
   */
  async metadata(update_region = true): Promise<Metadata> {
    return this._request("GET", "api/metadata").then((metadata) => {
      if (update_region && metadata.region) {
        const region = metadata.region.toLowerCase();
        if (is_valid_region(region)) {
          this.region = region;
        }
        this.server = `https://${region}.teslemetry.com`;
        this._log(`Using server ${this.server}`);
      }
      return metadata;
    });
  }
}
