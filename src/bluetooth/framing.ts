import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { FromVCSECMessage } from "@teslemetry/tesla-protocol/command/vcsec";
import { MAX_FRAME_SIZE, STALE_CHUNK_TIMEOUT_MS } from "./constants.js";

/** Prefix a payload with its big-endian 2-byte length, which counts the payload only. */
export function prependLength(message: Uint8Array): Buffer {
    const header = Buffer.alloc(2);
    header.writeUInt16BE(message.length);
    return Buffer.concat([header, message]);
}

/**
 * Cut a frame into the writes that carry it.
 * @param maxWriteSize Largest bytes per write. `null` means the backend accepts a full frame, as Python's do.
 */
export function splitFrame(frame: Uint8Array, maxWriteSize: number | null): Uint8Array[] {
    if (maxWriteSize === null) {
        return [frame];
    }
    if (!Number.isInteger(maxWriteSize) || maxWriteSize <= 0) {
        throw new RangeError(`maxWriteSize must be a positive integer, got ${maxWriteSize}.`);
    }
    const chunks: Uint8Array[] = [];
    for (let start = 0; start < frame.length; start += maxWriteSize) {
        chunks.push(frame.subarray(start, start + maxWriteSize));
    }
    return chunks;
}

/** Whether a decoded `RoutableMessage` holds nothing: ts-proto's shape for "no known field". */
function hasNoKnownField(message: RoutableMessage): boolean {
    return (
        message.toDestination === undefined &&
        message.fromDestination === undefined &&
        message.protobufMessageAsBytes === undefined &&
        message.sessionInfoRequest === undefined &&
        message.sessionInfo === undefined &&
        message.signatureData === undefined &&
        message.signedMessageStatus === undefined &&
        message.messageFrame === undefined &&
        message.requestUuid.length === 0 &&
        message.uuid.length === 0 &&
        message.flags === 0
    );
}

/**
 * Parse one reassembled frame, wrapping a bare VCSEC message.
 *
 * On a fresh link the car sends `FromVCSECMessage` frames, such as a repeating
 * `authenticationRequest`, with no `RoutableMessage` around them. None of its
 * field numbers exist on `RoutableMessage`, so one parses as a message with no
 * known field. It is wrapped as an unaddressed VCSEC message, so it reaches the
 * broadcast listeners as a wrapped one would.
 * @throws When the frame is not a `RoutableMessage`.
 */
export function parseFrame(payload: Uint8Array): RoutableMessage {
    const message = RoutableMessage.decode(payload);
    if (payload.length === 0 || !hasNoKnownField(message)) {
        return message;
    }
    let vcsec: FromVCSECMessage;
    try {
        vcsec = FromVCSECMessage.decode(payload);
    } catch {
        return message;
    }
    if (!Object.values(vcsec).some((field) => field !== undefined)) {
        return message;
    }
    return RoutableMessage.create({
        fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY },
        protobufMessageAsBytes: payload,
    });
}

/**
 * Reassembles BLE notifications into length-prefixed messages.
 *
 * One notification can hold part of a message, one message, or several. A
 * message that cannot be decoded drops the current notification and resyncs at
 * the next one. A partial message is also dropped if its next chunk does not
 * arrive within `STALE_CHUNK_TIMEOUT_MS`.
 */
export class ReassemblingBuffer {
    private buffer: Buffer = Buffer.alloc(0);
    private expectedLength: number | null = null;
    /** Where each notification still in `buffer` starts: the only places a resync can land. */
    private packetStarts: number[] = [];
    private lastChunkAt: number | null = null;
    private readonly now: () => number;

    /**
     * @param callback Called with each parsed message. Its errors are not caught.
     * @param now The monotonic clock, in milliseconds. Injectable for tests.
     */
    constructor(
        private readonly callback: (message: RoutableMessage) => void,
        now: () => number = () => performance.now(),
    ) {
        this.now = now;
    }

    /** Take one notification and emit every message it completes. Malformed bytes never throw. */
    receive(chunk: Uint8Array): void {
        const now = this.now();
        if (this.buffer.length > 0 && this.lastChunkAt !== null && now - this.lastChunkAt > STALE_CHUNK_TIMEOUT_MS) {
            this.buffer = Buffer.alloc(0);
            this.expectedLength = null;
            this.packetStarts = [];
        }
        this.lastChunkAt = now;

        this.packetStarts.push(this.buffer.length);
        this.buffer = Buffer.concat([this.buffer, chunk]);

        for (;;) {
            if (this.expectedLength === null && this.buffer.length >= 2) {
                this.expectedLength = this.buffer.readUInt16BE(0) + 2;
            }
            if (this.expectedLength === null) {
                return;
            }
            if (this.expectedLength > MAX_FRAME_SIZE) {
                this.discardPacket();
                continue;
            }
            if (this.buffer.length < this.expectedLength) {
                return;
            }

            let message: RoutableMessage;
            try {
                message = parseFrame(this.buffer.subarray(2, this.expectedLength));
            } catch {
                this.discardPacket();
                continue;
            }
            const consumed = this.expectedLength;
            this.buffer = this.buffer.subarray(consumed);
            this.packetStarts = this.packetStarts.filter((start) => start >= consumed).map((start) => start - consumed);
            this.expectedLength = null;
            this.callback(message);
        }
    }

    /** Drop the current notification and resync at the next, if there is one. */
    private discardPacket(): void {
        this.packetStarts.shift();
        const next = this.packetStarts[0];
        if (next === undefined) {
            this.buffer = Buffer.alloc(0);
            this.packetStarts = [];
        } else {
            this.buffer = this.buffer.subarray(next);
            this.packetStarts = this.packetStarts.map((start) => start - next);
        }
        this.expectedLength = null;
    }
}
