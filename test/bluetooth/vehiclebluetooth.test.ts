import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Domain, MessageFaultE, RoutableMessage, OperationStatusE } from "@teslemetry/tesla-protocol/command/universal_message";
import { SessionInfoStatus } from "@teslemetry/tesla-protocol/command/signatures";
import { FromVCSECMessage, VehicleSleepStatusE, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import { GenericErrorE, NominalError } from "@teslemetry/tesla-protocol/command/errors";
import { GATT_WRITE_TIMEOUT_MS, LINK_TEARDOWN_TIMEOUT_MS } from "../../src/bluetooth/constants.js";
import type { BleConnection, BleDeviceRef, BleTransport } from "../../src/bluetooth/transport.js";
import {
    BluetoothTimeout,
    BluetoothTransportError,
    NotOnWhitelistFault,
    SessionInfoAuthenticationFault,
    SigningDisabled,
    TeslaFleetMessageFaultInvalidSignature,
} from "../../src/exceptions.js";
import { INFOTAINMENT, OUR_PRIVATE_KEY, TestVehicle, VCSEC, VIN, bareAck, bleHarness, finish, timed, withFields } from "../helpers/blevehicle.js";
import { FakeBleLink } from "../helpers/fakeblelink.js";
import { FakeVehicle } from "../helpers/fakevehicle.js";
import TeslaBluetooth from "../../src/bluetooth/teslabluetooth.js";

const asleep = FromVCSECMessage.create({
    vehicleStatus: VehicleStatus.create({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP }),
});

function addressedTo(vehicle: TestVehicle, domain: Domain, vcsec: FromVCSECMessage): RoutableMessage {
    return RoutableMessage.fromPartial({
        toDestination: { routingAddress: vehicle.routingAddress },
        fromDestination: { domain },
        protobufMessageAsBytes: FromVCSECMessage.encode(vcsec).finish(),
    });
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("a round trip", () => {
    it("completes a VCSEC command without deadlocking on the session lock", async () => {
        const { vehicle, link } = bleHarness();

        await expect(finish(vehicle.door_lock(), 10_000)).resolves.toEqual({ response: { result: true, reason: "" } });

        expect(link.handshakes(VCSEC)).toHaveLength(1);
        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("signs with AES-GCM", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.door_lock());
        expect(link.commands(VCSEC)[0]?.signatureData?.AESGCMPersonalizedData).toBeDefined();
    });

    it("completes an infotainment command", async () => {
        const { vehicle, link } = bleHarness();
        await expect(finish(vehicle.charge_start())).resolves.toMatchObject({ response: { result: true } });
        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("works when VCSEC leaves request_uuid empty, as real hardware does", async () => {
        const { vehicle, fakeVehicle } = bleHarness();
        fakeVehicle.omitRequestUuidLikeRealVcsec();
        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });

    it("writes 20 bytes at a time when the backend hides its MTU, as Homey's does", async () => {
        const { vehicle, link } = bleHarness({ maxWriteSize: "unreported" });
        await finish(vehicle.door_lock());
        expect(Math.max(...link.writes.map((write) => write.length))).toBe(20);
        expect(link.writes.length).toBeGreaterThan(link.frames.length);
    });

    it("writes one full frame per write when the backend accepts it", async () => {
        const { vehicle, link } = bleHarness({ maxWriteSize: null });
        await finish(vehicle.door_lock());
        expect(link.writes).toHaveLength(link.frames.length);
    });

    it("keeps a reply that arrives before write() resolves, as Homey's did by 93 ms", async () => {
        const { link, tesla } = bleHarness();
        // The car answers at once, but the backend's write only resolves 200 ms later.
        const slow: BleTransport = {
            scan: (options) => link.scan(options),
            async connect(device, handlers) {
                const connection = await link.connect(device, handlers);
                return {
                    get isConnected() {
                        return connection.isConnected;
                    },
                    maxWriteSize: null,
                    async write(data) {
                        await connection.write(data);
                        await new Promise((resolve) => setTimeout(resolve, 200));
                    },
                    read: (characteristic) => connection.read(characteristic),
                    disconnect: () => connection.disconnect(),
                };
            },
        };
        const early = new TestVehicle(tesla.vehicles, VIN, { keepalive_interval_ms: null, transport: slow });
        await finish(early.connect());
        // The wait is shorter than the write, so only a reply held from before the write resolves can answer.
        const reply = await finish(early.send(early.sessionRequest(VCSEC), "session_info", { timeoutMs: 50 }));
        expect(reply.sessionInfo).toBeDefined();
        await finish(early.disconnect());
    });

    it("scans for the transport's own bound when scan_timeout_ms is not set", async () => {
        const { link, tesla } = bleHarness();
        link.scanWindowMs = 12_000;
        const transport = Object.assign(Object.create(link) as FakeBleLink, { scanTimeoutMs: 15_000 });
        const long = new TestVehicle(tesla.vehicles, VIN, { keepalive_interval_ms: null, transport });
        await expect(finish(long.find_vehicle())).resolves.toBeDefined();
        const short = new TestVehicle(tesla.vehicles, VIN, { keepalive_interval_ms: null, transport: link });
        await expect(finish(short.find_vehicle())).rejects.toThrow();
    });

    it("never interleaves the chunks of commands on both domains", async () => {
        const { vehicle, link } = bleHarness({ mtu: 23 });
        link.writeDelayMs = 5;

        const results = await finish(Promise.all([vehicle.door_lock(), vehicle.charge_start(), vehicle.door_unlock(), vehicle.charge_stop()]));

        expect(results.every((result) => result.response.result)).toBe(true);
        expect(link.commands(VCSEC)).toHaveLength(2);
        expect(link.commands(INFOTAINMENT)).toHaveLength(2);
    });

    it("sends VCSEC counters in order under concurrency", async () => {
        const { vehicle, fakeVehicle } = bleHarness();

        await finish(Promise.all([vehicle.door_lock(), vehicle.door_unlock(), vehicle.door_lock()]));

        expect(fakeVehicle.vcsecCounterArrivals).toEqual([...fakeVehicle.vcsecCounterArrivals].sort((a, b) => a - b));
        expect(fakeVehicle.vcsecCounterArrivals).toHaveLength(3);
    });
});

describe("_send reply waits", () => {
    it("waits past a bare ack for its data", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeInfotainment());
        link.rewriteNextReply((reply, request) => [{ message: bareAck(reply, request) }, { message: reply, delayMs: 500 }]);

        await expect(finish(vehicle.charge_start())).resolves.toMatchObject({ response: { result: true } });
    });

    it("returns the ack when no data follows", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeInfotainment());
        link.rewriteNextReply((reply, request) => [{ message: bareAck(reply, request) }]);

        const { elapsedMs, value } = await timed(() => vehicle.charge_start());

        expect(value).toMatchObject({ response: { result: true } });
        expect(elapsedMs).toBeGreaterThanOrEqual(2000);
        expect(elapsedMs).toBeLessThan(5000);
    });

    it("ignores a reply to something else until the right one arrives", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeInfotainment());
        link.rewriteNextReply((reply) => [
            { message: withFields(bareAckOfNothing(reply), { requestUuid: Buffer.from("not-ours") }) },
            { message: reply, delayMs: 100 },
        ]);

        await expect(finish(vehicle.charge_start())).resolves.toMatchObject({ response: { result: true } });
    });

    it("returns a VCSEC actuation's terminal ack with no follow-up wait", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.rewriteNextReply((reply, request) => [{ message: bareAck(reply, request) }]);

        const { elapsedMs, value } = await timed(() => vehicle.door_lock());

        expect(value).toMatchObject({ response: { result: true } });
        expect(elapsedMs).toBeLessThan(500);
    });

    it("keeps the follow-up wait for a VCSEC read", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        fakeVehicle.replyToNextVcsecCommandWith(asleep);
        link.rewriteNextReply((reply, request) => [{ message: bareAck(reply, request) }, { message: reply, delayMs: 1000 }]);

        await expect(finish(vehicle.vehicle_state())).resolves.toMatchObject({
            vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP,
        });
    });

    it("gives a lost actuation ack the short timeout", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply("session_info");

        const { elapsedMs } = await timed(() => vehicle.send(sessionRequest(vehicle), "protobuf_message_as_bytes", { expectsData: false }));

        expect(elapsedMs).toBeGreaterThanOrEqual(2000);
        expect(elapsedMs).toBeLessThan(2500);
    });

    it("gives a read the default timeout", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply();

        const { elapsedMs, error } = await timed(() => vehicle.vehicle_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(elapsedMs).toBeGreaterThanOrEqual(5000);
        expect(elapsedMs).toBeLessThan(5500);
    });

    it("honours an explicit timeout", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply("session_info");

        const { elapsedMs } = await timed(() => vehicle.send(sessionRequest(vehicle), "session_info", { timeoutMs: 700 }));

        expect(elapsedMs).toBeGreaterThanOrEqual(700);
        expect(elapsedMs).toBeLessThan(1200);
    });

    it("discards a stale queued reply before sending", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.injectMessage(addressedTo(vehicle, VCSEC, FromVCSECMessage.create({ nominalError: NominalError.create({ genericError: GenericErrorE.GENERICERROR_VEHICLE_NOT_IN_PARK }) })));

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });

    it("raises a fault in a reply", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        expect(link.frames).toHaveLength(1);
        fakeVehicle.rejectNextAsBadSignature();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(TeslaFleetMessageFaultInvalidSignature);
    });

    it("retries on WAIT, keeping the actuation's reply handling", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        fakeVehicle.queueWaits(1);
        link.rewriteNextReply((reply, request) => [{ message: withFields(reply, { requestUuid: request.uuid }) }]);

        const { elapsedMs, value } = await timed(() => vehicle.door_lock());

        expect(value).toMatchObject({ response: { result: true } });
        expect(link.commands(VCSEC)).toHaveLength(2);
        expect(elapsedMs).toBeGreaterThanOrEqual(2000);
        expect(elapsedMs).toBeLessThan(2500);
    });

    it("is not stopped by a corrupt frame between replies", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.injectBytes(Buffer.alloc(20, 0xff));

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });
});

describe("write failures", () => {
    it("raises BluetoothTransportError for a write that provably never left", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.rejectNextWriteAsNotSubmitted();

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);
        expect(link.commands()).toEqual([]);
    });

    it("raises BluetoothTimeout, keeping the cause, for a write that entered the backend", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        const underlying = new Error("write failed");
        link.failNextWrite("before", { error: underlying });

        const { error } = await timed(() => vehicle.vehicle_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect((error as Error).cause).toBe(underlying);
    });

    it("lets a reply settle a write that failed after delivery", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.failNextWrite("after");

        await expect(finish(vehicle.vehicle_state())).resolves.toBeDefined();
        expect(link.openConnections).toBe(1);
    });

    it("bounds a hung write", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.hangNextWrite("before");

        const { elapsedMs, error } = await timed(() => vehicle.vehicle_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(elapsedMs).toBeGreaterThanOrEqual(GATT_WRITE_TIMEOUT_MS);
        expect(elapsedMs).toBeLessThan(GATT_WRITE_TIMEOUT_MS + 5500);
    });

    it("finds a silently dead link by its timeouts, and reconnects", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropLinkSilently();
        expect(link.connection?.isConnected).toBe(true);

        await expect(finish(vehicle.vehicle_state())).rejects.toBeInstanceOf(BluetoothTimeout);
        expect(link.connections).toHaveLength(1);

        await expect(finish(vehicle.vehicle_state())).resolves.toBeDefined();
        expect(link.connections).toHaveLength(2);
    });

    it("does not wedge on a backend whose writes reject while it claims to be up", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.silentlyDroppedWrites = "reject";
        link.dropLinkSilently();

        await expect(finish(vehicle.vehicle_state())).rejects.toBeInstanceOf(BluetoothTimeout);

        await expect(finish(vehicle.vehicle_state())).resolves.toBeDefined();
        expect(link.connections).toHaveLength(2);
    });

    it("does not write when the link cannot be restored", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        const before = link.writes.length;
        link.dropLink();
        link.failConnect(3);

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.writes).toHaveLength(before);
    });

    it("never reuses a frame's chunks across the abort of a lost link", async () => {
        const { vehicle, link } = bleHarness({ mtu: 23, raise_unconfirmed: true });
        await finish(vehicle.handshakeVehicleSecurity());
        link.writeDelayMs = 100;
        const lock = vehicle.door_lock();
        await vi.advanceTimersByTimeAsync(150);
        link.dropLink();

        await expect(finish(lock)).rejects.toBeInstanceOf(BluetoothTimeout);
        expect(link.commands()).toEqual([]);
    });
});

describe("message routing", () => {
    it("drops a reply from a domain with no queue, and keeps going", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());

        for (const domain of [Domain.DOMAIN_BROADCAST, Domain.DOMAIN_AUTHD]) {
            expect(() => link.injectMessage(addressedTo(vehicle, domain, asleep))).not.toThrow();
        }

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });

    it("does not treat a message addressed elsewhere as a reply", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply();
        const read = vehicle.vehicle_state();
        await vi.advanceTimersByTimeAsync(50);
        link.injectMessage(
            RoutableMessage.fromPartial({
                toDestination: { routingAddress: Buffer.alloc(16, 9) },
                fromDestination: { domain: VCSEC },
                protobufMessageAsBytes: FromVCSECMessage.encode(asleep).finish(),
            }),
        );

        await expect(finish(read)).rejects.toBeInstanceOf(BluetoothTimeout);
    });

    it("routes each reply to its own domain", async () => {
        const { vehicle } = bleHarness();
        await finish(Promise.all([vehicle.handshakeVehicleSecurity(), vehicle.handshakeInfotainment()]));
        expect(vehicle.session(VCSEC).ready).toBe(true);
        expect(vehicle.session(INFOTAINMENT).ready).toBe(true);
    });
});

describe("connecting", () => {
    it("reaches a third attempt after two fail", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(2);

        await finish(vehicle.connect());

        expect(link.calls.filter((call) => call.kind === "connect")).toHaveLength(3);
        expect(link.connection?.isConnected).toBe(true);
    });

    it("gives up at the attempt budget", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(2);

        await expect(finish(vehicle.connect(2))).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.calls.filter((call) => call.kind === "connect")).toHaveLength(2);
    });

    it("makes one attempt under max_connect_attempts: 1", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1 });
        link.failConnect(1);

        await expect(finish(vehicle.connect())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.calls.filter((call) => call.kind === "connect")).toHaveLength(1);
    });

    it("keeps the last failure as the cause", async () => {
        const { vehicle, link } = bleHarness();
        const lastError = new Error("no available connection slot");
        link.failConnect(3, lastError);

        const { error } = await timed(() => vehicle.connect());

        expect(error).toBeInstanceOf(BluetoothTransportError);
        expect((error as Error).cause).toBe(lastError);
    });

    it("bounds an attempt by connect_timeout_ms, as Homey has no timeout of its own", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1, connect_timeout_ms: 4000 });
        link.hangConnect();

        const { elapsedMs, error } = await timed(() => vehicle.connect());

        expect(error).toBeInstanceOf(BluetoothTransportError);
        expect(elapsedMs).toBeGreaterThanOrEqual(4000);
        expect(elapsedMs).toBeLessThan(4500);
    });

    it("closes a connection that lands after its attempt was abandoned", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1, connect_timeout_ms: 4000 });
        link.hangConnect();
        await expect(finish(vehicle.connect())).rejects.toBeInstanceOf(BluetoothTransportError);

        link.releaseHungConnects();
        await vi.advanceTimersByTimeAsync(0);

        expect(link.connections).toHaveLength(1);
        expect(link.openConnections).toBe(0);
    });

    it("lets a late attempt close before the next, so it cannot end a link on a shared peripheral", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 2, connect_timeout_ms: 4000 });
        link.sharesPeripheral = true;
        link.hangConnect(1);

        const connecting = vehicle.connect();
        await vi.advanceTimersByTimeAsync(4000 + 1000);
        link.releaseHungConnects();
        await finish(connecting);
        await vi.advanceTimersByTimeAsync(10_000);

        expect(link.openConnections).toBe(1);
        expect(link.connection?.isConnected).toBe(true);
        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
        expect(link.connections).toHaveLength(2);
    });

    it("waits a bounded time for an attempt that never lands", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 2, connect_timeout_ms: 4000 });
        link.hangConnect(1);

        const { elapsedMs, error } = await timed(() => vehicle.connect());

        expect(error).toBeUndefined();
        expect(elapsedMs).toBeLessThanOrEqual(4000 + LINK_TEARDOWN_TIMEOUT_MS + 100);
        expect(link.openConnections).toBe(1);
    });

    it("does not let an attempt that never lands wedge a later disconnect", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1, connect_timeout_ms: 4000 });
        link.hangConnect(1);
        await timed(() => vehicle.connect());

        await expect(finish(vehicle.disconnect(), 10_000)).resolves.toBe(false);
    });

    it("ignores notifications from an abandoned attempt", async () => {
        const { vehicle, link } = bleHarness({ connect_timeout_ms: 4000, max_connect_attempts: 2 });
        link.hangConnect();

        await finish(vehicle.connect());
        link.releaseHungConnects();
        await vi.advanceTimersByTimeAsync(0);

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
    });

    it("treats a disconnect during connect as a failed attempt", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1 });
        link.dropNextConnectWhileConnecting();

        await expect(finish(vehicle.connect())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(link.openConnections).toBe(0);
    });

    it("runs one connect at a time", async () => {
        const { vehicle, link } = bleHarness();

        await finish(Promise.all([vehicle.connect(), vehicle.connect_if_needed(), vehicle.connect()]));

        expect(link.calls.filter((call) => call.kind === "connect")).toHaveLength(1);
    });

    it("does not connect again over a live link", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        await finish(vehicle.connect());
        await finish(vehicle.connect_if_needed());
        expect(link.connections).toHaveLength(1);
    });

    it("reconnects on the next send after a drop", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.door_lock());
        link.dropLink();

        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });

        expect(link.connections).toHaveLength(2);
    });

    it("waits for the old link to close before connecting a new one", async () => {
        const closed: string[] = [];
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const old = link.connection!;
        old.disconnect = () =>
            new Promise((resolve) =>
                setTimeout(() => {
                    closed.push("old closed");
                    resolve();
                }, 1000),
            );
        const original = link.connect.bind(link);
        link.connect = (device, handlers) => {
            closed.push("new connecting");
            return original(device, handlers);
        };

        link.dropLinkSilently();
        old.reported = false;
        await finish(vehicle.connect());

        expect(closed).toEqual(["old closed", "new connecting"]);
    });

    it("clears one link in a stale event from the old link without touching the new one", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        const old = link.connection!;
        link.dropLink();
        await finish(vehicle.connect());

        old.handlers.onDisconnect();

        expect(link.connections).toHaveLength(2);
        await expect(finish(vehicle.door_lock())).resolves.toMatchObject({ response: { result: true } });
        expect(link.connections).toHaveLength(2);
    });

    it("logs why an attempt failed", async () => {
        const lines: string[] = [];
        const { vehicle, link } = bleHarness({ logger: { debug: (line) => lines.push(line) } });
        link.failConnect(1, new Error("hci0 down"));

        await finish(vehicle.connect());

        expect(lines.some((line) => line.includes("attempt 1/3") && line.includes("hci0 down"))).toBe(true);
    });
});

describe("finding the vehicle", () => {
    const other = { id: "other", name: "S0000000000000000C", rssi: -30 };

    it("scans on connect when no device is known, then reuses it", async () => {
        const { vehicle, link } = bleHarness();

        await finish(vehicle.connect());
        link.dropLink();
        await finish(vehicle.connect());

        expect(link.calls.filter((call) => call.kind === "scan")).toHaveLength(1);
        expect(vehicle.get_device()?.id).toBe("fake-peripheral");
    });

    it("connects to a set device with no scan", async () => {
        const { vehicle, link } = bleHarness();
        const device: BleDeviceRef = { id: "known" };

        vehicle.set_device(device);
        await finish(vehicle.connect());

        expect(link.calls.filter((call) => call.kind === "scan")).toEqual([]);
        expect(link.calls.find((call) => call.kind === "connect")).toEqual({ kind: "connect", device });
    });

    it("filters what a backend returns, as Homey's discover takes no filter", async () => {
        const { vehicle, link } = bleHarness();
        link.devices = [other, { id: "unnamed" }, ...link.devices];

        await expect(finish(vehicle.find_vehicle())).resolves.toMatchObject({ id: "fake-peripheral" });
    });

    it("tells an adapter which names match, and passes the timeout", async () => {
        const scan = vi.fn(async () => []);
        const transport: BleTransport = { scan, connect: vi.fn() };
        const { vehicle } = bleHarness({ transport, scan_timeout_ms: 7000 });

        await expect(finish(vehicle.find_vehicle())).rejects.toBeInstanceOf(BluetoothTransportError);

        const [options] = scan.mock.calls[0] as unknown as [{ timeoutMs: number; matches: (name: string) => boolean }];
        expect(options.timeoutMs).toBe(7000);
        expect(options.matches(vehicle.ble_name)).toBe(true);
        expect(options.matches(other.name)).toBe(false);
    });

    it("finishes within a scan window as long as Homey's", async () => {
        const { vehicle, link } = bleHarness();
        link.scanWindowMs = 5000;
        await expect(finish(vehicle.find_vehicle())).resolves.toMatchObject({ id: "fake-peripheral" });
    });

    it("bounds a scan that never ends", async () => {
        const transport: BleTransport = { scan: () => new Promise(() => undefined), connect: vi.fn() };
        const { vehicle } = bleHarness({ transport });

        const { elapsedMs, error } = await timed(() => vehicle.find_vehicle());

        expect(error).toBeInstanceOf(BluetoothTransportError);
        expect(elapsedMs).toBeGreaterThanOrEqual(10_000);
        expect(elapsedMs).toBeLessThan(10_500);
    });

    it("raises BluetoothTransportError when nothing matches", async () => {
        const { vehicle, link } = bleHarness();
        link.devices = [other];
        await expect(finish(vehicle.connect())).rejects.toBeInstanceOf(BluetoothTransportError);
        expect(link.calls.filter((call) => call.kind === "connect")).toEqual([]);
    });

    it("prefers a device with free slots, then the strongest signal", async () => {
        const { vehicle, link } = bleHarness();
        const name = vehicle.ble_name;
        link.devices = [
            { id: "full", name, rssi: -40, connectable: false },
            { id: "weak", name, rssi: -80 },
            { id: "strong", name, rssi: -60 },
        ];
        await expect(finish(vehicle.find_vehicle())).resolves.toMatchObject({ id: "strong" });
    });

    it("matches another name, or an address, on request", async () => {
        const { vehicle, link } = bleHarness();
        link.devices = [other, ...link.devices];
        await expect(finish(vehicle.find_vehicle({ name: other.name }))).resolves.toMatchObject({ id: "other" });
        await expect(finish(vehicle.find_vehicle({ address: "fake-peripheral" }))).resolves.toMatchObject({ id: "fake-peripheral" });
    });
});

describe("link teardown", () => {
    function expectDropped(link: FakeBleLink) {
        expect(link.openConnections).toBe(0);
    }

    function expectKept(link: FakeBleLink) {
        expect(link.openConnections).toBe(1);
    }

    it("drops the link on a VCSEC handshake timeout", async () => {
        const { vehicle, link } = bleHarness();
        link.dropNextReply("session_info");

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTimeout);

        expectDropped(link);
    });

    it("drops the link when session info fails authentication", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness();
        fakeVehicle.corruptNextSessionInfoTag(3);

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(SessionInfoAuthenticationFault);

        expectDropped(link);
    });

    it("drops the link when a public handshake fails", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness();
        fakeVehicle.replyToNextHandshakeWithoutPublicKey(SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST);

        await expect(finish(vehicle.handshakeVehicleSecurity())).rejects.toBeInstanceOf(NotOnWhitelistFault);

        expectDropped(link);
    });

    it("drops the link on an infotainment handshake timeout with VCSEC unreadable", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        link.dropNextReply("session_info");
        link.dropNextReply("session_info");

        await expect(finish(vehicle.handshakeInfotainment())).rejects.toBeInstanceOf(BluetoothTimeout);

        expectDropped(link);
    });

    it("keeps the link on an infotainment handshake timeout with the car asleep", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply("session_info");
        fakeVehicle.replyToNextVcsecCommandWith(asleep);

        await expect(finish(vehicle.handshakeInfotainment())).rejects.toBeInstanceOf(BluetoothTimeout);

        expectKept(link);
    });

    it("drops the link on an infotainment command with VCSEC unreadable", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        link.dropNextReply("session_info");
        link.dropNextReply("session_info");

        await expect(finish(vehicle.charge_start())).rejects.toBeInstanceOf(BluetoothTimeout);

        expectDropped(link);
    });

    it("keeps the link on an infotainment command with the car asleep and wake off", async () => {
        const { vehicle, link, fakeVehicle } = bleHarness({ wake_if_asleep: false });
        await finish(vehicle.handshakeVehicleSecurity());
        link.dropNextReply("session_info");
        fakeVehicle.replyToNextVcsecCommandWith(asleep);

        const { error } = await timed(() => vehicle.charge_start());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(link.commands(INFOTAINMENT)).toEqual([]);
        expectKept(link);
    });

    it("keeps a passive listener's link on SigningDisabled", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });
        await finish(vehicle.connect());

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(SigningDisabled);

        expectKept(link);
        expect(link.writes).toEqual([]);
    });

    it("keeps the link after a good handshake", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.handshakeVehicleSecurity());
        expectKept(link);
    });

    it("does not let a failed teardown hide the real error", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        link.connection!.disconnect = () => Promise.reject(new Error("already gone"));
        link.dropNextReply("session_info");

        await expect(finish(vehicle.door_lock())).rejects.toBeInstanceOf(BluetoothTimeout);
    });

    it("bounds a teardown that hangs", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        link.connection!.disconnect = () => new Promise(() => undefined);

        const { elapsedMs } = await timed(() => vehicle.disconnect());

        expect(elapsedMs).toBeGreaterThanOrEqual(LINK_TEARDOWN_TIMEOUT_MS);
        expect(elapsedMs).toBeLessThan(LINK_TEARDOWN_TIMEOUT_MS + 500);
    });

    it("refuses an unready session after an ack-only handshake", async () => {
        const { vehicle, link } = bleHarness();
        link.rewriteNextReply((reply, request) => [{ message: bareAck(withFields(reply, { sessionInfo: undefined }), request) }], "session_info");

        const { error } = await timed(() => vehicle.door_lock());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(link.commands()).toEqual([]);
    });

    it("reports whether disconnect had anything to close", async () => {
        const { vehicle } = bleHarness();
        await expect(finish(vehicle.disconnect())).resolves.toBe(false);
        await finish(vehicle.connect());
        await expect(finish(vehicle.disconnect())).resolves.toBe(true);
    });

    it("lets a disconnect wait out a connect in progress", async () => {
        const { vehicle, link } = bleHarness();
        const connecting = vehicle.connect();
        await finish(Promise.all([connecting, vehicle.disconnect()]));
        expect(link.openConnections).toBe(0);
    });
});

describe("the pinned vehicle key across reconnects", () => {
    /** A transport whose far end can be swapped, as a spoofing car would. */
    function swappable(first: FakeBleLink) {
        const state = { current: first };
        const transport: BleTransport = {
            scan: (options) => state.current.scan(options),
            connect: (device, handlers): Promise<BleConnection> => state.current.connect(device, handlers),
        };
        return { state, transport };
    }

    it("keeps sessions across a reconnect, with no new handshake", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.door_lock());
        const pinned = vehicle.session(VCSEC).publicKey;
        link.dropLink();

        await finish(vehicle.door_lock());

        expect(link.handshakes(VCSEC)).toHaveLength(1);
        expect(vehicle.session(VCSEC).publicKey?.equals(pinned!)).toBe(true);
    });

    it("may re-handshake on a new link with the same key", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.door_lock());
        link.dropLink();

        await finish(vehicle.handshakeVehicleSecurity());

        expect(link.handshakes(VCSEC)).toHaveLength(2);
    });

    it("refuses another key on a new link instead of reopening first contact", async () => {
        const real = new FakeBleLink(new FakeVehicle());
        const { state, transport } = swappable(real);
        const vehicle = new TestVehicle(new TeslaBluetooth({ privateKey: OUR_PRIVATE_KEY }).vehicles, VIN, { transport });
        await finish(vehicle.door_lock());
        const pinned = Buffer.from(vehicle.session(VCSEC).publicKey!);

        real.dropLink();
        state.current = new FakeBleLink(new FakeVehicle());

        await expect(finish(vehicle.handshakeVehicleSecurity())).rejects.toBeInstanceOf(SessionInfoAuthenticationFault);
        expect(vehicle.session(VCSEC).publicKey?.equals(pinned)).toBe(true);
        expect(vehicle.session(VCSEC).ready).toBe(true);
    });
});

describe("a Bluetooth-only client", () => {
    it("raises BluetoothCloudUnavailableError from an inherited REST method and sends nothing", async () => {
        const { vehicle, link } = bleHarness();
        const { BluetoothCloudUnavailableError } = await import("../../src/exceptions.js");

        await expect(vehicle.vehicle_data()).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
        await expect(vehicle.fleet_status()).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);

        expect(link.calls).toEqual([]);
    });
});

/** A session-info request that bypasses the `Commands` retry, for `send`. */
function sessionRequest(vehicle: TestVehicle): RoutableMessage {
    return RoutableMessage.fromPartial({
        toDestination: { domain: VCSEC },
        fromDestination: { routingAddress: vehicle.routingAddress },
        sessionInfoRequest: { publicKey: Buffer.alloc(65, 4) },
        uuid: Buffer.alloc(16, 1),
    });
}

function bareAckOfNothing(reply: RoutableMessage): RoutableMessage {
    return withFields(reply, {
        protobufMessageAsBytes: undefined,
        signatureData: undefined,
        signedMessageStatus: { operationStatus: OperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_NONE },
    });
}
