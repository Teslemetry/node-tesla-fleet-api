import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { HOMEY_MAX_WRITE_SIZE, HOMEY_SETUP_TIMEOUT_MS, HOMEY_UNSUBSCRIBE_TIMEOUT_MS, HomeyBleTransport, HomeyPeripheralLike } from "../../../src/bluetooth/adapters/homey.js";
import { BleNotSubmittedError } from "../../../src/bluetooth/transport.js";
import { flush, noHandlers, STUB_NAME, stubHomey } from "../../helpers/stubbackends.js";

describe("HomeyBleTransport", () => {
    function subject(options?: ConstructorParameters<typeof HomeyBleTransport>[1]) {
        const stub = stubHomey();
        return { ...stub, transport: new HomeyBleTransport(stub.ble, options) };
    }

    it("imports nothing of Homey's", () => {
        const source = readFileSync(resolve(import.meta.dirname, "../../../src/bluetooth/adapters/homey.ts"), "utf8");
        expect(source).not.toMatch(/from\s+["']homey/);
    });

    it("never passes discover a filter", async () => {
        const { transport, link } = subject();
        await transport.scan({ timeoutMs: 1000, matches: () => true });
        await transport.scan({ timeoutMs: 1000 });
        expect(link.calls.filter((call) => call.name === "scan").map((call) => call.args)).toEqual([[], []]);
    });

    it("drops nameless adverts when matching, and keeps them when not", async () => {
        const { transport } = subject();
        expect((await transport.scan({ timeoutMs: 1000, matches: (name) => name === STUB_NAME })).map((device) => device.id)).toEqual(["homey-peripheral-uuid"]);
        expect(await transport.scan({ timeoutMs: 1000 })).toHaveLength(2);
    });

    it("maps an advert to a device", async () => {
        const { transport } = subject();
        const [device] = await transport.scan({ timeoutMs: 1000 });
        expect(device).toEqual({ id: "homey-peripheral-uuid", name: STUB_NAME, rssi: -60, connectable: true });
    });

    it("connects by the uuid alone, for the probe's fallback when no name is seen", async () => {
        const { transport, link } = subject();
        await transport.connect({ id: "homey-peripheral-uuid" }, noHandlers());
        expect(link.calls.find((call) => call.name === "find")?.args).toEqual(["homey-peripheral-uuid"]);
    });

    it("discovers as the probe does: compact UUID, no characteristic filter", async () => {
        const { transport, link, device } = subject();
        await transport.connect(device, noHandlers());
        expect(link.calls.find((call) => call.name === "discover")?.args).toEqual(["00000211b2d143f09b88960cebf8b91e"]);
        expect(link.calls.find((call) => call.name === "characteristics")?.args).toEqual([]);
    });

    it("defaults to 20 bytes per write", async () => {
        const { transport, device } = subject();
        expect(HOMEY_MAX_WRITE_SIZE).toBe(20);
        expect((await transport.connect(device, noHandlers())).maxWriteSize).toBe(20);
    });

    it("takes a larger write size", async () => {
        const { transport, device } = subject({ maxWriteSize: 100 });
        expect((await transport.connect(device, noHandlers())).maxWriteSize).toBe(100);
    });

    it("keeps null, which BLE-00 step 6 may choose, instead of falling back to 20", async () => {
        const { transport, device } = subject({ maxWriteSize: null });
        expect((await transport.connect(device, noHandlers())).maxWriteSize).toBeNull();
    });

    it("trusts neither isConnected nor the event to write: a stale true still tries", async () => {
        const { transport, link, device, peripheral } = subject();
        const connection = await transport.connect(device, noHandlers());
        link.open = false; // A silent drop: no event, and isConnected stays true.
        expect(peripheral.isConnected).toBe(true);
        link.failing.add("write");
        const error = await connection.write(Buffer.from([1])).catch((caught: unknown) => caught);
        expect(error).not.toBeInstanceOf(BleNotSubmittedError);
        expect(link.count("write")).toBe(1);
    });

    it("sets no connect timeout of its own: a hung connect waits for the library", async () => {
        vi.useFakeTimers();
        try {
            const { transport, link, device } = subject();
            link.gate.hold("connect");
            let settled = false;
            void transport.connect(device, noHandlers()).finally(() => {
                settled = true;
            });
            await vi.advanceTimersByTimeAsync(HOMEY_SETUP_TIMEOUT_MS * 10);
            expect(settled).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it("frees the slot when discovery hangs on an open link", async () => {
        vi.useFakeTimers();
        try {
            const { transport, link, device } = subject();
            link.gate.hold("discover");
            const failed = transport.connect(device, noHandlers()).catch((caught: unknown) => caught);
            await vi.advanceTimersByTimeAsync(HOMEY_SETUP_TIMEOUT_MS);
            expect(await failed).toBeInstanceOf(Error);
            expect(link.open).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it("unsubscribes before it disconnects, as connect() can return the same link", async () => {
        const { transport, link, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        await connection.disconnect();
        const names = link.calls.map((call) => call.name);
        expect(names.indexOf("unsubscribe")).toBeLessThan(names.indexOf("disconnect"));
    });

    it("still disconnects when unsubscribing hangs on a dead link", async () => {
        vi.useFakeTimers();
        try {
            const { transport, link, device } = subject();
            const connection = await transport.connect(device, noHandlers());
            link.gate.hold("unsubscribe");
            const closing = connection.disconnect();
            await vi.advanceTimersByTimeAsync(HOMEY_UNSUBSCRIBE_TIMEOUT_MS);
            await closing;
            expect(link.count("disconnect")).toBe(1);
            expect(link.open).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it("leaves no disconnect listener behind", async () => {
        const { transport, device, peripheral } = subject();
        const connection = await transport.connect(device, noHandlers());
        await connection.disconnect();
        expect(peripheral.count("disconnect")).toBe(0);
    });

    it("fails softly when Generic Access is hidden: no radio I/O, and a clear error class", async () => {
        const { transport, device, peripheral } = subject();
        const connection = await transport.connect(device, noHandlers());
        const getService = peripheral.getService;
        peripheral.getService = async (uuid: string) => (uuid === "1800" ? { discoverCharacteristics: async () => [] } : getService(uuid));
        await expect(connection.read("appearance")).rejects.toBeInstanceOf(BleNotSubmittedError);
    });

    it("closes an attempt that lands after the attempt that replaced it has gone", async () => {
        const { transport, ble, link, device, peripheral, advertisement } = subject();
        let land!: (value: HomeyPeripheralLike) => void;
        const landing = new Promise<HomeyPeripheralLike>((resolve) => {
            land = resolve;
        });
        ble.find = async () => ({ ...advertisement, connect: () => landing }) as never;
        const abandoned = transport.connect(device, noHandlers());
        await flush();

        ble.find = async () => advertisement;
        const live = await transport.connect(device, noHandlers());
        await live.disconnect();
        expect(link.count("disconnect")).toBe(1);

        peripheral.isConnected = true;
        link.open = true;
        land(peripheral);
        await abandoned.then(
            (connection) => connection.disconnect(),
            () => undefined,
        );
        expect(link.open).toBe(false);
    });
});
