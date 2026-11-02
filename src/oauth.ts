import { Method, Region, SERVERS, Scope, TOKEN_URLS, is_valid_region } from "./const.js";
import { InvalidResponse, MissingToken, TeslaFleetConnectionError, TeslaFleetError } from "./exceptions.js";
import { Logger } from "./log.js";
import TeslaFleetApi from "./teslafleetapi.js";

export type TeslaFleetOAuthOptions = {
  region: Region;
  client_id: string;
  /** Needed only to exchange an authorization code. */
  client_secret?: string;
  redirect_uri?: string;
  access_token?: string;
  refresh_token?: string;
  /** Expiry of `access_token`, in epoch seconds as `TeslaFleetOAuth.expires`. */
  expires?: number;
  debug?: boolean;
  logger?: Logger;
  fetch?: typeof fetch;
  timeout?: number;
};

/** What a refresh hands back for the caller to persist. */
export type RefreshedToken = {
  refresh_token: string;
  /** Epoch seconds. */
  expires: number;
};

function nowSeconds(): number {
  return Date.now() / 1000;
}

/** The fields every token reply needs; a reply without them must not replace a working token. */
function tokenFrom(data: any): { access_token: string; expires: number } {
  if (typeof data?.access_token !== "string" || typeof data.expires_in !== "number") {
    throw new InvalidResponse();
  }
  return { access_token: data.access_token, expires: Math.floor(nowSeconds()) + data.expires_in };
}

/**
 * Tesla Fleet API client that signs a user in with OAuth and keeps its access
 * token fresh. `expires` is in epoch seconds, as in Python, so a stored
 * token works with either library.
 */
export default class TeslaFleetOAuth extends TeslaFleetApi {
  readonly client_id: string;
  redirect_uri: string | null;
  refresh_token: string | null;
  /** Expiry of the access token, in epoch seconds. */
  expires: number;
  #client_secret: string | null;
  // Tesla's refresh tokens are single use, so concurrent requests must share one refresh.
  #refreshing: Promise<RefreshedToken> | null = null;

  constructor(options: TeslaFleetOAuthOptions) {
    if (!is_valid_region(options.region)) {
      throw new Error("Invalid region");
    }
    const { region, client_id, client_secret, redirect_uri, access_token, refresh_token, expires, ...rest } = options;
    super({ ...rest, region, accessToken: access_token });
    this.client_id = client_id;
    this.#client_secret = client_secret ?? null;
    this.redirect_uri = redirect_uri ?? null;
    this.refresh_token = refresh_token ?? null;
    this.expires = expires ?? 0;
  }

  /**
   * The URL to send the user to, built exactly as Python builds it: values are
   * not URL-encoded.
   * @param scopes Scopes to request.
   * @param state Value Tesla echoes back on the redirect.
   */
  get_login_url(scopes: Scope[], state: string = "login"): string {
    if (this.redirect_uri == null) {
      throw new Error("Redirect URI is missing");
    }
    const domain = this.region === "cn" ? "auth.tesla.cn" : "auth.tesla.com";
    return `https://${domain}/oauth2/v3/authorize?response_type=code&client_id=${this.client_id}&redirect_uri=${this.redirect_uri}&scope=${scopes.join("+")}&state=${state}`;
  }

  /**
   * Exchange an authorization code for tokens. A code prefixed with a region
   * (e.g. `NA_...`) also selects that region's server.
   * @param code The code from the login redirect.
   */
  async get_refresh_token(code: string): Promise<void> {
    if (this.#client_secret == null) {
      throw new Error("Client secret is missing");
    }
    if (this.redirect_uri == null) {
      throw new Error("Redirect URI is missing");
    }
    this.server ??= SERVERS[this.region ?? "na"];

    const data = await this.#token({
      grant_type: "authorization_code",
      client_id: this.client_id,
      client_secret: this.#client_secret,
      code,
      audience: this.server,
      redirect_uri: this.redirect_uri,
    });
    const { access_token, expires } = tokenFrom(data);
    this.refresh_token = data.refresh_token ?? null;
    this.accessToken = access_token;
    this.expires = expires;

    const region = code.split("_")[0].toLowerCase();
    if (is_valid_region(region)) {
      this.server = SERVERS[region];
    }
  }

  /**
   * The current access token, refreshed first when `expires` has passed.
   * @throws MissingToken when there is no token and none can be refreshed.
   */
  override async access_token(): Promise<string> {
    if (this.expires < nowSeconds()) {
      await this.refresh_access_token();
    }
    if (this.accessToken && typeof this.accessToken === "string") {
      return this.accessToken;
    }
    throw new MissingToken("Access token is missing");
  }

  /**
   * Refresh the access token if it is missing or expired.
   * @returns The refreshed token to persist, or `null` when none was needed.
   */
  async check_access_token(): Promise<RefreshedToken | null> {
    if (this.accessToken && this.expires > nowSeconds()) {
      return null;
    }
    return this.refresh_access_token();
  }

  /**
   * Refresh the access token. Tesla rotates the refresh token, so persist what
   * this returns.
   * @throws MissingToken without a refresh token, or the `TeslaFleetError`
   * matching the failure, e.g. `LoginRequired`.
   */
  refresh_access_token(): Promise<RefreshedToken> {
    this.#refreshing ??= this.#refresh().finally(() => {
      this.#refreshing = null;
    });
    return this.#refreshing;
  }

  async #refresh(): Promise<RefreshedToken> {
    if (!this.refresh_token) {
      throw new MissingToken("Refresh token is missing");
    }
    const data = await this.#token({
      grant_type: "refresh_token",
      client_id: this.client_id,
      refresh_token: this.refresh_token,
    });
    const { access_token, expires } = tokenFrom(data);
    if (typeof data.refresh_token !== "string") {
      throw new InvalidResponse();
    }
    this.accessToken = access_token;
    this.refresh_token = data.refresh_token;
    this.expires = expires;
    return { refresh_token: data.refresh_token, expires };
  }

  /** POST a form to the region's token endpoint. Bypasses `_request`, which would log the reply. */
  async #token(form: Record<string, string>): Promise<any> {
    try {
      const resp = await this._fetch(TOKEN_URLS[this.region ?? "na"], {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(form),
        signal: this.timeout != null ? AbortSignal.timeout(this.timeout) : null,
      });
      return await this._response(resp);
    } catch (error) {
      if (error instanceof TeslaFleetError) {
        throw error;
      }
      throw new TeslaFleetConnectionError(null, null, { cause: error });
    }
  }

  override async _request(
    method: Method,
    path: string,
    params: Record<string, any> | null = null,
    json: Record<string, any> | null = null,
  ): Promise<any> {
    await this.check_access_token();
    return super._request(method, path, params, json);
  }
}
