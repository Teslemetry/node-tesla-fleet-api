import { redactedJson } from "../src/log.js";
import { describe, expect, it, vi } from "vitest";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Teslemetry from "../src/teslemetry.js";
import Tessie from "../src/tessie.js";
import Vehicle from "../src/vehicle.js";

const VIN = "5YJXCAE43LF123456";
const TOKEN = "secret-access-token-0123456789";

function jsonReply(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function fakeFetch(reply: () => Response | Promise<Response> = () => jsonReply({ response: { result: true } })) {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => reply());
}

type FakeFetch = ReturnType<typeof fakeFetch>;

function capture() {
    const lines: string[] = [];
    return { lines, logger: { debug: (line: string) => void lines.push(line) } };
}

function fleet(fetch: FakeFetch, accessToken: string | (() => Promise<string | null>) = TOKEN) {
    const { lines, logger } = capture();
    const api = new TeslaFleetApi({ accessToken, region: "na", fetch: fetch as unknown as typeof globalThis.fetch, logger });
    return { api, lines };
}

function tessie(fetch: FakeFetch) {
    const { lines, logger } = capture();
    const api = new Tessie(TOKEN, { fetch: fetch as unknown as typeof globalThis.fetch, logger });
    return { api, lines };
}

function teslemetry(fetch: FakeFetch) {
    const { lines, logger } = capture();
    const api = new Teslemetry(TOKEN, "api", { fetch: fetch as unknown as typeof globalThis.fetch, logger });
    return { api, lines };
}

/** The lines must exist, and none may contain any of the secrets, or the bearer token. */
function expectClean(lines: string[], ...secrets: string[]) {
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
        expect(line).not.toContain(TOKEN);
        expect(line).not.toContain("Bearer");
        for (const secret of secrets) {
            expect(line).not.toContain(secret);
        }
    }
}

function bodySent(fetch: FakeFetch, n = 0) {
    return JSON.parse(fetch.mock.calls[n][1]?.body as string);
}

describe("request bodies", () => {
    it.each([["pin"], ["password"], ["token"]])("redacts %s in the log but sends it", async (key) => {
        const fetch = fakeFetch();
        const { api, lines } = fleet(fetch);

        await api._request("POST", "api/1/x", null, { on: true, [key]: "4821" });

        expectClean(lines, "4821");
        expect(lines.some((line) => line.startsWith("Body:") && line.includes('"on":true') && line.includes("[redacted]"))).toBe(true);
        expect(bodySent(fetch)).toEqual({ on: true, [key]: "4821" });
    });

    it.each(["routable_message", "routableMessage"])("redacts %s, which is replayable until it expires", (key) => {
        const line = redactedJson({ data: { [key]: "c2lnbmVk", target_id: "din" } });
        expect(line).not.toContain("c2lnbmVk");
        expect(line).toContain("[redacted]");
        expect(line).toContain("target_id");
    });

    it("redacts a nested key", async () => {
        const fetch = fakeFetch();
        const { api, lines } = fleet(fetch);

        await api._request("POST", "api/1/x", null, { outer: [{ pin: "4821" }] });

        expectClean(lines, "4821");
        expect(bodySent(fetch)).toEqual({ outer: [{ pin: "4821" }] });
    });

    it("redacts whatever the case or separator of the key", async () => {
        const { api, lines } = fleet(fakeFetch());

        await api._request("POST", "api/1/x", null, { accessToken: "aaaa", "Refresh-Token": "bbbb", PIN: "cccc" });

        expectClean(lines, "aaaa", "bbbb", "cccc");
    });

    it("leaves keys that only resemble a secret", async () => {
        const { api, lines } = fleet(fakeFetch());

        await api._request("POST", "api/1/x", null, { pin_to_drive_enabled: true, valet_pin_needed: false });

        expect(lines.join("\n")).toContain('"pin_to_drive_enabled":true');
        expect(lines.join("\n")).toContain('"valet_pin_needed":false');
    });
});

describe("the Fleet commands that carry a PIN", () => {
    it.each<[string, (vehicles: Vehicle) => Promise<unknown>]>([
        ["set_pin_to_drive", (v) => v.set_pin_to_drive(VIN, true, 4821)],
        ["set_valet_mode", (v) => v.set_valet_mode(VIN, true, 4821)],
        ["speed_limit_activate", (v) => v.speed_limit_activate(VIN, 4821)],
        ["speed_limit_deactivate", (v) => v.speed_limit_deactivate(VIN, 4821)],
        ["speed_limit_clear_pin", (v) => v.speed_limit_clear_pin(VIN, 4821)],
        ["clear_pin_to_drive_admin", (v) => v.clear_pin_to_drive_admin(VIN, 4821)],
    ])("%s", async (_name, call) => {
        const fetch = fakeFetch();
        const { api, lines } = fleet(fetch);

        await call(api.vehicles!);

        expectClean(lines, "4821");
        expect(Object.values(bodySent(fetch))).toContain("4821");
    });

    it("trigger_homelink's token", async () => {
        const fetch = fakeFetch();
        const { api, lines } = fleet(fetch);

        await api.vehicles!.trigger_homelink(VIN, "homelink-token-value", 1, 2);

        expectClean(lines, "homelink-token-value");
        expect(bodySent(fetch).token).toBe("homelink-token-value");
    });
});

describe("query parameters", () => {
    it("redacts a Tessie PIN in the log but sends it", async () => {
        const fetch = fakeFetch(() => jsonReply({ result: true }));
        const { api, lines } = tessie(fetch);

        await api.vehicles.create(VIN).enable_valet(4821);

        expectClean(lines, "4821");
        expect(lines.join("\n")).toContain("pin=%5Bredacted%5D");
        expect(lines.join("\n")).toContain("max_attempts=3");
        expect(new URL(fetch.mock.calls[0][0] as string).searchParams.get("pin")).toBe("4821");
    });

    it.each([
        ["enable_speed_limit", (v: ReturnType<Tessie["vehicles"]["create"]>) => v.enable_speed_limit(4821)],
        ["disable_speed_limit", (v: ReturnType<Tessie["vehicles"]["create"]>) => v.disable_speed_limit(4821)],
        ["clear_speed_limit_pin", (v: ReturnType<Tessie["vehicles"]["create"]>) => v.clear_speed_limit_pin(4821)],
        ["disable_valet", (v: ReturnType<Tessie["vehicles"]["create"]>) => v.disable_valet(4821)],
    ])("%s", async (_name, call) => {
        const { api, lines } = tessie(fakeFetch(() => jsonReply({ result: true })));

        await call(api.vehicles.create(VIN));

        expectClean(lines, "4821");
    });

    it("keeps the query string out of the Status line", async () => {
        const { api, lines } = tessie(fakeFetch(() => jsonReply({ result: true })));

        await api._request("POST", `${VIN}/command/enable_valet`, { pin: "4821", max_attempts: 3 });

        const status = lines.find((line) => line.startsWith("Status "));
        expect(status).toBe(`Status 200 from https://api.tessie.com/${VIN}/command/enable_valet`);
    });
});

describe("reply bodies", () => {
    it.each([["access_token"], ["refresh_token"], ["client_secret"], ["id_token"]])("redacts a nested %s", async (key) => {
        const { api, lines } = fleet(fakeFetch(() => jsonReply({ response: { outer: [{ [key]: "secret-value" }], visible: 1 } })));

        await expect(api._request("GET", "api/1/x")).resolves.toEqual({ response: { outer: [{ [key]: "secret-value" }], visible: 1 } });

        expectClean(lines, "secret-value");
        expect(lines.join("\n")).toContain('"visible":1');
    });

    it("redacts the vehicle tokens list", async () => {
        const { api, lines } = fleet(fakeFetch(() => jsonReply({ response: { vin: VIN, tokens: ["mobile-a", "mobile-b"] } })));

        await api._request("GET", `api/1/vehicles/${VIN}`);

        expectClean(lines, "mobile-a", "mobile-b");
    });
});

describe("migrate_to_oauth", () => {
    it("logs neither token, and sends the old one", async () => {
        const fetch = fakeFetch(() => jsonReply({ access_token: "new-access-value", refresh_token: "new-refresh-value", id_token: "new-id-value", expires_in: 60 }));
        const { api, lines } = teslemetry(fetch);

        await expect(api.migrate_to_oauth()).resolves.toMatchObject({ access_token: "new-access-value", refresh_token: "new-refresh-value" });

        expectClean(lines, "new-access-value", "new-refresh-value", "new-id-value");
        expect(bodySent(fetch).access_token).toBe(TOKEN);
    });
});

describe("the wire", () => {
    it("sends the Authorization header, and no log line holds it", async () => {
        const fetch = fakeFetch();
        const { api, lines } = fleet(fetch);

        await api._request("POST", "api/1/x", { q: 1 }, { on: true });

        expect(new Headers(fetch.mock.calls[0][1]?.headers).get("Authorization")).toBe(`Bearer ${TOKEN}`);
        expectClean(lines);
    });
});

describe("failures", () => {
    it("keeps an error reply's body out of the log", async () => {
        const { api, lines } = fleet(fakeFetch(() => jsonReply({ error: "bad", access_token: "secret-value", pin: "4821" }, 400)));

        const error = await api._request("POST", "api/1/x", null, { pin: "4821" }).catch((e) => e);

        expect(error.data.access_token).toBe("secret-value");
        expectClean(lines, "secret-value", "4821");
        expect(lines.some((line) => line.includes("result=error") && line.includes("InvalidRequest"))).toBe(true);
    });

    it("keeps a non-JSON reply's body out of the log", async () => {
        const { api, lines } = fleet(fakeFetch(() => new Response("access_token=secret-value", { status: 200 })));

        await expect(api._request("GET", "api/1/x")).rejects.toThrow();

        expectClean(lines, "secret-value");
    });

    it("keeps a connection failure's cause out of the log", async () => {
        const failure = new TypeError(`fetch failed for https://api.tessie.com/${VIN}/command/enable_valet?pin=4821`);
        const { api, lines } = tessie(fakeFetch(() => Promise.reject(failure)));

        const error = await api.vehicles.create(VIN).enable_valet(4821).catch((e) => e);

        expect(error.cause).toBe(failure);
        expectClean(lines, "4821");
    });

    it("logs only the class of a failed token function's error", async () => {
        const { api, lines } = fleet(fakeFetch(), async () => {
            throw new Error("refresh failed for refresh-token-value");
        });

        await expect(api._request("GET", "api/1/x")).rejects.toThrow("refresh failed");

        expectClean(lines, "refresh-token-value");
        expect(lines.some((line) => line.includes("result=error error=Error"))).toBe(true);
    });

    it("logs nothing of a thrown value that is not an Error", async () => {
        const { api, lines } = fleet(fakeFetch(), () => Promise.reject("plain-secret-value"));

        await expect(api._request("GET", "api/1/x")).rejects.toBe("plain-secret-value");

        expectClean(lines, "plain-secret-value");
    });

    it("keeps the class message of a library error", async () => {
        const { api, lines } = fleet(fakeFetch(() => jsonReply({}, 404)));

        await expect(api._request("GET", "api/1/x")).rejects.toThrow();

        expect(lines.some((line) => /result=error error=NotFound: \S/.test(line))).toBe(true);
    });
});
