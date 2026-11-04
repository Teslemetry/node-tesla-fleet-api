// `tesla-fleet-api/bluetooth/homey`: a `BleTransport` over a Homey app's `this.homey.ble`.
//
// Built on structural types, so the library has no `homey` dependency and this
// file loads anywhere. It follows what the BLE-00 probe app does on a real Homey
// (`probe/ble-hw0/app.js` in Teslemetry/homey), not only what the SDK types allow:
// UUIDs in compact form, characteristics discovered with no filter and matched by
// normalized UUID. HW-0 ran it on a Homey Pro on 2026-11-03, and
// its measured values are the named constants below.
import { withTimeout } from "../async.js";
import { APPEARANCE_UUID, DEFAULT_CONNECT_TIMEOUT_MS, GENERIC_ACCESS_UUID, NAME_UUID, SERVICE_UUID, VEHICLE_NOTIFY_UUID, VEHICLE_WRITE_UUID, VERSION_UUID } from "../constants.js";
import { BleCharacteristic, BleConnection, BleDeviceRef, BleLinkHandlers, BleNotSubmittedError, BleScanOptions, BleTransport } from "../transport.js";
import { compactUuid, LinkClaims, quietly } from "./shared.js";

/**
 * Bytes per write: `null`, a whole frame in one write. Homey hides the MTU.
 * BLE-00 (HW-0, 2026-11-03) measured a 114-byte frame in one write at 232 ms to
 * a reply, against 562 ms for 6 writes of 20 bytes. HW-5 (2026-11-03) sent signed
 * frames up to 195 bytes in one write each. Pass `maxWriteSize: 20` to
 * `HomeyBleTransport` to chunk at the ATT minimum.
 */
export const HOMEY_MAX_WRITE_SIZE = null;

/**
 * Bound on one scan. `discover()` takes a fixed 10.04 s when it is not cached
 * (HW-0), so the library's 10 s default would time out about 40 ms early.
 * `VehicleBluetooth` uses this when `scan_timeout_ms` is not set.
 */
export const HOMEY_SCAN_TIMEOUT_MS = 15_000;

/**
 * For `connect_timeout_ms`, `max_connect_attempts` and `idle_disconnect_ms`, not
 * applied by this adapter. A Homey app connects per command, so a link closes
 * 30 s after its last use rather than hold one of the vehicle's slots. `ble.find` runs its own 10 s discovery once the 30 s cache has
 * expired, so a connect with no recent scan takes about 12 s (measured 12.05 to
 * 12.36 s, against 1.5 to 2.3 s warm), and a shorter bound fails every one.
 * One attempt: `discover()` caches for 30 s, so a fast retry sees old data.
 */
export const HOMEY_VEHICLE_OPTIONS = { connect_timeout_ms: 15_000, max_connect_attempts: 1, idle_disconnect_ms: 30_000 } as const;

/**
 * Bound on discovery and subscribing once a link is up. Homey has no timeout of
 * its own, and if these hang, nothing else could release the vehicle's slot.
 * BLE-00 steps 3 and 4 show what a slow link takes.
 */
export const HOMEY_SETUP_TIMEOUT_MS = DEFAULT_CONNECT_TIMEOUT_MS;

/** Bound on unsubscribing, which must not keep `disconnect` from running on a dead link. BLE-00 step 10. */
export const HOMEY_UNSUBSCRIBE_TIMEOUT_MS = 1000;

export interface HomeyCharacteristicLike {
    uuid: string;
    read(): Promise<Buffer>;
    /** Always a write with response: the only kind Homey offers. */
    write(data: Buffer): Promise<unknown>;
    subscribeToNotifications(callback: (data: Buffer) => void): Promise<void>;
    unsubscribeFromNotifications(): Promise<void>;
}

export interface HomeyServiceLike {
    discoverCharacteristics(): Promise<HomeyCharacteristicLike[]>;
}

export interface HomeyPeripheralLike {
    /** Can stay true after a silent drop, so it is only ever a faster signal. BLE-00 step 9 measures it. */
    readonly isConnected: boolean;
    getService(uuid: string): Promise<HomeyServiceLike>;
    disconnect(): Promise<void>;
    /** Not guaranteed on every drop, but if it fires, the link is gone. BLE-00 step 9 measures it. */
    once(event: "disconnect", listener: () => void): unknown;
    removeListener(event: "disconnect", listener: () => void): unknown;
}

export interface HomeyAdvertisementLike {
    uuid: string;
    /** Typed as a string, but Homey's guide says it is optional. BLE-00 step 2 measures how often it is there. */
    localName?: string;
    rssi?: number;
    connectable?: boolean;
    /** If already connected, returns the existing connection. It has no timeout: the library bounds it. */
    connect(): Promise<HomeyPeripheralLike>;
}

/** What this adapter needs of `this.homey.ble`. */
export interface HomeyBleManagerLike {
    /** About 10 s, fixed, when not cached (BLE-00 HW-0). Called with no filter, because the vehicle advertises no service. */
    discover(): Promise<HomeyAdvertisementLike[]>;
    find(uuid: string): Promise<HomeyAdvertisementLike>;
}

export interface HomeyBleTransportOptions {
    /** Bytes per write, or `null` for a whole frame in one write. Defaults to `HOMEY_MAX_WRITE_SIZE`. */
    maxWriteSize?: number | null;
}

function find(characteristics: HomeyCharacteristicLike[], uuid: string): HomeyCharacteristicLike | undefined {
    return characteristics.find((characteristic) => compactUuid(characteristic.uuid) === compactUuid(uuid));
}

class HomeyConnection implements BleConnection {
    private lost = false;
    private closed = false;
    private closing: Promise<void> | undefined;
    private peripheral: HomeyPeripheralLike | undefined;
    private characteristics: HomeyCharacteristicLike[] = [];
    private genericAccess: Promise<HomeyCharacteristicLike[]> | undefined;
    private subscribed = false;

    private readonly onDisconnect = (): void => {
        this.lost = true;
        if (!this.closed) {
            this.handlers.onDisconnect();
        }
    };

    constructor(
        private readonly id: string,
        private readonly handlers: BleLinkHandlers,
        readonly maxWriteSize: number | null,
        private readonly claims: LinkClaims<HomeyConnection>,
    ) {}

    /** Stale after a silent drop. The library's timeouts are what find a dead link. */
    get isConnected(): boolean {
        return !this.lost && !this.closed && this.peripheral?.isConnected === true;
    }

    /** Discover, then subscribe: the link is live only once this resolves. */
    async attach(peripheral: HomeyPeripheralLike): Promise<void> {
        // First, so that `disconnect` can close it if the attempt that replaced this one has gone.
        this.peripheral = peripheral;
        this.assertCurrent();
        peripheral.once("disconnect", this.onDisconnect);

        const service = await peripheral.getService(compactUuid(SERVICE_UUID));
        const characteristics = await service.discoverCharacteristics();
        const notify = find(characteristics, VEHICLE_NOTIFY_UUID);
        if (!notify || !find(characteristics, VEHICLE_WRITE_UUID)) {
            throw new Error("The vehicle's write or notify characteristic was not found.");
        }
        this.assertCurrent();
        this.characteristics = characteristics;
        await notify.subscribeToNotifications((data) => this.handlers.onNotify(data));
        this.subscribed = true;
    }

    /**
     * Homey hands every attempt the same link, and one subscription per
     * characteristic. A superseded attempt stops here, before it changes either.
     */
    private assertCurrent(): void {
        if (this.claims.superseded(this.id, this)) {
            throw new Error("A newer connect attempt took over this link.");
        }
    }

    async write(data: Uint8Array): Promise<void> {
        const characteristic = find(this.characteristics, VEHICLE_WRITE_UUID);
        if (!characteristic) {
            throw new BleNotSubmittedError("The vehicle write characteristic was not found.");
        }
        if (!this.isConnected) {
            throw new BleNotSubmittedError("The link is down.");
        }
        await characteristic.write(Buffer.from(data));
    }

    async read(characteristic: BleCharacteristic): Promise<Uint8Array> {
        const target =
            characteristic === "version"
                ? find(this.characteristics, VERSION_UUID)
                : find(await this.discoverGenericAccess(), characteristic === "deviceName" ? NAME_UUID : APPEARANCE_UUID);
        if (!target) {
            throw new BleNotSubmittedError(`The ${characteristic} characteristic was not found.`);
        }
        return target.read();
    }

    /**
     * Homey's stack may hide this service, which BLE-00 step 8 settles. A failed
     * lookup leaves a characteristic unresolved on a healthy link, so it must not
     * read as a lost one.
     */
    private discoverGenericAccess(): Promise<HomeyCharacteristicLike[]> {
        const { peripheral } = this;
        if (!peripheral) {
            return Promise.reject(new BleNotSubmittedError("The link is down."));
        }
        this.genericAccess ??= peripheral
            .getService(compactUuid(GENERIC_ACCESS_UUID))
            .then((service) => service.discoverCharacteristics())
            .catch((cause: unknown) => {
                // It may do better next time.
                this.genericAccess = undefined;
                throw new BleNotSubmittedError("Generic Access could not be resolved.", { cause });
            });
        return this.genericAccess;
    }

    disconnect(): Promise<void> {
        this.closing ??= (async () => {
            this.closed = true;
            const { peripheral, claims, id } = this;
            peripheral?.removeListener("disconnect", this.onDisconnect);
            const superseded = claims.superseded(id, this);
            claims.release(id, this);
            if (superseded || !peripheral) {
                return;
            }
            // `connect()` can return this same link later, so leave no old subscription on it.
            if (this.subscribed) {
                await quietly(() =>
                    withTimeout(() => find(this.characteristics, VEHICLE_NOTIFY_UUID)!.unsubscribeFromNotifications(), HOMEY_UNSUBSCRIBE_TIMEOUT_MS),
                );
            }
            await quietly(() => peripheral.disconnect());
        })();
        return this.closing;
    }
}

export class HomeyBleTransport implements BleTransport {
    private readonly maxWriteSize: number | null;
    private readonly claims = new LinkClaims<HomeyConnection>();
    readonly scanTimeoutMs = HOMEY_SCAN_TIMEOUT_MS;

    /** @param ble `this.homey.ble`. The app needs the `homey:wireless:ble` permission. */
    constructor(
        private readonly ble: HomeyBleManagerLike,
        options: HomeyBleTransportOptions = {},
    ) {
        // `undefined` only: `null` is a real choice, one write per frame.
        this.maxWriteSize = options.maxWriteSize === undefined ? HOMEY_MAX_WRITE_SIZE : options.maxWriteSize;
    }

    /** Takes Homey's fixed window, whatever `timeoutMs` says. Never pass `discover` a filter. */
    async scan({ matches }: BleScanOptions): Promise<BleDeviceRef[]> {
        const advertisements = await this.ble.discover();
        return advertisements
            .filter((advertisement) => !matches || (advertisement.localName !== undefined && matches(advertisement.localName)))
            .map((advertisement) => ({
                id: advertisement.uuid,
                name: advertisement.localName,
                rssi: advertisement.rssi,
                connectable: advertisement.connectable,
            }));
    }

    async connect(device: BleDeviceRef, handlers: BleLinkHandlers): Promise<BleConnection> {
        const connection = new HomeyConnection(device.id, handlers, this.maxWriteSize, this.claims);
        this.claims.claim(device.id, connection);
        try {
            const advertisement = await this.ble.find(device.id);
            const peripheral = await advertisement.connect();
            await withTimeout(() => connection.attach(peripheral), HOMEY_SETUP_TIMEOUT_MS);
        } catch (error) {
            await connection.disconnect();
            throw error;
        }
        return connection;
    }
}
