import { describe, expect, it } from "vitest";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { FromVCSECMessage, VehicleLockStateE } from "@teslemetry/tesla-protocol/command/vcsec";
import { MAX_FRAME_SIZE, STALE_CHUNK_TIMEOUT_MS } from "../../src/bluetooth/constants.js";
import { ReassemblingBuffer, parseFrame, prependLength, splitFrame } from "../../src/bluetooth/framing.js";

const hex = (value: string) => Buffer.from(value, "hex");

function framed(fields: Partial<RoutableMessage>): Buffer {
    return prependLength(RoutableMessage.encode(RoutableMessage.fromPartial(fields)).finish());
}

function collector(now?: () => number) {
    const received: RoutableMessage[] = [];
    return { received, buffer: new ReassemblingBuffer((message) => received.push(message), now) };
}

const REQUEST_UUID = Buffer.from("0123456789abcdef");

describe("prependLength", () => {
    it("prefixes the payload's big-endian length", () => {
        expect(prependLength(Buffer.alloc(0x0102)).subarray(0, 2)).toEqual(hex("0102"));
        expect(prependLength(hex("aabb"))).toEqual(hex("0002aabb"));
    });
});

describe("splitFrame", () => {
    const frame = Buffer.alloc(185, 7);

    it("makes the write counts of a signed lock frame", () => {
        expect(splitFrame(frame, 20)).toHaveLength(10);
        expect(splitFrame(frame, 112)).toHaveLength(2);
    });

    it("loses no byte", () => {
        expect(Buffer.concat(splitFrame(frame, 20))).toEqual(frame);
    });

    it("writes a full frame when the backend takes one", () => {
        expect(splitFrame(frame, null)).toEqual([frame]);
    });

    it("refuses a size that would never finish", () => {
        expect(() => splitFrame(frame, 0)).toThrow(RangeError);
    });
});

describe("parseFrame", () => {
    it("wraps a bare vehicleStatus as an unaddressed VCSEC message", () => {
        const payload = hex("0a021001");
        const message = parseFrame(payload);
        expect(message.fromDestination?.domain).toBe(Domain.DOMAIN_VEHICLE_SECURITY);
        expect(message.toDestination).toBeUndefined();
        expect(Buffer.from(message.protobufMessageAsBytes!)).toEqual(payload);
        expect(FromVCSECMessage.decode(message.protobufMessageAsBytes!).vehicleStatus?.vehicleLockState).toBe(
            VehicleLockStateE.VEHICLELOCKSTATE_LOCKED,
        );
    });

    it("wraps a bare commandStatus", () => {
        const message = parseFrame(hex("22020801"));
        expect(message.fromDestination?.domain).toBe(Domain.DOMAIN_VEHICLE_SECURITY);
        expect(FromVCSECMessage.decode(message.protobufMessageAsBytes!).commandStatus).toBeDefined();
    });

    it("leaves a wrapped frame alone", () => {
        const message = parseFrame(framed({ fromDestination: { domain: Domain.DOMAIN_INFOTAINMENT } }).subarray(2));
        expect(message.fromDestination?.domain).toBe(Domain.DOMAIN_INFOTAINMENT);
        expect(message.protobufMessageAsBytes).toBeUndefined();
    });

    it("leaves an empty frame empty", () => {
        expect(parseFrame(Buffer.alloc(0)).fromDestination).toBeUndefined();
    });

    it.each(["0a", "0aff", "ffffffffff", "3205", "0a0212"])("throws on malformed %s", (bytes) => {
        expect(() => parseFrame(hex(bytes))).toThrow();
    });
});

describe("ReassemblingBuffer", () => {
    it("emits a single message in a single chunk", () => {
        const { received, buffer } = collector();
        buffer.receive(framed({ fromDestination: { domain: Domain.DOMAIN_INFOTAINMENT } }));
        expect(received).toHaveLength(1);
        expect(received[0]?.fromDestination?.domain).toBe(Domain.DOMAIN_INFOTAINMENT);
    });

    it("emits a message split across chunks only once it is whole", () => {
        const { received, buffer } = collector();
        const payload = framed({ fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY }, requestUuid: REQUEST_UUID });
        for (let i = 0; i < payload.length; i += 5) {
            buffer.receive(payload.subarray(i, i + 5));
            if (i + 5 < payload.length) {
                expect(received).toEqual([]);
            }
        }
        expect(received).toHaveLength(1);
        expect(Buffer.from(received[0]!.requestUuid)).toEqual(REQUEST_UUID);
    });

    it("emits several messages from one chunk, in order", () => {
        const { received, buffer } = collector();
        buffer.receive(
            Buffer.concat([
                framed({ fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY } }),
                framed({ fromDestination: { domain: Domain.DOMAIN_INFOTAINMENT } }),
            ]),
        );
        expect(received.map((message) => message.fromDestination?.domain)).toEqual([
            Domain.DOMAIN_VEHICLE_SECURITY,
            Domain.DOMAIN_INFOTAINMENT,
        ]);
    });

    it("resyncs at the next notification after a corrupt packet", () => {
        const { received, buffer } = collector();
        buffer.receive(prependLength(Buffer.alloc(20, 0xff)));
        buffer.receive(framed({ fromDestination: { domain: Domain.DOMAIN_INFOTAINMENT } }));
        expect(received).toHaveLength(1);
        expect(received[0]?.fromDestination?.domain).toBe(Domain.DOMAIN_INFOTAINMENT);
    });

    it("discards an oversized header instead of waiting forever", () => {
        const { received, buffer } = collector();
        buffer.receive(Buffer.concat([hex("ffff"), Buffer.alloc(10)]));
        buffer.receive(framed({ fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY } }));
        expect(received).toHaveLength(1);
        expect(received[0]?.fromDestination?.domain).toBe(Domain.DOMAIN_VEHICLE_SECURITY);
    });

    it("limits header plus payload, as Python does", () => {
        const fits = collector();
        fits.buffer.receive(prependLength(Buffer.alloc(MAX_FRAME_SIZE - 2)));
        expect(fits.received).toHaveLength(1);

        const over = collector();
        over.buffer.receive(prependLength(Buffer.alloc(MAX_FRAME_SIZE - 1)));
        expect(over.received).toEqual([]);
    });

    it("drops a stale partial instead of prepending it to the next message", () => {
        let clock = 0;
        const { received, buffer } = collector(() => clock);
        const stale = framed({ fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY }, requestUuid: REQUEST_UUID });

        buffer.receive(stale.subarray(0, stale.length >> 1));
        expect(received).toEqual([]);

        clock = STALE_CHUNK_TIMEOUT_MS + 1;
        buffer.receive(framed({ fromDestination: { domain: Domain.DOMAIN_INFOTAINMENT } }));

        expect(received).toHaveLength(1);
        expect(received[0]?.fromDestination?.domain).toBe(Domain.DOMAIN_INFOTAINMENT);
    });

    it("keeps a fast multi-chunk message under the stale limit", () => {
        let clock = 0;
        const { received, buffer } = collector(() => clock);
        const payload = framed({ fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY }, requestUuid: REQUEST_UUID });

        for (let i = 0; i < payload.length; i += 5) {
            buffer.receive(payload.subarray(i, i + 5));
            clock += 100;
        }

        expect(received).toHaveLength(1);
        expect(Buffer.from(received[0]!.requestUuid)).toEqual(REQUEST_UUID);
    });

    it("does not throw on malformed bytes", () => {
        const { received, buffer } = collector();
        for (const bytes of ["0a", "0aff", "ffffffffff", "3205", "0a0212"]) {
            expect(() => buffer.receive(prependLength(hex(bytes)))).not.toThrow();
        }
        expect(received).toEqual([]);
    });

    it("delivers bare VCSEC frames through reassembly", () => {
        const { received, buffer } = collector();
        buffer.receive(prependLength(hex("0a021001")));
        expect(received[0]?.fromDestination?.domain).toBe(Domain.DOMAIN_VEHICLE_SECURITY);
    });
});
