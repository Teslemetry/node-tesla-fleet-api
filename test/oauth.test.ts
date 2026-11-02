import { describe, expect, it, vi } from "vitest";
import { SERVERS, Scope } from "../src/const.js";
import { InvalidResponse, LoginRequired, MissingToken, TeslaFleetConnectionError } from "../src/exceptions.js";
import { TeslaFleetOAuth } from "../src/index.js";
import TeslaFleetApi from "../src/teslafleetapi.js";

const GLOBAL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const CN = "https://auth.tesla.cn/oauth2/v3/token";
const REDIRECT = "https://example.com/cb";
const PRODUCTS = "https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/products";

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Answers the token endpoint with `token()`, and anything else with an empty product list. */
function fakeFetch(token: () => Response | Promise<Response> = () => json({ access_token: "new-access", refresh_token: "new-refresh", expires_in: 60 })) {
    return vi.fn(async (url: string, _init?: RequestInit) => (url.includes("/oauth2/") ? token() : json({ response: [] })));
}

function makeApi(fetch: ReturnType<typeof fakeFetch>, options: Partial<ConstructorParameters<typeof TeslaFleetOAuth>[0]> = {}) {
    return new TeslaFleetOAuth({ region: "na", client_id: "id", client_secret: "client-secret", redirect_uri: REDIRECT, fetch, ...options });
}

function formOf(fetch: ReturnType<typeof fakeFetch>, call = 0): Record<string, string> {
    return Object.fromEntries(fetch.mock.calls[call][1]?.body as URLSearchParams);
}

function tokenCalls(fetch: ReturnType<typeof fakeFetch>): string[] {
    return fetch.mock.calls.map(([url]) => url).filter((url) => url.includes("/oauth2/"));
}

const future = () => Math.floor(Date.now() / 1000) + 3600;
const past = () => Math.floor(Date.now() / 1000) - 3600;

describe("construction", () => {
    it("rejects an invalid region", () => {
        expect(() => new TeslaFleetOAuth({ region: "mars" as "na", client_id: "id" })).toThrow("Invalid region");
    });

    it("is a TeslaFleetApi on the region's server", () => {
        const api = new TeslaFleetOAuth({ region: "eu", client_id: "id" });
        expect(api).toBeInstanceOf(TeslaFleetApi);
        expect(api.server).toBe(SERVERS.eu);
    });

    it("keeps the client secret off the instance", () => {
        const api = makeApi(fakeFetch());
        expect(Object.values(api)).not.toContain("client-secret");
    });
});

describe("get_login_url", () => {
    it("uses auth.tesla.com outside China", () => {
        for (const region of ["na", "eu"] as const) {
            expect(makeApi(fakeFetch(), { region }).get_login_url([Scope.OPENID, Scope.OFFLINE_ACCESS])).toBe(
                `https://auth.tesla.com/oauth2/v3/authorize?response_type=code&client_id=id&redirect_uri=${REDIRECT}&scope=openid+offline_access&state=login`,
            );
        }
    });

    it("uses auth.tesla.cn in China, and takes a state", () => {
        expect(makeApi(fakeFetch(), { region: "cn" }).get_login_url([Scope.OPENID], "abc")).toBe(
            `https://auth.tesla.cn/oauth2/v3/authorize?response_type=code&client_id=id&redirect_uri=${REDIRECT}&scope=openid&state=abc`,
        );
    });

    it("needs a redirect URI", () => {
        expect(() => makeApi(fakeFetch(), { redirect_uri: undefined }).get_login_url([Scope.OPENID])).toThrow("Redirect URI is missing");
    });
});

// Python test_oauth_token_host.py
describe("token host", () => {
    it.each([
        ["na", GLOBAL],
        ["eu", GLOBAL],
        ["cn", CN],
    ] as const)("follows region %s for code exchange and refresh", async (region, expected) => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { region });
        await api.get_refresh_token("code");
        await api.refresh_access_token();
        expect(tokenCalls(fetch)).toEqual([expected, expected]);
    });

    it.each([
        ["na", GLOBAL],
        ["cn", CN],
    ] as const)("follows region %s for partner_login", async (region, expected) => {
        const fetch = fakeFetch();
        const api = new TeslaFleetApi({ accessToken: "t", region, fetch });
        await api.partner_login("id", "secret");
        expect(tokenCalls(fetch)).toEqual([expected]);
    });
});

describe("get_refresh_token", () => {
    it("posts the authorization code and keeps the tokens", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch);
        const before = Math.floor(Date.now() / 1000);

        await api.get_refresh_token("code");

        expect(formOf(fetch)).toEqual({
            grant_type: "authorization_code",
            client_id: "id",
            client_secret: "client-secret",
            code: "code",
            audience: SERVERS.na,
            redirect_uri: REDIRECT,
        });
        expect(new Headers(fetch.mock.calls[0][1]?.headers).get("Content-Type")).toBe("application/x-www-form-urlencoded");
        expect(api.refresh_token).toBe("new-refresh");
        expect(await api.access_token()).toBe("new-access");
        expect(api.expires).toBeGreaterThanOrEqual(before + 60);
    });

    it("moves to the server named by the code, leaving the token host alone", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { region: "cn" });
        await api.get_refresh_token("EU_abc");
        expect(api.server).toBe(SERVERS.eu);
        expect(api.region).toBe("cn");
        expect(tokenCalls(fetch)).toEqual([CN]);
    });

    it("stays on its server for a code without a valid region", async () => {
        const api = makeApi(fakeFetch(), { region: "eu" });
        await api.get_refresh_token("xx_abc");
        expect(api.server).toBe(SERVERS.eu);
    });

    it("needs a client secret and a redirect URI", async () => {
        await expect(makeApi(fakeFetch(), { client_secret: undefined }).get_refresh_token("code")).rejects.toThrow("Client secret is missing");
        await expect(makeApi(fakeFetch(), { redirect_uri: undefined }).get_refresh_token("code")).rejects.toThrow("Redirect URI is missing");
    });

    it("raises when the exchange is refused, keeping no token", async () => {
        const api = makeApi(fakeFetch(() => json({ error: "login_required" }, 401)));
        await expect(api.get_refresh_token("code")).rejects.toBeInstanceOf(LoginRequired);
        expect(api.refresh_token).toBeNull();
    });
});

describe("refresh", () => {
    it("runs on a request once expires is past, and the request uses the new token", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { access_token: "old-access", refresh_token: "old-refresh", expires: past() });

        await api.products();

        expect(formOf(fetch)).toEqual({ grant_type: "refresh_token", client_id: "id", refresh_token: "old-refresh" });
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch.mock.calls[1][0]).toBe(PRODUCTS);
        expect(new Headers(fetch.mock.calls[1][1]?.headers).get("Authorization")).toBe("Bearer new-access");
    });

    it("does not run while the token is valid", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { access_token: "old-access", refresh_token: "old-refresh", expires: future() });

        await api.products();

        expect(tokenCalls(fetch)).toEqual([]);
        expect(new Headers(fetch.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer old-access");
    });

    it("runs in access_token() when expires is past", async () => {
        const api = makeApi(fakeFetch(), { access_token: "old-access", refresh_token: "old-refresh", expires: past() });
        expect(await api.access_token()).toBe("new-access");
    });

    it("check_access_token returns null for a valid token, or the refreshed one", async () => {
        const valid = makeApi(fakeFetch(), { access_token: "old-access", refresh_token: "old-refresh", expires: future() });
        expect(await valid.check_access_token()).toBeNull();

        const stale = makeApi(fakeFetch(), { refresh_token: "old-refresh", expires: future() });
        expect(await stale.check_access_token()).toEqual({ refresh_token: "new-refresh", expires: stale.expires });
    });

    it("rotates the refresh token and returns what to persist", async () => {
        const api = makeApi(fakeFetch(), { refresh_token: "old-refresh" });
        const before = Math.floor(Date.now() / 1000);

        const result = await api.refresh_access_token();

        expect(result).toEqual({ refresh_token: "new-refresh", expires: api.expires });
        expect(api.refresh_token).toBe("new-refresh");
        expect(api.expires).toBeGreaterThanOrEqual(before + 60);
    });

    it("spends a single-use refresh token only once across concurrent requests", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { access_token: "old-access", refresh_token: "old-refresh", expires: past() });

        await Promise.all([api.products(), api.products(), api.products()]);

        expect(tokenCalls(fetch)).toHaveLength(1);
    });

    it("can refresh again after an earlier refresh failed", async () => {
        let attempts = 0;
        const fetch = fakeFetch(() => (++attempts === 1 ? json({ error: "login_required" }, 401) : json({ access_token: "a", refresh_token: "r", expires_in: 60 })));
        const api = makeApi(fetch, { refresh_token: "old-refresh" });

        await expect(api.refresh_access_token()).rejects.toBeInstanceOf(LoginRequired);
        await expect(api.refresh_access_token()).resolves.toMatchObject({ refresh_token: "r" });
    });
});

describe("refresh failure", () => {
    it("rejects the request without sending it, keeping the old tokens", async () => {
        const fetch = fakeFetch(() => json({ error: "login_required" }, 401));
        const api = makeApi(fetch, { access_token: "old-access", refresh_token: "old-refresh", expires: past() });

        await expect(api.products()).rejects.toBeInstanceOf(LoginRequired);

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(api.refresh_token).toBe("old-refresh");
        expect(api.accessToken).toBe("old-access");
    });

    it("raises MissingToken when there is no refresh token", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { access_token: "old-access", expires: past() });
        await expect(api.products()).rejects.toBeInstanceOf(MissingToken);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("wraps a fetch rejection", async () => {
        const cause = new Error("connection refused");
        const api = makeApi(fakeFetch(() => Promise.reject(cause)), { refresh_token: "old-refresh" });
        await expect(api.refresh_access_token()).rejects.toMatchObject({ constructor: TeslaFleetConnectionError, cause });
    });

    it("raises InvalidResponse for a reply missing a token, keeping the old ones", async () => {
        const api = makeApi(fakeFetch(() => json({ access_token: "a", expires_in: 60 })), { access_token: "old-access", refresh_token: "old-refresh" });
        await expect(api.refresh_access_token()).rejects.toBeInstanceOf(InvalidResponse);
        expect(api.refresh_token).toBe("old-refresh");
        expect(api.accessToken).toBe("old-access");
    });
});

describe("logging", () => {
    it("never logs a token or the client secret", async () => {
        const lines: string[] = [];
        const fetch = fakeFetch();
        const api = makeApi(fetch, {
            access_token: "old-access",
            refresh_token: "old-refresh",
            expires: past(),
            logger: { debug: (message) => lines.push(message) },
        });

        await api.get_refresh_token("code");
        api.expires = past();
        await api.products();

        expect(lines.length).toBeGreaterThan(0);
        expect(lines.join("\n")).not.toMatch(/new-access|new-refresh|old-access|old-refresh|client-secret/);
    });
});
