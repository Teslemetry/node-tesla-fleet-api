import { afterEach, describe, expect, it, vi } from "vitest";
import Energy from "../src/energy.js";
import TeslaFleetApi from "../src/teslafleetapi.js";

describe("Energy history requests", () => {
    const api = new TeslaFleetApi({ accessToken: "test-token", server: "https://fleet.test" });
    const energy = new Energy(api);
    const site = 12345;
    const window = {
        start_date: "2023-01-01T00:00:00-08:00",
        end_date: "2023-01-02T00:00:00-08:00",
        time_zone: "America/Los_Angeles",
    };

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function stubFetch() {
        const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
            new Response(JSON.stringify({ response: { ok: true } }), { status: 200 }),
        );
        vi.stubGlobal("fetch", fetchMock);
        return fetchMock;
    }

    it.each([
        [
            "backup_history",
            () => energy.backup_history(site, "backup", window.start_date, window.end_date, "day", window.time_zone),
            "calendar_history",
            { kind: "backup", ...window, period: "day" },
        ],
        [
            "charge_history",
            () => energy.charge_history(site, "charge", window.start_date, window.end_date, window.time_zone),
            "telemetry_history",
            { kind: "charge", ...window },
        ],
        [
            "energy_history",
            () => energy.energy_history(site, "energy", window.start_date, window.end_date, "week", window.time_zone),
            "calendar_history",
            { kind: "energy", ...window, period: "week" },
        ],
    ])("%s sends its arguments as query parameters", async (_name, call, endpoint, expected) => {
        const fetchMock = stubFetch();

        await expect(call()).resolves.toEqual({ response: { ok: true } });

        expect(fetchMock).toHaveBeenCalledOnce();
        const [url, init] = fetchMock.mock.calls[0];
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname).toBe(`https://fleet.test/api/1/energy_sites/${site}/${endpoint}`);
        expect(Object.fromEntries(parsed.searchParams)).toEqual(expected);
        expect(init.method).toBe("GET");
        expect(init.body).toBeNull();
    });
});
