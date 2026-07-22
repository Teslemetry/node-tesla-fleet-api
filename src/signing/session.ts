import crypto from "crypto";
import { Domain } from "@teslemetry/tesla-protocol/command/universal_message";
import {
    HMACPersonalizedSignatureData,
    SessionInfo,
} from "@teslemetry/tesla-protocol/command/signatures";

/**
 * Per-domain (VCSEC / Infotainment) signed-command session: tracks the
 * anti-replay counter/epoch handed out by the vehicle's handshake reply and
 * the HMAC key derived from it.
 *
 * A `Session` is not itself thread-safe; `withLock` serializes the
 * message-build step (which mutates `counter`) so concurrent commands on the
 * same domain cannot race on the same counter value.
 */
export class Session {
    readonly domain: Domain;
    counter: number = 0;
    epoch?: Buffer;
    delta?: number;
    sharedKey?: Buffer;
    hmacKey?: Buffer;
    publicKey?: Buffer;

    private queue: Promise<void> = Promise.resolve();

    constructor(
        domain: Domain,
        private readonly deriveSharedKey: (vehiclePublicKey: Buffer) => Buffer,
    ) {
        this.domain = domain;
    }

    /** Whether the handshake has completed and commands can be signed. */
    get ready(): boolean {
        return this.epoch !== undefined && this.hmacKey !== undefined && this.delta !== undefined;
    }

    /**
     * Absorb a vehicle `SessionInfo` (from a handshake reply or piggy-backed
     * on any signed-command reply). The shared key is only re-derived when the
     * vehicle's public key has changed, so an unrelated counter/epoch refresh
     * does not force a redundant ECDH.
     */
    update(sessionInfo: SessionInfo): void {
        this.counter = sessionInfo.counter;
        this.epoch = Buffer.from(sessionInfo.epoch);
        this.delta = Math.floor(Date.now() / 1000) - sessionInfo.clockTime;

        const vehiclePublicKey = Buffer.from(sessionInfo.publicKey);
        if (!this.publicKey || !this.publicKey.equals(vehiclePublicKey)) {
            this.publicKey = vehiclePublicKey;
            this.sharedKey = this.deriveSharedKey(vehiclePublicKey);
            this.hmacKey = crypto
                .createHmac("sha256", this.sharedKey)
                .update("authenticated command")
                .digest();
        }
    }

    /**
     * Advance the anti-replay counter and return fresh signature metadata for
     * an HMAC-personalized command. The command expires 10 seconds from now,
     * corrected for clock drift against the vehicle (`delta`).
     */
    hmacPersonalized(): HMACPersonalizedSignatureData {
        if (!this.ready || !this.epoch || this.delta === undefined) {
            throw new Error("Session is not ready: perform the handshake first.");
        }
        this.counter++;
        return HMACPersonalizedSignatureData.create({
            epoch: this.epoch,
            counter: this.counter,
            expiresAt: Math.floor(Date.now() / 1000) - this.delta + 10,
        });
    }

    /**
     * Run `fn` with exclusive access to this session, queuing behind any
     * in-flight caller. Held only for as long as `fn` takes - callers should
     * keep it scoped to the synchronous message-build step, not a full
     * network round trip.
     */
    async withLock<T>(fn: () => T | Promise<T>): Promise<T> {
        const previous = this.queue;
        let release!: () => void;
        this.queue = new Promise<void>((resolve) => {
            release = resolve;
        });
        await previous.catch((): void => undefined);
        try {
            return await fn();
        } finally {
            release();
        }
    }
}
