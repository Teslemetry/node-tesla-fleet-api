import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOMEY_VEHICLE_OPTIONS } from "../../src/bluetooth/adapters/homey.js";
import { bleHarness, finish } from "../helpers/blevehicle.js";
import { FakeBleLink } from "../helpers/fakeblelink.js";

const IDLE = 30_000;

function count(link: FakeBleLink, kind: "connect" | "disconnect"): number {
    return link.calls.filter((call) => call.kind === kind).length;
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("idle_disconnect_ms", () => {
    it("closes the link once it has been idle that long, and the next command reconnects", async () => {
        const { vehicle, link } = bleHarness({ idle_disconnect_ms: IDLE });
        const states: boolean[] = [];
        vehicle.listen_connection_status((up) => states.push(up));
        await finish(vehicle.door_lock());

        await vi.advanceTimersByTimeAsync(IDLE - 1000);
        expect(count(link, "disconnect")).toBe(0);
        await vi.advanceTimersByTimeAsync(1000);
        expect(count(link, "disconnect")).toBe(1);
        expect(states).toEqual([true, false]);

        await finish(vehicle.door_lock());
        expect(count(link, "connect")).toBe(2);
        await vehicle.disconnect();
    });

    it("counts from the end of the last command", async () => {
        const { vehicle, link } = bleHarness({ idle_disconnect_ms: IDLE });
        await finish(vehicle.connect());
        for (let i = 0; i < 4; i++) {
            await vi.advanceTimersByTimeAsync(IDLE / 2);
            await finish(vehicle.door_lock());
        }
        expect(count(link, "disconnect")).toBe(0);
        await vehicle.disconnect();
    });

    it("never closes the link under a command that is still waiting for its reply", async () => {
        const { vehicle, link } = bleHarness({ idle_disconnect_ms: 1000 });
        await finish(vehicle.connect());
        link.delayNextReply(3000);
        const locking = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(2500);
        expect(count(link, "disconnect")).toBe(0);
        await finish(locking);
        expect(count(link, "connect")).toBe(1);
        await vi.advanceTimersByTimeAsync(1000);
        expect(count(link, "disconnect")).toBe(1);
    });

    it("does not count keepalive reads as use", async () => {
        const { vehicle, link } = bleHarness({ idle_disconnect_ms: IDLE, keepalive_interval_ms: 10_000 });
        await finish(vehicle.connect());
        await vi.advanceTimersByTimeAsync(IDLE);
        expect(count(link, "disconnect")).toBe(1);
    });

    it("never closes the link under a read a subclass started", async () => {
        const { vehicle, link } = bleHarness({ idle_disconnect_ms: 1000 });
        await finish(vehicle.connect());
        await vi.advanceTimersByTimeAsync(900);
        link.readDelayMs = 3000;
        const reading = vehicle.read("version");
        await vi.advanceTimersByTimeAsync(2500);
        expect(count(link, "disconnect")).toBe(0);
        await finish(reading);
        await vi.advanceTimersByTimeAsync(1000);
        expect(count(link, "disconnect")).toBe(1);
    });

    it("waits out a delay longer than a timer can hold, without spinning", async () => {
        const { vehicle, link } = bleHarness({ idle_disconnect_ms: 3_000_000_000 });
        await finish(vehicle.connect());
        await vi.advanceTimersByTimeAsync(60_000);
        expect(count(link, "disconnect")).toBe(0);
        expect(vi.getTimerCount()).toBeLessThan(5);
        await vehicle.disconnect();
    });

    it("rejects an interval that is not a positive finite number", () => {
        expect(() => bleHarness({ idle_disconnect_ms: -1 })).toThrow(RangeError);
        expect(() => bleHarness({ idle_disconnect_ms: Number.POSITIVE_INFINITY })).toThrow(RangeError);
        expect(bleHarness({ idle_disconnect_ms: 0 }).vehicle.idle_disconnect_ms).toBeNull();
    });

    it("is off by default, and on for Homey", () => {
        expect(bleHarness().vehicle.idle_disconnect_ms).toBeNull();
        expect(bleHarness({ ...HOMEY_VEHICLE_OPTIONS }).vehicle.idle_disconnect_ms).toBe(IDLE);
    });
});
