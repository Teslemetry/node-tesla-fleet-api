import { beforeEach, describe, expect, it } from "vitest";
import crypto from "crypto";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { SessionInfo, SessionInfoStatus, SignatureType, Tag } from "@teslemetry/tesla-protocol/command/signatures";
import Commands from "../src/commands.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import { NotOnWhitelistFault, SessionInfoAuthenticationFault } from "../src/exceptions.js";
import { deriveSharedKey, publicKeyFor } from "../src/signing/crypto.js";
import { Session } from "../src/signing/session.js";

// Ported from Python's tests/test_session_info_authentication.py. Each reply is
// built here, by hand, so these tests pin validation against a third
// construction of the wire format, independent of src/ and FakeVehicle.

const VIN = "5YJXCAE43LF123456";
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");
const VEHICLE_PRIVATE_KEY = Buffer.from("10a0a7aeb5bcc3cad1d8dfe6edf4fb020910171e252c333a41484f565d646b72", "hex");
const VEHICLE_PUBLIC_KEY = publicKeyFor(VEHICLE_PRIVATE_KEY);
const REQUEST_UUID = Buffer.alloc(16, 0x11);
const VCSEC = Domain.DOMAIN_VEHICLE_SECURITY;

class ConcreteCommands extends Commands {
    readonly _transport_name = "test";

    protected _send(): Promise<RoutableMessage> {
        throw new Error("_send is not called in these tests");
    }

    validate(resp: RoutableMessage, requestUuid: Buffer): void {
        this.validateAndUpdateSession(resp, requestUuid);
    }

    session(domain: Domain = VCSEC): Session {
        return (this as unknown as { sessions: Record<number, Session> }).sessions[domain];
    }
}

function makeCommands(vin: string = VIN, privateKey: Buffer = OUR_PRIVATE_KEY): ConcreteCommands {
    return new ConcreteCommands(new Vehicle(new TeslaFleetApi({ server: "https://fleet.test" })), vin, privateKey);
}

function sessionInfoTag(publicKey: Buffer, vin: string, requestUuid: Buffer, sessionInfo: Uint8Array): Buffer {
    const sharedKey = deriveSharedKey(OUR_PRIVATE_KEY, publicKey);
    const key = crypto.createHmac("sha256", sharedKey).update("session info").digest();
    const metadata = Buffer.concat([
        Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC]),
        Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
        Buffer.from(vin, "ascii"),
        Buffer.from([Tag.TAG_CHALLENGE, requestUuid.length]),
        requestUuid,
        Buffer.from([Tag.TAG_END]),
    ]);
    return crypto.createHmac("sha256", key).update(metadata).update(sessionInfo).digest();
}

function info(overrides: Partial<SessionInfo> = {}): SessionInfo {
    return SessionInfo.create({
        counter: 100,
        publicKey: VEHICLE_PUBLIC_KEY,
        epoch: Buffer.alloc(16, 1),
        clockTime: Math.floor(Date.now() / 1000),
        status: SessionInfoStatus.SESSION_INFO_STATUS_OK,
        ...overrides,
    });
}

function reply(
    sessionInfo: SessionInfo,
    requestUuid: Buffer,
    { echo = Buffer.alloc(0), tag }: { echo?: Buffer; tag?: Buffer | null } = {},
): RoutableMessage {
    const bytes = SessionInfo.encode(sessionInfo).finish();
    const realTag = tag === undefined ? sessionInfoTag(Buffer.from(sessionInfo.publicKey), VIN, requestUuid, bytes) : tag;
    return RoutableMessage.create({
        fromDestination: { domain: VCSEC },
        sessionInfo: bytes,
        requestUuid: echo,
        signatureData: realTag === null ? undefined : { sessionInfoTag: { tag: realTag } },
    });
}

describe("session info tag authentication", () => {
    let commands: ConcreteCommands;

    beforeEach(() => {
        commands = makeCommands();
    });

    function expectRejected(resp: RoutableMessage): void {
        expect(() => commands.validate(resp, REQUEST_UUID)).toThrow(SessionInfoAuthenticationFault);
        expect(commands.session().ready).toBe(false);
    }

    it("rejects a reply with no tag", () => {
        expectRejected(reply(info(), REQUEST_UUID, { tag: null }));
    });

    it("rejects a reply with a present but empty tag", () => {
        expectRejected(reply(info(), REQUEST_UUID, { tag: Buffer.alloc(0) }));
    });

    it("rejects a reply with a forged tag", () => {
        expectRejected(reply(info(), REQUEST_UUID, { tag: Buffer.alloc(32) }));
    });

    it("rejects a reply authenticated against a different request", () => {
        expectRejected(reply(info(), Buffer.alloc(16, 0x99)));
    });

    it("rejects an echoed request uuid that does not match, even under a valid tag", () => {
        expectRejected(reply(info(), REQUEST_UUID, { echo: Buffer.alloc(16, 0x22) }));
    });

    it("rejects session info bytes that do not decode", () => {
        const resp = reply(info(), REQUEST_UUID);
        resp.sessionInfo = Buffer.from("0aff", "hex");
        expectRejected(resp);
    });

    it("rejects a public key that is not a curve point", () => {
        expectRejected(reply(info({ publicKey: Buffer.concat([Buffer.from([4]), Buffer.alloc(64)]) }), REQUEST_UUID, { tag: Buffer.alloc(32) }));
    });

    it("accepts a valid tag with an empty wire-level request_uuid, the real VCSEC shape", () => {
        commands.validate(reply(info(), REQUEST_UUID), REQUEST_UUID);
        expect(commands.session().ready).toBe(true);
        expect(commands.session().counter).toBe(100);
    });

    it("accepts a valid tag with a matching echoed request_uuid", () => {
        commands.validate(reply(info(), REQUEST_UUID, { echo: REQUEST_UUID }), REQUEST_UUID);
        expect(commands.session().ready).toBe(true);
    });

    it("verifies the tag before trusting the whitelist status", () => {
        const notWhitelisted = info({ status: SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST });
        expect(() => commands.validate(reply(notWhitelisted, REQUEST_UUID, { tag: Buffer.alloc(32) }), REQUEST_UUID)).toThrow(
            SessionInfoAuthenticationFault,
        );
    });

    it("raises NotOnWhitelistFault for an authenticated whitelist rejection", () => {
        const notWhitelisted = info({ status: SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST });
        expect(() => commands.validate(reply(notWhitelisted, REQUEST_UUID), REQUEST_UUID)).toThrow(NotOnWhitelistFault);
        expect(commands.session().ready).toBe(false);
    });

    it("raises NotOnWhitelistFault, unauthenticated, for an empty public key", () => {
        const empty = info({ publicKey: Buffer.alloc(0), status: SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST });
        expect(() => commands.validate(reply(empty, REQUEST_UUID, { echo: REQUEST_UUID, tag: Buffer.alloc(32) }), REQUEST_UUID)).toThrow(
            NotOnWhitelistFault,
        );
        expect(commands.session().ready).toBe(false);
    });

    it("raises the typed fault for an empty public key with any other status", () => {
        const empty = info({ publicKey: Buffer.alloc(0) });
        expectRejected(reply(empty, REQUEST_UUID, { echo: REQUEST_UUID, tag: Buffer.alloc(32) }));
    });
});

describe("counter and clock monotonicity", () => {
    let commands: ConcreteCommands;

    beforeEach(() => {
        commands = makeCommands();
    });

    function authenticate(counter: number, epochByte: number, clockTime: number, uuidByte: number): void {
        const uuid = Buffer.alloc(16, uuidByte);
        commands.validate(reply(info({ counter, epoch: Buffer.alloc(16, epochByte), clockTime }), uuid), uuid);
    }

    it("establishes the counter and epoch", () => {
        authenticate(100, 1, 1000, 1);
        expect(commands.session().counter).toBe(100);
        expect(commands.session().epoch).toEqual(Buffer.alloc(16, 1));
    });

    it("refuses a regressed clock in the same epoch", () => {
        authenticate(100, 1, 1000, 1);
        expect(() => authenticate(5, 1, 900, 2)).toThrow(SessionInfoAuthenticationFault);
        expect(commands.session().counter).toBe(100);
    });

    it("clamps a lower counter when the clock has not regressed", () => {
        authenticate(100, 1, 1000, 1);
        authenticate(5, 1, 1010, 2);
        expect(commands.session().counter).toBe(100);
    });

    it("advances to a higher counter", () => {
        authenticate(100, 1, 1000, 1);
        authenticate(150, 1, 1010, 2);
        expect(commands.session().counter).toBe(150);
    });

    it("resets the counter on an epoch change, even to a lower value", () => {
        authenticate(100, 1, 1000, 1);
        authenticate(3, 2, 1, 2);
        expect(commands.session().counter).toBe(3);
        expect(commands.session().epoch).toEqual(Buffer.alloc(16, 2));
    });
});

// protocol.md's published handshake (Test keys / Handshake / Response
// authentication), reproduced verbatim through the real validation path.
describe("protocol.md handshake reply", () => {
    const CLIENT_PRIVATE_KEY = Buffer.from("2538CDC29A97C19C1E99A637D6CF4F8C970C118B56EDE1E6323E6D162C4B30DB", "hex");
    const SPEC_VIN = "5YJ30123456789ABC";
    const SPEC_UUID = Buffer.from("1588d5a30eabc6f8fc9a951b11f6fd11", "hex");
    const SESSION_INFO = Buffer.from(
        "0806124104c7a1f47138486aa4729971494878d33b1a24e39571f748a6e16c5955b3d877d3a6aaa0e955166474af5d32c410f439a2234137ad1bb085fd4e8813c958f11d971a104c463f9cc0d3d26906e982ed224adde6255a0a0000",
        "hex",
    );
    const TAG = Buffer.from("996c1fe38331be138f8039c194b14db2198846ed7d8251e6749284d7b32ea002", "hex");

    function specReply(tag: Buffer): RoutableMessage {
        return RoutableMessage.create({
            fromDestination: { domain: Domain.DOMAIN_INFOTAINMENT },
            sessionInfo: SESSION_INFO,
            requestUuid: SPEC_UUID,
            signatureData: { sessionInfoTag: { tag } },
        });
    }

    it("authenticates and commits it", () => {
        const commands = makeCommands(SPEC_VIN, CLIENT_PRIVATE_KEY);
        commands.validate(specReply(TAG), SPEC_UUID);
        const session = commands.session(Domain.DOMAIN_INFOTAINMENT);
        expect(session.ready).toBe(true);
        expect(session.counter).toBe(6);
        expect(session.epoch?.toString("hex")).toBe("4c463f9cc0d3d26906e982ed224adde6");
    });

    it("rejects one flipped tag bit", () => {
        const commands = makeCommands(SPEC_VIN, CLIENT_PRIVATE_KEY);
        const corrupted = Buffer.from(TAG);
        corrupted[0] ^= 1;
        expect(() => commands.validate(specReply(corrupted), SPEC_UUID)).toThrow(SessionInfoAuthenticationFault);
        expect(commands.session(Domain.DOMAIN_INFOTAINMENT).ready).toBe(false);
    });
});
