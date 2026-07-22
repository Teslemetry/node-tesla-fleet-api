import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { Domain } from "@teslemetry/tesla-protocol/command/universal_message";
import { Tag, SignatureType, SessionInfo, SessionInfoStatus } from "@teslemetry/tesla-protocol/command/signatures";
import { Session } from "../src/signing/session.js";
import { deriveSharedKey, publicKeyFor, uint32BE } from "../src/signing/crypto.js";

/**
 * Pins the exact HMAC-personalized metadata layout and resulting tag to a
 * golden value computed independently (via raw `crypto` primitives, not this
 * module) ahead of time. If the tag/counter/expiry byte layout ever drifts -
 * wrong tag order, wrong length byte, wrong endianness - this test catches it
 * even though the round-trip tests above would not (they only check that the
 * client and `FakeVehicle` agree with *each other*).
 */
describe("HMAC-personalized metadata golden vector", () => {
    const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");
    const VEHICLE_PRIVATE_KEY = Buffer.from("10a0a7aeb5bcc3cad1d8dfe6edf4fb020910171e252c333a41484f565d646b72", "hex");
    const VEHICLE_PUBLIC_KEY = publicKeyFor(VEHICLE_PRIVATE_KEY);
    const VIN = "5YJXCAE43LF123456";
    const EPOCH = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
    const EXPIRES_AT = 1700000010;
    const COMMAND = Buffer.from("deadbeef", "hex");

    const GOLDEN_METADATA = "000108010102021135594a5843414534334c463132333435360310000102030405060708090a0b0c0d0e0f04046553f10a050400000001ff";
    const GOLDEN_TAG = "f7f5be231105eba1507375c35b960c87e6b932e399cf3a451b0119c550c579fb";

    it("builds the exact pinned metadata byte layout and HMAC tag", () => {
        const sharedKey = deriveSharedKey(OUR_PRIVATE_KEY, VEHICLE_PUBLIC_KEY);
        const hmacKey = crypto.createHmac("sha256", sharedKey).update("authenticated command").digest();

        const session = new Session(Domain.DOMAIN_VEHICLE_SECURITY, () => sharedKey);
        session.update(
            SessionInfo.create({
                counter: 0,
                publicKey: VEHICLE_PUBLIC_KEY,
                epoch: EPOCH,
                clockTime: Math.floor(Date.now() / 1000),
                status: SessionInfoStatus.SESSION_INFO_STATUS_OK,
            }),
        );

        // Force the exact expiresAt from the golden vector regardless of "now".
        const personalized = session.hmacPersonalized();
        expect(personalized.counter).toBe(1);
        const fixedPersonalized = { ...personalized, expiresAt: EXPIRES_AT };

        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]),
            Buffer.from([Tag.TAG_DOMAIN, 1, Domain.DOMAIN_VEHICLE_SECURITY]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(VIN, "ascii"),
            Buffer.from([Tag.TAG_EPOCH, fixedPersonalized.epoch.length]),
            Buffer.from(fixedPersonalized.epoch),
            Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
            uint32BE(fixedPersonalized.expiresAt),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(fixedPersonalized.counter),
            Buffer.from([Tag.TAG_END]),
        ]);

        expect(metadata.toString("hex")).toBe(GOLDEN_METADATA);
        expect(hmacKey.toString("hex")).toBe("3b425b48863d8de8801db7105f161f82e0568e809c755e33b880ffa87d4170dd");

        const tag = crypto.createHmac("sha256", hmacKey).update(Buffer.concat([metadata, COMMAND])).digest();
        expect(tag.toString("hex")).toBe(GOLDEN_TAG);
    });

    it("uint32BE encodes big-endian, matching the golden metadata's expiresAt/counter bytes", () => {
        expect(uint32BE(EXPIRES_AT).toString("hex")).toBe("6553f10a");
        expect(uint32BE(1).toString("hex")).toBe("00000001");
    });
});
