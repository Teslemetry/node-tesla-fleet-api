import { describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { readFileSync } from "node:fs";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import { SigningDisabled } from "../src/exceptions.js";
import { publicKeyFor } from "../src/signing/crypto.js";
import {
    G,
    N,
    P,
    SCALAR_LENGTH,
    SIGNATURE_LENGTH,
    deterministicNonce,
    encodePoint,
    public_key_bytes,
    sign,
    sign_fleet_telemetry_config,
    sign_jws,
    verify,
} from "../src/signing/jws.js";

// Ported from Python's tests/test_jws.py. fixtures/ss256_vectors.json is a
// byte-for-byte copy of Python's, produced by Tesla's Go SDK. The scheme is
// deterministic, so matching it proves the challenge framing and nonce
// derivation, not just internal consistency.
const VECTORS = JSON.parse(readFileSync(new URL("./fixtures/ss256_vectors.json", import.meta.url), "utf8"));

// vehicle-command internal/schnorr/schnorr_test.go: testKey() is the scalar
// 0x03 followed by 31 zero bytes, goodSig() signs "hello world".
const GO_TEST_SCALAR = Buffer.concat([Buffer.from([3]), Buffer.alloc(31)]);
const GO_GOOD_SIGNATURE = Buffer.from(
    "7cfdbeb5baa730540401550bdefa20976453e8539ae4b2f26ce33125801a08f9" +
        "0ed20c3d846497ff82cc9772e3db4703982f47bd0b0b89dfb9a49cd2e5240546" +
        "02b1e05fbf95f5686faea7a5809eb92f5ecc22eae74ceccc5e2a65dd67ff20fc",
    "hex",
);

const hex = (value: string) => Buffer.from(value, "hex");
const key = (scalar: string) => hex(scalar.padStart(2 * SCALAR_LENGTH, "0"));

describe("curve constants", () => {
    it("the generator matches OpenSSL", () => {
        expect(publicKeyFor(key("01")).equals(encodePoint(G))).toBe(true);
    });

    it("the order matches OpenSSL: (n - 1)G = -G", () => {
        const minusOne = publicKeyFor(key((N - 1n).toString(16)));
        expect(minusOne.equals(encodePoint([G[0], P - G[1]]))).toBe(true);
    });
});

describe("public_key_bytes", () => {
    it("is the 65-byte uncompressed point, and verifies what the key signs", () => {
        const privateKey = key("01");
        const point = public_key_bytes(privateKey);
        expect(point.equals(encodePoint(G))).toBe(true);
        expect(point).toHaveLength(65);
        const message = Buffer.from("message");
        expect(verify(point, message, sign(privateKey, message))).toBe(true);
    });
});

describe("deterministic nonce, vehicle-command internal/schnorr/sign_test.go", () => {
    it("matches the RFC 6979 A.2.5 vector", () => {
        const nonce = deterministicNonce(
            hex("c9afa9d845ba75166b5c215767b1d6934e50c3db36e89b127b8a622b120f6721"),
            crypto.createHash("sha256").update("sample").digest(),
        );
        expect(nonce.toString("hex")).toBe("a6e3c57dd01abe90086538398355dd4c3b17aa873382b0f24d6129493d8aad60");
    });

    it("rejects a candidate above the group order", () => {
        const nonce = deterministicNonce(GO_TEST_SCALAR, hex("0080c36864c5f2f460e3767983c65677b65cef901bcedcb223f9b365c68f52f6"));
        expect(nonce.toString("hex")).toBe("264fc6592fbea24fd0954e0b86b886e8743161758ddad2f7e9fed75a0019e005");
    });
});

describe("signatures", () => {
    it("matches the Go SDK's published signature", () => {
        expect(sign(GO_TEST_SCALAR, Buffer.from("hello world")).equals(GO_GOOD_SIGNATURE)).toBe(true);
    });

    it.each(VECTORS.signatures as Array<{ scalar: string; public: string; message_hex: string; signature: string }>)(
        "matches Go for scalar $scalar and message $message_hex",
        (vector) => {
            const message = hex(vector.message_hex);
            expect(publicKeyFor(key(vector.scalar)).toString("hex")).toBe(vector.public);
            expect(sign(key(vector.scalar), message).toString("hex")).toBe(vector.signature);
            expect(verify(hex(vector.public), message, hex(vector.signature))).toBe(true);
        },
    );

    it("keeps its width when V_x has a leading zero byte", () => {
        const leadingZero = VECTORS.signatures.filter((vector: { signature: string }) => vector.signature.startsWith("00"));
        expect(leadingZero.length).toBeGreaterThan(0);
        for (const vector of leadingZero) {
            expect(sign(key(vector.scalar), hex(vector.message_hex))).toHaveLength(SIGNATURE_LENGTH);
        }
    });

    it("round trips with a random key, reproducibly", () => {
        const privateKey = crypto.randomBytes(32);
        const signature = sign(privateKey, Buffer.from("payload"));
        expect(sign(privateKey, Buffer.from("payload")).equals(signature)).toBe(true);
        expect(verify(publicKeyFor(privateKey), Buffer.from("payload"), signature)).toBe(true);
    });

    it("rejects a key that is not a P-256 scalar", () => {
        expect(() => sign(Buffer.alloc(48, 1), Buffer.from("payload"))).toThrow(/P-256/);
    });
});

describe("verify rejects", () => {
    const vector = VECTORS.signatures[0];
    const publicKey = hex(vector.public);
    const message = hex(vector.message_hex);
    const signature = hex(vector.signature);

    it("a wrong message", () => {
        expect(verify(publicKey, Buffer.from("hello worle"), signature)).toBe(false);
    });

    it("a wrong public key", () => {
        const other = publicKeyFor(Buffer.concat([Buffer.from([4]), Buffer.alloc(31)]));
        expect(verify(other, message, signature)).toBe(false);
    });

    it.each([0, SCALAR_LENGTH, SIGNATURE_LENGTH - 1])("a signature tampered at byte %i", (index) => {
        const tampered = Buffer.from(signature);
        tampered[index] ^= 1;
        expect(verify(publicKey, message, tampered)).toBe(false);
    });

    it("malformed inputs", () => {
        expect(verify(publicKey, message, signature.subarray(0, -1))).toBe(false);
        expect(verify(Buffer.concat([Buffer.from([4]), Buffer.alloc(64)]), message, signature)).toBe(false);
        expect(verify(Buffer.alloc(0), message, signature)).toBe(false);
    });
});

describe("JWS", () => {
    const jws = VECTORS.jws as { scalar: string; token: string; config: Record<string, unknown> };
    const privateKey = key(jws.scalar);
    const claimsOf = (token: string) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());

    it("matches the Go SDK's token", () => {
        expect(sign_fleet_telemetry_config(privateKey, jws.config)).toBe(jws.token);
    });

    it("the Go token has the expected structure and signature", () => {
        const [header, payload, signature] = jws.token.split(".");
        expect(JSON.parse(Buffer.from(header, "base64url").toString())).toEqual({ alg: "Tesla.SS256", typ: "JWT" });
        const claims = claimsOf(jws.token);
        const publicKey = publicKeyFor(privateKey);
        expect(claims.iss).toBe(publicKey.toString("base64"));
        expect(claims.aud).toBe("com.tesla.fleet.TelemetryClient");
        expect(verify(publicKey, Buffer.from(`${header}.${payload}`), Buffer.from(signature, "base64url"))).toBe(true);
    });

    it("overwrites iss and aud", () => {
        const claims = claimsOf(sign_jws(privateKey, { iss: "spoof", aud: "spoof", x: 1 }, "aud.test"));
        expect(claims.aud).toBe("aud.test");
        expect(claims.iss).toBe(publicKeyFor(privateKey).toString("base64"));
        expect(claims.x).toBe(1);
    });

    it("does not mutate the claims", () => {
        const claims = { exp: 1 };
        sign_jws(privateKey, claims, "aud.test");
        expect(claims).toEqual({ exp: 1 });
    });

    it("serialises as Python's sorted, ASCII-only JSON", () => {
        const token = sign_jws(privateKey, { b: { z: 1, a: [2, { d: "é" }] }, "10": 1, "9": 2, skipped: undefined }, "aud");
        const payload = Buffer.from(token.split(".")[1], "base64url").toString();
        expect(payload).toBe(
            `{"10":1,"9":2,"aud":"aud","b":{"a":[2,{"d":"\\u00e9"}],"z":1},"iss":"${publicKeyFor(privateKey).toString("base64")}"}`,
        );
    });
});

describe("VehicleSigned.fleet_telemetry_config_create", () => {
    const VIN = "LRWYGCEK0PC000000";
    const jws = VECTORS.jws as { scalar: string; token: string; config: any };

    function signed(privateKey: Buffer | false) {
        const api = new TeslaFleetApi({ server: "https://fleet.test", accessToken: "token" });
        const request = vi.spyOn(api, "_request").mockResolvedValue({ response: { updated_vehicles: 1 } } as any);
        return { vehicle: new Vehicle(api).createSigned(VIN, privateKey), request };
    }

    it("posts the Go-identical token to fleet_telemetry_config_jws", async () => {
        const { vehicle, request } = signed(key(jws.scalar));
        await expect(vehicle.fleet_telemetry_config_create({ vins: [VIN], config: jws.config })).resolves.toEqual({ response: { updated_vehicles: 1 } });
        expect(request).toHaveBeenCalledExactlyOnceWith("POST", "api/1/vehicles/fleet_telemetry_config_jws", null, { vins: [VIN], token: jws.token });
    });

    it("takes the bound config shape too, for this vehicle's VIN", async () => {
        const { vehicle, request } = signed(key(jws.scalar));
        await vehicle.fleet_telemetry_config_create(jws.config);
        expect(request).toHaveBeenCalledExactlyOnceWith("POST", "api/1/vehicles/fleet_telemetry_config_jws", null, { vins: [VIN], token: jws.token });
    });

    it("needs a signing key", async () => {
        const { vehicle, request } = signed(false);
        await expect(vehicle.fleet_telemetry_config_create({ vins: [VIN], config: {} as any })).rejects.toThrow(SigningDisabled);
        expect(request).not.toHaveBeenCalled();
    });
});
