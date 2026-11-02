import { afterEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { AESGCMPersonalizedSignatureData, SessionInfo, SessionInfoStatus, SignatureType, Tag } from "@teslemetry/tesla-protocol/command/signatures";
import {
    Action,
    ChargingSetLimitAction,
    GetVehicleData,
    HvacAutoAction,
    Response,
    VehicleAction,
} from "@teslemetry/tesla-protocol/command/car_server";
import { VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import { RKEActionE, UnsignedMessage } from "@teslemetry/tesla-protocol/command/vcsec";
import Commands from "../src/commands.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import { SignedCommandResponseReplayed } from "../src/exceptions.js";
import { publicKeyFor } from "../src/signing/crypto.js";
import { Session } from "../src/signing/session.js";
import { FakeVehicle } from "./helpers/fakevehicle.js";
import fixture from "./fixtures/aes_gcm_python.json";

const VIN = "5YJXCAE43LF123456";
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");
const hex = (value: string) => Buffer.from(value, "hex");

function makeParent(): Vehicle {
    return new Vehicle(new TeslaFleetApi({ server: "https://fleet.test" }));
}

/** A transport with no framing of its own, on the wire format of `authMethod`. */
class Transport extends Commands {
    readonly _transport_name = "test";
    fakeVehicle = new FakeVehicle();
    requests: RoutableMessage[] = [];
    replies: RoutableMessage[] = [];

    constructor(authMethod: "hmac" | "aes" = "aes", vin: string = VIN, privateKey: Buffer = OUR_PRIVATE_KEY) {
        super(makeParent(), vin, privateKey);
        this.authMethod = authMethod;
        this.retryDelayMs = 0;
        this.handshakeRetryDelayMs = 0;
    }

    protected async _send(msg: RoutableMessage): Promise<RoutableMessage> {
        const bytes = Buffer.from(RoutableMessage.encode(msg).finish());
        this.requests.push(RoutableMessage.decode(bytes));
        const resp = RoutableMessage.decode(this.fakeVehicle.handle(bytes));
        this.replies.push(resp);
        this.validate_msg(resp, Buffer.from(msg.uuid), msg.toDestination?.domain);
        return resp;
    }

    session(domain: Domain): Session {
        return this.sessionFor(domain);
    }

    build(domain: Domain, command: Buffer): RoutableMessage {
        return this.buildMessage(this.sessionFor(domain), command);
    }

    decrypt(domain: Domain, request: RoutableMessage, resp: RoutableMessage): RoutableMessage {
        return this.decryptResponse(this.sessionFor(domain), request, resp);
    }

    read(): Promise<VehicleData> {
        return this._getInfotainment(
            Action.create({ vehicleAction: VehicleAction.create({ getVehicleData: GetVehicleData.create({ getChargeState: {} }) }) }),
        );
    }

    /** Commit a session directly, for vectors whose session state is given. */
    commit(domain: Domain, vehiclePublicKey: Buffer, epoch: Buffer, counter: number, clockTime: number): void {
        const session = this.sessionFor(domain);
        const info = SessionInfo.create({ counter, publicKey: vehiclePublicKey, epoch, clockTime, status: SessionInfoStatus.SESSION_INFO_STATUS_OK });
        session.commit(info, session.keysFor(vehiclePublicKey));
    }

    lastCommand(): RoutableMessage {
        return this.requests[this.requests.length - 1];
    }
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

// protocol.md, "AES-GCM encryption".
describe("protocol.md AES-GCM vector", () => {
    const CLIENT_PRIVATE_KEY = hex("2538CDC29A97C19C1E99A637D6CF4F8C970C118B56EDE1E6323E6D162C4B30DB");
    const VEHICLE_PUBLIC_KEY = hex(
        "04c7a1f47138486aa4729971494878d33b1a24e39571f748a6e16c5955b3d877d3a6aaa0e955166474af5d32c410f439a2234137ad1bb085fd4e8813c958f11d97",
    );
    const METADATA = hex("000105010103021135594a333031323334353637383941424303104c463f9cc0d3d26906e982ed224adde6040400000a5f050400000007070400000002ff");
    const EPOCH = hex("4c463f9cc0d3d26906e982ed224adde6");
    const NONCE = hex("dbf79447fa156674dae1caed");

    it("is the command it says it is", () => {
        const command = Action.encode(
            Action.create({ vehicleAction: VehicleAction.create({ hvacAutoAction: HvacAutoAction.create({ powerOn: true }) }) }),
        ).finish();
        expect(Buffer.from(command).toString("hex")).toBe("120452020801");
    });

    it("reproduces the published ciphertext, tag and message fields", () => {
        const commands = new Transport("aes", "5YJ30123456789ABC", CLIENT_PRIVATE_KEY);
        commands.commit(Domain.DOMAIN_INFOTAINMENT, VEHICLE_PUBLIC_KEY, EPOCH, 6, 2650);
        expect(commands.session(Domain.DOMAIN_INFOTAINMENT).sharedKey?.toString("hex")).toBe("1b2fce19967b79db696f909cff89ea9a");
        vi.spyOn(commands.session(Domain.DOMAIN_INFOTAINMENT), "aesGcmPersonalized").mockReturnValue(
            AESGCMPersonalizedSignatureData.create({ epoch: EPOCH, nonce: NONCE, counter: 7, expiresAt: 2655 }),
        );

        const msg = commands.build(Domain.DOMAIN_INFOTAINMENT, hex("120452020801"));

        expect(Buffer.from(msg.protobufMessageAsBytes!).toString("hex")).toBe("38038e8c0f2e");
        const data = msg.signatureData!.AESGCMPersonalizedData!;
        expect(Buffer.from(data.tag).toString("hex")).toBe("c228e0ff64991481db3a7bbc133696c5");
        expect(data).toMatchObject({ counter: 7, expiresAt: 2655 });
        expect(msg.flags).toBe(2);
        expect(msg.signatureData!.HMACPersonalizedData).toBeUndefined();
    });

    it("holds with raw crypto over the published metadata", () => {
        const aad = crypto.createHash("sha256").update(METADATA).digest();
        const cipher = crypto.createCipheriv("aes-128-gcm", hex("1b2fce19967b79db696f909cff89ea9a"), NONCE);
        cipher.setAAD(aad);
        const ciphertext = Buffer.concat([cipher.update(hex("120452020801")), cipher.final()]);
        expect(ciphertext.toString("hex")).toBe("38038e8c0f2e");
        expect(cipher.getAuthTag().toString("hex")).toBe("c228e0ff64991481db3a7bbc133696c5");
    });
});

// test/fixtures/aes_gcm_python.json comes from Python's Commands._commandAes,
// and Python's Commands._command opened each reply. No real VIN or key.
describe.each(fixture.cases)("Python fixture: $name", (vector) => {
    const domain = vector.domain as Domain;

    function fixtureCommands(): { commands: Transport; request: RoutableMessage; reply: RoutableMessage } {
        vi.useFakeTimers({ toFake: ["Date"], now: fixture.now * 1000 });
        const commands = new Transport("aes", fixture.vin, hex(fixture.client_private_key));
        commands.commit(domain, publicKeyFor(hex(fixture.vehicle_private_key)), hex(fixture.epoch), fixture.counter, fixture.clock_time);
        return {
            commands,
            request: RoutableMessage.decode(hex(vector.request)),
            reply: RoutableMessage.decode(hex(vector.reply)),
        };
    }

    it("builds the same message as Python from the same nonce and session", () => {
        const { commands, request } = fixtureCommands();
        const random = crypto.randomBytes;
        vi.spyOn(crypto, "randomBytes").mockImplementation(((size: number) => (size === 12 ? hex(vector.nonce) : random(size))) as typeof crypto.randomBytes);

        const msg = commands.build(domain, hex(vector.plaintext));

        expect(Buffer.from(msg.protobufMessageAsBytes!)).toEqual(Buffer.from(request.protobufMessageAsBytes!));
        const ours = msg.signatureData!.AESGCMPersonalizedData!;
        const theirs = request.signatureData!.AESGCMPersonalizedData!;
        expect(Buffer.from(ours.tag)).toEqual(Buffer.from(theirs.tag));
        expect(Buffer.from(ours.nonce)).toEqual(Buffer.from(theirs.nonce));
        expect(Buffer.from(ours.epoch)).toEqual(Buffer.from(theirs.epoch));
        expect(ours.counter).toBe(theirs.counter);
        expect(ours.expiresAt).toBe(theirs.expiresAt);
        expect(msg.flags).toBe(request.flags);
        expect(Buffer.from(msg.signatureData!.signerIdentity!.publicKey!)).toEqual(Buffer.from(request.signatureData!.signerIdentity!.publicKey!));
        expect(msg.toDestination?.domain).toBe(request.toDestination?.domain);
    });

    it("opens Python's encrypted reply", () => {
        const { commands, request, reply } = fixtureCommands();
        const opened = commands.decrypt(domain, request, reply);
        expect(Buffer.from(opened.protobufMessageAsBytes!).toString("hex")).toBe(vector.reply_plaintext);
    });

    it("treats a second copy of Python's reply as a replay", () => {
        const { commands, request, reply } = fixtureCommands();
        commands.decrypt(domain, request, reply);
        expect(() => commands.decrypt(domain, request, reply)).toThrow(SignedCommandResponseReplayed);
    });
});

describe("AES-GCM round trip against an independent vehicle simulator", () => {
    it("encrypts the command and opens the reply on both domains", async () => {
        const commands = new Transport();
        await expect(commands.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });
        const vcsec = commands.lastCommand();
        await expect(commands.charge_start()).resolves.toEqual({ response: { result: true, reason: "" } });
        const infotainment = commands.lastCommand();

        for (const msg of [vcsec, infotainment]) {
            expect(msg.flags).toBe(2);
            expect(msg.signatureData?.AESGCMPersonalizedData).toBeDefined();
            expect(msg.signatureData?.HMACPersonalizedData).toBeUndefined();
        }
        const plaintext = UnsignedMessage.encode(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_LOCK })).finish();
        expect(Buffer.from(vcsec.protobufMessageAsBytes!).equals(Buffer.from(plaintext))).toBe(false);
        expect(commands.replies[commands.replies.length - 1].signatureData?.AESGCMResponseData).toBeDefined();
    });

    it("returns a decrypted read", async () => {
        const commands = new Transport();
        commands.fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ vehicleData: VehicleData.create({ chargeState: { chargeLimitSoc: 77 } as any }) }));
        await expect(commands.read()).resolves.toMatchObject({ chargeState: { chargeLimitSoc: 77 } });
    });

    it("re-encrypts with a fresh counter and nonce on a WAIT", async () => {
        const commands = new Transport();
        commands.fakeVehicle.queueWaits(1);
        await expect(commands.charge_stop()).resolves.toMatchObject({ response: { result: true } });
        const [first, second] = commands.requests.filter((msg) => msg.signatureData?.AESGCMPersonalizedData).map((msg) => msg.signatureData!.AESGCMPersonalizedData!);
        expect(second.counter).toBe(first.counter + 1);
        expect(Buffer.from(second.nonce).equals(Buffer.from(first.nonce))).toBe(false);
    });

    it("accepts a plaintext reply from firmware that ignores the flag", async () => {
        const commands = new Transport();
        commands.fakeVehicle.replyInPlaintextLikeOldFirmware();
        await expect(commands.charge_start()).resolves.toEqual({ response: { result: true, reason: "" } });
    });

    it("binds the reply's own flags, including non-zero ones", async () => {
        const commands = new Transport();
        commands.fakeVehicle.setReplyFlags(1);
        await expect(commands.charge_start()).resolves.toEqual({ response: { result: true, reason: "" } });
    });

    it("still absorbs a session resync on an AES session", async () => {
        const commands = new Transport();
        await commands.charge_start();
        commands.fakeVehicle.attachSessionInfoToNextReply();
        await expect(commands.charge_start()).resolves.toEqual({ response: { result: true, reason: "" } });
    });
});

describe("AES-GCM response integrity", () => {
    async function capturedReply(): Promise<{ commands: Transport; request: RoutableMessage; reply: RoutableMessage }> {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        const request = commands.build(Domain.DOMAIN_INFOTAINMENT, Buffer.from(Action.encode(Action.create({ vehicleAction: VehicleAction.create({ chargingSetLimitAction: ChargingSetLimitAction.create({ percent: 80 }) }) })).finish()));
        const reply = RoutableMessage.decode(commands.fakeVehicle.handle(Buffer.from(RoutableMessage.encode(request).finish())));
        return { commands, request, reply };
    }

    it("fails on a flipped ciphertext byte, end to end", async () => {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        commands.fakeVehicle.corruptNextReplyCiphertext();
        await expect(commands.charge_start()).rejects.toThrow(/authenticate/);
    });

    it("fails on a flipped tag byte", async () => {
        const { commands, request, reply } = await capturedReply();
        reply.signatureData!.AESGCMResponseData!.tag[0] ^= 1;
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, reply)).toThrow(/authenticate/);
    });

    it("rejects a truncated tag", async () => {
        const { commands, request, reply } = await capturedReply();
        const data = reply.signatureData!.AESGCMResponseData!;
        data.tag = data.tag.subarray(0, 12);
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, reply)).toThrow();
    });

    it.each([
        ["flags", (reply: RoutableMessage) => (reply.flags = 1)],
        ["counter", (reply: RoutableMessage) => (reply.signatureData!.AESGCMResponseData!.counter += 1)],
        ["fault", (reply: RoutableMessage) => (reply.signedMessageStatus!.signedMessageFault = 1)],
        ["domain", (reply: RoutableMessage) => (reply.fromDestination = { domain: Domain.DOMAIN_VEHICLE_SECURITY })],
    ])("fails when the reply's %s is changed", async (_field, tamper) => {
        const { commands, request, reply } = await capturedReply();
        tamper(reply);
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, reply)).toThrow(/authenticate/);
    });

    it("fails for a reply captured from another request", async () => {
        const { commands, reply } = await capturedReply();
        const other = commands.build(Domain.DOMAIN_INFOTAINMENT, Buffer.from("00", "hex"));
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, other, reply)).toThrow(/authenticate/);
    });

    it("does not record a counter for a reply that fails to open", async () => {
        const { commands, request, reply } = await capturedReply();
        const tampered = { ...reply, flags: 1 };
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, tampered)).toThrow();
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, reply)).not.toThrow();
    });

    it("raises SignedCommandResponseReplayed for a repeated (requestHash, counter)", async () => {
        const { commands, request, reply } = await capturedReply();
        commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, reply);
        expect(() => commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, reply)).toThrow(SignedCommandResponseReplayed);
    });

    it("leaves a plaintext reply as it is", async () => {
        const { commands, request, reply } = await capturedReply();
        const plain = { ...reply, signatureData: undefined };
        expect(commands.decrypt(Domain.DOMAIN_INFOTAINMENT, request, plain)).toBe(plain);
    });
});

describe("Session response counters", () => {
    function makeSession(): Session {
        return new Session(Domain.DOMAIN_INFOTAINMENT, () => Buffer.alloc(16, 1));
    }

    function commit(session: Session, epochByte: number): void {
        const publicKey = publicKeyFor(OUR_PRIVATE_KEY);
        session.commit(SessionInfo.create({ publicKey, epoch: Buffer.alloc(16, epochByte), clockTime: 1 }), session.keysFor(publicKey));
    }

    const hash = Buffer.alloc(17, 5);

    it("accepts a counter once per request", () => {
        const session = makeSession();
        expect(session.record_response_counter(hash, 6)).toBe(true);
        expect(session.record_response_counter(hash, 6)).toBe(false);
        expect(session.record_response_counter(Buffer.alloc(17, 6), 6)).toBe(true);
    });

    it("accepts a decreasing unused counter", () => {
        const session = makeSession();
        expect(session.record_response_counter(hash, 9)).toBe(true);
        expect(session.record_response_counter(hash, 8)).toBe(true);
    });

    it("keeps only the last 256 pairs", () => {
        const session = makeSession();
        for (let counter = 0; counter <= 256; counter++) {
            expect(session.record_response_counter(hash, counter)).toBe(true);
        }
        expect(session.record_response_counter(hash, 256)).toBe(false);
        expect(session.record_response_counter(hash, 1)).toBe(false);
        expect(session.record_response_counter(hash, 0)).toBe(true);
    });

    it("clears on a new epoch and not within one", () => {
        const session = makeSession();
        commit(session, 1);
        session.record_response_counter(hash, 1);
        commit(session, 1);
        expect(session.record_response_counter(hash, 1)).toBe(false);
        commit(session, 2);
        expect(session.record_response_counter(hash, 1)).toBe(true);
    });
});

describe("AES-GCM request metadata", () => {
    it("expires 30 seconds ahead, corrected by delta", async () => {
        vi.useFakeTimers({ toFake: ["Date"], now: 1_800_000_000_000 });
        const commands = new Transport();
        commands.commit(Domain.DOMAIN_INFOTAINMENT, publicKeyFor(OUR_PRIVATE_KEY), Buffer.alloc(16, 1), 0, 500);
        const data = commands.build(Domain.DOMAIN_INFOTAINMENT, Buffer.from("00", "hex")).signatureData!.AESGCMPersonalizedData!;
        expect(data.expiresAt).toBe(530);
    });

    it("takes each nonce from crypto.randomBytes", async () => {
        const spy = vi.spyOn(crypto, "randomBytes");
        const commands = new Transport();
        commands.commit(Domain.DOMAIN_INFOTAINMENT, publicKeyFor(OUR_PRIVATE_KEY), Buffer.alloc(16, 1), 0, 500);
        spy.mockClear();

        const first = commands.build(Domain.DOMAIN_INFOTAINMENT, Buffer.from("00", "hex")).signatureData!.AESGCMPersonalizedData!;
        const second = commands.build(Domain.DOMAIN_INFOTAINMENT, Buffer.from("00", "hex")).signatureData!.AESGCMPersonalizedData!;

        const nonces = spy.mock.calls.filter(([size]) => size === 12);
        expect(nonces).toHaveLength(2);
        expect(first.nonce).toHaveLength(12);
        expect(Buffer.from(first.nonce).equals(Buffer.from(second.nonce))).toBe(false);
    });

    it("advances the counter", () => {
        const commands = new Transport();
        commands.commit(Domain.DOMAIN_INFOTAINMENT, publicKeyFor(OUR_PRIVATE_KEY), Buffer.alloc(16, 1), 41, 500);
        expect(commands.build(Domain.DOMAIN_INFOTAINMENT, Buffer.from("00", "hex")).signatureData!.AESGCMPersonalizedData!.counter).toBe(42);
    });
});

describe("HMAC subclass", () => {
    it("still sends plaintext, unflagged, with no AES fields", async () => {
        const commands = new Transport("hmac");
        await expect(commands.set_charge_limit(80)).resolves.toMatchObject({ response: { result: true } });
        const msg = commands.lastCommand();
        const action = Action.decode(msg.protobufMessageAsBytes!);
        expect(action.vehicleAction?.chargingSetLimitAction?.percent).toBe(80);
        expect(msg.flags).toBe(0);
        expect(msg.signatureData?.HMACPersonalizedData).toBeDefined();
        expect(msg.signatureData?.AESGCMPersonalizedData).toBeUndefined();
        expect(commands.replies[commands.replies.length - 1].signatureData?.AESGCMResponseData).toBeUndefined();
    });

    // protocol.md "Request hash": the hash is the whole HMAC tag, truncated to
    // 17 bytes only for VCSEC, and its true length goes in the metadata.
    it.each([
        ["VCSEC, with a truncated request hash", (commands: Transport) => commands.door_lock()],
        ["Infotainment, with the full request hash", (commands: Transport) => commands.charge_start()],
    ])("opens an encrypted reply to an HMAC request on %s", async (_name, send) => {
        const commands = new Transport("hmac");
        commands.fakeVehicle.encryptRepliesToHmacRequests();
        await expect(send(commands)).resolves.toEqual({ response: { result: true, reason: "" } });
        expect(commands.replies[commands.replies.length - 1].signatureData?.AESGCMResponseData).toBeDefined();
    });
});

it("metadata tags come from tesla-protocol", () => {
    expect(SignatureType.SIGNATURE_TYPE_AES_GCM_PERSONALIZED).toBe(5);
    expect(SignatureType.SIGNATURE_TYPE_AES_GCM_RESPONSE).toBe(9);
    expect(Tag.TAG_FLAGS).toBe(7);
});
