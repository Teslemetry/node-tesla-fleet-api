import crypto from "node:crypto";
import { RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it, vi } from "vitest";
import {
    ENERGY_TEST_DIN as DIN,
    ENERGY_TEST_KEY_PEM,
    PYTHON_ENVELOPES,
    PYTHON_SIGNED_GO_OFF_GRID,
} from "./fixtures/energy-signing.js";
import { ENERGY_SIGNATURE_TTL_SECONDS, EnergyDeviceSigner } from "../src/signing/energy.js";

const NOW = 1_790_000_000.25;
const MESSAGE_UUID = Uint8Array.from({ length: 16 }, (_, index) => index);
const TEST_KEY = crypto.createPrivateKey(ENERGY_TEST_KEY_PEM);
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

// Python tests/powerwall/test_transport_signing.py, byte for byte. A test key
// only; it is not registered on any gateway.
const V1R_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAJmlOoA/z98lbrJt
SCpsXVPsgRDc2KkclGXGDR+4iMP/Fttoy0Hx+t8q01WIDHCoOpoQv1NwOWg1ycEU
DLvIryyXH4eOrqY+ZWaAqiqyZ+HjMeNhW4HpD43SkquIn9+hosXJaJxfrNvI1h9g
PIxUnqdKQM+zYmhl3p2NxKkpbnQ7AgMBAAECgYB/TSM3d6en37/kHh+Y5sg87MvT
SOhK1d8uo/XjvmWy3vv1NtKSBQgzN6x6RYrpHLnRROcBHw6xhT9wtkgGnrRkGPqu
cKK7w9Dr6jr02IlUL2vUVb2OY1exef9CP40BMfMM5QxqSE2IrG+u6YR+I3dMPPEP
PrJqucOf/Y78MJuUoQJBAMfGCBJKy19ByzP2xv5d//w7o0E8vGZlYdOy8LtYMNeX
4cM74LzZgA9MmDruT+v1tLTwPKAt2HgnDuEA9AYTdU8CQQDE45lrTItafMAnC9a4
x9Zu0PgPl2z3ibtd0k0vTvVhYN7k6+ulRy5EaEPfdSkxSRfAayA/pXDPy/3IIe8I
4S9VAkA6ohnOXJtyGtpsJvriv24ZdtuEkzHsj8b1nmhfZBP5wv8lERb19pRKaT2o
1jco1xWxoWz5ylrlcPlB+sikW+OrAkAu0jUsyBInnZ0QbAdO/+7lgXpMMuVt5GoT
QKysQGmoE6JN7DCoqEm/aNAjNrhqCQjF8HPFzvEJ6WfbjP5MLUjVAkAa4eA/MCuB
ip8rpmlk2gKy5kT48ehO4GSwb168TI+Bkw0hRAwV+4r1STkCJR+z7fWEi+uBn7VI
IZvqjXsKph1j
-----END PRIVATE KEY-----
`;
const V1R_ENVELOPE = "120220011a1e0a1c313233323130302d30302d452d2d5447313233343536373839414243";
const EXPECTED_SIGNED_REQUEST =
    "320208075224120220011a1e0a1c313233323130302d30302d452d2d54473132" +
    "333435363738394142436a9d020a8f010a8c013081890281810099a53a803fcf" +
    "df256eb26d482a6c5d53ec8110dcd8a91c9465c60d1fb888c3ff16db68cb41f1" +
    "fadf2ad355880c70a83a9a10bf5370396835c9c1140cbbc8af2c971f878eaea6" +
    "3e656680aa2ab267e1e331e3615b81e90f8dd292ab889fdfa1a2c5c9689c5fac" +
    "dbc8d61f603c8c549ea74a40cfb3626865de9d8dc4a9296e743b02030100013a" +
    "88010d8d3bb16a1280016f5fd6a464eeb8e293b9efe76d1036c4fb09ac801dcd" +
    "d6aebc3fd06ed15629626f307a1f7cd16cd5fbec82adb9b0b82faaaf9327452f" +
    "3d93ebe0b8538b40090900ce9bd0f4f83b3783bd9a33ba97d72ce921cc0fa40c" +
    "3b7eb65dea88cd26ef013085b2cf3315caa23a13429ca71b3fd97ee41411d97a" +
    "2948117e0e07d5e7c55b9a0310000102030405060708090a0b0c0d0e0f";

/** The TLV header from the protocol, written out byte by byte. */
function expectedSignedData(din: string, expiresAt: number, envelope: Uint8Array): Buffer {
    const expires = Buffer.alloc(4);
    expires.writeUInt32BE(expiresAt);
    return Buffer.concat([
        Buffer.from([0, 1, 7]), // TAG_SIGNATURE_TYPE = SIGNATURE_TYPE_RSA
        Buffer.from([1, 1, 7]), // TAG_DOMAIN = DOMAIN_ENERGY_DEVICE
        Buffer.from([2, din.length]),
        Buffer.from(din, "ascii"), // TAG_PERSONALIZATION = DIN
        Buffer.from([4, 4]),
        expires, // TAG_EXPIRES_AT
        Buffer.from([255]), // TAG_END
        envelope,
    ]);
}

function verifies(message: RoutableMessage, din: string, key: crypto.KeyObject = TEST_KEY): boolean {
    const rsa = message.signatureData!.rsaData!;
    return crypto.verify(
        "sha512",
        expectedSignedData(din, rsa.expiresAt, message.protobufMessageAsBytes!),
        key,
        rsa.signature,
    );
}

describe("EnergyDeviceSigner against Python", () => {
    it("reproduces EXPECTED_SIGNED_REQUEST with a 12 second TTL", async () => {
        const key = crypto.createPrivateKey(V1R_KEY_PEM);
        const signer = new EnergyDeviceSigner(key, 12);

        const signed = await signer.sign(Buffer.from(V1R_ENVELOPE, "hex"), DIN, {
            now: NOW,
            messageUuid: MESSAGE_UUID,
        });

        expect(hex(signed)).toBe(EXPECTED_SIGNED_REQUEST);
        const message = RoutableMessage.decode(signed);
        expect(message.signatureData?.rsaData?.expiresAt).toBe(1_790_000_013);
        expect(verifies(message, DIN, key)).toBe(true);
    });

    it("reproduces a message Python signed with the throwaway key and 30 second TTL", async () => {
        const signed = await new EnergyDeviceSigner(TEST_KEY).sign(Buffer.from(PYTHON_ENVELOPES.go_off_grid, "hex"), DIN, {
            now: NOW,
            messageUuid: MESSAGE_UUID,
        });

        expect(hex(signed)).toBe(PYTHON_SIGNED_GO_OFF_GRID);
    });

    it.each<[keyof typeof PYTHON_ENVELOPES, string, string, Record<string, unknown> | undefined]>([
        ["go_off_grid", "teg", "set_island_mode_request", { mode: 6, force: true }],
        ["reconnect_grid", "teg", "set_island_mode_request", { mode: 1 }],
        [
            "dispatch_battery_power",
            "teg",
            "dispatch_battery_power_request",
            { real_power: { power_watts: -2000.5, duration_seconds: 120 } },
        ],
        ["resume_battery_operation", "teg", "dispatch_battery_power_request", { resume_device_mode: {} }],
        [
            "add_authorized_client",
            "authorization",
            "add_authorized_client_request",
            { key_type: 1, public_key: Buffer.from("key").toString("base64"), type: 1, description: "HA" },
        ],
        [
            "remove_authorized_client",
            "authorization",
            "remove_authorized_client_request",
            { public_key: Buffer.from("key").toString("base64") },
        ],
        [
            "schedule_backup_event",
            "teg",
            "schedule_manual_backup_event_request",
            { scheduling_info: { start_time: "2026-10-29T10:00:00Z", duration_seconds: 3600, priority: 1 } },
        ],
        ["get_config", "teg", "get_config_request", undefined],
        ["device_cert", "common", "device_cert_request", undefined],
    ])("envelope %s matches Python's bytes", (name, category, command, params) => {
        expect(hex(EnergyDeviceSigner.envelope(DIN, category, command, params))).toBe(PYTHON_ENVELOPES[name]);
    });
});

describe("EnergyDeviceSigner", () => {
    const signer = new EnergyDeviceSigner(TEST_KEY);

    it("lays out the signed message", async () => {
        const envelope = EnergyDeviceSigner.envelope(DIN, "teg", "set_island_mode_request", { mode: 6, force: true });
        const message = RoutableMessage.decode(await signer.sign(envelope, DIN, { now: NOW, messageUuid: MESSAGE_UUID }));

        expect(message.toDestination?.domain).toBe(7);
        expect(hex(message.uuid)).toBe(hex(MESSAGE_UUID));
        expect(hex(message.protobufMessageAsBytes!)).toBe(hex(envelope));
        // expires_at rounds the clock up, then adds the 30 s TTL.
        expect(ENERGY_SIGNATURE_TTL_SECONDS).toBe(30);
        expect(message.signatureData?.rsaData?.expiresAt).toBe(1_790_000_001 + 30);
        expect(hex(message.signatureData!.signerIdentity!.publicKey!)).toBe(
            crypto.createPublicKey(TEST_KEY).export({ type: "pkcs1", format: "der" }).toString("hex"),
        );
        expect(verifies(message, DIN)).toBe(true);
    });

    it("personalises the signature to the din", async () => {
        const envelope = EnergyDeviceSigner.envelope(DIN, "teg", "get_backup_events_request");
        const message = RoutableMessage.decode(await signer.sign(envelope, DIN, { now: NOW }));

        expect(verifies(message, "1232100-00-E--TG000000000000")).toBe(false);
    });

    it("addresses the envelope to the din from the customer client and leaves delivery_channel unset", () => {
        const envelope = MessageEnvelope.decode(
            EnergyDeviceSigner.envelope(DIN, "teg", "set_island_mode_request", { mode: 6, force: true }),
        );

        expect(envelope.sender?.authorizedClient).toBe(1);
        expect(envelope.recipient?.din).toBe(DIN);
        expect(envelope.deliveryChannel).toBe(0);
        expect(envelope.teg?.setIslandModeRequest).toEqual({ mode: 6, force: true });
    });

    it("keeps an empty request's presence", () => {
        const envelope = MessageEnvelope.decode(EnergyDeviceSigner.envelope(DIN, "teg", "get_config_request"));

        expect(envelope.teg?.getConfigRequest).toEqual({});
    });

    it.each<[string, string, Record<string, unknown> | undefined]>([
        ["nope", "get_config_request", undefined],
        ["teg", "nope_request", undefined],
        ["teg", "set_island_mode_request", { mode: 6, typo: true }],
        ["teg", "dispatch_battery_power_request", { real_power: { watts: 1 } }],
        ["teg", "set_island_mode_request", { mode: 99 }],
        ["teg", "schedule_manual_backup_event_request", { scheduling_info: { start_time: "not a time" } }],
    ])("refuses to sign what the message cannot hold: %s.%s %j", (category, command, params) => {
        expect(() => EnergyDeviceSigner.envelope(DIN, category, command, params)).toThrow(TypeError);
    });

    it("gives each message a fresh uuid", async () => {
        const envelope = EnergyDeviceSigner.envelope(DIN, "teg", "get_config_request");
        const uuids = await Promise.all(
            [1, 2].map(async () => hex(RoutableMessage.decode(await signer.sign(envelope, DIN)).uuid)),
        );

        expect(uuids[0]).toHaveLength(32);
        expect(uuids[0]).not.toBe(uuids[1]);
    });

    it("signs through the async crypto.sign callback", async () => {
        const sign = vi.spyOn(crypto, "sign");

        await signer.sign(EnergyDeviceSigner.envelope(DIN, "teg", "get_config_request"), DIN);

        expect(sign).toHaveBeenCalledOnce();
        expect(sign.mock.calls[0][3]).toBeTypeOf("function");
        sign.mockRestore();
    });

    it("rejects a non-RSA key", () => {
        const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });

        expect(() => new EnergyDeviceSigner(privateKey)).toThrow(TypeError);
        expect(() => new EnergyDeviceSigner(crypto.createPublicKey(TEST_KEY))).toThrow(TypeError);
    });

    it("rejects a din it cannot personalise to", async () => {
        const envelope = EnergyDeviceSigner.envelope(DIN, "teg", "get_config_request");

        await expect(signer.sign(envelope, "1232100-é")).rejects.toThrow(TypeError);
        await expect(signer.sign(envelope, "A".repeat(256))).rejects.toThrow(TypeError);
    });

    it("keeps the key off the instance", () => {
        expect(JSON.stringify(signer)).not.toContain("PRIVATE");
        expect(Object.keys(signer).sort()).toEqual(["publicKeyDer", "ttl"]);
    });
});
