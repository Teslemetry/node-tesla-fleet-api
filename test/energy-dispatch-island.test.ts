import crypto from "node:crypto";
import { RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it, vi } from "vitest";
import { ENERGY_TEST_DIN as DIN, ENERGY_TEST_KEY_PEM } from "./fixtures/energy-signing.js";
import { EnergyIslandMode } from "../src/const.js";
import EnergySpecific, { MAX_DISPATCH_DURATION_SECONDS } from "../src/energyspecific.js";
import { DeviceUnexpectedResponse, SignedCommandRequired } from "../src/exceptions.js";
import TeslaFleetApi from "../src/teslafleetapi.js";

const SITE_ID = 12345;
const TEST_KEY = crypto.createPrivateKey(ENERGY_TEST_KEY_PEM);

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

function grpcBody(leaf: Record<string, unknown>) {
    return {
        command_type: "grpc_command",
        command_properties: { message: { teg: { dispatch_battery_power_request: leaf } }, identifier_type: 1 },
    };
}

const INVALID_ARGS: [unknown, unknown, typeof RangeError | typeof TypeError][] = [
    [NaN, 60, RangeError],
    [Infinity, 60, RangeError],
    [-Infinity, 60, RangeError],
    [5000, 0, RangeError],
    [5000, -1, RangeError],
    [5000, MAX_DISPATCH_DURATION_SECONDS + 1, RangeError],
    [5000, 60.5, RangeError],
    [5000, NaN, RangeError],
    [5000, true, TypeError],
    [5000, "60", TypeError],
    [true, 60, TypeError],
    ["5000", 60, TypeError],
];

describe("dispatch_battery_power", () => {
    it("sends the real_power leaf unsigned without a key", async () => {
        const { site, fetchMock } = makeSite();

        await site.dispatch_battery_power(5000, 60);

        expect(sent(fetchMock)).toEqual({
            path: `api/1/energy_sites/${SITE_ID}/command`,
            body: grpcBody({ real_power: { power_watts: 5000, duration_seconds: 60 } }),
        });
    });

    it("takes a negative power to charge, up to the longest duration", async () => {
        const { site, fetchMock } = makeSite();

        await site.dispatch_battery_power(-2500.5, MAX_DISPATCH_DURATION_SECONDS);

        expect(sent(fetchMock).body).toEqual(
            grpcBody({ real_power: { power_watts: -2500.5, duration_seconds: 86400 } }),
        );
    });

    it("sends the resume_device_mode leaf", async () => {
        const { site, fetchMock } = makeSite();

        await site.resume_battery_operation();

        expect(sent(fetchMock).body).toEqual(grpcBody({ resume_device_mode: {} }));
    });

    it.each(INVALID_ARGS)("rejects (%s, %s) before any request", async (power, duration, errorClass) => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await expect(site.dispatch_battery_power(power as number, duration as number)).rejects.toThrow(errorClass);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("signs the setpoint with a key", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.dispatch_battery_power(-2000, 120);

        expect(signedEnvelope(fetchMock).teg?.dispatchBatteryPowerRequest).toEqual({
            realPower: { powerWatts: -2000, durationSeconds: 120 },
            resumeDeviceMode: undefined,
        });
    });

    it("signs the release with a key", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.resume_battery_operation();

        const request = signedEnvelope(fetchMock).teg?.dispatchBatteryPowerRequest;
        expect(request?.resumeDeviceMode).toEqual({});
        expect(request?.realPower).toBeUndefined();
    });

    it("raises the gateway's out-of-range refusal", async () => {
        const encoded = MessageEnvelope.encode(
            MessageEnvelope.create({ common: { errorResponse: { status: { code: 11, message: "over limit" } } } }),
        ).finish();
        const { site } = makeSite(TEST_KEY, {
            response: { message_envelope_as_bytes: Buffer.from(encoded).toString("base64") },
        });

        await expect(site.dispatch_battery_power(11000, 30)).rejects.toThrow(DeviceUnexpectedResponse);
    });
});

describe("island mode", () => {
    const ISLAND_CALLS: [string, (site: EnergySpecific) => Promise<unknown>][] = [
        ["set_island_mode", (s) => s.set_island_mode(EnergyIslandMode.OFF_GRID)],
        ["go_off_grid", (s) => s.go_off_grid()],
        ["reconnect_grid", (s) => s.reconnect_grid()],
    ];

    it.each(ISLAND_CALLS)("%s raises SignedCommandRequired without a key and sends nothing", async (_name, call) => {
        const { site, fetchMock } = makeSite();

        await expect(call(site)).rejects.toThrow(SignedCommandRequired);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(ISLAND_CALLS)("%s ignores a key on the parent", async (_name, call) => {
        const { site, fetchMock } = makeSite();
        site.parent.parent.rsa_private_key = TEST_KEY;
        site.din = DIN;

        await expect(call(site)).rejects.toThrow(SignedCommandRequired);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each(ISLAND_CALLS)("%s can never reach the unsigned grpc_command", async (_name, call) => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await call(site);

        expect(sent(fetchMock).body.command_type).toBeUndefined();
    });

    it("go_off_grid forces, and reconnect_grid does not", async () => {
        const off = makeSite(TEST_KEY);
        await off.site.go_off_grid();
        expect(signedEnvelope(off.fetchMock).teg?.setIslandModeRequest).toEqual({ mode: 6, force: true });

        const on = makeSite(TEST_KEY);
        await on.site.reconnect_grid();
        expect(signedEnvelope(on.fetchMock).teg?.setIslandModeRequest).toEqual({ mode: 1, force: false });
    });

    it("signs an explicit mode and force", async () => {
        const { site, fetchMock } = makeSite(TEST_KEY);

        await site.set_island_mode(EnergyIslandMode.OFF_GRID, false);

        expect(signedEnvelope(fetchMock).teg?.setIslandModeRequest).toEqual({ mode: 6, force: false });
    });
});
