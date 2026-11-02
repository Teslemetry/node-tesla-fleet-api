import crypto from "node:crypto";
import { RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it, vi } from "vitest";
import { ENERGY_TEST_DIN as DIN, ENERGY_TEST_KEY_PEM } from "./fixtures/energy-signing.js";
import { AuthorizedClientKeyType } from "../src/const.js";
import EnergySpecific from "../src/energyspecific.js";
import TeslaFleetApi from "../src/teslafleetapi.js";

const SITE_ID = 12345;
const TEST_KEY = crypto.createPrivateKey(ENERGY_TEST_KEY_PEM);
const B64_KEY = Buffer.from("key").toString("base64");

function makeSite(privateKey?: crypto.KeyObject, reply: unknown = { response: {} }) {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify(reply), { status: 200 }),
    );
    const api = new TeslaFleetApi({
        accessToken: "token",
        server: "https://fleet.test",
        fetch: fetchMock as unknown as typeof fetch,
    });
    return { site: api.energySites!.create(SITE_ID, privateKey, privateKey ? DIN : undefined), fetchMock };
}

function sent(fetchMock: ReturnType<typeof makeSite>["fetchMock"]) {
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    return { path: new URL(url).pathname.slice(1), body: JSON.parse(init.body as string) };
}

function signedEnvelope(fetchMock: ReturnType<typeof makeSite>["fetchMock"]): MessageEnvelope {
    const { path, body } = sent(fetchMock);
    expect(path).toBe(`api/1/energy_sites/${SITE_ID}/device_command`);
    const message = RoutableMessage.decode(Buffer.from(body.data.routable_message, "base64"));
    return MessageEnvelope.decode(message.protobufMessageAsBytes!);
}

// (method, call, category, command, unsigned params) for every signed device command.
const SIGNED_COMMANDS: [string, (site: EnergySpecific) => Promise<unknown>, string, string, Record<string, unknown>][] = [
    ["wifi_scan", (s) => s.wifi_scan(), "common", "wifi_scan_request", {}],
    ["get_device_cert", (s) => s.get_device_cert(), "common", "device_cert_request", {}],
    ["get_cellular_info", (s) => s.get_cellular_info(), "common", "get_cellular_info_request", {}],
    ["check_for_update", (s) => s.check_for_update(), "common", "check_for_update_request", {}],
    ["check_for_update_urgency", (s) => s.check_for_update_urgency(), "common", "check_for_update_urgency_request", {}],
    ["check_internet", (s) => s.check_internet(), "common", "check_internet_request", {}],
    ["set_local_site_config", (s) => s.set_local_site_config(), "common", "set_local_site_config_request", {}],
    [
        "add_authorized_client",
        (s) => s.add_authorized_client(Buffer.from("key")),
        "authorization",
        "add_authorized_client_request",
        { key_type: 1, public_key: B64_KEY, authorized_client_type: 1, description: "Powerwall LAN Client" },
    ],
    [
        "remove_authorized_client",
        (s) => s.remove_authorized_client(Buffer.from("key")),
        "authorization",
        "remove_authorized_client_request",
        { public_key: B64_KEY },
    ],
    ["get_backup_events", (s) => s.get_backup_events(), "teg", "get_backup_events_request", {}],
    ["schedule_backup_event", (s) => s.schedule_backup_event(), "teg", "schedule_manual_backup_event_request", {}],
    ["cancel_backup_event", (s) => s.cancel_backup_event(), "teg", "cancel_manual_backup_event_request", {}],
    ["get_teg_config", (s) => s.get_teg_config(), "teg", "get_config_request", {}],
];

// The pre-pairing reads Tesla's cloud accepts unsigned.
const UNSIGNED_COMMANDS: [string, (site: EnergySpecific) => Promise<unknown>, string, string][] = [
    ["get_system_info", (s) => s.get_system_info(), "common", "get_system_info_request"],
    ["raw_networking_status", (s) => s.raw_networking_status(), "common", "get_networking_status_request"],
    [
        "get_signed_commands_public_key",
        (s) => s.get_signed_commands_public_key(),
        "authorization",
        "get_signed_commands_public_key_request",
    ],
    ["list_authorized_clients", (s) => s.list_authorized_clients(), "authorization", "list_authorized_clients_request"],
];

/** snake_case proto name to the generated field name. */
const camel = (name: string) => name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

describe("energy device commands", () => {
    it.each(SIGNED_COMMANDS)("%s signs with a key", async (_name, call, category, command) => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await call(site);

        const payload = signedEnvelope(fetchMock)[category as "teg"] as unknown as Record<string, unknown>;
        expect(payload[camel(command)]).toBeDefined();
    });

    it.each(SIGNED_COMMANDS)("%s sends the unsigned form without a key", async (_name, call, category, command, params) => {
        const { site, fetchMock } = makeSite();

        await call(site);

        expect(sent(fetchMock)).toEqual({
            path: `api/1/energy_sites/${SITE_ID}/command`,
            body: {
                command_type: "grpc_command",
                command_properties: { message: { [category]: { [command]: params } }, identifier_type: 1 },
            },
        });
    });

    it.each(UNSIGNED_COMMANDS)("%s stays unsigned with a key", async (_name, call, category, command) => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await call(site);

        expect(sent(fetchMock)).toEqual({
            path: `api/1/energy_sites/${SITE_ID}/command`,
            body: {
                command_type: "grpc_command",
                command_properties: { message: { [category]: { [command]: {} } }, identifier_type: 1 },
            },
        });
    });
});

describe("get_networking_status", () => {
    it("unwraps to GetNetworkingStatusResponse", async () => {
        const status = { wifi: { active_route: true } };
        const { site } = makeSite(undefined, {
            response: { message: { Payload: { Common: { Message: { GetNetworkingStatusResponse: status } } } } },
        });

        await expect(site.get_networking_status()).resolves.toEqual(status);
    });

    it("is empty when the reply does not hold one", async () => {
        const { site } = makeSite(undefined, { response: {} });

        await expect(site.get_networking_status()).resolves.toEqual({});
    });
});

describe("authorized clients", () => {
    it("base64-encodes bytes and passes a string as it is", async () => {
        for (const [key, expected] of [
            [Buffer.from("raw-der-bytes"), Buffer.from("raw-der-bytes").toString("base64")],
            ["already-base64==", "already-base64=="],
        ] as const) {
            const removed = makeSite();
            await removed.site.remove_authorized_client(key);
            expect(
                sent(removed.fetchMock).body.command_properties.message.authorization.remove_authorized_client_request,
            ).toEqual({ public_key: expected });

            const added = makeSite();
            await added.site.add_authorized_client(key);
            expect(
                sent(added.fetchMock).body.command_properties.message.authorization.add_authorized_client_request
                    .public_key,
            ).toBe(expected);
        }
    });

    it("passes the description, key type and client type through unsigned", async () => {
        const { site, fetchMock } = makeSite();

        await site.add_authorized_client("key", "HA", AuthorizedClientKeyType.ECC, 2);

        expect(sent(fetchMock).body.command_properties.message.authorization.add_authorized_client_request).toEqual({
            key_type: 2,
            public_key: "key",
            authorized_client_type: 2,
            description: "HA",
        });
    });

    it("uses the proto field names when signed", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.add_authorized_client(Buffer.from("key"), "HA");

        const request = signedEnvelope(fetchMock).authorization?.addAuthorizedClientRequest;
        expect(Buffer.from(request!.publicKey).toString()).toBe("key");
        expect(request?.description).toBe("HA");
        expect(request?.type).toBe(1);
        expect(request?.keyType).toBe(1);
    });

    it("passes an RSA PKCS#1 and an ECC SPKI key through byte for byte", async () => {
        const rsa = crypto.createPublicKey(TEST_KEY).export({ type: "pkcs1", format: "der" });
        const ecc = crypto
            .generateKeyPairSync("ec", { namedCurve: "P-256" })
            .publicKey.export({ type: "spki", format: "der" });

        for (const [der, keyType] of [
            [rsa, AuthorizedClientKeyType.RSA],
            [ecc, AuthorizedClientKeyType.ECC],
        ] as const) {
            const { site, fetchMock } = makeSite(TEST_KEY);
            await site.add_authorized_client(der, "client", keyType);
            const request = signedEnvelope(fetchMock).authorization?.addAuthorizedClientRequest;
            expect(Buffer.from(request!.publicKey).equals(der)).toBe(true);
            expect(request?.keyType).toBe(keyType);
        }
    });
});

describe("backup events", () => {
    it("sends only the given scheduling fields unsigned", async () => {
        const { site, fetchMock } = makeSite();

        await site.schedule_backup_event("2026-10-29T10:00:00Z", 3600, 1);

        expect(
            sent(fetchMock).body.command_properties.message.teg.schedule_manual_backup_event_request,
        ).toEqual({ scheduling_info: { start_time: "2026-10-29T10:00:00Z", duration_seconds: 3600, priority: 1 } });
    });

    it("signs a priority beyond 2^53 without loss", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.schedule_backup_event(null, 7200, "18446744073709551615");

        const info = signedEnvelope(fetchMock).teg?.scheduleManualBackupEventRequest?.schedulingInfo;
        expect(info?.priority).toBe("18446744073709551615");
        expect(info?.durationSeconds).toBe(7200);
    });

    it("decodes a get_backup_events reply carrying priority 2^64 - 1", async () => {
        const schedulingInfo = { durationSeconds: 7200, priority: "18446744073709551615" };
        const encoded = MessageEnvelope.encode(
            MessageEnvelope.create({
                teg: { getBackupEventsResponse: { manualBackupEvent: { schedulingInfo }, backupEvents: [] } },
            }),
        ).finish();
        const reply = { response: { message_envelope_as_bytes: Buffer.from(encoded).toString("base64") } };
        const { site } = makeSite(TEST_KEY, reply);

        await expect(site.get_backup_events()).resolves.toEqual(reply);

        const envelope = MessageEnvelope.decode(Buffer.from(reply.response.message_envelope_as_bytes, "base64"));
        expect(envelope.teg?.getBackupEventsResponse?.manualBackupEvent?.schedulingInfo?.priority).toBe(
            "18446744073709551615",
        );
    });
});
