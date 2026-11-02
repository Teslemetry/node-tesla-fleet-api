import Charging from "./charging.js";
import Energy from "./energy.js";
import Partner from "./partner.js";
import User from "./user.js";
import Vehicle from "./vehicle.js";
import { Method, Region, SERVERS, Scope, TOKEN_URLS, is_valid_region } from "./const.js";
import {
  InvalidRegion,
  LibraryError,
  MissingToken,
  ResponseError,
  TeslaFleetConnectionError,
  TeslaFleetError,
  raise_for_status,
} from "./exceptions.js";
import {
  EnergyProduct,
  ProductsResponse,
  VehicleProduct,
} from "./types/products.js";
import { Logger, logRequestError, logRequestResult } from "./log.js";

export type { Logger } from "./log.js";

/** Replaced at build time (tsdown.config.ts) and test time (vitest.config.ts) with package.json's version. */
declare const __VERSION__: string;

export type ProductsByType = {
  vehicles: VehicleProduct[];
  energy_sites: EnergyProduct[];
};

/** An access token, or a function returning the current one (e.g. after an OAuth refresh). */
export type AccessToken = string | (() => Promise<string | null>);

export default class TeslaFleetApi {
  /** Class backing `vehicles`; a subclass (e.g. `Teslemetry`) overrides it instead of its constructor. */
  static Vehicles: new (parent: TeslaFleetApi) => Vehicle = Vehicle;
  /** Class backing `energySites`; a subclass overrides it instead of its constructor. */
  static EnergySites: new (parent: TeslaFleetApi) => Energy = Energy;

  server: string | null = null;
  region: Region | null = null;
  accessToken: AccessToken | null;
  charging?: Charging;
  energySites?: Energy;
  partner?: Partner;
  user?: User;
  vehicles?: Vehicle;
  /** Log to `console.debug` when no `logger` is set. */
  debug: boolean = false;
  logger: Logger | null;
  /** Abort a request (including reading its body) after this many milliseconds; `null` waits indefinitely. */
  timeout: number | null;
  /** Transport identity for debug logging; Teslemetry and Tessie override this. */
  readonly _transport_name: string = "fleet";
  #fetch: typeof fetch | null;

  constructor(options: {
    accessToken?: AccessToken;
    region?: Region;
    server?: string;
    chargingScope?: boolean;
    energyScope?: boolean;
    partnerScope?: boolean;
    userScope?: boolean;
    vehicleScope?: boolean;
    debug?: boolean;
    logger?: Logger;
    /** Used for every request in place of the global `fetch`. */
    fetch?: typeof fetch;
    timeout?: number;
  }) {
    this.debug = !!options.debug;
    this.logger = options.logger ?? null;
    this.#fetch = options.fetch ?? null;
    this.timeout = options.timeout ?? null;
    this.accessToken = options.accessToken ?? null;

    if (options.server) {
      this.server = options.server;
    } else if (options.region && is_valid_region(options.region)) {
      this.region = options.region;
      this.server = SERVERS[options.region];
    } else {
      throw new Error("Either server or region must be provided.");
    }

    this._log(`Using server ${this.server}`);

    const factories = this.constructor as typeof TeslaFleetApi;

    if (options.chargingScope !== false) {
      this.charging = new Charging(this);
    }
    if (options.energyScope !== false) {
      this.energySites = new factories.EnergySites(this);
    }
    if (options.userScope !== false) {
      this.user = new User(this);
    }
    if (options.partnerScope !== false) {
      this.partner = new Partner(this);
    }

    if (options.vehicleScope !== false) {
      this.vehicles = new factories.Vehicles(this);
    }
  }

  /** Write a debug line to `logger`, or to `console.debug` when `debug` is set. */
  _log(message: string): void {
    if (this.logger) {
      this.logger.debug(message);
    } else if (this.debug) {
      console.debug(message);
    }
  }

  /** The injected `fetch`, resolved per call so the global is read late. */
  protected _fetch(input: string, init?: RequestInit): Promise<Response> {
    return (this.#fetch ?? fetch)(input, init);
  }

  /**
   * Find the server for this user's region by asking each Tesla server in
   * turn, skipping any that answers `InvalidRegion`.
   * @returns The region, e.g. `"na"`.
   */
  async find_server(): Promise<string> {
    for (const server of Object.values(SERVERS)) {
      this.server = server;
      try {
        const { response } = await this._request("GET", "api/1/users/region");
        if (response) {
          this.server = response.fleet_api_base_url;
          if (is_valid_region(response.region)) {
            this.region = response.region;
          }
          this._log(`Using server ${this.server}`);
          return response.region;
        }
      } catch (error) {
        if (error instanceof InvalidRegion) {
          continue;
        }
        throw error;
      }
    }
    throw new LibraryError("Could not find a valid Tesla API server.");
  }

  /**
   * The current access token, calling it first if it is a function.
   * @throws MissingToken when there is no token.
   */
  async access_token(): Promise<string> {
    const token = typeof this.accessToken === "function" ? await this.accessToken() : this.accessToken;
    if (token == null) {
      throw new MissingToken();
    }
    return token;
  }

  /**
   * Turn a response into its decoded JSON body, throwing the matching
   * `TeslaFleetError` for an error status and `ResponseError` for a
   * successful response whose body is not JSON.
   */
  async _response(resp: Response): Promise<any> {
    await raise_for_status(resp);
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      this._log(`Response type is: ${resp.headers.get("content-type")}`);
      throw new ResponseError(text, resp.status);
    }
  }

  /**
   * Make a request to the Tesla Fleet API.
   * @param method
   * @param path
   * @param params Query parameters; null and undefined values are dropped.
   * @param json Body; null and undefined values are dropped, and a GET sends none.
   * @returns The decoded JSON body.
   * @throws `MissingToken` when there is no access token, a `TeslaFleetError`
   * subclass for an error status, or `TeslaFleetConnectionError` (with the
   * original error as `cause`) when the request could not complete or timed out.
   */
  async _request(
    method: Method,
    path: string,
    params: Record<string, any> | null = null,
    json: Record<string, any> | null = null,
  ): Promise<any> {
    // Trailing path segment (e.g. "door_lock", "vehicle_data") as the log's command name.
    const command = path.slice(path.lastIndexOf("/") + 1);

    let data: any;
    try {
      if (!this.server) {
        throw new Error("Server was not set at init. Call find_server() first.");
      }

      if (method === "GET") {
        json = null;
      }

      const accessToken = await this.access_token();

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "X-Library": `node tesla_fleet_api ${__VERSION__}`,
      };

      // Remove null and undefined values from params and json
      const query = new URLSearchParams();
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value != null) {
            query.append(key, typeof value === "boolean" ? (value ? "true" : "false") : String(value));
          }
        }
        this._log(`Parameters: ${query.toString()}`);
      }
      let body: string | null = null;
      if (json) {
        json = Object.fromEntries(Object.entries(json).filter(([_, v]) => v != null));
        body = JSON.stringify(json);
        this._log(`Body: ${body}`);
        headers["Content-Type"] = "application/json";
      }

      const search = query.size ? `?${query.toString()}` : "";
      const url = `${this.server}/${path}${search}`;

      try {
        const resp = await this._fetch(url, {
          method,
          headers,
          body,
          signal: this.timeout != null ? AbortSignal.timeout(this.timeout) : null,
        });
        this._log(`Status ${resp.status} from ${url}`);
        for (const [header, label] of [
          ["x-txid", "Response TXID"],
          ["RateLimit-Reset", "Rate limit reset"],
          ["Retry-After", "Retry after"],
        ]) {
          if (resp.headers.has(header)) {
            this._log(`${label}: ${resp.headers.get(header)}`);
          }
        }
        data = await this._response(resp);
      } catch (error) {
        if (error instanceof TeslaFleetError) {
          throw error;
        }
        throw new TeslaFleetConnectionError(null, null, { cause: error });
      }
      this._log(`Response JSON: ${JSON.stringify(data)}`);
    } catch (error) {
      logRequestError((m) => this._log(m), command, this._transport_name, error);
      throw error;
    }
    logRequestResult((m) => this._log(m), command, this._transport_name, data);
    return data;
  }

  /**
   * Returns `"ok"` if the API is operating normally. Sends no headers.
   */
  async status(): Promise<string> {
    if (!this.server) {
      throw new Error("Server was not set at init. Call find_server() first.");
    }
    const resp = await this._fetch(`${this.server}/status`);
    return resp.text();
  }

  /**
   * Generate a partner token using client credentials authentication, and use
   * it as the access token for later requests.
   * @param client_id Partner application client ID.
   * @param client_secret Partner application client secret.
   * @param scopes Scopes to request.
   * @returns The token response, including `access_token`.
   */
  async partner_login(
    client_id: string,
    client_secret: string,
    scopes: Scope[] = [Scope.OPENID],
  ): Promise<Record<string, any>> {
    if (!this.server) {
      throw new Error("Server was not set at init. Call find_server() first.");
    }

    const resp = await this._fetch(TOKEN_URLS[this.region ?? "na"], {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id,
        client_secret,
        audience: this.server,
        scope: scopes.join(" "),
      }),
    });
    await raise_for_status(resp);
    const tokenData = await resp.json();
    this.accessToken = tokenData.access_token;
    return tokenData;
  }

  /**
   * Returns products mapped to user.
   * @returns An array of products including both vehicles and energy sites.
   */
  async products(): Promise<ProductsResponse> {
    return this._request("GET", "api/1/products").then(
      ({ response }) => response,
    );
  }

  /**
   * Return Tesla products separated into vehicles and energy_sites
   * @returns A dictionary of vehicles and energy sites, each with an array of those products
   */
  async products_by_type(): Promise<ProductsByType> {
    return this.products().then((products) => ({
      vehicles: products.filter(
        (product): product is VehicleProduct => "vin" in product,
      ),
      energy_sites: products.filter(
        (product): product is EnergyProduct => "energy_site_id" in product,
      ),
    }));
  }

  async loadPrivateKey(path: string): Promise<void> {
    // Try read file, if not create it
    return (await import("fs")).promises.readFile(path, "utf8").then((key) => {
      this.accessToken = key;
    }
    ).catch(async () => {
      // Create SECP256R1 private key and save it as a pem file at path
      const { privateKey: _privateKey } = (await import("crypto")).generateKeyPairSync("ec", {
        namedCurve: "secp256r1",
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });
    });
  }
}
