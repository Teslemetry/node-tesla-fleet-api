import { afterEach, describe, expect, it, vi } from "vitest";
import Teslemetry from "../src/teslemetry.js";

function fakeFetch(body: unknown, headers: Record<string, string> = {}) {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify(body), {
            status: 200,
            headers: { "Content-Type": "application/json", ...headers },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function requestedUrls(fetchMock: ReturnType<typeof fakeFetch>) {
    return fetchMock.mock.calls.map(([url]) => url);
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("Teslemetry", () => {
    it("resolves products() and follows the x-region header", async () => {
        const fetchMock = fakeFetch({ response: [] }, { "x-region": "eu" });
        const api = new Teslemetry("test-token");

        await expect(api.products()).resolves.toEqual([]);
        expect(api.server).toBe("https://eu.teslemetry.com");
        expect(requestedUrls(fetchMock)).toEqual([
            "https://api.teslemetry.com/api/1/products",
        ]);
    });

    it("requests test() without a double slash", async () => {
        const fetchMock = fakeFetch({ response: true });
        const api = new Teslemetry("test-token", "na");

        await expect(api.test()).resolves.toBe(true);
        expect(requestedUrls(fetchMock)).toEqual([
            "https://na.teslemetry.com/api/test",
        ]);
    });

    it("requests metadata() without a double slash and updates the region", async () => {
        const metadata = { uid: "u", region: "EU", scopes: [], vins: [] };
        const fetchMock = fakeFetch(metadata);
        const api = new Teslemetry("test-token");

        await expect(api.metadata()).resolves.toEqual(metadata);
        expect(api.server).toBe("https://eu.teslemetry.com");
        expect(requestedUrls(fetchMock)).toEqual([
            "https://api.teslemetry.com/api/metadata",
        ]);
    });

    it("requests the dx eligibility endpoints without a double slash", async () => {
        const fetchMock = fakeFetch({ response: {} });
        const api = new Teslemetry("test-token", "na");

        await api.vehicles!.eligible_subscriptions("VIN");
        await api.vehicles!.eligible_upgrades("VIN");
        expect(requestedUrls(fetchMock)).toEqual([
            "https://na.teslemetry.com/api/1/dx/vehicles/subscriptions/eligibility?vin=VIN",
            "https://na.teslemetry.com/api/1/dx/vehicles/upgrades/eligibility?vin=VIN",
        ]);
    });
});
