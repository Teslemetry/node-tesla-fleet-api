import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import {
    InformationRequest,
    InformationRequestType,
    RKEActionE,
    UnsignedMessage,
    VehicleSleepStatusE,
    VehicleStatus,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { Action } from "@teslemetry/tesla-protocol/command/car_server";
import { SendOptions, SendRequires, SignedCommandResponse } from "../commands.js";
import { CommandResponse } from "../types/commands.js";
import { WakeUpOptions } from "../types/vehicle.js";
import Vehicle from "../vehicle.js";
import {
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothTransportError,
    SigningDisabled,
    TeslaFleetError,
} from "../exceptions.js";
import { AsyncLock, BleCallTimeout, ReplyQueue, withTimeout } from "./async.js";
import { BroadcastListeners, ListenerRegistry, Unsubscribe } from "./broadcast.js";
import {
    DEFAULT_CONNECT_ATTEMPTS,
    DEFAULT_CONNECT_TIMEOUT_MS,
    DEFAULT_KEEPALIVE_INTERVAL_MS,
    DEFAULT_MAX_WRITE_SIZE,
    DEFAULT_SCAN_TIMEOUT_MS,
    DEFAULT_WAKE_TIMEOUT_MS,
    GATT_READ_TIMEOUT_MS,
    GATT_WRITE_TIMEOUT_MS,
    LINK_TEARDOWN_TIMEOUT_MS,
} from "./constants.js";
import { ReassemblingBuffer, prependLength, splitFrame } from "./framing.js";
import { get_name, name_matches_vin } from "./names.js";
import { BleCharacteristic, BleConnection, BleDeviceRef, BleNotSubmittedError, BleTransport } from "./transport.js";

export interface VehicleBluetoothOptions {
    transport: BleTransport;
    /** Raw 32-byte P-256 scalar. `undefined` uses the parent's key. `false` disables signing, for a passive listener. */
    privateKey?: Buffer | false;
    /** Skip the scan and connect to this device. */
    device?: BleDeviceRef;
    /**
     * After this long with no GATT traffic, read a characteristic to hold the
     * link open. Defaults to 20000. `null` or `0` disables it. The reads delay
     * an awake car's sleep, so a consumer that wants it to sleep disables them.
     */
    keepalive_interval_ms?: number | null;
    /** Wakes a sleeping vehicle for an infotainment command, instead of raising. Defaults to `true`. */
    wake_if_asleep?: boolean;
    /** Connect attempts per connect. Defaults to 3. */
    max_connect_attempts?: number;
    /** One connect attempt. Defaults to 20000. */
    connect_timeout_ms?: number;
    /** One scan, which must outlast the backend's scan window. Defaults to 10000. */
    scan_timeout_ms?: number;
}

export interface FindVehicleOptions {
    /** Match this name exactly, instead of this vehicle's. */
    name?: string;
    /** Match this `BleDeviceRef.id`, instead of a name. */
    address?: string;
    timeoutMs?: number;
}

const VCSEC = Domain.DOMAIN_VEHICLE_SECURITY;
const INFOTAINMENT = Domain.DOMAIN_INFOTAINMENT;

/** One GATT connection, or an attempt at one, with everything that must not outlive it. */
class Link {
    connection!: BleConnection;
    /** Holds one adapter call at a time, so frames and reads never interleave. */
    readonly gatt = new AsyncLock();
    /** Per link, so a partial frame from a dead link can never join the next link's. */
    readonly buffer: ReassemblingBuffer;
    /** Aborts when the link is lost, ending every wait on it. */
    readonly closed = new AbortController();

    constructor(onMessage: (message: RoutableMessage) => void) {
        this.buffer = new ReassemblingBuffer(onMessage);
    }

    get lost(): boolean {
        return this.closed.signal.aborted;
    }

    close(): void {
        this.closed.abort(new Error("The Bluetooth link was lost."));
    }
}

/**
 * A vehicle reached directly over Bluetooth, with commands signed by AES-GCM.
 *
 * All Tesla protocol logic lives here and in `Commands`. A `BleTransport`
 * supplies raw GATT only, so the same class runs on any backend, Homey's
 * included. Backends may hang and may misreport their link, so every backend
 * call is bounded, and a failed or timed-out operation is what counts as a dead
 * link.
 *
 * `Commands.dispatch` holds a VCSEC session's lock across `_send`, and that lock
 * is not reentrant, so `_send` serializes on its own `domainSendLock` and must
 * never take `Session.withLock`.
 *
 * Sessions survive a reconnect, and the vehicle key they pinned at first contact
 * survives with them: a new link may re-handshake, but nothing here clears a
 * session or lets a new link trust a new key.
 */
export default class VehicleBluetooth extends BroadcastListeners {
    readonly _transport_name: string = "bluetooth";
    protected override authMethod: "hmac" | "aes" = "aes";

    /** Reply wait with data. */
    protected defaultTimeoutMs = 5000;
    /** Reply wait for a VCSEC actuation. A lost ack is inconclusive, so a shorter wait loses nothing. */
    protected actuationTimeoutMs = 2000;
    /** Wait for data after a bare ack. */
    protected ackFollowupTimeoutMs = 2000;
    /** How long a command woken by `wake_if_asleep` waits for infotainment. */
    protected wakeTimeoutMs = DEFAULT_WAKE_TIMEOUT_MS;
    /** Bound on one keepalive read. */
    protected keepaliveTimeoutMs = 2000;

    /** The vehicle's BLE name, with the usual `C` suffix. */
    readonly ble_name: string;
    wake_if_asleep: boolean;
    readonly keepalive_interval_ms: number | null;
    protected readonly transport: BleTransport;
    protected readonly queues: Partial<Record<Domain, ReplyQueue<RoutableMessage>>> = {
        [VCSEC]: new ReplyQueue(),
        [INFOTAINMENT]: new ReplyQueue(),
    };
    private readonly maxConnectAttempts: number;
    private readonly connectTimeoutMs: number;
    private readonly scanTimeoutMs: number;
    private readonly domainSendLock: Partial<Record<Domain, AsyncLock>> = {
        [VCSEC]: new AsyncLock(),
        [INFOTAINMENT]: new AsyncLock(),
    };
    private readonly connectLock = new AsyncLock();
    private device: BleDeviceRef | undefined;
    private link: Link | null = null;
    /** Closing a lost link. A new connect waits for it: a late disconnect could end the new link. */
    private teardown: Promise<unknown> = Promise.resolve();
    private keepaliveTimer: ReturnType<typeof setTimeout> | null = null;
    /** When GATT traffic last moved, on the monotonic clock. */
    private lastActivity = 0;
    private connected = false;
    private readonly connectionListeners = new ListenerRegistry<boolean>((message) => this.log(message));

    constructor(parent: Vehicle, vin: string, options: VehicleBluetoothOptions) {
        super(parent, vin, options.privateKey);
        this.transport = options.transport;
        this.device = options.device;
        this.keepalive_interval_ms =
            options.keepalive_interval_ms === undefined ? DEFAULT_KEEPALIVE_INTERVAL_MS : options.keepalive_interval_ms;
        this.wake_if_asleep = options.wake_if_asleep ?? true;
        this.maxConnectAttempts = options.max_connect_attempts ?? DEFAULT_CONNECT_ATTEMPTS;
        this.connectTimeoutMs = options.connect_timeout_ms ?? DEFAULT_CONNECT_TIMEOUT_MS;
        this.scanTimeoutMs = options.scan_timeout_ms ?? DEFAULT_SCAN_TIMEOUT_MS;
        this.ble_name = get_name(vin);
    }

    /**
     * Find this vehicle. Never filters by service, because the vehicle advertises
     * none. A device with free connection slots wins, then the strongest signal.
     * @throws BluetoothTransportError when the scan fails or finds nothing.
     */
    async find_vehicle({ name, address, timeoutMs = this.scanTimeoutMs }: FindVehicleOptions = {}): Promise<BleDeviceRef> {
        const matchesName = (seen: string) => (name !== undefined ? seen === name : name_matches_vin(seen, this.vin));
        const accepts = (device: BleDeviceRef) =>
            address !== undefined ? device.id === address : device.name !== undefined && matchesName(device.name);

        let seen: BleDeviceRef[];
        try {
            seen = await withTimeout(
                () => this.transport.scan({ timeoutMs, matches: address === undefined ? matchesName : undefined }),
                timeoutMs,
            );
        } catch (cause) {
            throw new BluetoothTransportError(null, null, { cause });
        }

        const [device] = seen
            .filter(accepts)
            .sort(
                (a, b) =>
                    Number(a.connectable === false) - Number(b.connectable === false) ||
                    (b.rssi ?? -Infinity) - (a.rssi ?? -Infinity),
            );
        if (!device) {
            throw new BluetoothTransportError("Vehicle not found in the scan.");
        }
        this.device = device;
        return device;
    }

    /** Assign the device later connections use. */
    set_device(device: BleDeviceRef): void {
        this.device = device;
    }

    /** The device later connections use, if one has been found or set. */
    get_device(): BleDeviceRef | undefined {
        return this.device;
    }

    /**
     * Connect, unless a link is up. Scans first if no device is known. Python
     * raises there instead, but a Homey app has no scan of its own to run.
     * @throws BluetoothTransportError when every attempt fails, with the last failure as `cause`.
     */
    async connect(maxAttempts: number = this.maxConnectAttempts): Promise<void> {
        await this.connectLock.run(async () => {
            const current = this.link;
            if (current?.connection.isConnected) {
                return;
            }
            if (current) {
                this.loseLink(current, "backend reports it down");
            }
            await this.teardown;

            const device = this.device ?? (await this.find_vehicle());
            let cause: unknown;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    await this.connectOnce(device);
                    return;
                } catch (error) {
                    this.log(`BLE connect attempt ${attempt}/${maxAttempts} failed: ${describe(error)}`);
                    cause = error;
                }
            }
            throw new BluetoothTransportError(null, null, { cause });
        });
    }

    /** Connect if the link is down, as every send does. */
    async connect_if_needed(maxAttempts: number = this.maxConnectAttempts): Promise<void> {
        await this.connect(maxAttempts);
    }

    private async connectOnce(device: BleDeviceRef): Promise<void> {
        const link = new Link((message) => this.onMessage(message));
        const connecting = (async () =>
            this.transport.connect(device, {
                onNotify: (chunk) => this.onNotify(link, chunk),
                onDisconnect: () => this.loseLink(link, "backend reported a disconnect"),
            }))();

        let connection: BleConnection;
        try {
            connection = await withTimeout(() => connecting, this.connectTimeoutMs);
        } catch (error) {
            link.close();
            if (error instanceof BleCallTimeout) {
                // A backend with no connect timeout can still land this attempt.
                // The vehicle has three slots, so it must not keep one.
                void connecting.then(
                    (late) => this.closeConnection(late),
                    () => undefined,
                );
            }
            throw error;
        }

        if (link.lost || !connection.isConnected) {
            link.close();
            await this.closeConnection(connection);
            throw new Error("The link dropped while connecting.");
        }
        link.connection = connection;
        this.link = link;
        this.startKeepalive();
        this.setConnected(true);
    }

    /** Close a connection, bounded and never throwing: the failure behind it is what gets reported. */
    private async closeConnection(connection: BleConnection): Promise<void> {
        try {
            await withTimeout(() => connection.disconnect(), LINK_TEARDOWN_TIMEOUT_MS);
        } catch (error) {
            this.log(`BLE link teardown failed: ${describe(error)}`);
        }
    }

    /**
     * Mark a link lost and start closing it. Only the current link has state to
     * clear, so a late event from an old link or an abandoned attempt ends there.
     */
    private loseLink(link: Link, reason: string): void {
        link.close();
        if (this.link !== link) {
            return;
        }
        this.link = null;
        this.log(`BLE link lost: ${reason}`);
        this.stopKeepalive();
        this.teardown = Promise.all([this.teardown, this.closeConnection(link.connection)]);
        this.setConnected(false);
    }

    /** Tear down the link and wait for it. The next send reconnects. */
    protected async dropLink(reason: string): Promise<void> {
        if (this.link) {
            this.loseLink(this.link, reason);
        }
        await this.teardown;
    }

    /** Drop the link after a failed session setup, unless the failure never touched it. */
    protected async dropLinkOnFailure(reason: string, error: unknown): Promise<void> {
        if (!(error instanceof SigningDisabled)) {
            await this.dropLink(`${reason}: ${describe(error)}`);
        }
    }

    /**
     * Disconnect, waiting out any connect in progress.
     * @returns Whether there was a connection.
     */
    async disconnect(): Promise<boolean> {
        return this.connectLock.run(async () => {
            const connected = this.link !== null;
            await this.dropLink("disconnect");
            return connected;
        });
    }

    /**
     * Listen for the link coming up and going down. `true` fires once
     * notifications are live, and `false` once the link is lost, for any reason
     * and however it was noticed. Only real changes fire. A backend that drops
     * silently makes `false` as late as the next operation to time out.
     */
    listen_connection_status(callback: (connected: boolean) => void): Unsubscribe {
        return this.connectionListeners.add(callback);
    }

    private setConnected(connected: boolean): void {
        if (this.connected !== connected) {
            this.connected = connected;
            this.connectionListeners.emit(connected);
        }
    }

    private startKeepalive(): void {
        this.stopKeepalive();
        if (this.keepalive_interval_ms) {
            this.lastActivity = performance.now();
            this.scheduleKeepalive(this.keepalive_interval_ms);
        }
    }

    private stopKeepalive(): void {
        if (this.keepaliveTimer !== null) {
            clearTimeout(this.keepaliveTimer);
            this.keepaliveTimer = null;
        }
    }

    private scheduleKeepalive(intervalMs: number): void {
        const idleMs = performance.now() - this.lastActivity;
        this.keepaliveTimer = setTimeout(() => void this.keepaliveTick(intervalMs), Math.max(0, intervalMs - idleMs));
        // A keepalive is no reason to hold a process open.
        this.keepaliveTimer.unref?.();
    }

    /** Idle-triggered, so an active link pays nothing. It never raises, never reconnects and never wakes the car. */
    private async keepaliveTick(intervalMs: number): Promise<void> {
        this.keepaliveTimer = null;
        const link = this.link;
        if (!link) {
            return;
        }
        if (performance.now() - this.lastActivity >= intervalMs) {
            await this.keepaliveRead(link);
            this.lastActivity = performance.now();
        }
        if (this.link === link) {
            this.scheduleKeepalive(intervalMs);
        }
    }

    /**
     * One bounded read, with every failure swallowed. A read that times out
     * still marks the link lost, as any read does here: on a backend that
     * misreports its link, that is how a dead idle link is found before the next
     * command writes to it. Python only drops the read.
     */
    private async keepaliveRead(link: Link): Promise<void> {
        if (!link.connection.isConnected) {
            this.loseLink(link, "backend reports it down");
            return;
        }
        try {
            await this.gattRead("version", this.keepaliveTimeoutMs);
        } catch (error) {
            this.log(`BLE keepalive read failed: ${describe(error)}`);
        }
    }

    /** A backend calls this, so it must never throw. */
    private onNotify(link: Link, chunk: Uint8Array): void {
        if (link.lost) {
            return;
        }
        this.lastActivity = performance.now();
        try {
            link.buffer.receive(chunk);
        } catch (error) {
            this.log(`BLE notification failed: ${describe(error)}`);
        }
    }

    /** Route one whole message: replies to their domain's queue, the rest to whoever listens. */
    private onMessage(message: RoutableMessage): void {
        const address = message.toDestination?.routingAddress;
        const domain = message.fromDestination?.domain ?? Domain.DOMAIN_BROADCAST;
        if (!address || !this.fromDestination.equals(address)) {
            this.dispatchBroadcast(domain, message);
            return;
        }
        const queue = this.queues[domain];
        if (!queue) {
            this.log(`BLE ignored a reply from unhandled domain ${domain}`);
            return;
        }
        queue.push(message);
    }

    /** Write one frame, with its chunks together, each bounded. */
    private writeFrame(link: Link, frame: Uint8Array): Promise<void> {
        const { connection } = link;
        const maxWriteSize = connection.maxWriteSize === undefined ? DEFAULT_MAX_WRITE_SIZE : connection.maxWriteSize;
        return link.gatt.run(async () => {
            for (const chunk of splitFrame(frame, maxWriteSize)) {
                if (link.lost) {
                    throw new BleNotSubmittedError("The link was lost before the frame was fully written.");
                }
                await withTimeout(() => connection.write(chunk), GATT_WRITE_TIMEOUT_MS, link.closed.signal);
                this.lastActivity = performance.now();
            }
        });
    }

    /**
     * Read a characteristic, bounded. A timeout is what finds a silently dead
     * link, so it marks the link lost, as a failure does once the backend agrees.
     * @throws BluetoothTransportError when there is no link.
     */
    protected async gattRead(characteristic: BleCharacteristic, timeoutMs: number = GATT_READ_TIMEOUT_MS): Promise<Uint8Array> {
        const link = this.link;
        if (!link) {
            throw new BluetoothTransportError();
        }
        const { connection } = link;
        return link.gatt.run(async () => {
            if (link.lost) {
                throw new BluetoothTransportError();
            }
            try {
                return await withTimeout(() => connection.read(characteristic), timeoutMs, link.closed.signal);
            } catch (error) {
                if (error instanceof BleCallTimeout || !connection.isConnected) {
                    this.loseLink(link, `read failed: ${describe(error)}`);
                }
                throw error;
            }
        });
    }

    protected async _send(msg: RoutableMessage, requires: SendRequires, options: SendOptions = {}): Promise<RoutableMessage> {
        const { expectsData = true, optimistic = false } = options;
        const timeoutMs = options.timeoutMs ?? (expectsData ? this.defaultTimeoutMs : this.actuationTimeoutMs);
        const domain = msg.toDestination?.domain;
        const lock = domain === undefined ? undefined : this.domainSendLock[domain];
        const queue = domain === undefined ? undefined : this.queues[domain];
        if (domain === undefined || !lock || !queue) {
            throw new Error(`No Bluetooth reply queue for domain ${domain}.`);
        }

        return lock.run(async () => {
            const frame = prependLength(RoutableMessage.encode(msg).finish());

            for (const stale of queue.drain()) {
                this.log(`BLE discarded a stale reply from domain ${stale.fromDestination?.domain}`);
            }

            await this.connect_if_needed();
            const link = this.link;
            if (!link?.connection.isConnected) {
                if (link) {
                    this.loseLink(link, "backend reports it down");
                }
                throw new BluetoothTransportError();
            }

            const awaitReply = () => this.awaitReply(queue, msg, requires, expectsData, timeoutMs, link.closed.signal);
            try {
                await this.writeFrame(link, frame);
            } catch (error) {
                if (error instanceof BleNotSubmittedError) {
                    this.loseLink(link, describe(error));
                    throw new BluetoothTransportError(null, null, { cause: error });
                }
                if (optimistic) {
                    this.loseLink(link, `write failed: ${describe(error)}`);
                    throw new BluetoothTimeout(null, null, { cause: error });
                }
                // A write that reached the backend may have reached the car. In
                // field data 2 of 3 such failures had executed. So this counts as
                // a lost ack, and a reply in the rest of the window still decides.
                try {
                    return await awaitReply();
                } catch (timeout) {
                    if (!(timeout instanceof BluetoothTimeout)) {
                        throw timeout;
                    }
                    // Silence after a failed write is what a dead link looks like,
                    // whatever `isConnected` says.
                    this.loseLink(link, `write failed: ${describe(error)}`);
                    throw new BluetoothTimeout(timeout.data, timeout.status, { cause: error });
                }
            }

            if (optimistic) {
                return RoutableMessage.create({});
            }
            return awaitReply();
        });
    }

    /**
     * Wait for the reply carrying `requires`, or a bare ack of this request.
     * @param signal Ends the wait early, as a timeout does.
     */
    private async awaitReply(
        queue: ReplyQueue<RoutableMessage>,
        msg: RoutableMessage,
        requires: SendRequires,
        expectsData: boolean,
        timeoutMs: number,
        signal: AbortSignal,
    ): Promise<RoutableMessage> {
        const uuid = Buffer.from(msg.uuid);
        const domain = msg.toDestination?.domain;
        const hasRequired = (resp: RoutableMessage) =>
            (requires === "session_info" ? resp.sessionInfo : resp.protobufMessageAsBytes) !== undefined;
        const deadline = performance.now() + timeoutMs;

        for (;;) {
            const resp = await queue.get(deadline - performance.now(), signal);
            if (resp === null) {
                throw new BluetoothTimeout();
            }
            this.validate_msg(resp, uuid, domain);
            if (hasRequired(resp)) {
                return resp;
            }
            if (uuid.length === 0 || !uuid.equals(resp.requestUuid)) {
                continue;
            }
            if (!expectsData) {
                return resp;
            }

            // A bare ack. Data may follow, but the overall window still rules.
            const followupDeadline = performance.now() + this.ackFollowupTimeoutMs;
            for (;;) {
                const limit = Math.min(followupDeadline, deadline);
                const followup = await queue.get(limit - performance.now(), signal);
                if (followup === null) {
                    if (followupDeadline > deadline && !signal.aborted) {
                        throw new BluetoothTimeout();
                    }
                    return resp;
                }
                this.validate_msg(followup, uuid, domain);
                if (hasRequired(followup)) {
                    return followup;
                }
            }
        }
    }

    /** A session that a reply left unready cannot sign, and that reply proved nothing. */
    protected override async ensureHandshake(domain: Domain): Promise<void> {
        await super.ensureHandshake(domain);
        if (!this.sessionFor(domain).ready) {
            throw new BluetoothTimeout();
        }
    }

    /** A failed handshake drops the link, so a retry starts on a fresh one. */
    override async handshakeVehicleSecurity(): Promise<void> {
        try {
            await super.handshakeVehicleSecurity();
        } catch (error) {
            await this.dropLinkOnFailure("vehicle security handshake failed", error);
            throw error;
        }
    }

    /**
     * A failed handshake drops the link, unless VCSEC reports the car asleep:
     * its infotainment is meant to be silent then, and that read proves the link.
     */
    override async handshakeInfotainment(): Promise<void> {
        try {
            await super.handshakeInfotainment();
        } catch (error) {
            if (!(error instanceof BluetoothTimeout)) {
                await this.dropLinkOnFailure("infotainment handshake failed", error);
            } else if (!(await this.vehicleAsleep())) {
                await this.dropLink("infotainment handshake failed");
            }
            throw error;
        }
    }

    protected override async sendVehicleSecurity(
        command: UnsignedMessage,
        options: Pick<SendOptions, "confirmBroadcast"> = {},
    ): Promise<CommandResponse> {
        try {
            await this.ensureHandshake(VCSEC);
        } catch (error) {
            await this.dropLinkOnFailure("vehicle security handshake failed", error);
            throw error;
        }
        return super.sendVehicleSecurity(command, options);
    }

    protected override async sendInfotainment(action: Action, options: { mutating?: boolean } = {}): Promise<SignedCommandResponse> {
        try {
            await this.ensureHandshake(INFOTAINMENT);
        } catch (error) {
            if (!(error instanceof BluetoothTimeout)) {
                await this.dropLinkOnFailure("infotainment handshake failed", error);
                throw error;
            }
            // Nothing was sent, so waking cannot run the command twice.
            if ((await this.sleepStatus()) !== VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP) {
                await this.dropLink("infotainment handshake failed");
                throw error;
            }
            if (!this.wake_if_asleep) {
                throw error;
            }
            await this.wakeForCommand(error);
        }
        return super.sendInfotainment(action, options);
    }

    /**
     * Wake a sleeping car until infotainment can take a command.
     * @throws BluetoothCommandFailed when it cannot: the command provably never ran.
     */
    protected async wakeForCommand(timeout: BluetoothTimeout): Promise<void> {
        try {
            await this.wake_up({ wait: true, timeoutMs: this.wakeTimeoutMs });
        } catch (cause) {
            if (cause instanceof TeslaFleetError) {
                throw new BluetoothCommandFailed(timeout.data, timeout.status, { cause });
            }
            throw cause;
        }
    }

    /** VCSEC's sleep status, or `null` if unreadable. */
    protected async sleepStatus(): Promise<VehicleSleepStatusE | null> {
        try {
            return (await this.vehicle_state()).vehicleSleepStatus;
        } catch (error) {
            if (error instanceof TeslaFleetError) {
                return null;
            }
            throw error;
        }
    }

    /** Whether VCSEC reports the car asleep; `false` if unreadable. */
    protected async vehicleAsleep(): Promise<boolean> {
        return (await this.sleepStatus()) === VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP;
    }

    /** The vehicle security computer's `VehicleStatus`. It answers while the car sleeps. */
    async vehicle_state(): Promise<VehicleStatus> {
        return this._getVehicleSecurity(
            UnsignedMessage.create({
                InformationRequest: InformationRequest.create({
                    informationRequestType: InformationRequestType.INFORMATION_REQUEST_TYPE_GET_STATUS,
                }),
            }),
        );
    }

    /**
     * Wake the vehicle. Takes `VehicleSpecific`'s options, but resolves to a
     * `CommandResponse`, not the REST `VehicleResponse`.
     *
     * This sends the RKE wake to the vehicle security computer, which acks well
     * before infotainment can answer.
     */
    override async wake_up({ wait = false }: WakeUpOptions = {}): Promise<any> {
        if (wait) {
            throw new BluetoothTimeout("wake_up with wait is not available yet.");
        }
        return this.sendVehicleSecurity(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_WAKE_VEHICLE }));
    }
}

/** An error's class and message, for a log line. */
function describe(error: unknown): string {
    return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
