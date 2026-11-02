import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import {
    ClosureStateE,
    ClosureStatuses,
    CommandStatus,
    DetailedClosureStatus,
    FromVCSECMessage,
    GearE,
    OperationStatusE,
    UIDesireE,
    UserPresenceE,
    VehicleLockStateE,
    VehicleSleepStatusE,
    VehicleStatus,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { INFOTAINMENT, VCSEC, bleHarness, finish } from "../helpers/blevehicle.js";

async function connected() {
    const harness = bleHarness();
    await finish(harness.vehicle.connect());
    return harness;
}

function closures(fields: Partial<ClosureStatuses> = {}): ClosureStatuses {
    return ClosureStatuses.create(fields);
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("typed field listeners", () => {
    it("fires the lock state", async () => {
        const { vehicle, link } = await connected();
        const seen: VehicleLockStateE[] = [];
        vehicle.listen_vehicle_lock_state((state) => seen.push(state));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toEqual([VehicleLockStateE.VEHICLELOCKSTATE_LOCKED]);
    });

    it("fires the sleep status", async () => {
        const { vehicle, link } = await connected();
        const seen: VehicleSleepStatusE[] = [];
        vehicle.listen_vehicle_sleep_status((status) => seen.push(status));

        link.injectVehicleStatus({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP });

        expect(seen).toEqual([VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP]);
    });

    it("fires user presence", async () => {
        const { vehicle, link } = await connected();
        const seen: UserPresenceE[] = [];
        vehicle.listen_user_presence((presence) => seen.push(presence));

        link.injectVehicleStatus({ userPresence: UserPresenceE.VEHICLE_USER_PRESENCE_PRESENT });

        expect(seen).toEqual([UserPresenceE.VEHICLE_USER_PRESENCE_PRESENT]);
    });

    it("fires several listeners from one broadcast", async () => {
        const { vehicle, link } = await connected();
        const locks: VehicleLockStateE[] = [];
        const sleeps: VehicleSleepStatusE[] = [];
        vehicle.listen_vehicle_lock_state((state) => locks.push(state));
        vehicle.listen_vehicle_sleep_status((status) => sleeps.push(status));

        link.injectVehicleStatus({
            vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED,
            vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE,
        });

        expect(locks).toEqual([VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED]);
        expect(sleeps).toEqual([VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE]);
    });

    it("fires the gear", async () => {
        const { vehicle, link } = await connected();
        const seen: GearE[] = [];
        vehicle.listen_gear((gear) => seen.push(gear));

        link.injectVehicleStatus({ gear: GearE.GEAR_DRIVE });

        expect(seen).toEqual([GearE.GEAR_DRIVE]);
    });

    it("fires the gear's default when a broadcast has none, as proto3 cannot tell", async () => {
        const { vehicle, link } = await connected();
        const seen: GearE[] = [];
        vehicle.listen_gear((gear) => seen.push(gear));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toEqual([GearE.GEAR_UNKNOWN]);
    });

    it("fires the UI desire", async () => {
        const { vehicle, link } = await connected();
        const seen: UIDesireE[] = [];
        vehicle.listen_ui_desire((desire) => seen.push(desire));

        link.injectVehicleStatus({ UIDesire: UIDesireE.UI_DESIRE_HAS_DATA });

        expect(seen).toEqual([UIDesireE.UI_DESIRE_HAS_DATA]);
    });

    it("fires the UI desire's default when a broadcast has none", async () => {
        const { vehicle, link } = await connected();
        const seen: UIDesireE[] = [];
        vehicle.listen_ui_desire((desire) => seen.push(desire));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toEqual([UIDesireE.UI_DESIRE_NONE]);
    });
});

describe("closure listeners", () => {
    it("reads each closure from its own field", async () => {
        const { vehicle, link } = await connected();
        const seen: Record<string, ClosureStateE> = {};
        const record = (name: string) => (state: ClosureStateE) => {
            seen[name] = state;
        };
        vehicle.listen_front_driver_door(record("frontDriverDoor"));
        vehicle.listen_front_passenger_door(record("frontPassengerDoor"));
        vehicle.listen_rear_driver_door(record("rearDriverDoor"));
        vehicle.listen_rear_passenger_door(record("rearPassengerDoor"));
        vehicle.listen_front_trunk(record("frontTrunk"));
        vehicle.listen_rear_trunk(record("rearTrunk"));
        vehicle.listen_charge_port(record("chargePort"));
        vehicle.listen_tonneau(record("tonneau"));
        const expected = {
            frontDriverDoor: ClosureStateE.CLOSURESTATE_CLOSED,
            frontPassengerDoor: ClosureStateE.CLOSURESTATE_OPEN,
            rearDriverDoor: ClosureStateE.CLOSURESTATE_AJAR,
            rearPassengerDoor: ClosureStateE.CLOSURESTATE_UNKNOWN,
            frontTrunk: ClosureStateE.CLOSURESTATE_FAILED_UNLATCH,
            rearTrunk: ClosureStateE.CLOSURESTATE_OPENING,
            chargePort: ClosureStateE.CLOSURESTATE_CLOSING,
            tonneau: ClosureStateE.CLOSURESTATE_OPEN,
        };

        link.injectVehicleStatus({ closureStatuses: closures(expected) });

        expect(seen).toEqual(expected);
    });

    it("hands over the whole block once", async () => {
        const { vehicle, link } = await connected();
        const seen: ClosureStatuses[] = [];
        vehicle.listen_closure_statuses((block) => seen.push(block));

        link.injectVehicleStatus({ closureStatuses: closures({ frontTrunk: ClosureStateE.CLOSURESTATE_OPEN }) });

        expect(seen).toHaveLength(1);
        expect(seen[0]?.frontTrunk).toBe(ClosureStateE.CLOSURESTATE_OPEN);
    });

    it("stays silent when a broadcast has no closure block", async () => {
        const { vehicle, link } = await connected();
        const seen: unknown[] = [];
        vehicle.listen_closure_statuses((block) => seen.push(block));
        vehicle.listen_front_driver_door((state) => seen.push(state));
        vehicle.listen_front_passenger_door((state) => seen.push(state));
        vehicle.listen_rear_driver_door((state) => seen.push(state));
        vehicle.listen_rear_passenger_door((state) => seen.push(state));
        vehicle.listen_front_trunk((state) => seen.push(state));
        vehicle.listen_rear_trunk((state) => seen.push(state));
        vehicle.listen_charge_port((state) => seen.push(state));
        vehicle.listen_tonneau((state) => seen.push(state));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toEqual([]);
    });

    it("stays silent on an asleep frame, whose closures are unknown", async () => {
        const { vehicle, link } = await connected();
        const doors: ClosureStateE[] = [];
        const sleeps: VehicleSleepStatusE[] = [];
        vehicle.listen_front_driver_door((state) => doors.push(state));
        vehicle.listen_vehicle_sleep_status((status) => sleeps.push(status));

        link.injectVehicleStatus({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP });

        expect(doors).toEqual([]);
        expect(sleeps).toEqual([VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP]);
    });
});

describe("listen_tonneau_percent_open", () => {
    it("fires when the detail is present", async () => {
        const { vehicle, link } = await connected();
        const seen: number[] = [];
        vehicle.listen_tonneau_percent_open((percent) => seen.push(percent));

        link.injectVehicleStatus({ detailedClosureStatus: DetailedClosureStatus.create({ tonneauPercentOpen: 42 }) });

        expect(seen).toEqual([42]);
    });

    it("stays silent otherwise, rather than reporting 0%", async () => {
        const { vehicle, link } = await connected();
        const seen: number[] = [];
        vehicle.listen_tonneau_percent_open((percent) => seen.push(percent));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toEqual([]);
    });
});

describe("unsubscribe", () => {
    it("stops delivery", async () => {
        const { vehicle, link } = await connected();
        const seen: VehicleLockStateE[] = [];
        const raw: RoutableMessage[] = [];
        const unsubscribe = vehicle.listen_vehicle_lock_state((state) => seen.push(state));
        const unsubscribeRaw = vehicle.listen_broadcast(VCSEC, (message) => raw.push(message));

        link.injectVehicleStatus({});
        unsubscribe();
        unsubscribeRaw();
        link.injectVehicleStatus({});

        expect(seen).toHaveLength(1);
        expect(raw).toHaveLength(1);
    });

    it("is safe to call twice, and removes no one else", async () => {
        const { vehicle, link } = await connected();
        const seen: string[] = [];
        const callback = () => seen.push("shared");
        const first = vehicle.listen_gear(callback);
        vehicle.listen_gear(callback);
        vehicle.listen_gear(() => seen.push("other"));

        first();
        first();
        link.injectVehicleStatus({});

        expect(seen).toEqual(["shared", "other"]);
    });

    it("may be called from inside a dispatch", async () => {
        const { vehicle, link } = await connected();
        const seen: string[] = [];
        const unsubscribe = vehicle.listen_gear(() => {
            seen.push("first");
            unsubscribe();
        });
        vehicle.listen_gear(() => seen.push("second"));

        link.injectVehicleStatus({});
        link.injectVehicleStatus({});

        expect(seen).toEqual(["first", "second", "second"]);
    });
});

describe("listen_broadcast", () => {
    it("receives the raw message", async () => {
        const { vehicle, link } = await connected();
        const seen: RoutableMessage[] = [];
        vehicle.listen_broadcast(VCSEC, (message) => seen.push(message));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toHaveLength(1);
        expect(FromVCSECMessage.decode(seen[0]!.protobufMessageAsBytes!).vehicleStatus?.vehicleLockState).toBe(
            VehicleLockStateE.VEHICLELOCKSTATE_LOCKED,
        );
    });

    it("covers payloads with no typed listener", async () => {
        const { vehicle, link } = await connected();
        const seen: RoutableMessage[] = [];
        const typed: VehicleLockStateE[] = [];
        vehicle.listen_broadcast(VCSEC, (message) => seen.push(message));
        vehicle.listen_vehicle_lock_state((state) => typed.push(state));

        link.injectMessage(
            RoutableMessage.fromPartial({
                fromDestination: { domain: VCSEC },
                protobufMessageAsBytes: FromVCSECMessage.encode(
                    FromVCSECMessage.create({ commandStatus: CommandStatus.create({ operationStatus: OperationStatusE.OPERATIONSTATUS_OK }) }),
                ).finish(),
            }),
        );

        expect(seen).toHaveLength(1);
        expect(typed).toEqual([]);
    });

    it("is scoped to its domain", async () => {
        const { vehicle, link } = await connected();
        const seen: RoutableMessage[] = [];
        vehicle.listen_broadcast(INFOTAINMENT, (message) => seen.push(message));

        link.injectVehicleStatus({});
        expect(seen).toEqual([]);

        link.injectMessage(RoutableMessage.fromPartial({ fromDestination: { domain: INFOTAINMENT } }));
        expect(seen).toHaveLength(1);
    });
});

describe("bare VCSEC frames", () => {
    it("reach the raw listener", async () => {
        const { vehicle, link } = await connected();
        const seen: RoutableMessage[] = [];
        vehicle.listen_broadcast(VCSEC, (message) => seen.push(message));

        link.injectBareVcsec(FromVCSECMessage.fromPartial({ authenticationRequest: { requestedLevel: 1 } }));

        expect(seen).toHaveLength(1);
        expect(FromVCSECMessage.decode(seen[0]!.protobufMessageAsBytes!).authenticationRequest).toBeDefined();
    });

    it("reach a typed listener", async () => {
        const { vehicle, link } = await connected();
        const seen: VehicleLockStateE[] = [];
        vehicle.listen_vehicle_lock_state((state) => seen.push(state));

        link.injectBareVcsec(FromVCSECMessage.fromPartial({ vehicleStatus: { vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED } }));

        expect(seen).toEqual([VehicleLockStateE.VEHICLELOCKSTATE_LOCKED]);
    });
});

describe("a throwing listener", () => {
    const boom = () => {
        throw new Error("boom");
    };

    it("does not stop later raw listeners", async () => {
        const { vehicle, link } = await connected();
        const seen: RoutableMessage[] = [];
        vehicle.listen_broadcast(VCSEC, boom);
        vehicle.listen_broadcast(VCSEC, (message) => seen.push(message));

        link.injectVehicleStatus({});

        expect(seen).toHaveLength(1);
    });

    it("does not stop later typed listeners", async () => {
        const { vehicle, link } = await connected();
        const seen: GearE[] = [];
        vehicle.listen_gear(boom);
        vehicle.listen_gear((gear) => seen.push(gear));

        link.injectVehicleStatus({});

        expect(seen).toHaveLength(1);
    });

    it("does not stop routing of the reply after it", async () => {
        const { vehicle, link } = bleHarness({ mtu: 517 });
        await finish(vehicle.handshakeVehicleSecurity());
        vehicle.listen_gear(boom);
        vehicle.listen_broadcast(VCSEC, boom);
        link.rewriteNextReply((reply) => {
            return [
                {
                    message: RoutableMessage.fromPartial({
                        fromDestination: { domain: VCSEC },
                        protobufMessageAsBytes: FromVCSECMessage.encode(FromVCSECMessage.create({ vehicleStatus: VehicleStatus.create() })).finish(),
                    }),
                },
                { message: reply },
            ];
        });

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });

    it("is logged", async () => {
        const lines: string[] = [];
        const { vehicle, link } = bleHarness({ logger: { debug: (line) => lines.push(line) } });
        await finish(vehicle.connect());
        vehicle.listen_gear(boom);

        link.injectVehicleStatus({});

        expect(lines.some((line) => line.includes("listener failed") && line.includes("boom"))).toBe(true);
    });
});

describe("addressed messages", () => {
    it("never reach a listener", async () => {
        const { vehicle } = await connected();
        const seen: unknown[] = [];
        vehicle.listen_broadcast(VCSEC, (message) => seen.push(message));
        vehicle.listen_vehicle_lock_state((state) => seen.push(state));

        await finish(vehicle.vehicle_state());

        expect(seen).toEqual([]);
    });

    it("do not satisfy a reply wait when unaddressed", async () => {
        const { vehicle, link } = await connected();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply();
        const read = vehicle.vehicle_state();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        await expect(finish(read)).rejects.toThrow();
    });
});

describe("listener lifetime", () => {
    it("survives a disconnect and a reconnect", async () => {
        const { vehicle, link } = await connected();
        const seen: GearE[] = [];
        vehicle.listen_gear((gear) => seen.push(gear));

        await finish(vehicle.disconnect());
        await finish(vehicle.connect());
        link.injectVehicleStatus({ gear: GearE.GEAR_PARK });

        expect(seen).toEqual([GearE.GEAR_PARK]);
    });

    it("survives a dropped link", async () => {
        const { vehicle, link } = await connected();
        const seen: GearE[] = [];
        vehicle.listen_gear((gear) => seen.push(gear));

        link.dropLink();
        await finish(vehicle.connect());
        link.injectVehicleStatus({ gear: GearE.GEAR_PARK });

        expect(seen).toEqual([GearE.GEAR_PARK]);
    });

    it("is not shared between vehicles", async () => {
        const first = await connected();
        const second = await connected();
        const seen: GearE[] = [];
        first.vehicle.listen_gear((gear) => seen.push(gear));

        second.link.injectVehicleStatus({});

        expect(seen).toEqual([]);
    });

    it("works on a passive listener with no key", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });
        await finish(vehicle.connect());
        const seen: VehicleLockStateE[] = [];
        vehicle.listen_vehicle_lock_state((state) => seen.push(state));

        link.injectVehicleStatus({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        expect(seen).toEqual([VehicleLockStateE.VEHICLELOCKSTATE_LOCKED]);
    });
});
