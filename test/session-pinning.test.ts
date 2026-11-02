import { afterEach, describe, expect, it, vi } from "vitest";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { SessionInfo } from "@teslemetry/tesla-protocol/command/signatures";
import { Action, GetVehicleData, VehicleAction } from "@teslemetry/tesla-protocol/command/car_server";
import { VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import Commands from "../src/commands.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import { SessionInfoAuthenticationFault } from "../src/exceptions.js";
import { publicKeyFor } from "../src/signing/crypto.js";
import { Session } from "../src/signing/session.js";
import { FakeVehicle } from "./helpers/fakevehicle.js";
import { SessionAttacker } from "./helpers/sessionattacker.js";

// The vehicle's key is trusted once, at first contact, as Tesla's Go SDK does in
// Signer.UpdateSignedSessionInfo and UpdateSessionInfo. Replies come from a
// SessionAttacker, which sees only the wire: anyone who saw the client's public
// key can tag a SessionInfo naming a key of their own, so a tag verified with a
// key derived from the reply proves nothing.

const VIN = "5YJXCAE43LF123456";
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");
const INFOTAINMENT = Domain.DOMAIN_INFOTAINMENT;
const VCSEC = Domain.DOMAIN_VEHICLE_SECURITY;

class Transport extends Commands {
    readonly _transport_name = "test";
    fakeVehicle = new FakeVehicle();
    /** Replaces the vehicle for a request; `forward` reaches the honest one. */
    interceptor?: (request: RoutableMessage, forward: () => RoutableMessage) => RoutableMessage;
    sends = 0;

    constructor(authMethod: "hmac" | "aes" = "hmac") {
        super(new Vehicle(new TeslaFleetApi({ server: "https://fleet.test" })), VIN, OUR_PRIVATE_KEY);
        this.authMethod = authMethod;
        this.retryDelayMs = 0;
        this.handshakeRetryDelayMs = 0;
    }

    protected async _send(msg: RoutableMessage): Promise<RoutableMessage> {
        this.sends++;
        const bytes = Buffer.from(RoutableMessage.encode(msg).finish());
        const forward = () => RoutableMessage.decode(this.fakeVehicle.handle(bytes));
        const resp = this.interceptor ? this.interceptor(RoutableMessage.decode(bytes), forward) : forward();
        this.validate_msg(resp, Buffer.from(msg.uuid), msg.toDestination?.domain);
        return resp;
    }

    session(domain: Domain = INFOTAINMENT): Session {
        return this.sessionFor(domain);
    }

    build(domain: Domain = INFOTAINMENT): RoutableMessage {
        return this.buildMessage(this.sessionFor(domain), Buffer.from("00", "hex"));
    }

    read(): Promise<VehicleData> {
        return this._getInfotainment(
            Action.create({ vehicleAction: VehicleAction.create({ getVehicleData: GetVehicleData.create({ getChargeState: {} }) }) }),
        );
    }
}

/** Everything a forged reply could plant, as comparable strings. The client's own signing moves `counter`. */
function trustedState(session: Session) {
    return {
        publicKey: session.publicKey?.toString("hex"),
        sharedKey: session.sharedKey?.toString("hex"),
        hmacKey: session.hmacKey?.toString("hex"),
        sessionInfoKey: session.sessionInfoKey?.toString("hex"),
        epoch: session.epoch?.toString("hex"),
        delta: session.delta,
    };
}

afterEach(() => {
    vi.useRealTimers();
});

describe("an established session refuses a replacement vehicle key", () => {
    it("on a handshake, leaving state unchanged and the session usable", async () => {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        const before = trustedState(commands.session());
        const counter = commands.session().counter;
        const attacker = new SessionAttacker(VIN);
        commands.interceptor = (request) => attacker.forgeSessionInfoReply(request, { clockTime: 0xfffffff0, counter: 5000 });

        await expect(commands.handshakeInfotainment()).rejects.toThrow(SessionInfoAuthenticationFault);

        expect(trustedState(commands.session())).toEqual(before);
        expect(commands.session().counter).toBe(counter);
        commands.interceptor = undefined;
        await expect(commands.charge_start()).resolves.toEqual({ response: { result: true, reason: "" } });
    });

    it("says why, and what to do", async () => {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        const attacker = new SessionAttacker(VIN);
        commands.interceptor = (request) => attacker.forgeSessionInfoReply(request);
        const error = await commands.handshakeInfotainment().catch((e: unknown) => e);
        expect((error as SessionInfoAuthenticationFault).data).toMatch(/public key.*changed.*new instance/i);
    });

    it("on a piggy-backed resync", async () => {
        const commands = new Transport();
        await commands.charge_start();
        const before = trustedState(commands.session());
        const counter = commands.session().counter;
        const attacker = new SessionAttacker(VIN);
        commands.interceptor = (request, forward) => attacker.graftResync(request, forward(), { clockTime: 0xfffffff0, counter: 5000 });

        await expect(commands.charge_start()).rejects.toThrow(SessionInfoAuthenticationFault);

        expect(trustedState(commands.session())).toEqual(before);
        expect(commands.session().counter).toBe(counter + 1); // only the client's own signing
    });

    it("on an AES read, and never returns the forged data", async () => {
        const commands = new Transport("aes");
        await commands.handshakeInfotainment();
        const before = trustedState(commands.session());
        const attacker = new SessionAttacker(VIN);
        // A clock ahead of the vehicle's, so only the key can stop this reply.
        commands.interceptor = (request) =>
            attacker.forgeEncryptedRead(request, VehicleData.create({ chargeState: { chargeLimitSoc: 1 } as any }), { clockTime: 0xfffffff0 });

        const error = await commands.read().catch((e: unknown) => e);

        expect(error).toBeInstanceOf(SessionInfoAuthenticationFault);
        expect((error as SessionInfoAuthenticationFault).data).toMatch(/public key.*changed/i);
        expect(trustedState(commands.session())).toEqual(before);
    });

    it("rejects a tag from any key but the stored one, even when the reply names the pinned key", async () => {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        const before = trustedState(commands.session());
        const attacker = new SessionAttacker(VIN);
        const claimedPublicKey = commands.session().publicKey;
        commands.interceptor = (request) => attacker.forgeSessionInfoReply(request, { claimedPublicKey, epoch: Buffer.alloc(16, 9) });

        const error = await commands.handshakeInfotainment().catch((e: unknown) => e);

        expect(error).toBeInstanceOf(SessionInfoAuthenticationFault);
        expect((error as SessionInfoAuthenticationFault).data).toMatch(/invalid tag/i);
        expect(trustedState(commands.session())).toEqual(before);
    });

    it("keeps the pin through a handshake retry, recovering on the honest reply", async () => {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        const pinned = commands.session().publicKey?.toString("hex");
        const attacker = new SessionAttacker(VIN);
        let replies = 0;
        commands.interceptor = (request, forward) => (++replies < 3 ? attacker.forgeSessionInfoReply(request) : forward());

        await expect(commands.handshakeInfotainment()).resolves.toBeUndefined();

        expect(replies).toBe(3);
        expect(commands.session().publicKey?.toString("hex")).toBe(pinned);
    });

    it("keeps the pin on a domain's own session, leaving the other domain free", async () => {
        const commands = new Transport();
        await commands.handshakeVehicleSecurity();
        await commands.handshakeInfotainment();
        expect(commands.session(VCSEC).publicKey).toBeDefined();
        expect(commands.session(INFOTAINMENT).publicKey).toBeDefined();
    });

    it("fails a genuinely re-keyed vehicle, and a new instance trusts it", async () => {
        const commands = new Transport();
        await commands.handshakeInfotainment();
        const rekeyed = new FakeVehicle();
        commands.fakeVehicle = rekeyed;

        await expect(commands.handshakeInfotainment()).rejects.toThrow(SessionInfoAuthenticationFault);

        const fresh = new Transport();
        fresh.fakeVehicle = rekeyed;
        await expect(fresh.charge_start()).resolves.toMatchObject({ response: { result: true } });
    });
});

describe("Session pinning", () => {
    const VEHICLE_KEY = publicKeyFor(Buffer.alloc(32, 7));
    const OTHER_KEY = publicKeyFor(Buffer.alloc(32, 8));

    function makeSession(): Session {
        return new Session(INFOTAINMENT, (key) => key.subarray(1, 17));
    }

    function info(overrides: Partial<SessionInfo> = {}): SessionInfo {
        return SessionInfo.create({ publicKey: VEHICLE_KEY, epoch: Buffer.alloc(16, 1), clockTime: 100, ...overrides });
    }

    it("commit keeps the keys it has, whatever a caller passes", () => {
        const session = makeSession();
        session.commit(info(), session.keysFor(VEHICLE_KEY));
        const before = trustedState(session);

        expect(session.commit(info({ clockTime: 101 }), session.keysFor(OTHER_KEY))).toBe(true);

        expect(session.sharedKey?.toString("hex")).toBe(before.sharedKey);
        expect(session.sessionInfoKey?.toString("hex")).toBe(before.sessionInfoKey);
    });

    it("commit refuses a different public key, changing nothing", () => {
        const session = makeSession();
        session.commit(info(), session.keysFor(VEHICLE_KEY));
        const before = trustedState(session);

        expect(() => session.commit(info({ publicKey: OTHER_KEY, epoch: Buffer.alloc(16, 2) }), session.keysFor(OTHER_KEY))).toThrow(
            SessionInfoAuthenticationFault,
        );

        expect(trustedState(session)).toEqual(before);
    });

    it("trustedKeys derives at first contact, then only returns the stored keys", () => {
        const session = makeSession();
        const first = session.trustedKeys(VEHICLE_KEY);
        expect(first.sessionInfoKey).toEqual(session.keysFor(VEHICLE_KEY).sessionInfoKey);
        session.commit(info(), first);

        const derive = vi.spyOn(session as unknown as { deriveSharedKey: () => Buffer }, "deriveSharedKey");
        expect(session.trustedKeys(VEHICLE_KEY).sessionInfoKey).toEqual(first.sessionInfoKey);
        expect(() => session.trustedKeys(OTHER_KEY)).toThrow(SessionInfoAuthenticationFault);
        expect(derive).not.toHaveBeenCalled();
    });

    it("has no way to reassign the pinned key", () => {
        const session = makeSession();
        session.commit(info(), session.keysFor(VEHICLE_KEY));
        expect(() => {
            (session as { publicKey?: Buffer }).publicKey = OTHER_KEY;
        }).toThrow(TypeError);
    });
});

describe("a session info that cannot sign", () => {
    it.each([
        ["a clock too near the uint32 limit", { clockTime: 0xfffffff0 }],
        ["an exhausted counter", { counter: 0xffffffff }],
    ])("is refused at first contact with %s, and pins nothing", async (_name, forged) => {
        const commands = new Transport();
        const attacker = new SessionAttacker(VIN);
        commands.interceptor = (request) => attacker.forgeSessionInfoReply(request, forged);

        await expect(commands.handshakeInfotainment()).rejects.toThrow(SessionInfoAuthenticationFault);

        expect(commands.session().ready).toBe(false);
        expect(commands.session().publicKey).toBeUndefined();
        commands.interceptor = undefined;
        await expect(commands.charge_start()).resolves.toMatchObject({ response: { result: true } });
    });

    function nearLimit(authMethod: "hmac" | "aes"): Transport {
        vi.useFakeTimers({ toFake: ["Date"], now: 1_800_000_000_000 });
        const commands = new Transport(authMethod);
        const publicKey = publicKeyFor(Buffer.alloc(32, 7));
        const session = commands.session();
        session.commit(SessionInfo.create({ publicKey, epoch: Buffer.alloc(16, 1), clockTime: 0xffffffff - 31, counter: 5 }), session.keysFor(publicKey));
        return commands;
    }

    it.each(["hmac", "aes"] as const)("raises a typed fault, not invalid uint32, once %s expiry would overflow", (authMethod) => {
        const commands = nearLimit(authMethod);
        expect(commands.build().signatureData).toBeDefined();
        vi.setSystemTime(1_800_000_060_000);
        const counter = commands.session().counter;

        expect(() => commands.build()).toThrow(SessionInfoAuthenticationFault);

        expect(commands.session().counter).toBe(counter);
    });

    it.each(["hmac", "aes"] as const)("raises a typed fault at counter rollover under %s", (authMethod) => {
        const commands = nearLimit(authMethod);
        commands.session().counter = 0xffffffff;
        expect(() => commands.build()).toThrow(SessionInfoAuthenticationFault);
        expect(commands.session().counter).toBe(0xffffffff);
    });

    it("recovers on a new epoch from the same vehicle", () => {
        const commands = nearLimit("hmac");
        vi.setSystemTime(1_800_000_060_000);
        const session = commands.session();
        const publicKey = session.publicKey!;

        session.commit(SessionInfo.create({ publicKey, epoch: Buffer.alloc(16, 2), clockTime: 50, counter: 1 }), session.trustedKeys(publicKey));

        expect(commands.build().signatureData?.HMACPersonalizedData?.expiresAt).toBe(60);
    });
});
