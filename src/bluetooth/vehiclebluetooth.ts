import crypto from "crypto";
import { Domain, MessageFaultE, OperationStatusE as MessageOperationStatusE, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { Role } from "@teslemetry/tesla-protocol/command/keys";
import {
    ClosureMoveRequest,
    ClosureMoveTypeE,
    FromVCSECMessage,
    InformationRequest,
    InformationRequestType,
    KeyFormFactor,
    OperationStatusE as VcsecOperationStatusE,
    RKEActionE,
    UnsignedMessage,
    VehicleSleepStatusE,
    VehicleStatus,
    WhitelistOperation,
} from "@teslemetry/tesla-protocol/command/vcsec";
import {
    Action,
    GetAlertState,
    GetChargeScheduleState,
    GetChargeState,
    GetChildPresenceDetectionState,
    GetClimateState,
    GetClosuresState,
    GetDisplayState,
    GetDriveState,
    GetGuiSettings,
    GetLegacyVehicleState,
    GetLightShowState,
    GetLocationState,
    GetMediaDetailState,
    GetMediaState,
    GetParentalControlsState,
    GetParkedAccessoryState,
    GetPreconditioningScheduleState,
    GetSoftwareUpdateState,
    GetSohState,
    GetSuspensionState,
    GetTirePressureState,
    GetVehicleConfig,
    GetVehicleDetailState,
    GetVehicleState,
    GetVehicleData,
    VehicleAction,
} from "@teslemetry/tesla-protocol/command/car_server";
import {
    AlertState,
    ChargeScheduleState,
    ChargeState,
    ChildPresenceDetectionState,
    ClimateState,
    ClosuresState,
    CurrentVehicleState,
    DisplayState,
    DriveState,
    GuiSettings,
    LightShowState,
    LocationState,
    MediaDetailState,
    MediaState,
    ParentalControlsState,
    ParkedAccessoryState,
    PreconditioningScheduleState,
    SoftwareUpdateState,
    SohState,
    SuspensionState,
    TirePressureState,
    VehicleConfig,
    VehicleDetailState,
    VehicleState,
    VehicleData,
} from "@teslemetry/tesla-protocol/command/vehicle";
import { BluetoothVehicleData, VehicleDataEndpoint } from "../const.js";
import { SendOptions, SendRequires, SignedCommandResponse, infotainment_command_name, vcsec_command_name } from "../commands.js";
import { CommandResponse } from "../types/commands.js";
import { WakeUpOptions } from "../types/vehicle.js";
import { logRequestError, logRequestResult } from "../log.js";
import Vehicle from "../vehicle.js";
import {
    BluetoothCloudUnavailableError,
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothTransportError,
    BluetoothUnconfirmedCommand,
    InvalidResponse,
    NotOnWhitelistFault,
    SessionInfoAuthenticationFault,
    SignedCommandResponseReplayed,
    SigningDisabled,
    TeslaFleetError,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
    WhitelistOperationStatus,
} from "../exceptions.js";
import { AsyncLock, BleCallTimeout, ReplyQueue, abortable, sleep, withTimeout } from "./async.js";
import { BroadcastListeners, ListenerRegistry, Unsubscribe, decodeVcsecStatus } from "./broadcast.js";
import {
    CHARGE_PORT_VERIFY_INTERVAL_MS,
    CHARGE_PORT_VERIFY_TIMEOUT_MS,
    DEFAULT_CONNECT_ATTEMPTS,
    DEFAULT_CONNECT_TIMEOUT_MS,
    DEFAULT_KEEPALIVE_INTERVAL_MS,
    DEFAULT_MAX_WRITE_SIZE,
    DEFAULT_PAIR_POLL_INTERVAL_MS,
    DEFAULT_PAIR_TIMEOUT_MS,
    DEFAULT_SCAN_TIMEOUT_MS,
    DEFAULT_WAKE_PROBE_TIMEOUT_MS,
    DEFAULT_WAKE_TIMEOUT_MS,
    GATT_READ_TIMEOUT_MS,
    GATT_WRITE_TIMEOUT_MS,
    INFOTAINMENT_BOOT_TIMEOUT_MS,
    LINK_TEARDOWN_TIMEOUT_MS,
    WAKE_RESEND_INTERVAL_MS,
} from "./constants.js";
import { ReassemblingBuffer, prependLength, splitFrame } from "./framing.js";
import { get_name, name_matches_vin } from "./names.js";
import { BleCharacteristic, BleConnection, BleDeviceRef, BleNotSubmittedError, BleTransport } from "./transport.js";
import { BluetoothConfirmation, VerifyPlan, chargePortConnected, infotainmentVerifyPlan, vcsecVerifyPlan } from "./verify.js";

export interface VehicleBluetoothOptions {
    transport: BleTransport;
    /** Raw 32-byte P-256 scalar. `undefined` uses the parent's key. `false` disables signing, for a passive listener. */
    privateKey?: Buffer | false;
    /** Skip the scan and connect to this device. */
    device?: BleDeviceRef;
    /** How hard a mutating command confirms itself. Defaults to `"ack"`. */
    confirmation?: BluetoothConfirmation;
    /**
     * What to do when nothing resolved a command's outcome. `false`, the default,
     * reports best-effort success. `true` raises `BluetoothUnconfirmedCommand`.
     */
    raise_unconfirmed?: boolean;
    /**
     * After this long with no GATT traffic, read a characteristic to hold the
     * link open. Defaults to 20000. `null` or `0` disables it. The reads delay
     * an awake car's sleep, so a consumer that wants it to sleep disables them.
     */
    keepalive_interval_ms?: number | null;
    /**
     * Close the link after this long with no command, read or connect in
     * progress, so it does not hold one of the vehicle's few slots. The next
     * command reconnects. Keepalive reads do not count as use. Defaults to
     * `null`, which keeps the link until `disconnect`. A link held only to hear
     * broadcasts needs it off.
     */
    idle_disconnect_ms?: number | null;
    /** Wakes a sleeping vehicle for an infotainment command or read, instead of raising. VCSEC reads never wake it. Defaults to `true`. */
    wake_if_asleep?: boolean;
    /** Connect attempts per connect. Defaults to 3. */
    max_connect_attempts?: number;
    /** One connect attempt. Defaults to 20000. */
    connect_timeout_ms?: number;
    /** One scan, which must outlast the backend's scan window. Defaults to 10000. */
    scan_timeout_ms?: number;
    /**
     * The reply wait of one infotainment readiness probe. Defaults to 1000, which
     * a ready car beats by 0.6 s. It starts after the last write, so a slow link
     * loses none of it to writing, but a link with slow replies needs more.
     */
    wake_probe_timeout_ms?: number;
}

export interface FindVehicleOptions {
    /** Match this name exactly, instead of this vehicle's. */
    name?: string;
    /** Match this `BleDeviceRef.id`, instead of a name. */
    address?: string;
    timeoutMs?: number;
}

export interface PairOptions {
    /** The role the key gets. Defaults to `ROLE_OWNER`. */
    role?: Role;
    /** The form factor the vehicle lists the key under. Defaults to `KEY_FORM_FACTOR_CLOUD_KEY`. */
    form?: KeyFormFactor;
    /** How long to wait for the key card tap. Defaults to 300000. */
    timeoutMs?: number;
    /** Between checks of whether the key was accepted. Defaults to 5000. */
    pollIntervalMs?: number;
    /** Stops the wait, for a user who walked away. Nothing is written after it aborts. */
    signal?: AbortSignal;
}

const VCSEC = Domain.DOMAIN_VEHICLE_SECURITY;
const INFOTAINMENT = Domain.DOMAIN_INFOTAINMENT;

/** What Device Name starts with once the vehicle's name is available. */
const DISPLAY_NAME_PREFIX = "\u{1F511} ";
const DISPLAY_NAME_RETRY_MS = 1000;

function success(): CommandResponse {
    return { response: { result: true, reason: "" } };
}

/** One command's watch on its domain's broadcasts while it waits for an ack. */
interface BroadcastWatcher {
    onBroadcast: (message: RoutableMessage) => void;
    /** Resolves with the first broadcast showing the requested state. */
    confirmed: Promise<RoutableMessage>;
    /** That broadcast, for a reply wait that ends in the same tick. */
    confirmation?: RoutableMessage;
    /** Whether a broadcast after the write showed something else. */
    mismatched: boolean;
    /** The write returned, well or badly. A status from before then says nothing. */
    writeEnded: boolean;
    writeComplete: boolean;
}

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
 *
 * A mutating command that times out is unresolved, not failed: in field data 2
 * of 3 failed writes had executed anyway. So a timed-out command is never sent
 * again. The outcomes a caller can see:
 *
 * - `BluetoothTransportError`: provably never reached the radio. Safe to replay.
 * - `BluetoothCommandFailed`: state proved it did not apply. Safe to replay.
 * - `BluetoothUnconfirmedCommand`: it may have run. Never replay it.
 * - A plain `BluetoothTimeout`: a read, or a step before any write.
 * - Best-effort success, when `raise_unconfirmed` is off and nothing resolved it.
 *   `charge_port_door_open` under `"verify"` is the exception, and raises.
 */
/** The longest delay `setTimeout` holds; a longer one fires at once. */
const MAX_TIMER_DELAY_MS = 2_147_483_647;

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
    /** How often a wake is resent while infotainment stays silent. */
    protected wakeResendIntervalMs = WAKE_RESEND_INTERVAL_MS;
    /** How long an awake car's infotainment may take to finish booting. */
    protected infotainmentBootTimeoutMs = INFOTAINMENT_BOOT_TIMEOUT_MS;
    /** How long a charge-port opening has to show in charge state. */
    protected chargePortVerifyTimeoutMs = CHARGE_PORT_VERIFY_TIMEOUT_MS;
    /** Between charge-state polls. */
    protected chargePortVerifyIntervalMs = CHARGE_PORT_VERIFY_INTERVAL_MS;
    /** Bound on one keepalive read. */
    protected keepaliveTimeoutMs = 2000;

    /** The vehicle's BLE name, with the usual `C` suffix. */
    readonly ble_name: string;
    readonly confirmation: BluetoothConfirmation;
    readonly raise_unconfirmed: boolean;
    wake_if_asleep: boolean;
    readonly keepalive_interval_ms: number | null;
    readonly idle_disconnect_ms: number | null;
    protected readonly transport: BleTransport;
    protected readonly queues: Partial<Record<Domain, ReplyQueue<RoutableMessage>>> = {
        [VCSEC]: new ReplyQueue(),
        [INFOTAINMENT]: new ReplyQueue(),
    };
    private readonly maxConnectAttempts: number;
    private readonly connectTimeoutMs: number;
    private readonly scanTimeoutMs: number;
    private readonly wakeProbeTimeoutMs: number;
    private readonly domainSendLock: Partial<Record<Domain, AsyncLock>> = {
        [VCSEC]: new AsyncLock(),
        [INFOTAINMENT]: new AsyncLock(),
    };
    private readonly connectLock = new AsyncLock();
    private readonly broadcastWatchers: Partial<Record<Domain, BroadcastWatcher>> = {};
    private device: BleDeviceRef | undefined;
    private link: Link | null = null;
    /** Closing a lost link. A new connect waits for it: a late disconnect could end the new link. */
    private teardown: Promise<unknown> = Promise.resolve();
    private keepaliveTimer: ReturnType<typeof setTimeout> | null = null;
    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    /** Caller operations in progress, which an idle close must never cut. */
    private inUse = 0;
    /** When the last caller operation ended, on the monotonic clock. */
    private lastUse = 0;
    /** When GATT traffic last moved, on the monotonic clock. */
    private lastActivity = 0;
    private connected = false;
    private readonly connectionListeners = new ListenerRegistry<boolean>((message) => this.log(message));

    constructor(parent: Vehicle, vin: string, options: VehicleBluetoothOptions) {
        super(parent, vin, options.privateKey);
        const confirmation = options.confirmation ?? "ack";
        if (!["optimistic", "ack", "verify"].includes(confirmation)) {
            throw new Error('confirmation must be one of "optimistic", "ack" or "verify".');
        }
        this.confirmation = confirmation;
        this.raise_unconfirmed = options.raise_unconfirmed ?? false;
        this.transport = options.transport;
        this.device = options.device;
        this.keepalive_interval_ms =
            options.keepalive_interval_ms === undefined ? DEFAULT_KEEPALIVE_INTERVAL_MS : options.keepalive_interval_ms;
        this.idle_disconnect_ms = options.idle_disconnect_ms || null;
        if (this.idle_disconnect_ms !== null && !(Number.isFinite(this.idle_disconnect_ms) && this.idle_disconnect_ms > 0)) {
            throw new RangeError("idle_disconnect_ms must be a positive finite number, or null.");
        }
        this.wake_if_asleep = options.wake_if_asleep ?? true;
        this.maxConnectAttempts = options.max_connect_attempts ?? DEFAULT_CONNECT_ATTEMPTS;
        this.connectTimeoutMs = options.connect_timeout_ms ?? DEFAULT_CONNECT_TIMEOUT_MS;
        this.scanTimeoutMs = options.scan_timeout_ms ?? options.transport.scanTimeoutMs ?? DEFAULT_SCAN_TIMEOUT_MS;
        this.wakeProbeTimeoutMs = options.wake_probe_timeout_ms ?? DEFAULT_WAKE_PROBE_TIMEOUT_MS;
        if (this.wakeProbeTimeoutMs <= 0) {
            throw new RangeError("wake_probe_timeout_ms must be greater than 0.");
        }
        this.ble_name = get_name(vin);
    }

    /** Whether `confirmation` is `"optimistic"`. */
    get optimistic(): boolean {
        return this.confirmation === "optimistic";
    }

    /** Whether `confirmation` is `"verify"`. */
    get verify_commands(): boolean {
        return this.confirmation === "verify";
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
                    await this.teardown;
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
                // The vehicle has three slots, so it must not keep one. This goes
                // through `teardown`, because on a backend with one peripheral the
                // late close would end the next link. It may never land, so the
                // wait is bounded. One that lands later still gets closed.
                const closing = connecting.then(
                    (late) => this.closeConnection(late),
                    () => undefined,
                );
                this.teardown = Promise.all([this.teardown, withTimeout(() => closing, LINK_TEARDOWN_TIMEOUT_MS).catch(() => undefined)]);
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
        this.lastUse = performance.now();
        this.scheduleIdleClose();
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
        this.stopIdleClose();
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

    /** Run a caller operation, holding off an idle close until it ends. */
    private async inUseBy<T>(operation: () => Promise<T>): Promise<T> {
        this.inUse++;
        try {
            return await operation();
        } finally {
            this.inUse--;
            this.lastUse = performance.now();
            this.scheduleIdleClose();
        }
    }

    private stopIdleClose(): void {
        if (this.idleTimer !== null) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    private scheduleIdleClose(): void {
        this.stopIdleClose();
        const idleMs = this.idle_disconnect_ms;
        const link = this.link;
        if (!idleMs || !link || this.inUse > 0) {
            return;
        }
        // A longer delay than a timer can hold would fire at once: wait in steps instead.
        const remaining = Math.min(MAX_TIMER_DELAY_MS, Math.max(0, idleMs - (performance.now() - this.lastUse)));
        this.idleTimer = setTimeout(() => void this.idleClose(link), remaining);
        // An idle link is no reason to hold a process open.
        this.idleTimer.unref?.();
    }

    /** Checked again under the connect lock, so it never closes a link a command has just started on. */
    private async idleClose(link: Link): Promise<void> {
        this.idleTimer = null;
        await this.connectLock.run(async () => {
            if (this.link !== link || this.inUse > 0 || performance.now() - this.lastUse < (this.idle_disconnect_ms ?? 0)) {
                return;
            }
            await this.dropLink("idle");
        });
        if (this.link === link) {
            this.scheduleIdleClose();
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
            // Not `gattRead`: a keepalive is not use, or it would hold the link forever.
            await this.readCharacteristic("version", this.keepaliveTimeoutMs);
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
            this.broadcastWatchers[domain]?.onBroadcast(message);
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
    private writeFrame(link: Link, frame: Uint8Array, signal?: AbortSignal): Promise<void> {
        const { connection } = link;
        const maxWriteSize = connection.maxWriteSize === undefined ? DEFAULT_MAX_WRITE_SIZE : connection.maxWriteSize;
        return link.gatt.run(async () => {
            // Here, past the last wait, and never between chunks: a frame goes whole.
            signal?.throwIfAborted();
            let written = 0;
            for (const chunk of splitFrame(frame, maxWriteSize)) {
                if (link.lost) {
                    throw new BleNotSubmittedError("The link was lost before the frame was fully written.");
                }
                try {
                    await withTimeout(() => connection.write(chunk), GATT_WRITE_TIMEOUT_MS, link.closed.signal);
                } catch (error) {
                    // The car never gets a whole frame, but it is holding part of one,
                    // which would corrupt the next frame on this link.
                    if (error instanceof BleNotSubmittedError && written > 0) {
                        this.loseLink(link, "a frame stopped part way");
                    }
                    throw error;
                }
                written++;
                this.lastActivity = performance.now();
            }
        });
    }

    /**
     * Read a characteristic, bounded. A rejected or timed-out read marks the link
     * lost, whatever `isConnected` says, as that is how a dead link is found on a
     * backend that misreports it. The exception is `BleNotSubmittedError` with the
     * link reported up: no radio I/O happened, and a stack that hides Generic
     * Access rejects those reads that way on a healthy link.
     * @throws BluetoothTransportError when there is no link.
     */
    protected gattRead(characteristic: BleCharacteristic, timeoutMs: number = GATT_READ_TIMEOUT_MS): Promise<Uint8Array> {
        return this.inUseBy(() => this.readCharacteristic(characteristic, timeoutMs));
    }

    private async readCharacteristic(characteristic: BleCharacteristic, timeoutMs: number): Promise<Uint8Array> {
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
                if (!(error instanceof BleNotSubmittedError) || !connection.isConnected) {
                    this.loseLink(link, `read failed: ${describe(error)}`);
                }
                throw error;
            }
        });
    }

    protected _send(msg: RoutableMessage, requires: SendRequires, options: SendOptions = {}): Promise<RoutableMessage> {
        return this.inUseBy(() => this.sendFrame(msg, requires, options));
    }

    private async sendFrame(msg: RoutableMessage, requires: SendRequires, options: SendOptions): Promise<RoutableMessage> {
        const { expectsData = true, optimistic = false, confirmBroadcast, onSubmitted, signal } = options;
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

            const watcher = confirmBroadcast && !optimistic ? this.armBroadcastWatcher(domain, confirmBroadcast) : null;
            const awaitReply = (signal: AbortSignal) => this.awaitReply(queue, msg, requires, expectsData, timeoutMs, signal);
            const awaitOutcome = () =>
                watcher ? this.awaitReplyOrBroadcast(link, watcher, awaitReply) : awaitReply(link.closed.signal);

            try {
                try {
                    await this.writeFrame(link, frame, signal);
                } catch (error) {
                    if (signal?.aborted && error === signal.reason) {
                        throw error;
                    }
                    if (error instanceof BleNotSubmittedError) {
                        if (!link.connection.isConnected) {
                            this.loseLink(link, describe(error));
                        }
                        throw new BluetoothTransportError(null, null, { cause: error });
                    }
                    onSubmitted?.();
                    if (watcher) {
                        watcher.writeEnded = true;
                    }
                    if (optimistic) {
                        this.loseLink(link, `write failed: ${describe(error)}`);
                        throw new BluetoothTimeout(null, null, { cause: error });
                    }
                    // A write that reached the backend may have reached the car. In
                    // field data 2 of 3 such failures had executed. So this counts as
                    // a lost ack, and a reply or broadcast in the rest of the window
                    // still decides.
                    try {
                        return await awaitOutcome();
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

                onSubmitted?.();
                if (watcher) {
                    watcher.writeEnded = true;
                    watcher.writeComplete = true;
                }
                if (optimistic) {
                    return RoutableMessage.create({});
                }
                return await awaitOutcome();
            } finally {
                if (watcher && this.broadcastWatchers[domain] === watcher) {
                    delete this.broadcastWatchers[domain];
                }
            }
        });
    }

    /**
     * Watch for broadcasts showing the requested state. A lost ack does not stop
     * the car broadcasting the change it caused. Only a status after the write
     * counts, as one from before it says nothing.
     */
    private armBroadcastWatcher(domain: Domain, matches: NonNullable<SendOptions["confirmBroadcast"]>): BroadcastWatcher {
        let resolve!: (message: RoutableMessage) => void;
        const confirmed = new Promise<RoutableMessage>((done) => {
            resolve = done;
        });
        const watcher: BroadcastWatcher = {
            confirmed,
            mismatched: false,
            writeEnded: false,
            writeComplete: false,
            onBroadcast: (message) => {
                const status = decodeVcsecStatus(message);
                if (status === null || watcher.confirmation || !watcher.writeEnded) {
                    return;
                }
                const executed = matches(status);
                if (executed) {
                    watcher.confirmation = message;
                    resolve(message);
                } else if (executed === false && watcher.writeComplete) {
                    watcher.mismatched = true;
                }
            },
        };
        this.broadcastWatchers[domain] = watcher;
        return watcher;
    }

    /**
     * Race the addressed reply against a matching broadcast. A mismatch does not
     * fail fast, because it may predate the actuation and a later broadcast can
     * still confirm it. Only a mismatch still standing when the whole window has
     * run out proves the command did not apply, and a lost link cuts the window
     * short, so it proves nothing then.
     */
    private async awaitReplyOrBroadcast(
        link: Link,
        watcher: BroadcastWatcher,
        awaitReply: (signal: AbortSignal) => Promise<RoutableMessage>,
    ): Promise<RoutableMessage> {
        const raceOver = new AbortController();
        const reply = awaitReply(AbortSignal.any([link.closed.signal, raceOver.signal]));
        try {
            const winner = await Promise.race([
                reply.then(
                    () => "reply",
                    () => "reply",
                ),
                watcher.confirmed,
            ]);
            if (winner !== "reply") {
                return winner as RoutableMessage;
            }
            return await reply;
        } catch (error) {
            if (error instanceof BluetoothTimeout) {
                if (watcher.confirmation) {
                    return watcher.confirmation;
                }
                if (watcher.mismatched && !link.lost) {
                    throw new BluetoothCommandFailed(error.data, error.status, { cause: error });
                }
            }
            throw error;
        } finally {
            // The queue has one consumer at a time, so see this one out before `_send` returns.
            raceOver.abort();
            await reply.catch(() => undefined);
        }
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
            if (this.isForeignReply(resp, msg, expectsData)) {
                this.log(`BLE ignored a reply that is not for this request, domain ${resp.fromDestination?.domain}`);
                continue;
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
                if (this.isForeignReply(followup, msg, expectsData)) {
                    this.log(`BLE ignored a reply that is not for this request, domain ${followup.fromDestination?.domain}`);
                    continue;
                }
                this.validate_msg(followup, uuid, domain);
                if (hasRequired(followup)) {
                    return followup;
                }
            }
        }
    }

    /**
     * Whether a reply must be ignored rather than acted on. The link is shared, so
     * an addressed reply can be a late answer to an earlier request, and acting on
     * one can resend a command or report one that never ran.
     *
     * A reply naming another request is never ours. One naming no request must
     * still be heard, because real VCSEC leaves `request_uuid` empty, but nothing
     * ties it to this request unless its session-info tag or its encryption does,
     * and both of those are checked later. So it may ack a command or answer a
     * read, and it may not make anything happen: not a resend or a fault, and a
     * status does not stand in for an actuation's ack.
     */
    private isForeignReply(resp: RoutableMessage, msg: RoutableMessage, expectsData: boolean): boolean {
        if (resp.requestUuid.length > 0) {
            return !Buffer.from(msg.uuid).equals(resp.requestUuid);
        }
        if (msg.sessionInfoRequest || (resp.sessionInfo && resp.sessionInfo.length > 0)) {
            return false;
        }
        const status = resp.signedMessageStatus;
        if (status?.operationStatus === MessageOperationStatusE.OPERATIONSTATUS_WAIT || (status && status.signedMessageFault !== MessageFaultE.MESSAGEFAULT_ERROR_NONE)) {
            return true;
        }
        if (msg.toDestination?.domain !== VCSEC || !resp.protobufMessageAsBytes || resp.signatureData?.AESGCMResponseData) {
            return false;
        }
        try {
            const reply = FromVCSECMessage.decode(resp.protobufMessageAsBytes);
            return reply.commandStatus?.operationStatus === VcsecOperationStatusE.OPERATIONSTATUS_WAIT || (!expectsData && reply.vehicleStatus !== undefined);
        } catch {
            return false;
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

    /**
     * Sign and write a mutating command, with no reply wait. A write that fails
     * provably before submission still raises. One that entered the backend may
     * have reached the car, so even here it must not let a router replay it, and
     * it follows `raise_unconfirmed`.
     */
    private async sendOptimistic(domain: Domain, command: Buffer, name: string): Promise<CommandResponse> {
        const session = this.sessionFor(domain);
        const send = (msg: RoutableMessage) => this._send(msg, "protobuf_message_as_bytes", { optimistic: true });
        try {
            if (domain === VCSEC) {
                // VCSEC needs strict counter order, so the send stays under the lock.
                await session.withLock(() => send(this.buildMessage(session, command)));
            } else {
                await send(await session.withLock(() => this.buildMessage(session, command)));
            }
        } catch (error) {
            if (!(error instanceof BluetoothTimeout)) {
                throw error;
            }
            return this.unconfirmedOutcome(name, new BluetoothUnconfirmedCommand(error.data, error.status, { cause: error }));
        }
        return success();
    }

    /** End a ladder that could not determine what happened. */
    private unconfirmedOutcome(name: string, unconfirmed: BluetoothUnconfirmedCommand): CommandResponse {
        if (this.raise_unconfirmed) {
            throw unconfirmed;
        }
        this.log(`command=${name} transport=${this._transport_name} raise_unconfirmed=False result=success (best-effort)`);
        return success();
    }

    /**
     * Confirm a timed-out command by state, when `"verify"` asks for it.
     * @returns Success, or `null` if the state could not be read. An unreadable car is never woken to verify.
     * @throws BluetoothCommandFailed when the state shows it did not apply, whatever `raise_unconfirmed` says.
     */
    private async verifyTimeout(name: string, plan: VerifyPlan | null, timeout: BluetoothTimeout): Promise<CommandResponse | null> {
        if (this.confirmation !== "verify" || !plan) {
            return null;
        }
        let state: VehicleStatus | ChargeState | MediaState | ClimateState;
        try {
            state = await this[plan.reader]();
        } catch (error) {
            if (error instanceof TeslaFleetError) {
                this.log(`command=${name} transport=${this._transport_name} verify_commands=unresolved`);
                return null;
            }
            throw error;
        }
        const executed = plan.executed(state as never);
        if (executed === undefined) {
            this.log(`command=${name} transport=${this._transport_name} verify_commands=unresolved`);
            return null;
        }
        this.log(`command=${name} transport=${this._transport_name} verify_commands=resolved result=${executed}`);
        if (!executed) {
            throw new BluetoothCommandFailed(timeout.data, timeout.status, { cause: timeout });
        }
        return success();
    }

    /**
     * Open the flap or release a cable. Under `"verify"`, the charging subsystem
     * is made ready first, and only physical state counts as success afterwards:
     * an opening has been reported waking a sleeping car without releasing the
     * latch. No readiness failure has sent anything, so a router may fail over on
     * any of them. Once the one opening write has gone, an unresolved result always
     * raises `BluetoothUnconfirmedCommand`, whatever `raise_unconfirmed` says, and
     * it is never sent again: a best-effort success would hide a latch that never
     * released, and a replay could release a cable the caller had plugged back in.
     * Other modes keep the ordinary VCSEC ladder.
     * @throws BluetoothCommandFailed when the car is asleep with `wake_if_asleep` off, or the cable state is unknown.
     * @throws BluetoothTimeout when the car is not ready in time.
     * @throws BluetoothUnconfirmedCommand when physical state never showed the opening.
     */
    override async charge_port_door_open(): Promise<CommandResponse> {
        if (this.confirmation !== "verify") {
            return super.charge_port_door_open();
        }
        const connected = await this.chargePortPreflight();

        // A good ack and a lost one both go on to physical verification, so this
        // bypasses the ladder. Replies that prove nothing about execution are
        // kept as the cause. Pre-submission failures and explicit car-side
        // rejections stay as they are.
        let cause: unknown;
        let submitted = false;
        try {
            const result = await super.sendVehicleSecurity(
                UnsignedMessage.create({ closureMoveRequest: ClosureMoveRequest.create({ chargePort: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN }) }),
                { onSubmitted: () => (submitted = true) },
            );
            if (result.response.result === false) {
                return result;
            }
        } catch (error) {
            if (!submitted || !leavesOutcomeUnknown(error)) {
                throw error;
            }
            cause = error;
        }
        return this.verifyChargePortOpened(connected, cause);
    }

    /**
     * Everything before the opening, under one `wakeTimeoutMs` deadline.
     * @returns Whether a cable is connected, which picks the proof of success.
     */
    private async chargePortPreflight(): Promise<boolean> {
        const deadline = performance.now() + this.wakeTimeoutMs;
        const over = new AbortController();
        try {
            const connected = await withTimeout(() => this.chargePortReadiness(over.signal), this.wakeTimeoutMs);
            try {
                await withTimeout(() => this.ensureHandshake(VCSEC), deadline - performance.now());
            } catch (error) {
                await this.dropLinkOnFailure("vehicle security handshake failed", error);
                throw error;
            }
            return connected;
        } catch (error) {
            if (error instanceof BleCallTimeout) {
                throw new BluetoothTimeout("Charge-port readiness timed out", null, { cause: error });
            }
            throw error;
        } finally {
            over.abort();
        }
    }

    private async chargePortReadiness(over: AbortSignal): Promise<boolean> {
        if (await this.vehicleAsleep()) {
            if (!this.wake_if_asleep) {
                throw new BluetoothCommandFailed("Vehicle asleep; wake disabled");
            }
            await this.wakeForCommand(new BluetoothTimeout());
        } else {
            // A cached session and VCSEC reporting awake do not prove readiness.
            await this.awaitInfotainment(this.infotainmentBootTimeoutMs, false, over);
        }

        for (;;) {
            try {
                const connected = chargePortConnected(await this.charge_state());
                if (connected === null) {
                    throw new BluetoothCommandFailed("Charge-port cable state unknown; no opening command sent");
                }
                return connected;
            } catch (error) {
                if (error instanceof InvalidResponse) {
                    throw new BluetoothCommandFailed("Charge-port cable state unknown; no opening command sent", null, { cause: error });
                }
                // Infotainment can answer a handshake before it has charge data.
                if (!(error instanceof BluetoothTimeout) || over.aborted) {
                    throw error;
                }
            }
            await sleep(this.chargePortVerifyIntervalMs);
        }
    }

    /**
     * Poll for the physical result, holding to the goal set before the opening:
     * an open flap must never stand in for a latch that did not release. Nothing
     * here may send the opening again, and no failed read may reach a router as
     * anything but unconfirmed.
     */
    private async verifyChargePortOpened(connected: boolean, opening: unknown): Promise<CommandResponse> {
        const name = "closureMoveRequest";
        const log = (message: string) => this.log(message);
        let cause = opening;
        const deadline = performance.now() + this.chargePortVerifyTimeoutMs;
        for (let remaining = this.chargePortVerifyTimeoutMs; remaining > 0; remaining = deadline - performance.now()) {
            try {
                const after = await withTimeout(() => this.charge_state(), remaining);
                const confirmed = connected
                    ? after.chargePortLatch?.Disengaged !== undefined
                    : chargePortConnected(after) === false && after.chargePortDoorOpen === true;
                if (confirmed) {
                    log(`command=${name} transport=${this._transport_name} physical_confirmation=confirmed`);
                    logRequestResult(log, name, this._transport_name, success());
                    return success();
                }
            } catch (error) {
                if (!(error instanceof BleCallTimeout)) {
                    cause = error;
                }
            }
            await sleep(Math.min(this.chargePortVerifyIntervalMs, Math.max(0, deadline - performance.now())));
        }
        const unconfirmed = new BluetoothUnconfirmedCommand("Charge-port opening was not confirmed by physical state", null, { cause });
        log(`command=${name} transport=${this._transport_name} physical_confirmation=unconfirmed`);
        logRequestError(log, name, this._transport_name, unconfirmed);
        throw unconfirmed;
    }

    /**
     * Send a VCSEC actuation through the confirmation ladder. A plan's check also
     * races the ack, so `options` is ignored: the plan is the only source of it.
     */
    protected override async sendVehicleSecurity(
        command: UnsignedMessage,
        _options: Pick<SendOptions, "confirmBroadcast"> = {},
    ): Promise<CommandResponse> {
        try {
            await this.ensureHandshake(VCSEC);
        } catch (error) {
            await this.dropLinkOnFailure("vehicle security handshake failed", error);
            throw error;
        }
        const name = vcsec_command_name(command);
        if (this.confirmation === "optimistic") {
            return this.sendOptimistic(VCSEC, Buffer.from(UnsignedMessage.encode(command).finish()), name);
        }
        const plan = vcsecVerifyPlan(command);
        let submitted = false;
        try {
            return await super.sendVehicleSecurity(command, { confirmBroadcast: plan?.executed, onSubmitted: () => (submitted = true) });
        } catch (error) {
            if (!submitted || !leavesOutcomeUnknown(error)) {
                throw error;
            }
            const unconfirmed = new BluetoothUnconfirmedCommand(null, null, { cause: error });
            return (await this.verifyTimeout(name, plan, unconfirmed)) ?? this.unconfirmedOutcome(name, unconfirmed);
        }
    }

    /**
     * Send an infotainment command through the confirmation ladder. `mutating:
     * false` is exempt: `ping` always waits for its real reply.
     */
    protected override async sendInfotainment(action: Action, { mutating = true }: { mutating?: boolean } = {}): Promise<SignedCommandResponse> {
        return this.infotainmentLadder(action, mutating, this.wake_if_asleep);
    }

    /**
     * A read from infotainment wakes a sleeping car, as a command does. Reads from
     * VCSEC never do, and `vehicle_state` answers while the car sleeps. A read
     * changes nothing, so it is sent again once the car is awake.
     */
    protected override async _getInfotainment(action: Action): Promise<VehicleData> {
        return this.readInfotainment(action, this.wake_if_asleep);
    }

    private async readInfotainment(action: Action, wake: boolean): Promise<VehicleData> {
        wake = await this.readyInfotainment(wake);
        try {
            return await super._getInfotainment(action);
        } catch (error) {
            if (!wake || !(error instanceof BluetoothTimeout) || !(await this.vehicleAsleep())) {
                throw error;
            }
            await this.wakeForCommand(error);
            return this.readInfotainment(action, false);
        }
    }

    /**
     * Make sure infotainment can answer: handshake, waking a sleeping car if
     * `wake` allows, or waiting out a boot.
     * @returns `wake`, or `false` once this has woken the car.
     */
    private async readyInfotainment(wake: boolean): Promise<boolean> {
        try {
            await this.ensureHandshake(INFOTAINMENT);
        } catch (error) {
            if (!(error instanceof BluetoothTimeout)) {
                await this.dropLinkOnFailure("infotainment handshake failed", error);
                throw error;
            }
            const sleepStatus = await this.sleepStatus();
            if (sleepStatus === VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP) {
                // A sleeping car's silent infotainment is expected, and that read
                // proved the link, so it stays. Nothing was sent, so waking is safe.
                if (!wake) {
                    throw error;
                }
                await this.wakeForCommand(error);
                wake = false;
            } else if (sleepStatus === VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE) {
                // VCSEC reports awake seconds before infotainment finishes booting.
                // Retrying wakes nothing, so `wake` has no say here.
                try {
                    await this.awaitInfotainment(this.infotainmentBootTimeoutMs, false);
                } catch (bootError) {
                    if (!(bootError instanceof BluetoothTimeout)) {
                        throw bootError;
                    }
                    await this.dropLink("infotainment handshake failed");
                    throw error;
                }
            } else {
                await this.dropLink("infotainment handshake failed");
                throw error;
            }
        }
        return wake;
    }

    private async infotainmentLadder(action: Action, mutating: boolean, wake: boolean): Promise<SignedCommandResponse> {
        wake = await this.readyInfotainment(wake);

        const name = infotainment_command_name(action);
        if (this.confirmation === "optimistic" && mutating) {
            return this.sendOptimistic(INFOTAINMENT, Buffer.from(Action.encode(action).finish()), name);
        }
        let submitted = false;
        try {
            return await super.sendInfotainment(action, { onSubmitted: () => (submitted = true) });
        } catch (error) {
            if (!mutating || !submitted || !leavesOutcomeUnknown(error)) {
                throw error;
            }
            const unconfirmed = new BluetoothUnconfirmedCommand(null, null, { cause: error });
            const verified = await this.verifyTimeout(name, infotainmentVerifyPlan(action.vehicleAction), unconfirmed);
            if (verified) {
                return verified;
            }
            // Best-effort success would stop a router's cloud fallback, so first ask
            // VCSEC, which answers while asleep, whether this could have run at all.
            if (!this.raise_unconfirmed && (await this.vehicleAsleep())) {
                if (!wake) {
                    throw new BluetoothCommandFailed(null, null, { cause: error });
                }
                await this.wakeForCommand(unconfirmed);
                return this.infotainmentLadder(action, mutating, false);
            }
            return this.unconfirmedOutcome(name, unconfirmed);
        }
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

    private async readVehicleData<K extends keyof VehicleData>(request: Partial<GetVehicleData>, field: K): Promise<NonNullable<VehicleData[K]>> {
        const data = await this._getInfotainment(
            Action.create({ vehicleAction: VehicleAction.create({ getVehicleData: GetVehicleData.create(request) }) }),
        );
        const value = data[field];
        if (value === undefined || value === null) {
            throw new InvalidResponse({ missing: field });
        }
        return value;
    }

    /** The charging state. */
    async charge_state(): Promise<ChargeState> {
        return this.readVehicleData({ getChargeState: GetChargeState.create({}) }, "chargeState");
    }

    /** The HVAC and cabin climate state. */
    async climate_state(): Promise<ClimateState> {
        return this.readVehicleData({ getClimateState: GetClimateState.create({}) }, "climateState");
    }

    /** The driving state, including speed and power. */
    async drive_state(): Promise<DriveState> {
        return this.readVehicleData({ getDriveState: GetDriveState.create({}) }, "driveState");
    }

    /** The vehicle's location. */
    async location_state(): Promise<LocationState> {
        return this.readVehicleData({ getLocationState: GetLocationState.create({}) }, "locationState");
    }

    /** The doors, windows, trunks and locks, as infotainment reports them. */
    async closures_state(): Promise<ClosuresState> {
        return this.readVehicleData({ getClosuresState: GetClosuresState.create({}) }, "closuresState");
    }

    /** The charge schedules. */
    async charge_schedule_state(): Promise<ChargeScheduleState> {
        return this.readVehicleData({ getChargeScheduleState: GetChargeScheduleState.create({}) }, "chargeScheduleState");
    }

    /** The preconditioning schedules. */
    async preconditioning_schedule_state(): Promise<PreconditioningScheduleState> {
        return this.readVehicleData({ getPreconditioningScheduleState: GetPreconditioningScheduleState.create({}) }, "preconditioningScheduleState");
    }

    /** The tire pressures. */
    async tire_pressure_state(): Promise<TirePressureState> {
        return this.readVehicleData({ getTirePressureState: GetTirePressureState.create({}) }, "tirePressureState");
    }

    /** The media playback state. */
    async media_state(): Promise<MediaState> {
        return this.readVehicleData({ getMediaState: GetMediaState.create({}) }, "mediaState");
    }

    /** Detail on the media playing now. */
    async media_detail_state(): Promise<MediaDetailState> {
        return this.readVehicleData({ getMediaDetailState: GetMediaDetailState.create({}) }, "mediaDetailState");
    }

    /** The software update state. */
    async software_update_state(): Promise<SoftwareUpdateState> {
        return this.readVehicleData({ getSoftwareUpdateState: GetSoftwareUpdateState.create({}) }, "softwareUpdateState");
    }

    /** The parental controls state. */
    async parental_controls_state(): Promise<ParentalControlsState> {
        return this.readVehicleData({ getParentalControlsState: GetParentalControlsState.create({}) }, "parentalControlsState");
    }

    /** The display units and formats. */
    async gui_settings(): Promise<GuiSettings> {
        return this.readVehicleData({ getGuiSettings: GetGuiSettings.create({}) }, "guiSettings");
    }

    /** The state of parked accessories, such as a tent. */
    async parked_accessory_state(): Promise<ParkedAccessoryState> {
        return this.readVehicleData({ getParkedAccessoryState: GetParkedAccessoryState.create({}) }, "parkedAccessoryState");
    }

    /**
     * The older infotainment vehicle state, tag 6, for older firmware. Not `current_vehicle_state`, nor VCSEC's `vehicle_state`.
     */
    async legacy_vehicle_state(): Promise<VehicleState> {
        return this.readVehicleData({ getLegacyVehicleState: GetLegacyVehicleState.create({}) }, "legacyVehicleState");
    }

    /**
     * The infotainment vehicle state, tag 18, on current firmware. Not `legacy_vehicle_state`, nor VCSEC's `vehicle_state`.
     */
    async current_vehicle_state(): Promise<CurrentVehicleState> {
        return this.readVehicleData({ getVehicleState: GetVehicleState.create({}) }, "vehicleState");
    }

    /** The vehicle's fixed configuration. */
    async vehicle_config(): Promise<VehicleConfig> {
        return this.readVehicleData({ getVehicleConfig: GetVehicleConfig.create({}) }, "vehicleConfig");
    }

    /** The battery state of health. */
    async soh_state(): Promise<SohState> {
        return this.readVehicleData({ getSohState: GetSohState.create({}) }, "sohState");
    }

    /** The vehicle's name and software details. */
    async vehicle_detail_state(): Promise<VehicleDetailState> {
        return this.readVehicleData({ getVehicleDetailState: GetVehicleDetailState.create({}) }, "vehicleDetailState");
    }

    /** The display state. */
    async display_state(): Promise<DisplayState> {
        return this.readVehicleData({ getDisplayState: GetDisplayState.create({}) }, "displayState");
    }

    /** The active alerts. */
    async alert_state(): Promise<AlertState> {
        return this.readVehicleData({ getAlertState: GetAlertState.create({}) }, "alertState");
    }

    /** The light show state. */
    async light_show_state(): Promise<LightShowState> {
        return this.readVehicleData({ getLightShowState: GetLightShowState.create({}) }, "lightShowState");
    }

    /** The suspension state. */
    async suspension_state(): Promise<SuspensionState> {
        return this.readVehicleData({ getSuspensionState: GetSuspensionState.create({}) }, "suspensionState");
    }

    /** The child presence detection state. */
    async child_presence_detection_state(): Promise<ChildPresenceDetectionState> {
        return this.readVehicleData({ getChildPresenceDetectionState: GetChildPresenceDetectionState.create({}) }, "childPresenceDetectionState");
    }

    /**
     * Several sub-states in one signed read. This is not the cloud method: it
     * takes `BluetoothVehicleData` values, not `VehicleDataEndpoint`, and resolves
     * to `VehicleData`, not a REST envelope. There is no default of every endpoint,
     * because as few as two together have exceeded the response size limit, which
     * raises `TeslaFleetMessageFaultResponseSizeExceedsMTU`. Prefer one reader each.
     * @param endpoints An explicit list. `[]` asks for nothing.
     * @throws BluetoothCloudUnavailableError for anything else, sending nothing: no argument and REST endpoint names are the cloud call, which a router can fail over to.
     */
    override async vehicle_data(endpoints?: BluetoothVehicleData[] | VehicleDataEndpoint[] | string): Promise<any> {
        const known = Object.values(BluetoothVehicleData) as string[];
        if (!Array.isArray(endpoints) || !endpoints.every((endpoint) => known.includes(endpoint))) {
            throw new BluetoothCloudUnavailableError();
        }
        const request: Partial<Record<keyof GetVehicleData, object>> = {};
        for (const endpoint of endpoints) {
            request[`${endpoint[0]!.toLowerCase()}${endpoint.slice(1)}` as keyof GetVehicleData] = {};
        }
        return this._getInfotainment(Action.create({ vehicleAction: VehicleAction.create({ getVehicleData: GetVehicleData.create(request) }) }));
    }

    /**
     * The name set in the vehicle, read from GATT Device Name. It is not advertised.
     * The vehicle prefixes it with a key emoji once it is available.
     * @returns The name, or `null` if it never appeared: a backend may hide Generic Access.
     */
    async query_display_name(max_attempts: number = 5): Promise<string | null> {
        return this.inUseBy(() => this.readDisplayName(max_attempts));
    }

    private async readDisplayName(max_attempts: number): Promise<string | null> {
        for (let attempt = 1; attempt <= max_attempts; attempt++) {
            try {
                await this.connect_if_needed();
                const name = Buffer.from(await this.gattRead("deviceName")).toString("utf8");
                if (name.startsWith(DISPLAY_NAME_PREFIX)) {
                    return name.slice(DISPLAY_NAME_PREFIX.length);
                }
                await sleep(DISPLAY_NAME_RETRY_MS);
            } catch (error) {
                this.log(`BLE display name read failed: ${describe(error)}`);
            }
        }
        return null;
    }

    /** GATT Appearance, or `null` if it cannot be read. */
    async query_appearance(): Promise<Uint8Array | null> {
        return this.inUseBy(() => this.readAppearance());
    }

    private async readAppearance(): Promise<Uint8Array | null> {
        try {
            await this.connect_if_needed();
            return await this.gattRead("appearance");
        } catch (error) {
            this.log(`BLE appearance read failed: ${describe(error)}`);
            return null;
        }
    }

    /** The version characteristic as a big-endian integer, or `null` if it cannot be read. */
    async query_version(): Promise<number | null> {
        return this.inUseBy(() => this.readVersion());
    }

    private async readVersion(): Promise<number | null> {
        try {
            await this.connect_if_needed();
            const version = await this.gattRead("version");
            return version.length === 0 ? null : version.reduce((value, byte) => value * 256 + byte, 0);
        } catch (error) {
            this.log(`BLE version read failed: ${describe(error)}`);
            return null;
        }
    }

    private moveClosure(closure: keyof ClosureMoveRequest, move: ClosureMoveTypeE): Promise<CommandResponse> {
        return this.sendVehicleSecurity(UnsignedMessage.create({ closureMoveRequest: ClosureMoveRequest.create({ [closure]: move } as Partial<ClosureMoveRequest>) }));
    }

    /** Opens the front driver door. */
    async open_front_driver_door(): Promise<CommandResponse> {
        return this.moveClosure("frontDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN);
    }

    /** Closes the front driver door. Doors have no reliable powered close on a Model 3. */
    async close_front_driver_door(): Promise<CommandResponse> {
        return this.moveClosure("frontDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE);
    }

    /** Opens the front passenger door. */
    async open_front_passenger_door(): Promise<CommandResponse> {
        return this.moveClosure("frontPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN);
    }

    /** Closes the front passenger door. Doors have no reliable powered close on a Model 3. */
    async close_front_passenger_door(): Promise<CommandResponse> {
        return this.moveClosure("frontPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE);
    }

    /** Opens the rear driver door. */
    async open_rear_driver_door(): Promise<CommandResponse> {
        return this.moveClosure("rearDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN);
    }

    /** Closes the rear driver door. Doors have no reliable powered close on a Model 3. */
    async close_rear_driver_door(): Promise<CommandResponse> {
        return this.moveClosure("rearDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE);
    }

    /** Opens the rear passenger door. */
    async open_rear_passenger_door(): Promise<CommandResponse> {
        return this.moveClosure("rearPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN);
    }

    /** Closes the rear passenger door. Doors have no reliable powered close on a Model 3. */
    async close_rear_passenger_door(): Promise<CommandResponse> {
        return this.moveClosure("rearPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE);
    }

    /** Opens the rear trunk. */
    async open_rear_trunk(): Promise<CommandResponse> {
        return this.moveClosure("rearTrunk", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN);
    }

    /** Closes the rear trunk. */
    async close_rear_trunk(): Promise<CommandResponse> {
        return this.moveClosure("rearTrunk", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE);
    }

    /**
     * Ask the vehicle to add this instance's key, which someone confirms by tapping
     * a key card on the console. Resolves once the key is on the whitelist.
     *
     * The whitelist operation is written exactly once, because a resend prompts
     * the user again. Its reply is one frame, which a link that cycles during the
     * walk to the car can lose, so completion is also proved by polling: a VCSEC
     * handshake only succeeds once this key is whitelisted, and it reconnects, so
     * the wait survives a dropped link.
     *
     * Success needs positive evidence: an explicit success reply, or an
     * authenticated handshake with this key. Python takes any reply without a
     * whitelist fault, which a WAIT or a bare ack satisfies before the tap.
     *
     * Tesla's Go SDK sends a bare `ToVCSECMessage` here. This wraps the
     * `UnsignedMessage` in a `RoutableMessage`, as Python does, and that has paired
     * a real car. If pairing fails on another vehicle, look there first.
     * @throws RangeError when `pollIntervalMs` is not positive, before anything is sent.
     * @throws SigningDisabled when this instance has no key, before anything is sent.
     * @throws BluetoothTimeout when nothing confirmed it by `timeoutMs`, with the link dropped.
     * @throws WhitelistOperationStatus or a subclass when the vehicle refused the key.
     * @throws The reason of `signal`, once it aborts. The link is kept.
     */
    async pair(options: PairOptions = {}): Promise<void> {
        // Its waits between polls must not read as idle.
        return this.inUseBy(() => this.pairOnce(options));
    }

    private async pairOnce({
        role = Role.ROLE_OWNER,
        form = KeyFormFactor.KEY_FORM_FACTOR_CLOUD_KEY,
        timeoutMs = DEFAULT_PAIR_TIMEOUT_MS,
        pollIntervalMs = DEFAULT_PAIR_POLL_INTERVAL_MS,
        signal,
    }: PairOptions): Promise<void> {
        if (pollIntervalMs <= 0) {
            throw new RangeError("pollIntervalMs must be greater than 0");
        }
        // The handshake's own guard is not on this path.
        if (this.publicKey.length === 0) {
            throw new SigningDisabled();
        }
        signal?.throwIfAborted();

        const request = UnsignedMessage.create({
            WhitelistOperation: WhitelistOperation.fromPartial({
                addKeyToWhitelistAndAddPermissions: { key: { PublicKeyRaw: this.publicKey }, keyRole: role },
                metadataForKey: { keyFormFactor: form },
            }),
        });
        const msg = RoutableMessage.create({
            toDestination: { domain: VCSEC },
            fromDestination: { routingAddress: this.fromDestination },
            protobufMessageAsBytes: UnsignedMessage.encode(request).finish(),
            uuid: crypto.randomBytes(16),
        });

        try {
            await this.confirmPairing(msg, timeoutMs, pollIntervalMs, signal);
        } catch (error) {
            if (!signal?.aborted) {
                await this.dropLinkOnFailure("pairing failed", error);
            }
            throw error;
        }
    }

    private async confirmPairing(msg: RoutableMessage, timeoutMs: number, pollIntervalMs: number, signal?: AbortSignal): Promise<void> {
        const deadline = performance.now() + timeoutMs;

        // Write the operation once and give its reply one interval. A lost reply
        // falls through to polling, never to a resend.
        try {
            const send = this._send(msg, "protobuf_message_as_bytes", {
                timeoutMs: Math.max(0, Math.min(pollIntervalMs, deadline - performance.now())),
                signal,
            });
            if (this.whitelistReplyConfirms(await abortable(send, signal))) {
                return;
            }
        } catch (error) {
            if (!(error instanceof BluetoothTimeout)) {
                throw error;
            }
        }

        const confirmed = async () => this.consumeLateWhitelistReply() || (await abortable(this.pairProbe(signal), signal));
        while (performance.now() < deadline) {
            signal?.throwIfAborted();
            if (await confirmed()) {
                return;
            }
            const remaining = deadline - performance.now();
            if (remaining <= 0) {
                break;
            }
            await sleep(Math.min(pollIntervalMs, remaining), signal);
        }
        signal?.throwIfAborted();
        if (await confirmed()) {
            return;
        }
        throw new BluetoothTimeout();
    }

    /**
     * Whether this key is on the whitelist: a VCSEC handshake only completes once
     * it is. Any failure means "not yet", so polling carries on across a dropped
     * link. It sends one request, unlike `handshake`, because the next poll is the
     * retry, and nothing may be written after a `pair` is aborted.
     */
    private async pairProbe(signal?: AbortSignal): Promise<boolean> {
        const session = this.sessionFor(VCSEC);
        try {
            return await session.withLock(async () => {
                // `_send` also returns a bare ack, and a session can be ready from
                // before, so only a reply that carried session info counts. That
                // one passed `validate_msg`, so its tag proved this key.
                const reply = await this._send(this.sessionInfoRequest(VCSEC), "session_info", { signal });
                return session.ready && (reply.sessionInfo?.length ?? 0) > 0;
            });
        } catch (error) {
            if (error instanceof TeslaFleetError) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Look for a whitelist reply that arrived after `_send` stopped waiting. This
     * must run before a probe, whose `_send` discards what is queued. Anything else
     * in the queue stays there.
     * @returns Whether one was there and explicitly reported success.
     * @throws WhitelistOperationStatus or a subclass when it reported a refusal.
     */
    private consumeLateWhitelistReply(): boolean {
        const queue = this.queues[VCSEC]!;
        let reply: RoutableMessage | undefined;
        for (const queued of queue.drain()) {
            if (reply === undefined && isWhitelistReply(queued)) {
                reply = queued;
            } else {
                queue.push(queued);
            }
        }
        return reply !== undefined && this.whitelistReplyConfirms(reply);
    }

    /**
     * Whether a reply to the whitelist operation says the key was added. Only an
     * OK with a whitelist status and no failure does. A WAIT means the car is
     * still waiting for the tap, and a bare ack, a status or anything else says
     * nothing, so `pair` goes on polling.
     * @throws WhitelistOperationStatus or a subclass when the reply is a refusal.
     */
    private whitelistReplyConfirms(reply: RoutableMessage): boolean {
        let message: FromVCSECMessage;
        try {
            message = FromVCSECMessage.decode(reply.protobufMessageAsBytes ?? new Uint8Array());
        } catch {
            return false;
        }
        const whitelist = message.commandStatus?.whitelistOperationStatus;
        this.raiseWhitelistFault(whitelist?.whitelistOperationInformation);
        const { OPERATIONSTATUS_ERROR, OPERATIONSTATUS_OK } = VcsecOperationStatusE;
        if (message.nominalError || message.commandStatus?.operationStatus === OPERATIONSTATUS_ERROR || whitelist?.operationStatus === OPERATIONSTATUS_ERROR) {
            throw new WhitelistOperationStatus("The vehicle refused the whitelist operation.");
        }
        return message.commandStatus?.operationStatus === OPERATIONSTATUS_OK && whitelist?.operationStatus === OPERATIONSTATUS_OK;
    }

    /**
     * Wake the vehicle. Takes `VehicleSpecific`'s options, but resolves to a
     * `CommandResponse`, not the REST `VehicleResponse`.
     *
     * Without `wait`, this sends the RKE wake to the vehicle security computer,
     * which acks well before infotainment can answer, so an infotainment command
     * sent straight after can still time out.
     *
     * With `wait`, it blocks until infotainment completes a fresh handshake, the
     * only proof it can take commands: VCSEC reports awake seconds before that.
     * The wake is idempotent, so it is resent every 3 s until then.
     * @param options.timeoutMs Deadline for `wait`, in milliseconds. Defaults to 30000.
     * @throws BluetoothTimeout at the deadline, with the link dropped.
     */
    override async wake_up(options: WakeUpOptions = {}): Promise<any> {
        // Its waits between polls must not read as idle.
        return this.inUseBy(() => this.wakeUpOnce(options));
    }

    private async wakeUpOnce({ wait = false, timeoutMs = DEFAULT_WAKE_TIMEOUT_MS }: WakeUpOptions): Promise<any> {
        if (!wait) {
            return this.sendVehicleSecurity(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_WAKE_VEHICLE }));
        }
        try {
            await this.awaitInfotainment(timeoutMs, true);
        } catch (error) {
            await this.dropLinkOnFailure("wake failed", error);
            throw error;
        }
        return success();
    }

    /**
     * Probe infotainment until it answers. With `wake`, the RKE wake is sent
     * first and resent every `wakeResendIntervalMs`.
     * @param over Stops the probing, for a caller that has stopped waiting.
     * @throws BluetoothTimeout at the deadline.
     */
    protected async awaitInfotainment(timeoutMs: number, wake: boolean, over?: AbortSignal): Promise<void> {
        const deadline = performance.now() + timeoutMs;
        let nextWake = performance.now();
        for (;;) {
            if (wake && performance.now() >= nextWake) {
                try {
                    await this.wake_up();
                } catch (error) {
                    // An unconfirmed wake may still have landed. The probe decides.
                    if (!(error instanceof BluetoothTimeout)) {
                        throw error;
                    }
                }
                nextWake = performance.now() + this.wakeResendIntervalMs;
            }
            const remaining = deadline - performance.now();
            if (remaining <= 0 || over?.aborted) {
                throw new BluetoothTimeout();
            }
            try {
                await this.probeInfotainment(Math.min(this.wakeProbeTimeoutMs, remaining));
                return;
            } catch (error) {
                // A reply to the probe before this one fails this probe's challenge.
                // It is discarded, never trusted, and the next probe asks again.
                if (!(error instanceof BluetoothTimeout || error instanceof SessionInfoAuthenticationFault)) {
                    throw error;
                }
            }
        }
    }

    /**
     * Handshake with infotainment, always with a fresh request: only a live reply
     * proves it is awake, so a cached session counts for nothing.
     */
    private async probeInfotainment(timeoutMs: number): Promise<void> {
        if (this.publicKey.length === 0) {
            throw new SigningDisabled();
        }
        await this._send(this.sessionInfoRequest(INFOTAINMENT), "session_info", { timeoutMs });
        if (!this.sessionFor(INFOTAINMENT).ready) {
            throw new BluetoothTimeout();
        }
    }
}

function isWhitelistReply(reply: RoutableMessage): boolean {
    try {
        return FromVCSECMessage.decode(reply.protobufMessageAsBytes ?? new Uint8Array()).commandStatus?.whitelistOperationStatus !== undefined;
    } catch {
        return false;
    }
}

/**
 * Whether a failure after a write says nothing about whether the command ran.
 * Only a car-side refusal rules that out, as the only `TeslaFleetError`s not
 * listed here are. A silent, unauthenticated, replayed or undecodable reply
 * proves nothing, a key fault may be a stale reply, a reply too big for the MTU
 * can follow execution, and a transport failure now belongs to a resend, after
 * the first frame was written. A router fails over on several of these, which is
 * right before a write and a double execution after one, so the ladders turn all
 * of them into an unresolved outcome first.
 */
function leavesOutcomeUnknown(error: unknown): boolean {
    return (
        !(error instanceof TeslaFleetError) ||
        error instanceof BluetoothTimeout ||
        error instanceof BluetoothTransportError ||
        error instanceof NotOnWhitelistFault ||
        error instanceof SessionInfoAuthenticationFault ||
        error instanceof SignedCommandResponseReplayed ||
        error instanceof TeslaFleetMessageFaultResponseSizeExceedsMTU
    );
}

/** An error's class and message, for a log line. */
function describe(error: unknown): string {
    return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
