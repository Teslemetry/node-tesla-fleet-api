// Once a write may have reached the car, the only failure that stays a failure
// is the car's own refusal of that exact command. Everything else is unknown, so
// a router must not replay it.
import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageFaultE, OperationStatusE, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { FromVCSECMessage, OperationStatusE as VcsecOperationStatusE, VehicleLockStateE, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import { VehicleRouter } from "../../src/router/index.js";
import { BleNotSubmittedError } from "../../src/bluetooth/transport.js";
import { BluetoothTimeout, BluetoothTransportError, BluetoothUnconfirmedCommand, SessionInfoAuthenticationFault, TeslaFleetMessageFaultResponseSizeExceedsMTU } from "../../src/exceptions.js";
import { BleHarnessOptions, INFOTAINMENT, VCSEC, VIN, bareAck, bleHarness, finish, timed } from "../helpers/blevehicle.js";

const OK = { response: { result: true, reason: "" } };

async function ready(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return harness;
}

function cloud() {
    const command = () => vi.fn(async () => ({ response: { result: true, reason: "cloud" } }));
    return { vin: VIN, flash_lights: command(), honk_horn: command(), door_lock: command(), actuate_trunk: command() };
}

/** A session-info reply bound to this request, whose tag fails: the car ran the command, and this says nothing. */
function badSessionInfo(reply: RoutableMessage, request: RoutableMessage): RoutableMessage {
    return { ...bareAck(reply, request), sessionInfo: Buffer.from([1, 2, 3]) };
}

function tooBig(reply: RoutableMessage, request: RoutableMessage): RoutableMessage {
    return {
        ...bareAck(reply, request),
        signedMessageStatus: { operationStatus: OperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_RESPONSE_MTU_EXCEEDED },
    };
}

function garbled(reply: RoutableMessage): RoutableMessage {
    return { ...reply, protobufMessageAsBytes: Buffer.from([0xff]), signatureData: undefined };
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe.each([
    ["a session-info reply that fails authentication", badSessionInfo, SessionInfoAuthenticationFault],
    ["an MTU fault", tooBig, TeslaFleetMessageFaultResponseSizeExceedsMTU],
    ["a reply that cannot be decoded", garbled, RangeError],
] as const)("after the write, %s", (_name, reply, cause) => {
    it.each([
        ["an infotainment action", "flash_lights", INFOTAINMENT],
        ["a VCSEC actuation", "actuate_trunk", VCSEC],
    ] as const)("leaves %s unconfirmed, and out of the cloud", async (_kind, command, domain) => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply((ok, request) => [{ message: reply(ok, request) }]);
        const fallback = cloud();
        const router = new VehicleRouter([vehicle, fallback]);

        const { error } = await timed(() => (command === "actuate_trunk" ? router.actuate_trunk("front") : router.flash_lights()));

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect((error as Error).cause).toBeInstanceOf(cause);
        expect(fallback.flash_lights).not.toHaveBeenCalled();
        expect(fallback.actuate_trunk).not.toHaveBeenCalled();
        expect(link.commands(domain)).toHaveLength(1);
    });

    it("resolves best effort with raise_unconfirmed off, and stays out of the cloud", async () => {
        const { vehicle, link } = await ready();
        link.rewriteNextReply((ok, request) => [{ message: reply(ok, request) }]);
        const fallback = cloud();

        await expect(finish(new VehicleRouter([vehicle, fallback]).flash_lights())).resolves.toEqual(OK);

        expect(fallback.flash_lights).not.toHaveBeenCalled();
    });
});

describe("before any write", () => {
    it("keeps a failure that sent nothing, so a router can fail over", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rejectNextWriteAsNotSubmitted();
        const fallback = cloud();

        await expect(finish(new VehicleRouter([vehicle, fallback]).flash_lights())).resolves.toMatchObject({ response: { reason: "cloud" } });

        expect(fallback.flash_lights).toHaveBeenCalledOnce();
    });

    it("keeps an argument the protocol cannot encode an error, not a best-effort success", async () => {
        const { vehicle, link } = await ready();
        const writes = link.writes.length;

        await expect(finish(vehicle.set_charge_limit("many" as never))).rejects.toThrow();

        expect(link.writes).toHaveLength(writes);
    });

    it("keeps a session lost before the write a plain timeout", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        vehicle.session(VCSEC).epoch = undefined;
        link.dropNextReply("session_info");

        const { error } = await timed(() => vehicle.door_lock());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });
});

describe("a resend that cannot connect", () => {
    it("is unconfirmed, as the first frame was written", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ raise_unconfirmed: true, max_connect_attempts: 1 });
        fakeVehicle.queueWaits(1);
        const fallback = cloud();
        setTimeout(() => {
            link.failConnect(5);
            link.dropLink();
        }, 500);

        const { error } = await timed(() => new VehicleRouter([vehicle, fallback]).flash_lights());

        expect(error).toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect((error as Error).cause).toBeInstanceOf(BluetoothTransportError);
        expect(fallback.flash_lights).not.toHaveBeenCalled();
    });
});

describe("a stale session reply", () => {
    it("leaves a car that ran the command with one run, as in the review's reproduction", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply((reply) => [
            { message: { ...reply, protobufMessageAsBytes: undefined, signatureData: undefined, sessionInfo: Buffer.from([1, 2, 3]), requestUuid: crypto.randomBytes(16) } },
            { message: reply, delayMs: 100 },
        ]);
        const fallback = cloud();

        await timed(() => new VehicleRouter([vehicle, fallback]).flash_lights());

        expect(fakeVehicle.infotainmentActions).toHaveLength(1);
        expect(fallback.flash_lights).not.toHaveBeenCalled();
    });
});

describe("a reply that is not for this request", () => {
    const otherUuid = () => crypto.randomBytes(16);
    const epochFault = (reply: RoutableMessage, request: RoutableMessage, requestUuid: Uint8Array): RoutableMessage => ({
        ...bareAck(reply, request),
        requestUuid,
        signedMessageStatus: { operationStatus: OperationStatusE.OPERATIONSTATUS_ERROR, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_INCORRECT_EPOCH },
    });
    const wait = (reply: RoutableMessage, request: RoutableMessage, requestUuid: Uint8Array): RoutableMessage => ({
        ...bareAck(reply, request),
        requestUuid,
        signedMessageStatus: { operationStatus: OperationStatusE.OPERATIONSTATUS_WAIT, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_NONE },
    });
    const addressedVcsec = (vehicle: { routingAddress: Buffer }, message: object, requestUuid: Uint8Array = new Uint8Array(0)) =>
        RoutableMessage.fromPartial({
            fromDestination: { domain: VCSEC },
            toDestination: { routingAddress: vehicle.routingAddress },
            requestUuid,
            protobufMessageAsBytes: FromVCSECMessage.encode(FromVCSECMessage.fromPartial(message)).finish(),
        });

    it.each([
        ["an epoch fault", epochFault],
        ["a WAIT", wait],
    ])("does not resend on %s carrying another request's uuid", async (_name, stale) => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply((reply, request) => [{ message: stale(reply, request, otherUuid()) }, { message: reply, delayMs: 100 }]);

        await expect(finish(vehicle.flash_lights())).resolves.toMatchObject({ response: { result: true } });

        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it.each([
        ["an epoch fault", epochFault],
        ["a WAIT", wait],
    ])("does not resend on %s with no uuid, as nothing ties it to this request", async (_name, stale) => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply((reply, request) => [{ message: stale(reply, request, new Uint8Array(0)) }]);

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("does not take a plaintext WAIT with no uuid as a reason to resend", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply((_reply, request) => [{ message: { ...addressedVcsec(vehicle, { commandStatus: { operationStatus: VcsecOperationStatusE.OPERATIONSTATUS_WAIT } }), uuid: request.uuid } }]);

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("still resends on an epoch fault that echoes this request", async () => {
        const { vehicle, link } = await ready();
        link.rewriteNextReply((reply, request) => [{ message: epochFault(reply, request, request.uuid) }]);

        await expect(finish(vehicle.flash_lights())).resolves.toMatchObject({ response: { result: true } });

        expect(link.commands(INFOTAINMENT)).toHaveLength(2);
    });

    it("still resends on a WAIT that echoes this request", async () => {
        const { vehicle, link, fakeVehicle } = await ready();
        fakeVehicle.queueWaits(1);

        await expect(finish(vehicle.flash_lights())).resolves.toMatchObject({ response: { result: true } });

        expect(link.commands(INFOTAINMENT)).toHaveLength(2);
    });

    it.each([
        ["no uuid", () => new Uint8Array(0)],
        ["another request's uuid", otherUuid],
    ])("does not let an addressed status with %s stand in for an actuation's ack", async (_name, requestUuid) => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply(() => [{ message: addressedVcsec(vehicle, { vehicleStatus: { vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED } }, requestUuid()) }]);

        await expect(finish(vehicle.door_unlock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);
    });

    it("drops a foreign reply that follows a bare ack", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rewriteNextReply((reply, request) => [
            { message: bareAck(reply, request) },
            { message: epochFault(reply, request, otherUuid()), delayMs: 10 },
            { message: reply, delayMs: 10 },
        ]);

        await expect(finish(vehicle.flash_lights())).resolves.toMatchObject({ response: { result: true } });

        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("drops a late session-info reply and completes the handshake on the real one", async () => {
        const { vehicle, link } = bleHarness();
        link.rewriteNextReply((reply) => [{ message: { ...reply, requestUuid: otherUuid() } }, { message: reply, delayMs: 10 }], "session_info");

        await expect(finish(vehicle.handshakeVehicleSecurity())).resolves.toBeUndefined();

        expect(link.handshakes(VCSEC)).toHaveLength(1);
    });
});

describe("real VCSEC, which leaves request_uuid empty", () => {
    it("still accepts an encrypted ack", async () => {
        const { vehicle, link, fakeVehicle } = await ready({ raise_unconfirmed: true });
        fakeVehicle.omitRequestUuidLikeRealVcsec();

        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);

        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("still accepts a plaintext ack from old firmware", async () => {
        const { vehicle, fakeVehicle } = await ready({ raise_unconfirmed: true });
        fakeVehicle.omitRequestUuidLikeRealVcsec();
        fakeVehicle.replyInPlaintextLikeOldFirmware();

        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);
    });

    it("still reads a status", async () => {
        const { vehicle, fakeVehicle } = await ready({ raise_unconfirmed: true });
        fakeVehicle.omitRequestUuidLikeRealVcsec();
        fakeVehicle.replyInPlaintextLikeOldFirmware();
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        await expect(finish(vehicle.vehicle_state())).resolves.toMatchObject({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });
    });

    it("still completes a handshake", async () => {
        const { vehicle, fakeVehicle } = bleHarness();
        fakeVehicle.omitRequestUuidLikeRealVcsec();

        await expect(finish(vehicle.handshakeVehicleSecurity())).resolves.toBeUndefined();
    });
});

describe("a rejected GATT call", () => {
    it("loses the link on a read, however the backend reports it", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.failNextRead(new Error("not connected"));

        await expect(finish(vehicle.read("version"))).rejects.toThrow("not connected");

        expect(link.connection?.reported).toBe(false);
        expect(events).toEqual([false]);
    });

    it("keeps the link on a read that never reached the radio", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const events: boolean[] = [];
        vehicle.listen_connection_status((connected) => events.push(connected));
        link.failNextRead(new BleNotSubmittedError("characteristic not resolved"));

        await expect(finish(vehicle.read("deviceName"))).rejects.toBeInstanceOf(BleNotSubmittedError);

        expect(link.openConnections).toBe(1);
        expect(events).toEqual([]);
    });

    it("loses the link on a not-submitted read if the backend also reports it down", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        link.connection!.reported = false;
        link.failNextRead(new BleNotSubmittedError("link down"));

        await expect(finish(vehicle.read("version"))).rejects.toBeInstanceOf(BleNotSubmittedError);

        expect(link.openConnections).toBe(0);
    });

    it("keeps the link on a whole-frame write that never reached the radio, and reports it as not delivered", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true, maxWriteSize: null });
        link.rejectNextWriteAsNotSubmitted();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.openConnections).toBe(1);
        await expect(finish(vehicle.door_lock())).resolves.toEqual(OK);
        expect(link.connections).toHaveLength(1);
    });

    it("drops the link when a frame stopped part way, as the car holds half of it, and still reports it as not delivered", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true, maxWriteSize: "unreported" });
        link.rejectNextWriteAsNotSubmitted();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.openConnections).toBe(0);
    });
});
