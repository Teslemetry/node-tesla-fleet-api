import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PowerwallClient, type PowerwallClientOptions } from "../../src/powerwall/client.js";
import {
    PowerwallAuthenticationError,
    PowerwallCommandError,
    PowerwallConnectionError,
    PowerwallNotSupportedError,
    PowerwallProtocolError,
    PowerwallRateLimitError,
} from "../../src/powerwall/exceptions.js";
import { GATEWAY_DIN, GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

const MAX_PRIORITY = "18446744073709551615";

let gateway: FakeGateway;
let client: PowerwallClient;

function clientFor(options: Partial<PowerwallClientOptions> = {}): PowerwallClient {
    return new PowerwallClient({
        host: gateway.host,
        gatewayPassword: GATEWAY_PASSWORD,
        rsaPrivateKeyPem: TEST_KEY_PEM,
        ...options,
    });
}

beforeEach(async () => {
    gateway = await FakeGateway.start();
    client = clientFor();
});

afterEach(async () => {
    vi.useRealTimers();
    client.close();
    await gateway.stop();
});

describe("connect", () => {
    it("logs in once and caches the DIN", async () => {
        expect(client.din).toBeNull();
        await expect(client.connect()).resolves.toBe(GATEWAY_DIN);
        await expect(client.connect()).resolves.toBe(GATEWAY_DIN);
        await expect(client.get_din()).resolves.toBe(GATEWAY_DIN);
        expect(client.din).toBe(GATEWAY_DIN);
        expect(gateway.logins).toHaveLength(1);
    });

    it("shares one attempt between concurrent callers", async () => {
        await Promise.all([client.connect(), client.connect(), client.get_meters_aggregates()]);
        expect(gateway.logins).toHaveLength(1);
        expect(gateway.gets.filter((get) => get.path === "/tedapi/din")).toHaveLength(1);
    });

    it("retries after a failure", async () => {
        gateway.forceStatus("/api/login/Basic", 401);
        await expect(client.connect()).rejects.toBeInstanceOf(PowerwallAuthenticationError);
        await expect(client.connect()).resolves.toBe(GATEWAY_DIN);
    });

    it("defaults to the gateway's own access point", () => {
        const defaulted = new PowerwallClient({ gatewayPassword: "x", rsaPrivateKeyPem: TEST_KEY_PEM });
        expect(defaulted.host).toBe("192.168.91.1");
        defaulted.close();
    });

    it("sends the full password through legacy_gateway", async () => {
        await gateway.stop();
        gateway = await FakeGateway.start({ password: GATEWAY_PASSWORD });
        const legacy = PowerwallClient.legacy_gateway({
            host: gateway.host,
            gatewayPassword: GATEWAY_PASSWORD,
            rsaPrivateKeyPem: TEST_KEY_PEM,
        });
        await legacy.connect();
        legacy.close();
        expect(gateway.logins[0].password).toBe(GATEWAY_PASSWORD);
    });

    it("exposes no secret", async () => {
        await client.connect();
        expect(JSON.stringify(client)).toBe("{}");
    });
});

describe("REST reads", () => {
    it("returns the meter aggregates", async () => {
        await expect(client.get_meters_aggregates()).resolves.toMatchObject({ site: { instant_power: 1500 } });
    });

    it("rejects aggregates that are not an object", async () => {
        gateway.rest.set("/api/meters/aggregates", []);
        await expect(client.get_meters_aggregates()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("returns raw and scaled state of charge", async () => {
        await expect(client.get_battery_soe_raw()).resolves.toBe(52.77777777777778);
        await expect(client.get_battery_soe()).resolves.toBeCloseTo(50.2924, 4);
    });

    it.each([[{}], [[]], [{ percentage: "x" }], [{ percentage: null }]])("rejects the SoE payload %j", async (body) => {
        gateway.rest.set("/api/system_status/soe", body);
        await expect(client.get_battery_soe_raw()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("returns the grid status", async () => {
        await expect(client.get_grid_status()).resolves.toBe("SystemGridConnected");
    });

    it("rejects a grid payload with no status", async () => {
        gateway.rest.set("/api/system_status/grid_status", {});
        await expect(client.get_grid_status()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });
});

describe("GraphQL reads", () => {
    it("parses the status and sends a Local-read header", async () => {
        gateway.graphql.DeviceControllerQuery = '{"control":{"systemStatus":{"nominalFullPackEnergyWh":1}}}';

        await expect(client.get_status()).resolves.toEqual({ control: { systemStatus: { nominalFullPackEnergyWh: 1 } } });

        const { envelope } = gateway.posts[0];
        expect(envelope).toMatchObject({ deliveryChannel: 1, sender: { local: 1 }, recipient: { din: GATEWAY_DIN } });
        expect(envelope.graphql?.queryRequest?.format).toBe(2);
        expect(envelope.graphql?.queryRequest?.variablesJson).toBe("{}");
    });

    it("sends the controller and component variables", async () => {
        await client.get_device_controller();
        await client.get_components();
        const [controller, components] = gateway.posts.map((post) => post.envelope.graphql?.queryRequest);
        expect(controller?.variablesJson).toContain('"msaComp"');
        expect(components?.variablesJson).toContain('"pwsComponentsFilter"');
    });

    it("rejects a reply with no query response", async () => {
        gateway.reply({ envelope: { common: {} } });
        await expect(client.get_status()).rejects.toThrow("missing payload");
    });

    it("rejects empty data", async () => {
        gateway.reply({ envelope: { graphql: { queryResponse: { data: "" } } } });
        await expect(client.get_status()).rejects.toThrow("payload is empty");
    });

    it.each(["not json", "[1]", "3"])("rejects the document %j", async (data) => {
        gateway.reply({ envelope: { graphql: { queryResponse: { data } } } });
        await expect(client.get_components()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("rejects a reply that is not a MessageEnvelope", async () => {
        gateway.reply({ inner: Buffer.from("ffffffff", "hex") });
        await expect(client.get_status()).rejects.toThrow("Malformed");
    });
});

describe("Python's wire vectors", () => {
    const DIN = "1707000-00-J--TG9999999999XP";
    // Fields 1-3 and 5-9 of the reply, as a gateway sends them.
    const SYSTEM_INFO_RESPONSE =
        "0801121e0a1c313730373030302d30302d4a2d2d54473939393939393939393958501a021801" +
        "22b6011ab3010a1e0a0c313730373030302d30302d4a120e5447393939393939393939395850" +
        "121c313730373030302d30302d4a2d2d54473939393939393939393958501a210a1932342e31" +
        "322e362d5057332d414643492030303862663666661204008bf6ff2a02100130043a3e0a3c0a" +
        "090a075175656374656c12090a07424739352d4d321a0f0a0d584d5232303230424739354d32" +
        "22130a113130323234412d32303230424739354d324204f82173c64a04fb55ebd2";

    beforeEach(async () => {
        await gateway.stop();
        gateway = await FakeGateway.start({ din: DIN });
        client.close();
        client = clientFor();
    });

    it("encodes a GraphQL request and reads its reply", async () => {
        const reply =
            "0801121e0a1c313730373030302d30302d4a2d2d54473939393939393939393958501a021801" +
            "82011412120801120e7b22636f6e74726f6c223a7b7d7d";
        gateway.reply({ inner: Buffer.from(reply, "hex") });

        const text = await (client as any)._query_graphql(
            " query DeviceControllerQuery {x}",
            Buffer.from("30818802420236dd54", "hex"),
            "{}",
        );

        expect(text).toBe('{"control":{}}');
        expect(gateway.posts[0].envelopeBytes.toString("hex")).toBe(
            "0801120218011a1e0a1c313730373030302d30302d4a2d2d5447393939393939393939395850" +
                "82013b0a39080212240801122020717565727920446576696365436f6e74726f6c6c65725175" +
                "657279207b787d1a0930818802420236dd5422040a027b7d",
        );
    });

    it("decodes the firmware details", async () => {
        gateway.reply({ inner: Buffer.from(SYSTEM_INFO_RESPONSE, "hex") });

        const result = await client.get_firmware_details();

        expect(gateway.posts[0].envelopeBytes.toString("hex")).toBe(
            "0801120218011a1e0a1c313730373030302d30302d4a2d2d544739393939393939393939585022021200",
        );
        const { githash, ...version } = result.system.version;
        expect(Buffer.from(githash).toString("hex")).toBe("008bf6ff");
        expect({ ...result.system, version }).toEqual({
            gateway: { partNumber: "1707000-00-J", serialNumber: "TG9999999999XP" },
            din: DIN,
            version: { text: "24.12.6-PW3-AFCI 008bf6ff" },
            update_status: 1,
            device_type: 4,
            wireless: { device: [] },
        });
    });
});

describe("get_config", () => {
    it("reads config.json with a Command header", async () => {
        await expect(client.get_config()).resolves.toEqual({ ...gateway.configJson, battery_blocks: [] });

        const { envelope } = gateway.posts[0];
        expect(envelope).toMatchObject({
            deliveryChannel: 2,
            sender: { authorizedClient: 1 },
            filestore: { readFileRequest: { domain: 1, name: "config.json" } },
        });
    });

    it("keeps an existing battery_blocks", async () => {
        gateway.config = Buffer.from('{"battery_blocks":[{"din":"x"}]}');
        await expect(client.get_config()).resolves.toEqual({ battery_blocks: [{ din: "x" }] });
    });

    it("rejects a reply with no filestore", async () => {
        gateway.reply({ envelope: { common: {} } });
        await expect(client.get_config()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it.each(["not json", "[]"])("rejects the blob %j", async (blob) => {
        gateway.config = Buffer.from(blob);
        await expect(client.get_config()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("rejects a blob that is not UTF-8", async () => {
        gateway.config = Buffer.from([0xff, 0xfe]);
        await expect(client.get_config()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });
});

describe("get_backup_events", () => {
    it("handles maximum priority", async () => {
        const start = new Date("2026-01-01T00:00:00Z");
        gateway.reply({
            envelope: {
                teg: {
                    getBackupEventsResponse: {
                        manualBackupEvent: {
                            schedulingInfo: { startTime: start, durationSeconds: 3600, priority: MAX_PRIORITY },
                        },
                        backupEvents: [
                            {
                                id: "evt-1",
                                name: "Storm Watch",
                                schedulingInfo: { startTime: start, durationSeconds: 7200, priority: "42" },
                            },
                        ],
                    },
                },
            },
        });
        const start_time = start.getTime() / 1000;
        vi.setSystemTime(new Date((start_time + 3599) * 1000));

        await expect(client.get_backup_events()).resolves.toEqual({
            manual_backup: {
                start_time,
                duration_seconds: 3600,
                end_time: start_time + 3600,
                active: true,
                priority: MAX_PRIORITY,
            },
            backup_events: [
                { id: "evt-1", name: "Storm Watch", start_time, duration_seconds: 7200, priority: "42" },
            ],
        });
    });

    it("reports an expired manual event as inactive", async () => {
        gateway.reply({
            envelope: {
                teg: {
                    getBackupEventsResponse: {
                        manualBackupEvent: {
                            schedulingInfo: { startTime: new Date(1_000_000), durationSeconds: 60, priority: "1" },
                        },
                    },
                },
            },
        });
        await expect(client.get_backup_events()).resolves.toMatchObject({ manual_backup: { active: false } });
    });

    it("returns null with no manual event", async () => {
        await expect(client.get_backup_events()).resolves.toEqual({ manual_backup: null, backup_events: [] });
        expect(gateway.posts[0].envelope.teg?.getBackupEventsRequest).toBeDefined();
    });
});

describe("list_authorized_clients", () => {
    const record = {
        type: 1,
        description: "Test Client",
        keyType: 1,
        publicKey: Buffer.from([1, 2, 3]),
        roles: [1],
        state: 3,
        verification: 3,
        addedTime: new Date(1_700_000_000_000),
        identifier: "abc-123",
    };

    it("parses the reply", async () => {
        const listAuthorizedClientsResponse = { clients: [record], enableLineSwitchOff: true };
        gateway.reply({ envelope: { authorization: { listAuthorizedClientsResponse } } });

        await expect(client.list_authorized_clients()).resolves.toEqual({
            clients: [
                {
                    public_key: "AQID",
                    state: "VERIFIED",
                    type: "CUSTOMER_MOBILE_APP",
                    description: "Test Client",
                    key_type: "RSA",
                    roles: ["CUSTOMER"],
                    verification: "SIGNED",
                    added_time: 1_700_000_000,
                    identifier: "abc-123",
                    authorized_by_public_key: null,
                },
            ],
            enable_line_switch_off: true,
        });
        expect(gateway.posts[0].envelope.authorization?.listAuthorizedClientsRequest).toBeDefined();
    });

    it("omits optional fields when absent", async () => {
        const clients = [{ type: 2, keyType: 2, state: 1, verification: 1 }];
        gateway.reply({ envelope: { authorization: { listAuthorizedClientsResponse: { clients } } } });

        const result = await client.list_authorized_clients();

        expect(result.clients[0]).toMatchObject({
            roles: [],
            added_time: null,
            identifier: null,
            authorized_by_public_key: null,
        });
    });

    it("returns an unknown enum as its raw number", async () => {
        const clients = [{ state: 99, type: 98, keyType: 97, verification: 96, roles: [95] }];
        gateway.reply({ envelope: { authorization: { listAuthorizedClientsResponse: { clients } } } });

        const result = await client.list_authorized_clients();

        expect(result.clients[0]).toMatchObject({ state: 99, type: 98, key_type: 97, verification: 96, roles: [95] });
    });

    it("base64-encodes authorized_by_public_key", async () => {
        const clients = [{ ...record, authorizedByPublicKey: Buffer.from([1, 2, 3]) }];
        gateway.reply({ envelope: { authorization: { listAuthorizedClientsResponse: { clients } } } });
        const result = await client.list_authorized_clients();
        expect(result.clients[0].authorized_by_public_key).toBe("AQID");
    });

    it("handles an empty list", async () => {
        await expect(client.list_authorized_clients()).resolves.toEqual({ clients: [], enable_line_switch_off: false });
    });
});

describe("get_controllable_device_programs", () => {
    it("returns two empty lists for a site with no devices", async () => {
        await expect(client.get_controllable_device_programs()).resolves.toEqual({
            active_programs: [],
            inactive_programs: [],
        });
    });

    it("maps a program, including schema-6 boundaries", async () => {
        gateway.reply({
            envelope: {
                teg: {
                    getControllableDeviceProgramsResponse: {
                        activePrograms: [
                            {
                                key: { deviceId: "breaker-1", priority: 5000 },
                                settings: { contactorState: 1 },
                                schedule: {
                                    start: { staticCondition: 1 },
                                    end: { timestamp: new Date(1_700_003_600_000) },
                                    expiry: { islandingState: 2, stateOfEnergy: 1 },
                                },
                            },
                        ],
                        inactivePrograms: [
                            {
                                key: { deviceId: "breaker-2", priority: 777 },
                                settings: { contactorState: 9 },
                                schedule: { start: { staticCondition: 9, islandingState: 8, stateOfEnergy: 7 } },
                            },
                        ],
                    },
                },
            },
        });

        const result = await client.get_controllable_device_programs(["breaker-1"]);

        expect(result.active_programs).toEqual([
            {
                key: { device_id: "breaker-1", priority: "CUSTOMER_DEFAULT" },
                settings: { contactor_state: "OPEN" },
                schedule: {
                    start: { static_condition: "ALWAYS", timestamp: null, islanding_state: "INVALID", state_of_energy: "INVALID" },
                    end: { static_condition: "INVALID", timestamp: 1_700_003_600, islanding_state: "INVALID", state_of_energy: "INVALID" },
                    expiry: {
                        static_condition: "INVALID",
                        timestamp: null,
                        islanding_state: "OFF_GRID",
                        state_of_energy: "ABOVE_BACKUP_RESERVE",
                    },
                },
            },
        ]);
        expect(result.inactive_programs[0]).toEqual({
            key: { device_id: "breaker-2", priority: 777 },
            settings: { contactor_state: 9 },
            schedule: {
                start: { static_condition: 9, timestamp: null, islanding_state: 8, state_of_energy: 7 },
                end: null,
                expiry: null,
            },
        });
        expect(gateway.posts[0].envelope.teg?.getControllableDeviceProgramsRequest?.deviceIds).toEqual(["breaker-1"]);
    });
});

describe("battery calibration delay status", () => {
    it("parses the reply", async () => {
        const getDelayBatteryCalibrationStatusResponse = {
            calibrationDelaysLeft: 2,
            calibrationDelayRemainingSeconds: 3600,
            maxCalibrationDelays: 3,
        };
        gateway.reply({ envelope: { teg: { getDelayBatteryCalibrationStatusResponse } } });

        await expect(client.get_battery_calibration_delay_status()).resolves.toEqual({
            calibration_delays_left: 2,
            calibration_delay_remaining_seconds: 3600,
            max_calibration_delays: 3,
        });
    });

    it("raises on a reply without the response", async () => {
        gateway.reply({ envelope: { teg: { dispatchBatteryPowerResponse: {} } } });
        await expect(client.get_battery_calibration_delay_status()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("raises not-supported on the verbatim Powerwall 3 reply", async () => {
        gateway.reply({ inner: Buffer.from("22170a150a13080c120f6e6f7420696d706c656d656e746564", "hex") });

        const error = await client.get_battery_calibration_delay_status().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(PowerwallNotSupportedError);
        expect(error).toBeInstanceOf(PowerwallProtocolError);
        expect(error).toMatchObject({
            command: "get_delay_battery_calibration_status_request",
            code: 12,
            status_message: "not implemented",
        });
    });

    it("raises a command error on any other status", async () => {
        gateway.reply({ envelope: { common: { errorResponse: { status: { code: 7, message: "permission denied" } } } } });

        const error = await client.get_battery_calibration_delay_status().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(PowerwallCommandError);
        expect(error).not.toBeInstanceOf(PowerwallNotSupportedError);
    });
});

describe("failures reach the caller", () => {
    it("maps a signed read's status", async () => {
        gateway.forceStatus("/tedapi/v1r", 429);
        await expect(client.get_status()).rejects.toBeInstanceOf(PowerwallRateLimitError);
        expect(gateway.posts).toHaveLength(1);
    });

    it("maps a dropped connection", async () => {
        gateway.reply({ dropConnection: true });
        await expect(client.list_authorized_clients()).rejects.toBeInstanceOf(PowerwallConnectionError);
    });
});
