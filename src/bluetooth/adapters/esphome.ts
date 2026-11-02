// `tesla-fleet-api/bluetooth/esphome`: a `BleTransport` through an ESPHome
// Bluetooth proxy, over `@2colors/esphome-native-api`.
//
// That package never loads unless this adapter builds the connection itself. It
// has not been run against a Tesla. Its sharp edges shape this file:
//
// - It matches a reply by message type alone, so everything that waits for one
//   goes through one queue per proxy, not per link, and each reply's address and
//   handle are checked as well. Two vehicles on one proxy cannot cross replies.
// - It ignores `BluetoothGATTErrorResponse`, so a GATT error looks like a
//   timeout. A plain error is the safe reading: the write may have run.
// - `response` defaults to false on a write. Always pass true.
// - It always connects with a V3 request, and on V3 the proxy leaves the CCCD to
//   the client. Without the `01 00` write, no notification ever arrives.
// - `read` and notification `data` arrive base64 encoded.
//
// A proxy serves advertisements to one client. If Home Assistant holds it, a scan
// sees nothing and reports no error, so use a dedicated proxy.
import { AsyncLock, withTimeout } from "../async.js";
import {
    APPEARANCE_UUID,
    CCCD_UUID,
    DEFAULT_MAX_WRITE_SIZE,
    DEFAULT_SCAN_TIMEOUT_MS,
    GATT_WRITE_TIMEOUT_MS,
    GENERIC_ACCESS_UUID,
    NAME_UUID,
    SERVICE_UUID,
    VEHICLE_NOTIFY_UUID,
    VEHICLE_WRITE_UUID,
    VERSION_UUID,
} from "../constants.js";
import { BleCharacteristic, BleConnection, BleDeviceRef, BleLinkHandlers, BleNotSubmittedError, BleScanOptions, BleTransport } from "../transport.js";
import { compactUuid, LinkClaims, quietly, SCAN_END_MARGIN_MS } from "./shared.js";

/** The bytes that turn notifications on in a CCCD. */
const CCCD_ENABLE_NOTIFICATIONS = Buffer.from([0x01, 0x00]);
/** How long a proxy takes to answer a connect. The package's own wait is the same. */
const DEVICE_CONNECT_WAIT_MS = 10_000;
/** How long the API connection to the proxy may take. */
const API_CONNECT_TIMEOUT_MS = 10_000;

const ADVERTISEMENT = "message.BluetoothLEAdvertisementResponse";
const CONNECTION_STATE = "message.BluetoothDeviceConnectionResponse";
const NOTIFY_DATA = "message.BluetoothGATTNotifyDataResponse";

export interface EsphomeAdvertisement {
    address: number;
    addressType?: number;
    name?: string;
    rssi?: number;
}

export interface EsphomeConnectionState {
    address: number;
    connected: boolean;
    mtu: number;
    error: number;
}

export interface EsphomeGattDescriptor {
    uuid?: string;
    /** Set in place of `uuid` for a short UUID, on API 1.12 and up. */
    shortUuid?: number;
    handle: number;
}

export interface EsphomeGattCharacteristic extends EsphomeGattDescriptor {
    descriptorsList: EsphomeGattDescriptor[];
}

export interface EsphomeGattService extends EsphomeGattDescriptor {
    characteristicsList: EsphomeGattCharacteristic[];
}

export interface EsphomeGattReply {
    address: number;
    handle: number;
}

export interface EsphomeGattData extends EsphomeGattReply {
    data: string;
}

/** The parts of the package's `Connection` this adapter uses. */
export interface EsphomeConnectionLike {
    connected: boolean;
    authorized: boolean;
    connect(): void;
    disconnect(): void;
    on(event: string, listener: (...args: any[]) => void): unknown;
    off(event: string, listener: (...args: any[]) => void): unknown;
    subscribeBluetoothAdvertisementService(): void;
    unsubscribeBluetoothAdvertisementService(): void;
    connectBluetoothDeviceService(address: number, addressType?: number, useCache?: boolean): Promise<unknown>;
    disconnectBluetoothDeviceService(address: number): Promise<unknown>;
    listBluetoothGATTServicesService(address: number): Promise<{ servicesList: EsphomeGattService[] }>;
    readBluetoothGATTCharacteristicService(address: number, handle: number): Promise<EsphomeGattData>;
    writeBluetoothGATTCharacteristicService(address: number, handle: number, value: Uint8Array, response?: boolean): Promise<EsphomeGattReply>;
    notifyBluetoothGATTCharacteristicService(address: number, handle: number): Promise<unknown>;
    writeBluetoothGATTDescriptorService(address: number, handle: number, value: Uint8Array): Promise<void>;
}

export type EsphomeBleTransportOptions =
    | {
          /** A `Connection` you own. This adapter never closes it. */
          connection: EsphomeConnectionLike;
      }
    | {
          /** The proxy's address. `@2colors/esphome-native-api` loads on first use. */
          host: string;
          /** Defaults to the package's 6053. */
          port?: number;
          /** The proxy's Noise key, base64. Never logged. */
          encryptionKey?: string;
          password?: string;
      };

/** One queue per proxy, however many transports or links share it. */
const proxyQueues = new WeakMap<EsphomeConnectionLike, AsyncLock>();

function queueFor(proxy: EsphomeConnectionLike): AsyncLock {
    let queue = proxyQueues.get(proxy);
    if (!queue) {
        queue = new AsyncLock();
        proxyQueues.set(proxy, queue);
    }
    return queue;
}

/** A proxy's 48-bit address as a MAC, the form a caller would recognize. */
function formatAddress(address: number): string {
    return address
        .toString(16)
        .padStart(12, "0")
        .replace(/(..)(?=.)/g, "$1:")
        .toUpperCase();
}

function parseAddress(id: string): number {
    const hex = id.replace(/:/g, "");
    if (!/^[0-9a-fA-F]{12}$/.test(hex)) {
        throw new Error("An ESPHome device id must be a 48-bit address.");
    }
    return Number.parseInt(hex, 16);
}

function sameUuid(entry: EsphomeGattDescriptor, uuid: string): boolean {
    return entry.uuid ? compactUuid(entry.uuid) === compactUuid(uuid) : (entry.shortUuid ?? 0).toString(16).padStart(4, "0") === compactUuid(uuid);
}

/** A late reply to an abandoned call can land on the next call of its type. */
function assertReplyFor(reply: EsphomeGattReply, address: number, handle: number): void {
    if (reply.address !== address || reply.handle !== handle) {
        throw new Error("The proxy's reply was for another request.");
    }
}

class EsphomeConnection implements BleConnection {
    private lost = false;
    private closed = false;
    private closing: Promise<void> | undefined;
    private handles = new Map<BleCharacteristic | "write", number>();
    private mtu = 0;

    private readonly onLost = (): void => {
        if (this.lost) {
            return;
        }
        this.lost = true;
        this.stopListening();
        if (!this.closed) {
            this.handlers.onDisconnect();
        }
    };

    private readonly onState = (state: EsphomeConnectionState): void => {
        if (state.address === this.address && !state.connected) {
            this.onLost();
        }
    };

    private notifyHandle: number | undefined;
    private readonly onNotifyData = (message: EsphomeGattData): void => {
        if (message.address === this.address && message.handle === this.notifyHandle) {
            this.handlers.onNotify(Buffer.from(message.data, "base64"));
        }
    };

    constructor(
        private readonly proxy: EsphomeConnectionLike,
        private readonly address: number,
        private readonly id: string,
        private readonly handlers: BleLinkHandlers,
        private readonly claims: LinkClaims<EsphomeConnection>,
    ) {}

    private get queue(): AsyncLock {
        return queueFor(this.proxy);
    }

    get isConnected(): boolean {
        return !this.lost && !this.closed && this.proxy.connected && this.proxy.authorized;
    }

    get maxWriteSize(): number {
        return this.mtu > 3 ? this.mtu - 3 : DEFAULT_MAX_WRITE_SIZE;
    }

    /** Ask the proxy to connect. The reply is matched here, as a link dropping elsewhere sends the same message type. */
    private requestLink(addressType: number | undefined): Promise<EsphomeConnectionState> {
        const { proxy, address } = this;
        return this.queue.run(async () => {
            let onReply!: (state: EsphomeConnectionState) => void;
            const reply = new Promise<EsphomeConnectionState>((resolve) => {
                onReply = (state) => {
                    if (state.address === address) {
                        resolve(state);
                    }
                };
            });
            proxy.on(CONNECTION_STATE, onReply);
            try {
                return await withTimeout(
                    () =>
                        Promise.race([
                            reply,
                            // Its own wait can only time out or end early on another address's reply.
                            proxy.connectBluetoothDeviceService(address, addressType, false).then(() => reply),
                        ]),
                    DEVICE_CONNECT_WAIT_MS,
                );
            } finally {
                proxy.off(CONNECTION_STATE, onReply);
            }
        });
    }

    /** Connect, map the handles, and subscribe. Resolves once the CCCD write is done. */
    async open(addressType: number | undefined): Promise<void> {
        const state = await this.requestLink(addressType);
        if (!state.connected || state.error) {
            this.lost = true;
            throw new Error(`The proxy could not connect: error ${state.error}.`);
        }
        this.assertCurrent();
        this.mtu = state.mtu;
        const { proxy, address } = this;
        proxy.on(CONNECTION_STATE, this.onState);
        proxy.on("disconnected", this.onLost);
        proxy.on("unauthorized", this.onLost);

        const { servicesList } = await this.queue.run(() => proxy.listBluetoothGATTServicesService(address));
        const service = servicesList.find((candidate) => sameUuid(candidate, SERVICE_UUID));
        const characteristic = (uuid: string) => service?.characteristicsList.find((candidate) => sameUuid(candidate, uuid));
        const write = characteristic(VEHICLE_WRITE_UUID);
        const notify = characteristic(VEHICLE_NOTIFY_UUID);
        const cccd = notify?.descriptorsList.find((descriptor) => sameUuid(descriptor, CCCD_UUID));
        if (!write || !notify || !cccd) {
            throw new Error("The vehicle's write or notify characteristic, or its CCCD, was not found.");
        }
        this.handles.set("write", write.handle);
        const version = characteristic(VERSION_UUID);
        if (version) {
            this.handles.set("version", version.handle);
        }
        const genericAccess = servicesList.find((candidate) => sameUuid(candidate, GENERIC_ACCESS_UUID));
        for (const [name, uuid] of [
            ["deviceName", NAME_UUID],
            ["appearance", APPEARANCE_UUID],
        ] as const) {
            const entry = genericAccess?.characteristicsList.find((candidate) => sameUuid(candidate, uuid));
            if (entry) {
                this.handles.set(name, entry.handle);
            }
        }

        this.assertCurrent();
        this.notifyHandle = notify.handle;
        proxy.on(NOTIFY_DATA, this.onNotifyData);
        await this.queue.run(() => proxy.notifyBluetoothGATTCharacteristicService(address, notify.handle));
        await this.queue.run(() => proxy.writeBluetoothGATTDescriptorService(address, cccd.handle, CCCD_ENABLE_NOTIFICATIONS));
    }

    /** A superseded attempt stops here, before it changes a link another attempt owns. */
    private assertCurrent(): void {
        if (this.claims.superseded(this.id, this)) {
            throw new Error("A newer connect attempt took over this link.");
        }
    }

    async write(data: Uint8Array): Promise<void> {
        const { proxy, address } = this;
        const handle = this.handles.get("write");
        if (handle === undefined) {
            throw new BleNotSubmittedError("The vehicle write characteristic was not found.");
        }
        const queuedAt = performance.now();
        await this.queue.run(async () => {
            if (!this.isConnected) {
                throw new BleNotSubmittedError("The link is down.");
            }
            // The other link held the queue this long, so the library has given up on
            // this call. Sending it now would put a stray chunk on the air.
            if (performance.now() - queuedAt >= GATT_WRITE_TIMEOUT_MS) {
                throw new BleNotSubmittedError("The write outlasted its timeout in the proxy queue.");
            }
            const reply = await proxy.writeBluetoothGATTCharacteristicService(address, handle, Buffer.from(data), true);
            assertReplyFor(reply, address, handle);
        });
    }

    async read(characteristic: BleCharacteristic): Promise<Uint8Array> {
        const { proxy, address } = this;
        const handle = this.handles.get(characteristic);
        if (handle === undefined) {
            throw new BleNotSubmittedError(`The ${characteristic} characteristic was not found.`);
        }
        const reply = await this.queue.run(() => {
            if (!this.isConnected) {
                throw new BleNotSubmittedError("The link is down.");
            }
            return proxy.readBluetoothGATTCharacteristicService(address, handle);
        });
        assertReplyFor(reply, address, handle);
        return Buffer.from(reply.data, "base64");
    }

    private stopListening(): void {
        const { proxy } = this;
        proxy.off(CONNECTION_STATE, this.onState);
        proxy.off("disconnected", this.onLost);
        proxy.off("unauthorized", this.onLost);
        proxy.off(NOTIFY_DATA, this.onNotifyData);
    }

    disconnect(): Promise<void> {
        this.closing ??= (async () => {
            this.closed = true;
            this.stopListening();
            const { claims, id, proxy, address } = this;
            const superseded = claims.superseded(id, this);
            claims.release(id, this);
            if (!superseded && !this.lost && proxy.authorized) {
                await quietly(() => this.queue.run(() => proxy.disconnectBluetoothDeviceService(address)));
            }
        })();
        return this.closing;
    }
}

export class EsphomeBleTransport implements BleTransport {
    private proxy: EsphomeConnectionLike | undefined;
    private readonly ownsProxy: boolean;
    private readonly scans = new AsyncLock();
    private readonly claims = new LinkClaims<EsphomeConnection>();
    /** A proxy refuses a connect with no address type, and only an advertisement carries it. */
    private readonly addressTypes = new Map<string, number | undefined>();

    constructor(private readonly options: EsphomeBleTransportOptions) {
        this.ownsProxy = !("connection" in options);
        if ("connection" in options) {
            this.proxy = options.connection;
        }
    }

    /** The API connection, up and authorized. */
    private async ready(): Promise<EsphomeConnectionLike> {
        const proxy = (this.proxy ??= await this.buildProxy());
        if (proxy.authorized) {
            return proxy;
        }
        if (this.ownsProxy && !proxy.connected) {
            proxy.connect();
        }
        let onAuthorized!: () => void;
        let onError!: (error: unknown) => void;
        try {
            await withTimeout(
                () =>
                    new Promise<void>((resolve, reject) => {
                        onAuthorized = resolve;
                        onError = reject;
                        proxy.on("authorized", onAuthorized);
                        proxy.on("error", onError);
                    }),
                API_CONNECT_TIMEOUT_MS,
            );
        } finally {
            proxy.off("authorized", onAuthorized);
            proxy.off("error", onError);
        }
        return proxy;
    }

    private async buildProxy(): Promise<EsphomeConnectionLike> {
        if ("connection" in this.options) {
            return this.options.connection;
        }
        // A computed name keeps bundlers and `tsc` from needing the package.
        const specifier = "@2colors/esphome-native-api";
        let module: { Connection?: new (config: object) => EsphomeConnectionLike; default?: { Connection: new (config: object) => EsphomeConnectionLike } };
        try {
            module = await import(specifier);
        } catch (cause) {
            throw new Error("EsphomeBleTransport needs @2colors/esphome-native-api, or a `connection` option.", { cause });
        }
        const Connection = module.Connection ?? module.default?.Connection;
        if (!Connection) {
            throw new Error("@2colors/esphome-native-api has no Connection.");
        }
        const { host, port, encryptionKey, password } = this.options;
        const proxy = new Connection({ host, port, encryptionKey, password });
        // An `error` event with no listener would throw out of the socket's callback.
        proxy.on("error", () => undefined);
        return proxy;
    }

    async scan({ timeoutMs, matches }: BleScanOptions): Promise<BleDeviceRef[]> {
        const proxy = await this.ready();
        return this.listen(proxy, timeoutMs, (device) => device.name !== undefined && matches?.(device.name) === true);
    }

    /** Listen to advertisements until `done` accepts a device or the window ends. A proxy filters nothing. */
    private listen(proxy: EsphomeConnectionLike, timeoutMs: number, done: (device: BleDeviceRef) => boolean): Promise<BleDeviceRef[]> {
        // One scan at a time: unsubscribing one would end any other.
        return this.scans.run(async () => {
            const seen = new Map<string, BleDeviceRef>();
            let finish!: () => void;
            const finished = new Promise<void>((resolve) => {
                finish = resolve;
            });
            const onAdvertisement = (advertisement: EsphomeAdvertisement) => {
                const id = formatAddress(advertisement.address);
                this.addressTypes.set(id, advertisement.addressType ?? this.addressTypes.get(id));
                const device: BleDeviceRef = {
                    id,
                    // The name comes in the scan response, so one advertisement can lack it.
                    name: advertisement.name || seen.get(id)?.name,
                    rssi: advertisement.rssi,
                };
                seen.set(id, device);
                if (done(device)) {
                    finish();
                }
            };
            proxy.on(ADVERTISEMENT, onAdvertisement);
            const timer = setTimeout(finish, Math.max(0, timeoutMs - SCAN_END_MARGIN_MS));
            try {
                proxy.subscribeBluetoothAdvertisementService();
                await finished;
            } finally {
                clearTimeout(timer);
                proxy.off(ADVERTISEMENT, onAdvertisement);
                await quietly(() => proxy.unsubscribeBluetoothAdvertisementService());
            }
            return [...seen.values()];
        });
    }

    async connect(device: BleDeviceRef, handlers: BleLinkHandlers): Promise<BleConnection> {
        const address = parseAddress(device.id);
        const id = formatAddress(address);
        const proxy = await this.ready();
        if (this.addressTypes.get(id) === undefined) {
            await this.listen(proxy, DEFAULT_SCAN_TIMEOUT_MS, (seen) => seen.id === id && this.addressTypes.get(id) !== undefined);
        }

        const connection = new EsphomeConnection(proxy, address, id, handlers, this.claims);
        this.claims.claim(id, connection);
        try {
            await connection.open(this.addressTypes.get(id));
        } catch (error) {
            await connection.disconnect();
            throw error;
        }
        return connection;
    }

    /** Close the API connection, if this transport opened it. */
    close(): void {
        if (this.ownsProxy) {
            this.proxy?.disconnect();
            this.proxy = undefined;
        }
    }
}
