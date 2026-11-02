import crypto from "node:crypto";
import { RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it, vi } from "vitest";
import { ENERGY_TEST_DIN as DIN, ENERGY_TEST_KEY_PEM } from "./fixtures/energy-signing.js";
import { EnergyIslandMode } from "../src/const.js";
import EnergySpecific from "../src/energyspecific.js";
import { DeviceUnexpectedResponse, EnergyGatewayUnreachable, InvalidResponse } from "../src/exceptions.js";
import Teslemetry from "../src/teslemetry.js";
import { TeslemetryEnergySite, TeslemetryEnergySites } from "../src/teslemetryenergy.js";

const SITE_ID = 12345;
const BASE = `api/1/energy_sites/${SITE_ID}/command`;
const TEST_KEY = crypto.createPrivateKey(ENERGY_TEST_KEY_PEM);
const B64_KEY = Buffer.from("key").toString("base64");

function makeSite(privateKey?: crypto.KeyObject, reply: unknown = { response: {} }, status = 200) {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify(reply), { status, headers: { "Content-Type": "application/json" } }),
    );
    const api = new Teslemetry("token", "na", { fetch: fetchMock as unknown as typeof fetch });
    return { site: api.energySites!.create(SITE_ID, privateKey, privateKey ? DIN : undefined), fetchMock };
}

function sent(fetchMock: ReturnType<typeof makeSite>["fetchMock"]) {
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    return {
        method: init.method,
        path: new URL(url).pathname.slice(1),
        body: init.body ? JSON.parse(init.body as string) : null,
    };
}

function signedEnvelope(fetchMock: ReturnType<typeof makeSite>["fetchMock"]): MessageEnvelope {
    const { path, body } = sent(fetchMock);
    expect(path).toBe(`api/1/energy_sites/${SITE_ID}/device_command`);
    // Teslemetry takes the flat body and adds Tesla's "data" wrapper.
    expect(Object.keys(body).sort()).toEqual(["identifier_type", "routable_message", "target_id"]);
    expect(body.identifier_type).toBe(1);
    expect(body.target_id).toBe(DIN);
    const message = RoutableMessage.decode(Buffer.from(body.routable_message, "base64"));
    return MessageEnvelope.decode(message.protobufMessageAsBytes!);
}

const call = (site: TeslemetryEnergySite, name: string, ...args: unknown[]): Promise<unknown> =>
    (site as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[name](...args);

describe("TeslemetryEnergySites", () => {
    it("backs Teslemetry's energySites and creates Teslemetry sites", () => {
        const api = new Teslemetry("token");

        expect(api.energySites).toBeInstanceOf(TeslemetryEnergySites);
        const site = api.energySites!.create(SITE_ID, TEST_KEY, DIN);
        expect(site).toBeInstanceOf(TeslemetryEnergySite);
        expect(site.din).toBe(DIN);
        expect(site.signing).toBe(true);
        expect(api.energySites!.byId.get(SITE_ID)).toBe(site);
        expect(api.energySites!.create(SITE_ID + 1).signing).toBe(false);
    });
});

describe("keyless set_island_mode refusals", () => {
    it.each([0, 2, 3, 5, 7, 99, -1, 1.5, NaN, Infinity, "6", "1", null, undefined, true, false, {}, [6]])("refuses mode %j before any request", async (mode) => {
        const { site, fetchMock } = makeSite();
        await expect(site.set_island_mode(mode as number)).rejects.toBeInstanceOf(TypeError);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    // Teslemetry's route decodes the envelope and answers with the leaf, as `{ response: { result } }`.
    it.each<[string, number | string, number]>([
        ["a number", 4, 4],
        ["an enum name", "TEG_SET_ISLAND_MODE_RESULT_REJECTED_LOW_ENERGY", 4],
    ])("raises on a rejection given as %s", async (_name, result, code) => {
        const { site } = makeSite(undefined, { response: { result } });

        const error = await site.go_off_grid().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(DeviceUnexpectedResponse);
        expect((error as DeviceUnexpectedResponse).data).toEqual({
            code,
            message: "TEG_SET_ISLAND_MODE_RESULT_REJECTED_LOW_ENERGY",
        });
    });

    it.each<[string, unknown]>([
        ["accepted", { response: { result: 1 } }],
        ["true", { response: { result: true } }],
        ["unknown", { response: { result: 99 } }],
        ["empty", { response: {} }],
    ])("returns on an %s reply", async (_name, reply) => {
        const { site } = makeSite(undefined, reply);
        await expect(site.reconnect_grid()).resolves.toEqual(reply);
    });
});

describe("keyless Teslemetry routes", () => {
    it("never falls back to the parent's RSA key", async () => {
        const { fetchMock } = makeSite();
        const api = new Teslemetry("token", "na", { fetch: fetchMock as unknown as typeof fetch });
        api.rsa_private_key = TEST_KEY;
        const site = api.energySites!.create(SITE_ID, undefined, DIN);

        await site.go_off_grid();

        expect(site.signing).toBe(false);
        expect(sent(fetchMock).path).toBe(`${BASE}/set_island_mode`);
    });

    it.each<[string, unknown[], string, string, unknown]>([
        ["get_system_info", [], "GET", "system_info", null],
        ["raw_networking_status", [], "GET", "networking_status", null],
        ["get_networking_status", [], "GET", "networking_status", null],
        ["wifi_scan", [], "GET", "wifi_scan", null],
        ["get_device_cert", [], "GET", "device_cert", null],
        ["get_cellular_info", [], "GET", "cellular_info", null],
        ["check_for_update", [], "GET", "check_for_update", null],
        ["check_for_update_urgency", [], "GET", "check_for_update_urgency", null],
        ["check_internet", [], "GET", "check_internet", null],
        ["set_local_site_config", [{ site_name: "Home" }], "POST", "set_local_site_config", { site_name: "Home" }],
        ["set_local_site_config", [], "POST", "set_local_site_config", {}],
        ["get_signed_commands_public_key", [], "GET", "signed_commands_public_key", null],
        ["get_backup_events", [], "GET", "backup_events", null],
        [
            "schedule_backup_event",
            ["2026-10-29T10:00:00Z", 3600, 1],
            "POST",
            "schedule_backup_event",
            { scheduling_info: { start_time: "2026-10-29T10:00:00Z", duration_seconds: 3600, priority: 1 } },
        ],
        ["schedule_backup_event", [], "POST", "schedule_backup_event", {}],
        ["cancel_backup_event", [], "POST", "cancel_backup_event", {}],
        ["get_teg_config", [], "GET", "config", null],
        ["list_authorized_clients", [], "GET", "authorized_clients", null],
        ["add_authorized_client", [], "POST", "add_authorized_client", {}],
        [
            "add_authorized_client",
            [Buffer.from("key"), "HA", 1, 1],
            "POST",
            "add_authorized_client",
            { public_key: B64_KEY, description: "HA", key_type: 1, authorized_client_type: 1 },
        ],
        ["remove_authorized_client", [Buffer.from("key")], "POST", "remove_authorized_client", { public_key: B64_KEY }],
        ["remove_authorized_client", ["already-base64=="], "POST", "remove_authorized_client", { public_key: "already-base64==" }],
        ["dispatch_battery_power", [-3000, 30], "POST", "dispatch_battery_power", { power_watts: -3000, duration_seconds: 30 }],
        ["resume_battery_operation", [], "POST", "resume_battery_operation", null],
        ["set_island_mode", [EnergyIslandMode.ON_GRID, false], "POST", "set_island_mode", { mode: 1, force: false }],
        ["go_off_grid", [], "POST", "set_island_mode", { mode: 6, force: true }],
        ["reconnect_grid", [], "POST", "set_island_mode", { mode: 1 }],
    ])("%s(%j) calls %s %s", async (name, args, method, route, body) => {
        const reply = { response: { din: "1232100-00-E--TG1" } };
        const { site, fetchMock } = makeSite(undefined, reply);

        await expect(call(site, name, ...args)).resolves.toEqual(reply);

        expect(sent(fetchMock)).toEqual({ method, path: `${BASE}/${route}`, body });
    });

    it("rejects invalid dispatch arguments before any request", async () => {
        const { site, fetchMock } = makeSite();

        await expect(site.dispatch_battery_power(NaN, 60)).rejects.toThrow(RangeError);
        await expect(site.dispatch_battery_power(5000, 0)).rejects.toThrow(RangeError);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("overrides every EnergySpecific method on _command", () => {
        // A new method on `_command` must get a Teslemetry route, or it inherits
        // the grpc_command body Teslemetry rejects.
        const prototype = EnergySpecific.prototype as unknown as Record<string, unknown>;
        const usesCommand = Object.getOwnPropertyNames(prototype).filter(
            (name) =>
                !["constructor", "signing", "_command"].includes(name) &&
                String(prototype[name]).includes("this._command("),
        );

        expect(usesCommand.length).toBeGreaterThanOrEqual(16);
        const overridden = Object.getOwnPropertyNames(TeslemetryEnergySite.prototype);
        expect(usesCommand.filter((name) => !overridden.includes(name))).toEqual([]);
    });
});

describe("keyed Teslemetry site", () => {
    it.each<[string, unknown[], string]>([
        ["wifi_scan", [], "wifiScanRequest"],
        ["get_device_cert", [], "deviceCertRequest"],
        ["get_cellular_info", [], "getCellularInfoRequest"],
        ["check_for_update", [], "checkForUpdateRequest"],
        ["check_for_update_urgency", [], "checkForUpdateUrgencyRequest"],
        ["check_internet", [], "checkInternetRequest"],
        ["set_local_site_config", [], "setLocalSiteConfigRequest"],
        ["add_authorized_client", [Buffer.from("key")], "addAuthorizedClientRequest"],
        ["remove_authorized_client", [Buffer.from("key")], "removeAuthorizedClientRequest"],
        ["get_backup_events", [], "getBackupEventsRequest"],
        ["schedule_backup_event", [], "scheduleManualBackupEventRequest"],
        ["cancel_backup_event", [], "cancelManualBackupEventRequest"],
        ["get_teg_config", [], "getConfigRequest"],
        ["dispatch_battery_power", [-2000, 120], "dispatchBatteryPowerRequest"],
        ["resume_battery_operation", [], "dispatchBatteryPowerRequest"],
        ["set_island_mode", [EnergyIslandMode.ON_GRID], "setIslandModeRequest"],
    ])("%s signs through device_command", async (name, args, field) => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await call(site, name, ...args);

        const envelope = signedEnvelope(fetchMock);
        const payload = { ...envelope.common, ...envelope.teg, ...envelope.authorization } as Record<string, unknown>;
        expect(payload[field]).toBeDefined();
    });

    it("go_off_grid signs with force", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.go_off_grid();

        expect(signedEnvelope(fetchMock).teg?.setIslandModeRequest).toEqual({ mode: 6, force: true });
    });

    it("registers Teslemetry's own key through the route when given no public key", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.add_authorized_client();

        expect(sent(fetchMock).path).toBe(`${BASE}/add_authorized_client`);
    });

    it("signs a registration with the optional fields left to their defaults", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.add_authorized_client(Buffer.from("key"), null, null, null);

        const request = signedEnvelope(fetchMock).authorization?.addAuthorizedClientRequest;
        expect(request?.description).toBe("Powerwall LAN Client");
        expect(request?.keyType).toBe(1);
        expect(request?.type).toBe(1);
    });

    it.each<[string, string]>([
        ["get_networking_status", "networking_status"],
        ["list_authorized_clients", "authorized_clients"],
        ["get_system_info", "system_info"],
        ["raw_networking_status", "networking_status"],
        ["get_signed_commands_public_key", "signed_commands_public_key"],
    ])("%s stays on its route with a key", async (name, route) => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await call(site, name);

        expect(sent(fetchMock)).toEqual({ method: "GET", path: `${BASE}/${route}`, body: null });
    });

    it("raises a device error inside HTTP 200", async () => {
        const encoded = MessageEnvelope.encode(
            MessageEnvelope.create({ common: { errorResponse: { status: { code: 11, message: "over limit" } } } }),
        ).finish();
        const { site } = makeSite(TEST_KEY, {
            response: { message_envelope_as_bytes: Buffer.from(encoded).toString("base64") },
        });

        await expect(site.dispatch_battery_power(11000, 30)).rejects.toThrow(DeviceUnexpectedResponse);
    });
});

describe("find_authorized_clients", () => {
    it("parses the route's reply", async () => {
        const { site } = makeSite(undefined, { response: { clients: [{ public_key: "key", state: 3 }] } });

        const { clients } = await site.find_authorized_clients();

        expect(clients[0].public_key).toBe("key");
        expect(clients[0].state).toBe(3);
    });

    it("raises InvalidResponse on a bare JSON null", async () => {
        const { site } = makeSite(undefined, null);

        await expect(site.find_authorized_clients()).rejects.toThrow(InvalidResponse);
    });

    it("parses a well-formed empty list to empty", async () => {
        const { site } = makeSite(undefined, { response: { authorized_clients: [] } });

        await expect(site.find_authorized_clients()).resolves.toMatchObject({ clients: [] });
    });

    it("returns a bare JSON null unchanged from list_authorized_clients", async () => {
        const { site } = makeSite(undefined, null);

        await expect(site.list_authorized_clients()).resolves.toBeNull();
    });
});

describe("find_gateway_address", () => {
    it("parses the route's reply", async () => {
        const { site, fetchMock } = makeSite(undefined, {
            response: { wifi: { active_route: true, ipv4_config: { address: "192.0.2.10" } } },
        });

        await expect(site.find_gateway_address()).resolves.toBe("192.0.2.10");

        expect(sent(fetchMock).path).toBe(`${BASE}/networking_status`);
    });

    it("raises InvalidResponse on the known null reply", async () => {
        const { site } = makeSite(undefined, { response: null });

        await expect(site.find_gateway_address()).rejects.toThrow(InvalidResponse);
    });

    it("keeps EnergyGatewayUnreachable distinct on a 502", async () => {
        const { site } = makeSite(undefined, { error: "energy_gateway_unreachable" }, 502);

        await expect(site.find_gateway_address()).rejects.toThrow(EnergyGatewayUnreachable);
        await expect(site.find_authorized_clients()).rejects.toThrow(EnergyGatewayUnreachable);
    });
});
