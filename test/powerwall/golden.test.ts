// Document 09, section 3: envelopes from the real Python client, captured with
// this DIN and the clock frozen at 1800000000. Never regenerate them here.
import { readFileSync } from "node:fs";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PowerwallClient } from "../../src/powerwall/client.js";
import { GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

const GOLDEN: Record<string, string[]> = JSON.parse(
    readFileSync(new URL("../fixtures/powerwall-envelopes.json", import.meta.url), "utf8"),
);
const DIN = "1232100-00-E--TG000000000000";

let gateway: FakeGateway;
let client: PowerwallClient;

beforeEach(async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
    gateway = await FakeGateway.start({ din: DIN });
    client = new PowerwallClient({ host: gateway.host, gatewayPassword: GATEWAY_PASSWORD, rsaPrivateKeyPem: TEST_KEY_PEM });
});

afterEach(async () => {
    client.close();
    await gateway.stop();
    vi.restoreAllMocks();
});

function sent(): string[] {
    return gateway.posts.map((post) => post.envelopeBytes.toString("hex"));
}

describe("config writes", () => {
    it("matches Python's envelope, apart from Python's JSON spacing", async () => {
        const blob = '{"default_real_mode": "self_consumption", "site_info": {"backup_reserve_percent": 24.0}}';
        gateway.config = Buffer.from(blob);

        await client.set_backup_reserve(20);

        const [read, write] = GOLDEN.set_backup_reserve_20.map((hex) => MessageEnvelope.decode(Buffer.from(hex, "hex")));
        expect(sent()[0]).toBe(GOLDEN.set_backup_reserve_20[0]);
        expect(read.filestore?.readFileRequest).toBeDefined();

        // `json.dumps` writes `24.0` with spaces and `JSON.stringify` writes `24` without.
        const expected = write.filestore?.updateFileRequest;
        const actual = gateway.posts[1].envelope.filestore?.updateFileRequest;
        const blobText = (update: typeof actual) => JSON.parse(Buffer.from(update?.file?.blob ?? []).toString());
        expect(blobText(actual)).toEqual(blobText(expected));
        expect(actual?.domain).toBe(expected?.domain);
        expect(actual?.file?.name).toBe(expected?.file?.name);
        expect(Buffer.from(actual?.hash ?? []).toString("hex")).toBe(Buffer.from(expected?.hash ?? []).toString("hex"));
        expect(gateway.posts[1].envelope).toMatchObject({
            deliveryChannel: write.deliveryChannel,
            sender: write.sender,
            recipient: { din: DIN },
        });
    });
});

describe("golden envelopes", () => {
    it.each<[string, (client: PowerwallClient) => Promise<unknown>]>([
        ["get_firmware_details", (pw) => pw.get_firmware_details()],
        ["get_config", (pw) => pw.get_config()],
        ["get_backup_events", (pw) => pw.get_backup_events()],
        ["list_authorized_clients", (pw) => pw.list_authorized_clients()],
        ["get_battery_calibration_delay_status", (pw) => pw.get_battery_calibration_delay_status()],
        ["get_controllable_device_programs", (pw) => pw.get_controllable_device_programs()],
        ["dispatch_500W_30s", (pw) => pw.dispatch_battery_power(500, 30)],
        ["dispatch_-500W_30s", (pw) => pw.dispatch_battery_power(-500, 30)],
        ["resume", (pw) => pw.resume_battery_operation()],
        ["schedule_max_backup_7200", (pw) => pw.schedule_max_backup()],
        ["cancel_max_backup", (pw) => pw.cancel_max_backup()],
        ["remove_authorized_client", (pw) => pw.remove_authorized_client(Buffer.from([1, 2, 3]))],
        ["delay_battery_calibration_24", (pw) => pw.delay_battery_calibration(24)],
        ["configure_ocpp", (pw) => pw.configure_ocpp("wss://example.invalid/ocpp")],
    ])("%s", async (name, call) => {
        await call(client);
        expect(sent()).toEqual(GOLDEN[name]);
    });
});
