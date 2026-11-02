import crypto from "crypto";
import {
    Domain,
    Flags,
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
import {
    UnsignedMessage,
    FromVCSECMessage,
    CommandStatus,
    OperationStatusE as VcsecOperationStatusE,
    VehicleStatus,
    WhitelistOperation,
    WhitelistOperationInformationE,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { Action, Response, ActionStatus, OperationStatusE as ActionOperationStatusE } from "@teslemetry/tesla-protocol/command/car_server";
import { deriveSharedKey, publicKeyFor, uint32BE } from "../../src/signing/crypto.js";

const VIN = "5YJXCAE43LF123456";

/** The vehicle clock a `FakeVehicle` reports in a ping reply. */
export const FAKE_PING_TIMESTAMP = new Date("2026-01-02T03:04:05.000Z");

type SessionInfoAttack =
    | { kind: "corrupt-tag" }
    | { kind: "empty-tag" }
    | { kind: "wrong-challenge" }
    | { kind: "stale"; counter: number; clockTime: number };

interface DomainState {
    epoch: Buffer;
    counter: number;
    clockTime: number;
    responseCounter: number;
    clientPublicKey?: Buffer;
    sharedKey?: Buffer;
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
    private sessionInfoAttacks: SessionInfoAttack[] = [];
    private attachSessionInfoOnNextReply = false;
    private omitRequestUuidEcho = false;
    private emptyKeyHandshakeStatuses: SessionInfoStatus[] = [];
    private nextVcsecReply: FromVCSECMessage | null = null;
    private nextInfotainmentReplies: Response[] = [];
    private plaintextReplies = false;
    private encryptHmacReplies = false;
    private corruptNextReply = false;
    private replyFlags = 0;
    /** What a VCSEC status read returns. Unset, it gets the same `commandStatus` OK as any other command. */
    vehicleStatus: VehicleStatus | null = null;
    /** Whether the client's key is on the whitelist. Until it is, every handshake answers with no public key. */
    keyEnrolled = true;
    /** What the next whitelist operation's reply reports. */
    whitelistInformation = WhitelistOperationInformationE.WHITELISTOPERATION_INFORMATION_NONE;
    /** Every whitelist operation that reached this vehicle. */
    readonly whitelistOperations: WhitelistOperation[] = [];
    /** Called with each accepted VCSEC command, before the reply is built. */
    onVcsecCommand: ((command: UnsignedMessage) => void) | null = null;
    /** Answers an accepted Infotainment action. `null` leaves it to the usual reply. */
    onInfotainmentAction: ((action: Action) => Response | null) | null = null;
    /** Counters of every VCSEC command in the order this FakeVehicle actually received them - for concurrency/ordering tests. */
    readonly vcsecCounterArrivals: number[] = [];
    /** Every accepted VCSEC command, decoded on this side of the wire. */
    readonly vcsecCommands: UnsignedMessage[] = [];
    /** Every accepted Infotainment command, decoded on this side of the wire. */
    readonly infotainmentActions: Action[] = [];

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

    /** Simulate a MITM flipping a bit in `session_info_tag` (or the session info it covers) on the next `replies`. */
    corruptNextSessionInfoTag(replies: number = 1): void {
        this.sessionInfoAttacks.push(...Array<SessionInfoAttack>(replies).fill({ kind: "corrupt-tag" }));
    }

    /**
     * Simulate the reply VCSEC was seen to send right after a key was added:
     * a `session_info_tag` that is present but zero-length.
     */
    emptyNextSessionInfoTag(replies: number = 1): void {
        this.sessionInfoAttacks.push(...Array<SessionInfoAttack>(replies).fill({ kind: "empty-tag" }));
    }

    /**
     * Reply to the next `replies` session-info requests with no public key, as
     * a vehicle does for a key it has no session with. Such a reply carries no
     * usable tag.
     */
    replyToNextHandshakeWithoutPublicKey(status: SessionInfoStatus, replies: number = 1): void {
        this.emptyKeyHandshakeStatuses.push(...Array<SessionInfoStatus>(replies).fill(status));
    }

    /** Answer the next accepted VCSEC command with this message instead of `commandStatus` OK. */
    replyToNextVcsecCommandWith(message: FromVCSECMessage): void {
        this.nextVcsecReply = message;
    }

    /** Answer the next accepted Infotainment command with this message instead of `actionStatus` OK. Calls queue up. */
    replyToNextInfotainmentCommandWith(message: Response): void {
        this.nextInfotainmentReplies.push(message);
    }

    /** Ignore `FLAG_ENCRYPT_RESPONSE`, as firmware before 2024.38 does. */
    replyInPlaintextLikeOldFirmware(): void {
        this.plaintextReplies = true;
    }

    /** Encrypt replies to HMAC-personalized requests too, which needs no flag on a reply's side of the spec. */
    encryptRepliesToHmacRequests(): void {
        this.encryptHmacReplies = true;
    }

    /** Simulate a MITM flipping one ciphertext byte of the next encrypted reply. */
    corruptNextReplyCiphertext(): void {
        this.corruptNextReply = true;
    }

    /** The flags field of every later reply, which an encrypted reply binds into its metadata. */
    setReplyFlags(flags: number): void {
        this.replyFlags = flags;
    }

    /** Simulate a captured old session-info reply replayed against a request it wasn't tagged for, on the next `replies`. */
    spoofNextSessionInfoChallenge(replies: number = 1): void {
        this.sessionInfoAttacks.push(...Array<SessionInfoAttack>(replies).fill({ kind: "wrong-challenge" }));
    }

    /** Simulate a validly-*signed* but stale (rolled-back counter/clock, same epoch) session-info replay. */
    replayStaleSessionInfo(counter: number, clockTime: number): void {
        this.sessionInfoAttacks.push({ kind: "stale", counter, clockTime });
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

    /**
     * Simulate real VCSEC hardware, which (per protocol.md's "memory
     * constraints" note) typically leaves `request_uuid` empty on its
     * replies rather than echoing the request's `uuid` back. The
     * `session_info_tag` is still computed against the real challenge the
     * client sent - only the outer echo field is left unset.
     */
    omitRequestUuidLikeRealVcsec(): void {
        this.omitRequestUuidEcho = true;
    }

    private stateFor(domain: Domain): DomainState {
        let state = this.domainState.get(domain);
        if (!state) {
            state = { epoch: crypto.randomBytes(16), counter: 0, clockTime: Math.floor(Date.now() / 1000), responseCounter: 0 };
            this.domainState.set(domain, state);
        }
        return state;
    }

    private keysFor(state: DomainState): { sharedKey: Buffer; hmacKey: Buffer; sessionInfoKey: Buffer } {
        if (!state.clientPublicKey) {
            throw new Error("FakeVehicle received a command before a handshake.");
        }
        if (!state.sharedKey || !state.hmacKey || !state.sessionInfoKey) {
            state.sharedKey = deriveSharedKey(this.privateKey, state.clientPublicKey);
            state.hmacKey = crypto.createHmac("sha256", state.sharedKey).update("authenticated command").digest();
            state.sessionInfoKey = crypto.createHmac("sha256", state.sharedKey).update("session info").digest();
        }
        return { sharedKey: state.sharedKey, hmacKey: state.hmacKey, sessionInfoKey: state.sessionInfoKey };
    }

    /** Open an AES-GCM-personalized request, as a vehicle would, or return `null` if it fails to authenticate. */
    private openAesRequest(msg: RoutableMessage, domain: Domain, state: DomainState): Buffer | null {
        const data = msg.signatureData!.AESGCMPersonalizedData!;
        const parts = [
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_AES_GCM_PERSONALIZED]),
            Buffer.from([Tag.TAG_DOMAIN, 1, domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(VIN, "ascii"),
            Buffer.from([Tag.TAG_EPOCH, data.epoch.length]),
            Buffer.from(data.epoch),
            Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
            uint32BE(data.expiresAt),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(data.counter),
        ];
        // Unlike a response, a request only carries TAG_FLAGS when it has flags.
        if (msg.flags !== 0) {
            parts.push(Buffer.from([Tag.TAG_FLAGS, 4]), uint32BE(msg.flags));
        }
        parts.push(Buffer.from([Tag.TAG_END]));

        const decipher = crypto.createDecipheriv("aes-128-gcm", this.keysFor(state).sharedKey, data.nonce, { authTagLength: 16 });
        decipher.setAAD(crypto.createHash("sha256").update(Buffer.concat(parts)).digest());
        decipher.setAuthTag(data.tag);
        try {
            return Buffer.concat([decipher.update(msg.protobufMessageAsBytes ?? new Uint8Array()), decipher.final()]);
        } catch {
            return null;
        }
    }

    /** Encrypt a reply payload as a vehicle does for a request that asked for it. */
    private sealResponse(request: RoutableMessage, domain: Domain, state: DomainState, payload: Uint8Array) {
        const aes = request.signatureData?.AESGCMPersonalizedData;
        const hmac = request.signatureData?.HMACPersonalizedData;
        let requestHash = aes
            ? Buffer.concat([Buffer.from([SignatureType.SIGNATURE_TYPE_AES_GCM_PERSONALIZED]), aes.tag])
            : Buffer.concat([Buffer.from([SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]), hmac!.tag]);
        if (domain === Domain.DOMAIN_VEHICLE_SECURITY) {
            requestHash = requestHash.subarray(0, 17);
        }

        state.responseCounter++;
        const counter = state.responseCounter;
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_AES_GCM_RESPONSE]),
            Buffer.from([Tag.TAG_DOMAIN, 1, domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(VIN, "ascii"),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(counter),
            Buffer.from([Tag.TAG_FLAGS, 4]),
            uint32BE(this.replyFlags),
            Buffer.from([Tag.TAG_REQUEST_HASH, requestHash.length]),
            requestHash,
            Buffer.from([Tag.TAG_FAULT, 4]),
            uint32BE(MessageFaultE.MESSAGEFAULT_ERROR_NONE),
            Buffer.from([Tag.TAG_END]),
        ]);

        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-128-gcm", this.keysFor(state).sharedKey, nonce, { authTagLength: 16 });
        cipher.setAAD(crypto.createHash("sha256").update(metadata).digest());
        const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
        if (this.corruptNextReply) {
            this.corruptNextReply = false;
            ciphertext[0] ^= 0xff;
        }
        return { ciphertext, signature: { AESGCMResponseData: { nonce, counter, tag: cipher.getAuthTag() } } };
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
        const attack = this.sessionInfoAttacks.shift();

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
        } else if (attack?.kind === "empty-tag") {
            tag = Buffer.alloc(0);
        }

        // The tag always binds the real challenge (`effectiveRequestUuid`);
        // only the *echoed* request_uuid field on the envelope is ever
        // omitted, matching real VCSEC hardware.
        const echoedRequestUuid = this.omitRequestUuidEcho ? new Uint8Array(0) : effectiveRequestUuid;
        return { sessionInfo: infoBytes, tag, requestUuid: echoedRequestUuid };
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

    /**
     * The VCSEC command inside a request, opened as this vehicle would but with
     * nothing recorded, so a test can count what a client wrote even for a frame
     * the vehicle never receives. `null` for anything else.
     */
    peekVcsecCommand(msg: RoutableMessage): UnsignedMessage | null {
        if (msg.toDestination?.domain !== Domain.DOMAIN_VEHICLE_SECURITY || msg.sessionInfoRequest) {
            return null;
        }
        if (!msg.signatureData) {
            return UnsignedMessage.decode(msg.protobufMessageAsBytes ?? new Uint8Array());
        }
        if (!msg.signatureData.AESGCMPersonalizedData) {
            return null;
        }
        const opened = this.openAesRequest(msg, Domain.DOMAIN_VEHICLE_SECURITY, this.stateFor(Domain.DOMAIN_VEHICLE_SECURITY));
        return opened && UnsignedMessage.decode(opened);
    }

    /** The only unsigned command a vehicle takes: a request to add a key, for someone to approve at the car. */
    private handleUnsigned(msg: RoutableMessage, domain: Domain): Buffer {
        const operation = UnsignedMessage.decode(msg.protobufMessageAsBytes ?? new Uint8Array()).WhitelistOperation;
        if (domain !== Domain.DOMAIN_VEHICLE_SECURITY || !operation) {
            throw new Error("FakeVehicle only takes a whitelist operation unsigned.");
        }
        this.whitelistOperations.push(operation);
        return Buffer.from(RoutableMessage.encode(this.whitelistReply(msg.uuid)).finish());
    }

    /** The reply a whitelist operation gets once the tap is done. */
    whitelistReply(requestUuid: Uint8Array = new Uint8Array(0)): RoutableMessage {
        return RoutableMessage.create({
            fromDestination: { domain: Domain.DOMAIN_VEHICLE_SECURITY },
            requestUuid,
            protobufMessageAsBytes: FromVCSECMessage.encode(
                FromVCSECMessage.fromPartial({
                    commandStatus: {
                        operationStatus: VcsecOperationStatusE.OPERATIONSTATUS_OK,
                        whitelistOperationStatus: { whitelistOperationInformation: this.whitelistInformation },
                    },
                }),
            ).finish(),
            uuid: crypto.randomBytes(16),
        });
    }

    /** Process one request `RoutableMessage` exactly as a vehicle would, and return its reply bytes, addressed to its sender. */
    handle(requestBytes: Buffer): Buffer {
        const routingAddress = RoutableMessage.decode(requestBytes).fromDestination?.routingAddress;
        const reply = RoutableMessage.decode(this.process(requestBytes));
        reply.toDestination = { routingAddress };
        return Buffer.from(RoutableMessage.encode(reply).finish());
    }

    private process(requestBytes: Buffer): Buffer {
        const msg = RoutableMessage.decode(requestBytes);
        const domain = msg.toDestination?.domain ?? Domain.DOMAIN_BROADCAST;
        const state = this.stateFor(domain);

        if (msg.sessionInfoRequest) {
            state.clientPublicKey = Buffer.from(msg.sessionInfoRequest.publicKey);
            state.sharedKey = undefined;
            state.hmacKey = undefined;
            state.sessionInfoKey = undefined;
            const status = this.keyEnrolled ? this.emptyKeyHandshakeStatuses.shift() : SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST;
            if (status !== undefined) {
                const reply = RoutableMessage.create({
                    fromDestination: { domain },
                    requestUuid: msg.uuid,
                    sessionInfo: SessionInfo.encode(SessionInfo.create({ status, epoch: state.epoch, clockTime: state.clockTime })).finish(),
                    signatureData: { sessionInfoTag: { tag: Buffer.alloc(32) } },
                    uuid: crypto.randomBytes(16),
                });
                return Buffer.from(RoutableMessage.encode(reply).finish());
            }
            return this.buildSessionInfoReply(domain, msg.uuid, SessionInfoStatus.SESSION_INFO_STATUS_OK, state);
        }

        if (!msg.signatureData) {
            return this.handleUnsigned(msg, domain);
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

        // A real command: authenticate it ourselves, independently of the
        // client's own construction, before accepting it.
        const aesData = msg.signatureData?.AESGCMPersonalizedData;
        const hmacData = msg.signatureData?.HMACPersonalizedData;
        if (!aesData && !hmacData) {
            throw new Error("FakeVehicle only supports personalized requests.");
        }
        if (domain === Domain.DOMAIN_VEHICLE_SECURITY) {
            this.vcsecCounterArrivals.push((aesData ?? hmacData)!.counter);
        }

        let command: Buffer;
        if (aesData) {
            const opened = this.openAesRequest(msg, domain, state);
            if (opened === null) {
                const reply = RoutableMessage.create({
                    fromDestination: { domain },
                    signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_INVALID_SIGNATURE },
                    uuid: crypto.randomBytes(16),
                });
                return Buffer.from(RoutableMessage.encode(reply).finish());
            }
            command = opened;
            state.counter = aesData.counter;
        } else {
            const { hmacKey } = this.keysFor(state);
            command = Buffer.from(msg.protobufMessageAsBytes ?? new Uint8Array());
            const metadata = Buffer.concat([
                Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]),
                Buffer.from([Tag.TAG_DOMAIN, 1, domain]),
                Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
                Buffer.from(VIN, "ascii"),
                Buffer.from([Tag.TAG_EPOCH, hmacData!.epoch.length]),
                Buffer.from(hmacData!.epoch),
                Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
                uint32BE(hmacData!.expiresAt),
                Buffer.from([Tag.TAG_COUNTER, 4]),
                uint32BE(hmacData!.counter),
                Buffer.from([Tag.TAG_END]),
            ]);
            const expectedTag = crypto.createHmac("sha256", hmacKey).update(Buffer.concat([metadata, command])).digest();
            if (!expectedTag.equals(Buffer.from(hmacData!.tag))) {
                const reply = RoutableMessage.create({
                    fromDestination: { domain },
                    signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_INVALID_SIGNATURE },
                    uuid: crypto.randomBytes(16),
                });
                return Buffer.from(RoutableMessage.encode(reply).finish());
            }
            state.counter = hmacData!.counter;
        }

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
            const unsigned = UnsignedMessage.decode(command);
            this.vcsecCommands.push(unsigned);
            this.onVcsecCommand?.(unsigned);
            const scripted = this.nextVcsecReply;
            this.nextVcsecReply = null;
            payload = FromVCSECMessage.encode(
                scripted ??
                    (unsigned.InformationRequest && this.vehicleStatus
                        ? FromVCSECMessage.create({ vehicleStatus: this.vehicleStatus })
                        : FromVCSECMessage.create({
                              commandStatus: CommandStatus.create({ operationStatus: VcsecOperationStatusE.OPERATIONSTATUS_OK }),
                          })),
            ).finish();
        } else {
            const action = Action.decode(command);
            this.infotainmentActions.push(action);
            const scripted = this.nextInfotainmentReplies.shift() ?? this.onInfotainmentAction?.(action);
            const ping = action.vehicleAction?.ping;
            payload = Response.encode(
                scripted ??
                    (ping
                        ? Response.create({ ping: { pingId: ping.pingId, localTimestamp: FAKE_PING_TIMESTAMP } })
                        : Response.create({ actionStatus: ActionStatus.create({ result: ActionOperationStatusE.OPERATIONSTATUS_OK }) })),
            ).finish();
        }

        let resync: { sessionInfo: Uint8Array; tag: Uint8Array } | undefined;
        if (this.attachSessionInfoOnNextReply) {
            this.attachSessionInfoOnNextReply = false;
            resync = this.buildSessionInfoFields(msg.uuid, SessionInfoStatus.SESSION_INFO_STATUS_OK, state);
        }

        // session_info_tag and AES_GCM_Response_data share a oneof, so a resync goes out in the clear.
        const encryptionRequested = (msg.flags & (1 << Flags.FLAG_ENCRYPT_RESPONSE)) !== 0 || this.encryptHmacReplies;
        const sealed = encryptionRequested && !this.plaintextReplies && !resync ? this.sealResponse(msg, domain, state, payload) : undefined;

        const reply = RoutableMessage.create({
            fromDestination: { domain },
            requestUuid: msg.uuid,
            protobufMessageAsBytes: sealed?.ciphertext ?? payload,
            flags: this.replyFlags,
            sessionInfo: resync?.sessionInfo,
            signatureData: resync ? { sessionInfoTag: { tag: resync.tag } } : sealed?.signature,
            signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_NONE },
            uuid: crypto.randomBytes(16),
        });
        return Buffer.from(RoutableMessage.encode(reply).finish());
    }
}
