import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { NobleBleTransport } from "../../../src/bluetooth/adapters/noble.js";
import { noHandlers, STUB_NAME, stubNoble } from "../../helpers/stubbackends.js";

describe("NobleBleTransport", () => {
    function subject() {
        const stub = stubNoble();
        return { ...stub, transport: new NobleBleTransport({ noble: stub.noble }) };
    }

    it("has no top-level import of noble", () => {
        const source = readFileSync(resolve(import.meta.dirname, "../../../src/bluetooth/adapters/noble.ts"), "utf8");
        expect(source).not.toMatch(/^\s*import\s[^;]*@stoprocent/m);
    });

    it("says what to install when noble is missing", async () => {
        await expect(new NobleBleTransport().scan({ timeoutMs: 1000 })).rejects.toThrow("@stoprocent/noble");
    });

    it("scans with duplicates on, so the scan response's name arrives", async () => {
        const { transport, link } = subject();
        const [device] = await transport.scan({ timeoutMs: 1000, matches: (name) => name === STUB_NAME });
        expect(link.calls.find((call) => call.name === "scan")?.args).toEqual([[], true]);
        expect(device).toMatchObject({ id: "aabbccddeeff", name: STUB_NAME, rssi: -60, connectable: true });
    });

    it("stops the scan once a name matches", async () => {
        const { transport, noble } = subject();
        await transport.scan({ timeoutMs: 60_000, matches: (name) => name === STUB_NAME });
        expect(noble.scanning).toBe(false);
    });

    it("ends a timed scan before the library's own timeout, keeping what it saw", async () => {
        const { transport } = subject();
        const started = performance.now();
        const devices = await transport.scan({ timeoutMs: 300 });
        expect(performance.now() - started).toBeLessThan(300);
        expect(devices).toHaveLength(1);
    });

    it("stops scanning before it connects", async () => {
        const { transport, link, device } = subject();
        await transport.connect(device, noHandlers());
        const names = link.calls.map((call) => call.name);
        expect(names.lastIndexOf("stop-scan")).toBeLessThan(names.indexOf("connect"));
    });

    it("finds a device an earlier run saved", async () => {
        const { transport, link, device } = subject();
        await transport.connect(device, noHandlers());
        expect(link.count("scan")).toBe(1);
    });

    it("asks for UUIDs in noble's compact form", async () => {
        const { transport, link, device } = subject();
        await transport.connect(device, noHandlers());
        expect(link.calls.find((call) => call.name === "discover")?.args).toEqual([
            ["00000211b2d143f09b88960cebf8b91e"],
            ["00000212b2d143f09b88960cebf8b91e", "00000213b2d143f09b88960cebf8b91e", "00000214b2d143f09b88960cebf8b91e"],
        ]);
    });

    it("writes mtu - 3, and follows an MTU that changes", async () => {
        const { transport, peripheral, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        expect(connection.maxWriteSize).toBe(182);
        peripheral.mtu = 247;
        expect(connection.maxWriteSize).toBe(244);
    });

    it("writes 20 bytes when noble has no MTU", async () => {
        const { transport, peripheral, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        peripheral.mtu = null;
        expect(connection.maxWriteSize).toBe(20);
    });

    it("ignores the data event a read emits", async () => {
        const chunks: Buffer[] = [];
        const { transport, notify, device } = subject();
        await transport.connect(device, noHandlers({ onNotify: (chunk) => chunks.push(Buffer.from(chunk)) }));
        notify.emit("data", Buffer.from([1]), false);
        expect(chunks).toEqual([]);
    });

    it("leaves no listener on a peripheral noble reuses", async () => {
        const { transport, peripheral, notify, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        await connection.disconnect();
        expect(peripheral.count("disconnect")).toBe(0);
        expect(notify.count("data")).toBe(0);
    });

    it("does not wait on noble to disconnect a dead link", async () => {
        const { transport, link, device } = subject();
        const connection = await transport.connect(device, noHandlers());
        link.drop();
        link.gate.hold("disconnect");
        await expect(connection.disconnect()).resolves.toBeUndefined();
        expect(link.count("disconnect")).toBe(0);
    });
});
