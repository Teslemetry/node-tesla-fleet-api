// Behaviour specs ported from Python's `tests/test_ble_stream_glue.py` and
// `tests/test_funnel_bluetooth.py`. Broadcasts arrive over the fake link, through
// the routing a real car's do.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClosureStateE, ClosureStatuses, GearE, VehicleLockStateE, VehicleSleepStatusE } from "@teslemetry/tesla-protocol/command/vcsec";
import { BleBroadcastPublisher, BleBroadcastStreamGlue, GEAR_STATES, TONNEAU_POSITION_STATES } from "../../src/bluetooth/index.js";
import { FieldPath, Observation, ObservationFunnel, Value, VehicleDataResultPublisher } from "../../src/funnel.js";
import { bleHarness, finish } from "../helpers/blevehicle.js";

const { CLOSURESTATE_AJAR, CLOSURESTATE_CLOSED, CLOSURESTATE_CLOSING, CLOSURESTATE_FAILED_UNLATCH, CLOSURESTATE_OPEN, CLOSURESTATE_OPENING, CLOSURESTATE_UNKNOWN } = ClosureStateE;
const { VEHICLELOCKSTATE_INTERNAL_LOCKED, VEHICLELOCKSTATE_LOCKED, VEHICLELOCKSTATE_SELECTIVE_UNLOCKED, VEHICLELOCKSTATE_UNLOCKED } = VehicleLockStateE;

const DOOR_STATE_KEYS = ["DriverFront", "PassengerFront", "DriverRear", "PassengerRear", "TrunkFront", "TrunkRear"] as const;
const ALL_CLOSED = Object.fromEntries(DOOR_STATE_KEYS.map((key) => [key, false]));
const ALL_CLOSED_RAW = Object.fromEntries(DOOR_STATE_KEYS.map((key) => [key, "CLOSURESTATE_CLOSED"]));

type Call = [Record<string, unknown>, Record<string, unknown> | undefined];

class FakeSink {
    calls: Call[] = [];

    ingest(data: Record<string, unknown>, metadata?: Record<string, unknown>) {
        this.calls.push([data, metadata]);
        return data;
    }

    /** Calls carrying `key`. `Locked` fires on every broadcast, so most tests look past it. */
    callsFor(key: string): Call[] {
        return this.calls.filter(([data]) => key in data);
    }
}

async function connected() {
    const harness = bleHarness();
    await finish(harness.vehicle.connect());
    const sink = new FakeSink();
    return { ...harness, sink, glue: new BleBroadcastStreamGlue(harness.vehicle, sink) };
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("the lock state", () => {
    it.each([
        [VEHICLELOCKSTATE_LOCKED, true, "VEHICLELOCKSTATE_LOCKED"],
        [VEHICLELOCKSTATE_INTERNAL_LOCKED, true, "VEHICLELOCKSTATE_INTERNAL_LOCKED"],
        [VEHICLELOCKSTATE_UNLOCKED, false, "VEHICLELOCKSTATE_UNLOCKED"],
        [VEHICLELOCKSTATE_SELECTIVE_UNLOCKED, false, "VEHICLELOCKSTATE_SELECTIVE_UNLOCKED"],
    ])("translates %i", async (vehicleLockState, Locked, raw) => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ vehicleLockState });

        expect(sink.callsFor("Locked")).toEqual([[{ Locked }, { source: "bluetooth", raw }]]);
    });
});

describe("closures", () => {
    it.each([
        [CLOSURESTATE_CLOSED, false, "CLOSURESTATE_CLOSED"],
        [CLOSURESTATE_OPEN, true, "CLOSURESTATE_OPEN"],
        [CLOSURESTATE_AJAR, true, "CLOSURESTATE_AJAR"],
        [CLOSURESTATE_OPENING, true, "CLOSURESTATE_OPENING"],
        [CLOSURESTATE_CLOSING, true, "CLOSURESTATE_CLOSING"],
    ])("translates charge port state %i", async (chargePort, ChargePortDoorOpen, raw) => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { chargePort } as ClosureStatuses });

        expect(sink.callsFor("ChargePortDoorOpen")).toEqual([[{ ChargePortDoorOpen }, { source: "bluetooth", raw }]]);
    });

    it("carries all six leaves in one DoorState event", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { frontDriverDoor: CLOSURESTATE_OPEN } as ClosureStatuses });

        expect(sink.callsFor("DoorState")).toEqual([
            [{ DoorState: { ...ALL_CLOSED, DriverFront: true } }, { source: "bluetooth", raw: { ...ALL_CLOSED_RAW, DriverFront: "CLOSURESTATE_OPEN" } }],
        ]);
    });

    it("leaves every door listener with a real value", async () => {
        const { link, sink } = await connected();
        const latest: Record<string, unknown> = {};
        const ingest = sink.ingest.bind(sink);
        // A stream door listener reads its own key from any DoorState event.
        sink.ingest = (data, metadata) => {
            for (const key of DOOR_STATE_KEYS) {
                if ("DoorState" in data) {
                    latest[key] = (data.DoorState as Record<string, unknown>)[key];
                }
            }
            return ingest(data, metadata);
        };

        link.injectVehicleStatus({ closureStatuses: { frontTrunk: CLOSURESTATE_OPEN } as ClosureStatuses });

        expect(latest).toEqual({ ...ALL_CLOSED, TrunkFront: true });
    });

    it.each([
        ["frontDriverDoor", "DriverFront"],
        ["frontPassengerDoor", "PassengerFront"],
        ["rearDriverDoor", "DriverRear"],
        ["rearPassengerDoor", "PassengerRear"],
        ["frontTrunk", "TrunkFront"],
        ["rearTrunk", "TrunkRear"],
    ])("puts %s on the %s leaf", async (field, leaf) => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { [field]: CLOSURESTATE_OPEN } as unknown as ClosureStatuses });

        expect(sink.callsFor("DoorState")[0]?.[0].DoorState).toEqual({ ...ALL_CLOSED, [leaf]: true });
    });

    it("leaves an ambiguous leaf out", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { rearTrunk: CLOSURESTATE_UNKNOWN } as ClosureStatuses });

        const { TrunkRear: _left, ...closed } = ALL_CLOSED;
        expect(sink.callsFor("DoorState")[0]?.[0].DoorState).toEqual(closed);
    });

    it("keeps the other leaves through an enum number with no name", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { frontDriverDoor: CLOSURESTATE_OPEN, frontTrunk: 42 } as ClosureStatuses });

        const { TrunkFront: _left, ...closed } = ALL_CLOSED;
        expect(sink.callsFor("DoorState")).toEqual([
            [
                { DoorState: { ...closed, DriverFront: true } },
                { source: "bluetooth", raw: { ...ALL_CLOSED_RAW, DriverFront: "CLOSURESTATE_OPEN", TrunkFront: "42" } },
            ],
        ]);
    });

    it("emits nothing for ambiguous states", async () => {
        const { link, sink } = await connected();

        for (const state of [CLOSURESTATE_UNKNOWN, CLOSURESTATE_FAILED_UNLATCH]) {
            link.injectVehicleStatus({
                closureStatuses: { chargePort: state, frontDriverDoor: state, frontPassengerDoor: state, rearDriverDoor: state, rearPassengerDoor: state, frontTrunk: state, rearTrunk: state } as ClosureStatuses,
            });
        }

        expect(sink.callsFor("ChargePortDoorOpen")).toEqual([]);
        expect(sink.callsFor("DoorState")).toEqual([]);
    });

    it("emits nothing for a broadcast with no closures", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });

        expect(sink.callsFor("ChargePortDoorOpen")).toEqual([]);
        expect(sink.callsFor("DoorState")).toEqual([]);
    });

    it("emits nothing for an asleep frame", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP });

        expect(sink.callsFor("DoorState")).toEqual([]);
    });
});

describe("the gear", () => {
    it.each([
        [GearE.GEAR_PARK, "ShiftStateP", "GEAR_PARK"],
        [GearE.GEAR_DRIVE, "ShiftStateD", "GEAR_DRIVE"],
        [GearE.GEAR_REVERSE, "ShiftStateR", "GEAR_REVERSE"],
        [GearE.GEAR_NEUTRAL, "ShiftStateN", "GEAR_NEUTRAL"],
    ])("translates %i", async (gear, Gear, raw) => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ gear });

        expect(sink.callsFor("Gear")).toEqual([[{ Gear }, { source: "bluetooth", raw }]]);
    });

    it("emits nothing for GEAR_UNKNOWN, the default on every lock-only broadcast", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED, gear: GearE.GEAR_UNKNOWN });

        expect(sink.callsFor("Gear")).toEqual([]);
    });

    it("has a mapping for no other gear", () => {
        expect([...GEAR_STATES.keys()]).not.toContain(GearE.GEAR_UNKNOWN);
    });
});

describe("the tonneau", () => {
    it.each([
        [CLOSURESTATE_CLOSED, "TonneauPositionStateClosed", "CLOSURESTATE_CLOSED"],
        [CLOSURESTATE_OPEN, "TonneauPositionStateFullyOpen", "CLOSURESTATE_OPEN"],
        [CLOSURESTATE_AJAR, "TonneauPositionStatePartiallyOpen", "CLOSURESTATE_AJAR"],
    ])("translates %i", async (tonneau, TonneauPosition, raw) => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { tonneau } as ClosureStatuses });

        expect(sink.callsFor("TonneauPosition")).toEqual([[{ TonneauPosition }, { source: "bluetooth", raw }]]);
    });

    it.each([[CLOSURESTATE_OPENING], [CLOSURESTATE_CLOSING], [CLOSURESTATE_UNKNOWN], [CLOSURESTATE_FAILED_UNLATCH]])("emits nothing for %i", async (tonneau) => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ closureStatuses: { tonneau } as ClosureStatuses });

        expect(sink.callsFor("TonneauPosition")).toEqual([]);
        expect(TONNEAU_POSITION_STATES.has(tonneau)).toBe(false);
    });

    it("passes the percent through", async () => {
        const { link, sink } = await connected();

        link.injectVehicleStatus({ detailedClosureStatus: { tonneauPercentOpen: 42 } as never });

        expect(sink.callsFor("TonneauOpenPercent")).toEqual([[{ TonneauOpenPercent: 42 }, { source: "bluetooth" }]]);
    });
});

describe("the lifecycle", () => {
    it("stops every listener", async () => {
        const { link, sink, glue } = await connected();

        glue.stop();
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED, gear: GearE.GEAR_DRIVE, closureStatuses: { chargePort: CLOSURESTATE_OPEN, tonneau: CLOSURESTATE_OPEN } as ClosureStatuses, detailedClosureStatus: { tonneauPercentOpen: 10 } as never });

        expect(sink.calls).toEqual([]);
    });

    it("stops twice without complaint", async () => {
        const { glue } = await connected();

        glue.stop();

        expect(() => glue.stop()).not.toThrow();
    });

    it("does not touch the transport to register", () => {
        const { vehicle, link } = bleHarness();

        new BleBroadcastStreamGlue(vehicle, new FakeSink());

        expect(link.calls).toEqual([]);
    });
});

describe("the sink contract", () => {
    it("takes any object with ingest", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const calls: unknown[] = [];
        const glue = new BleBroadcastStreamGlue(vehicle, { ingest: (...args) => calls.push(args) });

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });

        // Only Locked: the omitted gear decodes to GEAR_UNKNOWN.
        expect(calls).toHaveLength(1);
        glue.stop();
    });

    it("imports no stream package", () => {
        const source = readFileSync(resolve(import.meta.dirname, "../../src/bluetooth/streamglue.ts"), "utf8");
        const imports = [...source.matchAll(/from "([^"]+)"/g)].map(([, name]) => name);

        expect(imports.filter((name) => !name!.startsWith(".") && !name!.startsWith("@teslemetry/tesla-protocol/"))).toEqual([]);
    });

    it("adds no stream dependency", () => {
        const manifest = readFileSync(resolve(import.meta.dirname, "../../package.json"), "utf8");
        const { dependencies = {}, peerDependencies = {}, optionalDependencies = {} } = JSON.parse(manifest) as Record<string, Record<string, string>>;

        expect(Object.keys({ ...dependencies, ...peerDependencies, ...optionalDependencies }).filter((name) => name.includes("stream"))).toEqual([]);
    });
});

describe("BleBroadcastPublisher", () => {
    const closurePaths = new Set([FieldPath.CHARGE_PORT_DOOR_OPEN, FieldPath.DOOR_STATE_TRUNK_FRONT]);

    function collect() {
        const observations: Observation[] = [];
        return { observations, publish: (observation: Observation) => observations.push(observation) };
    }

    async function attached(paths: ReadonlySet<FieldPath> = new Set(Object.values(FieldPath))) {
        const harness = bleHarness();
        await finish(harness.vehicle.connect());
        const sink = collect();
        const publisher = new BleBroadcastPublisher(harness.vehicle, { clock: () => 0 });
        const detach = publisher.attach(sink);
        publisher.request(paths);
        return { ...harness, publisher, sink, detach };
    }

    const pairs = (observations: Observation[]) => observations.map(({ path, value }) => [path, value]);

    it("offers the three broadcast fields", () => {
        expect(new BleBroadcastPublisher(bleHarness().vehicle).paths).toEqual(new Set(Object.values(FieldPath)));
    });

    it("maps lock states to booleans", async () => {
        const { link, sink } = await attached();

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_UNLOCKED });
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_INTERNAL_LOCKED });
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_SELECTIVE_UNLOCKED });

        expect(pairs(sink.observations)).toEqual([
            [FieldPath.LOCKED, true],
            [FieldPath.LOCKED, false],
            [FieldPath.LOCKED, true],
            [FieldPath.LOCKED, false],
        ]);
    });

    it.each([
        [CLOSURESTATE_CLOSED, false],
        [CLOSURESTATE_OPEN, true],
        [CLOSURESTATE_AJAR, true],
        [CLOSURESTATE_OPENING, true],
        [CLOSURESTATE_CLOSING, true],
    ])("maps closure state %i", async (state, expected) => {
        const { link, sink } = await attached(closurePaths);

        link.injectVehicleStatus({ closureStatuses: { chargePort: state, frontTrunk: state } as ClosureStatuses });

        expect(pairs(sink.observations)).toEqual([
            [FieldPath.CHARGE_PORT_DOOR_OPEN, expected],
            [FieldPath.DOOR_STATE_TRUNK_FRONT, expected],
        ]);
    });

    it("emits nothing for ambiguous closure states", async () => {
        const { link, sink } = await attached(closurePaths);

        for (const state of [CLOSURESTATE_UNKNOWN, CLOSURESTATE_FAILED_UNLATCH]) {
            link.injectVehicleStatus({ closureStatuses: { chargePort: state, frontTrunk: state } as ClosureStatuses });
        }

        expect(sink.observations).toEqual([]);
    });

    it("emits no closure for a broadcast without any", async () => {
        const { link, sink } = await attached(closurePaths);

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });

        expect(sink.observations).toEqual([]);
    });

    it("stamps each observation from its clock", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const sink = collect();
        const publisher = new BleBroadcastPublisher(vehicle, { clock: () => 12.5 });
        publisher.attach(sink);
        publisher.request(new Set([FieldPath.LOCKED]));

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });

        expect(sink.observations[0]?.observed_at).toBe(12.5);
    });

    it("lets the funnel dedupe the lock state every broadcast repeats", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const funnel = new ObservationFunnel();
        funnel.attach(new BleBroadcastPublisher(vehicle, { clock: () => 1 }));
        const seen: Value[] = [];
        funnel.listen(FieldPath.LOCKED, (value) => seen.push(value));

        link.injectVehicleStatus({ closureStatuses: { frontTrunk: CLOSURESTATE_CLOSED } as ClosureStatuses });
        link.injectVehicleStatus({ closureStatuses: { frontTrunk: CLOSURESTATE_OPEN } as ClosureStatuses });

        expect(seen).toEqual([false]);
    });

    it("brackets the listener with request and release", async () => {
        const { link, publisher, sink } = await attached(new Set([FieldPath.LOCKED]));

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });
        expect(sink.observations).toHaveLength(1);

        publisher.release(new Set([FieldPath.LOCKED]));
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_UNLOCKED });
        expect(sink.observations).toHaveLength(1);
    });

    it("subscribes only what was requested", async () => {
        const { link, sink } = await attached(new Set([FieldPath.LOCKED]));

        link.injectVehicleStatus({ closureStatuses: { chargePort: CLOSURESTATE_OPEN, frontTrunk: CLOSURESTATE_OPEN } as ClosureStatuses });

        expect(sink.observations.map(({ path }) => path)).toEqual([FieldPath.LOCKED]);
    });

    it("drops every subscription on detach", async () => {
        const { link, sink, detach } = await attached();

        detach();
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });

        expect(sink.observations).toEqual([]);
    });

    it("never drives the transport", () => {
        const { vehicle, link } = bleHarness();
        const publisher = new BleBroadcastPublisher(vehicle);
        publisher.attach(collect());
        publisher.request(publisher.paths);
        publisher.release(publisher.paths);

        expect(link.calls).toEqual([]);
    });

    it("publishes nothing for a lost session", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const funnel = new ObservationFunnel();
        const detach = funnel.attach(new BleBroadcastPublisher(vehicle, { clock: () => 1 }));
        const seen: Value[] = [];
        funnel.listen(FieldPath.LOCKED, (value) => seen.push(value));
        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_LOCKED });

        link.dropLink();
        detach();

        expect(seen).toEqual([true]);
        expect(funnel.value(FieldPath.LOCKED)).toBe(true);
    });
});

// The reported failure: firmware moved lock, charge port and front trunk to
// Bluetooth broadcasts, so with Bluetooth out of reach they had no source at all.
describe("the three fields, on two sources", () => {
    const RESULT = { response: { vehicle_state: { locked: true, ft: 0 }, charge_state: { charge_port_door_open: false } } };

    function compose() {
        const { vehicle, link } = bleHarness();
        const funnel = new ObservationFunnel();
        funnel.attach(new BleBroadcastPublisher(vehicle, { clock: () => 100 }));
        const results = new VehicleDataResultPublisher({ clock: () => 0 });
        funnel.attach(results);
        const seen = Object.fromEntries(Object.values(FieldPath).map((path) => [path, [] as Value[]]));
        for (const path of Object.values(FieldPath)) {
            funnel.listen(path, (value) => seen[path]!.push(value));
        }
        return { vehicle, link, funnel, results, seen };
    }

    it("keeps them when Bluetooth never connects", () => {
        const { funnel, results, seen } = compose();

        results.publish_result(RESULT, { observed_at: 1 });

        expect(seen).toEqual({ [FieldPath.LOCKED]: [true], [FieldPath.CHARGE_PORT_DOOR_OPEN]: [false], [FieldPath.DOOR_STATE_TRUNK_FRONT]: [false] });
        for (const path of Object.values(FieldPath)) {
            expect(funnel.value(path)).not.toBeNull();
        }
    });

    it("updates the same listeners when Bluetooth comes back", async () => {
        const { vehicle, link, results, seen } = compose();
        results.publish_result(RESULT, { observed_at: 1 });
        await finish(vehicle.connect());

        link.injectVehicleStatus({ vehicleLockState: VEHICLELOCKSTATE_UNLOCKED });
        link.injectVehicleStatus({ closureStatuses: { chargePort: CLOSURESTATE_OPEN, frontTrunk: CLOSURESTATE_OPEN } as ClosureStatuses });

        expect(seen[FieldPath.LOCKED]).toEqual([true, false]);
        expect(seen[FieldPath.CHARGE_PORT_DOOR_OPEN]).toEqual([false, true]);
        expect(seen[FieldPath.DOOR_STATE_TRUNK_FRONT]).toEqual([false, true]);
    });
});
