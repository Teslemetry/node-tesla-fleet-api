import crypto from "crypto";

const CURVE = "prime256v1"; // NIST P-256, matches the vehicle-command protocol.

/** Derive the uncompressed public key point for a raw P-256 private scalar. */
export function publicKeyFor(privateKey: Buffer): Buffer {
    const ecdh = crypto.createECDH(CURVE);
    ecdh.setPrivateKey(privateKey);
    return ecdh.getPublicKey();
}

/**
 * Derive the 16-byte signed-command shared key: ECDH(ourPrivate, vehiclePublic),
 * then SHA-1 truncated to 16 bytes - matching the vehicle-command protocol
 * (not a general-purpose KDF, do not reuse this for anything else).
 */
export function deriveSharedKey(privateKey: Buffer, vehiclePublicKey: Buffer): Buffer {
    const ecdh = crypto.createECDH(CURVE);
    ecdh.setPrivateKey(privateKey);
    const secret = ecdh.computeSecret(vehiclePublicKey);
    return crypto.createHash("sha1").update(secret).digest().subarray(0, 16);
}

/** Big-endian uint32, as used throughout the signed-command metadata tags. */
export function uint32BE(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
