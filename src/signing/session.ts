import crypto from "crypto";
import { Domain } from "@teslemetry/tesla-protocol/command/universal_message";
import {
    HMACPersonalizedSignatureData,
    SessionInfo,
} from "@teslemetry/tesla-protocol/command/signatures";

/** Key material derived (but not yet trusted/committed) for a candidate vehicle public key. */
export interface SessionKeys {
    sharedKey: Buffer;
    hmacKey: Buffer;
    sessionInfoKey: Buffer;
}

/**
 * Per-domain (VCSEC / Infotainment) signed-command session: tracks the
 * anti-replay counter/epoch handed out by the vehicle's handshake reply and
 * the HMAC keys derived from it.
 *
 * Deriving key material (`keysFor`) is split from committing it (`commit`)
 * because the caller must authenticate a `SessionInfo` reply - by verifying
 * its `session_info_tag` against the very keys derived here - *before*
 * trusting anything in it, including the vehicle public key the shared key
 * itself is derived from. See `Commands.validateAndUpdateSession`.
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
    sessionInfoKey?: Buffer;
    publicKey?: Buffer;

    /** Clock time of the last *authenticated* SessionInfo committed for the current epoch, guarding against replay/rollback. */
    private lastAuthenticatedClockTime?: number;
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
     * Derive the shared key and its two HMAC sub-keys for a candidate vehicle
     * public key, without touching any session state. Pure and side-effect
     * free so a caller can verify authenticity first and discard the result
     * if verification fails.
     */
    keysFor(vehiclePublicKey: Buffer): SessionKeys {
        const sharedKey = this.deriveSharedKey(vehiclePublicKey);
        const hmacKey = crypto.createHmac("sha256", sharedKey).update("authenticated command").digest();
        const sessionInfoKey = crypto.createHmac("sha256", sharedKey).update("session info").digest();
        return { sharedKey, hmacKey, sessionInfoKey };
    }

    /**
     * Commit an already-authenticated `SessionInfo` plus the `keysFor` result
     * derived from its public key. Per the vehicle-command protocol, the
     * anti-replay counter must never roll back within the same epoch, and a
     * clock time that regresses within the same epoch marks the reply as
     * stale/replayed - returns `false` (without mutating any state) in that
     * case so the caller can reject it.
     */
    commit(sessionInfo: SessionInfo, keys: SessionKeys): boolean {
        const incomingEpoch = Buffer.from(sessionInfo.epoch);
        const sameEpoch = this.epoch !== undefined && this.epoch.equals(incomingEpoch);

        if (sameEpoch && this.lastAuthenticatedClockTime !== undefined && sessionInfo.clockTime < this.lastAuthenticatedClockTime) {
            return false;
        }

        this.counter = sameEpoch ? Math.max(this.counter, sessionInfo.counter) : sessionInfo.counter;
        this.epoch = incomingEpoch;
        this.delta = Math.floor(Date.now() / 1000) - sessionInfo.clockTime;
        this.lastAuthenticatedClockTime = sessionInfo.clockTime;
        this.publicKey = Buffer.from(sessionInfo.publicKey);
        this.sharedKey = keys.sharedKey;
        this.hmacKey = keys.hmacKey;
        this.sessionInfoKey = keys.sessionInfoKey;
        return true;
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
