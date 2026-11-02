import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageFaultE } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { PowerwallClient, type PowerwallClientOptions } from "../../src/powerwall/client.js";
import { PowerwallEnergySite } from "../../src/powerwall/energysite.js";
import {
    PowerwallAuthenticationError,
    PowerwallConnectionError,
    PowerwallFaultError,
    PowerwallKeyRejectedError,
    PowerwallRateLimitError,
} from "../../src/powerwall/exceptions.js";
import { connect_gateway, verify_local_gateway } from "../../src/powerwall/gateway.js";
import { EnergySiteRouter } from "../../src/router/index.js";
import { GATEWAY_DIN, GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

/** A port nothing listens on, so a connect fails at once. */
const DEAD_HOST = "127.0.0.1:1";

const clients: PowerwallClient[] = [];
const gateways: FakeGateway[] = [];

function options(host: string, overrides: Partial<PowerwallClientOptions> = {}): PowerwallClientOptions {
    return { host, gatewayPassword: GATEWAY_PASSWORD, rsaPrivateKeyPem: TEST_KEY_PEM, ...overrides };
}

function cloudAt(address: string | null) {
    return { find_gateway_address: vi.fn(async () => address) };
}

async function startGateway(...args: Parameters<typeof FakeGateway.start>): Promise<FakeGateway> {
    const gateway = await FakeGateway.start(...args);
    gateways.push(gateway);
    return gateway;
}

/** Records the client so `afterEach` closes it. */
function track<T extends { client: PowerwallClient }>(result: T): T {
    clients.push(result.client);
    return result;
}

afterEach(async () => {
    clients.splice(0).forEach((client) => client.close());
    await Promise.all(gateways.splice(0).map((gateway) => gateway.stop()));
});

describe("connect_gateway", () => {
    it("connects at the stored host without asking the cloud", async () => {
        const gateway = await startGateway();
        const cloud = cloudAt("192.0.2.1");
        const result = track(await connect_gateway({ client: options(gateway.host), cloud }));
        expect(result).toMatchObject({ host: gateway.host, outcome: "connected" });
        expect(result).not.toHaveProperty("error");
        expect(result.client.din).toBe(GATEWAY_DIN);
        expect(cloud.find_gateway_address).not.toHaveBeenCalled();
    });

    it.each([429, 503])("reports %i as rate_limited, keeping the client, and asks nobody", async (status) => {
        const gateway = await startGateway();
        gateway.forceStatus("/api/login/Basic", status);
        const cloud = cloudAt("192.0.2.1");
        const result = track(await connect_gateway({ client: options(gateway.host), cloud }));
        expect(result).toMatchObject({ host: gateway.host, outcome: "rate_limited" });
        expect(result.error).toBeInstanceOf(PowerwallRateLimitError);
        expect(result.client.host).toBe(gateway.host);
        expect(cloud.find_gateway_address).not.toHaveBeenCalled();
    });

    it("reports refused for a wrong password at the address the cloud confirms", async () => {
        const gateway = await startGateway();
        const cloud = cloudAt(gateway.host);
        const result = track(await connect_gateway({ client: options(gateway.host, { gatewayPassword: "wrong" }), cloud }));
        expect(result).toMatchObject({ host: gateway.host, outcome: "refused" });
        expect(result.error).toBeInstanceOf(PowerwallAuthenticationError);
        expect(result.client.host).toBe(gateway.host);
    });

    it("reports moved with a connected client at the new host", async () => {
        const gateway = await startGateway();
        const cloud = cloudAt(gateway.host);
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud }));
        expect(result).toMatchObject({ host: gateway.host, outcome: "moved" });
        expect(result).not.toHaveProperty("error");
        expect(result.client.host).toBe(gateway.host);
        expect(result.client.din).toBe(GATEWAY_DIN);
    });

    it("treats any error as a lead: a wrong device at the stored host", async () => {
        const stranger = await startGateway({ password: "other" });
        const gateway = await startGateway();
        const cloud = cloudAt(gateway.host);
        const result = track(await connect_gateway({ client: options(stranger.host), cloud }));
        expect(result).toMatchObject({ host: gateway.host, outcome: "moved" });
    });

    it("persists nothing for moved: it only reports the host", async () => {
        const gateway = await startGateway();
        const client = Object.freeze(options(DEAD_HOST));
        const result = track(await connect_gateway({ client, cloud: cloudAt(gateway.host) }));
        expect(result.outcome).toBe("moved");
        expect(client.host).toBe(DEAD_HOST);
        expect(gateway.configWrites).toEqual([]);
        expect(gateway.posts).toEqual([]);
    });

    it("carries the options to the new client", async () => {
        const gateway = await startGateway({ password: GATEWAY_PASSWORD });
        const legacy = { legacy_gateway: true, client: options(DEAD_HOST), cloud: cloudAt(gateway.host) };
        const result = track(await connect_gateway(legacy));
        expect(result.outcome).toBe("moved");
        expect(gateway.logins[0].password).toBe(GATEWAY_PASSWORD);
    });

    it("reports not_found when the cloud has no address", async () => {
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud: cloudAt(null) }));
        expect(result).toMatchObject({ host: DEAD_HOST, outcome: "not_found" });
        expect(result.error).toBeInstanceOf(PowerwallConnectionError);
        expect(result.client.host).toBe(DEAD_HOST);
    });

    it.each([
        ["an Error", new Error("cloud down")],
        ["a raw SDK body", { error: "nope" }],
    ])("counts a cloud lookup failure as null: %s", async (_name, failure) => {
        const cloud = { find_gateway_address: vi.fn(() => Promise.reject(failure)) };
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud }));
        expect(result.outcome).toBe("not_found");
        expect(result.error).toBeInstanceOf(PowerwallConnectionError);
    });

    it("counts a lookup that throws synchronously as null", async () => {
        const cloud = {
            find_gateway_address: () => {
                throw new TypeError("a plain JS caller's bug");
            },
        };
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud }));
        expect(result.outcome).toBe("not_found");
    });

    it("reports not_found when the confirmed address is simply unreachable", async () => {
        const cloud = cloudAt(DEAD_HOST);
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud }));
        expect(result).toMatchObject({ host: DEAD_HOST, outcome: "not_found" });
    });

    it("reports not_found, keeping the stale client, when the new host fails too", async () => {
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud: cloudAt("127.0.0.1:2") }));
        expect(result).toMatchObject({ host: DEAD_HOST, outcome: "not_found" });
        expect(result.client.host).toBe(DEAD_HOST);
        expect(result.error).toBeInstanceOf(PowerwallConnectionError);
    });

    it("reports not_found when the new host refuses the password", async () => {
        const gateway = await startGateway({ password: "other" });
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud: cloudAt(gateway.host) }));
        expect(result).toMatchObject({ host: DEAD_HOST, outcome: "not_found" });
    });

    it("rejects a bad PEM, which no address can repair", async () => {
        const client = options(DEAD_HOST, { rsaPrivateKeyPem: "not a key" });
        await expect(connect_gateway({ client, cloud: cloudAt(null) })).rejects.toBeInstanceOf(PowerwallAuthenticationError);
    });
});

describe("verify_local_gateway", () => {
    function verify(gateway: FakeGateway, overrides: Partial<PowerwallClientOptions> = {}) {
        const client = new PowerwallClient(options(gateway.host, overrides));
        clients.push(client);
        return verify_local_gateway(client);
    }

    /** Not the test key, so the gateway reports `UNKNOWN_KEY_ID`. */
    const OTHER_KEY = Buffer.from([1, 2, 3]);

    it("resolves when the password and key both work", async () => {
        const gateway = await startGateway();
        await expect(verify(gateway)).resolves.toBeUndefined();
        expect(gateway.posts).toHaveLength(1);
    });

    it("raises a plain PowerwallAuthenticationError for a wrong password, before any signed read", async () => {
        const gateway = await startGateway();
        const error = await verify(gateway, { gatewayPassword: "wrong" }).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(PowerwallAuthenticationError);
        expect(error).not.toBeInstanceOf(PowerwallKeyRejectedError);
        expect(gateway.posts).toEqual([]);
    });

    it("raises PowerwallKeyRejectedError for an unregistered key", async () => {
        const gateway = await startGateway({ registeredKey: OTHER_KEY });
        const error = await verify(gateway).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(PowerwallKeyRejectedError);
        expect(error).toBeInstanceOf(PowerwallAuthenticationError);
        expect((error as Error).cause).toBeInstanceOf(PowerwallAuthenticationError);
    });

    it("raises PowerwallKeyRejectedError for the 200 'authorization not verified' placeholder", async () => {
        const gateway = await startGateway();
        gateway.reply({ inner: Buffer.from("Authorization Not Verified") });
        await expect(verify(gateway)).rejects.toBeInstanceOf(PowerwallKeyRejectedError);
    });

    it("passes on any other error from the signed read", async () => {
        const gateway = await startGateway();
        gateway.reply({ dropConnection: true });
        await expect(verify(gateway)).rejects.toBeInstanceOf(PowerwallConnectionError);
    });

    it("does not call a fault a rejected key", async () => {
        const gateway = await startGateway();
        gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_TIME_EXPIRED });
        await expect(verify(gateway)).rejects.toBeInstanceOf(PowerwallFaultError);
    });

    it("passes on a connection failure at login", async () => {
        const client = new PowerwallClient(options(DEAD_HOST));
        clients.push(client);
        await expect(verify_local_gateway(client)).rejects.toBeInstanceOf(PowerwallConnectionError);
    });
});

/** A cloud site in document 02's table. Each method records the call and answers `cloud`. */
class CloudSite {
    readonly energy_site_id = 1234;
    readonly calls: unknown[][] = [];

    #record(name: string, args: unknown[]): Promise<{ response: string }> {
        this.calls.push([name, ...args]);
        return Promise.resolve({ response: "cloud" });
    }

    operation(mode: string) {
        return this.#record("operation", [mode]);
    }
    backup(percent: number) {
        return this.#record("backup", [percent]);
    }
    dispatch_battery_power(power_watts: number, duration_seconds: number) {
        return this.#record("dispatch_battery_power", [power_watts, duration_seconds]);
    }
    live_status() {
        return this.#record("live_status", []);
    }
    site_info() {
        return this.#record("site_info", []);
    }
    storm_mode(enabled: boolean) {
        return this.#record("storm_mode", [enabled]);
    }
    add_authorized_client(key: string) {
        return this.#record("add_authorized_client", [key]);
    }
}

describe("failover through EnergySiteRouter", () => {
    let gateway: FakeGateway;
    let client: PowerwallClient;
    let cloud: CloudSite;
    let router: EnergySiteRouter<readonly [PowerwallEnergySite, CloudSite]>;

    beforeEach(async () => {
        gateway = await startGateway();
        client = new PowerwallClient(options(gateway.host));
        clients.push(client);
        cloud = new CloudSite();
        router = new EnergySiteRouter([new PowerwallEnergySite(client), cloud]);
        await client.connect();
    });

    it("answers from the gateway when it can", async () => {
        await expect(router.dispatch_battery_power(500, 30)).resolves.toMatchObject({ response: { result: true } });
        expect(cloud.calls).toEqual([]);
    });

    it.each([
        ["a dropped connection", (): void => gateway.reply({ dropConnection: true })],
        ["429", (): void => gateway.forceStatus("/tedapi/v1r", 429)],
        ["503", (): void => gateway.forceStatus("/tedapi/v1r", 503)],
        ["401", (): void => gateway.forceStatus("/tedapi/v1r", 401)],
        ["403", (): void => gateway.forceStatus("/tedapi/v1r", 403)],
        ["an unregistered key", (): void => gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID })],
        ["the 200 refusal", (): void => gateway.reply({ inner: Buffer.from("authorization not verified") })],
    ])("fails over on %s, with the same arguments", async (_name, arrange) => {
        arrange();
        await expect(router.dispatch_battery_power(500, 30)).resolves.toEqual({ response: "cloud" });
        expect(cloud.calls).toEqual([["dispatch_battery_power", 500, 30]]);
    });

    it("fails over a read when the gateway is gone", async () => {
        await gateway.stop();
        gateways.length = 0;
        await expect(router.live_status()).resolves.toEqual({ response: "cloud" });
    });

    it.each([
        ["PowerwallCommandError", (): void => gateway.reply({ envelope: { common: { errorResponse: { status: { code: 11, message: "x" } } } } })],
        ["PowerwallNotSupportedError", (): void => gateway.reply({ envelope: { common: { errorResponse: { status: { code: 12, message: "x" } } } } })],
        ["PowerwallProtocolError", (): void => gateway.reply({ envelope: { teg: {} } })],
        ["PowerwallFaultError", (): void => gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_TIME_EXPIRED })],
    ])("propagates %s: the gateway answered, and the cloud reaches the same gateway", async (name, arrange) => {
        arrange();
        await expect(router.dispatch_battery_power(500, 30)).rejects.toMatchObject({ name });
        expect(cloud.calls).toEqual([]);
    });

    it("sends a method the local site lacks straight to the cloud", async () => {
        const posts = gateway.posts.length;
        await expect(router.site_info()).resolves.toEqual({ response: "cloud" });
        await expect(router.storm_mode(true)).resolves.toEqual({ response: "cloud" });
        await expect(router.add_authorized_client("key")).resolves.toEqual({ response: "cloud" });
        expect(gateway.posts).toHaveLength(posts);
        expect(gateway.gets.filter((get) => !get.path.endsWith("/din"))).toEqual([]);
    });

    it("sends a method only local has to the gateway, and fails rather than reach for a cloud", async () => {
        await expect(router.local_config()).resolves.toEqual({
            backup_reserve_percent: 20,
            default_real_mode: "self_consumption",
        });
        gateway.reply({ dropConnection: true });
        await expect(router.local_config()).rejects.toBeInstanceOf(PowerwallConnectionError);
    });

    it("routes around a stale client from connect_gateway, so the site degrades to cloud control", async () => {
        const result = track(await connect_gateway({ client: options(DEAD_HOST), cloud: cloudAt(null) }));
        expect(result.outcome).toBe("not_found");
        const degraded = new EnergySiteRouter([new PowerwallEnergySite(result.client), cloud]);
        await expect(degraded.operation("backup")).resolves.toEqual({ response: "cloud" });
        expect(cloud.calls).toEqual([["operation", "backup"]]);
    });
});
