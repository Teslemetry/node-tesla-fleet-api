import { afterEach, describe, expect, it, vi } from "vitest";
import Energy from "../src/energy.js";
import TeslaFleetApi from "../src/teslafleetapi.js";

const SITE_ID = 12345;
const BASE = `https://fleet.test/api/1/energy_sites/${SITE_ID}`;
const WINDOW = {
    start_date: "2023-01-01T00:00:00-08:00",
    end_date: "2023-01-02T00:00:00-08:00",
    time_zone: "America/Los_Angeles",
};

function makeSite() {
    const api = new TeslaFleetApi({ accessToken: "test-token", server: "https://fleet.test" });
    return { energy: new Energy(api), site: new Energy(api).create(SITE_ID) };
}

function stubFetch(reply: unknown = { response: { ok: true } }) {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify(reply), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function sent(fetchMock: ReturnType<typeof stubFetch>) {
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url);
    return {
        method: init.method,
        path: parsed.origin + parsed.pathname,
        query: Object.fromEntries(parsed.searchParams),
        body: init.body ? JSON.parse(init.body as string) : null,
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("Energy history requests", () => {
    const { energy } = makeSite();

    it.each([
        [
            "backup_history",
            () => energy.backup_history(SITE_ID, "day", WINDOW.start_date, WINDOW.end_date, WINDOW.time_zone),
            "calendar_history",
            { kind: "backup", ...WINDOW, period: "day" },
        ],
        [
            "charge_history",
            () => energy.charge_history(SITE_ID, WINDOW.start_date, WINDOW.end_date, WINDOW.time_zone),
            "telemetry_history",
            { kind: "charge", ...WINDOW },
        ],
        [
            "energy_history",
            () => energy.energy_history(SITE_ID, "week", WINDOW.start_date, WINDOW.end_date, WINDOW.time_zone),
            "calendar_history",
            { kind: "energy", ...WINDOW, period: "week" },
        ],
    ])("%s sends its arguments as query parameters", async (_name, call, endpoint, expected) => {
        const fetchMock = stubFetch();

        await expect(call()).resolves.toEqual({ response: { ok: true } });

        expect(sent(fetchMock)).toEqual({ method: "GET", path: `${BASE}/${endpoint}`, query: expected, body: null });
    });
});

describe("EnergySpecific REST parity", () => {
    const { site } = makeSite();
    const noQuery = {};

    it.each<[string, () => Promise<unknown>, string, string, Record<string, unknown>, unknown]>([
        ["backup", () => site.backup(40), "POST", "backup", noQuery, { backup_reserve_percent: 40 }],
        [
            "backup_history",
            () => site.backup_history("day", WINDOW.start_date, WINDOW.end_date, WINDOW.time_zone),
            "GET",
            "calendar_history",
            { kind: "backup", period: "day", ...WINDOW },
            null,
        ],
        [
            "charge_history",
            () => site.charge_history(WINDOW.start_date, WINDOW.end_date, WINDOW.time_zone),
            "GET",
            "telemetry_history",
            { kind: "charge", ...WINDOW },
            null,
        ],
        [
            "energy_history",
            () => site.energy_history("month", WINDOW.start_date, WINDOW.end_date, WINDOW.time_zone),
            "GET",
            "calendar_history",
            { kind: "energy", period: "month", ...WINDOW },
            null,
        ],
        [
            "grid_import_export",
            () => site.grid_import_export(true, "pv_only"),
            "POST",
            "grid_import_export",
            noQuery,
            { disallow_charge_from_grid_with_solar_installed: true, customer_preferred_export_rule: "pv_only" },
        ],
        ["live_status", () => site.live_status(), "GET", "live_status", noQuery, null],
        [
            "off_grid_vehicle_charging_reserve",
            () => site.off_grid_vehicle_charging_reserve(25),
            "POST",
            "off_grid_vehicle_charging_reserve",
            noQuery,
            { off_grid_vehicle_charging_reserve_percent: 25 },
        ],
        ["operation", () => site.operation("autonomous"), "POST", "operation", noQuery, { default_real_mode: "autonomous" }],
        ["site_info", () => site.site_info(), "GET", "site_info", noQuery, null],
        ["storm_mode", () => site.storm_mode(true), "POST", "storm_mode", noQuery, { enabled: true }],
        [
            "time_of_use_settings",
            () => site.time_of_use_settings({ name: "Plan" }),
            "POST",
            "time_of_use_settings",
            noQuery,
            { tou_settings: { tariff_content_v2: { name: "Plan" } } },
        ],
    ])("%s matches Python's verb, path, keys and reply envelope", async (_name, call, method, endpoint, query, body) => {
        const reply = { response: { ok: true } };
        const fetchMock = stubFetch(reply);

        await expect(call()).resolves.toEqual(reply);

        expect(sent(fetchMock)).toEqual({ method, path: `${BASE}/${endpoint}`, query, body });
    });

    it("omits history arguments left out of the call", async () => {
        const fetchMock = stubFetch();

        await site.energy_history("lifetime");

        expect(sent(fetchMock).query).toEqual({ kind: "energy", period: "lifetime" });
    });

    it("sets kind from the method and drops a null period", async () => {
        const fetchMock = stubFetch();

        await site.backup_history(null);

        expect(sent(fetchMock).query).toEqual({ kind: "backup" });
    });
});
