import { describe, expect, it } from "vitest";
import { RKEActionE, VehicleLockStateE } from "@teslemetry/tesla-protocol/command/vcsec";
import { EsphomeBleTransport } from "../../../src/bluetooth/adapters/esphome.js";
import { HomeyBleTransport } from "../../../src/bluetooth/adapters/homey.js";
import { NobleBleTransport } from "../../../src/bluetooth/adapters/noble.js";
import { BleConnection, BleDeviceRef, BleLinkHandlers, BleNotSubmittedError, BleTransport } from "../../../src/bluetooth/transport.js";
import { bleHarness } from "../../helpers/blevehicle.js";
import { flush, noHandlers, STUB_NAME, StubLink, stubEsphome, stubHomey, stubNoble } from "../../helpers/stubbackends.js";

interface Subject {
    transport: BleTransport;
    link: StubLink;
    device: BleDeviceRef;
}

const ADAPTERS: Array<[string, () => Subject]> = [
    [
        "noble",
        () => {
            const { noble, link, device } = stubNoble();
            return { transport: new NobleBleTransport({ noble }), link, device };
        },
    ],
    [
        "homey",
        () => {
            const { ble, link, device } = stubHomey();
            return { transport: new HomeyBleTransport(ble), link, device };
        },
    ],
    [
        "esphome",
        () => {
            const { proxy, link, device } = stubEsphome();
            return { transport: new EsphomeBleTransport({ connection: proxy }), link, device };
        },
    ],
];

describe.each(ADAPTERS)("the %s adapter's contract", (_name, make) => {
    const scanOptions = { timeoutMs: 1000, matches: (name: string) => name === STUB_NAME };

    async function connected(handlers: BleLinkHandlers = noHandlers()) {
        const subject = make();
        const connection = await subject.transport.connect(subject.device, handlers);
        return { ...subject, connection };
    }

    it("rule 1: scans with no service filter, and finds the name", async () => {
        const { transport, link } = make();
        const devices = await transport.scan(scanOptions);
        expect(link.scanFilters).toEqual([]);
        expect(devices.map((device) => device.name)).toContain(STUB_NAME);
    });

    it("rule 2: resolves only once the subscription is confirmed", async () => {
        const { transport, link, device } = make();
        link.gate.hold("subscribe");
        let resolved = false;
        const connecting = transport.connect(device, noHandlers()).then((connection) => {
            resolved = true;
            return connection;
        });
        await flush();
        await flush();
        expect(link.count("subscribe")).toBe(1);
        expect(resolved).toBe(false);
        link.gate.release("subscribe");
        await connecting;
        expect(link.subscriptions).toBe(1);
    });

    it.each(["subscribe", "discover"])("rule 3: closes the link when %s fails", async (step) => {
        const { transport, link, device } = make();
        link.failing.add(step);
        await expect(transport.connect(device, noHandlers())).rejects.toThrow(`${step} failed`);
        expect(link.open).toBe(false);
    });

    it("rule 4: subscribes again on every connect", async () => {
        const { transport, link, device, connection } = await connected();
        await connection.disconnect();
        await transport.connect(device, noHandlers());
        expect(link.subscriptions).toBe(2);
    });

    it("rule 5: writes with response", async () => {
        const { connection, link } = await connected();
        await connection.write(Buffer.from([1, 2, 3]));
        expect(link.withResponse).toEqual([true]);
    });

    it("rule 6: a link the backend reports down is provably not submitted", async () => {
        const { connection, link } = await connected();
        link.drop();
        await expect(connection.write(Buffer.from([1]))).rejects.toBeInstanceOf(BleNotSubmittedError);
        expect(link.count("write")).toBe(0);
    });

    it("rule 6: a backend failure stays a plain error", async () => {
        const { connection, link } = await connected();
        link.failing.add("write");
        const error = await connection.write(Buffer.from([1])).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(BleNotSubmittedError);
    });

    it("rule 7: passes notifications unchanged and in order", async () => {
        const chunks: Buffer[] = [];
        const { link } = await connected(noHandlers({ onNotify: (chunk) => chunks.push(Buffer.from(chunk)) }));
        link.notify(Buffer.from([0x00, 0xff, 0x80]));
        link.notify(Buffer.from([0x7f]));
        expect(chunks).toEqual([Buffer.from([0x00, 0xff, 0x80]), Buffer.from([0x7f])]);
    });

    it("rule 8: never retries a failed write", async () => {
        const { connection, link } = await connected();
        link.failing.add("write");
        await expect(connection.write(Buffer.from([1]))).rejects.toThrow();
        expect(link.count("write")).toBe(1);
    });

    it("rule 9: disconnect is safe twice", async () => {
        const { connection, link } = await connected();
        await connection.disconnect();
        await connection.disconnect();
        expect(link.count("disconnect")).toBe(1);
        expect(connection.isConnected).toBe(false);
    });

    it("rule 9: disconnect is safe on a dead link", async () => {
        const { connection, link } = await connected();
        link.drop();
        link.failing.add("disconnect");
        await expect(connection.disconnect()).resolves.toBeUndefined();
    });

    it("rejects a failed read rather than swallowing it", async () => {
        const { connection, link } = await connected();
        link.failing.add("read");
        await expect(connection.read("version")).rejects.toThrow("read failed");
    });

    it("reads by name", async () => {
        const { connection } = await connected();
        expect(Buffer.from(await connection.read("version"))).toEqual(Buffer.from([0, 7]));
        expect(Buffer.from(await connection.read("deviceName")).toString()).toBe("name");
    });

    it("reports a dropped link once, and stops saying it is up", async () => {
        let drops = 0;
        const { connection, link } = await connected(noHandlers({ onDisconnect: () => drops++ }));
        expect(connection.isConnected).toBe(true);
        link.drop();
        link.drop();
        expect(drops).toBe(1);
        expect(connection.isConnected).toBe(false);
    });

    it("says nothing of a disconnect it asked for", async () => {
        let drops = 0;
        const { connection } = await connected(noHandlers({ onDisconnect: () => drops++ }));
        await connection.disconnect();
        expect(drops).toBe(0);
    });

    it("a superseded attempt never closes or changes the link that replaced it", async () => {
        const { transport, link, device } = make();
        link.gate.hold("connect");
        const chunks: Buffer[] = [];
        const abandoned = transport.connect(device, noHandlers());
        await flush();
        const live = transport.connect(device, noHandlers({ onNotify: (chunk) => chunks.push(Buffer.from(chunk)) }));
        await flush();
        link.gate.release("connect");

        const [first, second] = await Promise.allSettled([abandoned, live]);
        expect(second.status).toBe("fulfilled");
        const connection = (second as PromiseFulfilledResult<BleConnection>).value;
        // The library closes a late landing, which must leave the live link alone.
        await (first.status === "fulfilled" ? first.value.disconnect() : undefined);

        expect(link.open).toBe(true);
        expect(link.count("disconnect")).toBe(0);
        expect(link.subscriptions).toBe(1);
        expect(connection.isConnected).toBe(true);
        link.notify(Buffer.from([1]));
        expect(chunks).toEqual([Buffer.from([1])]);
    });

    it("carries a real vehicle's traffic, from a scan to a signed command", async () => {
        const { transport, link } = make();
        const { vehicle, link: car, fakeVehicle } = bleHarness({ transport });
        fakeVehicle.vehicleStatus = { ...fakeVehicle.vehicleStatus, vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED };
        const radio = await car.connect({ id: "radio" }, { onNotify: (chunk) => link.notify(Buffer.from(chunk)), onDisconnect: () => undefined });
        link.onWrite = (data) => void radio.write(data);

        await vehicle.find_vehicle({ name: STUB_NAME });
        const status = await vehicle.vehicle_state();
        expect(status.vehicleLockState).toBe(VehicleLockStateE.VEHICLELOCKSTATE_LOCKED);

        await vehicle.door_lock();
        // `vcsecWrites` also holds the status read above, so count the lock itself.
        expect(car.vcsecWrites.filter((command) => command.RKEAction === RKEActionE.RKE_ACTION_LOCK)).toHaveLength(1);
        expect(car.vcsecWrites).toHaveLength(2);
        expect(link.withResponse.every(Boolean)).toBe(true);
        await vehicle.disconnect();
        expect(link.open).toBe(false);
    });
});
