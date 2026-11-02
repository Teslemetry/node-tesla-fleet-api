// `tesla-fleet-api/bluetooth/noble`: a `BleTransport` over `@stoprocent/noble`.
//
// noble has native bindings, so this file never imports it at load time. Pass a
// backend in, or install `@stoprocent/noble` and it loads on first use. It cannot
// run on Homey, where native modules are barred.
import { AsyncLock, withTimeout } from "../async.js";
import {
    APPEARANCE_UUID,
    DEFAULT_CONNECT_TIMEOUT_MS,
    DEFAULT_MAX_WRITE_SIZE,
    DEFAULT_SCAN_TIMEOUT_MS,
    GENERIC_ACCESS_UUID,
    NAME_UUID,
    SERVICE_UUID,
    VEHICLE_NOTIFY_UUID,
    VEHICLE_WRITE_UUID,
    VERSION_UUID,
} from "../constants.js";
import { BleCharacteristic, BleConnection, BleDeviceRef, BleLinkHandlers, BleNotSubmittedError, BleScanOptions, BleTransport } from "../transport.js";
import { compactUuid, LinkClaims, quietly, SCAN_END_MARGIN_MS } from "./shared.js";

export interface NobleCharacteristicLike {
    uuid: string;
    on(event: "data", listener: (data: Buffer, isNotification?: boolean) => void): unknown;
    removeListener(event: "data", listener: (data: Buffer, isNotification?: boolean) => void): unknown;
    subscribeAsync(): Promise<void>;
    /** `withoutResponse: false` is a write with response. */
    writeAsync(data: Buffer, withoutResponse: boolean): Promise<void>;
    readAsync(): Promise<Buffer>;
}

export interface NoblePeripheralLike {
    id: string;
    state: string;
    mtu: number | null;
    rssi?: number;
    connectable?: boolean;
    advertisement: { localName?: string };
    connectAsync(): Promise<void>;
    disconnectAsync(): Promise<void>;
    discoverSomeServicesAndCharacteristicsAsync(
        serviceUUIDs: string[],
        characteristicUUIDs: string[],
    ): Promise<{ characteristics: NobleCharacteristicLike[] }>;
    once(event: "disconnect", listener: () => void): unknown;
    removeListener(event: "disconnect", listener: () => void): unknown;
}

export interface NobleLike {
    waitForPoweredOnAsync(timeout?: number): Promise<void>;
    startScanningAsync(serviceUUIDs?: string[], allowDuplicates?: boolean): Promise<void>;
    stopScanningAsync(): Promise<void>;
    on(event: "discover", listener: (peripheral: NoblePeripheralLike) => void): unknown;
    removeListener(event: "discover", listener: (peripheral: NoblePeripheralLike) => void): unknown;
}

export interface NobleBleTransportOptions {
    /** A noble you built, such as `withBindings("dbus")`. Without it, `@stoprocent/noble` loads on first use. */
    noble?: NobleLike;
    /**
     * Which bindings to load. Defaults to `"dbus"` on Linux, which shares the
     * adapter with BlueZ and needs no root but does need `dbus-next`, and to
     * `"default"` elsewhere. `"hci"` needs `sudo setcap cap_net_raw+eip` on the
     * Node binary.
     */
    bindings?: "default" | "dbus" | "hci" | "mac" | "win";
}

function find(characteristics: NobleCharacteristicLike[], uuid: string): NobleCharacteristicLike | undefined {
    return characteristics.find((characteristic) => compactUuid(characteristic.uuid) === compactUuid(uuid));
}

async function loadNoble(bindings: NonNullable<NobleBleTransportOptions["bindings"]>): Promise<NobleLike> {
    // The package's own entry builds a default noble as it loads, which would hold
    // the adapter, or fail on Linux with no HCI socket, before `bindings` applied.
    // A computed name keeps bundlers and `tsc` from needing the package.
    const specifier = "@stoprocent/noble/lib/resolve-bindings.js";
    let module: { default: (bindings: string) => NobleLike };
    try {
        module = await import(specifier);
    } catch (cause) {
        throw new Error("NobleBleTransport needs @stoprocent/noble, or a `noble` option.", { cause });
    }
    return module.default(bindings);
}

class NobleConnection implements BleConnection {
    private lost = false;
    private closed = false;
    private closing: Promise<void> | undefined;
    private genericAccess: Promise<NobleCharacteristicLike[]> | undefined;
    private characteristics: NobleCharacteristicLike[] = [];

    readonly onData = (data: Buffer, isNotification?: boolean): void => {
        // A read of this characteristic emits `data` too. Only a notification counts.
        if (isNotification !== false) {
            this.handlers.onNotify(data);
        }
    };

    readonly onDisconnect = (): void => {
        this.lost = true;
        if (!this.closed) {
            this.handlers.onDisconnect();
        }
    };

    constructor(
        private readonly peripheral: NoblePeripheralLike,
        private readonly handlers: BleLinkHandlers,
        private readonly claims: LinkClaims<NobleConnection>,
    ) {}

    get isConnected(): boolean {
        return !this.lost && !this.closed && this.peripheral.state === "connected";
    }

    /** Read each time: noble can report a larger MTU after the link is up. */
    get maxWriteSize(): number {
        const { mtu } = this.peripheral;
        return mtu && mtu > 3 ? mtu - 3 : DEFAULT_MAX_WRITE_SIZE;
    }

    /** Resolve the characteristics and turn notifications on. */
    async subscribe(): Promise<void> {
        const { peripheral } = this;
        const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
            [compactUuid(SERVICE_UUID)],
            [VEHICLE_WRITE_UUID, VEHICLE_NOTIFY_UUID, VERSION_UUID].map(compactUuid),
        );
        const notify = find(characteristics, VEHICLE_NOTIFY_UUID);
        if (!notify || !find(characteristics, VEHICLE_WRITE_UUID)) {
            throw new Error("The vehicle's write or notify characteristic was not found.");
        }
        this.assertCurrent();
        this.characteristics = characteristics;
        notify.on("data", this.onData);
        await notify.subscribeAsync();
    }

    /** A superseded attempt stops here, before it changes a link another attempt owns. */
    assertCurrent(): void {
        if (this.claims.superseded(this.peripheral.id, this)) {
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
        await characteristic.writeAsync(Buffer.from(data), false);
    }

    async read(characteristic: BleCharacteristic): Promise<Uint8Array> {
        const target =
            characteristic === "version"
                ? find(this.characteristics, VERSION_UUID)
                : find(await this.discoverGenericAccess(), characteristic === "deviceName" ? NAME_UUID : APPEARANCE_UUID);
        if (!target) {
            throw new BleNotSubmittedError(`The ${characteristic} characteristic was not found.`);
        }
        return target.readAsync();
    }

    /** BlueZ and CoreBluetooth can hide this service. Then the read fails, and the library reports no value. */
    private discoverGenericAccess(): Promise<NobleCharacteristicLike[]> {
        const discovery = (this.genericAccess ??= this.peripheral
            .discoverSomeServicesAndCharacteristicsAsync([compactUuid(GENERIC_ACCESS_UUID)], [compactUuid(NAME_UUID), compactUuid(APPEARANCE_UUID)])
            .then(({ characteristics }) => characteristics));
        // A failed lookup may do better next time.
        discovery.catch(() => {
            this.genericAccess = undefined;
        });
        return discovery;
    }

    disconnect(): Promise<void> {
        this.closing ??= (async () => {
            this.closed = true;
            const { peripheral, claims } = this;
            peripheral.removeListener("disconnect", this.onDisconnect);
            find(this.characteristics, VEHICLE_NOTIFY_UUID)?.removeListener("data", this.onData);
            const superseded = claims.superseded(peripheral.id, this);
            claims.release(peripheral.id, this);
            // noble waits for a disconnect event, which a dead link never sends.
            if (!superseded && peripheral.state !== "disconnected") {
                await quietly(() => peripheral.disconnectAsync());
            }
        })();
        return this.closing;
    }
}

export class NobleBleTransport implements BleTransport {
    private backend: Promise<NobleLike> | undefined;
    private readonly scans = new AsyncLock();
    private readonly peripherals = new Map<string, NoblePeripheralLike>();
    private readonly claims = new LinkClaims<NobleConnection>();

    constructor(private readonly options: NobleBleTransportOptions = {}) {}

    private noble(): Promise<NobleLike> {
        if (this.options.noble) {
            return Promise.resolve(this.options.noble);
        }
        const fallback = process.platform === "linux" ? "dbus" : "default";
        const loading = (this.backend ??= loadNoble(this.options.bindings ?? fallback));
        loading.catch(() => {
            this.backend = undefined;
        });
        return loading;
    }

    async scan({ timeoutMs, matches }: BleScanOptions): Promise<BleDeviceRef[]> {
        const noble = await this.noble();
        return this.listen(noble, timeoutMs, (device) => device.name !== undefined && matches?.(device.name) === true);
    }

    /** Scan with no service filter until `done` accepts a device or the window ends. */
    private listen(noble: NobleLike, timeoutMs: number, done: (device: BleDeviceRef) => boolean): Promise<BleDeviceRef[]> {
        // One scan at a time: stopping one would end any other.
        return this.scans.run(async () => {
            await noble.waitForPoweredOnAsync(timeoutMs);
            const seen = new Map<string, BleDeviceRef>();
            let finish!: () => void;
            const finished = new Promise<void>((resolve) => {
                finish = resolve;
            });
            const onDiscover = (peripheral: NoblePeripheralLike) => {
                this.peripherals.set(peripheral.id, peripheral);
                const device: BleDeviceRef = {
                    id: peripheral.id,
                    // The name comes in the scan response, so an earlier event may lack it.
                    name: peripheral.advertisement.localName ?? seen.get(peripheral.id)?.name,
                    rssi: peripheral.rssi,
                    connectable: peripheral.connectable,
                };
                seen.set(peripheral.id, device);
                if (done(device)) {
                    finish();
                }
            };
            noble.on("discover", onDiscover);
            const timer = setTimeout(finish, Math.max(0, timeoutMs - SCAN_END_MARGIN_MS));
            try {
                await noble.startScanningAsync([], true);
                await finished;
            } finally {
                clearTimeout(timer);
                noble.removeListener("discover", onDiscover);
                await quietly(() => noble.stopScanningAsync());
            }
            return [...seen.values()];
        });
    }

    async connect(device: BleDeviceRef, handlers: BleLinkHandlers): Promise<BleConnection> {
        const noble = await this.noble();
        if (!this.peripherals.has(device.id)) {
            // noble can only connect to what it has seen, as with a `device` saved by an earlier run.
            await this.listen(noble, DEFAULT_SCAN_TIMEOUT_MS, ({ id }) => id === device.id);
        }
        const peripheral = this.peripherals.get(device.id);
        if (!peripheral) {
            throw new Error("The device was not seen in a scan.");
        }
        // The Linux HCI binding stops scanning to connect anyway. Do it on every platform.
        await quietly(() => noble.stopScanningAsync());

        const connection = new NobleConnection(peripheral, handlers, this.claims);
        this.claims.claim(device.id, connection);
        peripheral.once("disconnect", connection.onDisconnect);
        try {
            await peripheral.connectAsync();
            connection.assertCurrent();
            // noble has no timeout, and nothing can reach this link once the library gives up on it.
            await withTimeout(() => connection.subscribe(), DEFAULT_CONNECT_TIMEOUT_MS);
        } catch (error) {
            await connection.disconnect();
            throw error;
        }
        return connection;
    }
}
