import crypto from "crypto";

const CURVE = "prime256v1"; // NIST P-256, matches the vehicle-command protocol.
const AES_GCM_TAG_LENGTH = 16;

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

/** SHA-256 of a metadata string: the AAD of the protocol's AES-GCM operations. */
export function sha256(data: Uint8Array): Buffer {
    return crypto.createHash("sha256").update(data).digest();
}

/** AES-128-GCM with a detached 16-byte tag, as the vehicle-command protocol carries it. */
export function aesGcmEncrypt(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array, aad: Uint8Array): { ciphertext: Buffer; tag: Buffer } {
    const cipher = crypto.createCipheriv("aes-128-gcm", key, nonce, { authTagLength: AES_GCM_TAG_LENGTH });
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { ciphertext, tag: cipher.getAuthTag() };
}

/**
 * Open an AES-128-GCM message. `authTagLength` makes a tag of any other length
 * fail, where the default would accept one truncated by an attacker.
 * @throws Error when the tag does not verify.
 */
export function aesGcmDecrypt(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array, tag: Uint8Array, aad: Uint8Array): Buffer {
    const decipher = crypto.createDecipheriv("aes-128-gcm", key, nonce, { authTagLength: AES_GCM_TAG_LENGTH });
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Big-endian uint32, as used throughout the signed-command metadata tags. */
export function uint32BE(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
