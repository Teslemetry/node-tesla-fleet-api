import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { Response, VehicleAction } from "@teslemetry/tesla-protocol/command/car_server";
import { GenericErrorE, NominalError } from "@teslemetry/tesla-protocol/command/errors";
import {
    ClosureMoveRequest,
    ClosureMoveTypeE,
    FromVCSECMessage,
    RKEActionE,
    UnsignedMessage,
    VehicleLockStateE,
    VehicleSleepStatusE,
    VehicleStatus,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { ChargeState, ClimateState, MediaState, VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import { infotainmentVerifyPlan, vcsecVerifyPlan } from "../../src/bluetooth/verify.js";
import {
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothTransportError,
    BluetoothUnconfirmedCommand,
    TeslaFleetMessageFaultInvalidSignature,
} from "../../src/exceptions.js";
import { INFOTAINMENT, VCSEC, BleHarnessOptions, TestVehicle, bleHarness, finish, timed } from "../helpers/blevehicle.js";

const OK = { response: { result: true, reason: "" } };
const LOCKED = VehicleLockStateE.VEHICLELOCKSTATE_LOCKED;
const UNLOCKED = VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED;
const SELECTIVE_UNLOCKED = VehicleLockStateE.VEHICLELOCKSTATE_SELECTIVE_UNLOCKED;

async function ready(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return harness;
}

type Harness = Awaited<ReturnType<typeof ready>>;

/** The ack of the next command is lost, and the read after it gets `data`. */
function loseAckThenAnswer({ link, fakeVehicle }: Harness, data: Partial<VehicleData>): void {
    link.rewriteNextReply(() => {
        fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ vehicleData: VehicleData.fromPartial(data) }));
        return [];
    });
}

/** The ack of the next command and the reply to the read after it are both lost. */
function loseAckAndRead({ link }: Harness): void {
    link.dropNextReply();
    link.dropNextReply();
}

function addressed(vehicle: TestVehicle, vcsec: FromVCSECMessage): RoutableMessage {
    return RoutableMessage.fromPartial({
        toDestination: { routingAddress: vehicle.routingAddress },
        fromDestination: { domain: VCSEC },
        protobufMessageAsBytes: FromVCSECMessage.encode(vcsec).finish(),
    });
}

const rejection = FromVCSECMessage.create({ nominalError: NominalError.create({ genericError: GenericErrorE.GENERICERROR_VEHICLE_NOT_IN_PARK }) });

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("options", () => {
    it("defaults to ack with no raise", () => {
        const { vehicle } = bleHarness();
        expect(vehicle.confirmation).toBe("ack");
        expect(vehicle.raise_unconfirmed).toBe(false);
        expect(vehicle.wake_if_asleep).toBe(true);
    });

    it("refuses an unknown confirmation", () => {
        expect(() => bleHarness({ confirmation: "maybe" as never })).toThrow("confirmation must be one of");
    });

    it("offers read-only views of the old flags", () => {
        expect(bleHarness({ confirmation: "optimistic" }).vehicle.optimistic).toBe(true);
        expect(bleHarness({ confirmation: "verify" }).vehicle.verify_commands).toBe(true);
        expect(bleHarness().vehicle.optimistic).toBe(false);
        expect(bleHarness().vehicle.verify_commands).toBe(false);
    });
});

describe("the unconfirmed error", () => {
    it("is a timeout that says so", () => {
        const error = new BluetoothUnconfirmedCommand();
        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error.unconfirmed).toBe(true);
    });

    it("chains the timeout behind it", async () => {
        const harness = await ready({ raise_unconfirmed: true });
        harness.link.dropNextReply();

        const { error } = await timed(() => harness.vehicle.door_lock());

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect((error as Error).cause).toBeInstanceOf(BluetoothTimeout);
    });
});

describe("a lost ack", () => {
    it("raises unconfirmed on a VCSEC actuation, when asked to", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        await expect(finish(vehicle.door_unlock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("raises unconfirmed on an infotainment action, when asked to", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        await expect(finish(vehicle.charge_start())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("leaves ping with a plain timeout, as it cannot change the car", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        const { error } = await timed(() => vehicle.ping());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("resolves best effort by default", async () => {
        const { vehicle, link } = await ready();
        link.dropNextReply();
        await expect(finish(vehicle.door_unlock())).resolves.toEqual(OK);

        link.dropNextReply();
        await expect(finish(vehicle.charge_start())).resolves.toEqual(OK);
    });

    it("gives a plain timeout to a handshake, where nothing was sent", async () => {
        const { vehicle, link } = bleHarness({ raise_unconfirmed: true });
        link.dropNextReply("session_info");

        const { error } = await timed(() => vehicle.door_lock());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect(link.commands()).toEqual([]);
    });

    it.each([false, true])("never sends the command twice (raise_unconfirmed: %s)", async (raise_unconfirmed) => {
        for (const confirmation of ["ack", "verify"] as const) {
            const { vehicle, link, fakeVehicle } = await ready({ raise_unconfirmed, confirmation });
            fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: UNLOCKED });

            link.dropNextReply();
            await timed(() => vehicle.charge_start());
            link.dropNextReply();
            await timed(() => vehicle.door_lock());
            await vi.advanceTimersByTimeAsync(60_000);

            expect(fakeVehicle.infotainmentActions.filter((action) => action.vehicleAction?.chargingStartStopAction)).toHaveLength(1);
            expect(fakeVehicle.vcsecCommands.filter((command) => command.RKEAction === RKEActionE.RKE_ACTION_LOCK)).toHaveLength(1);
        }
    });
});

describe("reads", () => {
    it("keep a plain timeout whatever raise_unconfirmed says", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        const { error } = await timed(() => vehicle.vehicle_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("stay plain by default too", async () => {
        const { vehicle, link } = await ready();
        link.dropNextReply();

        const { error } = await timed(() => vehicle.charge_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("return their field", async () => {
        const { vehicle, fakeVehicle } = await ready();
        fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ vehicleData: VehicleData.fromPartial({ chargeState: { chargeLimitSoc: 80 } }) }));

        await expect(finish(vehicle.charge_state())).resolves.toMatchObject({ chargeLimitSoc: 80 });
    });
});

describe("verify plans", () => {
    const hasPlan = (action: Partial<VehicleAction>) => infotainmentVerifyPlan(VehicleAction.fromPartial(action)) !== null;

    it("cover lock and unlock on VCSEC, and nothing else", () => {
        expect(vcsecVerifyPlan(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_LOCK }))).not.toBeNull();
        expect(vcsecVerifyPlan(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_UNLOCK }))).not.toBeNull();
        expect(vcsecVerifyPlan(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_WAKE_VEHICLE }))).toBeNull();
        expect(
            vcsecVerifyPlan(
                UnsignedMessage.create({
                    closureMoveRequest: ClosureMoveRequest.create({ rearTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE }),
                }),
            ),
        ).toBeNull();
    });

    it("cover the five infotainment commands, and nothing else", () => {
        expect(hasPlan({ chargingSetLimitAction: { percent: 80 } })).toBe(true);
        expect(hasPlan({ setChargingAmpsAction: { chargingAmps: 16 } })).toBe(true);
        expect(hasPlan({ mediaUpdateVolume: { volumeAbsoluteFloat: 3 } })).toBe(true);
        expect(hasPlan({ hvacTemperatureAdjustmentAction: { driverTempCelsius: 21 } })).toBe(true);
        expect(hasPlan({ hvacAutoAction: { powerOn: true } })).toBe(true);

        expect(hasPlan({ mediaUpdateVolume: { volumeDelta: 1 } })).toBe(false);
        expect(hasPlan({ vehicleControlFlashLightsAction: {} })).toBe(false);
        expect(hasPlan({ chargingStartStopAction: { start: {} } })).toBe(false);
        expect(infotainmentVerifyPlan(undefined)).toBeNull();
    });

    it("compare float32 settings as the wire carries them", () => {
        const plan = infotainmentVerifyPlan(VehicleAction.fromPartial({ hvacTemperatureAdjustmentAction: { driverTempCelsius: 21.7, passengerTempCelsius: 19.3 } }));
        const decoded = ClimateState.decode(ClimateState.encode(ClimateState.fromPartial({ driverTempSetting: 21.7, passengerTempSetting: 19.3 })).finish());

        expect(decoded.driverTempSetting).not.toBe(21.7);
        expect((plan?.executed as (state: ClimateState) => boolean)(decoded)).toBe(true);
    });

    it("treat a field the reply left out as unread, not as a mismatch", () => {
        const plan = infotainmentVerifyPlan(VehicleAction.fromPartial({ hvacAutoAction: { powerOn: false } }));
        expect((plan?.executed as (state: ClimateState) => boolean | undefined)(ClimateState.create({}))).toBeUndefined();
    });
});

describe('confirmation: "verify"', () => {
    const verify = { confirmation: "verify", raise_unconfirmed: true } as const;

    it("turns a matching read into success on lock", async () => {
        const harness = await ready(verify);
        harness.fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: LOCKED });
        harness.link.dropNextReply();

        await expect(finish(harness.vehicle.door_lock())).resolves.toEqual(OK);
        expect(harness.link.commands(VCSEC)).toHaveLength(2);
    });

    it.each([true, false])("raises BluetoothCommandFailed on a mismatch (raise_unconfirmed: %s)", async (raise_unconfirmed) => {
        const harness = await ready({ confirmation: "verify", raise_unconfirmed });
        harness.fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: LOCKED });
        harness.link.dropNextReply();

        const { error } = await timed(() => harness.vehicle.door_unlock());

        expect(error).toBeInstanceOf(BluetoothCommandFailed);
        expect(error).not.toBeInstanceOf(BluetoothTimeout);
        expect((error as Error).cause).toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("does no read for a VCSEC command with no plan", async () => {
        const harness = await ready(verify);
        harness.link.dropNextReply();

        await expect(finish(harness.vehicle.actuate_trunk("rear"))).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(harness.link.commands(VCSEC)).toHaveLength(1);
    });

    it("confirms a charge limit", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { chargeState: { chargeLimitSoc: 80 } });

        await expect(finish(harness.vehicle.set_charge_limit(80))).resolves.toEqual(OK);
        expect(harness.link.commands(INFOTAINMENT)).toHaveLength(2);
    });

    it("fails a charge limit that does not match", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { chargeState: { chargeLimitSoc: 70 } });

        await expect(finish(harness.vehicle.set_charge_limit(80))).rejects.toBeInstanceOf(BluetoothCommandFailed);
    });

    it("confirms charging amps", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { chargeState: { chargingAmps: 16 } });

        await expect(finish(harness.vehicle.set_charging_amps(16))).resolves.toEqual(OK);
    });

    it("confirms an absolute volume, across the float32 wire", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { mediaState: MediaState.fromPartial({ audioVolume: 5.1 }) });

        await expect(finish(harness.vehicle.adjust_volume(5.1))).resolves.toEqual(OK);
    });

    it("does no read for a relative volume step", async () => {
        const harness = await ready(verify);
        harness.link.dropNextReply();

        await expect(finish(harness.vehicle.media_volume_down())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(harness.link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("confirms temperatures, across the float32 wire", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { climateState: { driverTempSetting: 21.7, passengerTempSetting: 19.3 } });

        await expect(finish(harness.vehicle.set_temps(21.7, 19.3))).resolves.toEqual(OK);
    });

    it("confirms climate on", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { climateState: { isClimateOn: true } });

        await expect(finish(harness.vehicle.auto_conditioning_start())).resolves.toEqual(OK);
    });

    it("does no read for an infotainment command with no plan", async () => {
        const harness = await ready(verify);
        harness.link.dropNextReply();

        await expect(finish(harness.vehicle.flash_lights())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(harness.link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("follows raise_unconfirmed when the read cannot complete", async () => {
        const raising = await ready(verify);
        loseAckAndRead(raising);
        await expect(finish(raising.vehicle.set_charge_limit(80))).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        const quiet = await ready({ confirmation: "verify" });
        quiet.fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE });
        loseAckAndRead(quiet);
        await expect(finish(quiet.vehicle.set_charge_limit(80))).resolves.toEqual(OK);
    });

    it("follows raise_unconfirmed when the reply leaves the field out", async () => {
        const harness = await ready(verify);
        loseAckThenAnswer(harness, { chargeState: ChargeState.fromPartial({}) });

        await expect(finish(harness.vehicle.set_charge_limit(80))).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("issues no read when the ack arrives", async () => {
        const harness = await ready(verify);

        await finish(harness.vehicle.door_lock());
        await finish(harness.vehicle.set_charge_limit(80));

        expect(harness.link.commands()).toHaveLength(2);
    });
});

describe('confirmation: "ack"', () => {
    it("never issues a verify read", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(link.commands(VCSEC)).toHaveLength(1);
    });
});

describe('confirmation: "optimistic"', () => {
    const optimistic = { confirmation: "optimistic" } as const;

    it("returns on the write for VCSEC, with no reply wait", async () => {
        const { vehicle, link } = await ready(optimistic);
        link.dropNextReply();

        const { elapsedMs, value } = await timed(() => vehicle.door_lock());

        expect(value).toEqual(OK);
        expect(elapsedMs).toBeLessThan(100);
        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("returns on the write for infotainment", async () => {
        const { vehicle, link } = await ready(optimistic);
        link.dropNextReply();

        const { elapsedMs, value } = await timed(() => vehicle.charge_start());

        expect(value).toEqual(OK);
        expect(elapsedMs).toBeLessThan(100);
    });

    it("handshakes first, as a command cannot be signed without a session", async () => {
        const { vehicle, link } = bleHarness(optimistic);

        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);

        expect(link.handshakes(VCSEC)).toHaveLength(1);
    });

    it("still raises for a write that provably never left", async () => {
        const { vehicle, link } = await ready(optimistic);
        link.rejectNextWriteAsNotSubmitted();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);
    });

    it("follows raise_unconfirmed for a write whose delivery is unknown", async () => {
        const raising = await ready({ ...optimistic, raise_unconfirmed: true });
        raising.link.failNextWrite("after");
        await expect(finish(raising.vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        const quiet = await ready(optimistic);
        quiet.link.failNextWrite("after");
        await expect(finish(quiet.vehicle.door_lock())).resolves.toEqual(OK);
    });

    it("leaves ping waiting for its real reply", async () => {
        const { vehicle, link } = await ready(optimistic);
        link.dropNextReply();

        const { error } = await timed(() => vehicle.ping());

        expect(error).toBeInstanceOf(BluetoothTimeout);
    });

    it("keeps VCSEC counters in order", async () => {
        const { vehicle, fakeVehicle } = await ready(optimistic);

        await finish(Promise.all([vehicle.door_lock(), vehicle.door_unlock(), vehicle.door_lock()]));

        expect(fakeVehicle.vcsecCounterArrivals).toEqual([...fakeVehicle.vcsecCounterArrivals].sort((a, b) => a - b));
        expect(fakeVehicle.vcsecCounterArrivals).toHaveLength(3);
    });
});

describe("the broadcast race", () => {
    it("confirms a lock before the ack timeout", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const started = Date.now();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).resolves.toEqual(OK);
        expect(Date.now() - started).toBeLessThan(500);
    });

    it("lets a car-side rejection win over mismatching broadcasts", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply(() => [{ message: addressed(vehicle, rejection), delayMs: 500 }]);
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: SELECTIVE_UNLOCKED });

        await expect(finish(lock)).resolves.toMatchObject({ response: { result: false } });
    });

    it("lets the ack win when no broadcast comes", async () => {
        const { vehicle } = await ready();
        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);
    });

    it("does not watch for a command with no plan", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const trunk = vehicle.actuate_trunk("rear");
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(trunk)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("ignores a mismatch from before the write finished", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.writeDelayMs = 20;
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(5);
        link.injectVehicleStatus({ vehicleLockState: SELECTIVE_UNLOCKED });

        await expect(finish(lock)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("fails a command when a mismatch stands at the end of the window", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: SELECTIVE_UNLOCKED });

        const started = Date.now();
        const { error } = await timed(() => lock);

        expect(error).toBeInstanceOf(BluetoothCommandFailed);
        expect(Date.now() - started).toBeGreaterThan(1500);
    });

    it("does not treat a mismatch as final when a lost link cut the window short", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: SELECTIVE_UNLOCKED });
        link.dropLink();

        await expect(finish(lock)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("lets a later broadcast overrule an earlier mismatch", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: SELECTIVE_UNLOCKED });
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).resolves.toEqual(OK);
    });

    it("stays unconfirmed in total silence", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("resolves best effort after a missed broadcast, by default", async () => {
        const { vehicle, link } = await ready();
        link.dropNextReply();

        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);
    });

    it("runs a verify read only once ack and broadcast have both missed", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ confirmation: "verify", raise_unconfirmed: true });
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: LOCKED });
        link.dropNextReply();

        const { elapsedMs, value } = await timed(() => vehicle.door_lock());

        expect(value).toEqual(OK);
        expect(elapsedMs).toBeGreaterThanOrEqual(2000);
        expect(link.commands(VCSEC)).toHaveLength(2);
    });

    it("skips the verify read when a broadcast confirms", async () => {
        const { vehicle, link } = await ready({ confirmation: "verify" });
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).resolves.toEqual(OK);
        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("feeds persistent listeners alongside the watcher", async () => {
        const { vehicle, link } = await ready();
        const seen: VehicleLockStateE[] = [];
        vehicle.listen_vehicle_lock_state((state) => seen.push(state));
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await finish(lock);

        expect(seen).toEqual([LOCKED]);
    });

    it("disarms after it resolves", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });
        await finish(lock);

        link.dropNextReply();
        link.injectVehicleStatus({ vehicleLockState: LOCKED });
        await expect(finish(vehicle.door_unlock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("leaves the queue free for the next command when a broadcast wins", async () => {
        const { vehicle, link } = await ready();
        link.delayNextReply(500);
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });
        await finish(lock);

        await expect(finish(vehicle.door_unlock())).resolves.toEqual(OK);
        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);
    });
});

describe("a failed write with a broadcast armed", () => {
    it("is confirmed by a matching broadcast", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.failNextWrite("before");
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(0);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).resolves.toEqual(OK);
    });

    it("surfaces an addressed rejection", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply(() => [{ message: addressed(vehicle, rejection) }]);
        link.failNextWrite("after");

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: false } });
    });

    it("surfaces an addressed ack", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.failNextWrite("after");

        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);
    });

    it("stays unconfirmed in silence", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.failNextWrite("before");

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });
});

describe("the outcome table", () => {
    it("connect fails: BluetoothTransportError", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(3);
        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);
    });

    it("scan fails: BluetoothTransportError", async () => {
        const { vehicle, link } = bleHarness();
        link.devices = [];
        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);
    });

    it("BleNotSubmittedError: BluetoothTransportError, sends nothing", async () => {
        const { vehicle, link } = await ready();
        link.rejectNextWriteAsNotSubmitted();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.commands()).toEqual([]);
    });

    it("link known down before the write: BluetoothTransportError, sends nothing", async () => {
        const { vehicle, link } = await ready();
        const before = link.writes.length;
        link.dropLink();
        link.failConnect(3);

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.writes).toHaveLength(before);
    });

    it("write fails after entering the backend, read path: BluetoothTimeout", async () => {
        const { vehicle, link } = await ready();
        link.failNextWrite("before");

        const { error } = await timed(() => vehicle.vehicle_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothTransportError);
    });

    it("write fails after entering the backend, mutating path: a lost ack", async () => {
        const raising = await ready({ raise_unconfirmed: true });
        raising.link.failNextWrite("before");
        await expect(finish(raising.vehicle.charge_start())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        const verifying = await ready({ confirmation: "verify" });
        verifying.fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: LOCKED });
        verifying.link.failNextWrite("after");
        verifying.link.dropNextReply();
        await expect(finish(verifying.vehicle.door_lock())).resolves.toEqual(OK);
    });

    it("write fails after entering the backend, optimistic: raise_unconfirmed decides", async () => {
        const { vehicle, link } = await ready({ confirmation: "optimistic", raise_unconfirmed: true });
        link.failNextWrite("before");
        await expect(finish(vehicle.charge_start())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("a hung write counts as delivery unknown, not as a safe failure", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.hangNextWrite("after");

        const { error } = await timed(() => vehicle.door_lock());

        expect(error).toBeUndefined();
        expect(link.commands(VCSEC)).toHaveLength(1);

        const dead = await ready({ raise_unconfirmed: true });
        dead.link.hangNextWrite("before");
        await expect(finish(dead.vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("any chunk of a chunked frame failing is the same", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true, mtu: 23 });
        const chunkFailure = new Error("chunk failed");
        const connection = link.connection!;
        const write = connection.write.bind(connection);
        let writes = 0;
        connection.write = async (data) => {
            if (++writes === 3) {
                throw chunkFailure;
            }
            return write(data);
        };

        const { error } = await timed(() => vehicle.charge_start());

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect(link.commands()).toEqual([]);
    });

    it("ack lost, no plan: raise_unconfirmed decides", async () => {
        const raising = await ready({ confirmation: "verify", raise_unconfirmed: true });
        raising.link.dropNextReply();
        await expect(finish(raising.vehicle.actuate_trunk("front"))).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        const quiet = await ready({ confirmation: "verify" });
        quiet.link.dropNextReply();
        await expect(finish(quiet.vehicle.actuate_trunk("front"))).resolves.toEqual(OK);
    });

    it("infotainment unresolved, VCSEC asleep, wake off: BluetoothCommandFailed", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ wake_if_asleep: false });
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP });
        link.dropNextReply();

        const { error } = await timed(() => vehicle.charge_start());

        expect(error).toBeInstanceOf(BluetoothCommandFailed);
        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("infotainment unresolved, VCSEC awake: raise_unconfirmed decides", async () => {
        const { vehicle, link, fakeVehicle } = await ready();
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE });
        link.dropNextReply();

        await expect(finish(vehicle.charge_start())).resolves.toEqual(OK);
    });

    it("infotainment unresolved with raise_unconfirmed: no sleep read, unconfirmed", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();

        await expect(finish(vehicle.charge_start())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(link.commands(VCSEC)).toEqual([]);
    });

    it("car-side rejection in an ack: result false", async () => {
        const { vehicle, fakeVehicle } = await ready();
        fakeVehicle.replyToNextVcsecCommandWith(rejection);

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: false } });
    });

    it("car-side rejection in an ack: a fault error", async () => {
        const { vehicle, fakeVehicle } = await ready({ raise_unconfirmed: false });
        fakeVehicle.rejectNextAsBadSignature();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(TeslaFleetMessageFaultInvalidSignature);
    });

    it("read timeout: BluetoothTimeout", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: false });
        link.dropNextReply();

        const { error } = await timed(() => vehicle.climate_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
    });
});

// UNLOCKED is the proto3 zero value, so it never appears on the wire: a status
// that says nothing about the lock decodes to it. Python compares it anyway.
describe("the zero lock state", () => {
    const SLEEP_ONLY = { vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE };

    it("does not confirm an unlock from a broadcast about something else", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const unlock = vehicle.door_unlock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus(SLEEP_ONLY);

        await expect(finish(unlock)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("does not confirm an unlock from a read", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ confirmation: "verify", raise_unconfirmed: true });
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: UNLOCKED });
        link.dropNextReply();

        await expect(finish(vehicle.door_unlock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("still takes the ack as proof of an unlock", async () => {
        const { vehicle } = await ready({ raise_unconfirmed: true });

        await expect(finish(vehicle.door_unlock())).resolves.toEqual(OK);
    });

    it("does not fail a lock on a broadcast about something else", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus(SLEEP_ONLY);

        await expect(finish(lock)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("does not fail a lock on a read", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ confirmation: "verify", raise_unconfirmed: true });
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: UNLOCKED });
        link.dropNextReply();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("leaves a real lock state proving an unlock did not apply", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const unlock = vehicle.door_unlock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(timed(() => unlock).then(({ error }) => error)).resolves.toBeInstanceOf(BluetoothCommandFailed);
    });
});

describe("a broadcast from before the write finished", () => {
    it("does not confirm the command", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.writeDelayMs = 20;
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(5);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("does not stop a later one confirming it", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.writeDelayMs = 20;
        link.dropNextReply();
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(5);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });
        await vi.advanceTimersByTimeAsync(500);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).resolves.toEqual(OK);
    });

    it("counts a status after a failed write, as the frame may have landed", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.failNextWrite("before");
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(100);
        link.injectVehicleStatus({ vehicleLockState: LOCKED });

        await expect(finish(lock)).resolves.toEqual(OK);
    });
});

describe("wake", () => {
    it("takes VehicleSpecific's options and sends the RKE wake once", async () => {
        const { vehicle, link } = await ready();

        await expect(finish(vehicle.wake_up({ wait: false }))).resolves.toEqual(OK);
        await expect(finish(vehicle.wake_up())).resolves.toEqual(OK);

        expect(link.commands(VCSEC)).toHaveLength(2);
    });
});
