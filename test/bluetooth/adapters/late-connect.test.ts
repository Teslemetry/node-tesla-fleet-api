// The core stops waiting for an abandoned connect after `LINK_TEARDOWN_TIMEOUT_MS`
// and still closes it if it lands. On a backend where every attempt reaches the
// same peripheral, only the adapter can keep that close off the live link.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeyBleTransport } from "../../../src/bluetooth/adapters/homey.js";
import { NobleBleTransport } from "../../../src/bluetooth/adapters/noble.js";
import { LINK_TEARDOWN_TIMEOUT_MS } from "../../../src/bluetooth/constants.js";
import { BleDeviceRef, BleTransport } from "../../../src/bluetooth/transport.js";
import { bleHarness, finish } from "../../helpers/blevehicle.js";
import { StubLink, stubHomey, stubNoble } from "../../helpers/stubbackends.js";

interface Subject {
    transport: BleTransport;
    link: StubLink;
    device: BleDeviceRef;
    /** Make the first connect hang until this resolves. */
    holdFirstConnect(until: Promise<void>): void;
}

function firstCallWaits<Result>(call: () => Promise<Result>, until: Promise<void>): () => Promise<Result> {
    let first = true;
    return () => {
        if (first) {
            first = false;
            return until.then(call);
        }
        return call();
    };
}

const ADAPTERS: Array<[string, () => Subject]> = [
    [
        "homey",
        () => {
            const { ble, link, device, advertisement } = stubHomey();
            return {
                transport: new HomeyBleTransport(ble),
                link,
                device,
                holdFirstConnect: (until) => {
                    advertisement.connect = firstCallWaits(advertisement.connect, until);
                },
            };
        },
    ],
    [
        "noble",
        () => {
            const { noble, link, device, peripheral } = stubNoble();
            return {
                transport: new NobleBleTransport({ noble }),
                link,
                device,
                holdFirstConnect: (until) => {
                    peripheral.connectAsync = firstCallWaits(peripheral.connectAsync, until);
                },
            };
        },
    ],
];

describe.each(ADAPTERS)("a connect landing past the core's wait, on %s", (_name, make) => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("leaves the live link up, subscribed and working", async () => {
        const { transport, link, device, holdFirstConnect } = make();
        let land!: () => void;
        holdFirstConnect(
            new Promise<void>((resolve) => {
                land = resolve;
            }),
        );
        const { vehicle } = bleHarness({ transport, device, connect_timeout_ms: 1000, max_connect_attempts: 2 });
        const statuses: boolean[] = [];
        vehicle.listen_connection_status((up) => statuses.push(up));

        await finish(vehicle.connect());
        expect(link.open).toBe(true);

        // Well past the bound on `teardown`, so the core is no longer waiting.
        await vi.advanceTimersByTimeAsync(LINK_TEARDOWN_TIMEOUT_MS * 2);
        land();
        await vi.advanceTimersByTimeAsync(LINK_TEARDOWN_TIMEOUT_MS * 2);

        expect(link.open).toBe(true);
        expect(link.count("disconnect")).toBe(0);
        expect(link.subscriptions).toBe(1);
        expect(statuses).toEqual([true]);
        expect(await finish(vehicle.query_version())).toBe(7);
    });

    it("still frees the slot when nothing replaced the attempt", async () => {
        const { transport, link, device, holdFirstConnect } = make();
        let land!: () => void;
        holdFirstConnect(
            new Promise<void>((resolve) => {
                land = resolve;
            }),
        );
        const { vehicle } = bleHarness({ transport, device, connect_timeout_ms: 1000, max_connect_attempts: 1 });

        await expect(finish(vehicle.connect())).rejects.toThrow();
        await vi.advanceTimersByTimeAsync(LINK_TEARDOWN_TIMEOUT_MS * 2);
        land();
        await vi.advanceTimersByTimeAsync(LINK_TEARDOWN_TIMEOUT_MS * 2);

        expect(link.open).toBe(false);
    });
});
