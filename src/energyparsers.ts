// Parsers for raw energy gateway cloud replies. They are free functions, because
// Homey calls them on `@teslemetry/api` responses, and this module stays free of
// protobuf so a caller that only parses never loads it.
import { AuthorizationRole, AuthorizedClientState, AuthorizedVerificationType } from "./const.js";
import { InvalidResponse } from "./exceptions.js";

type Json = Record<string, unknown>;

/** A value typed against an enum: its number, or as received when unrecognized, or `null` when absent. */
export type EnumValue = number | string | null;

/**
 * One entry from a `list_authorized_clients` reply. Tesla has not published this
 * schema, so anything else on an entry is available through `raw`.
 */
export type AuthorizedClient = {
    public_key: string | null;
    state: EnumValue;
    roles: EnumValue[] | null;
    verification: EnumValue;
    raw: Json;
};

/**
 * A parsed `list_authorized_clients` reply. A null body or an unknown shape
 * raises `InvalidResponse` rather than reading as "no clients": the endpoint
 * intermittently answers HTTP 200 with a null body. A genuinely empty list
 * parses to `clients: []`.
 */
export type AuthorizedClients = {
    clients: AuthorizedClient[];
    raw: unknown;
};

function isRecord(value: unknown): value is Json {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The first present key's value. Tests presence, so a legal falsy value is never read as missing. */
function field(payload: Json, ...keys: string[]): unknown {
    for (const key of keys) {
        if (Object.hasOwn(payload, key)) {
            return payload[key];
        }
    }
    return null;
}

/**
 * Type a raw value against an enum. A recognized number or member name
 * (case-insensitive) becomes the member's number. A present but unrecognized
 * value stays as received, because only an absent field means `null`.
 */
function normalizeEnum(members: Readonly<Record<string, number>>, value: unknown): EnumValue {
    if (typeof value === "string") {
        const name = value.trim().toUpperCase();
        return Object.hasOwn(members, name) ? members[name] : value;
    }
    return value as EnumValue;
}

function parseClient(payload: Json): AuthorizedClient {
    const roles = field(payload, "roles");
    return {
        public_key: field(payload, "public_key", "publicKey") as string | null,
        state: normalizeEnum(AuthorizedClientState, field(payload, "state", "authorized_client_state")),
        roles: Array.isArray(roles) ? roles.map((role) => normalizeEnum(AuthorizationRole, role)) : null,
        verification: normalizeEnum(AuthorizedVerificationType, field(payload, "verification")),
        raw: payload,
    };
}

function authorizedClientsList(payload: unknown): unknown[] {
    if (payload === null || payload === undefined) {
        throw new InvalidResponse("authorized_clients response body was null");
    }
    if (Array.isArray(payload)) {
        return payload;
    }
    if (!isRecord(payload)) {
        throw new InvalidResponse(String(payload));
    }
    const body = isRecord(payload.response) ? payload.response : payload;
    const value = field(body, "authorized_clients", "clients");
    if (!Array.isArray(value)) {
        throw new InvalidResponse(payload);
    }
    return value;
}

/**
 * Parse a raw `list_authorized_clients` reply: a bare list,
 * `{response: {authorized_clients: [...]}}` or `{response: {clients: [...]}}`.
 * @throws InvalidResponse for a null body or any other shape.
 */
export function parse_authorized_clients(payload: unknown): AuthorizedClients {
    return { clients: authorizedClientsList(payload).filter(isRecord).map(parseClient), raw: payload };
}

const OCTET = "(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])";
const DOTTED_QUAD = new RegExp(`^${OCTET}\\.${OCTET}\\.${OCTET}\\.${OCTET}$`);

/**
 * Decode a `networking_status` ipv4 field. The live API serves a strict dotted
 * quad; the big-endian uint32 form is accepted too. `0.0.0.0` and
 * `255.255.255.255` are never a usable host, in either form. Anything else
 * decodes to `null`, so one bad field cannot fail the lookup.
 */
function decodeIpv4(value: unknown): string | null {
    if (typeof value === "number") {
        if (!Number.isInteger(value) || value <= 0 || value >= 0xffffffff) {
            return null;
        }
        return [value >>> 24, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff].join(".");
    }
    if (typeof value === "string" && DOTTED_QUAD.test(value) && value !== "0.0.0.0" && value !== "255.255.255.255") {
        return value;
    }
    return null;
}

/**
 * Whether `address` is a dotted-quad IPv4 address in a private range (RFC 1918) or
 * the link-local range: the only places a gateway's LAN address can be. Anything
 * else, including a hostname or a `host:port`, is not.
 */
export function is_lan_address(address: string): boolean {
    if (!DOTTED_QUAD.test(address)) {
        return false;
    }
    const [first, second] = address.split(".").map(Number);
    return (
        first === 10 ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        (first === 169 && second === 254)
    );
}

function interfaceAddress(networkInterface: unknown): string | null {
    if (!isRecord(networkInterface)) {
        return null;
    }
    const ipv4 = networkInterface.ipv4_config;
    return isRecord(ipv4) ? decodeIpv4(ipv4.address) : null;
}

function networkingStatusBody(payload: unknown): Json {
    if (payload === null || payload === undefined) {
        throw new InvalidResponse("networking_status response body was null");
    }
    if (!isRecord(payload)) {
        throw new InvalidResponse(String(payload));
    }
    if (!Object.hasOwn(payload, "response")) {
        return payload;
    }
    if (!isRecord(payload.response)) {
        // `{"response": null}` is the endpoint's known intermittent malformed reply, not "no address".
        throw new InvalidResponse(payload);
    }
    return payload.response;
}

/**
 * Pick the gateway's LAN IPv4 address from a `networking_status` reply, with or
 * without the `response` envelope. Considers `eth` and `wifi` only, never `gsm`:
 * an interface with `active_route` wins, then the first with any decodable address.
 * @returns The address, or `null` when a well-formed reply has no usable interface.
 * @throws InvalidResponse for a null body or a reply of another shape.
 */
export function parse_gateway_address(body: unknown): string | null {
    const status = networkingStatusBody(body);
    const interfaces = [status.eth, status.wifi];

    for (const networkInterface of interfaces) {
        if (isRecord(networkInterface) && networkInterface.active_route) {
            const address = interfaceAddress(networkInterface);
            if (address !== null) {
                return address;
            }
        }
    }
    for (const networkInterface of interfaces) {
        const address = interfaceAddress(networkInterface);
        if (address !== null) {
            return address;
        }
    }
    return null;
}
