import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthorizedClientState } from "../../src/const.js";
import { raw_to_scaled_reserve, PowerwallClient } from "../../src/powerwall/client.js";
import { PowerwallEnergySite } from "../../src/powerwall/energysite.js";
import { PowerwallConnectionError } from "../../src/powerwall/exceptions.js";
import { GATEWAY_DIN, GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

const OK = { response: { code: 201, message: "", result: true } };

let gateway: FakeGateway;
let client: PowerwallClient;
let site: PowerwallEnergySite;

beforeEach(async () => {
    gateway = await FakeGateway.start();
    client = new PowerwallClient({ host: gateway.host, gatewayPassword: GATEWAY_PASSWORD, rsaPrivateKeyPem: TEST_KEY_PEM });
    site = new PowerwallEnergySite(client);
});

afterEach(async () => {
    client.close();
    await gateway.stop();
});

function setStatus(remaining: number, full: number): void {
    gateway.graphql.DeviceControllerQuery = JSON.stringify({
        control: { systemStatus: { nominalEnergyRemainingWh: remaining, nominalFullPackEnergyWh: full } },
    });
}

describe("commands", () => {
    it("exposes the client", () => {
        expect(site.powerwall).toBe(client);
    });

    it("maps operation", async () => {
        await expect(site.operation("autonomous")).resolves.toEqual(OK);
        expect(gateway.configJson.default_real_mode).toBe("autonomous");
    });

    it("maps backup on the app's scale", async () => {
        await expect(site.backup(20)).resolves.toEqual(OK);
        expect(gateway.configJson.site_info.backup_reserve_percent).toBe(24);
    });

    it("writes both grid settings in one write", async () => {
        await expect(site.grid_import_export(true, "battery_ok")).resolves.toEqual(OK);
        expect(gateway.configWrites).toHaveLength(1);
        expect(gateway.configJson.site_info).toMatchObject({
            customer_preferred_export_rule: "battery_ok",
            disallow_charge_from_grid_with_solar_installed: true,
        });
    });

    it("sends one setting and never derives the other", async () => {
        await site.grid_import_export(null, "never");
        expect(gateway.configJson.site_info.customer_preferred_export_rule).toBe("never");
        expect(gateway.configJson.site_info).not.toHaveProperty("disallow_charge_from_grid_with_solar_installed");
    });

    it("defaults force to true off grid", async () => {
        await expect(site.set_island_mode(6)).resolves.toEqual(OK);
        expect(gateway.posts[0].envelope.teg?.setIslandModeRequest).toEqual({ mode: 6, force: true });
    });

    it("defaults force to false on grid", async () => {
        await site.set_island_mode(1);
        expect(gateway.posts[0].envelope.teg?.setIslandModeRequest).toEqual({ mode: 1, force: false });
    });

    it("lets an explicit force override the default", async () => {
        await site.set_island_mode(6, false);
        expect(gateway.posts[0].envelope.teg?.setIslandModeRequest).toEqual({ mode: 6, force: false });
    });

    it("maps go_off_grid and reconnect_grid", async () => {
        await expect(site.go_off_grid()).resolves.toEqual(OK);
        await expect(site.reconnect_grid()).resolves.toEqual(OK);
        expect(gateway.posts.map((post) => post.envelope.teg?.setIslandModeRequest?.mode)).toEqual([6, 1]);
    });

    it("schedules a backup with the given duration", async () => {
        await expect(site.schedule_backup_event(null, 3600)).resolves.toEqual(OK);
        const info = gateway.posts[1].envelope.teg?.scheduleManualBackupEventRequest?.schedulingInfo;
        expect(info?.durationSeconds).toBe(3600);
    });

    it("does not honour start_time or priority", async () => {
        const before = Date.now();
        await site.schedule_backup_event("2020-01-01T00:00:00Z", null, 5);
        const info = gateway.posts[1].envelope.teg?.scheduleManualBackupEventRequest?.schedulingInfo;
        expect(info?.durationSeconds).toBe(7200);
        expect(info?.priority).toBe("18446744073709551615");
        expect((info?.startTime as Date).getTime()).toBeGreaterThanOrEqual(before - 1000);
    });

    it("maps cancel_backup_event", async () => {
        await expect(site.cancel_backup_event()).resolves.toEqual(OK);
        expect(gateway.posts[0].envelope.teg?.cancelManualBackupEventRequest).toBeDefined();
    });

    it("maps dispatch_battery_power", async () => {
        await expect(site.dispatch_battery_power(-2500, 30)).resolves.toEqual(OK);
        expect(gateway.posts[0].envelope.teg?.dispatchBatteryPowerRequest?.realPower).toEqual({
            powerWatts: -2500,
            durationSeconds: 30,
        });
    });

    it("maps resume_battery_operation", async () => {
        await expect(site.resume_battery_operation()).resolves.toEqual(OK);
        expect(gateway.posts[0].envelope.teg?.dispatchBatteryPowerRequest?.resumeDeviceMode).toBeDefined();
    });

    it("maps remove_authorized_client", async () => {
        await expect(site.remove_authorized_client("AQID")).resolves.toEqual(OK);
    });

    it("returns a fresh envelope each time", async () => {
        const first = await site.cancel_backup_event();
        first.response.result = false;
        await expect(site.cancel_backup_event()).resolves.toEqual(OK);
    });
});

describe("reads", () => {
    it("wraps get_backup_events", async () => {
        await expect(site.get_backup_events()).resolves.toEqual({ response: { manual_backup: null, backup_events: [] } });
    });

    it("wraps list_authorized_clients", async () => {
        await expect(site.list_authorized_clients()).resolves.toEqual({
            response: { clients: [], enable_line_switch_off: false },
        });
    });

    it("types find_authorized_clients like the cloud", async () => {
        const clients = [{ publicKey: Buffer.from([1, 2, 3]), state: 3, roles: [1], verification: 3 }];
        gateway.reply({ envelope: { authorization: { listAuthorizedClientsResponse: { clients } } } });

        const { clients: parsed } = await site.find_authorized_clients();

        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toMatchObject({
            public_key: "AQID",
            state: AuthorizedClientState.VERIFIED,
            roles: [1],
            verification: 3,
            raw: { public_key: "AQID", state: "VERIFIED", identifier: null },
        });
    });

    it("keeps an unknown state", async () => {
        const clients = [{ publicKey: Buffer.from([1]), state: 99 }];
        gateway.reply({ envelope: { authorization: { listAuthorizedClientsResponse: { clients } } } });
        const { clients: parsed } = await site.find_authorized_clients();
        expect(parsed[0].state).toBe(99);
    });

    it("reads an empty list as no clients", async () => {
        await expect(site.find_authorized_clients()).resolves.toMatchObject({ clients: [] });
    });
});

describe("live_status", () => {
    beforeEach(() => {
        setStatus(52777.8, 100000);
    });

    it("maps every key", async () => {
        const result = await site.live_status();

        expect(Object.keys(result)).toEqual(["response"]);
        expect(result.response).toEqual({
            solar_power: 2000,
            energy_left: 52777.8,
            total_pack_energy: 100000,
            percentage_charged: 50.2924,
            backup_capable: null,
            battery_power: -1000,
            load_power: 500,
            grid_power: 1500,
            grid_services_power: null,
            generator_power: 0,
            grid_status: "Active",
            grid_services_active: null,
            island_status: "on_grid",
            storm_mode_active: null,
            timestamp: null,
            wall_connectors: null,
        });
    });

    it("reads in order: meters, status, grid", async () => {
        await site.live_status();
        expect(gateway.gets.map((get) => get.path)).toEqual([
            "/tedapi/din",
            "/api/meters/aggregates",
            "/api/system_status/grid_status",
        ]);
        expect(gateway.posts).toHaveLength(1);
    });

    it("gives null for a missing or non-numeric meter", async () => {
        gateway.rest.set("/api/meters/aggregates", { solar: { instant_power: "x" }, battery: 5 });
        const { response } = await site.live_status();
        expect(response.solar_power).toBeNull();
        expect(response.battery_power).toBeNull();
        expect(response.load_power).toBeNull();
    });

    it("gives null with a missing status", async () => {
        gateway.graphql.DeviceControllerQuery = "{}";
        const { response } = await site.live_status();
        expect(response.percentage_charged).toBeNull();
        expect(response.energy_left).toBeNull();
        expect(response.total_pack_energy).toBeNull();
    });

    it.each([
        ["SystemGridConnected", "Active", "on_grid"],
        ["SystemIslandedActive", "Inactive", "off_grid"],
        ["SystemIslandedReady", "Inactive", "off_grid"],
        ["SystemTransitionToGrid", "Active", "on_grid"],
        ["SystemTransitionToIsland", "Inactive", "off_grid"],
        ["SystemMicroGridFaulted", "Inactive", "off_grid"],
        ["SystemWaitForUser", "Inactive", "island_status_unknown"],
        ["SomethingBrandNew", "Unknown", "island_status_unknown"],
        ["constructor", "Unknown", "island_status_unknown"],
    ])("maps %s", async (grid_status, expected, island) => {
        gateway.rest.set("/api/system_status/grid_status", { grid_status });
        const { response } = await site.live_status();
        expect(response.grid_status).toBe(expected);
        expect(response.island_status).toBe(island);
    });

    it("propagates a failed read", async () => {
        gateway.reply({ dropConnection: true });
        await expect(site.live_status()).rejects.toBeInstanceOf(PowerwallConnectionError);
    });
});

describe("local_config", () => {
    const setConfig = (config: unknown) => {
        gateway.config = Buffer.from(JSON.stringify(config));
    };

    it("returns a bare object, with the reserve scaled", async () => {
        setConfig({ site_info: { backup_reserve_percent: 25 }, default_real_mode: "self_consumption", other: 1 });
        await expect(site.local_config()).resolves.toEqual({
            backup_reserve_percent: raw_to_scaled_reserve(25),
            default_real_mode: "self_consumption",
        });
    });

    it("omits a missing reserve", async () => {
        setConfig({ site_info: {}, default_real_mode: "self_consumption" });
        await expect(site.local_config()).resolves.toEqual({ default_real_mode: "self_consumption" });
    });

    it("omits a missing mode", async () => {
        setConfig({ site_info: { backup_reserve_percent: 25 } });
        const result = await site.local_config();
        expect(result).not.toHaveProperty("default_real_mode");
    });

    it("is empty when no source is present", async () => {
        setConfig({});
        await expect(site.local_config()).resolves.toEqual({});
    });
});

describe("surface", () => {
    // Document 02, section 3.
    const LOCAL = [
        "operation",
        "backup",
        "grid_import_export",
        "set_island_mode",
        "go_off_grid",
        "reconnect_grid",
        "schedule_backup_event",
        "cancel_backup_event",
        "dispatch_battery_power",
        "resume_battery_operation",
        "get_backup_events",
        "live_status",
        "list_authorized_clients",
        "find_authorized_clients",
        "remove_authorized_client",
        "local_config",
    ];
    const CLOUD_ONLY = [
        "site_info",
        "storm_mode",
        "off_grid_vehicle_charging_reserve",
        "time_of_use_settings",
        "backup_history",
        "charge_history",
        "energy_history",
        "get_system_info",
        "raw_networking_status",
        "get_networking_status",
        "wifi_scan",
        "get_device_cert",
        "get_cellular_info",
        "check_for_update",
        "check_for_update_urgency",
        "check_internet",
        "set_local_site_config",
        "get_teg_config",
        "add_authorized_client",
        "get_signed_commands_public_key",
    ];

    it("has exactly the local group", () => {
        const methods = Object.getOwnPropertyNames(PowerwallEnergySite.prototype).filter(
            (name) => name !== "constructor" && name !== "powerwall",
        );
        expect(methods.sort()).toEqual([...LOCAL].sort());
    });

    it.each(CLOUD_ONLY)("has no %s", (name) => {
        expect(name in site).toBe(false);
    });

    it("has no connect_if_needed", () => {
        expect("connect_if_needed" in site).toBe(false);
    });

    it("serializes without the client", async () => {
        await client.connect();
        expect(JSON.stringify(site)).toBe("{}");
        expect(client.din).toBe(GATEWAY_DIN);
    });
});
