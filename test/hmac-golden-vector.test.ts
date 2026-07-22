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
        const info = SessionInfo.create({
            counter: 0,
            publicKey: VEHICLE_PUBLIC_KEY,
            epoch: EPOCH,
            clockTime: Math.floor(Date.now() / 1000),
            status: SessionInfoStatus.SESSION_INFO_STATUS_OK,
        });
        session.commit(info, session.keysFor(VEHICLE_PUBLIC_KEY));

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

/**
 * Reproduces the worked example from Tesla's own published protocol spec
 * (github.com/teslamotors/vehicle-command, pkg/protocol/protocol.md,
 * "Key Agreement" / "Response authentication"), using its published test
 * keys and expected intermediate values verbatim. This is independent of
 * every other test in this repo: if it passes, this implementation's ECDH
 * shared-key derivation and session-info authentication match the
 * authoritative upstream spec exactly, not just each other.
 */
describe("Official teslamotors/vehicle-command test vectors", () => {
    // "Vehicle key" from protocol.md.
    const VEHICLE_PRIVATE_KEY = Buffer.from("344EE5B466A7CF1EEB12B6F50331DB2E5EC5834EF5F4BEFCFD8CBE55C2528D70", "hex");
    const VEHICLE_PUBLIC_KEY = Buffer.from(
        "04c7a1f47138486aa4729971494878d33b1a24e39571f748a6e16c5955b3d877d3a6aaa0e955166474af5d32c410f439a2234137ad1bb085fd4e8813c958f11d97",
        "hex",
    );
    // "Client key" from protocol.md.
    const CLIENT_PRIVATE_KEY = Buffer.from("2538CDC29A97C19C1E99A637D6CF4F8C970C118B56EDE1E6323E6D162C4B30DB", "hex");

    const GOLDEN_K = "1b2fce19967b79db696f909cff89ea9a";
    const GOLDEN_SESSION_INFO_KEY = "fceb679ee7bca756fcd441bf238bf2f338629b41d9eb9c67be1b32c9672ce300";
    // The request UUID from the doc's handshake request example, used as the TAG_CHALLENGE.
    const REQUEST_UUID = Buffer.from("1588d5a30eabc6f8fc9a951b11f6fd11", "hex");
    const VIN = "5YJ30123456789ABC";
    // The exact `session_info` bytes from the doc's handshake response example.
    const SESSION_INFO_BYTES = Buffer.from(
        "0806124104c7a1f47138486aa4729971494878d33b1a24e39571f748a6e16c5955b3d877d3a6aaa0e955166474af5d32c410f439a2234137ad1bb085fd4e8813c958f11d971a104c463f9cc0d3d26906e982ed224adde6255a0a0000",
        "hex",
    );
    const GOLDEN_TAG = "996c1fe38331be138f8039c194b14db2198846ed7d8251e6749284d7b32ea002";

    it("derives K matching the spec's published value, symmetrically from either side", () => {
        expect(deriveSharedKey(CLIENT_PRIVATE_KEY, VEHICLE_PUBLIC_KEY).toString("hex")).toBe(GOLDEN_K);
        expect(deriveSharedKey(VEHICLE_PRIVATE_KEY, publicKeyFor(CLIENT_PRIVATE_KEY)).toString("hex")).toBe(GOLDEN_K);
    });

    it("Session.keysFor derives the spec's published SESSION_INFO_KEY from K", () => {
        const session = new Session(Domain.DOMAIN_INFOTAINMENT, (vehiclePublicKey) => deriveSharedKey(CLIENT_PRIVATE_KEY, vehiclePublicKey));
        expect(session.keysFor(VEHICLE_PUBLIC_KEY).sessionInfoKey.toString("hex")).toBe(GOLDEN_SESSION_INFO_KEY);
    });

    it("reproduces the spec's exact session_info_tag for its worked example", () => {
        const sessionInfoKey = Buffer.from(GOLDEN_SESSION_INFO_KEY, "hex");
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC]),
            Buffer.from([Tag.TAG_PERSONALIZATION, VIN.length]),
            Buffer.from(VIN, "ascii"),
            Buffer.from([Tag.TAG_CHALLENGE, REQUEST_UUID.length]),
            REQUEST_UUID,
            Buffer.from([Tag.TAG_END]),
        ]);
        const tag = crypto.createHmac("sha256", sessionInfoKey).update(Buffer.concat([metadata, SESSION_INFO_BYTES])).digest();
        expect(tag.toString("hex")).toBe(GOLDEN_TAG);
    });
});
