import crypto from "node:crypto";
import { open, readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { PrivateKeyError } from "../exceptions.js";
import { publicKeyFor } from "./crypto.js";

/** Read a key file for this long while another process finishes writing it. */
const KEY_READ_RETRY_TIMEOUT_MS = 1000;
const KEY_READ_RETRY_INTERVAL_MS = 50;

type KeyKind = "ec" | "rsa";

const KIND_NAMES: Record<KeyKind, string> = { ec: "an EC P-256 private key", rsa: "an RSA private key" };

/** Whether `error` is the given Node system error, e.g. `ENOENT`. */
function isSystemError(error: unknown, code: string): boolean {
    return (error as NodeJS.ErrnoException | undefined)?.code === code;
}

/**
 * OpenSSL's error for a missing passphrase differs across Node versions
 * (`ERR_MISSING_PASSPHRASE`, `ERR_OSSL_CRYPTO_INTERRUPTED_OR_CANCELLED`), so
 * the PEM's own markers decide.
 */
function isEncryptedPem(pem: string | Buffer): boolean {
    return /-----BEGIN ENCRYPTED PRIVATE KEY-----|Proc-Type:\s*4,ENCRYPTED/.test(pem.toString("latin1"));
}

/**
 * Parse a PEM as a private key of `kind`. A raw scalar carries no curve, so an
 * EC key on any curve but P-256 is the wrong type here. `subject` names the
 * source in errors; the key material never reaches one.
 */
function parsePrivateKey(pem: string | Buffer, kind: KeyKind, subject: string): crypto.KeyObject {
    let key: crypto.KeyObject;
    try {
        key = crypto.createPrivateKey(pem);
    } catch (error) {
        if (isEncryptedPem(pem)) {
            throw new PrivateKeyError("encrypted", `${subject} is encrypted`, { cause: error });
        }
        throw new PrivateKeyError("malformed", `${subject} is not a valid PEM private key`, { cause: error });
    }
    const matches =
        key.asymmetricKeyType === kind && (kind === "rsa" || key.asymmetricKeyDetails?.namedCurve === "prime256v1");
    if (!matches) {
        throw new PrivateKeyError("wrong_type", `${subject} is not ${KIND_NAMES[kind]}`);
    }
    return key;
}

/**
 * Read and parse a key file, waiting out one that is malformed only because
 * another process is still writing it.
 */
async function loadKeyFile(path: string, kind: KeyKind): Promise<crypto.KeyObject> {
    const deadline = performance.now() + KEY_READ_RETRY_TIMEOUT_MS;
    while (true) {
        let pem: Buffer;
        try {
            pem = await readFile(path);
        } catch (error) {
            throw new PrivateKeyError("unreadable", `Could not read private key file at ${path}`, { cause: error });
        }
        try {
            return parsePrivateKey(pem, kind, `Private key file at ${path}`);
        } catch (error) {
            if ((error as PrivateKeyError).reason !== "malformed" || performance.now() >= deadline) {
                throw error;
            }
            await sleep(KEY_READ_RETRY_INTERVAL_MS);
        }
    }
}

/**
 * Load the key at `path`, or create it. The file is born exclusively at mode
 * 0600, so it is never world-readable; `chmod` covers a umask stricter than
 * that mode. A process that loses the create race reads the winner's file.
 */
async function loadOrCreateKeyFile(
    path: string,
    kind: KeyKind,
    generate: () => Promise<string>,
): Promise<crypto.KeyObject> {
    try {
        return await loadKeyFile(path, kind);
    } catch (error) {
        if (!isSystemError((error as PrivateKeyError).cause, "ENOENT")) {
            throw error;
        }
    }

    const pem = await generate();
    let file;
    try {
        file = await open(path, "wx", 0o600);
    } catch (error) {
        if (isSystemError(error, "EEXIST")) {
            return loadKeyFile(path, kind);
        }
        throw error;
    }
    try {
        await file.chmod(0o600);
        await file.writeFile(pem);
    } finally {
        await file.close();
    }
    return parsePrivateKey(pem, kind, `Private key file at ${path}`);
}

/** The raw 32-byte scalar of a P-256 key. JWK pads `d` to the field size, so leading zeros survive. */
function rawScalar(key: crypto.KeyObject): Buffer {
    return Buffer.from(key.export({ format: "jwk" }).d as string, "base64url");
}

/**
 * Get or create the P-256 key file at `path`.
 * @returns The raw 32-byte private key `Commands` takes.
 * @throws PrivateKeyError for an existing file that cannot be used.
 */
export async function ecPrivateKeyFile(path: string): Promise<Buffer> {
    return rawScalar(await loadOrCreateKeyFile(path, "ec", generate_ec_private_key_pem));
}

/**
 * Get or create the RSA key file at `path`.
 * @param key_size Modulus length in bits for a new key.
 * @throws PrivateKeyError for an existing file that cannot be used.
 */
export function rsaPrivateKeyFile(path: string, key_size: number): Promise<crypto.KeyObject> {
    return loadOrCreateKeyFile(path, "rsa", () => generate_rsa_private_key_pem(key_size));
}

/** Generate a P-256 private key, as the SEC1 PEM Python's `get_private_key` writes. */
export function generate_ec_private_key_pem(): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair(
            "ec",
            {
                namedCurve: "P-256",
                publicKeyEncoding: { type: "spki", format: "pem" },
                privateKeyEncoding: { type: "sec1", format: "pem" },
            },
            (error, _publicKey, privateKey) => (error ? reject(error) : resolve(privateKey)),
        );
    });
}

/**
 * Generate an RSA private key off the event loop, as the PKCS#1 PEM Python's
 * `get_rsa_private_key` writes.
 * @param modulusLength Key size in bits; 4096 is what Powerwall v1r expects.
 */
export function generate_rsa_private_key_pem(modulusLength: number = 4096): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair(
            "rsa",
            {
                modulusLength,
                publicExponent: 65537,
                publicKeyEncoding: { type: "spki", format: "pem" },
                privateKeyEncoding: { type: "pkcs1", format: "pem" },
            },
            (error, _publicKey, privateKey) => (error ? reject(error) : resolve(privateKey)),
        );
    });
}

/**
 * The raw 32-byte `Buffer` that `Commands` takes, from a P-256 PEM held in
 * memory.
 * @throws PrivateKeyError when the PEM cannot be used.
 */
export function ec_private_key_from_pem(pem: string | Buffer): Buffer {
    return rawScalar(parsePrivateKey(pem, "ec", "Private key PEM"));
}

/**
 * The RSA public key in DER PKCS#1 form, the format an energy gateway expects
 * when registering an authorized client, from a private key PEM held in memory.
 * @throws PrivateKeyError when the PEM cannot be used.
 */
export function rsa_public_der_pkcs1(pem: string | Buffer): Buffer {
    return rsaPublicDerPkcs1(parsePrivateKey(pem, "rsa", "Private key PEM"));
}

export function rsaPublicDerPkcs1(key: crypto.KeyObject): Buffer {
    return crypto.createPublicKey(key).export({ type: "pkcs1", format: "der" });
}

/** The public key of a raw P-256 private key, as a `KeyObject` for serialization. */
export function ecPublicKey(privateKey: Buffer): crypto.KeyObject {
    const point = publicKeyFor(privateKey);
    return crypto.createPublicKey({
        key: {
            kty: "EC",
            crv: "P-256",
            x: point.subarray(1, 33).toString("base64url"),
            y: point.subarray(33).toString("base64url"),
        },
        format: "jwk",
    });
}
