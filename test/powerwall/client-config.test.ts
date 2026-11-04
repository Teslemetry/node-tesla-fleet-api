// Config writes. The fake gateway is the only target of these: a real gateway
// write belongs to the captain-present session, PW-16.
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GRID_EXPORT_RULES, OPERATION_MODES, PowerwallClient } from "../../src/powerwall/client.js";
import { PowerwallCommandError, PowerwallProtocolError } from "../../src/powerwall/exceptions.js";
import { GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

let gateway: FakeGateway;
let client: PowerwallClient;

beforeEach(async () => {
    gateway = await FakeGateway.start();
    client = new PowerwallClient({ host: gateway.host, gatewayPassword: GATEWAY_PASSWORD, rsaPrivateKeyPem: TEST_KEY_PEM });
});

afterEach(async () => {
    client.close();
    await gateway.stop();
});

function setConfig(config: unknown): Buffer {
    gateway.config = Buffer.from(JSON.stringify(config));
    return crypto.createHash("sha256").update(gateway.config).digest();
}

describe("write_config", () => {
    it("runs concurrent writes one at a time, so neither loses the other's change", async () => {
        await Promise.all([
            client.write_config({ a: 1 }),
            client.write_config({ b: 2 }),
            client.set_operation_mode("autonomous"),
        ]);

        expect(gateway.configWrites).toHaveLength(3);
        expect(gateway.configJson).toMatchObject({ a: 1, b: 2, default_real_mode: "autonomous" });
    });

    it("keeps each write's read and update together", async () => {
        await Promise.all([client.write_config({ a: 1 }), client.write_config({ b: 2 })]);

        const kinds = gateway.posts.map((post) => (post.envelope.filestore?.readFileRequest ? "read" : "update"));
        expect(kinds).toEqual(["read", "update", "read", "update"]);
    });

    it("carries on after a failed write, and still reports that failure", async () => {
        gateway.forceStatus("/tedapi/v1r", 500);
        const results = await Promise.allSettled([client.write_config({ a: 1 }), client.write_config({ b: 2 })]);

        expect(results.map((result) => result.status)).toEqual(["rejected", "fulfilled"]);
        expect(gateway.configJson.b).toBe(2);
    });

    it("queues per client", async () => {
        const other = new PowerwallClient({ host: gateway.host, gatewayPassword: GATEWAY_PASSWORD, rsaPrivateKeyPem: TEST_KEY_PEM });
        await Promise.all([client.connect(), other.connect()]);
        const reads = gateway.posts.length;
        // Hold each config read until both clients have sent one, so the order
        // the requests arrive in cannot decide the test. A client queue that
        // blocked the other client would leave one read waiting: give up after 1 s.
        let arrived = 0;
        let release!: () => void;
        const bothRead = new Promise<void>((resolve) => (release = resolve));
        const giveUp = setTimeout(release, 1000);
        gateway.holdReply = async (envelope) => {
            if (envelope.filestore?.readFileRequest && ++arrived === 2) {
                release();
            }
            if (envelope.filestore?.readFileRequest) {
                await bothRead;
            }
        };
        const first = client.write_config({ a: 1 });
        const second = other.write_config({ b: 2 });
        await Promise.allSettled([first, second]);
        clearTimeout(giveUp);
        other.close();
        expect(gateway.posts.slice(reads, reads + 2).every((post) => post.envelope.filestore?.readFileRequest)).toBe(true);
    });

    it("sends the original hash", async () => {
        const hash = setConfig({ site_info: { backup_reserve_percent: 24 } });

        await client.write_config({ "site_info.backup_reserve_percent": 30 });

        expect(gateway.configWrites).toHaveLength(1);
        expect(gateway.configWrites[0].hash).toEqual(hash);
        const update = gateway.posts[1].envelope.filestore?.updateFileRequest;
        expect(update).toMatchObject({ domain: 1, file: { name: "config.json" } });
        expect(gateway.posts[1].envelope).toMatchObject({ deliveryChannel: 2, sender: { authorizedClient: 1 } });
    });

    it("keeps unknown keys", async () => {
        setConfig({ mystery: { deep: [1, 2] }, site_info: { other: "kept", backup_reserve_percent: 24 } });

        await client.write_config({ "site_info.backup_reserve_percent": 30 });

        expect(gateway.configJson).toEqual({
            mystery: { deep: [1, 2] },
            site_info: { other: "kept", backup_reserve_percent: 30 },
        });
    });

    it("creates missing steps and replaces a step that is not an object", async () => {
        setConfig({ a: 5 });
        await client.write_config({ "a.b.c": 1, "d.e": 2 });
        expect(gateway.configJson).toEqual({ a: { b: { c: 1 } }, d: { e: 2 } });
    });

    it("does not write through the prototype chain", async () => {
        setConfig({});
        await client.write_config({ "__proto__.polluted": true });
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("rejects a config that is not JSON and sends no update", async () => {
        gateway.config = Buffer.from("not json");
        await expect(client.write_config({ a: 1 })).rejects.toBeInstanceOf(PowerwallProtocolError);
        expect(gateway.posts).toHaveLength(1);
    });

    it("rejects an update reply with no filestore", async () => {
        const { blob, hash } = { blob: gateway.config, hash: crypto.createHash("sha256").update(gateway.config).digest() };
        gateway.reply(
            { envelope: { filestore: { readFileResponse: { file: { name: "config.json", blob }, hash } } } },
            { envelope: { common: {} } },
        );
        await expect(client.write_config({ a: 1 })).rejects.toThrow("missing filestore");
    });

    it("rejects a read reply with no filestore and sends no update", async () => {
        gateway.reply({ envelope: { common: {} } });
        await expect(client.write_config({ a: 1 })).rejects.toThrow("missing filestore");
        expect(gateway.posts).toHaveLength(1);
    });

    it("surfaces a hash the gateway refused as a protocol failure", async () => {
        const blob = gateway.config;
        gateway.reply({
            envelope: { filestore: { readFileResponse: { file: { name: "config.json", blob }, hash: Buffer.from("stale") } } },
        });
        await expect(client.write_config({ a: 1 })).rejects.toBeInstanceOf(PowerwallProtocolError);
        expect(gateway.configWrites).toHaveLength(0);
    });
});

describe("setters", () => {
    it("scales set_backup_reserve", async () => {
        await client.set_backup_reserve(20);
        expect(gateway.configJson.site_info.backup_reserve_percent).toBe(24);
    });

    it("writes set_backup_reserve_raw verbatim", async () => {
        await client.set_backup_reserve_raw(24.5);
        expect(gateway.configJson.site_info.backup_reserve_percent).toBe(24.5);
    });

    it.each(OPERATION_MODES)("sets operation mode %s", async (mode) => {
        await client.set_operation_mode(mode);
        expect(gateway.configJson.default_real_mode).toBe(mode);
    });

    it("sets the TOU mode", async () => {
        await client.set_tou_mode("economic");
        expect(gateway.configJson.strategy.TOU_mode).toBe("economic");
    });

    it.each(GRID_EXPORT_RULES)("sets export rule %s", async (rule) => {
        await client.set_export_rule(rule);
        expect(gateway.configJson.site_info.customer_preferred_export_rule).toBe(rule);
    });

    it.each([
        [true, false],
        [false, true],
    ])("set_grid_charging(%s) writes the inverse flag", async (enabled, disallow) => {
        await client.set_grid_charging(enabled);
        expect(gateway.configJson.site_info.disallow_charge_from_grid_with_solar_installed).toBe(disallow);
    });

    it("writes both grid settings in one write", async () => {
        await client.set_grid_import_export({
            customer_preferred_export_rule: "battery_ok",
            disallow_charge_from_grid_with_solar_installed: true,
        });
        expect(gateway.configWrites).toHaveLength(1);
        expect(gateway.configJson.site_info).toMatchObject({
            customer_preferred_export_rule: "battery_ok",
            disallow_charge_from_grid_with_solar_installed: true,
        });
    });

    it.each([true, false])("sets on-grid curtailment to %s", async (enabled) => {
        await client.set_on_grid_solar_curtailment(enabled);
        expect(gateway.configJson.site_info.on_grid_solar_curtailment_enabled).toBe(enabled);
    });

    it("sets the import limit as given", async () => {
        await client.set_import_limit(14.5);
        expect(gateway.configJson.site_info.max_site_meter_power_ac).toBe(14.5);
    });

    it("writes the export limit negative", async () => {
        await client.set_export_limit(2.5);
        expect(gateway.configJson.site_info.min_site_meter_power_ac).toBe(-2.5);
    });

    it("does not write a negative zero", async () => {
        await client.set_export_limit(0);
        expect(gateway.configJson.site_info.min_site_meter_power_ac).toBe(0);
    });
});

describe("validation happens before any request", () => {
    it.each<[string, () => Promise<unknown>, ErrorConstructor]>([
        ["set_backup_reserve 101", () => client.set_backup_reserve(101), RangeError],
        ["set_backup_reserve_raw -1", () => client.set_backup_reserve_raw(-1), RangeError],
        ["set_backup_reserve_raw NaN", () => client.set_backup_reserve_raw(Number.NaN), RangeError],
        ["set_operation_mode", () => client.set_operation_mode("turbo"), RangeError],
        ["set_tou_mode empty", () => client.set_tou_mode(""), RangeError],
        ["set_tou_mode type", () => client.set_tou_mode(1 as unknown as string), TypeError],
        ["set_export_rule", () => client.set_export_rule("Battery_Ok"), RangeError],
        ["set_grid_import_export", () => client.set_grid_import_export({}), TypeError],
        ["set_import_limit", () => client.set_import_limit(-1), RangeError],
        ["set_export_limit", () => client.set_export_limit(-1), RangeError],
        ["set_export_limit NaN", () => client.set_export_limit(Number.NaN), RangeError],
        ["curtail", () => client.curtail({ reserve_percent: 101 }), RangeError],
        ["set_import_limit Infinity", () => client.set_import_limit(Number.POSITIVE_INFINITY), RangeError],
        ["set_export_limit Infinity", () => client.set_export_limit(Number.POSITIVE_INFINITY), RangeError],
        ["set_import_limit NaN", () => client.set_import_limit(Number.NaN), RangeError],
        ["set_import_limit string", () => client.set_import_limit("5" as unknown as number), TypeError],
        ["set_backup_reserve Infinity", () => client.set_backup_reserve(Number.POSITIVE_INFINITY), RangeError],
        ["set_backup_reserve_raw Infinity", () => client.set_backup_reserve_raw(Number.POSITIVE_INFINITY), RangeError],
        ["curtail Infinity", () => client.curtail({ reserve_percent: Number.POSITIVE_INFINITY }), RangeError],
        ["curtail NaN", () => client.curtail({ reserve_percent: Number.NaN }), RangeError],
        ["schedule_max_backup Infinity", () => client.schedule_max_backup(Number.POSITIVE_INFINITY), RangeError],
        ["delay_battery_calibration Infinity", () => client.delay_battery_calibration(Number.POSITIVE_INFINITY), RangeError],
        ["write_config Infinity", () => client.write_config({ "site_info.limit": Number.POSITIVE_INFINITY }), RangeError],
        ["write_config NaN", () => client.write_config({ limit: Number.NaN }), RangeError],
        ["write_config nested", () => client.write_config({ a: { b: [1, Number.NEGATIVE_INFINITY] } }), RangeError],
    ])("%s", async (_name, call, error) => {
        await expect(call()).rejects.toBeInstanceOf(error);
        expect(gateway.logins).toHaveLength(0);
        expect(gateway.posts).toHaveLength(0);
    });
});

describe("curtail", () => {
    it("saves the mode and reserve, then writes backup at a raw reserve", async () => {
        setConfig({ default_real_mode: "autonomous", site_info: { backup_reserve_percent: 24 } });

        await client.curtail();

        expect(client.curtailment_active).toBe(true);
        expect(gateway.configJson).toMatchObject({
            default_real_mode: "backup",
            site_info: { backup_reserve_percent: 100 },
        });
    });

    it("keeps a fractional reserve across a restore", async () => {
        setConfig({ default_real_mode: "autonomous", site_info: { backup_reserve_percent: 24.75 } });

        await client.curtail({ reserve_percent: 80 });
        expect(gateway.configJson.site_info.backup_reserve_percent).toBe(80);
        await client.restore_from_curtailment();

        expect(client.curtailment_active).toBe(false);
        expect(gateway.configJson).toMatchObject({
            default_real_mode: "autonomous",
            site_info: { backup_reserve_percent: 24.75 },
        });
    });

    it.each([[{}], [{ site_info: "nope" }], [{ site_info: { backup_reserve_percent: "x" } }]])(
        "falls back to self_consumption at 5 with %j",
        async (config) => {
            setConfig(config);
            await client.curtail();
            await client.restore_from_curtailment();
            expect(gateway.configJson).toMatchObject({
                default_real_mode: "self_consumption",
                site_info: { backup_reserve_percent: 5 },
            });
        },
    );

    it("restores defaults when curtail never ran", async () => {
        await client.restore_from_curtailment();
        expect(gateway.configJson).toMatchObject({
            default_real_mode: "self_consumption",
            site_info: { backup_reserve_percent: 5 },
        });
    });

    it("restores the original values after a second curtail", async () => {
        setConfig({ default_real_mode: "autonomous", site_info: { backup_reserve_percent: 24 } });

        await client.curtail();
        await client.curtail({ reserve_percent: 80 });
        expect(gateway.configJson.site_info.backup_reserve_percent).toBe(80);
        await client.restore_from_curtailment();

        expect(gateway.configJson).toMatchObject({
            default_real_mode: "autonomous",
            site_info: { backup_reserve_percent: 24 },
        });
    });

    it("saves afresh once restored", async () => {
        setConfig({ default_real_mode: "autonomous", site_info: { backup_reserve_percent: 24 } });
        await client.curtail();
        await client.restore_from_curtailment();
        setConfig({ default_real_mode: "self_consumption", site_info: { backup_reserve_percent: 50 } });

        await client.curtail();
        await client.restore_from_curtailment();

        expect(gateway.configJson).toMatchObject({
            default_real_mode: "self_consumption",
            site_info: { backup_reserve_percent: 50 },
        });
    });

    it("stays inactive when the write fails", async () => {
        gateway.forceStatus("/tedapi/v1r", 500);
        await expect(client.curtail()).rejects.toBeInstanceOf(PowerwallProtocolError);
        expect(client.curtailment_active).toBe(false);
    });
});

describe("gateway refusals", () => {
    it("is a protocol error, not a command error, when the update is refused without filestore", async () => {
        const hash = crypto.createHash("sha256").update(gateway.config).digest();
        const blob = gateway.config;
        gateway.reply(
            { envelope: { filestore: { readFileResponse: { file: { name: "config.json", blob }, hash } } } },
            { envelope: { common: { errorResponse: { status: { code: 10, message: "busy" } } } } },
        );
        const error = await client.write_config({ a: 1 }).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(PowerwallProtocolError);
        expect(error).not.toBeInstanceOf(PowerwallCommandError);
    });
});
