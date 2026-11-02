// Behaviour specs ported from Python's `tests/test_ble_pair.py`,
// `tests/test_ble_null_key.py` and the pairing case of
// `test_ble_connect_failover.py`. `FakeVehicle` models the whitelist: a key not
// on it fails every handshake until `keyEnrolled` turns true.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@teslemetry/tesla-protocol/command/keys";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { FromVCSECMessage, KeyFormFactor, OperationStatusE, VehicleLockStateE, VehicleStatus, WhitelistOperationInformationE } from "@teslemetry/tesla-protocol/command/vcsec";
import TeslaBluetooth from "../../src/bluetooth/teslabluetooth.js";
import VehicleBluetooth from "../../src/bluetooth/vehiclebluetooth.js";
import { BluetoothTimeout, BluetoothTransportError, SigningDisabled, WhitelistOperationStatus, WhitelistOperationWhitelistFull } from "../../src/exceptions.js";
import { publicKeyFor } from "../../src/signing/crypto.js";
import { BleHarnessOptions, OUR_PRIVATE_KEY, VCSEC, VIN, bareAck, bleHarness, finish, timed } from "../helpers/blevehicle.js";

function unpaired(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    harness.fakeVehicle.keyEnrolled = false;
    const { link } = harness;
    return { ...harness, whitelistWrites: () => link.vcsecWrites.filter((command) => command.WhitelistOperation) };
}

type Harness = ReturnType<typeof unpaired>;

/** The tap happens at `afterMs`, and the car then answers its handshakes. */
function tapAfter({ fakeVehicle }: Harness, afterMs: number): void {
    setTimeout(() => {
        fakeVehicle.keyEnrolled = true;
    }, afterMs);
}

/** The reply to the whitelist operation, addressed to this client, arriving late. */
function lateReply({ vehicle, link, fakeVehicle }: Harness, afterMs: number): void {
    setTimeout(() => {
        const reply: RoutableMessage = { ...fakeVehicle.whitelistReply(), toDestination: { routingAddress: vehicle.routingAddress } };
        link.injectMessage(reply);
    }, afterMs);
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("the whitelist request", () => {
    it("wraps an UnsignedMessage in a RoutableMessage, as Python does", async () => {
        const harness = unpaired();

        await finish(harness.vehicle.pair());

        const frame = harness.link.commands(VCSEC)[0]!;
        expect(frame.signatureData).toBeUndefined();
        expect(frame.uuid).toHaveLength(16);
        expect(frame.fromDestination?.routingAddress).toEqual(harness.vehicle.routingAddress);
    });

    it("asks for an owner's cloud key by default", async () => {
        const { vehicle, fakeVehicle } = unpaired();

        await finish(vehicle.pair());

        const [operation] = fakeVehicle.whitelistOperations;
        expect(Buffer.from(operation!.addKeyToWhitelistAndAddPermissions!.key!.PublicKeyRaw)).toEqual(publicKeyFor(OUR_PRIVATE_KEY));
        expect(operation!.addKeyToWhitelistAndAddPermissions!.keyRole).toBe(Role.ROLE_OWNER);
        expect(operation!.metadataForKey?.keyFormFactor).toBe(KeyFormFactor.KEY_FORM_FACTOR_CLOUD_KEY);
    });

    it("takes a role and form", async () => {
        const { vehicle, fakeVehicle } = unpaired();

        await finish(vehicle.pair({ role: Role.ROLE_DRIVER, form: KeyFormFactor.KEY_FORM_FACTOR_ANDROID_DEVICE }));

        const [operation] = fakeVehicle.whitelistOperations;
        expect(operation!.addKeyToWhitelistAndAddPermissions!.keyRole).toBe(Role.ROLE_DRIVER);
        expect(operation!.metadataForKey?.keyFormFactor).toBe(KeyFormFactor.KEY_FORM_FACTOR_ANDROID_DEVICE);
    });
});

describe("the reply path", () => {
    it("returns on the reply, without polling", async () => {
        const harness = unpaired();

        await finish(harness.vehicle.pair({ pollIntervalMs: 10, timeoutMs: 1000 }));

        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(harness.link.handshakes(VCSEC)).toEqual([]);
    });

    it("raises a refusal's mapped fault", async () => {
        const harness = unpaired();
        harness.fakeVehicle.whitelistInformation = WhitelistOperationInformationE.WHITELISTOPERATION_INFORMATION_WHITELIST_FULL;

        await expect(finish(harness.vehicle.pair())).rejects.toBeInstanceOf(WhitelistOperationWhitelistFull);

        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(harness.link.openConnections).toBe(0);
    });
});

describe("the polling path", () => {
    it("recovers a lost reply by polling, without sending the request again", async () => {
        const harness = unpaired();
        harness.link.dropNextReply();
        tapAfter(harness, 12_000);

        await expect(finish(harness.vehicle.pair())).resolves.toBeUndefined();

        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(harness.link.handshakes(VCSEC).length).toBeGreaterThanOrEqual(2);
        expect(harness.vehicle.session(VCSEC).ready).toBe(true);
    });

    it("finds a late reply after the BluetoothTimeout", async () => {
        const harness = unpaired();
        harness.link.dropNextReply();
        lateReply(harness, 7000);

        await expect(finish(harness.vehicle.pair({ pollIntervalMs: 5000 }))).resolves.toBeUndefined();

        expect(harness.whitelistWrites()).toHaveLength(1);
        // The first poll missed it. The second found it, so no third probe.
        expect(harness.link.handshakes(VCSEC)).toHaveLength(1);
    });

    it("raises a late refusal", async () => {
        const harness = unpaired();
        harness.link.dropNextReply();
        harness.fakeVehicle.whitelistInformation = WhitelistOperationInformationE.WHITELISTOPERATION_INFORMATION_WHITELIST_FULL;
        lateReply(harness, 7000);

        await expect(finish(harness.vehicle.pair())).rejects.toBeInstanceOf(WhitelistOperationWhitelistFull);

        expect(harness.whitelistWrites()).toHaveLength(1);
    });

    it("finds a reply that lands in the final sleep", async () => {
        const harness = unpaired();
        harness.link.dropNextReply();
        lateReply(harness, 8000);

        await expect(finish(harness.vehicle.pair({ pollIntervalMs: 5000, timeoutMs: 9000 }))).resolves.toBeUndefined();
    });

    it("keeps other queued replies when it looks for a late one", async () => {
        const harness = unpaired();
        const { vehicle, link, fakeVehicle } = harness;
        link.dropNextReply();
        const other: RoutableMessage = RoutableMessage.fromPartial({
            toDestination: { routingAddress: vehicle.routingAddress },
            fromDestination: { domain: VCSEC },
            protobufMessageAsBytes: FromVCSECMessage.encode(FromVCSECMessage.fromPartial({ vehicleStatus: { vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED } })).finish(),
        });
        const logged: string[] = [];
        vehicle.parent.parent._log = (line: string) => logged.push(line);
        setTimeout(() => {
            link.injectMessage(other);
            link.injectMessage({ ...fakeVehicle.whitelistReply(), toDestination: { routingAddress: vehicle.routingAddress } });
        }, 7000);

        await finish(vehicle.pair());
        await finish(vehicle.connect());
        await finish(vehicle.handshakeVehicleSecurity()).catch(() => undefined);

        expect(logged.filter((line) => line.includes("discarded a stale reply"))).toHaveLength(1);
    });

    it("rejects a poll interval that could never end, before sending", async () => {
        const { vehicle, link } = unpaired();

        await expect(finish(vehicle.pair({ pollIntervalMs: 0 }))).rejects.toBeInstanceOf(RangeError);

        expect(link.calls).toEqual([]);
    });

    it("carries on through a dropped link", async () => {
        const harness = unpaired();
        const { vehicle, link } = harness;
        link.dropNextReply();
        setTimeout(() => {
            link.failConnect(3);
            link.dropLink();
        }, 6000);
        tapAfter(harness, 15_000);

        await expect(finish(vehicle.pair())).resolves.toBeUndefined();

        expect(link.connections.length).toBeGreaterThanOrEqual(2);
        expect(harness.whitelistWrites()).toHaveLength(1);
    });

    it("carries on through a reply that fails authentication", async () => {
        const harness = unpaired();
        const { vehicle, link, fakeVehicle } = harness;
        link.dropNextReply();
        setTimeout(() => {
            fakeVehicle.keyEnrolled = true;
            // VCSEC was seen to send an empty tag right after a key was added.
            fakeVehicle.emptyNextSessionInfoTag(1);
        }, 1000);

        await expect(finish(vehicle.pair())).resolves.toBeUndefined();

        expect(link.handshakes(VCSEC)).toHaveLength(2);
    });

    it("raises BluetoothTimeout at the deadline, with one request and the link dropped", async () => {
        const harness = unpaired();
        const { vehicle, link } = harness;
        link.dropNextReply();

        const { error } = await timed(() => vehicle.pair({ pollIntervalMs: 1000, timeoutMs: 4000 }));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(link.handshakes(VCSEC).length).toBeGreaterThan(1);
        expect(link.openConnections).toBe(0);
    });

    it("still counts one request when the write fails after submission", async () => {
        const harness = unpaired();
        const { vehicle, link } = harness;
        link.failNextWrite("after");
        link.dropNextReply();
        tapAfter(harness, 8000);

        await expect(finish(vehicle.pair())).resolves.toBeUndefined();

        expect(harness.whitelistWrites()).toHaveLength(1);
    });

    it("raises a transport failure that provably sent nothing", async () => {
        const harness = unpaired({ max_connect_attempts: 1 });
        harness.link.failConnect(1);

        await expect(finish(harness.vehicle.pair())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(harness.whitelistWrites()).toEqual([]);
    });

    it("signs commands after pairing, without a deadlock on the session lock", async () => {
        const harness = unpaired();
        harness.link.dropNextReply();
        tapAfter(harness, 7000);

        await finish(harness.vehicle.pair());

        await expect(finish(harness.vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });
});

describe("what does not prove the key is on the car", () => {
    const { OPERATIONSTATUS_ERROR, OPERATIONSTATUS_OK, OPERATIONSTATUS_WAIT } = OperationStatusE;
    const payload = (message: object) => FromVCSECMessage.encode(FromVCSECMessage.fromPartial(message)).finish();

    function replyWith({ link }: Harness, protobufMessageAsBytes: Uint8Array | undefined) {
        link.rewriteNextReply((reply, request) => [{ message: { ...reply, protobufMessageAsBytes, requestUuid: request.uuid } }]);
    }

    it.each([
        ["WAIT", payload({ commandStatus: { operationStatus: OPERATIONSTATUS_WAIT } })],
        ["a WAIT on the whitelist status", payload({ commandStatus: { operationStatus: OPERATIONSTATUS_OK, whitelistOperationStatus: { operationStatus: OPERATIONSTATUS_WAIT } } })],
        ["OK with no whitelist status", payload({ commandStatus: { operationStatus: OPERATIONSTATUS_OK } })],
        ["a bare vehicleStatus", payload({ vehicleStatus: {} })],
        ["a bare ack", undefined],
        ["bytes that do not decode", Buffer.from([0xff])],
    ])("%s keeps waiting, then times out", async (_name, bytes) => {
        const harness = unpaired();
        replyWith(harness, bytes);

        // Longer than the wait for data after an ack, so a bare ack gets back to `pair`.
        const { error } = await timed(() => harness.vehicle.pair({ pollIntervalMs: 3000, timeoutMs: 8000 }));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(harness.fakeVehicle.keyEnrolled).toBe(false);
    });

    it("WAIT keeps waiting until the tap, without a second request", async () => {
        const harness = unpaired();
        replyWith(harness, payload({ commandStatus: { operationStatus: OPERATIONSTATUS_WAIT } }));
        tapAfter(harness, 12_000);

        await expect(finish(harness.vehicle.pair())).resolves.toBeUndefined();

        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(harness.link.handshakes(VCSEC).length).toBeGreaterThanOrEqual(3);
    });

    it.each([
        ["ERROR", payload({ commandStatus: { operationStatus: OPERATIONSTATUS_ERROR } })],
        ["an ERROR on the whitelist status", payload({ commandStatus: { operationStatus: OPERATIONSTATUS_OK, whitelistOperationStatus: { operationStatus: OPERATIONSTATUS_ERROR } } })],
        ["a nominalError", payload({ nominalError: { genericError: 1 } })],
    ])("%s fails", async (_name, bytes) => {
        const harness = unpaired();
        replyWith(harness, bytes);

        await expect(finish(harness.vehicle.pair())).rejects.toBeInstanceOf(WhitelistOperationStatus);

        expect(harness.whitelistWrites()).toHaveLength(1);
    });

    it("does not take a bare ack of a probe for an enrolled key, whatever the session says", async () => {
        const harness = unpaired();
        const { vehicle, link, fakeVehicle } = harness;
        fakeVehicle.keyEnrolled = true;
        await finish(vehicle.handshakeVehicleSecurity());
        fakeVehicle.keyEnrolled = false;
        link.dropNextReply();
        for (let i = 0; i < 20; i++) {
            link.rewriteNextReply((reply, request) => [{ message: { ...bareAck(reply, request), sessionInfo: undefined } }], "session_info");
        }

        const { error } = await timed(() => vehicle.pair({ pollIntervalMs: 1000, timeoutMs: 8000 }));

        expect(error).toBeInstanceOf(BluetoothTimeout);
    });

    it("does not take a late non-success for the reply", async () => {
        const harness = unpaired();
        const { vehicle, link } = harness;
        link.dropNextReply();
        setTimeout(() => {
            link.injectMessage(
                RoutableMessage.fromPartial({
                    toDestination: { routingAddress: vehicle.routingAddress },
                    fromDestination: { domain: VCSEC },
                    protobufMessageAsBytes: payload({ commandStatus: { operationStatus: OPERATIONSTATUS_OK, whitelistOperationStatus: { operationStatus: OPERATIONSTATUS_WAIT } } }),
                }),
            );
        }, 6000);

        const { error } = await timed(() => vehicle.pair({ pollIntervalMs: 5000, timeoutMs: 12_000 }));

        expect(error).toBeInstanceOf(BluetoothTimeout);
    });
});

describe("an abort", () => {
    it("sends nothing when already aborted", async () => {
        const { vehicle, link } = unpaired();
        const reason = new Error("closed");

        await expect(finish(vehicle.pair({ signal: AbortSignal.abort(reason) }))).rejects.toBe(reason);

        expect(link.calls).toEqual([]);
    });

    it("ends the wait during polling, with no further write", async () => {
        const harness = unpaired();
        const { vehicle, link } = harness;
        link.dropNextReply();
        const controller = new AbortController();
        const reason = new Error("closed");
        let writesAtAbort = 0;
        setTimeout(() => {
            writesAtAbort = link.writes.length;
            controller.abort(reason);
        }, 7000);

        const { error, elapsedMs } = await timed(() => vehicle.pair({ signal: controller.signal }));
        await vi.advanceTimersByTimeAsync(30_000);

        expect(error).toBe(reason);
        expect(elapsedMs).toBeLessThan(7100);
        expect(link.writes).toHaveLength(writesAtAbort);
        expect(harness.whitelistWrites()).toHaveLength(1);
        expect(link.openConnections).toBe(1);
    });

    it("ends the wait for the first reply", async () => {
        const { vehicle, link } = unpaired();
        link.dropNextReply();
        const controller = new AbortController();
        const reason = new Error("closed");
        setTimeout(() => controller.abort(reason), 1000);

        const { error, elapsedMs } = await timed(() => vehicle.pair({ signal: controller.signal }));

        expect(error).toBe(reason);
        expect(elapsedMs).toBeLessThan(1100);
    });

    it("ends the wait during a probe with no retry after it", async () => {
        const harness = unpaired();
        const { vehicle, link } = harness;
        link.dropNextReply();
        link.dropNextReply("session_info");
        const controller = new AbortController();
        setTimeout(() => controller.abort(new Error("closed")), 5500);

        await expect(finish(vehicle.pair({ signal: controller.signal }))).rejects.toThrow("closed");
        const writes = link.writes.length;
        await vi.advanceTimersByTimeAsync(30_000);

        expect(link.writes).toHaveLength(writes);
    });
});

describe("the pinned vehicle key", () => {
    it("survives pairing across a reconnect", async () => {
        const harness = unpaired();
        const { vehicle, link, fakeVehicle } = harness;
        fakeVehicle.keyEnrolled = true;
        await finish(vehicle.handshakeVehicleSecurity());
        const pinned = vehicle.session(VCSEC).publicKey;
        fakeVehicle.keyEnrolled = false;
        link.dropNextReply();
        setTimeout(() => link.dropLink(), 6000);
        tapAfter(harness, 8000);

        await finish(vehicle.pair());

        expect(vehicle.session(VCSEC).publicKey).toEqual(pinned);
    });
});

describe("no key", () => {
    const parentOf = (privateKey?: Buffer) => new TeslaBluetooth({ privateKey }).vehicles;

    it("refuses a missing key, whether omitted or undefined", () => {
        const { link: transport } = bleHarness();
        expect(() => new VehicleBluetooth(parentOf(), VIN, { transport })).toThrow("No private key");
        expect(() => new VehicleBluetooth(parentOf(), VIN, { transport, privateKey: undefined })).toThrow("No private key");
    });

    it("falls back to the parent's key", async () => {
        const { link: transport, fakeVehicle } = bleHarness();
        const vehicle = new VehicleBluetooth(parentOf(OUR_PRIVATE_KEY), VIN, { transport, keepalive_interval_ms: null });

        await finish(vehicle.handshakeVehicleSecurity());

        expect(fakeVehicle.publicKey).toHaveLength(65);
    });

    it("disables signing with false, even with no key on the parent", async () => {
        const { link: transport } = bleHarness();

        const vehicle = new VehicleBluetooth(parentOf(), VIN, { transport, privateKey: false, keepalive_interval_ms: null });

        await expect(finish(vehicle.handshakeVehicleSecurity())).rejects.toBeInstanceOf(SigningDisabled);
    });

    it("lets false win over a key on the parent", async () => {
        const { link: transport } = bleHarness();

        const vehicle = new VehicleBluetooth(parentOf(OUR_PRIVATE_KEY), VIN, { transport, privateKey: false, keepalive_interval_ms: null });

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(SigningDisabled);
    });

    it("still receives broadcasts", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });
        const seen: VehicleLockStateE[] = [];
        vehicle.listen_vehicle_lock_state((state) => seen.push(state));
        await finish(vehicle.connect());

        link.injectVehicleStatus(VehicleStatus.fromPartial({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED }));

        expect(seen).toEqual([VehicleLockStateE.VEHICLELOCKSTATE_LOCKED]);
    });

    it("refuses to pair without touching the transport", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });

        await expect(finish(vehicle.pair())).rejects.toBeInstanceOf(SigningDisabled);

        expect(link.calls).toEqual([]);
    });

    it("keeps a passive listener's link", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });
        await finish(vehicle.connect());

        await expect(finish(vehicle.pair())).rejects.toBeInstanceOf(SigningDisabled);

        expect(link.openConnections).toBe(1);
    });
});
