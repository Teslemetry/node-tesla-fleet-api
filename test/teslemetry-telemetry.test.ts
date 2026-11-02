import { describe, expect, it, vi } from "vitest";
import { SnapshotTopic, WaitTopic } from "../src/const.js";
import { InvalidResponse } from "../src/exceptions.js";
import Teslemetry from "../src/teslemetry.js";
import { TeslemetryVehicleTelemetry } from "../src/teslemetryvehicle.js";

const VIN = "5YJ3E1EA1JF000001";

function makeVehicle(replies: unknown[]) {
    const queue = [...replies];
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify(queue.shift()), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    const api = new Teslemetry("test-token", "api", { fetch: fetch as unknown as typeof globalThis.fetch });
    return { fetch, vehicle: api.vehicles.create(VIN) };
}

/** Verb, path and decoded query of the nth request. */
function request(fetch: ReturnType<typeof makeVehicle>["fetch"], n = 0) {
    const [url, init] = fetch.mock.calls[n];
    const parsed = new URL(url as string);
    return { method: init?.method, path: parsed.pathname, query: Object.fromEntries(parsed.searchParams) };
}

describe("telemetry", () => {
    const path = `/api/1/vehicles/${VIN}/telemetry`;

    it("joins a topic list with semicolons and sends the cursor", async () => {
        const { fetch, vehicle } = makeVehicle([{ response: { cursor: 8 } }]);

        await expect(vehicle.telemetry([SnapshotTopic.STATE, SnapshotTopic.DATA], 7)).resolves.toEqual({ response: { cursor: 8 } });
        expect(request(fetch)).toEqual({ method: "GET", path, query: { topics: "state;data", cursor: "7" } });
    });

    it("passes a topic string through", async () => {
        const { fetch, vehicle } = makeVehicle([{ response: { cursor: 1 } }]);

        await vehicle.telemetry("alerts;errors");
        expect(request(fetch).query).toEqual({ topics: "alerts;errors" });
    });

    it("sends no query without topics or a cursor", async () => {
        const { fetch, vehicle } = makeVehicle([{ response: { cursor: 1 } }]);

        await vehicle.telemetry();
        expect(fetch.mock.calls[0][0]).toBe(`https://api.teslemetry.com${path}`);
    });

    it("sends a cursor of zero", async () => {
        const { fetch, vehicle } = makeVehicle([{ response: { cursor: 1 } }]);

        await vehicle.telemetry(null, 0);
        expect(request(fetch).query).toEqual({ cursor: "0" });
    });
});

describe("TeslemetryVehicleTelemetry", () => {
    it("create_telemetry_tracker starts at cursor 0 with an empty snapshot", () => {
        const { vehicle } = makeVehicle([]);
        const tracker = vehicle.create_telemetry_tracker();

        expect(tracker).toBeInstanceOf(TeslemetryVehicleTelemetry);
        expect(tracker.cursor).toBe(0);
        expect(tracker.snapshot).toEqual({});
    });

    it("update() advances the cursor and merges only changed fields", async () => {
        const first = {
            cursor: 10,
            state: "online",
            data: { Soc: 50, Odometer: 1000 },
            connectivity: { wifi: true },
            alerts: [{ name: "a" }],
            errors: [{ name: "e" }],
            vehicle_data: { vin: VIN },
        };
        const second = { cursor: 11, data: { Soc: 51 } };
        const { fetch, vehicle } = makeVehicle([{ response: first }, { response: second }]);
        const tracker = vehicle.create_telemetry_tracker([SnapshotTopic.DATA, SnapshotTopic.STATE]);

        await expect(tracker.update()).resolves.toEqual(first);
        expect(tracker.cursor).toBe(10);
        expect(request(fetch, 0).query).toEqual({ topics: "data;state", cursor: "0" });

        await expect(tracker.update()).resolves.toEqual(second);
        expect(tracker.cursor).toBe(11);
        expect(request(fetch, 1).query).toEqual({ topics: "data;state", cursor: "10" });
        expect(tracker.snapshot).toEqual({ ...first, cursor: undefined, data: { Soc: 51, Odometer: 1000 } });
    });

    it("keeps earlier topics when an update's value is empty", async () => {
        const first = { cursor: 1, state: "online", data: { Soc: 50 }, alerts: [{ name: "a" }], connectivity: { wifi: true } };
        const empty = { cursor: 2, state: "", data: {}, alerts: [], connectivity: {} };
        const { vehicle } = makeVehicle([{ response: first }, { response: empty }]);
        const tracker = vehicle.create_telemetry_tracker();

        await tracker.update();
        await tracker.update();
        expect(tracker.cursor).toBe(2);
        expect(tracker.snapshot).toEqual({ state: "online", data: { Soc: 50 }, alerts: [{ name: "a" }], connectivity: { wifi: true } });
    });

    it("replaces a whole topic but merges data", async () => {
        const { vehicle } = makeVehicle([
            { response: { cursor: 1, connectivity: { wifi: true, lte: true } } },
            { response: { cursor: 2, connectivity: { wifi: false } } },
        ]);
        const tracker = vehicle.create_telemetry_tracker();

        await tracker.update();
        await tracker.update();
        expect(tracker.snapshot.connectivity).toEqual({ wifi: false });
    });

    it.each([
        ["a null response", { response: null }],
        ["an empty response", { response: {} }],
        ["no response", {}],
    ])("%s raises and leaves the tracker alone", async (_name, reply) => {
        const { vehicle } = makeVehicle([reply]);
        const tracker = vehicle.create_telemetry_tracker();

        await expect(tracker.update()).rejects.toBeInstanceOf(InvalidResponse);
        expect(tracker.cursor).toBe(0);
        expect(tracker.snapshot).toEqual({});
    });

    it("a response with no cursor raises before merging", async () => {
        const { vehicle } = makeVehicle([{ response: { state: "online" } }]);
        const tracker = vehicle.create_telemetry_tracker();

        await expect(tracker.update()).rejects.toBeInstanceOf(InvalidResponse);
        expect(tracker.snapshot).toEqual({});
    });
});

describe("topic constants", () => {
    it("WaitTopic is SnapshotTopic without vehicle_data", () => {
        expect(SnapshotTopic.VEHICLE_DATA).toBe("vehicle_data");
        expect(Object.values(WaitTopic)).toEqual(["state", "data", "connectivity", "alerts", "errors"]);
    });
});
