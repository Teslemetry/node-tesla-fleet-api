import type { BleLinkHandlers } from "../../src/bluetooth/transport.js";

/** One call a stub backend took, in order. */
export type BackendCall = { name: string; args: unknown[] };

/** A vehicle's advertised name. */
export const STUB_NAME = "S1a87a5a75f3df858C";

const COMPACT = {
    service: "00000211b2d143f09b88960cebf8b91e",
    write: "00000212b2d143f09b88960cebf8b91e",
    notify: "00000213b2d143f09b88960cebf8b91e",
    version: "00000214b2d143f09b88960cebf8b91e",
};

/** A tiny `EventEmitter` with the calls a backend's objects offer. */
class Emitter {
    private listeners = new Map<string, Array<(...args: any[]) => void>>();

    on(event: string, listener: (...args: any[]) => void): this {
        this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
        return this;
    }

    once(event: string, listener: (...args: any[]) => void): this {
        const wrapped = (...args: unknown[]) => {
            this.off(event, wrapped);
            listener(...args);
        };
        (wrapped as { original?: unknown }).original = listener;
        return this.on(event, wrapped);
    }

    off(event: string, listener: (...args: any[]) => void): this {
        this.listeners.set(
            event,
            (this.listeners.get(event) ?? []).filter((candidate) => candidate !== listener && (candidate as { original?: unknown }).original !== listener),
        );
        return this;
    }

    removeListener(event: string, listener: (...args: any[]) => void): this {
        return this.off(event, listener);
    }

    emit(event: string, ...args: unknown[]): void {
        for (const listener of this.listeners.get(event) ?? []) {
            listener(...args);
        }
    }

    count(event: string): number {
        return this.listeners.get(event)?.length ?? 0;
    }
}

/** Steps a stub holds open until a test lets them go. */
export class Gate {
    private held = new Set<string>();
    private waiters = new Map<string, Array<() => void>>();

    hold(step: string): void {
        this.held.add(step);
    }

    release(step: string): void {
        this.held.delete(step);
        for (const resume of this.waiters.get(step) ?? []) {
            resume();
        }
        this.waiters.delete(step);
    }

    async pass(step: string): Promise<void> {
        if (this.held.has(step)) {
            await new Promise<void>((resolve) => this.waiters.set(step, [...(this.waiters.get(step) ?? []), resolve]));
        }
    }
}

/** A stub's link, seen the same way for every backend. */
export class StubLink {
    /** Every backend call, for a test to count. */
    readonly calls: BackendCall[] = [];
    readonly gate = new Gate();
    /** Step names, each failing once when reached. */
    readonly failing = new Set<string>();
    /** What reached the write characteristic, per write, in order. */
    readonly written: Buffer[] = [];
    /** Whether each write asked for a response. */
    readonly withResponse: boolean[] = [];
    /** Every filter a scan was given. */
    readonly scanFilters: unknown[] = [];
    /** Times notifications were turned on, across connects. */
    subscriptions = 0;
    /** Whether the backend has a link open. */
    open = false;
    /** Deliver a notification from the vehicle. */
    notify: (chunk: Buffer) => void = () => undefined;
    /** The backend sees the link drop. */
    drop: () => void = () => undefined;
    /** Called with each write that lands, so a test can put a vehicle behind the stub. */
    onWrite: ((data: Buffer) => void) | undefined;

    count(name: string): number {
        return this.calls.filter((call) => call.name === name).length;
    }

    /** Record a call, wait at its gate, and fail if told to. */
    async step(name: string, ...args: unknown[]): Promise<void> {
        this.calls.push({ name, args });
        await this.gate.pass(name);
        if (this.failing.delete(name)) {
            throw new Error(`${name} failed`);
        }
    }

    landWrite(data: Buffer, withResponse: boolean): void {
        this.written.push(Buffer.from(data));
        this.withResponse.push(withResponse);
        this.onWrite?.(data);
    }
}

/** A stub of `@stoprocent/noble`. */
export function stubNoble() {
    const link = new StubLink();
    const write: any = new Emitter();
    Object.assign(write, {
        uuid: COMPACT.write,
        writeAsync: async (data: Buffer, withoutResponse: boolean) => {
            await link.step("write", data, withoutResponse);
            link.landWrite(data, !withoutResponse);
        },
    });
    const notify: any = new Emitter();
    Object.assign(notify, {
        uuid: COMPACT.notify,
        subscribeAsync: async () => {
            await link.step("subscribe");
            link.subscriptions++;
        },
    });
    const version: any = new Emitter();
    Object.assign(version, {
        uuid: COMPACT.version,
        readAsync: async () => {
            await link.step("read");
            return Buffer.from([0, 7]);
        },
    });
    const deviceName = {
        uuid: "2a00",
        readAsync: async () => {
            await link.step("read");
            return Buffer.from("name");
        },
    };

    const peripheral: any = new Emitter();
    Object.assign(peripheral, {
        id: "aabbccddeeff",
        state: "disconnected",
        mtu: 185,
        rssi: -60,
        connectable: true,
        advertisement: {},
        connectAsync: async () => {
            await link.step("connect");
            peripheral.state = "connected";
            link.open = true;
        },
        disconnectAsync: async () => {
            await link.step("disconnect");
            peripheral.state = "disconnected";
            link.open = false;
        },
        discoverSomeServicesAndCharacteristicsAsync: async (services: string[], characteristics: string[]) => {
            await link.step("discover", services, characteristics);
            return { characteristics: services.includes("1800") ? [deviceName] : [write, notify, version] };
        },
    });

    const noble: any = new Emitter();
    Object.assign(noble, {
        scanning: false,
        waitForPoweredOnAsync: async () => link.step("powered-on"),
        startScanningAsync: async (filter: string[], allowDuplicates: boolean) => {
            await link.step("scan", filter, allowDuplicates);
            link.scanFilters.push(...filter);
            noble.scanning = true;
            // The advertisement first, then the scan response with the name.
            peripheral.advertisement = {};
            noble.emit("discover", peripheral);
            peripheral.advertisement = { localName: STUB_NAME };
            noble.emit("discover", peripheral);
        },
        stopScanningAsync: async () => {
            await link.step("stop-scan");
            noble.scanning = false;
        },
    });

    link.notify = (chunk) => notify.emit("data", chunk, true);
    link.drop = () => {
        peripheral.state = "disconnected";
        link.open = false;
        peripheral.emit("disconnect");
    };
    return { link, noble, peripheral, notify, device: { id: peripheral.id as string } };
}

/** A stub of a Homey app's `this.homey.ble`. It takes UUIDs only in the compact form the probe app uses. */
export function stubHomey() {
    const link = new StubLink();
    let callback: ((data: Buffer) => void) | null = null;

    const write = {
        uuid: COMPACT.write,
        read: async () => Buffer.alloc(0),
        write: async (data: Buffer) => {
            await link.step("write", data);
            link.landWrite(data, true);
            return data;
        },
        subscribeToNotifications: async () => undefined,
        unsubscribeFromNotifications: async () => undefined,
    };
    const notify = {
        uuid: COMPACT.notify,
        read: async () => Buffer.alloc(0),
        write: async (data: Buffer) => data,
        // One callback per characteristic, as on a real `BleCharacteristic`.
        subscribeToNotifications: async (listener: (data: Buffer) => void) => {
            await link.step("subscribe");
            callback = listener;
            link.subscriptions++;
        },
        unsubscribeFromNotifications: async () => {
            await link.step("unsubscribe");
            callback = null;
        },
    };
    const version = {
        ...write,
        uuid: COMPACT.version,
        read: async () => {
            await link.step("read");
            return Buffer.from([0, 7]);
        },
    };
    const deviceName = {
        ...write,
        uuid: "2a00",
        read: async () => {
            await link.step("read");
            return Buffer.from("name");
        },
    };

    const peripheral: any = new Emitter();
    Object.assign(peripheral, {
        // Stale on a silent drop, as Homey's docs warn.
        isConnected: false,
        getService: async (uuid: string) => {
            await link.step("discover", uuid);
            if (uuid === "1800") {
                return { discoverCharacteristics: async () => [deviceName] };
            }
            if (uuid !== COMPACT.service) {
                throw new Error("No such service.");
            }
            return {
                discoverCharacteristics: async (...filter: unknown[]) => {
                    link.calls.push({ name: "characteristics", args: filter });
                    return [write, notify, version];
                },
            };
        },
        disconnect: async () => {
            await link.step("disconnect");
            peripheral.isConnected = false;
            link.open = false;
        },
    });

    const advertisement = {
        uuid: "homey-peripheral-uuid",
        localName: STUB_NAME,
        rssi: -60,
        connectable: true,
        // Already connected, this returns the existing connection, so every attempt shares one peripheral.
        connect: async () => {
            await link.step("connect");
            peripheral.isConnected = true;
            link.open = true;
            return peripheral;
        },
    };
    const unnamed = { uuid: "unnamed-uuid", rssi: -80, connectable: true, connect: advertisement.connect };

    const ble = {
        discover: async (...filter: unknown[]) => {
            await link.step("scan", ...filter);
            link.scanFilters.push(...filter);
            return [advertisement, unnamed];
        },
        find: async (uuid: string) => {
            await link.step("find", uuid);
            return advertisement;
        },
    };

    link.notify = (chunk) => callback?.(chunk);
    link.drop = () => {
        peripheral.isConnected = false;
        link.open = false;
        peripheral.emit("disconnect");
    };
    return { link, ble, peripheral, advertisement, device: { id: advertisement.uuid } };
}

export function noHandlers(overrides: Partial<BleLinkHandlers> = {}): BleLinkHandlers {
    return { onNotify: () => undefined, onDisconnect: () => undefined, ...overrides };
}

/** Let everything already queued run. */
export function flush(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
}
