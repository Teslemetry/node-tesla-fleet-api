import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EsphomeBleTransport } from "../../../src/bluetooth/adapters/esphome.js";
import { GATT_WRITE_TIMEOUT_MS } from "../../../src/bluetooth/constants.js";
import { BleNotSubmittedError } from "../../../src/bluetooth/transport.js";
import { flush, noHandlers, STUB_ADDRESS, STUB_MAC, STUB_NAME, stubEsphome } from "../../helpers/stubbackends.js";

describe("EsphomeBleTransport", () => {
    function subject() {
        const stub = stubEsphome();
        return { ...stub, transport: new EsphomeBleTransport({ connection: stub.proxy }) };
    }

    it("has no top-level import of the package", () => {
        const source = readFileSync(resolve(import.meta.dirname, "../../../src/bluetooth/adapters/esphome.ts"), "utf8");
        expect(source).not.toMatch(/^\s*import\s[^;]*@2colors/m);
    });

    it("says what to install when the package is missing", async () => {
        await expect(new EsphomeBleTransport({ host: "proxy.test" }).scan({ timeoutMs: 1000 })).rejects.toThrow("@2colors/esphome-native-api");
    });

    it("reports an address as a MAC, keeps the scan response's name, and stops the subscription", async () => {
        const { transport, link } = subject();
        const [device] = await transport.scan({ timeoutMs: 60_000, matches: (name) => name === STUB_NAME });
        expect(device).toMatchObject({ id: STUB_MAC, name: STUB_NAME, rssi: -60 });
        expect(link.count("stop-scan")).toBe(1);
    });

    it("connects without the cache, with the address type an advertisement gave", async () => {
        const { transport, link, device } = subject();
        await transport.connect(device, noHandlers());
        expect(link.calls.find((call) => call.name === "connect")?.args).toEqual([STUB_ADDRESS, 1, false]);
    });

    it("writes the CCCD after the notify subscribe and before connect resolves", async () => {
        const { transport, link, device, handles } = subject();
        link.gate.hold("cccd");
        let resolved = false;
        const connecting = transport.connect(device, noHandlers()).then(() => {
            resolved = true;
        });
        await flush();
        await flush();
        const names = link.calls.map((call) => call.name);
        expect(names.indexOf("cccd")).toBeGreaterThan(names.indexOf("subscribe"));
        expect(resolved).toBe(false);
        link.gate.release("cccd");
        await connecting;
        const cccd = link.calls.find((call) => call.name === "cccd")!;
        expect(cccd.args.slice(0, 2)).toEqual([STUB_ADDRESS, handles.cccd]);
        expect(Buffer.from(cccd.args[2] as Uint8Array)).toEqual(Buffer.from([0x01, 0x00]));
    });

    it("closes the link when the CCCD write fails", async () => {
        const { transport, link, device } = subject();
        link.failing.add("cccd");
        await expect(transport.connect(device, noHandlers())).rejects.toThrow("cccd failed");
        expect(link.open).toBe(false);
    });

    it("passes response = true on every write", async () => {
        const { transport, link, device, handles } = subject();
        const connection = await transport.connect(device, noHandlers());
        await connection.write(Buffer.from([0xaa]));
        const [address, handle, value, response] = link.calls.find((call) => call.name === "write")!.args;
        expect([address, handle, response]).toEqual([STUB_ADDRESS, handles.write, true]);
        expect(Buffer.from(value as Uint8Array)).toEqual(Buffer.from([0xaa]));
    });

    it("writes mtu - 3", async () => {
        const { transport, device, setMtu } = subject();
        setMtu(115);
        expect((await transport.connect(device, noHandlers())).maxWriteSize).toBe(112);
    });

    it("rejects a refused connect without closing a link it never had", async () => {
        const { transport, proxy, link, device } = subject();
        proxy.connectBluetoothDeviceService = async (address: number) => {
            const reply = { address, connected: false, mtu: 0, error: 133 };
            proxy.emit("message.BluetoothDeviceConnectionResponse", reply);
            return reply;
        };
        await expect(transport.connect(device, noHandlers())).rejects.toThrow("error 133");
        expect(link.count("disconnect")).toBe(0);
    });

    it("is not fooled by another address's connection message", async () => {
        const { transport, proxy, link, device } = subject();
        link.gate.hold("connect");
        let resolved = false;
        const connecting = transport.connect(device, noHandlers()).then(() => {
            resolved = true;
        });
        await flush();
        proxy.emit("message.BluetoothDeviceConnectionResponse", { address: 1, connected: false, mtu: 0, error: 0 });
        await flush();
        expect(resolved).toBe(false);
        link.gate.release("connect");
        await connecting;
    });

    it("keeps one queue per proxy, so two links never have two calls in flight", async () => {
        const { proxy, link, device } = subject();
        const first = await new EsphomeBleTransport({ connection: proxy }).connect(device, noHandlers());
        const other = "AA:BB:CC:DD:EE:00";
        // A second transport on the same proxy still shares the queue.
        const second = new EsphomeBleTransport({ connection: proxy });
        proxy.emit("noop");
        (second as unknown as { addressTypes: Map<string, number> }).addressTypes.set(other, 1);
        const secondLink = await second.connect({ id: other }, noHandlers());

        link.gate.hold("write");
        const writing = first.write(Buffer.from([1]));
        const reading = secondLink.read("version");
        await flush();
        expect(link.count("write")).toBe(1);
        expect(link.count("read")).toBe(0);
        link.gate.release("write");
        await writing;
        await reading;
        expect(link.count("read")).toBe(1);
    });

    it("drops a write that waited out its timeout in the queue, as provably unsent", async () => {
        vi.useFakeTimers();
        try {
            const { transport, link, device } = subject();
            const connection = await transport.connect(device, noHandlers());
            link.gate.hold("write");
            const first = connection.write(Buffer.from([1]));
            const second = connection.write(Buffer.from([2])).catch((caught: unknown) => caught);
            await vi.advanceTimersByTimeAsync(GATT_WRITE_TIMEOUT_MS);
            link.gate.release("write");
            await first;
            expect(await second).toBeInstanceOf(BleNotSubmittedError);
            expect(link.count("write")).toBe(1);
        } finally {
            vi.useRealTimers();
        }
    });

    it("treats a GATT error, which surfaces as a timeout, as delivery unknown", async () => {
        const { transport, proxy, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        proxy.writeBluetoothGATTCharacteristicService = async () => {
            throw new Error("sendMessage timeout waiting for BluetoothGATTWriteResponse");
        };
        const error = await connection.write(Buffer.from([1])).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(BleNotSubmittedError);
    });

    it("rejects a late reply that belongs to another request", async () => {
        const { transport, proxy, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        proxy.readBluetoothGATTCharacteristicService = async (address: number) => ({ address, handle: 999, data: "" });
        proxy.writeBluetoothGATTCharacteristicService = async (address: number) => ({ address: address + 1, handle: 999 });
        await expect(connection.read("version")).rejects.toThrow("another request");
        const error = await connection.write(Buffer.from([1])).catch((caught: unknown) => caught);
        expect(error).not.toBeInstanceOf(BleNotSubmittedError);
    });

    it("hears only its own address and handle", async () => {
        const chunks: Buffer[] = [];
        const { transport, proxy, device, handles } = subject();
        await transport.connect(device, noHandlers({ onNotify: (chunk) => chunks.push(Buffer.from(chunk)) }));
        const data = Buffer.from([1]).toString("base64");
        proxy.emit("message.BluetoothGATTNotifyDataResponse", { address: 1, handle: handles.notify, data });
        proxy.emit("message.BluetoothGATTNotifyDataResponse", { address: STUB_ADDRESS, handle: 1, data });
        expect(chunks).toEqual([]);
    });

    it("loses every link when the API connection drops", async () => {
        let drops = 0;
        const { transport, proxy, device } = subject();
        const connection = await transport.connect(device, noHandlers({ onDisconnect: () => drops++ }));
        proxy.connected = false;
        proxy.authorized = false;
        proxy.emit("disconnected");
        expect(drops).toBe(1);
        expect(connection.isConnected).toBe(false);
        await expect(connection.write(Buffer.from([1]))).rejects.toBeInstanceOf(BleNotSubmittedError);
    });

    it("leaves no listener behind", async () => {
        const { transport, proxy, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        await connection.disconnect();
        expect(proxy.count("message.BluetoothDeviceConnectionResponse")).toBe(0);
        expect(proxy.count("message.BluetoothGATTNotifyDataResponse")).toBe(0);
        expect(proxy.count("disconnected")).toBe(0);
    });
});
