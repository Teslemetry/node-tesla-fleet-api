import { describe, expect, it, vi } from "vitest";
import { Domain } from "@teslemetry/tesla-protocol/command/universal_message";
import { SessionInfo } from "@teslemetry/tesla-protocol/command/signatures";
import { Session } from "../src/signing/session.js";
import { deriveSharedKey, publicKeyFor } from "../src/signing/crypto.js";

// Fixed P-256 scalars used across this file and commands.test.ts, so a wire-format
// regression shows up as a changed HMAC tag rather than a changed key.
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");
const VEHICLE_PRIVATE_KEY = Buffer.from("10a0a7aeb5bcc3cad1d8dfe6edf4fb020910171e252c333a41484f565d646b72", "hex");
const VEHICLE_PUBLIC_KEY = publicKeyFor(VEHICLE_PRIVATE_KEY);

const GOLDEN_SHARED_SECRET = "5429a48f08b3ee8543a674deffa553070b6faef735e27ece841d46c66fb52933";
const GOLDEN_SHARED_KEY = "d2187658dfeca31bf5a01b2c2c240b20";
const GOLDEN_SESSION_HMAC_KEY = "3b425b48863d8de8801db7105f161f82e0568e809c755e33b880ffa87d4170dd";

describe("deriveSharedKey", () => {
    it("matches a pinned ECDH + SHA-1 golden vector", () => {
        const key = deriveSharedKey(OUR_PRIVATE_KEY, VEHICLE_PUBLIC_KEY);
        expect(key.toString("hex")).toBe(GOLDEN_SHARED_KEY);
        expect(key).toHaveLength(16);
    });

    it("is symmetric: both sides derive the same secret from each other's public key", () => {
        const ourPublicKey = publicKeyFor(OUR_PRIVATE_KEY);
        const ours = deriveSharedKey(OUR_PRIVATE_KEY, VEHICLE_PUBLIC_KEY);
        const theirs = deriveSharedKey(VEHICLE_PRIVATE_KEY, ourPublicKey);
        expect(ours.equals(theirs)).toBe(true);
    });

    it("produces different keys for different private keys", () => {
        const other = Buffer.alloc(32, 0x20);
        const a = deriveSharedKey(OUR_PRIVATE_KEY, VEHICLE_PUBLIC_KEY);
        const b = deriveSharedKey(other, VEHICLE_PUBLIC_KEY);
        expect(a.equals(b)).toBe(false);
    });
});

describe("publicKeyFor", () => {
    it("derives an uncompressed P-256 point (65 bytes, leading 0x04)", () => {
        const pub = publicKeyFor(OUR_PRIVATE_KEY);
        expect(pub).toHaveLength(65);
        expect(pub[0]).toBe(0x04);
    });
});

function sessionInfo(overrides: Partial<SessionInfo> = {}): SessionInfo {
    return SessionInfo.create({
        counter: 5,
        publicKey: VEHICLE_PUBLIC_KEY,
        epoch: Buffer.from("000102030405060708090a0b0c0d0e0f", "hex"),
        clockTime: Math.floor(Date.now() / 1000) - 3,
        ...overrides,
    });
}

describe("Session", () => {
    function makeSession() {
        return new Session(Domain.DOMAIN_VEHICLE_SECURITY, (vehiclePublicKey) => deriveSharedKey(OUR_PRIVATE_KEY, vehiclePublicKey));
    }

    it("is not ready before a handshake update", () => {
        const session = makeSession();
        expect(session.ready).toBe(false);
    });

    it("becomes ready after update() and derives the golden shared/HMAC keys", () => {
        const session = makeSession();
        session.update(sessionInfo());

        expect(session.ready).toBe(true);
        expect(session.sharedKey?.toString("hex")).toBe(GOLDEN_SHARED_KEY);
        expect(session.hmacKey?.toString("hex")).toBe(GOLDEN_SESSION_HMAC_KEY);
    });

    it("does not re-derive the shared key when the vehicle public key is unchanged", () => {
        const session = makeSession();
        session.update(sessionInfo({ counter: 1 }));
        const firstSharedKey = session.sharedKey;

        session.update(sessionInfo({ counter: 2 }));
        expect(session.sharedKey).toBe(firstSharedKey);
        expect(session.counter).toBe(2);
    });

    it("re-derives the shared key when the vehicle rotates its public key", () => {
        const session = makeSession();
        session.update(sessionInfo());
        const firstSharedKey = session.sharedKey;

        const otherVehiclePrivateKey = Buffer.from("10a0a7aeb5bcc3cad1d8dfe6edf4fb020910171e252c333a41484f565d646b73", "hex");
        const otherVehiclePublicKey = publicKeyFor(otherVehiclePrivateKey);
        session.update(sessionInfo({ publicKey: otherVehiclePublicKey }));

        expect(session.sharedKey?.equals(firstSharedKey!)).toBe(false);
    });

    it("throws when signing before the handshake has completed", () => {
        const session = makeSession();
        expect(() => session.hmacPersonalized()).toThrow(/handshake/i);
    });

    it("increments the counter and sets an expiry corrected for clock delta", () => {
        const session = makeSession();
        session.update(sessionInfo({ counter: 1, clockTime: Math.floor(Date.now() / 1000) - 100 }));

        const before = session.counter;
        const signed = session.hmacPersonalized();

        expect(session.counter).toBe(before + 1);
        expect(signed.counter).toBe(before + 1);
        expect(Buffer.from(signed.epoch).toString("hex")).toBe("000102030405060708090a0b0c0d0e0f");
        // expiresAt is expressed in the vehicle's own clock frame: with the
        // vehicle ~100s "behind" ours (delta ~= 100), expiresAt = now - delta
        // + 10 lands ~90s behind our clock, not ahead of it.
        const nowSec = Math.floor(Date.now() / 1000);
        expect(signed.expiresAt).toBeGreaterThan(nowSec - 95);
        expect(signed.expiresAt).toBeLessThan(nowSec - 85);
    });

    it("serializes concurrent withLock callers instead of interleaving them", async () => {
        const session = makeSession();
        const order: number[] = [];

        const slow = session.withLock(async () => {
            order.push(1);
            await new Promise((resolve) => setTimeout(resolve, 20));
            order.push(2);
        });
        const fast = session.withLock(() => {
            order.push(3);
        });

        await Promise.all([slow, fast]);
        expect(order).toEqual([1, 2, 3]);
    });

    it("releases the lock even when the callback throws", async () => {
        const session = makeSession();
        await expect(
            session.withLock(() => {
                throw new Error("boom");
            }),
        ).rejects.toThrow("boom");

        // A subsequent withLock call must not hang behind the failed one.
        const spy = vi.fn();
        await session.withLock(spy);
        expect(spy).toHaveBeenCalledOnce();
    });
});
