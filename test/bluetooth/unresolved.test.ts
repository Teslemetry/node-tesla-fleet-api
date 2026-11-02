// Once a write may have reached the car, the only failure that stays a failure
// is the car's own refusal of that exact command. Everything else is unknown, so
// a router must not replay it.
import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageFaultE, OperationStatusE, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { VehicleRouter } from "../../src/router/index.js";
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
