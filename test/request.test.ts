import { afterEach, describe, expect, it, vi } from "vitest";
import { UnsignedMessage, RKEActionE, ClosureMoveRequest, ClosureMoveTypeE } from "@teslemetry/tesla-protocol/command/vcsec";
import { Action, ChargingSetLimitAction, VehicleAction } from "@teslemetry/tesla-protocol/command/car_server";
import { infotainment_command_name, vcsec_command_name } from "../src/commands.js";
import { SERVERS, TOKEN_URLS } from "../src/const.js";
import { LibraryError, MissingToken, NotFound, ResponseError } from "../src/exceptions.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Teslemetry from "../src/teslemetry.js";
import Tessie from "../src/tessie.js";
import Vehicle from "../src/vehicle.js";
import { FakeVehicle } from "./helpers/fakevehicle.js";

const TOKEN = "secret-access-token-0123456789";
const SERVER = "https://fleet.example.com";
const VIN = "5YJXCAE43LF123456";
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

function fakeFetch(handler: Handler = () => json({ response: {} })) {
    return vi.fn(async (url: string, init?: RequestInit) => handler(url, init));
}

function capturingLogger() {
    const lines: string[] = [];
    return { lines, logger: { debug: (message: string) => lines.push(message) } };
}

function makeApi(fetch: ReturnType<typeof fakeFetch>, options: Partial<ConstructorParameters<typeof TeslaFleetApi>[0]> = {}) {
    return new TeslaFleetApi({ accessToken: TOKEN, server: SERVER, fetch, ...options });
}

function headersOf(fetch: ReturnType<typeof fakeFetch>, call = 0): Headers {
    return new Headers(fetch.mock.calls[call][1]?.headers);
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("access token", () => {
    it("calls a token function on every request", async () => {
        const fetch = fakeFetch();
        let n = 0;
        const api = makeApi(fetch, { accessToken: async () => `token-${++n}` });

        await api._request("GET", "api/1/products");
        await api._request("GET", "api/1/products");

        expect(headersOf(fetch, 0).get("Authorization")).toBe("Bearer token-1");
        expect(headersOf(fetch, 1).get("Authorization")).toBe("Bearer token-2");
    });

    it("raises MissingToken without sending when the token function returns null", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch, { accessToken: async () => null });

        await expect(api._request("GET", "api/1/products")).rejects.toBeInstanceOf(MissingToken);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("raises MissingToken when no token was given", async () => {
        const fetch = fakeFetch();
        const api = new TeslaFleetApi({ server: SERVER, fetch });

        await expect(api.access_token()).rejects.toBeInstanceOf(MissingToken);
        await expect(api._request("GET", "api/1/products")).rejects.toBeInstanceOf(MissingToken);
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("_request", () => {
    it("uses the injected fetch, not the global", async () => {
        const global = vi.fn();
        vi.stubGlobal("fetch", global);
        const fetch = fakeFetch(() => json({ response: [] }));

        await expect(makeApi(fetch)._request("GET", "api/1/products")).resolves.toEqual({ response: [] });
        expect(fetch).toHaveBeenCalledOnce();
        expect(global).not.toHaveBeenCalled();
    });

    it("sends no ? for an empty query", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch);

        await api._request("GET", "api/1/products");
        await api._request("GET", "api/1/products", {});
        await api._request("GET", "api/1/products", { a: null, b: undefined });

        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            `${SERVER}/api/1/products`,
            `${SERVER}/api/1/products`,
            `${SERVER}/api/1/products`,
        ]);
    });

    it("drops null params and lower-cases booleans in the query", async () => {
        const fetch = fakeFetch();

        await makeApi(fetch)._request("GET", "api/1/x", { a: true, b: false, c: null, d: 5, e: "s t" });

        expect(fetch.mock.calls[0][0]).toBe(`${SERVER}/api/1/x?a=true&b=false&d=5&e=s+t`);
    });

    it("sends Content-Type only with a body, and drops null body values", async () => {
        const fetch = fakeFetch();
        const api = makeApi(fetch);

        await api._request("POST", "api/1/vehicles/VIN/command/door_lock");
        await api._request("POST", "api/1/vehicles/VIN/command/set_temps", null, { driver_temp: 20, passenger_temp: null });

        expect(headersOf(fetch, 0).has("Content-Type")).toBe(false);
        expect(fetch.mock.calls[0][1]?.body).toBeNull();
        expect(headersOf(fetch, 1).get("Content-Type")).toBe("application/json");
        expect(fetch.mock.calls[1][1]?.body).toBe(JSON.stringify({ driver_temp: 20 }));
    });

    it("silently drops a body on a GET", async () => {
        const fetch = fakeFetch();

        await makeApi(fetch)._request("GET", "api/1/products", null, { x: 1 });

        expect(fetch.mock.calls[0][1]?.body).toBeNull();
        expect(headersOf(fetch).has("Content-Type")).toBe(false);
    });

    it("sends X-Library with the package version", async () => {
        const fetch = fakeFetch();
        const { version } = await import("../package.json", { with: { type: "json" } }).then((m) => m.default);

        await makeApi(fetch)._request("GET", "api/1/products");

        expect(headersOf(fetch).get("X-Library")).toBe(`node tesla_fleet_api ${version}`);
    });

    it("raises ResponseError for a non-JSON 2xx", async () => {
        const fetch = fakeFetch(() => new Response("<html>ok</html>", { status: 200, headers: { "Content-Type": "text/html" } }));

        const error = await makeApi(fetch)._request("GET", "api/1/products").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ResponseError);
        expect((error as ResponseError).status).toBe(200);
        expect((error as ResponseError).data).toBe("<html>ok</html>");
    });
});

describe("find_server", () => {
    it("walks SERVERS, continuing on InvalidRegion", async () => {
        const fetch = fakeFetch((url) =>
            url.startsWith(SERVERS.eu)
                ? json({ response: { region: "eu", fleet_api_base_url: SERVERS.eu } })
                : json({ error: "invalid_region" }, 421),
        );
        const api = new TeslaFleetApi({ accessToken: TOKEN, region: "na", fetch });

        await expect(api.find_server()).resolves.toBe("eu");

        expect(fetch.mock.calls.map(([url]) => url)).toEqual([
            `${SERVERS.na}/api/1/users/region`,
            `${SERVERS.eu}/api/1/users/region`,
        ]);
        expect(api.server).toBe(SERVERS.eu);
        expect(api.region).toBe("eu");
    });

    it("raises LibraryError when no server accepts the user", async () => {
        const fetch = fakeFetch(() => json({ error: "invalid_region" }, 421));
        const api = new TeslaFleetApi({ accessToken: TOKEN, region: "na", fetch });

        await expect(api.find_server()).rejects.toBeInstanceOf(LibraryError);
        expect(fetch).toHaveBeenCalledTimes(Object.keys(SERVERS).length);
    });

    it("stops on any error other than InvalidRegion", async () => {
        const fetch = fakeFetch(() => json({ error: "not found" }, 404));
        const api = new TeslaFleetApi({ accessToken: TOKEN, region: "na", fetch });

        await expect(api.find_server()).rejects.toBeInstanceOf(NotFound);
        expect(fetch).toHaveBeenCalledOnce();
    });

    it("uses metadata() on Teslemetry", async () => {
        const fetch = fakeFetch(() => json({ uid: "u", region: "EU", scopes: [], vins: [] }));
        const api = new Teslemetry(TOKEN, "api", { fetch });

        await expect(api.find_server()).resolves.toBe("eu");
        expect(api.server).toBe("https://eu.teslemetry.com");
        expect(api.region).toBe("eu");
    });

    it("is not supported on Tessie", async () => {
        await expect(new Tessie(TOKEN, { fetch: fakeFetch() }).find_server()).rejects.toBeInstanceOf(LibraryError);
    });
});

describe("status", () => {
    it("returns the body of /status without an Authorization header", async () => {
        const fetch = fakeFetch(() => new Response("ok"));

        await expect(makeApi(fetch).status()).resolves.toBe("ok");
        expect(fetch.mock.calls[0][0]).toBe(`${SERVER}/status`);
        expect(headersOf(fetch).has("Authorization")).toBe(false);
    });

    it("keeps Tessie's per-vehicle status", async () => {
        const fetch = fakeFetch((url) => (url.endsWith("/status") && !url.includes(VIN) ? new Response("ok") : json({ status: "asleep" })));
        const api = new Tessie(TOKEN, { fetch });

        await expect(api.status()).resolves.toBe("ok");
        await expect(api.status(VIN)).resolves.toBe("asleep");
        expect(fetch.mock.calls.map(([url]) => url)).toEqual(["https://api.tessie.com/status", `https://api.tessie.com/${VIN}/status`]);
    });
});

describe("partner_login", () => {
    it("posts client credentials to the region's token URL and keeps the token", async () => {
        const fetch = fakeFetch(() => json({ access_token: "partner-token", expires_in: 28800 }));
        const api = new TeslaFleetApi({ region: "eu", fetch });

        await expect(api.partner_login("id", "secret")).resolves.toEqual({ access_token: "partner-token", expires_in: 28800 });

        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe(TOKEN_URLS.eu);
        expect(init?.method).toBe("POST");
        expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({
            grant_type: "client_credentials",
            client_id: "id",
            client_secret: "secret",
            audience: SERVERS.eu,
            scope: "openid",
        });
        await expect(api.access_token()).resolves.toBe("partner-token");
    });

    it("raises the matching error for a rejected login", async () => {
        const fetch = fakeFetch(() => json({ error: "unauthorized_client" }, 400));
        const api = new TeslaFleetApi({ region: "na", fetch });

        await expect(api.partner_login("id", "bad", ["openid", "vehicle_device_data"])).rejects.toThrow();
        expect(new URLSearchParams(String(fetch.mock.calls[0][1]?.body)).get("scope")).toBe("openid vehicle_device_data");
    });
});

// Line shapes ported from python-tesla-fleet-api tests/test_command_logging.py.
describe("logging", () => {
    function hasLine(lines: string[], ...parts: string[]): boolean {
        return lines.some((line) => parts.every((part) => line.includes(part)));
    }

    it("logs a fleet command's result and reason", async () => {
        const { lines, logger } = capturingLogger();
        const api = makeApi(fakeFetch(() => json({ response: { result: true, reason: "" } })), { logger });

        await api._request("POST", "api/1/vehicles/VIN123/command/door_lock");

        expect(hasLine(lines, "command=door_lock", "transport=fleet", "result=true", "reason=")).toBe(true);
    });

    it("logs a command rejection's reason", async () => {
        const { lines, logger } = capturingLogger();
        const reason = "cabin comfort remote settings not enabled";
        const api = makeApi(fakeFetch(() => json({ response: { result: false, reason } })), { logger });

        await api._request("POST", "api/1/vehicles/VIN123/command/remote_seat_heater_request");

        expect(hasLine(lines, "command=remote_seat_heater_request", "transport=fleet", "result=false", `reason=${reason}`)).toBe(true);
    });

    it("logs plain success for a non-command reply", async () => {
        const { lines, logger } = capturingLogger();
        const api = makeApi(fakeFetch(() => json({ response: { vehicle_id: 123 } })), { logger });

        await api._request("GET", "api/1/vehicles/VIN123/vehicle_data");

        expect(hasLine(lines, "command=vehicle_data", "transport=fleet", "result=success")).toBe(true);
    });

    it("logs a failure with the error class name", async () => {
        const { lines, logger } = capturingLogger();
        const api = makeApi(fakeFetch(() => json({ error: "not found" }, 404)), { logger });

        await expect(api._request("POST", "api/1/vehicles/VIN123/command/door_lock")).rejects.toBeInstanceOf(NotFound);

        expect(hasLine(lines, "command=door_lock", "transport=fleet", "result=error", "NotFound")).toBe(true);
    });

    it("returns a null, list or scalar body unchanged, logging success", async () => {
        const { lines, logger } = capturingLogger();
        const bodies: unknown[] = [null, [{ id: 1 }], true];
        const api = makeApi(fakeFetch(() => json(bodies.shift())), { logger });

        await expect(api._request("GET", "api/1/vehicles/VIN123/list_authorized_clients")).resolves.toBeNull();
        await expect(api._request("GET", "api/1/vehicles/VIN123/clients")).resolves.toEqual([{ id: 1 }]);
        await expect(api._request("GET", "api/1/vehicles/VIN123/flag")).resolves.toBe(true);
        expect(hasLine(lines, "command=list_authorized_clients", "transport=fleet", "result=success")).toBe(true);
    });

    it("names the Teslemetry transport", async () => {
        const { lines, logger } = capturingLogger();
        const api = new Teslemetry(TOKEN, "api", { fetch: fakeFetch(() => json({ response: { result: true } })), logger });

        await api._request("POST", "api/1/vehicles/VIN123/command/door_lock");

        expect(hasLine(lines, "transport=teslemetry")).toBe(true);
    });

    it("names the Tessie transport and reads its top-level result", async () => {
        const { lines, logger } = capturingLogger();
        const api = new Tessie(TOKEN, { fetch: fakeFetch(() => json({ result: false, reason: "already_locked" })), logger });

        await api._request("POST", "vehicles/VIN123/command/door_lock");

        expect(hasLine(lines, "command=door_lock", "transport=tessie", "result=false", "reason=already_locked")).toBe(true);
    });

    it("logs a signed command by its protocol name", async () => {
        const { lines, logger } = capturingLogger();
        const fakeVehicle = new FakeVehicle();
        const fetch = fakeFetch((_url, init) => {
            const { routable_message } = JSON.parse(String(init?.body));
            return json({ response: fakeVehicle.handle(Buffer.from(routable_message, "base64")).toString("base64") });
        });
        const api = new TeslaFleetApi({ accessToken: TOKEN, region: "na", fetch, logger });

        await new Vehicle(api).createSigned(VIN, OUR_PRIVATE_KEY).door_lock();

        expect(hasLine(lines, "command=RKE_ACTION_LOCK", "transport=fleet", "result=true")).toBe(true);
        expect(hasLine(lines, "command=signed_command", "transport=fleet")).toBe(true);
    });

    it("logs through console.debug only when debug is set", async () => {
        const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
        try {
            await makeApi(fakeFetch())._request("GET", "api/1/products");
            expect(consoleDebug).not.toHaveBeenCalled();

            await makeApi(fakeFetch(), { debug: true })._request("GET", "api/1/products");
            expect(consoleDebug).toHaveBeenCalledWith(expect.stringContaining("command=products transport=fleet"));
        } finally {
            consoleDebug.mockRestore();
        }
    });

    it("never logs the token", async () => {
        const { lines, logger } = capturingLogger();
        const replies: Response[] = [
            json({ response: { result: true, reason: "" } }, 200, { "x-txid": "tx", "RateLimit-Reset": "1", "Retry-After": "2" }),
            json({ error: "not found" }, 404),
            new Response("<html>", { status: 200 }),
        ];
        const fetch = fakeFetch(() => replies.shift() ?? Promise.reject(new TypeError("fetch failed")));
        const api = makeApi(fetch, { logger, accessToken: async () => TOKEN });

        await api._request("POST", "api/1/vehicles/VIN123/command/set_temps", { q: true }, { driver_temp: 20 });
        for (let i = 0; i < 3; i++) {
            await api._request("GET", "api/1/products").catch(() => {});
        }
        await makeApi(fetch, { logger, accessToken: async () => null })._request("GET", "api/1/products").catch(() => {});

        expect(lines.length).toBeGreaterThan(10);
        for (const line of lines) {
            expect(line).not.toContain(TOKEN);
        }
    });
});

describe("command names", () => {
    it("names a VCSEC RKE action by its enum, and any other command by its field", () => {
        expect(vcsec_command_name(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_LOCK }))).toBe("RKE_ACTION_LOCK");
        expect(vcsec_command_name(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_UNLOCK }))).toBe("RKE_ACTION_UNLOCK");
        expect(
            vcsec_command_name(
                UnsignedMessage.create({ closureMoveRequest: ClosureMoveRequest.create({ rearTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE }) }),
            ),
        ).toBe("closureMoveRequest");
        expect(vcsec_command_name(UnsignedMessage.create({}))).toBe("unknown");
    });

    it("names an infotainment command by its VehicleAction field", () => {
        expect(
            infotainment_command_name(
                Action.create({ vehicleAction: VehicleAction.create({ chargingSetLimitAction: ChargingSetLimitAction.create({ percent: 80 }) }) }),
            ),
        ).toBe("chargingSetLimitAction");
        expect(infotainment_command_name(Action.create({}))).toBe("unknown");
        expect(infotainment_command_name(Action.create({ vehicleAction: VehicleAction.create({}) }))).toBe("unknown");
    });
});
