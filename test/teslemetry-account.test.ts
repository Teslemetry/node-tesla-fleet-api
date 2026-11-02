import { describe, expect, it, vi } from "vitest";
import { InvalidResponse, TeslaFleetConnectionError, TeslemetryRegistrationError } from "../src/exceptions.js";
import Teslemetry, { REGISTER_URL, register_client } from "../src/teslemetry.js";

const VIN = "5YJ3E1EA1JF000001";
const TOKEN = "secret-access-token-0123456789";

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function fakeFetch(respond: () => Response | Promise<Response> = () => jsonResponse({ response: true })) {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => respond());
}

function makeApi(fetch: ReturnType<typeof fakeFetch>, region: "api" | "na" = "api") {
    return new Teslemetry(TOKEN, region, { fetch: fetch as unknown as typeof globalThis.fetch });
}

/** The single request sent: verb, URL and decoded body. */
function sent(fetch: ReturnType<typeof fakeFetch>) {
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    return { method: init?.method, url, body: init?.body == null ? undefined : JSON.parse(init.body as string) };
}

describe("Teslemetry account routes", () => {
    const server = "https://api.teslemetry.com";
    const routes: [string, (api: Teslemetry) => Promise<unknown>, string, string, unknown?][] = [
        ["ping", (api) => api.ping(), "GET", "api/ping"],
        ["test", (api) => api.test(), "GET", "api/test"],
        ["userdata", (api) => api.userdata(), "GET", "api/userdata"],
        ["vehicle_data_refresh", (api) => api.vehicle_data_refresh(VIN), "GET", `api/refresh/${VIN}`],
        ["fields", (api) => api.fields(), "GET", "fields.json"],
        ["vehicle_config", (api) => api.vehicle_config(VIN), "GET", `api/vehicle_config/${VIN}`],
        ["streaming_config", (api) => api.streaming_config(VIN), "GET", `api/config/${VIN}`],
        ["stop_streaming", (api) => api.stop_streaming(VIN), "DELETE", `api/config/${VIN}`],
        ["modify_streaming_config", (api) => api.modify_streaming_config(VIN, { Soc: { interval_seconds: 60 } }), "PATCH", `api/config/${VIN}`, { fields: { Soc: { interval_seconds: 60 } } }],
        ["create_streaming_config", (api) => api.create_streaming_config(VIN, { Soc: { interval_seconds: 60 } }), "POST", `api/config/${VIN}`, { fields: { Soc: { interval_seconds: 60 } } }],
    ];

    it.each(routes)("%s", async (_name, call, method, path, body) => {
        const fetch = fakeFetch();

        await expect(call(makeApi(fetch))).resolves.toEqual({ response: true });
        expect(sent(fetch)).toEqual({ method, url: `${server}/${path}`, body });
    });

    it.each([
        [true, "POST"],
        [false, "DELETE"],
        [undefined, "GET"],
    ])("server_side_polling(%s) unwraps the response from %s", async (value, method) => {
        const fetch = fakeFetch(() => jsonResponse({ response: false }));

        await expect(makeApi(fetch).server_side_polling(VIN, value)).resolves.toBe(false);
        expect(sent(fetch)).toEqual({ method, url: `${server}/api/auto/${VIN}`, body: undefined });
    });

    it("has no partner, and has a user", () => {
        const api = makeApi(fakeFetch());
        expect(api.partner).toBeUndefined();
        expect(api.user).toBeDefined();
    });
});

describe("Teslemetry metadata", () => {
    const metadata = { uid: "u", region: "EU", scopes: ["vehicle_cmds"], vins: [] };

    it("sets region and server with update_region", async () => {
        const api = makeApi(fakeFetch(() => jsonResponse(metadata)));

        await expect(api.metadata(true)).resolves.toEqual(metadata);
        expect(api.region).toBe("eu");
        expect(api.server).toBe("https://eu.teslemetry.com");
    });

    it("leaves region and server alone without update_region", async () => {
        const api = makeApi(fakeFetch(() => jsonResponse(metadata)));

        await api.metadata(false);
        expect(api.region).toBeNull();
        expect(api.server).toBe("https://api.teslemetry.com");
    });

    it("scopes() reads the metadata without changing the server", async () => {
        const api = makeApi(fakeFetch(() => jsonResponse(metadata)));

        await expect(api.scopes()).resolves.toEqual(["vehicle_cmds"]);
        expect(api.server).toBe("https://api.teslemetry.com");
    });

    it("find_server() moves to the account's region", async () => {
        const api = makeApi(fakeFetch(() => jsonResponse(metadata)));

        await expect(api.find_server()).resolves.toBe("eu");
        expect(api.server).toBe("https://eu.teslemetry.com");
    });
});

describe("migrate_to_oauth", () => {
    it("posts the trimmed token and returns expires_at", async () => {
        vi.useFakeTimers({ now: 1_700_000_000_000 });
        try {
            const fetch = fakeFetch(() => jsonResponse({ access_token: "new", refresh_token: "r", expires_in: "3600" }));
            const api = new Teslemetry(`  ${TOKEN}\n`, "api", { fetch: fetch as unknown as typeof globalThis.fetch });

            await expect(api.migrate_to_oauth("my-client", "My Home")).resolves.toEqual({
                access_token: "new",
                refresh_token: "r",
                expires_in: 3600,
                expires_at: 1_700_003_600,
            });
            expect(sent(fetch)).toEqual({
                method: "POST",
                url: "https://api.teslemetry.com/oauth/token",
                body: { grant_type: "migrate", client_id: "my-client", access_token: TOKEN, name: "My Home" },
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it("defaults client_id and drops an unset name", async () => {
        const fetch = fakeFetch(() => jsonResponse({ expires_in: 60 }));

        await makeApi(fetch).migrate_to_oauth();
        expect(sent(fetch).body).toEqual({ grant_type: "migrate", client_id: "homeassistant", access_token: TOKEN });
    });

    it.each([[{}], [{ expires_in: null }], [{ expires_in: "soon" }]])("rejects %j", async (body) => {
        await expect(makeApi(fakeFetch(() => jsonResponse(body))).migrate_to_oauth()).rejects.toBeInstanceOf(InvalidResponse);
    });

    it("keeps both tokens out of the log", async () => {
        const lines: string[] = [];
        const fetch = fakeFetch(() => jsonResponse({ access_token: "new-token-value", refresh_token: "refresh-token-value", expires_in: 60 }));
        const api = new Teslemetry(TOKEN, "api", {
            fetch: fetch as unknown as typeof globalThis.fetch,
            logger: { debug: (line) => lines.push(line) },
        });

        await api.migrate_to_oauth();
        const log = lines.join("\n");
        expect(log).toContain("Body:");
        expect(log).toContain("Response JSON:");
        expect(log).not.toContain(TOKEN);
        expect(log).not.toContain("new-token-value");
        expect(log).not.toContain("refresh-token-value");
    });
});

describe("request logging", () => {
    it("keeps a PIN out of the log, in a query or a body", async () => {
        const lines: string[] = [];
        const api = new Teslemetry(TOKEN, "api", {
            fetch: fakeFetch() as unknown as typeof globalThis.fetch,
            logger: { debug: (line) => lines.push(line) },
        });

        await api._request("POST", `${VIN}/command/enable_valet`, { pin: "4821", max_attempts: 3 });
        await api._request("POST", `api/1/vehicles/${VIN}/command/set_pin_to_drive`, null, { on: true, pin: "4821" });
        const log = lines.join("\n");
        expect(log).toContain("max_attempts=3");
        expect(log).not.toContain("4821");
    });
});

describe("register_client", () => {
    const registerFetch = (respond: () => Response | Promise<Response>) => {
        const fetch = fakeFetch(respond);
        return { fetch, options: { fetch: fetch as unknown as typeof globalThis.fetch } };
    };

    it("registers a new client", async () => {
        const { fetch, options } = registerFetch(() => jsonResponse({ client_id: "new-client-id" }));

        await expect(register_client("Home Assistant", "home-assistant", "2026.1.0", options)).resolves.toEqual({
            client_id: "new-client-id",
            raw: { client_id: "new-client-id" },
        });
        expect(sent(fetch)).toEqual({
            method: "POST",
            url: REGISTER_URL,
            body: { client_name: "Home Assistant", software_id: "home-assistant", software_version: "2026.1.0" },
        });
        expect(REGISTER_URL).toBe("https://api.teslemetry.com/oauth/register");
    });

    it("server-rejected registration raises with the status", async () => {
        const { options } = registerFetch(() => jsonResponse({}, 400));

        const error = await register_client("HA", "ha", "1", options).catch((e) => e);
        expect(error).toBeInstanceOf(TeslemetryRegistrationError);
        expect(error.status).toBe(400);
    });

    it("connection error raises with the cause", async () => {
        const cause = new TypeError("fetch failed");
        const { options } = registerFetch(() => Promise.reject(cause));

        const error = await register_client("HA", "ha", "1", options).catch((e) => e);
        expect(error).toBeInstanceOf(TeslemetryRegistrationError);
        expect(error).not.toBeInstanceOf(TeslaFleetConnectionError);
        expect(error.cause).toBe(cause);
    });

    it("timeout raises", async () => {
        const { options } = registerFetch(() => Promise.reject(new DOMException("timed out", "TimeoutError")));

        await expect(register_client("HA", "ha", "1", options)).rejects.toBeInstanceOf(TeslemetryRegistrationError);
    });

    it("non-JSON body raises", async () => {
        const { options } = registerFetch(() => new Response("<html>", { status: 200 }));

        const error = await register_client("HA", "ha", "1", options).catch((e) => e);
        expect(error).toBeInstanceOf(TeslemetryRegistrationError);
        expect(error.data).toBe("Teslemetry returned a malformed registration response");
    });

    it.each([
        ["missing client_id", {}],
        ["non-string client_id", { client_id: 12345 }],
        ["empty client_id", { client_id: "" }],
        ["non-object body", ["unexpected", "list", "body"]],
        ["null body", null],
    ])("%s raises", async (_name, body) => {
        const { options } = registerFetch(() => jsonResponse(body));

        const error = await register_client("HA", "ha", "1", options).catch((e) => e);
        expect(error).toBeInstanceOf(TeslemetryRegistrationError);
        expect(error.data).toBe("Teslemetry registration response did not contain a client_id");
    });
});
