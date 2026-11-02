import crypto from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspect } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LibraryError, PrivateKeyError } from "../src/exceptions.js";
import {
    TeslaFleetApi,
    Teslemetry,
    ec_private_key_from_pem,
    generate_ec_private_key_pem,
    generate_rsa_private_key_pem,
    rsa_public_der_pkcs1,
} from "../src/index.js";
import {
    EC_PEM,
    EC_PEM_ENCRYPTED,
    EC_PKCS8_ENCRYPTED,
    EC_PUBLIC_DER_SPKI_B64,
    EC_PUBLIC_PEM,
    EC_PUBLIC_POINT,
    EC_RAW,
    P384_PEM,
    RSA_PEM,
    RSA_PEM_ENCRYPTED,
    RSA_PKCS8_PEM,
    RSA_PUBLIC_DER_PKCS1_B64,
    RSA_PUBLIC_PEM,
} from "./fixtures/keys.js";

const VIN = "5YJXCAE43LF123456";
const RSA_BITS = 1024;
const TOKEN = "access-token-0123456789";

function makeApi(): TeslaFleetApi {
    return new TeslaFleetApi({ accessToken: TOKEN, region: "na" });
}

async function modeOf(path: string): Promise<number> {
    return (await stat(path)).mode & 0o777;
}

/** Thrown by `fn`, which must reject with a `PrivateKeyError`. */
async function keyError(fn: () => Promise<unknown>): Promise<PrivateKeyError> {
    const error = await fn().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PrivateKeyError);
    return error as PrivateKeyError;
}

/** Run `fn` with a process umask in force. */
async function withUmask<T>(mask: number, fn: () => Promise<T>): Promise<T> {
    const old = process.umask(mask);
    try {
        return await fn();
    } finally {
        process.umask(old);
    }
}

let dir: string;
let ecPath: string;
let rsaPath: string;

beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "tesla-keys-"));
    ecPath = join(dir, "private_key.pem");
    rsaPath = join(dir, "tedapi_rsa_private.pem");
});

afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
});

// Python test_tesla_private_key.py, GetPrivateKeyPermissionsTests
describe("get_private_key", () => {
    it("returns the raw 32-byte key and keeps it", async () => {
        const api = makeApi();
        const key = await api.get_private_key(ecPath);
        expect(Buffer.isBuffer(key)).toBe(true);
        expect(key).toHaveLength(32);
        expect(api.private_key).toBe(key);
        expect(api.has_private_key).toBe(true);
    });

    it("leaves the access token alone, for a new and for an existing file (DEF-4)", async () => {
        const api = makeApi();
        await api.get_private_key(ecPath);
        await api.get_private_key(ecPath);
        expect(api.accessToken).toBe(TOKEN);
    });

    it("creates an owner-only file", async () => {
        await makeApi().get_private_key(ecPath);
        expect(await modeOf(ecPath)).toBe(0o600);
    });

    it("creates an owner-only file under a restrictive umask", async () => {
        await withUmask(0o777, () => makeApi().get_private_key(ecPath));
        expect(await modeOf(ecPath)).toBe(0o600);
    });

    it("reads an existing key back unchanged", async () => {
        const created = await makeApi().get_private_key(ecPath);
        const before = await readFile(ecPath);

        const read = await makeApi().get_private_key(ecPath);

        expect(read.equals(created)).toBe(true);
        expect((await readFile(ecPath)).equals(before)).toBe(true);
        expect(await modeOf(ecPath)).toBe(0o600);
    });

    it("gives concurrent creators the winner's key", async () => {
        const keys = await Promise.all([1, 2, 3, 4].map(() => makeApi().get_private_key(ecPath)));
        const onDisk = ec_private_key_from_pem(await readFile(ecPath));
        for (const key of keys) {
            expect(key.equals(onDisk)).toBe(true);
        }
    });

    it("waits for another process to finish writing an existing file", async () => {
        await writeFile(ecPath, "", { mode: 0o600 });
        const writer = new Promise((resolve) => setTimeout(resolve, 100)).then(() => writeFile(ecPath, EC_PEM));

        const key = await makeApi().get_private_key(ecPath);

        await writer;
        expect(key.toString("hex")).toBe(EC_RAW);
    });

    it("surfaces a failure to create the file", async () => {
        await expect(makeApi().get_private_key(join(dir, "missing", "key.pem"))).rejects.toMatchObject({ code: "ENOENT" });
    });
});

// Python test_tesla_private_key.py, GetRsaPrivateKeyPermissionsTests
describe("get_rsa_private_key", () => {
    it("returns the key and keeps it", async () => {
        const api = makeApi();
        const key = await api.get_rsa_private_key(rsaPath, RSA_BITS);
        expect(key.asymmetricKeyType).toBe("rsa");
        expect(key.asymmetricKeyDetails?.modulusLength).toBe(RSA_BITS);
        expect(api.rsa_private_key).toBe(key);
        expect(api.has_rsa_private_key).toBe(true);
    });

    it("creates an owner-only file", async () => {
        await makeApi().get_rsa_private_key(rsaPath, RSA_BITS);
        expect(await modeOf(rsaPath)).toBe(0o600);
    });

    it("creates an owner-only file under a restrictive umask", async () => {
        await withUmask(0o777, () => makeApi().get_rsa_private_key(rsaPath, RSA_BITS));
        expect(await modeOf(rsaPath)).toBe(0o600);
    });

    it("reads an existing key back unchanged", async () => {
        const api = makeApi();
        await api.get_rsa_private_key(rsaPath, RSA_BITS);
        const reader = makeApi();
        await reader.get_rsa_private_key(rsaPath, RSA_BITS);
        expect(reader.rsa_public_pem).toBe(api.rsa_public_pem);
        expect(await modeOf(rsaPath)).toBe(0o600);
    });

    it("gives concurrent creators the winner's key", async () => {
        const apis = [makeApi(), makeApi(), makeApi()];
        await Promise.all(apis.map((api) => api.get_rsa_private_key(rsaPath, RSA_BITS)));
        const onDisk = rsa_public_der_pkcs1(await readFile(rsaPath));
        for (const api of apis) {
            expect(api.rsa_public_der_pkcs1.equals(onDisk)).toBe(true);
        }
    });

    it("waits for another process to finish writing an existing file", async () => {
        await writeFile(rsaPath, "", { mode: 0o600 });
        const writer = new Promise((resolve) => setTimeout(resolve, 100)).then(() => writeFile(rsaPath, RSA_PEM));
        const api = makeApi();

        await api.get_rsa_private_key(rsaPath, RSA_BITS);

        await writer;
        expect(api.rsa_public_pem).toBe(RSA_PUBLIC_PEM);
    });

    it("does not block the event loop while generating", async () => {
        let ticks = 0;
        const heart = setInterval(() => ticks++, 10);
        try {
            await makeApi().get_rsa_private_key(rsaPath, 4096);
        } finally {
            clearInterval(heart);
        }
        expect(ticks).toBeGreaterThan(5);
    }, 60_000);
});

// Python test_tesla_private_key.py, PrivateKeyErrorTests
describe("PrivateKeyError", () => {
    const loaders = [
        ["EC", () => ecPath, (path: string) => makeApi().get_private_key(path), RSA_PEM, EC_PEM_ENCRYPTED],
        ["RSA", () => rsaPath, (path: string) => makeApi().get_rsa_private_key(path, RSA_BITS), EC_PEM, RSA_PEM_ENCRYPTED],
    ] as const;

    it.each(loaders)("%s loader: unreadable", async (_name, path, load) => {
        await mkdir(path());
        const error = await keyError(() => load(path()));
        expect(error.reason).toBe("unreadable");
        expect(error.cause).toMatchObject({ code: "EISDIR" });
        expect(error.message).toContain(path());
    });

    it.each(loaders)("%s loader: malformed", async (_name, path, load) => {
        await writeFile(path(), "not a pem file");
        const error = await keyError(() => load(path()));
        expect(error.reason).toBe("malformed");
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.message).toContain(path());
    });

    it.each(loaders)("%s loader: encrypted", async (_name, path, load, _other, encrypted) => {
        await writeFile(path(), encrypted);
        const error = await keyError(() => load(path()));
        expect(error.reason).toBe("encrypted");
        expect(error.cause).toBeInstanceOf(Error);
        expect(error.message).toContain(path());
    });

    it.each(loaders)("%s loader: wrong_type", async (_name, path, load, other) => {
        await writeFile(path(), other);
        const error = await keyError(() => load(path()));
        expect(error.reason).toBe("wrong_type");
        expect(error.cause).toBeUndefined();
        expect(error.message).toContain(path());
    });

    it("is a LibraryError", () => {
        expect(new PrivateKeyError("malformed", "x")).toBeInstanceOf(LibraryError);
    });

    it("recognizes encrypted PKCS#8", async () => {
        await writeFile(ecPath, EC_PKCS8_ENCRYPTED);
        expect((await keyError(() => makeApi().get_private_key(ecPath))).reason).toBe("encrypted");
    });

    it("refuses an EC key on another curve, which a raw scalar could not represent", async () => {
        await writeFile(ecPath, P384_PEM);
        expect((await keyError(() => makeApi().get_private_key(ecPath))).reason).toBe("wrong_type");
    });

    it("never puts key material in an error", async () => {
        const body = EC_PEM.split("\n")[1];
        const error = await keyError(async () => rsa_public_der_pkcs1(EC_PEM));
        expect(inspect(error)).not.toContain(body);
    });
});

describe("Python compatibility", () => {
    it("loads a PEM from Python's get_private_key", async () => {
        await writeFile(ecPath, EC_PEM);
        const api = makeApi();
        expect((await api.get_private_key(ecPath)).toString("hex")).toBe(EC_RAW);
    });

    it("loads a PEM from Python's get_rsa_private_key", async () => {
        await writeFile(rsaPath, RSA_PEM);
        const api = makeApi();
        await api.get_rsa_private_key(rsaPath);
        expect(api.rsa_public_der_pkcs1_b64).toBe(RSA_PUBLIC_DER_PKCS1_B64);
    });

    it("writes the same PEM forms as Python", async () => {
        await makeApi().get_private_key(ecPath);
        await makeApi().get_rsa_private_key(rsaPath, RSA_BITS);
        expect(await readFile(ecPath, "utf8")).toMatch(/^-----BEGIN EC PRIVATE KEY-----\n/);
        expect(await readFile(rsaPath, "utf8")).toMatch(/^-----BEGIN RSA PRIVATE KEY-----\n/);
    });

    it("matches Python's EC public key bytes", async () => {
        const api = makeApi();
        await writeFile(ecPath, EC_PEM);
        await api.get_private_key(ecPath);
        expect(api.public_pem).toBe(EC_PUBLIC_PEM);
        expect(api.public_uncompressed_point).toBe(EC_PUBLIC_POINT);
        expect(api.ec_public_der_spki_b64).toBe(EC_PUBLIC_DER_SPKI_B64);
        expect(api.ec_public_der_spki.equals(Buffer.from(EC_PUBLIC_DER_SPKI_B64, "base64"))).toBe(true);
    });

    it("matches Python's RSA public key bytes", async () => {
        const api = makeApi();
        await writeFile(rsaPath, RSA_PEM);
        await api.get_rsa_private_key(rsaPath);
        expect(api.rsa_public_pem).toBe(RSA_PUBLIC_PEM);
        expect(api.rsa_public_der_pkcs1.equals(Buffer.from(RSA_PUBLIC_DER_PKCS1_B64, "base64"))).toBe(true);
    });
});

describe("public key properties", () => {
    it("need a key to be set", () => {
        const api = makeApi();
        expect(api.has_private_key).toBe(false);
        expect(api.has_rsa_private_key).toBe(false);
        expect(() => api.public_pem).toThrow(new LibraryError("Private key is not set"));
        expect(() => api.public_uncompressed_point).toThrow(new LibraryError("Private key is not set"));
        expect(() => api.ec_public_der_spki).toThrow(new LibraryError("EC private key is not set"));
        expect(() => api.ec_public_der_spki_b64).toThrow(new LibraryError("EC private key is not set"));
        expect(() => api.rsa_public_der_pkcs1).toThrow(new LibraryError("RSA private key is not set"));
        expect(() => api.rsa_public_der_pkcs1_b64).toThrow(new LibraryError("RSA private key is not set"));
        expect(() => api.rsa_public_pem).toThrow(new LibraryError("RSA private key is not set"));
    });

    it("work on a key held in memory, as Homey does", () => {
        const api = makeApi();
        api.private_key = ec_private_key_from_pem(EC_PEM);
        api.rsa_private_key = crypto.createPrivateKey(RSA_PEM);
        expect(api.public_uncompressed_point).toBe(EC_PUBLIC_POINT);
        expect(api.rsa_public_pem).toBe(RSA_PUBLIC_PEM);
    });

    it("are on Teslemetry too", () => {
        const api = new Teslemetry("token");
        api.private_key = Buffer.from(EC_RAW, "hex");
        expect(api.public_uncompressed_point).toBe(EC_PUBLIC_POINT);
    });
});

describe("keys on the instance", () => {
    it("are unreachable by walking it", () => {
        const api = makeApi();
        api.private_key = Buffer.from(EC_RAW, "hex");
        api.rsa_private_key = crypto.createPrivateKey(RSA_PEM);
        expect(Object.values(api).some((value) => Buffer.isBuffer(value) || value instanceof crypto.KeyObject)).toBe(false);
        expect(inspect(api, { depth: 0 })).not.toContain(EC_RAW.slice(0, 8));
    });
});

describe("createSigned", () => {
    it("falls back to the client's key", async () => {
        const api = makeApi();
        await writeFile(ecPath, EC_PEM);
        await api.get_private_key(ecPath);
        expect(() => api.vehicles!.createSigned(VIN)).not.toThrow();
    });

    it("has no key to fall back to on a new client", () => {
        expect(() => makeApi().vehicles!.createSigned(VIN)).toThrow("No private key provided");
    });
});

describe("in-memory helpers", () => {
    it("generate_ec_private_key_pem round-trips through ec_private_key_from_pem", async () => {
        const pem = await generate_ec_private_key_pem();
        expect(pem).toMatch(/^-----BEGIN EC PRIVATE KEY-----\n/);
        const raw = ec_private_key_from_pem(pem);
        expect(raw).toHaveLength(32);

        const ecdh = crypto.createECDH("prime256v1");
        ecdh.setPrivateKey(raw);
        const point = crypto.createPublicKey(pem).export({ type: "spki", format: "der" }).subarray(-65);
        expect(ecdh.getPublicKey().equals(point)).toBe(true);
    });

    it("ec_private_key_from_pem returns Python's raw key, as a string or a Buffer", () => {
        expect(ec_private_key_from_pem(EC_PEM).toString("hex")).toBe(EC_RAW);
        expect(ec_private_key_from_pem(Buffer.from(EC_PEM)).toString("hex")).toBe(EC_RAW);
    });

    it("ec_private_key_from_pem keeps a scalar's leading zeros", () => {
        const raw = Buffer.alloc(32, 7);
        raw.fill(0, 0, 2);
        const ecdh = crypto.createECDH("prime256v1");
        ecdh.setPrivateKey(raw);
        const point = ecdh.getPublicKey();
        const pem = crypto
            .createPrivateKey({
                key: {
                    kty: "EC",
                    crv: "P-256",
                    d: raw.toString("base64url"),
                    x: point.subarray(1, 33).toString("base64url"),
                    y: point.subarray(33).toString("base64url"),
                },
                format: "jwk",
            })
            .export({ type: "sec1", format: "pem" });

        expect(ec_private_key_from_pem(pem).equals(raw)).toBe(true);
    });

    it("generate_rsa_private_key_pem writes PKCS#1 at the requested size", async () => {
        const pem = await generate_rsa_private_key_pem(RSA_BITS);
        expect(pem).toMatch(/^-----BEGIN RSA PRIVATE KEY-----\n/);
        expect(crypto.createPrivateKey(pem).asymmetricKeyDetails).toMatchObject({ modulusLength: RSA_BITS, publicExponent: 65537n });
    });

    it("rsa_public_der_pkcs1 matches Python's bytes from PKCS#1 and PKCS#8", () => {
        expect(rsa_public_der_pkcs1(RSA_PEM).toString("base64")).toBe(RSA_PUBLIC_DER_PKCS1_B64);
        expect(rsa_public_der_pkcs1(RSA_PKCS8_PEM).toString("base64")).toBe(RSA_PUBLIC_DER_PKCS1_B64);
    });

    it("raise PrivateKeyError for a PEM they cannot use", () => {
        const reason = (fn: () => unknown) => {
            try {
                fn();
            } catch (error) {
                expect(error).toBeInstanceOf(PrivateKeyError);
                return (error as PrivateKeyError).reason;
            }
            return null;
        };
        expect(reason(() => ec_private_key_from_pem("nope"))).toBe("malformed");
        expect(reason(() => ec_private_key_from_pem(EC_PEM_ENCRYPTED))).toBe("encrypted");
        expect(reason(() => ec_private_key_from_pem(RSA_PEM))).toBe("wrong_type");
        expect(reason(() => rsa_public_der_pkcs1(EC_PEM))).toBe("wrong_type");
    });
});
