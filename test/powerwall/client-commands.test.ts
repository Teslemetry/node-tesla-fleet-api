// TEG commands. The fake gateway is the only target of these: a real gateway
// write belongs to the captain-present session, PW-16.
import { MessageFaultE } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PowerwallClient } from "../../src/powerwall/client.js";
import {
    PowerwallAuthenticationError,
    PowerwallCommandError,
    PowerwallConnectionError,
    PowerwallFaultError,
    PowerwallNotSupportedError,
    PowerwallProtocolError,
    PowerwallRateLimitError,
} from "../../src/powerwall/exceptions.js";
import { GATEWAY_DIN, GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
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

const errorReply = (code: number, message: string) => ({
    envelope: { common: { errorResponse: { status: { code, message } } } },
});

describe("schedule_max_backup", () => {
    it("cancels first, then carries maximum priority", async () => {
        const before = Math.floor(Date.now() / 1000);

        await client.schedule_max_backup(3600);

        expect(gateway.posts).toHaveLength(2);
        const [cancel, schedule] = gateway.posts.map((post) => post.envelope.teg);
        expect(cancel?.cancelManualBackupEventRequest).toBeDefined();
        const info = schedule?.scheduleManualBackupEventRequest?.schedulingInfo;
        expect(info?.priority).toBe("18446744073709551615");
        expect(info?.durationSeconds).toBe(3600);
        const start = (info?.startTime as Date).getTime();
        expect(start % 1000).toBe(0);
        expect(start / 1000).toBeGreaterThanOrEqual(before);
    });

    it("tolerates a cancel reply with nothing in it", async () => {
        gateway.reply({ envelope: { teg: {} } });
        await expect(client.schedule_max_backup()).resolves.toBeUndefined();
    });

    it("tolerates a refused cancel", async () => {
        gateway.reply(errorReply(5, "no active event"));
        await expect(client.schedule_max_backup()).resolves.toBeUndefined();
        expect(gateway.posts).toHaveLength(2);
    });

    it("does not schedule when the cancel faults", async () => {
        gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_BUSY });
        await expect(client.schedule_max_backup()).rejects.toBeInstanceOf(PowerwallFaultError);
        expect(gateway.posts).toHaveLength(1);
    });

    it("does not schedule when the cancel cannot reach the gateway", async () => {
        gateway.reply({ dropConnection: true });
        await expect(client.schedule_max_backup()).rejects.toBeInstanceOf(PowerwallConnectionError);
        expect(gateway.posts).toHaveLength(1);
    });

    it("raises when the schedule reply lacks its response", async () => {
        gateway.reply({ envelope: { teg: {} } }, { envelope: { teg: {} } });
        await expect(client.schedule_max_backup()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });
});

describe("cancel_max_backup tolerance", () => {
    it.each([
        ["a reply without the response", { envelope: { teg: {} } }],
        ["the no-active-event refusal", errorReply(5, "no active event")],
        ["an empty inner message", { noInner: true as const }],
    ])("swallows %s", async (_name, reply) => {
        gateway.reply(reply);
        await expect(client.cancel_max_backup()).resolves.toBeUndefined();
    });

    it.each([
        ["a BUSY fault", { fault: MessageFaultE.MESSAGEFAULT_ERROR_BUSY }, PowerwallFaultError],
        ["any other refusal", errorReply(7, "denied"), PowerwallCommandError],
        ["an unimplemented command", errorReply(12, "no"), PowerwallNotSupportedError],
        ["a reply of another kind", { envelope: { teg: { dispatchBatteryPowerResponse: {} } } }, PowerwallProtocolError],
    ])("raises on %s", async (_name, reply, error) => {
        gateway.reply(reply);
        await expect(client.cancel_max_backup()).rejects.toBeInstanceOf(error);
    });

    it("raises on a gateway 500", async () => {
        gateway.forceStatus("/tedapi/v1r", 500);
        await expect(client.cancel_max_backup()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("raises on a dead link", async () => {
        gateway.reply({ dropConnection: true });
        await expect(client.cancel_max_backup()).rejects.toBeInstanceOf(PowerwallConnectionError);
    });

    it.each([
        [429, PowerwallRateLimitError],
        [503, PowerwallRateLimitError],
        [401, PowerwallAuthenticationError],
    ])("raises on status %i", async (status, error) => {
        gateway.forceStatus("/tedapi/v1r", status);
        await expect(client.cancel_max_backup()).rejects.toBeInstanceOf(error);
    });

    it("raises on an unregistered key", async () => {
        gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID });
        await expect(client.cancel_max_backup()).rejects.toBeInstanceOf(PowerwallAuthenticationError);
    });

    it("raises on a reply that does not decode", async () => {
        gateway.reply({ inner: Buffer.from("ffffffff", "hex") });
        await expect(client.cancel_max_backup()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });
});

describe("dispatch_battery_power", () => {
    it.each([-500, 0, 3300, 1250.5])("sends real power %d", async (watts) => {
        await client.dispatch_battery_power(watts, 30);

        const { envelope } = gateway.posts[0];
        expect(envelope.recipient?.din).toBe(GATEWAY_DIN);
        const request = envelope.teg?.dispatchBatteryPowerRequest;
        expect(request?.resumeDeviceMode).toBeUndefined();
        expect(request?.realPower).toEqual({ powerWatts: watts, durationSeconds: 30 });
    });

    it.each([1, 86400])("accepts the duration bound %d", async (duration) => {
        await client.dispatch_battery_power(-500, duration);
        expect(gateway.posts[0].envelope.teg?.dispatchBatteryPowerRequest?.realPower?.durationSeconds).toBe(duration);
    });

    it("resumes with resume_device_mode", async () => {
        await client.resume_battery_operation();
        const request = gateway.posts[0].envelope.teg?.dispatchBatteryPowerRequest;
        expect(request?.resumeDeviceMode).toBeDefined();
        expect(request?.realPower).toBeUndefined();
    });

    it.each([
        ["dispatch", () => client.dispatch_battery_power(-500, 30)],
        ["resume", () => client.resume_battery_operation()],
    ])("%s raises when the ack is missing", async (_name, call) => {
        gateway.reply({ envelope: { teg: { cancelManualBackupEventResponse: {} } } });
        await expect(call()).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("raises a command error for code 11", async () => {
        gateway.reply(errorReply(11, "out of range"));

        const error = await client.dispatch_battery_power(11000, 30).catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(PowerwallCommandError);
        expect(error).not.toBeInstanceOf(PowerwallNotSupportedError);
        expect(error).toMatchObject({
            command: "dispatch_battery_power_request",
            code: 11,
            status_message: "out of range",
        });
    });

    it("raises not-supported for code 12", async () => {
        gateway.reply(errorReply(12, "not implemented"));
        await expect(client.dispatch_battery_power(500, 30)).rejects.toBeInstanceOf(PowerwallNotSupportedError);
    });
});

describe("delay_battery_calibration", () => {
    it("sends delay_hours", async () => {
        await client.delay_battery_calibration(24);
        expect(gateway.posts[0].envelope.teg?.delayBatteryCalibrationRequest?.delayHours).toBe(24);
    });

    it("raises when the ack is missing", async () => {
        gateway.reply({ envelope: { teg: { dispatchBatteryPowerResponse: {} } } });
        await expect(client.delay_battery_calibration(24)).rejects.toBeInstanceOf(PowerwallProtocolError);
    });
});

describe("configure_ocpp", () => {
    it("sends the URL", async () => {
        await client.configure_ocpp("wss://csms.example.invalid/ocpp");
        expect(gateway.posts[0].envelope.teg?.configureOcppRequest?.csmsBaseUrl).toBe("wss://csms.example.invalid/ocpp");
    });

    it("raises not-supported on code 12", async () => {
        gateway.reply(errorReply(12, "not implemented"));
        await expect(client.configure_ocpp("wss://csms.example.invalid/ocpp")).rejects.toMatchObject({
            name: "PowerwallNotSupportedError",
            command: "configure_ocpp_request",
            code: 12,
        });
    });
});

describe("remove_authorized_client", () => {
    const sentKey = () =>
        Buffer.from(gateway.posts[0].envelope.authorization?.removeAuthorizedClientRequest?.publicKey ?? []);

    it("sends raw DER bytes", async () => {
        await client.remove_authorized_client(Buffer.from([1, 2, 3]));
        expect(sentKey()).toEqual(Buffer.from([1, 2, 3]));
    });

    it("accepts base64 from the listing", async () => {
        await client.remove_authorized_client("AQID");
        expect(sentKey()).toEqual(Buffer.from([1, 2, 3]));
    });

    it("returns on an empty acknowledgement", async () => {
        gateway.reply({ envelope: { authorization: {} } });
        await expect(client.remove_authorized_client("AQID")).resolves.toBeUndefined();
    });

    it("propagates a dead link rather than reporting a removal", async () => {
        gateway.reply({ dropConnection: true });
        await expect(client.remove_authorized_client("AQID")).rejects.toBeInstanceOf(PowerwallConnectionError);
    });

    it("returns on an empty inner message", async () => {
        gateway.reply({ noInner: true });
        await expect(client.remove_authorized_client("AQID")).resolves.toBeUndefined();
    });

    it("raises on a BUSY fault: the key is still paired", async () => {
        gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_BUSY });
        await expect(client.remove_authorized_client("AQID")).rejects.toBeInstanceOf(PowerwallFaultError);
    });

    it("raises on a gateway 500", async () => {
        gateway.forceStatus("/tedapi/v1r", 500);
        await expect(client.remove_authorized_client("AQID")).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it.each([5, 7, 12])("raises on refusal code %i: only a cancel may ignore code 5", async (code) => {
        gateway.reply(errorReply(code, "refused"));
        await expect(client.remove_authorized_client("AQID")).rejects.toBeInstanceOf(PowerwallCommandError);
    });
});

describe("validation rejects before any request", () => {
    it.each<[string, () => Promise<unknown>, ErrorConstructor]>([
        ["NaN power", () => client.dispatch_battery_power(Number.NaN, 30), RangeError],
        ["infinite power", () => client.dispatch_battery_power(Number.POSITIVE_INFINITY, 30), RangeError],
        ["negative infinite power", () => client.dispatch_battery_power(Number.NEGATIVE_INFINITY, 30), RangeError],
        ["boolean power", () => client.dispatch_battery_power(true as unknown as number, 30), TypeError],
        ["string power", () => client.dispatch_battery_power("500" as unknown as number, 30), TypeError],
        ["zero duration", () => client.dispatch_battery_power(500, 0), RangeError],
        ["negative duration", () => client.dispatch_battery_power(500, -1), RangeError],
        ["long duration", () => client.dispatch_battery_power(500, 86401), RangeError],
        ["fractional duration", () => client.dispatch_battery_power(500, 1.5), RangeError],
        ["boolean duration", () => client.dispatch_battery_power(500, true as unknown as number), TypeError],
        ["zero delay", () => client.delay_battery_calibration(0), RangeError],
        ["negative delay", () => client.delay_battery_calibration(-1), RangeError],
        ["fractional delay", () => client.delay_battery_calibration(1.5), RangeError],
        ["huge delay", () => client.delay_battery_calibration(2 ** 32), RangeError],
        ["boolean delay", () => client.delay_battery_calibration(true as unknown as number), TypeError],
        ["string delay", () => client.delay_battery_calibration("24" as unknown as number), TypeError],
        ["short backup", () => client.schedule_max_backup(59), RangeError],
        ["fractional backup", () => client.schedule_max_backup(60.5), RangeError],
        ["empty OCPP URL", () => client.configure_ocpp(""), RangeError],
        ["empty key bytes", () => client.remove_authorized_client(Buffer.alloc(0)), RangeError],
        ["empty key string", () => client.remove_authorized_client(""), RangeError],
        ["null key", () => client.remove_authorized_client(null as unknown as string), TypeError],
    ])("%s", async (_name, call, error) => {
        await expect(call()).rejects.toBeInstanceOf(error);
        expect(gateway.logins).toHaveLength(0);
        expect(gateway.posts).toHaveLength(0);
    });
});
