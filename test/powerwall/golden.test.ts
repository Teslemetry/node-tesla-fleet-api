// Document 09, section 3: envelopes from the real Python client, captured with
// this DIN and the clock frozen at 1800000000. Never regenerate them here.
import { readFileSync } from "node:fs";
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

describe("golden envelopes", () => {
    it.each<[string, (client: PowerwallClient) => Promise<unknown>]>([
        ["get_firmware_details", (pw) => pw.get_firmware_details()],
        ["get_config", (pw) => pw.get_config()],
        ["get_backup_events", (pw) => pw.get_backup_events()],
        ["list_authorized_clients", (pw) => pw.list_authorized_clients()],
        ["get_battery_calibration_delay_status", (pw) => pw.get_battery_calibration_delay_status()],
        ["get_controllable_device_programs", (pw) => pw.get_controllable_device_programs()],
    ])("%s", async (name, call) => {
        await call(client);
        expect(sent()).toEqual(GOLDEN[name]);
    });
});
