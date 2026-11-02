// Behaviour specs ported from Python's `tests/test_funnel.py`,
// `tests/test_funnel_vehicle_data.py` and `tests/test_funnel_stream.py`. Every
// result and update here is a literal: the publishers are given no client, so a
// value they produce can only have come from that literal, which is what makes
// "cannot request" checkable rather than asserted.
import { readFileSync } from "node:fs";
import { ClosureStateE, VehicleLockStateE } from "@teslemetry/tesla-protocol/command/vcsec";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
    CLOSURE_STATES,
    FieldPath,
    LOCK_STATES,
    ObservationFunnel,
    TeslemetryStreamPublisher,
    VehicleDataResultPublisher,
    type ObservationSink,
    type Publisher,
    type Unsubscribe,
    type Value,
} from "../src/funnel.js";
import * as root from "../src/index.js";

const ALL_PATHS: ReadonlySet<FieldPath> = new Set(Object.values(FieldPath));
const LOCKED = FieldPath.LOCKED;
const CHARGE_PORT = FieldPath.CHARGE_PORT_DOOR_OPEN;
const TRUNK = FieldPath.DOOR_STATE_TRUNK_FRONT;

/** A publisher a test drives directly, recording activation accounting. */
class FakePublisher implements Publisher {
    requested: FieldPath[][] = [];
    released: FieldPath[][] = [];
    detached = 0;
    #sink: ObservationSink | null = null;

    constructor(readonly paths: ReadonlySet<FieldPath> = ALL_PATHS) {}

    attach(sink: ObservationSink): Unsubscribe {
        this.#sink = sink;
        return () => {
            this.detached += 1;
            this.#sink = null;
        };
    }

    request(paths: ReadonlySet<FieldPath>): void {
        this.requested.push([...paths]);
    }

    release(paths: ReadonlySet<FieldPath>): void {
        this.released.push([...paths]);
    }

    emit(path: FieldPath, value: Value, observed_at: number): void {
        this.#sink!.publish({ path, value, observed_at });
    }
}

function listenTo(funnel: ObservationFunnel, path: FieldPath): Value[] {
    const seen: Value[] = [];
    funnel.listen(path, (value) => seen.push(value));
    return seen;
}

const noop = () => undefined;

describe("fan-in: many publishers, one listener", () => {
    it("reaches the same listener from both sources, with no transient null", () => {
        // The bug this exists to prevent: a field blanking when one source drops.
        const funnel = new ObservationFunnel();
        const stream = new FakePublisher();
        const ble = new FakePublisher();
        const detachStream = funnel.attach(stream);
        const detachBle = funnel.attach(ble);
        const seen = listenTo(funnel, LOCKED);

        stream.emit(LOCKED, true, 1);
        expect(seen).toEqual([true]);

        // Stream to Bluetooth: the source is gone, not the field.
        detachStream();
        expect(seen).toEqual([true]);
        expect(funnel.value(LOCKED)).toBe(true);

        ble.emit(LOCKED, false, 2);
        ble.emit(LOCKED, true, 3);
        expect(seen).toEqual([true, false, true]);

        // Bluetooth back to stream, the other direction.
        detachBle();
        funnel.attach(stream);
        stream.emit(LOCKED, false, 4);

        expect(seen).toEqual([true, false, true, false]);
        expect(seen).not.toContain(null);
        expect(funnel.value(LOCKED)).toBe(false);
    });

    it("keeps both sources live together, in arrival order", () => {
        const funnel = new ObservationFunnel();
        const stream = new FakePublisher();
        const ble = new FakePublisher();
        funnel.attach(stream);
        funnel.attach(ble);
        const seen = listenTo(funnel, CHARGE_PORT);

        stream.emit(CHARGE_PORT, true, 1);
        ble.emit(CHARGE_PORT, false, 2);
        stream.emit(CHARGE_PORT, true, 3);

        expect(seen).toEqual([true, false, true]);
    });

    it("emits nothing when every publisher detaches", () => {
        const funnel = new ObservationFunnel();
        const stream = new FakePublisher();
        const ble = new FakePublisher();
        const detachStream = funnel.attach(stream);
        const detachBle = funnel.attach(ble);
        const seen = listenTo(funnel, TRUNK);
        stream.emit(TRUNK, true, 1);

        detachStream();
        detachBle();

        expect(seen).toEqual([true]);
        expect(funnel.value(TRUNK)).toBe(true);
    });

    it("delivers a reported unavailable value as such", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, true, 1);
        publisher.emit(LOCKED, null, 2);
        publisher.emit(LOCKED, true, 3);

        expect(seen).toEqual([true, null, true]);
    });

    it("detaches once however often it is called", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        const detach = funnel.attach(publisher);
        funnel.listen(LOCKED, noop);

        detach();
        detach();

        expect(publisher.detached).toBe(1);
        expect(publisher.released).toEqual([[LOCKED]]);
    });

    it("accepts a publisher that reports synchronously while attaching", () => {
        const funnel = new ObservationFunnel();
        const seen = listenTo(funnel, LOCKED);
        const eager: Publisher = {
            paths: ALL_PATHS,
            attach(sink) {
                sink.publish({ path: LOCKED, value: true, observed_at: 1 });
                return noop;
            },
            request: noop,
            release: noop,
        };

        funnel.attach(eager);

        expect(seen).toEqual([true]);
    });
});

describe("the only arbitration: drop the out-of-order, drop the unchanged", () => {
    it("ignores an observation older than the last one", () => {
        const funnel = new ObservationFunnel();
        const stream = new FakePublisher();
        const ble = new FakePublisher();
        funnel.attach(stream);
        funnel.attach(ble);
        const seen = listenTo(funnel, LOCKED);

        stream.emit(LOCKED, true, 10);
        ble.emit(LOCKED, false, 5);

        expect(seen).toEqual([true]);
        expect(funnel.value(LOCKED)).toBe(true);
    });

    it("advances the clock on a skipped repeat, so a stale frame cannot win after it", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, true, 10);
        publisher.emit(LOCKED, true, 20); // unchanged, not re-dispatched
        publisher.emit(LOCKED, false, 15); // older than the 20 reading

        expect(seen).toEqual([true]);
    });

    it("does not re-dispatch an unchanged value", () => {
        const funnel = new ObservationFunnel();
        const stream = new FakePublisher();
        const ble = new FakePublisher();
        funnel.attach(stream);
        funnel.attach(ble);
        const seen = listenTo(funnel, LOCKED);

        stream.emit(LOCKED, true, 1);
        stream.emit(LOCKED, true, 2);
        ble.emit(LOCKED, true, 3);
        ble.emit(LOCKED, false, 4);
        stream.emit(LOCKED, false, 5);

        expect(seen).toEqual([true, false]);
    });

    it("deduplicates a repeated unavailable value too", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, null, 1);
        publisher.emit(LOCKED, null, 2);

        expect(seen).toEqual([null]);
    });

    it("does not treat an equal timestamp as older", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, true, 1);
        publisher.emit(LOCKED, false, 1);

        expect(seen).toEqual([true, false]);
    });

    it("orders fields independently", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const locked = listenTo(funnel, LOCKED);
        const trunk = listenTo(funnel, TRUNK);

        publisher.emit(LOCKED, true, 10);
        publisher.emit(TRUNK, true, 5);

        expect(locked).toEqual([true]);
        expect(trunk).toEqual([true]);
    });
});

describe("values", () => {
    it("has no value for an unobserved field", () => {
        const funnel = new ObservationFunnel();
        for (const path of ALL_PATHS) {
            expect(funnel.value(path)).toBeNull();
        }
    });

    it("dispatches nothing on registration", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        funnel.listen(LOCKED, noop);
        publisher.emit(LOCKED, true, 1);

        const late = listenTo(funnel, LOCKED);

        expect(late).toEqual([]);
        expect(funnel.value(LOCKED)).toBe(true);
    });
});

describe("activation", () => {
    it("activates on the first listener and releases on the last, exactly once", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);

        const first = funnel.listen(LOCKED, noop);
        const second = funnel.listen(LOCKED, noop);
        expect(publisher.requested).toEqual([[LOCKED]]);

        first();
        expect(publisher.released).toEqual([]);
        second();
        expect(publisher.released).toEqual([[LOCKED]]);

        // A repeated release must not double-count either.
        second();
        expect(publisher.released).toEqual([[LOCKED]]);
    });

    it("needs two releases for the same callback registered twice", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const callback = () => undefined;

        const first = funnel.listen(LOCKED, callback);
        const second = funnel.listen(LOCKED, callback);
        first();
        first();
        expect(publisher.released).toEqual([]);
        second();
        expect(publisher.released).toEqual([[LOCKED]]);
    });

    it("re-activates after a full release", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);

        funnel.listen(LOCKED, noop)();
        funnel.listen(LOCKED, noop);

        expect(publisher.requested).toEqual([[LOCKED], [LOCKED]]);
    });

    it("is per path", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);

        funnel.listen(LOCKED, noop);
        funnel.listen(TRUNK, noop);

        expect(publisher.requested).toEqual([[LOCKED], [TRUNK]]);
    });

    it("asks a publisher only for paths it supplies", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher(new Set([LOCKED]));
        funnel.attach(publisher);

        funnel.listen(TRUNK, noop);
        expect(publisher.requested).toEqual([]);

        funnel.listen(LOCKED, noop);
        expect(publisher.requested).toEqual([[LOCKED]]);
    });

    it("asks a publisher attached later for the active paths", () => {
        const funnel = new ObservationFunnel();
        funnel.listen(LOCKED, noop);

        const publisher = new FakePublisher();
        funnel.attach(publisher);

        expect(publisher.requested).toEqual([[LOCKED]]);
    });

    it("releases the active paths on detach", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        const detach = funnel.attach(publisher);
        funnel.listen(LOCKED, noop);

        detach();

        expect(publisher.released).toEqual([[LOCKED]]);
        expect(publisher.detached).toBe(1);
    });
});

describe("dispatch safety", () => {
    it("leaves no listener on the old value when a callback publishes", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const first: Value[] = [];
        funnel.listen(LOCKED, (value) => {
            first.push(value);
            if (value === true) {
                publisher.emit(LOCKED, false, 2);
            }
        });
        const second = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, true, 1);

        expect(first).toEqual([true, false]);
        // The second listener saw only the value that still stands.
        expect(second).toEqual([false]);
        expect(funnel.value(LOCKED)).toBe(false);
    });

    it("does not let a listener error stop later listeners", () => {
        const debug = vi.fn();
        const funnel = new ObservationFunnel({ logger: { debug } });
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        funnel.listen(LOCKED, () => {
            throw new RangeError("token=abc123");
        });
        const seen = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, true, 1);

        expect(seen).toEqual([true]);
        // Its type, not its message: a foreign message may hold a secret.
        expect(debug.mock.calls).toEqual([["observation funnel listener callback failed error=RangeError"]]);
    });

    it("survives a listener that throws a non-Error, with no logger", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        funnel.listen(LOCKED, () => {
            throw "a string";
        });
        const seen = listenTo(funnel, LOCKED);

        expect(() => publisher.emit(LOCKED, true, 1)).not.toThrow();
        expect(seen).toEqual([true]);
    });

    it("tolerates a listener unsubscribing during dispatch", () => {
        const funnel = new ObservationFunnel();
        const publisher = new FakePublisher();
        funnel.attach(publisher);
        const release = funnel.listen(LOCKED, () => release());
        const seen = listenTo(funnel, LOCKED);

        publisher.emit(LOCKED, true, 1);
        publisher.emit(LOCKED, false, 2);

        expect(seen).toEqual([true, false]);
    });
});

describe("demand", () => {
    const allPaths = ALL_PATHS;

    it("reports the initial state, then only aggregate edges", () => {
        const funnel = new ObservationFunnel();
        const seen: boolean[] = [];
        funnel.listen_demand(allPaths, (active) => seen.push(active));
        expect(seen).toEqual([false]);

        const locked = funnel.listen(LOCKED, noop);
        expect(seen).toEqual([false, true]);

        // Still demanded: a second path rising is not an aggregate edge.
        const trunk = funnel.listen(TRUNK, noop);
        expect(seen).toEqual([false, true]);

        locked();
        expect(seen).toEqual([false, true]);
        trunk();
        expect(seen).toEqual([false, true, false]);
    });

    it("starts true when a listener already exists", () => {
        const funnel = new ObservationFunnel();
        funnel.listen(LOCKED, noop);

        const seen: boolean[] = [];
        funnel.listen_demand(allPaths, (active) => seen.push(active));
        expect(seen).toEqual([true]);
    });

    it("ignores listeners outside its path set", () => {
        const funnel = new ObservationFunnel();
        const seen: boolean[] = [];
        funnel.listen_demand(new Set([LOCKED]), (active) => seen.push(active));

        funnel.listen(TRUNK, noop);
        expect(seen).toEqual([false]);

        funnel.listen(LOCKED, noop);
        expect(seen).toEqual([false, true]);
    });

    it("unsubscribes only that observer", () => {
        const funnel = new ObservationFunnel();
        const kept: boolean[] = [];
        const dropped: boolean[] = [];
        funnel.listen_demand(allPaths, (active) => kept.push(active));
        const release = funnel.listen_demand(allPaths, (active) => dropped.push(active));

        release();
        release();
        funnel.listen(LOCKED, noop);

        expect(kept).toEqual([false, true]);
        expect(dropped).toEqual([false]);
    });

    it("keeps the other of two identical registrations", () => {
        const funnel = new ObservationFunnel();
        const seen: boolean[] = [];
        const callback = (active: boolean) => {
            seen.push(active);
        };
        funnel.listen_demand(allPaths, callback);
        const release = funnel.listen_demand(allPaths, callback);

        release();
        funnel.listen(LOCKED, noop);

        expect(seen).toEqual([false, false, true]);
    });
});

describe("the state maps", () => {
    it("reads only a locked state as locked", () => {
        expect(LOCK_STATES.get(VehicleLockStateE.VEHICLELOCKSTATE_LOCKED)).toBe(true);
        expect(LOCK_STATES.get(VehicleLockStateE.VEHICLELOCKSTATE_INTERNAL_LOCKED)).toBe(true);
        expect(LOCK_STATES.get(VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED)).toBe(false);
        expect(LOCK_STATES.get(VehicleLockStateE.VEHICLELOCKSTATE_SELECTIVE_UNLOCKED)).toBe(false);
    });

    it("maps a moving closure as open", () => {
        expect(CLOSURE_STATES.get(ClosureStateE.CLOSURESTATE_CLOSED)).toBe(false);
        for (const state of [
            ClosureStateE.CLOSURESTATE_OPEN,
            ClosureStateE.CLOSURESTATE_AJAR,
            ClosureStateE.CLOSURESTATE_OPENING,
            ClosureStateE.CLOSURESTATE_CLOSING,
        ]) {
            expect(CLOSURE_STATES.get(state)).toBe(true);
        }
    });

    it("leaves what cannot be reduced to a boolean unmapped", () => {
        expect(CLOSURE_STATES.has(ClosureStateE.CLOSURESTATE_UNKNOWN)).toBe(false);
        expect(CLOSURE_STATES.has(ClosureStateE.CLOSURESTATE_FAILED_UNLATCH)).toBe(false);
        expect(CLOSURE_STATES.has(ClosureStateE.UNRECOGNIZED)).toBe(false);
        expect(LOCK_STATES.has(VehicleLockStateE.UNRECOGNIZED)).toBe(false);
    });
});

const RESULT = {
    response: {
        id: 1234567890,
        vin: "5YJXCAE43LF123456",
        state: "online",
        charge_state: { battery_level: 72, charge_port_door_open: true, charge_port_latch: "Engaged" },
        climate_state: { inside_temp: 21.5 },
        vehicle_state: { locked: true, ft: 0, rt: 0, df: 0, car_version: "2025.14.3" },
    },
};

const UPDATE = {
    Locked: true,
    ChargePortDoorOpen: true,
    DoorState: { DriverFront: false, TrunkFront: false, TrunkRear: false },
    Soc: 72,
};

function asMap(observations: readonly { path: FieldPath; value: Value }[]): Record<string, Value> {
    return Object.fromEntries(observations.map((observation) => [observation.path, observation.value]));
}

const fromResult = (result: unknown) => asMap(new VehicleDataResultPublisher({ clock: () => 0 }).publish_result(result));
const fromUpdate = (data: unknown) => asMap(new TeslemetryStreamPublisher({ clock: () => 0 }).publish_update(data));

describe("VehicleDataResultPublisher: audited leaves", () => {
    it("maps exactly the three audited leaves", () => {
        expect(fromResult(RESULT)).toEqual({ [LOCKED]: true, [CHARGE_PORT]: true, [TRUNK]: false });
    });

    it("accepts a bare response body", () => {
        expect(fromResult(RESULT.response)).toEqual(fromResult(RESULT));
    });

    it("emits no observation for absent leaves", () => {
        expect(fromResult({ response: { vehicle_state: { car_version: "2025.14.3" } } })).toEqual({});
    });

    it("reads a null leaf as an explicit unavailable reading", () => {
        const result = { response: { vehicle_state: { locked: null, ft: null }, charge_state: { charge_port_door_open: null } } };
        expect(fromResult(result)).toEqual({ [LOCKED]: null, [CHARGE_PORT]: null, [TRUNK]: null });
    });

    it("emits no observation for a non-boolean locked", () => {
        expect(fromResult({ response: { vehicle_state: { locked: "true" } } })).toEqual({});
    });

    it("maps only the documented front trunk codes", () => {
        expect(fromResult({ response: { vehicle_state: { ft: 0 } } })).toEqual({ [TRUNK]: false });
        expect(fromResult({ response: { vehicle_state: { ft: 1 } } })).toEqual({ [TRUNK]: true });
        for (const code of [2, 3, -1, 0.5]) {
            expect(fromResult({ response: { vehicle_state: { ft: code } } })).toEqual({});
        }
    });

    it("does not read a boolean front trunk as a code", () => {
        expect(fromResult({ response: { vehicle_state: { ft: false } } })).toEqual({});
        expect(fromResult({ response: { vehicle_state: { ft: true } } })).toEqual({});
    });

    it("never routes unaudited leaves", () => {
        expect(fromResult({ response: { vehicle_state: { rt: 1, df: 1 } } })).toEqual({});
    });

    it.each([[{}], [{ response: null }], [{ response: { vehicle_state: null } }], [{ response: { vehicle_state: "locked" } }], [null], ["text"], [[]]])(
        "ignores the malformed result %j rather than guessing",
        (result) => {
            expect(fromResult(result)).toEqual({});
        },
    );
});

describe.each([
    [
        "VehicleDataResultPublisher",
        (clock: () => number) => {
            const publisher = new VehicleDataResultPublisher({ clock });
            return { publisher, publish: (at?: number) => publisher.publish_result(RESULT, at === undefined ? {} : { observed_at: at }) };
        },
    ],
    [
        "TeslemetryStreamPublisher",
        (clock: () => number) => {
            const publisher = new TeslemetryStreamPublisher({ clock });
            return { publisher, publish: (at?: number) => publisher.publish_update(UPDATE, at === undefined ? {} : { observed_at: at }) };
        },
    ],
])("%s: a supplied value", (_name, make) => {
    it("reaches listeners", () => {
        const funnel = new ObservationFunnel();
        const { publisher, publish } = make(() => 0);
        funnel.attach(publisher);
        const locked = listenTo(funnel, LOCKED);
        const port = listenTo(funnel, CHARGE_PORT);
        const trunk = listenTo(funnel, TRUNK);

        publish(1);

        expect([locked, port, trunk]).toEqual([[true], [true], [false]]);
    });

    it("is not re-dispatched when repeated", () => {
        const funnel = new ObservationFunnel();
        const { publisher, publish } = make(() => 0);
        funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);

        publish(1);
        publish(2);

        expect(seen).toEqual([true]);
    });

    it("never expires by itself: age is not a reading", () => {
        let now = 0;
        const funnel = new ObservationFunnel();
        const { publisher, publish } = make(() => now);
        funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);
        publish();

        now = 100_000;

        expect(seen).toEqual([true]);
        expect(funnel.value(LOCKED)).toBe(true);
    });

    it("stamps from the clock unless given a time", () => {
        const { publish } = make(() => 42);
        expect(publish()[0].observed_at).toBe(42);
        expect(publish(7)[0].observed_at).toBe(7);
    });

    it("subscribes a passive source to nothing on activation", () => {
        const funnel = new ObservationFunnel();
        const { publisher } = make(() => 0);
        funnel.attach(publisher);

        funnel.listen(LOCKED, noop)();

        expect(Object.keys(publisher)).toEqual([]);
    });

    it("translates before attach, but reaches no listener", () => {
        const funnel = new ObservationFunnel();
        const { publish } = make(() => 0);
        const seen = listenTo(funnel, LOCKED);

        expect(publish(1)).toHaveLength(3);
        expect(seen).toEqual([]);
    });

    it("reaches no listener after detach", () => {
        const funnel = new ObservationFunnel();
        const { publisher, publish } = make(() => 0);
        const detach = funnel.attach(publisher);
        const seen = listenTo(funnel, LOCKED);

        detach();
        publish(1);

        expect(seen).toEqual([]);
    });

    it("holds no client, session or fetch callable, and exposes no async member", () => {
        const { publisher } = make(() => 0);
        expect(Object.keys(publisher)).toEqual([]);

        for (let target = publisher as object; target !== Object.prototype; target = Object.getPrototypeOf(target)) {
            for (const name of Object.getOwnPropertyNames(target)) {
                const member = Object.getOwnPropertyDescriptor(target, name)?.value;
                expect(member?.constructor?.name, name).not.toBe("AsyncFunction");
            }
        }
    });

    it("yields nothing when nothing is supplied: there is no other source to fall back on", () => {
        let now = 0;
        const funnel = new ObservationFunnel();
        const { publisher } = make(() => now);
        funnel.attach(publisher);
        const seen: Value[] = [];
        for (const path of ALL_PATHS) {
            funnel.listen(path, (value) => seen.push(value));
        }

        now = 10_000;

        expect(seen).toEqual([]);
        for (const path of ALL_PATHS) {
            expect(funnel.value(path)).toBeNull();
        }
    });
});

/** A mapping whose reads are counted, and that throws if the publisher calls anything on it. */
function tripwire(target: object) {
    const reads: string[] = [];
    const proxy = new Proxy(target, {
        get(object, key, receiver) {
            reads.push(String(key));
            return Reflect.get(object, key, receiver);
        },
        apply() {
            throw new Error("the publisher invoked a fetch callable");
        },
    });
    return { proxy, reads };
}

describe("reads", () => {
    it("reads only `response` from a supplied result", () => {
        const { proxy, reads } = tripwire(RESULT);
        new VehicleDataResultPublisher({ clock: () => 0 }).publish_result(proxy);
        expect(reads).toEqual(["response"]);
    });

    it("reads only the audited signals from a supplied update", () => {
        const { proxy, reads } = tripwire(UPDATE);
        new TeslemetryStreamPublisher({ clock: () => 0 }).publish_update(proxy);
        expect(reads).toEqual(["Locked", "ChargePortDoorOpen", "DoorState"]);
    });
});

describe("TeslemetryStreamPublisher: signal translation", () => {
    it("maps exactly the three audited signals", () => {
        expect(fromUpdate(UPDATE)).toEqual({ [LOCKED]: true, [CHARGE_PORT]: true, [TRUNK]: false });
    });

    it("emits no observation for absent signals", () => {
        expect(fromUpdate({ Soc: 72 })).toEqual({});
    });

    it("reads a null signal as an explicit unavailable reading", () => {
        expect(fromUpdate({ Locked: null, ChargePortDoorOpen: null, DoorState: null })).toEqual({
            [LOCKED]: null,
            [CHARGE_PORT]: null,
            [TRUNK]: null,
        });
    });

    it("coerces string-encoded booleans", () => {
        expect(fromUpdate({ Locked: "true", ChargePortDoorOpen: "false", DoorState: { TrunkFront: "true" } })).toEqual({
            [LOCKED]: true,
            [CHARGE_PORT]: false,
            [TRUNK]: true,
        });
    });

    it("reads a null nested TrunkFront as unavailable", () => {
        expect(fromUpdate({ DoorState: { TrunkFront: null } })).toEqual({ [TRUNK]: null });
    });

    it("emits no observation for a non-boolean locked", () => {
        expect(fromUpdate({ Locked: "unlocked" })).toEqual({});
    });

    it("reports TrunkFront only when a partial door state has it", () => {
        expect(fromUpdate({ DoorState: { DriverFront: true } })).toEqual({});
    });

    it("ignores a malformed door state rather than guessing", () => {
        expect(fromUpdate({ DoorState: "open" })).toEqual({});
    });

    it("never routes unaudited signals", () => {
        expect(fromUpdate({ Soc: 72, ChargerVoltage: 240 })).toEqual({});
    });

    it("leaves other fields untouched on a partial update", () => {
        const funnel = new ObservationFunnel();
        const publisher = new TeslemetryStreamPublisher({ clock: () => 0 });
        funnel.attach(publisher);
        const locked = listenTo(funnel, LOCKED);
        const port = listenTo(funnel, CHARGE_PORT);
        const trunk = listenTo(funnel, TRUNK);

        publisher.publish_update(UPDATE, { observed_at: 1 });
        publisher.publish_update({ Locked: false }, { observed_at: 2 });

        expect(locked).toEqual([true, false]);
        expect(port).toEqual([true]);
        expect(trunk).toEqual([false]);
    });

    it("shares listeners with a Bluetooth-shaped source, neither blanking the other", () => {
        // Python drives a real VehicleBluetooth here; BLE-23 adds that publisher.
        const funnel = new ObservationFunnel();
        const stream = new TeslemetryStreamPublisher({ clock: () => 0 });
        const ble = new FakePublisher();
        funnel.attach(stream);
        funnel.attach(ble);
        const seen = listenTo(funnel, LOCKED);

        stream.publish_update({ Locked: true }, { observed_at: 1 });
        ble.emit(LOCKED, LOCK_STATES.get(VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED)!, 100);

        expect(seen).toEqual([true, false]);
        expect(funnel.value(LOCKED)).toBe(false);
    });
});

describe("the funnel cannot originate work", () => {
    // Asserted against the module's own syntax tree rather than its behaviour,
    // because a request path that exists but is merely unused is still a path.
    const path = new URL("../src/funnel.ts", import.meta.url);
    const source = ts.createSourceFile("funnel.ts", readFileSync(path, "utf8"), ts.ScriptTarget.ES2022, true);

    function nodes(): ts.Node[] {
        const all: ts.Node[] = [];
        const walk = (node: ts.Node) => {
            all.push(node);
            ts.forEachChild(node, walk);
        };
        walk(source);
        return all;
    }

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("is entirely synchronous", () => {
        const kinds = new Set(nodes().map((node) => node.kind));
        expect(kinds.has(ts.SyntaxKind.AsyncKeyword)).toBe(false);
        expect(kinds.has(ts.SyntaxKind.AwaitExpression)).toBe(false);
        expect(kinds.has(ts.SyntaxKind.AwaitKeyword)).toBe(false);
    });

    it("imports no transport or scheduling machinery", () => {
        const imported = nodes()
            .filter(ts.isImportDeclaration)
            .map((node) => (node.moduleSpecifier as ts.StringLiteral).text);

        expect(imported.sort()).toEqual(["./log.js", "@teslemetry/tesla-protocol/command/vcsec"]);
    });

    it("calls nothing that could originate a request", () => {
        const forbidden = new Set([
            "setTimeout",
            "setInterval",
            "setImmediate",
            "queueMicrotask",
            "nextTick",
            "fetch",
            "sleep",
            "vehicle_data",
            "charge_state",
            "vehicle_state",
            "connect",
            "connect_if_needed",
            "wake_up",
            "_send",
            "_request",
        ]);
        const called = new Set<string>();
        for (const node of nodes()) {
            if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
                const callee = node.expression;
                if (ts.isIdentifier(callee)) {
                    called.add(callee.text);
                } else if (ts.isPropertyAccessExpression(callee)) {
                    called.add(callee.name.text);
                }
            }
        }

        expect([...called].filter((name) => forbidden.has(name))).toEqual([]);
        expect(called.has("Promise")).toBe(false);
    });

    it("mentions no timer or fetch at all, not even unused", () => {
        const identifiers = nodes()
            .filter(ts.isIdentifier)
            .map((node) => node.text);
        for (const name of ["setTimeout", "setInterval", "setImmediate", "fetch", "Worker"]) {
            expect(identifiers).not.toContain(name);
        }
    });

    it("exposes no async member", () => {
        for (const name of Object.getOwnPropertyNames(ObservationFunnel.prototype)) {
            const member = Object.getOwnPropertyDescriptor(ObservationFunnel.prototype, name)?.value;
            expect(member?.constructor?.name, name).not.toBe("AsyncFunction");
        }
    });

    it("starts no timer and makes no request, at load or in use", async () => {
        const timers = [vi.spyOn(globalThis, "setTimeout"), vi.spyOn(globalThis, "setInterval"), vi.spyOn(globalThis, "setImmediate")];
        const fetch = vi.fn();
        vi.stubGlobal("fetch", fetch);
        vi.resetModules();

        const funnelModule = await import("../src/funnel.js");
        const baseline = timers.map((timer) => timer.mock.calls.length);
        const funnel = new funnelModule.ObservationFunnel();
        const publisher = new funnelModule.VehicleDataResultPublisher();
        const stream = new funnelModule.TeslemetryStreamPublisher();
        funnel.attach(publisher);
        funnel.attach(stream);
        funnel.listen(LOCKED, noop);
        publisher.publish_result(RESULT);
        stream.publish_update(UPDATE);

        expect(timers.map((timer) => timer.mock.calls.length)).toEqual(baseline);
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("the root entry", () => {
    it("exports the funnel", () => {
        expect(root.ObservationFunnel).toBe(ObservationFunnel);
        expect(root.FieldPath).toBe(FieldPath);
        expect(root.LOCK_STATES).toBe(LOCK_STATES);
        expect(root.CLOSURE_STATES).toBe(CLOSURE_STATES);
        expect(root.VehicleDataResultPublisher).toBe(VehicleDataResultPublisher);
        expect(root.TeslemetryStreamPublisher).toBe(TeslemetryStreamPublisher);
    });
});
