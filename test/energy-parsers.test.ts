import { describe, expect, it, vi } from "vitest";
import { AuthorizationRole, AuthorizedClientState, AuthorizedVerificationType } from "../src/const.js";
import { parse_authorized_clients, parse_gateway_address } from "../src/energyparsers.js";
import { InvalidResponse } from "../src/exceptions.js";

const PUBLIC_KEY_B64 = "MIIBCgKCAQEAsomeBase64EncodedRsaPublicKeyBytes==";

describe("parse_authorized_clients", () => {
    it("parses the authorized_clients envelope", () => {
        const payload = { response: { authorized_clients: [{ public_key: PUBLIC_KEY_B64, state: 3 }] } };

        const result = parse_authorized_clients(payload);

        expect(result.raw).toBe(payload);
        expect(result.clients).toHaveLength(1);
        expect(result.clients[0].public_key).toBe(PUBLIC_KEY_B64);
        expect(result.clients[0].state).toBe(AuthorizedClientState.VERIFIED);
    });

    it("parses the clients envelope", () => {
        const result = parse_authorized_clients({ response: { clients: [{ public_key: PUBLIC_KEY_B64, state: 3 }] } });

        expect(result.clients[0].public_key).toBe(PUBLIC_KEY_B64);
    });

    it("parses a bare list", () => {
        const result = parse_authorized_clients([{ public_key: PUBLIC_KEY_B64, state: 1 }]);

        expect(result.clients[0].state).toBe(AuthorizedClientState.PENDING_VERIFICATION);
    });

    it("recognises the camelCase and long key variants", () => {
        const [client] = parse_authorized_clients({
            response: { authorized_clients: [{ publicKey: PUBLIC_KEY_B64, authorized_client_state: 3 }] },
        }).clients;

        expect(client.public_key).toBe(PUBLIC_KEY_B64);
        expect(client.state).toBe(AuthorizedClientState.VERIFIED);
    });

    it("keeps a legal falsy value rather than reading it as missing", () => {
        const [client] = parse_authorized_clients([{ public_key: "", publicKey: PUBLIC_KEY_B64, state: 0 }]).clients;

        expect(client.public_key).toBe("");
        expect(client.state).toBe(AuthorizedClientState.INVALID);
    });

    it("types a state name through the enum, ignoring case", () => {
        const [client] = parse_authorized_clients([{ public_key: PUBLIC_KEY_B64, state: " verified " }]).clients;

        expect(client.state).toBe(AuthorizedClientState.VERIFIED);
    });

    it("preserves an unrecognized present value", () => {
        const [client] = parse_authorized_clients([
            { public_key: PUBLIC_KEY_B64, state: 99, roles: [99], verification: 99 },
        ]).clients;

        expect(client.state).toBe(99);
        expect(client.roles).toEqual([99]);
        expect(client.verification).toBe(99);
    });

    it("gives null for missing roles and verification", () => {
        const [client] = parse_authorized_clients([{ public_key: PUBLIC_KEY_B64 }]).clients;

        expect(client.state).toBeNull();
        expect(client.roles).toBeNull();
        expect(client.verification).toBeNull();
    });

    it("skips non-object entries", () => {
        const { clients } = parse_authorized_clients({
            response: { authorized_clients: ["not-a-dict", { public_key: PUBLIC_KEY_B64, state: 3 }] },
        });

        expect(clients).toHaveLength(1);
    });

    it.each([
        ["authorized_clients", { response: { authorized_clients: [] } }],
        ["clients", { response: { clients: [] } }],
        ["a bare list", []],
    ])("parses a well-formed empty list under %s to empty", (_name, payload) => {
        expect(parse_authorized_clients(payload).clients).toEqual([]);
    });

    it.each([
        ["a null body", null],
        ["an absent body", undefined],
        ["a null envelope", { response: null }],
        ["neither key", { response: { foo: "bar" } }],
        ["a scalar body", "not-a-valid-shape"],
        ["a non-list value", { response: { clients: {} } }],
    ])("raises InvalidResponse on %s", (_name, payload) => {
        expect(() => parse_authorized_clients(payload)).toThrow(InvalidResponse);
    });

    it("parses a captured-shape reply with synthetic keys", () => {
        const entries = [3, 2, 2, 3, 2].map((state, index) => ({
            type: 1,
            description: `Client ${index}`,
            key_type: 1,
            public_key: `SYNTHETIC_PUBLIC_KEY_${index}`,
            roles: [1],
            state,
            verification: 1,
            added_time: { seconds: 1777328846 },
        }));

        const { clients } = parse_authorized_clients({ response: { clients: entries } });

        expect(clients.map((client) => client.public_key)).toEqual(entries.map((entry) => entry.public_key));
        expect(clients[0].state).toBe(AuthorizedClientState.VERIFIED);
        expect(clients[1].state).toBe(AuthorizedClientState.PENDING_VERIFICATION_TIMEOUT);
        expect(clients.every((client) => client.roles?.[0] === AuthorizationRole.CUSTOMER)).toBe(true);
        expect(clients.every((client) => client.verification === AuthorizedVerificationType.PRESENCE_PROOF)).toBe(true);
        expect(clients[0].raw).toBe(entries[0]);
    });
});

describe("parse_gateway_address", () => {
    const LAN = "192.0.2.10";
    const LAN_NUMBER = 3221225994;
    const OTHER = "192.0.2.20";
    const OTHER_NUMBER = 3221226004;
    const iface = (address: unknown, extra: Record<string, unknown> = {}) => ({ ipv4_config: { address }, ...extra });

    it("selects the active route from a number-form capture shape", () => {
        expect(
            parse_gateway_address({
                response: {
                    wifi_config: { ssid: "ANONYMIZED_SSID" },
                    wifi: iface(LAN_NUMBER, { enabled: true, active_route: true }),
                    eth: iface(OTHER_NUMBER, { enabled: true }),
                    gsm: iface(168866907, { enabled: true }),
                },
            }),
        ).toBe(LAN);
    });

    it("selects the active route from a string-form capture shape", () => {
        expect(
            parse_gateway_address({
                response: {
                    wifi: iface(LAN, { active_route: true }),
                    eth: iface(OTHER),
                    gsm: iface("198.51.100.1"),
                },
            }),
        ).toBe(LAN);
    });

    it("decodes the same address from either form", () => {
        expect(parse_gateway_address({ response: { eth: iface(LAN) } })).toBe(
            parse_gateway_address({ response: { eth: iface(LAN_NUMBER) } }),
        );
    });

    it("prefers eth when both have the active route", () => {
        expect(
            parse_gateway_address({
                response: {
                    eth: iface(OTHER_NUMBER, { active_route: true }),
                    wifi: iface(LAN_NUMBER, { active_route: true }),
                },
            }),
        ).toBe(OTHER);
    });

    it("falls back to eth first with no active route", () => {
        expect(parse_gateway_address({ response: { eth: iface(OTHER_NUMBER), wifi: iface(LAN_NUMBER) } })).toBe(OTHER);
    });

    it("falls back to wifi when eth has no address", () => {
        expect(parse_gateway_address({ response: { eth: { enabled: true }, wifi: iface(LAN_NUMBER) } })).toBe(LAN);
    });

    it("skips an eth with a zero address", () => {
        expect(parse_gateway_address({ response: { eth: iface(0), wifi: iface(LAN_NUMBER) } })).toBe(LAN);
    });

    it("falls back past an active route with an undecodable address", () => {
        expect(
            parse_gateway_address({
                response: { eth: iface("0.0.0.0\n", { active_route: true }), wifi: iface(LAN) },
            }),
        ).toBe(LAN);
    });

    it("reads a bare body with no response envelope", () => {
        expect(parse_gateway_address({ wifi: iface(LAN_NUMBER, { active_route: true }) })).toBe(LAN);
    });

    it("ignores gsm", () => {
        expect(parse_gateway_address({ response: { gsm: iface(168866907, { active_route: true }) } })).toBeNull();
    });

    it.each([
        ["an empty reply", { response: {} }],
        ["interfaces with no ipv4_config", { response: { eth: { enabled: true }, wifi: { enabled: true } } }],
    ])("returns null for %s", (_name, body) => {
        expect(parse_gateway_address(body)).toBeNull();
    });

    it.each<[unknown]>([
        [0],
        [4294967295],
        [4294967296],
        [-1],
        [1.5],
        [true],
        [null],
        [{}],
        ["0.0.0.0"],
        ["255.255.255.255"],
        ["not-an-ip"],
        ["192.0.2.10\n"],
        [" 192.0.2.10 "],
        ["0.0.0.0\n"],
        ["255.255.255.255\n"],
        [" 0.0.0.0 "],
        [" 255.255.255.255 "],
        ["192.0.2.010"],
        ["192.0.2"],
        ["256.0.2.1"],
    ])("treats %j as undecodable", (address) => {
        expect(parse_gateway_address({ response: { eth: iface(address, { active_route: true }) } })).toBeNull();
    });

    it.each([
        ["a null body", null],
        ["an absent body", undefined],
        ["a null envelope", { response: null }],
        ["a scalar body", "not-a-valid-shape"],
        ["a list body", []],
    ])("raises InvalidResponse on %s", (_name, body) => {
        expect(() => parse_gateway_address(body)).toThrow(InvalidResponse);
    });
});

describe("parser module", () => {
    it("loads and parses without tesla-protocol", async () => {
        vi.resetModules();
        const refuse = () => {
            throw new Error("protobuf must not load");
        };
        vi.doMock("@teslemetry/tesla-protocol/energy_device/transport", refuse);
        vi.doMock("@teslemetry/tesla-protocol/energy_device/signed_message", refuse);
        vi.doMock("@teslemetry/tesla-protocol/energy_device/authorization_types", refuse);

        const parsers = await import("../src/energyparsers.js");

        expect(parsers.parse_authorized_clients([]).clients).toEqual([]);
        expect(parsers.parse_gateway_address({ response: {} })).toBeNull();
        vi.doUnmock("@teslemetry/tesla-protocol/energy_device/transport");
        vi.doUnmock("@teslemetry/tesla-protocol/energy_device/signed_message");
        vi.doUnmock("@teslemetry/tesla-protocol/energy_device/authorization_types");
    });
});
