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

/**
 * A minimal independent re-implementation of the *vehicle* side of the
 * signed-command protocol, used to verify `Commands`/`VehicleSigned` against
 * a second, from-scratch implementation of the same wire format rather than
 * against itself.
 */
export class FakeVehicle {
    readonly privateKey: Buffer;
    readonly publicKey: Buffer;
    private readonly domainState = new Map<
        Domain,
        { epoch: Buffer; counter: number; clientPublicKey?: Buffer; hmacKey?: Buffer }
    >();
    private nextOutcome: "ok" | "wait" | "not_whitelisted" | "bad_signature" = "ok";
    private waitCountRemaining = 0;

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

    private stateFor(domain: Domain) {
        let state = this.domainState.get(domain);
        if (!state) {
            state = { epoch: crypto.randomBytes(16), counter: 0 };
            this.domainState.set(domain, state);
        }
        return state;
    }

    /** Process one request `RoutableMessage` exactly as a vehicle would, and return its reply bytes. */
    handle(requestBytes: Buffer): Buffer {
        const msg = RoutableMessage.decode(requestBytes);
        const domain = msg.toDestination?.domain ?? Domain.DOMAIN_BROADCAST;
        const state = this.stateFor(domain);

        if (msg.sessionInfoRequest) {
            state.clientPublicKey = Buffer.from(msg.sessionInfoRequest.publicKey);
            state.hmacKey = undefined;
            const info = SessionInfo.create({
                counter: state.counter,
                publicKey: this.publicKey,
                epoch: state.epoch,
                clockTime: Math.floor(Date.now() / 1000),
                status: SessionInfoStatus.SESSION_INFO_STATUS_OK,
            });
            const reply = RoutableMessage.create({
                toDestination: { routingAddress: msg.fromDestination?.routingAddress },
                fromDestination: { domain },
                sessionInfo: SessionInfo.encode(info).finish(),
                uuid: crypto.randomBytes(16),
            });
            return Buffer.from(RoutableMessage.encode(reply).finish());
        }

        if (this.nextOutcome === "not_whitelisted") {
            this.nextOutcome = "ok";
            const info = SessionInfo.create({
                counter: state.counter,
                publicKey: this.publicKey,
                epoch: state.epoch,
                clockTime: Math.floor(Date.now() / 1000),
                status: SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST,
            });
            const reply = RoutableMessage.create({
                fromDestination: { domain },
                sessionInfo: SessionInfo.encode(info).finish(),
                uuid: crypto.randomBytes(16),
            });
            return Buffer.from(RoutableMessage.encode(reply).finish());
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
        if (!state.clientPublicKey) {
            throw new Error("FakeVehicle received a command before a handshake.");
        }
        if (!state.hmacKey) {
            const sharedKey = deriveSharedKey(this.privateKey, state.clientPublicKey);
            state.hmacKey = crypto.createHmac("sha256", sharedKey).update("authenticated command").digest();
        }

        const command = Buffer.from(msg.protobufMessageAsBytes ?? new Uint8Array());
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]),
            Buffer.from([Tag.TAG_DOMAIN, 1, domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from("5YJXCAE43LF123456", "ascii"),
            Buffer.from([Tag.TAG_EPOCH, hmacData.epoch.length]),
            Buffer.from(hmacData.epoch),
            Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
            uint32BE(hmacData.expiresAt),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(hmacData.counter),
            Buffer.from([Tag.TAG_END]),
        ]);
        const expectedTag = crypto.createHmac("sha256", state.hmacKey).update(Buffer.concat([metadata, command])).digest();
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

        const reply = RoutableMessage.create({
            fromDestination: { domain },
            protobufMessageAsBytes: payload,
            signedMessageStatus: { operationStatus: MessageOperationStatusE.OPERATIONSTATUS_OK, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_NONE },
            uuid: crypto.randomBytes(16),
        });
        return Buffer.from(RoutableMessage.encode(reply).finish());
    }
}
