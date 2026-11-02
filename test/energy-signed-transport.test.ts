import crypto from "node:crypto";
import { RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it, vi } from "vitest";
import { ENERGY_TEST_DIN as DIN, ENERGY_TEST_KEY_PEM } from "./fixtures/energy-signing.js";
import { UNSIGNED_DEVICE_COMMANDS } from "../src/energyspecific.js";
import { DeviceUnexpectedResponse, InvalidCommand, SignedCommandRequired } from "../src/exceptions.js";
import TeslaFleetApi from "../src/teslafleetapi.js";

const SITE_ID = 12345;
const TEST_KEY = crypto.createPrivateKey(ENERGY_TEST_KEY_PEM);

function makeApi(reply: unknown = { response: "AA==" }, status = 200) {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify(reply), { status, headers: { "Content-Type": "application/json" } }),
    );
    const api = new TeslaFleetApi({
        accessToken: "token",
        server: "https://fleet.test",
        fetch: fetchMock as unknown as typeof fetch,
    });
    return { api, fetchMock };
}

function sent(fetchMock: ReturnType<typeof makeApi>["fetchMock"]) {
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    return { path: new URL(url).pathname.slice(1), body: JSON.parse(init.body as string) };
}

function decoded(routable_message: string) {
    const message = RoutableMessage.decode(Buffer.from(routable_message, "base64"));
    return { message, envelope: MessageEnvelope.decode(message.protobufMessageAsBytes!) };
}

/** A `device_command` reply, shaped as captured live on 2026-10-29. */
function replyWith(envelope: MessageEnvelope) {
    return {
        response: {
            request_id: "546681d7ff2f1fd5c72a543415a8fe1f",
            message_envelope_as_bytes: Buffer.from(MessageEnvelope.encode(envelope).finish()).toString("base64"),
        },
    };
}

function errorReply(code: number, message: string) {
    return replyWith(MessageEnvelope.create({ common: { errorResponse: { status: { code, message } } } }));
}

describe("signing key argument", () => {
    it("requires the din with an explicit key", () => {
        expect(() => makeApi().api.energySites!.create(SITE_ID, TEST_KEY)).toThrow("requires the gateway din");
    });

    it("signs with an explicit key", () => {
        const site = makeApi().api.energySites!.create(SITE_ID, TEST_KEY, DIN);

        expect(site.din).toBe(DIN);
        expect(site.signing).toBe(true);
    });

    it("stays unsigned with no key anywhere", () => {
        expect(makeApi().api.energySites!.create(SITE_ID, undefined, DIN).signing).toBe(false);
    });

    it("never falls back to the parent's RSA key", async () => {
        const { api, fetchMock } = makeApi();
        api.rsa_private_key = TEST_KEY;
        const site = api.energySites!.create(SITE_ID, undefined, DIN);

        await site.get_teg_config();

        expect(site.signing).toBe(false);
        expect(sent(fetchMock)).toEqual({
            path: `api/1/energy_sites/${SITE_ID}/command`,
            body: {
                command_type: "grpc_command",
                command_properties: { message: { teg: { get_config_request: {} } }, identifier_type: 1 },
            },
        });
    });

    it("rejects a non-RSA key", () => {
        const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });

        expect(() => makeApi().api.energySites!.create(SITE_ID, privateKey, DIN)).toThrow(TypeError);
    });

    it("keeps the key off the site", () => {
        const site = makeApi().api.energySites!.create(SITE_ID, TEST_KEY, DIN);

        expect(Object.keys(site).sort()).toEqual(["din", "energy_site_id", "parent"]);
    });
});

describe("_command routing", () => {
    it("posts a signed message wrapped in data", async () => {
        const { api, fetchMock } = makeApi();
        const site = api.energySites!.create(SITE_ID, TEST_KEY, DIN);

        await site._command("teg", "set_island_mode_request", { mode: 6, force: true });

        const { path, body } = sent(fetchMock);
        expect(path).toBe(`api/1/energy_sites/${SITE_ID}/device_command`);
        // Tesla requires the body inside "data" and identifier_type as an int.
        expect(Object.keys(body)).toEqual(["data"]);
        expect(body.data.identifier_type).toBe(1);
        expect(body.data.target_id).toBe(DIN);
        expect(decoded(body.data.routable_message).envelope.teg?.setIslandModeRequest).toEqual({ mode: 6, force: true });
    });

    it("keeps the four pre-pairing reads unsigned with a key", async () => {
        for (const name of UNSIGNED_DEVICE_COMMANDS) {
            const [category, command] = name.split(".");
            const { api, fetchMock } = makeApi();

            await api.energySites!.create(SITE_ID, TEST_KEY, DIN)._command(category, command);

            const { path, body } = sent(fetchMock);
            expect(path).toBe(`api/1/energy_sites/${SITE_ID}/command`);
            expect(body).toEqual({
                command_type: "grpc_command",
                command_properties: { message: { [category]: { [command]: {} } }, identifier_type: 1 },
            });
        }
        expect(UNSIGNED_DEVICE_COMMANDS.size).toBe(4);
    });

    it("sends the unsigned form without a key", async () => {
        const { api, fetchMock } = makeApi();

        await api.energySites!.create(SITE_ID)._command("teg", "get_config_request");

        expect(sent(fetchMock).path).toBe(`api/1/energy_sites/${SITE_ID}/command`);
    });

    it("raises SignedCommandRequired from the signed path without a key, before any request", async () => {
        const { api, fetchMock } = makeApi();

        await expect(api.energySites!.create(SITE_ID)._signed_command("teg", "get_config_request")).rejects.toThrow(
            SignedCommandRequired,
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("signed replies", () => {
    function signedSite(reply: unknown, status = 200) {
        const { api, fetchMock } = makeApi(reply, status);
        return { site: api.energySites!.create(SITE_ID, TEST_KEY, DIN), fetchMock };
    }

    it("raises DeviceUnexpectedResponse on a device error inside HTTP 200", async () => {
        const { site } = signedSite(errorReply(11, "power 11000.000000 exceeds discharge limit 10000"));

        const error = await site._signed_command("teg", "get_config_request").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(DeviceUnexpectedResponse);
        expect((error as DeviceUnexpectedResponse).data).toEqual({
            code: 11,
            message: "power 11000.000000 exceeds discharge limit 10000",
        });
    });

    it("raises InvalidCommand on code 12", async () => {
        const { site } = signedSite(errorReply(12, ""));

        const error = await site._signed_command("teg", "get_config_request").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(InvalidCommand);
        expect((error as InvalidCommand).data).toEqual({ code: 12, message: "" });
    });

    it("returns an acknowledgement unchanged", async () => {
        const reply = replyWith(MessageEnvelope.create({ teg: { dispatchBatteryPowerResponse: {} } }));
        expect(reply.response.message_envelope_as_bytes).toBe("KgOyAgA=");
        const { site } = signedSite(reply);

        await expect(site._signed_command("teg", "get_config_request")).resolves.toEqual(reply);
    });

    it.each([
        ["no envelope", { response: {} }],
        ["a scalar response", { response: "AA==" }],
        ["a null response", { response: null }],
        ["a non-string envelope", { response: { message_envelope_as_bytes: 1 } }],
        ["non-base64 text", { response: { message_envelope_as_bytes: "not base64!" } }],
        ["undecodable bytes", { response: { message_envelope_as_bytes: "/////w==" } }],
    ])("leaves %s alone", async (_name, reply) => {
        const { site } = signedSite(reply);

        await expect(site._signed_command("teg", "get_config_request")).resolves.toEqual(reply);
    });

    it.each([
        ["a device refusal", errorReply(11, "no"), 200],
        ["a rate limit", { error: "too many" }, 429],
        ["a server error", { error: "boom" }, 500],
    ])("never retries after %s", async (_name, reply, status) => {
        const { site, fetchMock } = signedSite(reply, status);

        await expect(site._signed_command("teg", "get_config_request")).rejects.toThrow();

        expect(fetchMock).toHaveBeenCalledOnce();
    });

    it("never retries after a connection failure", async () => {
        const fetchMock = vi.fn(async () => {
            throw new TypeError("fetch failed");
        });
        const api = new TeslaFleetApi({
            accessToken: "token",
            server: "https://fleet.test",
            fetch: fetchMock as unknown as typeof fetch,
        });

        await expect(
            api.energySites!.create(SITE_ID, TEST_KEY, DIN)._signed_command("teg", "get_config_request"),
        ).rejects.toThrow();

        expect(fetchMock).toHaveBeenCalledOnce();
    });
});
