// RSA signing for energy device commands.
//
// One stateless scheme serves both the local TEDapi `/tedapi/v1r` endpoint and
// Tesla's cloud `device_command` endpoint: a `MessageEnvelope` is wrapped in a
// `RoutableMessage` signed with RSA PKCS#1 v1.5 / SHA-512 over a TLV header
// personalised to the gateway DIN. There is no session, counter or handshake,
// so the same bytes execute again if resent before `expires_at`: keep the TTL
// short, and never retry a signed send.
import crypto from "node:crypto";
import { AuthorizedClientType } from "@teslemetry/tesla-protocol/energy_device/authorization_types";
import {
    Domain,
    RoutableMessage,
    SignatureType,
    Tag,
} from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { validate_island_mode } from "../energyisland.js";
import { uint32BE } from "./crypto.js";
import { rsaPublicDerPkcs1 } from "./keys.js";

/** The cloud round trip needs more than the 12 s LAN TTL; 30 s worked live through `device_command`. */
export const ENERGY_SIGNATURE_TTL_SECONDS = 30;

/** ts-proto's value for an enum input it does not recognise. */
const UNRECOGNIZED_ENUM = -1;

/** Encode one tag-length-value entry. */
function tlv(tag: Tag, value: Uint8Array): Buffer {
    return Buffer.concat([Buffer.from([tag, value.length]), value]);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A proto field name in the camelCase form ts-proto generates. */
function camelCase(name: string): string {
    return name.replace(/_([a-z0-9])/g, (_, character: string) => character.toUpperCase());
}

/** Convert every key from Python's proto field names; ts-proto's `fromJSON` reads camelCase only. */
function camelCaseKeys(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(camelCaseKeys);
    }
    if (isPlainObject(value)) {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [camelCase(key), camelCaseKeys(item)]));
    }
    return value;
}

/**
 * Reject input `fromJSON` dropped or could not read, as Python's `ParseDict`
 * does: otherwise a mistyped field would be signed and sent without it.
 */
function assertParsed(input: unknown, parsed: unknown, path: string): void {
    if (Array.isArray(input) && Array.isArray(parsed)) {
        input.forEach((item, index) => assertParsed(item, parsed[index], `${path}[${index}]`));
    } else if (isPlainObject(input) && isPlainObject(parsed) && !(parsed instanceof Date) && !ArrayBuffer.isView(parsed)) {
        for (const [key, item] of Object.entries(input)) {
            if (!(key in parsed)) {
                throw new TypeError(`Unknown energy device command field ${path}.${key}`);
            }
            assertParsed(item, parsed[key], `${path}.${key}`);
        }
    } else if (
        (parsed instanceof Date && Number.isNaN(parsed.getTime())) ||
        (parsed === UNRECOGNIZED_ENUM && input !== UNRECOGNIZED_ENUM)
    ) {
        throw new TypeError(`Invalid value for energy device command field ${path}`);
    }
}

/**
 * Builds RSA-signed `RoutableMessage` bytes for one energy device key.
 *
 * The key must be an RSA key registered on the gateway with
 * `add_authorized_client` and in state `VERIFIED`. An ECC key cannot sign this
 * scheme: the `SignatureData` oneof has only `rsa_data`.
 */
export class EnergyDeviceSigner {
    /** The signer's public key, PKCS#1 DER. */
    readonly publicKeyDer: Buffer;
    /** Seconds a signed message stays valid. */
    readonly ttl: number;
    // Native private field, like `Commands`'s signing key: unreachable off the instance.
    #privateKey: crypto.KeyObject;

    /**
     * @param privateKey The RSA private key.
     * @param ttl Seconds a signed message stays valid. `V1rTransport` passes 12.
     * @throws TypeError for anything but an RSA private key.
     */
    constructor(privateKey: crypto.KeyObject, ttl: number = ENERGY_SIGNATURE_TTL_SECONDS) {
        if (privateKey?.type !== "private" || privateKey.asymmetricKeyType !== "rsa") {
            throw new TypeError("Energy device signing requires an RSA private key");
        }
        this.#privateKey = privateKey;
        this.publicKeyDer = rsaPublicDerPkcs1(privateKey);
        this.ttl = ttl;
    }

    /**
     * Serialize a cloud `MessageEnvelope` addressed to `din`.
     *
     * `category`, `command` and `params` are the snake_case proto field names
     * the unsigned `grpc_command` sends, so every command can be signed without
     * per-command code. `delivery_channel` stays unset, as in the envelope
     * proven on the cloud path.
     * @throws TypeError for a field the message does not have, or an island mode that is not 1 or 6.
     */
    static envelope(din: string, category: string, command: string, params?: Record<string, unknown> | null): Uint8Array {
        // `assertParsed` cannot refuse these: 0, 3 and 5 are real enum values, and -1 looks like an integer field.
        if (category === "teg" && command === "set_island_mode_request") {
            validate_island_mode(params?.mode, params?.force);
        }
        const input = camelCaseKeys({ [category]: { [command]: params ?? {} } });
        const envelope = MessageEnvelope.fromJSON(input);
        assertParsed(input, envelope, "message");
        envelope.sender = {
            authorizedClient: AuthorizedClientType.AUTHORIZED_CLIENT_TYPE_CUSTOMER_MOBILE_APP,
        };
        envelope.recipient = { din };
        return MessageEnvelope.encode(envelope).finish();
    }

    /**
     * Wrap `envelope` in a signed `RoutableMessage` and serialize it.
     *
     * RSA-4096 blocks for milliseconds, so this signs on the thread pool.
     * @param envelope The serialized `MessageEnvelope`.
     * @param din The gateway DIN the envelope and the request target.
     * @param options `now` (in seconds) and `messageUuid` exist for test vectors.
     */
    async sign(
        envelope: Uint8Array,
        din: string,
        options: { now?: number; messageUuid?: Uint8Array } = {},
    ): Promise<Uint8Array> {
        if (din.length > 255 || /\P{ASCII}/u.test(din)) {
            throw new TypeError("A gateway DIN must be at most 255 ASCII characters");
        }
        const expiresAt = Math.ceil(options.now ?? Date.now() / 1000) + this.ttl;
        const signedData = Buffer.concat([
            tlv(Tag.TAG_SIGNATURE_TYPE, Buffer.from([SignatureType.SIGNATURE_TYPE_RSA])),
            tlv(Tag.TAG_DOMAIN, Buffer.from([Domain.DOMAIN_ENERGY_DEVICE])),
            tlv(Tag.TAG_PERSONALIZATION, Buffer.from(din, "ascii")),
            tlv(Tag.TAG_EXPIRES_AT, uint32BE(expiresAt)),
            Buffer.from([Tag.TAG_END]),
            envelope,
        ]);
        const signature = await new Promise<Buffer>((resolve, reject) => {
            crypto.sign("sha512", signedData, this.#privateKey, (error, result) =>
                error ? reject(error) : resolve(result),
            );
        });

        return RoutableMessage.encode(
            RoutableMessage.create({
                toDestination: { domain: Domain.DOMAIN_ENERGY_DEVICE },
                protobufMessageAsBytes: envelope,
                signatureData: {
                    signerIdentity: { publicKey: this.publicKeyDer },
                    rsaData: { expiresAt, signature },
                },
                uuid: options.messageUuid ?? crypto.randomBytes(16),
            }),
        ).finish();
    }
}
