import crypto from "crypto";
import { Domain } from "@teslemetry/tesla-protocol/command/universal_message";
import {
    AESGCMPersonalizedSignatureData,
    HMACPersonalizedSignatureData,
    SessionInfo,
} from "@teslemetry/tesla-protocol/command/signatures";
import { SessionInfoAuthenticationFault } from "../exceptions.js";

/** Wire limit of the `counter` and `expires_at` fields. */
const UINT32_MAX = 0xffffffff;
/** Seconds a signed command stays valid. BLE can be slow, so AES-GCM allows longer. */
const HMAC_LIFETIME_S = 10;
const AES_GCM_LIFETIME_S = 30;

/** Response counters remembered per session, which bounds how far back a replay is caught. */
const RESPONSE_COUNTER_CACHE_SIZE = 256;

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
 * The vehicle's key is trusted once, at first contact, then pinned for the life
 * of the session, as in Tesla's Go SDK. ECDH is symmetric, so anyone who saw the
 * client's public key can tag a `SessionInfo` naming a key of their own: a tag
 * proves nothing about a key derived from the same reply. `trustedKeys` is the
 * only way a reply reaches key material, so once pinned it is verified with the
 * stored keys, and nothing clears the pin. A re-keyed vehicle needs a new instance.
 *
 * First contact itself is trust on first use. Deriving keys (`keysFor`) is still
 * split from committing them (`commit`), so a reply that fails its tag or carries
 * a whitelist rejection pins nothing. See `Commands.validate_msg`.
 *
 * A `Session` is not itself thread-safe; `withLock` serializes the
 * message-build step (which mutates `counter`) so concurrent commands on the
 * same domain cannot race on the same counter value.
 *
 * The derived keys are native private fields, read through accessors, so a
 * `JSON.stringify` or structured log of a session cannot reach them.
 */
export class Session {
    readonly domain: Domain;
    counter: number = 0;
    epoch?: Buffer;
    delta?: number;
    #publicKey?: Buffer;
    #keys?: SessionKeys;

    /** Clock time of the last *authenticated* SessionInfo committed for the current epoch, guarding against replay/rollback. */
    private lastAuthenticatedClockTime?: number;
    /** `(requestHash, counter)` pairs seen in this epoch, oldest first. */
    private responseCounters = new Set<string>();
    private queue: Promise<void> = Promise.resolve();

    constructor(
        domain: Domain,
        private readonly deriveSharedKey: (vehiclePublicKey: Buffer) => Buffer,
    ) {
        this.domain = domain;
    }

    /** The vehicle key pinned at first contact. There is deliberately no setter. */
    get publicKey(): Buffer | undefined {
        return this.#publicKey;
    }

    get sharedKey(): Buffer | undefined {
        return this.#keys?.sharedKey;
    }

    get hmacKey(): Buffer | undefined {
        return this.#keys?.hmacKey;
    }

    get sessionInfoKey(): Buffer | undefined {
        return this.#keys?.sessionInfoKey;
    }

    /** Whether the handshake has completed and commands can be signed. */
    get ready(): boolean {
        return this.epoch !== undefined && this.#keys !== undefined && this.delta !== undefined;
    }

    /**
     * Derive the shared key and its two HMAC sub-keys for a candidate vehicle
     * public key, without touching any session state. Pure and side-effect
     * free so a caller can verify authenticity first and discard the result
     * if verification fails. Verifying a reply goes through `trustedKeys`.
     */
    keysFor(vehiclePublicKey: Buffer): SessionKeys {
        const sharedKey = this.deriveSharedKey(vehiclePublicKey);
        const hmacKey = crypto.createHmac("sha256", sharedKey).update("authenticated command").digest();
        const sessionInfoKey = crypto.createHmac("sha256", sharedKey).update("session info").digest();
        return { sharedKey, hmacKey, sessionInfoKey };
    }

    /**
     * The keys to verify a reply naming `vehiclePublicKey` with: derived from it
     * at first contact, and the stored keys from then on, never derived again.
     * @throws SessionInfoAuthenticationFault when the session is pinned to another key.
     */
    trustedKeys(vehiclePublicKey: Buffer): SessionKeys {
        if (this.#publicKey === undefined || this.#keys === undefined) {
            return this.keysFor(vehiclePublicKey);
        }
        if (!this.#publicKey.equals(vehiclePublicKey)) {
            throw new SessionInfoAuthenticationFault(
                "Session info reply names a vehicle public key that has changed since first contact; discarded. " +
                    "If the vehicle was really re-keyed, build a new instance to trust it.",
            );
        }
        return this.#keys;
    }

    /**
     * Commit an already-authenticated `SessionInfo` plus its `trustedKeys`
     * result. Keys are adopted at first contact only: after that, `keys` is
     * ignored and a different public key is refused. Per the vehicle-command
     * protocol, the anti-replay counter must never roll back within the same
     * epoch, and a clock time that regresses within the same epoch marks the
     * reply as stale/replayed - returns `false` (without mutating any state) in
     * that case so the caller can reject it.
     * @throws SessionInfoAuthenticationFault, changing nothing, for a different public key, or a clock or counter that could not sign a single command.
     */
    commit(sessionInfo: SessionInfo, keys: SessionKeys): boolean {
        const trusted = this.#keys === undefined ? keys : this.trustedKeys(Buffer.from(sessionInfo.publicKey));
        const incomingEpoch = Buffer.from(sessionInfo.epoch);
        const sameEpoch = this.epoch !== undefined && this.epoch.equals(incomingEpoch);

        if (sameEpoch && this.lastAuthenticatedClockTime !== undefined && sessionInfo.clockTime < this.lastAuthenticatedClockTime) {
            return false;
        }
        if (sessionInfo.clockTime + AES_GCM_LIFETIME_S > UINT32_MAX || sessionInfo.counter >= UINT32_MAX) {
            throw new SessionInfoAuthenticationFault("Session info reply has a clock or counter no command could be signed with; discarded.");
        }

        this.counter = sameEpoch ? Math.max(this.counter, sessionInfo.counter) : sessionInfo.counter;
        this.epoch = incomingEpoch;
        this.delta = Math.floor(Date.now() / 1000) - sessionInfo.clockTime;
        this.lastAuthenticatedClockTime = sessionInfo.clockTime;
        this.#publicKey = Buffer.from(sessionInfo.publicKey);
        this.#keys = trusted;
        if (!sameEpoch) {
            this.responseCounters.clear();
        }
        return true;
    }

    /**
     * Record an authenticated response's counter for the request it answers.
     * @returns `false` if that pair was already seen, marking the response a replay.
     */
    record_response_counter(requestHash: Uint8Array, counter: number): boolean {
        const identity = `${Buffer.from(requestHash).toString("hex")}:${counter}`;
        if (this.responseCounters.has(identity)) {
            return false;
        }
        this.responseCounters.add(identity);
        if (this.responseCounters.size > RESPONSE_COUNTER_CACHE_SIZE) {
            this.responseCounters.delete(this.responseCounters.values().next().value as string);
        }
        return true;
    }

    /**
     * Advance the anti-replay counter for a command valid for `lifetimeSeconds`,
     * corrected for clock drift against the vehicle (`delta`). The clock keeps
     * running after `commit`, so its limit is checked here too; a session past it
     * recovers when the vehicle starts a new epoch.
     * @throws SessionInfoAuthenticationFault, leaving the counter alone, when either value would overflow its wire field.
     */
    private nextSignature(lifetimeSeconds: number): { epoch: Buffer; counter: number; expiresAt: number } {
        if (!this.ready || !this.epoch || this.delta === undefined) {
            throw new Error("Session is not ready: perform the handshake first.");
        }
        const expiresAt = Math.floor(Date.now() / 1000) - this.delta + lifetimeSeconds;
        if (expiresAt > UINT32_MAX || this.counter >= UINT32_MAX) {
            throw new SessionInfoAuthenticationFault("Session has reached the limit of the vehicle clock or counter, so nothing was signed.");
        }
        this.counter++;
        return { epoch: this.epoch, counter: this.counter, expiresAt };
    }

    /**
     * Fresh signature metadata for an HMAC-personalized command, which expires
     * 10 seconds from now.
     */
    hmacPersonalized(): HMACPersonalizedSignatureData {
        return HMACPersonalizedSignatureData.create(this.nextSignature(HMAC_LIFETIME_S));
    }

    /**
     * Fresh signature metadata for an AES-GCM-personalized command, with a
     * random nonce, which expires 30 seconds from now.
     */
    aesGcmPersonalized(): AESGCMPersonalizedSignatureData {
        return AESGCMPersonalizedSignatureData.create({ ...this.nextSignature(AES_GCM_LIFETIME_S), nonce: crypto.randomBytes(12) });
    }

    /**
     * Run `fn` with exclusive access to this session, queuing behind any
     * in-flight caller. Not reentrant: `fn` must not call `withLock` on this
     * session. Infotainment holds it for the message build only, and VCSEC for
     * the whole dispatch (see `Commands.dispatch`).
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
