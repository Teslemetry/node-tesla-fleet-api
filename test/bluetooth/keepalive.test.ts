import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BleNotSubmittedError } from "../../src/bluetooth/transport.js";
import { bleHarness, finish, timed } from "../helpers/blevehicle.js";
import { FakeBleLink } from "../helpers/fakeblelink.js";

const INTERVAL = 20_000;

function keepaliveReads(link: FakeBleLink): number {
    return link.calls.filter((call) => call.kind === "read").length;
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("keepalive", () => {
    it("reads the version characteristic after an idle span, and nothing else", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());

        // `finish` already moved the clock by up to one 50 ms step.
        await vi.advanceTimersByTimeAsync(INTERVAL - 100);
        expect(keepaliveReads(link)).toBe(0);
        await vi.advanceTimersByTimeAsync(100);

        expect(link.calls.at(-1)).toEqual({ kind: "read", characteristic: "version" });
        expect(link.writes).toEqual([]);
        await vehicle.disconnect();
    });

    it("defaults to 20 s", async () => {
        const { vehicle } = bleHarness({ keepalive_interval_ms: undefined });
        expect(vehicle.keepalive_interval_ms).toBe(INTERVAL);
    });

    it("keeps reading across idle spans, each read counting as activity", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());

        await vi.advanceTimersByTimeAsync(INTERVAL * 3);

        expect(keepaliveReads(link)).toBe(3);
        await vehicle.disconnect();
    });

    it("stays quiet while commands keep the link busy", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());

        for (let i = 0; i < 5; i++) {
            await vi.advanceTimersByTimeAsync(INTERVAL / 2);
            await finish(vehicle.door_lock());
        }

        expect(keepaliveReads(link)).toBe(0);
        await vehicle.disconnect();
    });

    it("counts a received frame as activity", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());

        await vi.advanceTimersByTimeAsync(INTERVAL - 1000);
        link.injectVehicleStatus({});
        await vi.advanceTimersByTimeAsync(INTERVAL - 1000);
        expect(keepaliveReads(link)).toBe(0);

        await vi.advanceTimersByTimeAsync(1000);
        expect(keepaliveReads(link)).toBe(1);
        await vehicle.disconnect();
    });

    it.each([null, 0])("starts no timer when the interval is %s", async (interval) => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: interval });
        await finish(vehicle.connect());

        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(INTERVAL * 3);
        expect(keepaliveReads(link)).toBe(0);
    });

    it("swallows a read that never reached the radio and keeps going, with no reconnect", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());
        link.failNextRead(new BleNotSubmittedError("characteristic not resolved"));

        await vi.advanceTimersByTimeAsync(INTERVAL * 2);

        expect(keepaliveReads(link)).toBe(2);
        expect(link.connections).toHaveLength(1);
        expect(link.openConnections).toBe(1);
        await vehicle.disconnect();
    });

    it("swallows a rejected read, which loses the link, with no reconnect", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        const events: boolean[] = [];
        await finish(vehicle.connect());
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.failNextRead(new Error("not connected"));

        await vi.advanceTimersByTimeAsync(INTERVAL * 3);

        expect(events).toEqual([false]);
        expect(keepaliveReads(link)).toBe(1);
        expect(link.connections).toHaveLength(1);
        expect(link.openConnections).toBe(0);
    });

    it("recovers on the next command when a backend rejects a read but still claims the link, as Homey can", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropLinkSilently();
        link.failNextRead(new Error("not connected"));
        expect(link.connection?.isConnected).toBe(true);

        await vi.advanceTimersByTimeAsync(INTERVAL + 1);
        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });

        expect(fakeVehicle.vcsecCommands).toHaveLength(1);
        expect(link.connections).toHaveLength(2);
        await vehicle.disconnect();
    });

    it("bounds a read that hangs, raises nothing and does not reconnect", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        const events: boolean[] = [];
        await finish(vehicle.connect());
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.hangNextRead();

        await vi.advanceTimersByTimeAsync(INTERVAL + 2000);

        expect(events).toEqual([false]);
        expect(link.connections).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("finds a silently dead idle link before a command writes to it", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.door_lock());
        link.dropLinkSilently();
        await vi.advanceTimersByTimeAsync(INTERVAL + 2000);

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });

        expect(link.connections).toHaveLength(2);
        expect(link.commands()).toHaveLength(2);
        await vehicle.disconnect();
    });

    it("skips the read when the backend reports the link down", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());
        link.connection!.reported = false;

        await vi.advanceTimersByTimeAsync(INTERVAL);

        expect(keepaliveReads(link)).toBe(0);
        expect(link.connections).toHaveLength(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("leaves no timer after disconnect", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());
        expect(vi.getTimerCount()).toBe(1);

        await vehicle.disconnect();

        expect(vi.getTimerCount()).toBe(0);
        await vi.advanceTimersByTimeAsync(INTERVAL * 2);
        expect(keepaliveReads(link)).toBe(0);
    });

    it("leaves no timer when disconnect lands during a read", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());
        link.hangNextRead();
        await vi.advanceTimersByTimeAsync(INTERVAL);

        await vehicle.disconnect();
        await vi.advanceTimersByTimeAsync(0);

        expect(vi.getTimerCount()).toBe(0);
    });

    it("leaves no timer after a dropped link", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());

        link.dropLink();
        await vi.advanceTimersByTimeAsync(0);

        expect(vi.getTimerCount()).toBe(0);
    });

    it("runs one timer per link across a reconnect", async () => {
        const { vehicle, link } = bleHarness({ keepalive_interval_ms: INTERVAL });
        await finish(vehicle.connect());
        link.dropLink();
        await finish(vehicle.connect());

        expect(vi.getTimerCount()).toBe(1);
        await vi.advanceTimersByTimeAsync(INTERVAL);
        expect(keepaliveReads(link)).toBe(1);
        await vehicle.disconnect();
    });

    it("does not hold a process open", async () => {
        const unref = vi.fn();
        const { vehicle } = bleHarness({ keepalive_interval_ms: INTERVAL });
        const real = globalThis.setTimeout;
        const spy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((...args: Parameters<typeof real>) => {
            const timer = real(...args);
            timer.unref = unref as never;
            return timer;
        }) as typeof real);

        const connecting = vehicle.connect();
        await vi.advanceTimersByTimeAsync(0);
        await connecting;
        spy.mockRestore();

        expect(unref).toHaveBeenCalled();
        await vehicle.disconnect();
    });
});

describe("listen_connection_status", () => {
    it("fires true after the connection is up", async () => {
        const { vehicle } = bleHarness();
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));

        await finish(vehicle.connect());

        expect(events).toEqual([true]);
    });

    it("stays silent when a connect fails", async () => {
        const { vehicle, link } = bleHarness();
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.failConnect(3);

        await expect(finish(vehicle.connect())).rejects.toThrow();

        expect(events).toEqual([]);
    });

    it("fires false on disconnect", async () => {
        const { vehicle } = bleHarness();
        const events: boolean[] = [];
        await finish(vehicle.connect());
        vehicle.listen_connection_status((connected) => events.push(connected));

        await finish(vehicle.disconnect());

        expect(events).toEqual([false]);
    });

    it("does not fire for a disconnect with no connection", async () => {
        const { vehicle } = bleHarness();
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));

        await finish(vehicle.disconnect());

        expect(events).toEqual([]);
    });

    it("fires false on a backend's disconnect event", async () => {
        const { vehicle, link } = bleHarness();
        const events: boolean[] = [];
        await finish(vehicle.connect());
        vehicle.listen_connection_status((connected) => events.push(connected));

        link.dropLink();

        expect(events).toEqual([false]);
    });

    it("ignores an old link's event while a new one is up", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const old = link.connection!;
        link.dropLink();
        await finish(vehicle.connect());
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));

        old.handlers.onDisconnect();

        expect(events).toEqual([]);
    });

    it("fires once for a drop followed by a disconnect", async () => {
        const { vehicle, link } = bleHarness();
        const events: boolean[] = [];
        await finish(vehicle.connect());
        vehicle.listen_connection_status((connected) => events.push(connected));

        link.dropLink();
        await finish(vehicle.disconnect());

        expect(events).toEqual([false]);
    });

    it("fires false when timeouts find a silently dead link", async () => {
        const { vehicle, link } = bleHarness();
        const events: boolean[] = [];
        await finish(vehicle.handshakeVehicleSecurity());
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.dropLinkSilently();

        const { error } = await timed(() => vehicle.vehicle_state());

        expect(error).toBeDefined();
        expect(events).toEqual([false]);
    });

    it("fires false when a failed read finds the backend down", async () => {
        const { vehicle, link } = bleHarness();
        const events: boolean[] = [];
        await finish(vehicle.connect());
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.connection!.reported = false;
        link.failNextRead();

        await expect(finish(vehicle.read("version"))).rejects.toThrow();

        expect(events).toEqual([false]);
    });

    it("fires one event per transition across a reconnect loop", async () => {
        const { vehicle } = bleHarness();
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));

        for (let i = 0; i < 3; i++) {
            await finish(vehicle.connect());
            await finish(vehicle.disconnect());
        }

        expect(events).toEqual([true, false, true, false, true, false]);
    });

    it("does not fire for a redundant connect", async () => {
        const { vehicle } = bleHarness();
        await finish(vehicle.connect());
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));

        await finish(vehicle.connect());

        expect(events).toEqual([]);
    });

    it("stops after unsubscribe, which is safe to call twice", async () => {
        const { vehicle } = bleHarness();
        const events: boolean[] = [];
        const unsubscribe = vehicle.listen_connection_status((connected) => events.push(connected));
        const other: boolean[] = [];
        vehicle.listen_connection_status((connected) => other.push(connected));

        unsubscribe();
        unsubscribe();
        await finish(vehicle.connect());

        expect(events).toEqual([]);
        expect(other).toEqual([true]);
    });

    it("keeps a throwing listener from blocking others", async () => {
        const { vehicle } = bleHarness();
        const events: boolean[] = [];
        vehicle.listen_connection_status(() => {
            throw new Error("boom");
        });
        vehicle.listen_connection_status((connected) => events.push(connected));

        await finish(vehicle.connect());

        expect(events).toEqual([true]);
    });
});
