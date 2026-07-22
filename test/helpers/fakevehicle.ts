import crypto from "crypto";
import {
    Domain,
    MessageFaultE,
    RoutableMessage,
    OperationStatusE as MessageOperationStatusE,
} from "@teslemetry/tesla-protocol/command/universal_message";
import {
    SessionInfo,
    SessionInfoStatus,
    Tag,
    SignatureType,
} from "@teslemetry/tesla-protocol/command/signatures";
import { UnsignedMessage, FromVCSECMessage, CommandStatus, OperationStatusE as VcsecOperationStatusE } from "@teslemetry/tesla-protocol/command/vcsec";
import { Action, Response, ActionStatus, OperationStatusE as ActionOperationStatusE } from "@teslemetry/tesla-protocol/command/car_server";
import { deriveSharedKey, publicKeyFor, uint32BE } from "../../src/signing/crypto.js";

const VIN = "5YJXCAE43LF123456";

type SessionInfoAttack =
    | { kind: "corrupt-tag" }
    | { kind: "wrong-challenge" }
    | { kind: "stale"; counter: number; clockTime: number };

interface DomainState {
    epoch: Buffer;
    counter: number;
    clockTime: number;
    clientPublicKey?: Buffer;
    hmacKey?: Buffer;
    sessionInfoKey?: Buffer;
}

/**
 * A minimal independent re-implementation of the *vehicle* side of the
 * signed-command protocol, used to verify `Commands`/`VehicleSigned` against
 * a second, from-scratch implementation of the same wire format rather than
 * against itself. Every reply carrying `sessionInfo` is tagged exactly as a
 * real vehicle would (`HMAC-SHA256(HMAC-SHA256(K, "session info"), metadata || sessionInfo)`),
 * so tests can also script a MITM tampering with or replaying that reply.
 */
export class FakeVehicle {
    readonly privateKey: Buffer;
    readonly publicKey: Buffer;
    private readonly domainState = new Map<Domain, DomainState>();
    private nextOutcome: "ok" | "not_whitelisted" | "bad_signature" = "ok";
    private waitCountRemaining = 0;
    private nextSessionInfoAttack: SessionInfoAttack | null = null;
    private attachSessionInfoOnNextReply = false;

    constructor(privateKey?: Buffer) {
        this.privateKey = privateKey ?? crypto.randomBytes(32);
        this.publicKey = publicKeyFor(this.privateKey);
    }

    /** Script the vehicle to reply with N `WAIT`s before finally succeeding. */
    queueWaits(count: number): void {
        this.waitCountRemaining = count;
    }

    /** Script the next reply to reject the key as not on the vehicle's whitelist. */
    rejectNextAsNotWhitelisted(): void {
        this.nextOutcome = "not_whitelisted";
    }

    /** Script the next reply to claim the signature was invalid (tests non-retryable faults). */
    rejectNextAsBadSignature(): void {
        this.nextOutcome = "bad_signature";
    }

    /** Simulate a MITM flipping a bit in `session_info_tag` (or the session info it covers). */
    corruptNextSessionInfoTag(): void {
        this.nextSessionInfoAttack = { kind: "corrupt-tag" };
    }

    /** Simulate a captured old session-info reply replayed against a request it wasn't tagged for. */
    spoofNextSessionInfoChallenge(): void {
        this.nextSessionInfoAttack = { kind: "wrong-challenge" };
    }

    /** Simulate a validly-*signed* but stale (rolled-back counter/clock, same epoch) session-info replay. */
    replayStaleSessionInfo(counter: number, clockTime: number): void {
        this.nextSessionInfoAttack = { kind: "stale", counter, clockTime };
    }

    /**
     * Simulate a vehicle piggy-backing a (by default honest) session-info
     * resync onto the reply to an ordinary command, as the spec describes for
     * "Recovering from synchronization errors" - combine with one of the
     * `SessionInfoAttack` scripts above to simulate a tampered resync attempt.
     */
    attachSessionInfoToNextReply(): void {
        this.attachSessionInfoOnNextReply = true;
    }

    private stateFor(domain: Domain): DomainState {
        let state = this.domainState.get(domain);
        if (!state) {
            state = { epoch: crypto.randomBytes(16), counter: 0, clockTime: Math.floor(Date.now() / 1000) };
            this.domainState.set(domain, state);
        }
        return state;
    }

    private keysFor(state: DomainState): { hmacKey: Buffer; sessionInfoKey: Buffer } {
        if (!state.clientPublicKey) {
            throw new Error("FakeVehicle received a command before a handshake.");
        }
        if (!state.hmacKey || !state.sessionInfoKey) {
            const sharedKey = deriveSharedKey(this.privateKey, state.clientPublicKey);
            state.hmacKey = crypto.createHmac("sha256", sharedKey).update("authenticated command").digest();
            state.sessionInfoKey = crypto.createHmac("sha256", sharedKey).update("session info").digest();
        }
        return { hmacKey: state.hmacKey, sessionInfoKey: state.sessionInfoKey };
    }

    /**
     * Build the (correctly, or per a scripted attack, incorrectly)
     * authenticated session-info + tag bytes. For "wrong-challenge", the
     * whole reply is built as an internally-consistent, correctly-tagged
     * message for a *different* (fabricated) request uuid - simulating a
     * captured older genuine reply replayed verbatim against today's request,
     * rather than just a corrupted tag.
     */
    private buildSessionInfoFields(
        requestUuid: Uint8Array,
        status: SessionInfoStatus,
        state: DomainState,
    ): { sessionInfo: Uint8Array; tag: Uint8Array; requestUuid: Uint8Array } {
        const attack = this.nextSessionInfoAttack;
        this.nextSessionInfoAttack = null;

        const counter = attack?.kind === "stale" ? attack.counter : state.counter;
        const clockTime = attack?.kind === "stale" ? attack.clockTime : state.clockTime;

        const info = SessionInfo.create({
            counter,
            publicKey: this.publicKey,
            epoch: state.epoch,
            clockTime,
            status,
        });
        const infoBytes = Buffer.from(SessionInfo.encode(info).finish());

        const effectiveRequestUuid = attack?.kind === "wrong-challenge" ? crypto.randomBytes(16) : Buffer.from(requestUuid);
        const { sessionInfoKey } = this.keysFor(state);
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(VIN, "ascii"),
            Buffer.from([Tag.TAG_CHALLENGE, effectiveRequestUuid.length]),
            effectiveRequestUuid,
            Buffer.from([Tag.TAG_END]),
        ]);
        let tag = crypto.createHmac("sha256", sessionInfoKey).update(Buffer.concat([metadata, infoBytes])).digest();
        if (attack?.kind === "corrupt-tag") {
            tag = Buffer.from(tag);
            tag[0] ^= 0xff;
        }

        return { sessionInfo: infoBytes, tag, requestUuid: effectiveRequestUuid };
    }

    /** Build a dedicated (handshake or whitelist-rejection) session-info reply. */
    private buildSessionInfoReply(domain: Domain, requestUuid: Uint8Array, status: SessionInfoStatus, state: DomainState): Buffer {
        const fields = this.buildSessionInfoFields(requestUuid, status, state);
        const reply = RoutableMessage.create({
            fromDestination: { domain },
            requestUuid: fields.requestUuid,
            sessionInfo: fields.sessionInfo,
            signatureData: { sessionInfoTag: { tag: fields.tag } },
            uuid: crypto.randomBytes(16),
        });
        return Buffer.from(RoutableMessage.encode(reply).finish());
    }

    /** Process one request `RoutableMessage` exactly as a vehicle would, and return its reply bytes. */
    handle(requestBytes: Buffer): Buffer {
        const msg = RoutableMessage.decode(requestBytes);
        const domain = msg.toDestination?.domain ?? Domain.DOMAIN_BROADCAST;
        const state = this.stateFor(domain);

        if (msg.sessionInfoRequest) {
            state.clientPublicKey = Buffer.from(msg.sessionInfoRequest.publicKey);
            state.hmacKey = undefined;
            state.sessionInfoKey = undefined;
            return this.buildSessionInfoReply(domain, msg.uuid, SessionInfoStatus.SESSION_INFO_STATUS_OK, state);
        }

        if (this.nextOutcome === "not_whitelisted") {
            this.nextOutcome = "ok";
            return this.buildSessionInfoReply(domain, msg.uuid, SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST, state);
        }

        if (this.nextOutcome === "bad_signature") {
            this.nextOutcome = "ok";
            const reply = RoutableMessage.create({
                fromDestination: { domain },
                signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_INVALID_SIGNATURE },
                uuid: crypto.randomBytes(16),
            });
            return Buffer.from(RoutableMessage.encode(reply).finish());
        }

        // A real command: verify the HMAC tag ourselves, independently of the
        // client's own construction, before accepting it.
        const hmacData = msg.signatureData?.HMACPersonalizedData;
        if (!hmacData) {
            throw new Error("FakeVehicle only supports HMAC-personalized requests.");
        }
        const { hmacKey } = this.keysFor(state);

        const command = Buffer.from(msg.protobufMessageAsBytes ?? new Uint8Array());
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]),
            Buffer.from([Tag.TAG_DOMAIN, 1, domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(VIN, "ascii"),
            Buffer.from([Tag.TAG_EPOCH, hmacData.epoch.length]),
            Buffer.from(hmacData.epoch),
            Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
            uint32BE(hmacData.expiresAt),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(hmacData.counter),
            Buffer.from([Tag.TAG_END]),
        ]);
        const expectedTag = crypto.createHmac("sha256", hmacKey).update(Buffer.concat([metadata, command])).digest();
        if (!expectedTag.equals(Buffer.from(hmacData.tag))) {
            const reply = RoutableMessage.create({
                fromDestination: { domain },
                signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_INVALID_SIGNATURE },
                uuid: crypto.randomBytes(16),
            });
            return Buffer.from(RoutableMessage.encode(reply).finish());
        }
        state.counter = hmacData.counter;

        if (this.waitCountRemaining > 0) {
            this.waitCountRemaining--;
            const reply = RoutableMessage.create({
                fromDestination: { domain },
                signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_WAIT, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_NONE },
                uuid: crypto.randomBytes(16),
            });
            return Buffer.from(RoutableMessage.encode(reply).finish());
        }

        let payload: Uint8Array;
        if (domain === Domain.DOMAIN_VEHICLE_SECURITY) {
            UnsignedMessage.decode(command); // exercised for shape validation
            payload = FromVCSECMessage.encode(
                FromVCSECMessage.create({
                    commandStatus: CommandStatus.create({ operationStatus: VcsecOperationStatusE.OPERATIONSTATUS_OK }),
                }),
            ).finish();
        } else {
            Action.decode(command); // exercised for shape validation
            payload = Response.encode(
                Response.create({ actionStatus: ActionStatus.create({ result: ActionOperationStatusE.OPERATIONSTATUS_OK }) }),
            ).finish();
        }

        let resync: { sessionInfo: Uint8Array; tag: Uint8Array } | undefined;
        if (this.attachSessionInfoOnNextReply) {
            this.attachSessionInfoOnNextReply = false;
            resync = this.buildSessionInfoFields(msg.uuid, SessionInfoStatus.SESSION_INFO_STATUS_OK, state);
        }

        const reply = RoutableMessage.create({
            fromDestination: { domain },
            requestUuid: msg.uuid,
            protobufMessageAsBytes: payload,
            sessionInfo: resync?.sessionInfo,
            signatureData: resync ? { sessionInfoTag: { tag: resync.tag } } : undefined,
            signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_NONE },
            uuid: crypto.randomBytes(16),
        });
        return Buffer.from(RoutableMessage.encode(reply).finish());
    }
}
