import crypto from "crypto";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { FromVCSECMessage, UnsignedMessage, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import type {
    BleCharacteristic,
    BleConnection,
    BleDeviceRef,
    BleLinkHandlers,
    BleScanOptions,
    BleTransport,
} from "../../src/bluetooth/transport.js";
import { BleNotSubmittedError } from "../../src/bluetooth/transport.js";
import { FakeVehicle } from "./fakevehicle.js";

/** One call a client made on the link, in order. */
export type GattCall =
    | { kind: "scan" }
    | { kind: "connect"; device: BleDeviceRef }
    | { kind: "write"; data: Buffer }
    | { kind: "read"; characteristic: BleCharacteristic }
    | { kind: "disconnect" };

/** Which frames a scripted fault applies to. */
export type FrameKind = "command" | "session_info" | "any";

/** A frame to deliver in place of a reply, and how long after the previous one. */
export interface ScriptedReply {
    message: RoutableMessage;
    delayMs?: number;
}

type WriteFault = {
    match: FrameKind;
    when: "before" | "after";
    behaviour: "reject" | "hang";
    error?: Error;
};

type ReplyRule = {
    match: FrameKind;
    apply: (reply: RoutableMessage, request: RoutableMessage) => ScriptedReply[];
};

type ConnectStep = { kind: "fail"; error: Error } | { kind: "hang" } | { kind: "drop-while-connecting" };

class FakeConnection implements BleConnection {
    /** Whether the radio link is really up. */
    live = true;
    /** What the backend claims, which a silent drop leaves stale. */
    reported = true;

    constructor(
        private readonly link: FakeBleLink,
        readonly handlers: BleLinkHandlers,
        readonly maxWriteSize: number | null | undefined,
    ) {}

    get isConnected(): boolean {
        return this.reported;
    }

    write(data: Uint8Array): Promise<void> {
        return this.link.onWrite(this, Buffer.from(data));
    }

    read(characteristic: BleCharacteristic): Promise<Uint8Array> {
        return this.link.onRead(this, characteristic);
    }

    async disconnect(): Promise<void> {
        this.link.calls.push({ kind: "disconnect" });
        this.live = false;
        this.reported = false;
        this.handlers.onDisconnect();
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A GATT link to a `FakeVehicle`, as a `BleTransport`.
 *
 * It takes its own framing from the wire format instead of importing the
 * library's, so tests check the client against a second implementation, as
 * `FakeVehicle` does for signing. It answers as a real link does: a client's
 * writes reassemble into one frame, the vehicle handles it, and the reply
 * arrives in notifications cut to the MTU.
 *
 * Faults apply to the frame a write completes, so a command is lost, delayed
 * or failed as one unit however many writes carry it. Unless a call says
 * otherwise a fault skips handshakes and applies to the next signed command.
 *
 * Every call lands in `calls`, so a test can prove "exactly one".
 */
export class FakeBleLink implements BleTransport {
    readonly calls: GattCall[] = [];
    /** Every frame that reached the vehicle whole. */
    readonly frames: RoutableMessage[] = [];
    /**
     * Every VCSEC command the client finished writing, in the clear. A write that
     * then failed still counts, as it may have reached the car, so this and not
     * `frames` is what proves "exactly one".
     */
    readonly vcsecWrites: UnsignedMessage[] = [];
    readonly connections: FakeConnection[] = [];
    /** Bytes a read of `version` returns. */
    version: Uint8Array = Buffer.from([0x00, 0x01]);
    /** Bytes a read of Device Name returns, and of Appearance. */
    genericAccess: { deviceName: Uint8Array; appearance: Uint8Array } = { deviceName: Buffer.alloc(0), appearance: Buffer.alloc(0) };
    /** What a scan finds. It returns all of them, matching or not, as a Homey `discover()` does. */
    devices: BleDeviceRef[];
    /** How long a scan takes. */
    scanWindowMs = 0;
    /** How long each write takes. */
    writeDelayMs = 0;
    /** How a dead link treats a write it was not told about. */
    silentlyDroppedWrites: "hang" | "reject" = "hang";
    /** Frames that reach the radio but no computer that answers, as infotainment is while the car sleeps. */
    deafTo: ((request: RoutableMessage) => boolean) | null = null;

    private readonly mtu: number;
    private readonly writeSize: number | null | undefined;
    private rx: Buffer = Buffer.alloc(0);
    private writeFaults: WriteFault[] = [];
    private replyRules: ReplyRule[] = [];
    private connectSteps: ConnectStep[] = [];
    private hungConnects: Array<() => void> = [];
    private readFaults: Array<Error | "hang"> = [];

    /**
     * @param options.mtu Notifications carry `mtu - 3` bytes. Defaults to 23, the ATT minimum.
     * @param options.maxWriteSize What the connection reports. Defaults to `mtu - 3`. Pass `null` for a backend that takes a full frame, or `"unreported"` for one that hides its MTU, as Homey does.
     */
    constructor(
        readonly vehicle: FakeVehicle,
        options: { mtu?: number; maxWriteSize?: number | null | "unreported"; vin?: string } = {},
    ) {
        this.mtu = options.mtu ?? 23;
        this.writeSize = options.maxWriteSize === "unreported" ? undefined : options.maxWriteSize === undefined ? this.mtu - 3 : options.maxWriteSize;
        const vin = options.vin ?? "5YJXCAE43LF123456";
        const name = `S${crypto.createHash("sha1").update(vin).digest("hex").slice(0, 16)}C`;
        this.devices = [{ id: "fake-peripheral", name, rssi: -60, connectable: true }];
    }

    /** The connection a client holds now, if any. */
    get connection(): FakeConnection | undefined {
        return this.connections.at(-1);
    }

    /** GATT writes so far, however many frames they carried. */
    get writes(): Buffer[] {
        return this.calls.flatMap((call) => (call.kind === "write" ? [call.data] : []));
    }

    /** Links still up, which a leak leaves above one. */
    get openConnections(): number {
        return this.connections.filter((connection) => connection.live).length;
    }

    /** Signed commands that reached the vehicle, for one domain or all. */
    commands(domain?: Domain): RoutableMessage[] {
        return this.frames.filter(
            (frame) => this.kindOf(frame) === "command" && (domain === undefined || frame.toDestination?.domain === domain),
        );
    }

    /** Session-info requests that reached the vehicle, for one domain or all. */
    handshakes(domain?: Domain): RoutableMessage[] {
        return this.frames.filter(
            (frame) => this.kindOf(frame) === "session_info" && (domain === undefined || frame.toDestination?.domain === domain),
        );
    }

    /** The vehicle runs the frame, but its ack never arrives. */
    dropNextReply(match: FrameKind = "command"): void {
        this.replyRules.push({ match, apply: () => [] });
    }

    /** The reply arrives `delayMs` late. */
    delayNextReply(delayMs: number, match: FrameKind = "command"): void {
        this.replyRules.push({ match, apply: (reply) => [{ message: reply, delayMs }] });
    }

    /** Deliver these frames in place of the next reply: a bare ack and its data, say. */
    rewriteNextReply(apply: ReplyRule["apply"], match: FrameKind = "command"): void {
        this.replyRules.push({ match, apply });
    }

    /** The write rejects. `before`, the vehicle never sees the frame. `after`, it does, and replies. */
    failNextWrite(when: "before" | "after", options: { match?: FrameKind; error?: Error } = {}): void {
        this.writeFaults.push({ match: options.match ?? "command", when, behaviour: "reject", error: options.error });
    }

    /** An adapter reports the write provably never reached the radio. */
    rejectNextWriteAsNotSubmitted(match: FrameKind = "command"): void {
        this.writeFaults.push({ match, when: "before", behaviour: "reject", error: new BleNotSubmittedError("characteristic not resolved") });
    }

    /** The write never settles, as a Homey write can. `after`, the vehicle saw the frame first. */
    hangNextWrite(when: "before" | "after", match: FrameKind = "command"): void {
        this.writeFaults.push({ match, when, behaviour: "hang" });
    }

    /** The next `times` connects reject. */
    failConnect(times: number = 1, error: Error = new Error("connect failed")): void {
        for (let i = 0; i < times; i++) {
            this.connectSteps.push({ kind: "fail", error });
        }
    }

    /** The next `times` connects never settle until `releaseHungConnects`. */
    hangConnect(times: number = 1): void {
        for (let i = 0; i < times; i++) {
            this.connectSteps.push({ kind: "hang" });
        }
    }

    /** A hung connect finally lands, after the client gave up on it. */
    releaseHungConnects(): void {
        for (const release of this.hungConnects.splice(0)) {
            release();
        }
    }

    /** The disconnect event fires while the next connect is still resolving. */
    dropNextConnectWhileConnecting(): void {
        this.connectSteps.push({ kind: "drop-while-connecting" });
    }

    /** The next read rejects. */
    failNextRead(error: Error = new Error("read failed")): void {
        this.readFaults.push(error);
    }

    /** The next read never settles. */
    hangNextRead(): void {
        this.readFaults.push("hang");
    }

    /** The link drops and the backend says so. */
    dropLink(): void {
        const connection = this.connection;
        if (connection) {
            connection.live = false;
            connection.reported = false;
            connection.handlers.onDisconnect();
        }
    }

    /** The link drops and the backend does not notice: `isConnected` stays true, and no event fires. */
    dropLinkSilently(): void {
        if (this.connection) {
            this.connection.live = false;
        }
    }

    /** Send an unsolicited, unaddressed `VehicleStatus`. */
    injectVehicleStatus(status: Partial<VehicleStatus>): void {
        this.injectMessage(
            RoutableMessage.fromPartial({
                fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY },
                protobufMessageAsBytes: FromVCSECMessage.encode(FromVCSECMessage.fromPartial({ vehicleStatus: status })).finish(),
            }),
        );
    }

    /** Send a `FromVCSECMessage` with no `RoutableMessage` around it, as a car does on a fresh link. */
    injectBareVcsec(message: FromVCSECMessage): void {
        this.injectBytes(FromVCSECMessage.encode(message).finish());
    }

    /** Send any message, framed. */
    injectMessage(message: RoutableMessage): void {
        this.injectBytes(RoutableMessage.encode(message).finish());
    }

    /** Send raw bytes as one frame's payload. */
    injectBytes(payload: Uint8Array): void {
        const connection = this.connection;
        if (!connection?.live) {
            throw new Error("FakeBleLink has no live connection to notify on.");
        }
        this.notify(connection, payload);
    }

    async scan(_options: BleScanOptions): Promise<BleDeviceRef[]> {
        this.calls.push({ kind: "scan" });
        if (this.scanWindowMs > 0) {
            await sleep(this.scanWindowMs);
        }
        return this.devices;
    }

    async connect(device: BleDeviceRef, handlers: BleLinkHandlers): Promise<BleConnection> {
        this.calls.push({ kind: "connect", device });
        const step = this.connectSteps.shift();
        if (step?.kind === "fail") {
            throw step.error;
        }
        if (step?.kind === "hang") {
            await new Promise<void>((resolve) => this.hungConnects.push(resolve));
        }
        if (step?.kind === "drop-while-connecting") {
            handlers.onDisconnect();
        }
        const connection = new FakeConnection(this, handlers, this.writeSize);
        this.connections.push(connection);
        this.rx = Buffer.alloc(0);
        return connection;
    }

    /** @internal */
    async onWrite(connection: FakeConnection, data: Buffer): Promise<void> {
        this.calls.push({ kind: "write", data });
        if (!connection.live) {
            if (this.silentlyDroppedWrites === "hang") {
                await new Promise(() => undefined);
            }
            throw new Error("GATT write on a dead link");
        }
        if (this.writeDelayMs > 0) {
            await sleep(this.writeDelayMs);
        }

        this.rx = Buffer.concat([this.rx, data]);
        if (this.rx.length < 2 || this.rx.length < this.rx.readUInt16BE(0) + 2) {
            return;
        }
        const payload = this.rx.subarray(2, this.rx.readUInt16BE(0) + 2);
        this.rx = this.rx.subarray(payload.length + 2);
        const request = RoutableMessage.decode(payload);

        const command = this.vehicle.peekVcsecCommand(request);
        if (command) {
            this.vcsecWrites.push(command);
        }
        const fault = this.takeFirst(this.writeFaults, request);
        if (fault?.when === "before") {
            await this.applyFault(fault);
        }
        this.frames.push(request);
        if (this.deafTo?.(request)) {
            if (fault) {
                await this.applyFault(fault);
            }
            return;
        }
        const reply = this.vehicle.handle(Buffer.from(payload));
        this.scheduleReply(connection, request, reply);
        if (fault) {
            await this.applyFault(fault);
        }
    }

    /** @internal */
    async onRead(connection: FakeConnection, characteristic: BleCharacteristic): Promise<Uint8Array> {
        this.calls.push({ kind: "read", characteristic });
        const fault = this.readFaults.shift();
        if (fault instanceof Error) {
            throw fault;
        }
        if (fault === "hang" || !connection.live) {
            await new Promise(() => undefined);
        }
        return characteristic === "version" ? this.version : this.genericAccess[characteristic];
    }

    private kindOf(frame: RoutableMessage): FrameKind {
        return frame.sessionInfoRequest ? "session_info" : "command";
    }

    private takeFirst<T extends { match: FrameKind }>(rules: T[], request: RoutableMessage): T | undefined {
        const index = rules.findIndex((rule) => rule.match === "any" || rule.match === this.kindOf(request));
        return index === -1 ? undefined : rules.splice(index, 1)[0];
    }

    private async applyFault(fault: WriteFault): Promise<void> {
        if (fault.behaviour === "hang") {
            await new Promise(() => undefined);
        }
        throw fault.error ?? new Error("GATT write failed");
    }

    private scheduleReply(connection: FakeConnection, request: RoutableMessage, replyBytes: Buffer): void {
        const reply = RoutableMessage.decode(replyBytes);
        const rule = this.takeFirst(this.replyRules, request);
        const scripted = rule ? rule.apply(reply, request) : [{ message: reply }];
        let at = 0;
        for (const { message, delayMs } of scripted) {
            at += delayMs ?? 0;
            setTimeout(() => {
                if (connection.live) {
                    this.notify(connection, RoutableMessage.encode(message).finish());
                }
            }, at);
        }
    }

    /** Frame a payload and cut it into notifications of `mtu - 3` bytes. */
    private notify(connection: FakeConnection, payload: Uint8Array): void {
        const frame = Buffer.alloc(payload.length + 2);
        frame.writeUInt16BE(payload.length);
        frame.set(payload, 2);
        const size = this.mtu - 3;
        for (let offset = 0; offset < frame.length; offset += size) {
            connection.handlers.onNotify(frame.subarray(offset, offset + size));
        }
    }
}
