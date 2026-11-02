/**
 * The seam between the library and a Bluetooth backend.
 *
 * The library owns framing, reassembly, signing, sessions, retries, keepalive
 * and confirmation. An adapter owns raw GATT and holds no Tesla logic but the
 * UUIDs, which it imports. Around every adapter the library adds one call at a
 * time per connection, a timeout on every call, frame chunking and link-loss
 * handling, so an adapter needs none of them. This file imports no backend,
 * and neither does anything else in `./bluetooth`.
 *
 * The contract asks only for what the weakest backend, Homey, can do:
 *
 * - `scan` may take a fixed window and ignore `timeoutMs`. Homey's `discover()`
 *   takes no filter and scans for about 5 s, whatever it is asked. The library
 *   filters what comes back, so an adapter may return all it saw.
 * - `connect` needs no timeout of its own, and Homey has none. The library
 *   abandons a hung attempt, and closes the connection if it arrives later.
 * - `write` is always with response, the only mode Homey offers and the only
 *   one the vehicle takes.
 * - `maxWriteSize` may be left out when the backend hides its MTU. The library
 *   then writes `DEFAULT_MAX_WRITE_SIZE` bytes at a time.
 * - `isConnected` and `onDisconnect` may both lie: Homey's state goes stale on
 *   a silent drop, and its event is not guaranteed. Neither has to be right,
 *   since a failed or timed-out operation is what the library treats as a dead
 *   link. A rejection with `BleNotSubmittedError` is the exception.
 *
 * Adapter rules, each worth a test in the adapter's own suite:
 *
 * 1. Never scan with a service filter, because the vehicle advertises none.
 *    Scan actively where the backend has a choice: the name is in the scan
 *    response.
 * 2. `connect` resolves only once the notify subscription is confirmed, as a
 *    reply sent before that is lost.
 * 3. `connect` closes a half-open link before it rejects. The vehicle has
 *    three connection slots.
 * 4. Subscribe again on every connect. Subscriptions end with the link.
 * 5. `write` is always with response.
 * 6. Throw `BleNotSubmittedError` only when the failure is provably before any
 *    radio I/O, as a read of a characteristic that was never resolved is on a
 *    stack that hides Generic Access. It leaves the link up. All other failures
 *    stay plain errors, and the library treats them as a lost link.
 * 7. Pass notifications unchanged and in order. The library copies them, so a
 *    reused backend buffer is safe once the handler returns.
 * 8. Do not retry writes. A retry can run a command twice.
 * 9. `disconnect` is safe to call twice, and on a dead link.
 */

/** Named characteristics, so an adapter resolves service and UUID its own way. */
export type BleCharacteristic = "version" | "deviceName" | "appearance";

/** A found vehicle. `id` is opaque: a Homey peripheral uuid, a MAC, a browser device id. */
export interface BleDeviceRef {
    id: string;
    name?: string;
    rssi?: number;
    /** `false` means the vehicle already holds its maximum BLE connections. */
    connectable?: boolean;
}

export interface BleLinkHandlers {
    /** One notification, unchanged and in arrival order. */
    onNotify(chunk: Uint8Array): void;
    /** Best effort, and a faster signal only. The library also treats a failed operation as a lost link. */
    onDisconnect(): void;
}

export interface BleConnection {
    /** The adapter's best knowledge. It may be stale. */
    readonly isConnected: boolean;
    /**
     * Largest bytes per write. `null` means the backend accepts a full frame.
     * Left out, the library uses `DEFAULT_MAX_WRITE_SIZE`.
     */
    readonly maxWriteSize?: number | null;
    /** One write-with-response to the vehicle write characteristic. Resolves on the ATT response. */
    write(data: Uint8Array): Promise<void>;
    read(characteristic: BleCharacteristic): Promise<Uint8Array>;
    disconnect(): Promise<void>;
}

export interface BleScanOptions {
    /** How long the library will wait. A backend with a fixed scan window may ignore it. */
    timeoutMs: number;
    /** Tells an adapter which name it can stop scanning for. */
    matches?: (name: string) => boolean;
}

export interface BleTransport {
    /** Active, unfiltered scan. Resolves once a match is found, or when the scan ends with what was seen. */
    scan(options: BleScanOptions): Promise<BleDeviceRef[]>;
    /** Connect, discover, subscribe to notify. Resolves only when notifications are live. */
    connect(device: BleDeviceRef, handlers: BleLinkHandlers): Promise<BleConnection>;
}

/**
 * Thrown by an adapter only when bytes provably never entered the BLE stack,
 * such as an unresolved characteristic, or a link the backend reports down
 * before the call. A router can then safely replay the command elsewhere.
 */
export class BleNotSubmittedError extends Error {
    override readonly name = "BleNotSubmittedError";
}
