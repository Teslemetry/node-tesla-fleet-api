/**
 * Tesla.SS256: Schnorr signatures over P-256 and the compact JWS that carries
 * them, ported from `python-tesla-fleet-api`'s `tesla/jws.py`.
 *
 * Tesla signs messages for fleet-wide or offline delivery, such as a Fleet
 * Telemetry configuration, with Schnorr/P-256/SHA-256 (RFC 8235) using the EC
 * key the partner registered for signed commands, wrapped in a compact JWS with
 * `"alg": "Tesla.SS256"`. The scheme is Tesla's Go SDK's
 * (`teslamotors/vehicle-command`, `internal/schnorr`,
 * `internal/authentication/jwt.go`), and `test/jws.test.ts` checks it against
 * vectors that code produced.
 *
 * A signature is 96 bytes `V_x || V_y || r`, where `V = vG` is the public nonce
 * and `r = v - a*c (mod n)` for private key `a` and challenge `c`. The nonce `v`
 * is deterministic (RFC 6979 over SHA-256 of the message), so signing the same
 * message with the same key is reproducible. There is deliberately no low-`s`
 * normalisation: that is an ECDSA malleability fix, not part of this scheme, and
 * applying it would produce signatures Tesla rejects.
 */
import crypto from "crypto";
import { publicKeyFor } from "./crypto.js";

export const ALGORITHM = "Tesla.SS256";
export const TELEMETRY_AUDIENCE = "com.tesla.fleet.TelemetryClient";
export const SCALAR_LENGTH = 32;
export const SIGNATURE_LENGTH = 3 * SCALAR_LENGTH;

type AffinePoint = readonly [x: bigint, y: bigint];
/** `null` is the point at infinity. */
type Point = AffinePoint | null;

// NIST P-256 domain parameters (a = -3), as Go's crypto/elliptic.P256() reports them.
export const P = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
export const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
export const G: AffinePoint = [
    0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n,
    0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n,
];

function toBigInt(bytes: Uint8Array): bigint {
    return bytes.length === 0 ? 0n : BigInt(`0x${Buffer.from(bytes).toString("hex")}`);
}

function scalarBytes(value: bigint): Buffer {
    return Buffer.from(value.toString(16).padStart(2 * SCALAR_LENGTH, "0"), "hex");
}

/** `a mod m`, in `[0, m)` whatever the sign of `a`. */
function mod(a: bigint, m: bigint): bigint {
    const remainder = a % m;
    return remainder < 0n ? remainder + m : remainder;
}

/** The inverse of `a` modulo the prime `m`, by the extended Euclidean algorithm. */
function inverse(a: bigint, m: bigint): bigint {
    let [r0, r1] = [mod(a, m), m];
    let [s0, s1] = [1n, 0n];
    while (r1 !== 0n) {
        const quotient = r0 / r1;
        [r0, r1] = [r1, r0 - quotient * r1];
        [s0, s1] = [s1, s0 - quotient * s1];
    }
    return mod(s0, m);
}

/** Uncompressed SEC1 encoding: `0x04 || X || Y`. */
export function encodePoint(point: AffinePoint): Buffer {
    return Buffer.concat([Buffer.from([4]), scalarBytes(point[0]), scalarBytes(point[1])]);
}

function lengthValue(buffer: Uint8Array): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(buffer.length, 0);
    return Buffer.concat([length, buffer]);
}

/** SHA-256 over the length-prefixed generator, public nonce, signer key and message. */
function challenge(publicNonce: Uint8Array, publicKey: Uint8Array, message: Uint8Array): bigint {
    const digest = crypto
        .createHash("sha256")
        .update(lengthValue(encodePoint(G)))
        .update(lengthValue(publicNonce))
        .update(lengthValue(publicKey))
        .update(lengthValue(message))
        .digest();
    return toBigInt(digest);
}

function hmac(key: Uint8Array, ...data: Uint8Array[]): Buffer {
    const mac = crypto.createHmac("sha256", key);
    for (const part of data) {
        mac.update(part);
    }
    return mac.digest();
}

/** RFC 6979 section 3.2 nonce, specialised to P-256 with SHA-256 (hlen = qlen). */
export function deterministicNonce(scalar: Uint8Array, messageHash: Uint8Array): Buffer {
    const h1 = scalarBytes(toBigInt(messageHash) % N);
    const zero = Buffer.from([0]);
    const one = Buffer.from([1]);
    let k: Buffer = Buffer.alloc(32, 0);
    let v: Buffer = Buffer.alloc(32, 1);
    k = hmac(k, v, zero, scalar, h1);
    v = hmac(k, v);
    k = hmac(k, v, one, scalar, h1);
    v = hmac(k, v);
    while (true) {
        v = hmac(k, v);
        const candidate = toBigInt(v);
        if (candidate > 0n && candidate < N) {
            return v;
        }
        k = hmac(k, v, zero);
        v = hmac(k, v);
    }
}

/**
 * The 96-byte Tesla.SS256 Schnorr signature of `message`.
 *
 * The nonce point goes through OpenSSL, so only the public result of multiplying
 * a secret scalar is ever visible; the arithmetic on `r` is the one place a
 * secret meets `BigInt`, as it meets Python's `int`.
 * @param privateKey Raw 32-byte P-256 scalar.
 */
export function sign(privateKey: Uint8Array, message: Uint8Array): Buffer {
    if (privateKey.length !== SCALAR_LENGTH) {
        throw new Error("Tesla.SS256 requires a P-256 (SECP256R1) key.");
    }
    const key = Buffer.from(privateKey);
    const nonce = deterministicNonce(key, crypto.createHash("sha256").update(message).digest());
    const publicNonce = publicKeyFor(nonce);
    const c = challenge(publicNonce, publicKeyFor(key), message);
    const r = mod(toBigInt(nonce) - toBigInt(key) * c, N);
    return Buffer.concat([publicNonce.subarray(1), scalarBytes(r)]);
}

function add(p: Point, q: Point): Point {
    if (p === null) {
        return q;
    }
    if (q === null) {
        return p;
    }
    let slope: bigint;
    if (p[0] === q[0]) {
        if (mod(p[1] + q[1], P) === 0n) {
            return null;
        }
        slope = mod((3n * p[0] * p[0] - 3n) * inverse(2n * p[1], P), P);
    } else {
        slope = mod((q[1] - p[1]) * inverse(q[0] - p[0], P), P);
    }
    const x = mod(slope * slope - p[0] - q[0], P);
    return [x, mod(slope * (p[0] - x) - p[1], P)];
}

function multiply(k: bigint, point: Point): Point {
    let result: Point = null;
    let addend = point;
    for (let remaining = k; remaining > 0n; remaining >>= 1n) {
        if (remaining & 1n) {
            result = add(result, addend);
        }
        addend = add(addend, addend);
    }
    return result;
}

function decodePublicKey(publicKey: Uint8Array): AffinePoint | null {
    if (publicKey.length !== 1 + 2 * SCALAR_LENGTH) {
        return null;
    }
    try {
        // Rejects anything that is not a point on the curve.
        crypto.ECDH.convertKey(publicKey, "prime256v1");
    } catch {
        return null;
    }
    return [toBigInt(publicKey.subarray(1, 33)), toBigInt(publicKey.subarray(33))];
}

/**
 * Check a Tesla.SS256 signature against a 65-byte uncompressed public key.
 *
 * Verification uses only public values, so the plain `BigInt` point arithmetic
 * here is not a side-channel concern.
 */
export function verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    if (signature.length !== SIGNATURE_LENGTH) {
        return false;
    }
    const point = decodePublicKey(publicKey);
    if (point === null) {
        return false;
    }
    const nonceBytes = Buffer.from(signature.subarray(0, 2 * SCALAR_LENGTH));
    const r = toBigInt(signature.subarray(2 * SCALAR_LENGTH));
    const c = challenge(Buffer.concat([Buffer.from([4]), nonceBytes]), publicKey, message);
    const expected = add(multiply(c, point), multiply(r, G));
    return expected !== null && encodePoint(expected).subarray(1).equals(nonceBytes);
}

function base64Url(data: Uint8Array | string): string {
    return Buffer.from(data).toString("base64url");
}

/**
 * Sorted, compact, ASCII-only JSON: the bytes Python's
 * `json.dumps(value, sort_keys=True, separators=(",", ":"))` produces. The sort
 * happens here rather than on a new object, whose integer-like keys JavaScript
 * would reorder.
 */
function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => canonicalJson(item ?? null)).join(",")}]`;
    }
    if (typeof value === "object" && value !== null) {
        const members = Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, item]) => `${canonicalJson(key)}:${canonicalJson(item)}`);
        return `{${members.join(",")}}`;
    }
    return JSON.stringify(value).replace(/[\u007f-￿]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

/**
 * A compact Tesla.SS256 JWS over `claims`.
 *
 * Like the Go SDK, `iss` is set to the standard (padded) base64 of the signer's
 * uncompressed public key and `aud` to `audience`, overwriting any caller-supplied
 * values.
 * @param privateKey Raw 32-byte P-256 scalar.
 */
export function sign_jws(privateKey: Uint8Array, claims: Readonly<Record<string, unknown>>, audience: string): string {
    const payload = { ...claims, iss: publicKeyFor(Buffer.from(privateKey)).toString("base64"), aud: audience };
    const signingInput = `${base64Url(canonicalJson({ alg: ALGORITHM, typ: "JWT" }))}.${base64Url(canonicalJson(payload))}`;
    return `${signingInput}.${base64Url(sign(privateKey, Buffer.from(signingInput)))}`;
}

/** The JWS token `fleet_telemetry_config_jws` expects for `config`. */
export function sign_fleet_telemetry_config(privateKey: Uint8Array, config: Readonly<Record<string, unknown>>): string {
    return sign_jws(privateKey, config, TELEMETRY_AUDIENCE);
}
