import crypto from "crypto";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { SessionInfo, SessionInfoStatus, SignatureType, Tag } from "@teslemetry/tesla-protocol/command/signatures";
import { Response } from "@teslemetry/tesla-protocol/command/car_server";
import { VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";

function u32(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}

interface ForgedInfo {
    counter?: number;
    clockTime?: number;
    epoch?: Buffer;
    /** The key the reply claims to come from. Defaults to the attacker's own. */
    claimedPublicKey?: Buffer;
}

/**
 * A man in the middle, deliberately apart from `FakeVehicle`, which models an
 * honest vehicle. It holds only what is on the wire plus its own keypair: ECDH
 * is symmetric, so anyone who saw the client's public key can compute the same
 * shared secret as the client and tag a `SessionInfo` that names its own key.
 */
export class SessionAttacker {
    private readonly ecdh = crypto.createECDH("prime256v1");

    constructor(private readonly vin: string) {
        this.ecdh.generateKeys();
    }

    get publicKey(): Buffer {
        return this.ecdh.getPublicKey();
    }

    /** The client's public key, which every session request or signed command carries in the clear. */
    private clientPublicKey(request: RoutableMessage): Buffer {
        const key = request.sessionInfoRequest?.publicKey ?? request.signatureData?.signerIdentity?.publicKey;
        if (!key) {
            throw new Error("The request does not show the client's public key.");
        }
        return Buffer.from(key);
    }

    private sharedKey(request: RoutableMessage): Buffer {
        const secret = this.ecdh.computeSecret(this.clientPublicKey(request));
        return crypto.createHash("sha1").update(secret).digest().subarray(0, 16);
    }

    /** A `SessionInfo` and a tag that are valid under the shared key the attacker chose. */
    private sessionInfo(request: RoutableMessage, forged: ForgedInfo): { sessionInfo: Uint8Array; tag: Buffer } {
        const sessionInfo = SessionInfo.encode(
            SessionInfo.create({
                counter: forged.counter ?? 1000,
                publicKey: forged.claimedPublicKey ?? this.publicKey,
                epoch: forged.epoch ?? crypto.randomBytes(16),
                clockTime: forged.clockTime ?? 1000,
                status: SessionInfoStatus.SESSION_INFO_STATUS_OK,
            }),
        ).finish();

        const sessionInfoKey = crypto.createHmac("sha256", this.sharedKey(request)).update("session info").digest();
        const uuid = Buffer.from(request.uuid);
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(this.vin, "ascii"),
            Buffer.from([Tag.TAG_CHALLENGE, uuid.length]),
            uuid,
            Buffer.from([Tag.TAG_END]),
        ]);
        return { sessionInfo, tag: crypto.createHmac("sha256", sessionInfoKey).update(metadata).update(sessionInfo).digest() };
    }

    /** Answer a session-info request, or a command, with a forged `SessionInfo`. */
    forgeSessionInfoReply(request: RoutableMessage, forged: ForgedInfo = {}): RoutableMessage {
        const { sessionInfo, tag } = this.sessionInfo(request, forged);
        return RoutableMessage.create({
            fromDestination: { domain: request.toDestination!.domain },
            sessionInfo,
            signatureData: { sessionInfoTag: { tag } },
        });
    }

    /** Graft a forged resync onto a genuine reply on its way back to the client. */
    graftResync(request: RoutableMessage, reply: RoutableMessage, forged: ForgedInfo = {}): RoutableMessage {
        const { sessionInfo, tag } = this.sessionInfo(request, forged);
        return { ...reply, sessionInfo, signatureData: { sessionInfoTag: { tag } } };
    }

    /**
     * Answer an AES-GCM read with a forged `SessionInfo` and data encrypted under
     * the attacker's shared key, so the read succeeds if the client adopts that key.
     */
    forgeEncryptedRead(request: RoutableMessage, data: VehicleData, forged: ForgedInfo = {}): RoutableMessage {
        const aes = request.signatureData!.AESGCMPersonalizedData!;
        const domain: Domain = request.toDestination!.domain!;
        const requestHash = Buffer.concat([Buffer.from([SignatureType.SIGNATURE_TYPE_AES_GCM_PERSONALIZED]), aes.tag]);
        const counter = 1;
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_AES_GCM_RESPONSE]),
            Buffer.from([Tag.TAG_DOMAIN, 1, domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(this.vin, "ascii"),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            u32(counter),
            Buffer.from([Tag.TAG_FLAGS, 4]),
            u32(0),
            Buffer.from([Tag.TAG_REQUEST_HASH, requestHash.length]),
            requestHash,
            Buffer.from([Tag.TAG_FAULT, 4]),
            u32(0),
            Buffer.from([Tag.TAG_END]),
        ]);

        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv("aes-128-gcm", this.sharedKey(request), nonce, { authTagLength: 16 });
        cipher.setAAD(crypto.createHash("sha256").update(metadata).digest());
        const ciphertext = Buffer.concat([cipher.update(Response.encode(Response.create({ vehicleData: data })).finish()), cipher.final()]);

        const { sessionInfo, tag } = this.sessionInfo(request, { epoch: Buffer.from(aes.epoch), ...forged });
        return RoutableMessage.create({
            fromDestination: { domain },
            sessionInfo,
            protobufMessageAsBytes: ciphertext,
            signatureData: { sessionInfoTag: { tag }, AESGCMResponseData: { nonce, counter, tag: cipher.getAuthTag() } },
        });
    }
}
