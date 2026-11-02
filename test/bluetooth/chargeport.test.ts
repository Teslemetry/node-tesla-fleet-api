// Behaviour specs ported from Python's `tests/test_ble_charge_port_verification.py`.
// Replies come from `FakeVehicle` and reach the client through the real link,
// session and ladder. `FakeBleLink.vcsecWrites` counts what the client wrote,
// including a frame that never arrived, so it is what proves "exactly one".
//
// Not ported: the cancellation cases, because a Node promise has no cancellation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageFaultE, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { Response } from "@teslemetry/tesla-protocol/command/car_server";
import {
    ClosureMoveTypeE,
    CommandStatus,
    FromVCSECMessage,
    OperationStatusE,
    RKEActionE,
    UnsignedMessage,
    VehicleSleepStatusE,
    VehicleStatus,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { ChargeState, VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import { VehicleRouter } from "../../src/router/index.js";
import { chargePortConnected } from "../../src/bluetooth/verify.js";
import {
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothUnconfirmedCommand,
    SessionInfoAuthenticationFault,
    SignedCommandResponseReplayed,
    SigningDisabled,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
} from "../../src/exceptions.js";
import { BleHarnessOptions, INFOTAINMENT, VCSEC, VIN, bareAck, bleHarness, finish, timed, withFields } from "../helpers/blevehicle.js";

const OK = { response: { result: true, reason: "" } };
const ASLEEP = VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP;
const AWAKE = VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE;

type Cable = "IEC" | "SAE" | "gbAc" | "gbDc" | "SNA";
type Charging = "Stopped" | "Disconnected";
type Latch = "Engaged" | "Disengaged" | "Blocking" | "SNA";

/** Charge data with explicit oneof values, or with a field deliberately absent. */
function charge({
    cable = "IEC",
    charging = "Stopped",
    latch = "Engaged",
    flap = true,
    unlatched = false,
}: { cable?: Cable | null; charging?: Charging | null; latch?: Latch | null; flap?: boolean | null; unlatched?: boolean } = {}): ChargeState {
    return ChargeState.fromPartial({
        connChargeCable: cable === null ? undefined : { [cable]: {} },
        chargingState: charging === null ? undefined : { [charging]: {} },
        chargePortLatch: latch === null ? undefined : { [latch]: {} },
        chargePortDoorOpen: flap ?? undefined,
        chargeCableUnlatched: unlatched,
    });
}

const UNPLUGGED = { cable: "SNA", charging: "Disconnected", flap: false } as const;

type Read = ChargeState | "lost";

/** The vehicle's charge computer, and the order things reached the car. */
function car(harness: ReturnType<typeof bleHarness>, before: Read | Read[], after: Read[]) {
    const { link, fakeVehicle } = harness;
    const events: string[] = [];
    const baselines = [before].flat();
    const reads = { baseline: 0, verify: 0, sleepStatus: AWAKE };
    let armed: (() => void) | null = null;
    fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus: AWAKE });

    const isOpen = (command: UnsignedMessage) => command.closureMoveRequest?.chargePort === ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN;
    const opened = () => link.vcsecWrites.filter(isOpen).length;
    const next = (): Read => {
        if (opened() === 0) {
            reads.baseline++;
            return baselines.length > 1 ? (baselines.shift() as Read) : baselines[0]!;
        }
        reads.verify++;
        return after.length > 1 ? (after.shift() as Read) : after[0]!;
    };

    fakeVehicle.onVcsecCommand = (command) => {
        if (command.InformationRequest) {
            events.push("sleep_read");
            fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus: reads.sleepStatus });
        } else if (command.RKEAction === RKEActionE.RKE_ACTION_WAKE_VEHICLE) {
            events.push("wake");
            reads.sleepStatus = AWAKE;
        } else if (isOpen(command)) {
            events.push("open");
        }
    };
    fakeVehicle.onInfotainmentAction = () => {
        const state = next();
        events.push(opened() === 0 ? "baseline" : "verify");
        if (opened() === 0 && armed) {
            // After this read's own reply is scheduled, so a fault lands on the opening.
            queueMicrotask(armed);
            armed = null;
        }
        // Dropped on the way back, and answered with a throwaway so the frame still parses.
        if (state === "lost") {
            link.dropNextReply();
            return Response.create({ vehicleData: VehicleData.create({ chargeState: ChargeState.create() }) });
        }
        return Response.create({ vehicleData: VehicleData.fromPartial({ chargeState: state }) });
    };
    return {
        events,
        reads,
        openings: () => link.vcsecWrites.filter(isOpen),
        /** Run `fault` once the baseline is read, so the next frame is the opening. */
        beforeOpening: (fault: () => void) => {
            armed = fault;
        },
    };
}

async function setup(before: Read | Read[] = charge(), after: Read[] = [charge({ latch: "Disengaged" })], options: BleHarnessOptions = {}) {
    const harness = bleHarness({ confirmation: "verify", ...options });
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return { ...harness, ...car(harness, before, after) };
}

function cloud() {
    return { vin: VIN, charge_port_door_open: vi.fn(async () => ({ response: { result: true, reason: "cloud" } })) };
}

type Harness = Awaited<ReturnType<typeof setup>>;

function routed(vehicle: Harness["vehicle"]) {
    const fallback = cloud();
    return { fallback, open: () => new VehicleRouter([vehicle, fallback]).charge_port_door_open() };
}

/** Expire VCSEC's session, as a car that restarted it between the baseline and the opening does. */
function expireVcsecAfterBaseline({ fakeVehicle, link, vehicle }: Harness, fault: "lost" | "corrupt" | "ok" = "ok") {
    const read = fakeVehicle.onInfotainmentAction!;
    fakeVehicle.onInfotainmentAction = (action) => {
        const reply = read(action);
        const session = vehicle.session(VCSEC);
        session.epoch = undefined;
        if (fault === "lost") {
            link.dropNextReply("session_info");
        } else if (fault === "corrupt") {
            fakeVehicle.corruptNextSessionInfoTag(3);
        }
        return reply;
    };
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("the cable classifier", () => {
    it("takes positive evidence only", () => {
        expect(chargePortConnected(charge({ charging: "Disconnected", cable: "SNA" }))).toBe(false);
        expect(chargePortConnected(charge({ charging: "Disconnected", cable: null }))).toBe(false);
        for (const cable of ["IEC", "SAE", "gbAc", "gbDc"] as const) {
            expect(chargePortConnected(charge({ cable }))).toBe(true);
        }
        expect(chargePortConnected(ChargeState.create())).toBeNull();
        expect(chargePortConnected(charge({ cable: "SNA" }))).toBeNull();
        expect(chargePortConnected(charge({ cable: null }))).toBeNull();
        expect(chargePortConnected(charge({ charging: "Disconnected" }))).toBeNull();
    });
});

describe("preflight", () => {
    it("wakes an asleep car and waits for readiness before one opening", async () => {
        const harness = await setup();
        const { vehicle, reads, events, openings, link } = harness;
        reads.sleepStatus = ASLEEP;
        let up = false;
        link.deafTo = (request) => request.toDestination?.domain === INFOTAINMENT && !up;
        setTimeout(() => {
            up = true;
        }, 1500);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(events).toEqual(["sleep_read", "wake", "baseline", "open", "verify"]);
        expect(openings()).toHaveLength(1);
        expect(openings()[0]?.closureMoveRequest).toEqual(expect.objectContaining({ chargePort: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN, frontTrunk: 0, tonneau: 0 }));
    });

    it("still probes readiness on an awake car with a cached session", async () => {
        const { vehicle, events, link } = await setup();
        const before = link.handshakes(INFOTAINMENT).length;

        await finish(vehicle.charge_port_door_open());

        expect(events).toEqual(["sleep_read", "baseline", "open", "verify"]);
        expect(link.handshakes(INFOTAINMENT)).toHaveLength(before + 1);
    });

    it("never sends a wake or an opening to an asleep car with wake off", async () => {
        const { vehicle, reads, events, openings } = await setup(undefined, undefined, { wake_if_asleep: false });
        reads.sleepStatus = ASLEEP;

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothCommandFailed);

        expect(events).toEqual(["sleep_read"]);
        expect(openings()).toEqual([]);
    });

    it("lets an awake car through with wake off", async () => {
        const { vehicle, events } = await setup(undefined, undefined, { wake_if_asleep: false });

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(events).not.toContain("wake");
    });

    it("retries a transient baseline timeout before actuating", async () => {
        const { vehicle, events, openings } = await setup(["lost", "lost", charge()]);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(events.filter((event) => event === "baseline")).toHaveLength(3);
        expect(events.indexOf("open")).toBeGreaterThan(events.lastIndexOf("baseline"));
        expect(openings()).toHaveLength(1);
    });

    it("exhausts persistent baseline timeouts without opening, and fails over", async () => {
        const { vehicle, openings } = await setup(["lost"]);
        vehicle.tune({ wakeTimeoutMs: 12_000 });
        const { fallback, open } = routed(vehicle);

        const result = await finish(open());

        expect(result.response.reason).toBe("cloud");
        expect(openings()).toEqual([]);
        expect(fallback.charge_port_door_open).toHaveBeenCalledOnce();
    });

    it.each([
        ["no fields", ChargeState.create()],
        ["an SNA cable", charge({ cable: "SNA" })],
        ["no cable field", charge({ cable: null })],
        ["a known cable reported disconnected", charge({ charging: "Disconnected" })],
    ])("sends no opening on %s, and fails over", async (_name, before) => {
        const { vehicle, openings } = await setup(before);
        const { fallback, open } = routed(vehicle);

        const result = await finish(open());

        expect(result.response.reason).toBe("cloud");
        expect(openings()).toEqual([]);
        expect(fallback.charge_port_door_open).toHaveBeenCalledOnce();
    });

    it("sends no opening when a reply has no charge state", async () => {
        const { vehicle, openings, fakeVehicle } = await setup();
        fakeVehicle.onInfotainmentAction = () => Response.create({ vehicleData: VehicleData.create() });

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothCommandFailed);

        expect(openings()).toEqual([]);
    });

    it.each([[ASLEEP], [AWAKE]])("bounds a stalled probe before opening, status %i", async (sleepStatus) => {
        const { vehicle, reads, link, openings } = await setup();
        reads.sleepStatus = sleepStatus;
        link.deafTo = (request) => request.toDestination?.domain === INFOTAINMENT;
        vehicle.tune({ wakeTimeoutMs: 2000 });
        const { fallback, open } = routed(vehicle);

        const { value, elapsedMs } = await timed(open);

        expect(value?.response.reason).toBe("cloud");
        expect(elapsedMs).toBeLessThan(10_000);
        expect(openings()).toEqual([]);
        expect(fallback.charge_port_door_open).toHaveBeenCalledOnce();
    });
});

describe("a VCSEC session expiring in preflight", () => {
    it("drops the link and falls back when the handshake is lost", async () => {
        const harness = await setup();
        expireVcsecAfterBaseline(harness, "lost");
        const { open } = routed(harness.vehicle);

        const result = await finish(open());

        expect(result.response.reason).toBe("cloud");
        expect(harness.openings()).toEqual([]);
        expect(harness.link.openConnections).toBe(0);
    });

    it("drops the link on a reply that fails authentication", async () => {
        const harness = await setup();
        expireVcsecAfterBaseline(harness, "corrupt");

        await expect(finish(harness.vehicle.charge_port_door_open())).rejects.toBeInstanceOf(SessionInfoAuthenticationFault);

        expect(harness.openings()).toEqual([]);
        expect(harness.link.openConnections).toBe(0);
    });

    it("keeps the link and renews the session when the handshake works", async () => {
        const harness = await setup();
        expireVcsecAfterBaseline(harness);
        const before = harness.link.handshakes(VCSEC).length;

        await expect(finish(harness.vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(harness.link.handshakes(VCSEC)).toHaveLength(before + 1);
        expect(harness.openings()).toHaveLength(1);
        expect(harness.link.openConnections).toBe(1);
    });

    it("shares the one deadline, and drops the link when it expires", async () => {
        const harness = await setup();
        harness.vehicle.tune({ wakeTimeoutMs: 1500 });
        expireVcsecAfterBaseline(harness, "lost");
        const { fallback, open } = routed(harness.vehicle);

        const { value, elapsedMs } = await timed(open);

        expect(value?.response.reason).toBe("cloud");
        expect(elapsedMs).toBeLessThan(5000);
        expect(harness.openings()).toEqual([]);
        expect(harness.link.openConnections).toBe(0);
        expect(fallback.charge_port_door_open).toHaveBeenCalledOnce();
    });

    it("keeps a link that signing never touched", async () => {
        const { vehicle, link } = bleHarness({ confirmation: "verify", privateKey: false });
        await finish(vehicle.connect());

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(SigningDisabled);

        expect(link.writes).toEqual([]);
        expect(link.openConnections).toBe(1);
    });
});

describe("physical confirmation", () => {
    it("never succeeds or falls back on an ack with the latch still engaged", async () => {
        const { vehicle, openings } = await setup(undefined, [charge()]);
        const { fallback, open } = routed(vehicle);

        await expect(finish(open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it("polls past engaged and blocking without repeating the opening", async () => {
        const { vehicle, reads, openings } = await setup(undefined, [charge(), charge({ latch: "Blocking" }), charge({ latch: "Disengaged" })]);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(reads.verify).toBe(3);
        expect(openings()).toHaveLength(1);
    });

    it.each([[false], [true]])("confirms a lost ack by the latch, raise_unconfirmed %s", async (raise_unconfirmed) => {
        const { vehicle, link, openings, beforeOpening } = await setup(undefined, undefined, { raise_unconfirmed });
        beforeOpening(() => link.dropNextReply());
        const { fallback, open } = routed(vehicle);

        await expect(finish(open())).resolves.toEqual(OK);

        expect(openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it("raises rather than succeed on a lost ack with unknown state", async () => {
        const { vehicle, link, openings, beforeOpening } = await setup(undefined, [ChargeState.create()]);
        beforeOpening(() => link.dropNextReply());
        const { fallback, open } = routed(vehicle);

        await expect(finish(open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it("raises unconfirmed with raise_unconfirmed off", async () => {
        const { vehicle } = await setup(undefined, [charge()], { raise_unconfirmed: false });

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it.each([[null], ["SNA"], ["Blocking"], ["Engaged"]] as const)("does not accept latch %s, even with the unlatched flag set", async (latch) => {
        const { vehicle, openings } = await setup(undefined, [charge({ latch, unlatched: true })]);

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
    });

    it("takes an explicit release over a false unlatched flag", async () => {
        const { vehicle } = await setup(undefined, [charge({ latch: "Disengaged", unlatched: false })]);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);
    });

    it.each([[null], [false]] as const)("needs an open flap when unplugged, not a released latch: flap %s", async (flap) => {
        const { vehicle, openings } = await setup(charge({ ...UNPLUGGED, latch: "Disengaged" }), [charge({ ...UNPLUGGED, latch: "Disengaged", flap })]);

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
    });

    it("confirms an unplugged car by its open flap", async () => {
        const { vehicle } = await setup(charge(UNPLUGGED), [charge({ ...UNPLUGGED, flap: true })]);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);
    });

    it("lets an explicit Disconnected pick the flap goal with no cable field", async () => {
        const { vehicle } = await setup(charge({ cable: null, charging: "Disconnected", flap: false }), [charge({ cable: null, charging: "Disconnected", flap: true })]);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);
    });

    it.each([["IEC"], ["SAE"], ["gbAc"], ["gbDc"]] as const)("requires a latch release for %s", async (cable) => {
        const { vehicle } = await setup(charge({ cable }), [charge({ cable, latch: "Disengaged" })]);

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);
    });

    it("keeps the latch goal when the cable comes out during verification", async () => {
        const { vehicle, openings } = await setup(undefined, [charge({ cable: "SNA", charging: "Disconnected", latch: null, flap: true })]);

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
    });

    it("does not let an inserted cable confirm the flap goal", async () => {
        const { vehicle } = await setup(charge(UNPLUGGED), [charge({ latch: "Disengaged", flap: true })]);

        await expect(finish(vehicle.charge_port_door_open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });
});

describe("reads and writes that fail around the opening", () => {
    it("bounds a read that hangs, and blocks fallback", async () => {
        const { vehicle, link, openings, fakeVehicle } = await setup();
        const onCommand = fakeVehicle.onVcsecCommand;
        fakeVehicle.onVcsecCommand = (command) => {
            onCommand?.(command);
            if (command.closureMoveRequest) {
                link.deafTo = (request) => request.toDestination?.domain === INFOTAINMENT;
            }
        };
        const { fallback, open } = routed(vehicle);

        const { error, elapsedMs } = await timed(open);

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect(elapsedMs).toBeLessThan(8000);
        expect(openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it("recovers from one lost read without a second opening", async () => {
        const { vehicle, reads, openings } = await setup(undefined, ["lost", charge({ latch: "Disengaged" })]);
        vehicle.tune({ chargePortVerifyTimeoutMs: 12_000 });

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(reads.verify).toBe(2);
        expect(openings()).toHaveLength(1);
    });

    it("keeps a transport failure after submission unconfirmed", async () => {
        const { vehicle, link, openings, fakeVehicle } = await setup(undefined, [charge()]);
        const onCommand = fakeVehicle.onVcsecCommand;
        fakeVehicle.onVcsecCommand = (command) => {
            onCommand?.(command);
            if (command.closureMoveRequest) {
                link.failConnect(30);
                setTimeout(() => link.dropLink(), 1);
            }
        };
        const { fallback, open } = routed(vehicle);

        await expect(finish(open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it("lets a write that provably never went fall back", async () => {
        const { vehicle, link, fakeVehicle, reads, beforeOpening } = await setup();
        beforeOpening(() => link.rejectNextWriteAsNotSubmitted());
        const { fallback, open } = routed(vehicle);

        const result = await finish(open());

        expect(result.response.reason).toBe("cloud");
        expect(reads.verify).toBe(0);
        expect(fakeVehicle.vcsecCommands.filter((command) => command.closureMoveRequest)).toEqual([]);
        expect(fallback.charge_port_door_open).toHaveBeenCalledOnce();
    });

    it.each([
        ["rejects", (link: Harness["link"]) => link.failNextWrite("after")],
        ["hangs", (link: Harness["link"]) => link.hangNextWrite("after")],
    ])("treats a write that %s after submission as unknown", async (_name, fault) => {
        const { vehicle, link, openings, beforeOpening } = await setup(undefined, [charge()]);
        beforeOpening(() => fault(link));
        const { fallback, open } = routed(vehicle);

        await expect(finish(open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });
});

describe("replies that prove nothing about the opening", () => {
    /** Replace the reply to the opening alone. */
    function replaceOpeningReply({ link, beforeOpening }: Harness, reply: (ok: RoutableMessage, request: RoutableMessage) => RoutableMessage) {
        beforeOpening(() => link.rewriteNextReply((ok, request) => [{ message: reply(ok, request) }]));
    }

    const CASES: Array<[string, (harness: Harness) => (ok: RoutableMessage, request: RoutableMessage) => RoutableMessage, (cause: unknown) => boolean]> = [
        ["a malformed one", () => (ok) => withFields(ok, { protobufMessageAsBytes: Buffer.from([0xff]), signatureData: undefined }), (cause) => cause instanceof RangeError],
        [
            "one that fails to open",
            () => (ok) => withFields(ok, { protobufMessageAsBytes: Buffer.from(ok.protobufMessageAsBytes!).map((byte) => byte ^ 0xff) }),
            (cause) => cause instanceof Error && !(cause instanceof BluetoothTimeout),
        ],
        [
            "a replayed one",
            (harness) => (ok, request) => {
                const tag = request.signatureData!.AESGCMPersonalizedData!.tag;
                harness.vehicle.session(VCSEC).record_response_counter(Buffer.concat([Buffer.from([5]), tag]), ok.signatureData!.AESGCMResponseData!.counter);
                return ok;
            },
            (cause) => cause instanceof SignedCommandResponseReplayed,
        ],
        [
            "an MTU fault",
            () => (ok, request) => ({ ...bareAck(ok, request), signedMessageStatus: { operationStatus: 0, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_RESPONSE_MTU_EXCEEDED } }),
            (cause) => cause instanceof TeslaFleetMessageFaultResponseSizeExceedsMTU,
        ],
    ];

    it.each(CASES)("confirms by the latch after %s", async (_name, build) => {
        const harness = await setup();
        replaceOpeningReply(harness, build(harness));
        const { fallback, open } = routed(harness.vehicle);

        await expect(finish(open())).resolves.toEqual(OK);

        expect(harness.openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it.each(CASES)("stays unconfirmed with the latch engaged after %s", async (_name, build, isCause) => {
        const harness = await setup(undefined, [charge()]);
        replaceOpeningReply(harness, build(harness));
        const { fallback, open } = routed(harness.vehicle);

        const { error } = await timed(open);

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect(isCause((error as Error).cause)).toBe(true);
        expect(harness.openings()).toHaveLength(1);
        expect(fallback.charge_port_door_open).not.toHaveBeenCalled();
    });

    it("does not take a valid ack as proof", async () => {
        const { vehicle } = await setup(undefined, [charge()]);

        const { error } = await timed(() => vehicle.charge_port_door_open());

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect((error as Error).cause).toBeUndefined();
    });

    it("returns an explicit rejection without reading the latch", async () => {
        const { vehicle, fakeVehicle, reads, openings, beforeOpening } = await setup();
        beforeOpening(() =>
            fakeVehicle.replyToNextVcsecCommandWith(
                FromVCSECMessage.create({ commandStatus: CommandStatus.create({ operationStatus: OperationStatusE.OPERATIONSTATUS_ERROR }) }),
            ),
        );

        const { value } = await timed(() => vehicle.charge_port_door_open());

        expect(value?.response.result).toBe(false);
        expect(reads.verify).toBe(0);
        expect(openings()).toHaveLength(1);
    });
});

describe("logging", () => {
    function logged(options: BleHarnessOptions = {}) {
        const lines: string[] = [];
        return { lines, options: { ...options, logger: { debug: (line: string) => lines.push(line) } } };
    }
    const outcome = (lines: string[]) => lines.filter((line) => line.startsWith("command=closureMoveRequest transport=bluetooth "));

    it("ends a confirmed opening with success", async () => {
        const { lines, options } = logged();
        const { vehicle } = await setup(undefined, undefined, options);

        await finish(vehicle.charge_port_door_open());

        expect(outcome(lines).slice(-2)).toEqual([
            "command=closureMoveRequest transport=bluetooth physical_confirmation=confirmed",
            "command=closureMoveRequest transport=bluetooth result=true reason=",
        ]);
    });

    it("ends an unconfirmed opening with the raised error", async () => {
        const { lines, options } = logged();
        const { vehicle } = await setup(undefined, [charge()], options);

        const { error } = await timed(() => vehicle.charge_port_door_open());

        expect(outcome(lines).slice(-2)).toEqual([
            "command=closureMoveRequest transport=bluetooth physical_confirmation=unconfirmed",
            `command=closureMoveRequest transport=bluetooth result=error error=BluetoothUnconfirmedCommand: ${(error as Error).message}`,
        ]);
    });
});

describe("other paths", () => {
    it.each([["ack"], ["optimistic"]] as const)("keeps %s on its single send", async (confirmation) => {
        const { vehicle, link } = await setup(undefined, undefined, { confirmation });

        await expect(finish(vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(link.vcsecWrites).toHaveLength(1);
        expect(link.commands(INFOTAINMENT)).toEqual([]);
    });

    it("gives frunk, boot and port closing no preflight or verification", async () => {
        for (const act of [
            (vehicle: Harness["vehicle"]) => vehicle.actuate_trunk("front"),
            (vehicle: Harness["vehicle"]) => vehicle.actuate_trunk("rear"),
            (vehicle: Harness["vehicle"]) => vehicle.charge_port_door_close(),
        ]) {
            const { vehicle, link } = await setup();

            await expect(finish(act(vehicle))).resolves.toEqual(OK);

            expect(link.vcsecWrites).toHaveLength(1);
            expect(link.commands(INFOTAINMENT)).toEqual([]);
        }
    });

    it("runs with a cold infotainment session and a bare ack", async () => {
        const harness = bleHarness({ confirmation: "verify" });
        await finish(harness.vehicle.handshakeVehicleSecurity());
        const { reads, events, openings, beforeOpening } = car(harness, charge(), [charge({ latch: "Disengaged" })]);
        reads.sleepStatus = ASLEEP;
        beforeOpening(() => harness.link.rewriteNextReply((reply, request) => [{ message: bareAck(reply, request) }]));

        await expect(finish(harness.vehicle.charge_port_door_open())).resolves.toEqual(OK);

        expect(events.slice(0, 4)).toEqual(["sleep_read", "wake", "baseline", "open"]);
        expect(openings()).toHaveLength(1);
        expect(harness.vehicle.session(INFOTAINMENT).ready).toBe(true);
    });
});

describe("the opening write", () => {
    it("is what the counter counts, whether or not it arrived", async () => {
        const { vehicle, link, openings, fakeVehicle, beforeOpening } = await setup(undefined, [charge()]);
        beforeOpening(() => link.failNextWrite("before"));

        await timed(() => vehicle.charge_port_door_open());

        expect(openings()).toHaveLength(1);
        expect(fakeVehicle.vcsecCommands.filter((command) => command.closureMoveRequest)).toEqual([]);
    });
});
