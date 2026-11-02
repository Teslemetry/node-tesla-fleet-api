// Island commands. The fake gateway is the only target of these: no autonomous
// session sends one to a real gateway.
import { TEGSetIslandModeResult } from "@teslemetry/tesla-protocol/energy_device/teg_api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PowerwallClient } from "../../src/powerwall/client.js";
import {
    PowerwallCommandError,
    PowerwallConnectionError,
    PowerwallNotSupportedError,
    PowerwallProtocolError,
} from "../../src/powerwall/exceptions.js";
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

const islandReply = (result: number) => ({ envelope: { teg: { setIslandModeResponse: { result } } } });
const sentRequest = () => gateway.posts[0].envelope.teg?.setIslandModeRequest;

describe("set_island_mode", () => {
    it("sends mode 6 with force from go_off_grid", async () => {
        await client.go_off_grid();
        expect(sentRequest()).toEqual({ mode: 6, force: true });
    });

    it("lets go_off_grid drop force and name the mode", async () => {
        await client.go_off_grid({ force: false, mode_override: 6 });
        expect(sentRequest()).toEqual({ mode: 6, force: false });
    });

    it.each([0, 2, 3, 5, 7, 99, -1, 1.5, NaN, Infinity, "6", "1", true, false, {}, [6]])(
        "refuses mode_override %j before any request",
        async (mode) => {
            await expect(client.go_off_grid({ mode_override: mode as number })).rejects.toBeInstanceOf(TypeError);
            expect(gateway.logins).toHaveLength(0);
            expect(gateway.posts).toHaveLength(0);
        },
    );

    it.each([undefined, null, 1, "true"])("refuses off_grid %j: a missing mode has no default", async (off_grid) => {
        await expect(client.set_island_mode({ off_grid: off_grid as boolean })).rejects.toBeInstanceOf(TypeError);
        expect(gateway.posts).toHaveLength(0);
    });

    it.each([1, "true", {}])("refuses force %j", async (force) => {
        await expect(client.set_island_mode({ off_grid: true, force: force as boolean })).rejects.toBeInstanceOf(TypeError);
        expect(gateway.posts).toHaveLength(0);
    });

    it("sends mode 1 without force from reconnect_grid", async () => {
        await client.reconnect_grid();
        expect(sentRequest()).toEqual({ mode: 1, force: false });
    });

    it("defaults force to false", async () => {
        await client.set_island_mode({ off_grid: true });
        expect(sentRequest()).toEqual({ mode: 6, force: false });
    });

    it("uses a Command header", async () => {
        await client.go_off_grid();
        expect(gateway.posts[0].envelope).toMatchObject({ deliveryChannel: 2, sender: { authorizedClient: 1 } });
    });

    it.each([
        [2, "TEG_SET_ISLAND_MODE_RESULT_REJECTED_NOT_READY_FOR_ISLANDING"],
        [3, "TEG_SET_ISLAND_MODE_RESULT_REJECTED_LOAD_DROP_EXPECTED"],
        [4, "TEG_SET_ISLAND_MODE_RESULT_REJECTED_LOW_ENERGY"],
        [5, "TEG_SET_ISLAND_MODE_RESULT_REJECTED_EXCESSIVE_SOLAR"],
    ])("raises on result %i with its name", async (result, name) => {
        gateway.reply(islandReply(result));

        const error = await client.go_off_grid().catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(PowerwallCommandError);
        expect(error).toMatchObject({ command: "set_island_mode_request", code: result, status_message: name });
    });

    it.each([
        ["invalid", TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_INVALID],
        ["accepted", TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_ACCEPTED],
        ["unknown", 99],
    ])("returns on an %s result", async (_name, result) => {
        gateway.reply(islandReply(result));
        await expect(client.go_off_grid()).resolves.toBeUndefined();
    });

    it("returns when the field is absent", async () => {
        gateway.reply({ envelope: { teg: {} } });
        await expect(client.reconnect_grid()).resolves.toBeUndefined();
    });

    it("still raises on an empty inner message, which the transport rejects", async () => {
        gateway.reply({ noInner: true });
        await expect(client.reconnect_grid()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("returns on a reply that does not decode, as Python does", async () => {
        gateway.reply({ inner: Buffer.from("ffffffff", "hex") });
        await expect(client.reconnect_grid()).resolves.toBeUndefined();
    });

    it("raises on common.error_response", async () => {
        gateway.reply({ envelope: { common: { errorResponse: { status: { code: 7, message: "denied" } } } } });
        await expect(client.go_off_grid()).rejects.toMatchObject({
            name: "PowerwallCommandError",
            command: "set_island_mode_request",
            code: 7,
            status_message: "denied",
        });
    });

    it("raises a command error subclass on code 12", async () => {
        gateway.reply({ envelope: { common: { errorResponse: { status: { code: 12, message: "not implemented" } } } } });
        const error = await client.go_off_grid().catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(PowerwallNotSupportedError);
        expect(error).toBeInstanceOf(PowerwallCommandError);
    });

    it("raises on a dead link and does not resend", async () => {
        gateway.reply({ dropConnection: true });
        await expect(client.go_off_grid()).rejects.toBeInstanceOf(PowerwallConnectionError);
        expect(gateway.posts).toHaveLength(1);
    });

    it("logs the outcome at debug level, without the DIN", async () => {
        const debug = vi.fn();
        const logged = new PowerwallClient({
            host: gateway.host,
            gatewayPassword: GATEWAY_PASSWORD,
            rsaPrivateKeyPem: TEST_KEY_PEM,
            logger: { debug },
        });
        gateway.reply(islandReply(99));
        await logged.go_off_grid();
        logged.close();
        expect(debug).toHaveBeenCalledWith("set_island_mode: mode=6 force=true result=99");
    });
});

describe("trigger_islanding", () => {
    it("sends an empty black-start request", async () => {
        await client.trigger_islanding();
        expect(gateway.posts[0].envelope.teg?.triggerIslandingBlackStartRequest).toEqual({});
    });

    it("returns whatever comes back, as Python does", async () => {
        gateway.reply({ envelope: { teg: {} } }, { inner: Buffer.from("ffffffff", "hex") });
        await expect(client.trigger_islanding()).resolves.toBeUndefined();
        await expect(client.trigger_islanding()).resolves.toBeUndefined();
    });

    it("raises on common.error_response, unlike Python", async () => {
        gateway.reply({ envelope: { common: { errorResponse: { status: { code: 7, message: "denied" } } } } });
        await expect(client.trigger_islanding()).rejects.toBeInstanceOf(PowerwallCommandError);
    });
});
