import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { SessionInfo } from "@teslemetry/tesla-protocol/command/signatures";
import { ReassemblingBuffer, prependLength, splitFrame } from "../../src/bluetooth/framing.js";
import type { BleConnection } from "../../src/bluetooth/transport.js";
import { BleNotSubmittedError } from "../../src/bluetooth/transport.js";
import { publicKeyFor } from "../../src/signing/crypto.js";
import { FakeBleLink } from "../helpers/fakeblelink.js";
import { FakeVehicle } from "../helpers/fakevehicle.js";

function sessionInfoRequest(domain: Domain) {
    return RoutableMessage.fromPartial({
        toDestination: { domain },
        fromDestination: { routingAddress: crypto.randomBytes(16) },
        sessionInfoRequest: { publicKey: publicKeyFor(crypto.randomBytes(32)) },
        uuid: crypto.randomBytes(16),
    });
}

async function open(link: FakeBleLink) {
    const received: RoutableMessage[] = [];
    const notifications: Uint8Array[] = [];
    const buffer = new ReassemblingBuffer((message) => received.push(message));
    const connection = await link.connect(
        { id: "fake-peripheral" },
        {
            onNotify(chunk) {
                notifications.push(chunk);
                buffer.receive(chunk);
            },
            onDisconnect() {},
        },
    );
    return { connection, received, notifications };
}

async function sendFrame(connection: BleConnection, frame: Uint8Array) {
    for (const chunk of splitFrame(frame, connection.maxWriteSize ?? null)) {
        await connection.write(chunk);
    }
}

beforeEach(() => {
    vi.useFakeTimers();
    return () => vi.useRealTimers();
});

describe("FakeBleLink", () => {
    it.each([
        [23, 20],
        [115, 112],
    ])("carries a framed session-info round trip at MTU %i", async (mtu, payloadSize) => {
        const vehicle = new FakeVehicle();
        const link = new FakeBleLink(vehicle, { mtu });
        const { connection, received, notifications } = await open(link);
        const request = sessionInfoRequest(Domain.DOMAIN_VEHICLE_SECURITY);
        const frame = prependLength(RoutableMessage.encode(request).finish());

        await sendFrame(connection, frame);
        await vi.advanceTimersByTimeAsync(0);

        expect(link.writes).toHaveLength(Math.ceil(frame.length / payloadSize));
        expect(link.frames).toHaveLength(1);
        expect(notifications.length).toBeGreaterThan(1);
        expect(Math.max(...notifications.map((chunk) => chunk.length))).toBeLessThanOrEqual(payloadSize);

        expect(received).toHaveLength(1);
        const reply = received[0]!;
        expect(reply.fromDestination?.domain).toBe(Domain.DOMAIN_VEHICLE_SECURITY);
        expect(Buffer.from(reply.toDestination!.routingAddress!)).toEqual(Buffer.from(request.fromDestination!.routingAddress!));
        expect(Buffer.from(SessionInfo.decode(reply.sessionInfo!).publicKey)).toEqual(vehicle.publicKey);
    });

    it("takes a full frame in one write from a backend that allows it", async () => {
        const link = new FakeBleLink(new FakeVehicle(), { maxWriteSize: null });
        const { connection, received } = await open(link);

        await sendFrame(connection, prependLength(RoutableMessage.encode(sessionInfoRequest(Domain.DOMAIN_INFOTAINMENT)).finish()));
        await vi.advanceTimersByTimeAsync(0);

        expect(link.writes).toHaveLength(1);
        expect(received).toHaveLength(1);
    });

    it("leaves maxWriteSize out for a backend that hides its MTU", async () => {
        const { connection } = await open(new FakeBleLink(new FakeVehicle(), { maxWriteSize: "unreported" }));
        expect(connection.maxWriteSize).toBeUndefined();
    });

    it("records GATT calls in order", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        await link.scan({ timeoutMs: 1 });
        const { connection } = await open(link);
        await connection.write(Buffer.from([0, 9]));
        await connection.read("version");
        await connection.disconnect();

        expect(link.calls.map((call) => call.kind)).toEqual(["scan", "connect", "write", "read", "disconnect"]);
    });

    it("drops a reply after the vehicle handled the frame", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { connection, received } = await open(link);
        link.dropNextReply("session_info");

        await sendFrame(connection, prependLength(RoutableMessage.encode(sessionInfoRequest(Domain.DOMAIN_INFOTAINMENT)).finish()));
        await vi.advanceTimersByTimeAsync(1000);

        expect(link.frames).toHaveLength(1);
        expect(received).toEqual([]);
    });

    it("delays a reply", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { connection, received } = await open(link);
        link.delayNextReply(500, "session_info");

        await sendFrame(connection, prependLength(RoutableMessage.encode(sessionInfoRequest(Domain.DOMAIN_INFOTAINMENT)).finish()));
        await vi.advanceTimersByTimeAsync(499);
        expect(received).toEqual([]);
        await vi.advanceTimersByTimeAsync(1);
        expect(received).toHaveLength(1);
    });

    it("fails a write before delivery", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { connection } = await open(link);
        link.failNextWrite("before", { match: "session_info" });

        await expect(
            sendFrame(connection, prependLength(RoutableMessage.encode(sessionInfoRequest(Domain.DOMAIN_INFOTAINMENT)).finish())),
        ).rejects.toThrow("GATT write failed");
        expect(link.frames).toEqual([]);
    });

    it("fails a write after delivery, and the reply still arrives", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { connection, received } = await open(link);
        link.failNextWrite("after", { match: "session_info" });

        await expect(
            sendFrame(connection, prependLength(RoutableMessage.encode(sessionInfoRequest(Domain.DOMAIN_INFOTAINMENT)).finish())),
        ).rejects.toThrow("GATT write failed");
        await vi.advanceTimersByTimeAsync(0);

        expect(link.frames).toHaveLength(1);
        expect(received).toHaveLength(1);
    });

    it("rejects a write as not submitted", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { connection } = await open(link);
        link.rejectNextWriteAsNotSubmitted("session_info");

        await expect(
            sendFrame(connection, prependLength(RoutableMessage.encode(sessionInfoRequest(Domain.DOMAIN_INFOTAINMENT)).finish())),
        ).rejects.toBeInstanceOf(BleNotSubmittedError);
    });

    it("injects a broadcast", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { received } = await open(link);

        link.injectVehicleStatus({ vehicleLockState: 1 });

        expect(received[0]?.fromDestination?.domain).toBe(Domain.DOMAIN_VEHICLE_SECURITY);
        expect(received[0]?.toDestination).toBeUndefined();
    });

    it("leaves a silently dropped link claiming to be up", async () => {
        const link = new FakeBleLink(new FakeVehicle());
        const { connection } = await open(link);

        link.dropLinkSilently();

        expect(connection.isConnected).toBe(true);
        expect(link.openConnections).toBe(0);
    });
});
