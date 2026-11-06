import { is_valid_region } from "./const.js";
import { InvalidResponse, TeslemetryRegistrationError } from "./exceptions.js";
import TeslaFleetApi, { AccessToken, Logger } from "./teslafleetapi.js";
import { TeslemetryEnergySites } from "./teslemetryenergy.js";
import { TeslemetryVehicles } from "./teslemetryvehicle.js";
import { Scope } from "./types/commands.js";
import Vehicle from "./vehicle.js";

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
  /** A short name for the application, sent as `X-Client` on every request. */
  client?: string;
};

/** Teslemetry's OAuth dynamic client registration endpoint. */
export const REGISTER_URL = "https://api.teslemetry.com/oauth/register";

/** The parsed result of `register_client`. */
export type TeslemetryClientRegistration = {
  /** The OAuth client identifier to present for every future authorization, including reauthentication. */
  readonly client_id: string;
  /** The full decoded registration response. */
  readonly raw: Record<string, any>;
};

/**
 * Dynamically register an OAuth client with Teslemetry (RFC 7591). This always
 * registers a new client: the caller persists the `client_id` and skips
 * registration on later runs.
 * @param client_name Human-readable client name shown during consent.
 * @param software_id Identifier for the calling application.
 * @param software_version Version string for the calling application.
 * @param options `fetch` replaces the global `fetch`; `timeout` aborts after this many milliseconds.
 * @throws TeslemetryRegistrationError when the endpoint cannot be reached or
 * refuses, the body is not JSON, or it has no usable `client_id`. The reason is in `data`.
 */
export async function register_client(
  client_name: string,
  software_id: string,
  software_version: string,
  options: { fetch?: typeof fetch; timeout?: number } = {},
): Promise<TeslemetryClientRegistration> {
  const unreachable = "Could not reach Teslemetry to register a client";
  let text: string;
  try {
    const resp = await (options.fetch ?? fetch)(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_name, software_id, software_version }),
      signal: options.timeout != null ? AbortSignal.timeout(options.timeout) : null,
    });
    if (!resp.ok) {
      throw new TeslemetryRegistrationError(unreachable, resp.status);
    }
    text = await resp.text();
  } catch (error) {
    if (error instanceof TeslemetryRegistrationError) {
      throw error;
    }
    throw new TeslemetryRegistrationError(unreachable, null, { cause: error });
  }

  let registration: unknown;
  try {
    registration = JSON.parse(text);
  } catch (error) {
    throw new TeslemetryRegistrationError("Teslemetry returned a malformed registration response", null, { cause: error });
  }

  const raw = registration !== null && typeof registration === "object" && !Array.isArray(registration)
    ? (registration as Record<string, any>)
    : null;
  const client_id = raw?.client_id;
  if (raw === null || typeof client_id !== "string" || !client_id) {
    throw new TeslemetryRegistrationError("Teslemetry registration response did not contain a client_id");
  }
  return { client_id, raw };
}

export default class Teslemetry extends TeslaFleetApi {
  static override Vehicles: new (parent: TeslaFleetApi) => Vehicle = TeslemetryVehicles;

  declare vehicles: TeslemetryVehicles;

  static override EnergySites = TeslemetryEnergySites;

  declare energySites?: TeslemetryEnergySites;
  override readonly _transport_name: string = "teslemetry";

  constructor(accessToken: AccessToken, region: Region = "api", options: TeslemetryOptions = {}) {
    super({
      ...options,
      accessToken,
      server: `https://${region}.teslemetry.com`,
      partnerScope: false,
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

  /** Send a ping. */
  async ping(): Promise<{ response: boolean }> {
    return this._request("GET", "api/ping");
  }

  /**
   * Test the connection to Teslemetry
   */
  async test(): Promise<{ response: boolean }> {
    return this._request("GET", "api/test");
  }

  /** Get userdata. */
  async userdata(): Promise<Record<string, any>> {
    return this._request("GET", "api/userdata");
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

  /** Get the user's scopes. Leaves the server unchanged. */
  async scopes(): Promise<Scope[]> {
    return this.metadata(false).then(({ scopes }) => scopes);
  }

  /**
   * Get or set Auto mode.
   * @param vin
   * @param value `true` enables it, `false` disables it, omit to read it.
   */
  async server_side_polling(vin: string, value?: boolean | null): Promise<boolean | undefined> {
    const method = value === true ? "POST" : value === false ? "DELETE" : "GET";
    return this._request(method, `api/auto/${vin}`).then(({ response }) => response);
  }

  /** Force a refresh of the vehicle data. */
  async vehicle_data_refresh(vin: string): Promise<Record<string, any>> {
    return this._request("GET", `api/refresh/${vin}`);
  }

  /**
   * Migrate from an access token to OAuth.
   * @param client_id
   * @param name
   * @returns The token response, with `expires_in` as an integer and `expires_at` in epoch seconds.
   * @throws InvalidResponse when the reply has no usable `expires_in`.
   */
  async migrate_to_oauth(client_id: string = "homeassistant", name?: string | null): Promise<Record<string, any>> {
    const access_token = await this.access_token();
    const new_token = await this._request("POST", "oauth/token", null, {
      grant_type: "migrate",
      client_id,
      access_token: access_token.trim(),
      name,
    });
    const expires_in = Math.trunc(new_token?.expires_in == null ? NaN : Number(new_token.expires_in));
    if (!Number.isFinite(expires_in)) {
      throw new InvalidResponse("Teslemetry token response did not contain a valid expires_in");
    }
    new_token.expires_in = expires_in;
    new_token.expires_at = Date.now() / 1000 + expires_in;
    return new_token;
  }

  /** Get streaming field parameters and metadata. */
  async fields(): Promise<Record<string, any>> {
    return this._request("GET", "fields.json");
  }

  /** Get the saved vehicle configuration. */
  async vehicle_config(vin: string): Promise<Record<string, any>> {
    return this._request("GET", `api/vehicle_config/${vin}`);
  }

  /** Get a vehicle's streaming configuration: certificate, hostname, port and configurable telemetry fields. */
  async streaming_config(vin: string): Promise<Record<string, any>> {
    return this._request("GET", `api/config/${vin}`);
  }

  /** Stop streaming data from a vehicle. */
  async stop_streaming(vin: string): Promise<Record<string, any>> {
    return this._request("DELETE", `api/config/${vin}`);
  }

  /**
   * Modify a vehicle's streaming configuration.
   * @param vin
   * @param fields Fields to stream with their configuration.
   */
  async modify_streaming_config(vin: string, fields: Record<string, any>): Promise<Record<string, any>> {
    return this._request("PATCH", `api/config/${vin}`, null, { fields });
  }

  /**
   * Create or update a vehicle's streaming configuration.
   * @param vin
   * @param fields Fields to stream with their configuration.
   */
  async create_streaming_config(vin: string, fields: Record<string, any>): Promise<Record<string, any>> {
    return this._request("POST", `api/config/${vin}`, null, { fields });
  }
}
