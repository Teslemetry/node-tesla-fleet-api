// The read-only check runs on a real home's gateway, so what it must never do is
// tested three ways: its source names no write and cannot reach around its
// read-only types; at run time every write method is a trap; and on the wire the
// fake gateway sees only reads. Every list here is an allowlist, so a method added
// to the client later counts as a write until someone says otherwise.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { run_readonly_check } from "../../scripts/powerwall-readonly-check.js";
import { PowerwallClient } from "../../src/powerwall/client.js";
import { PowerwallEnergySite } from "../../src/powerwall/energysite.js";
import { GATEWAY_PASSWORD, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

const SCRIPT_PATH = fileURLToPath(new URL("../../scripts/powerwall-readonly-check.ts", import.meta.url));
const SCRIPT = readFileSync(SCRIPT_PATH, "utf8");

/** What the script may touch. Stated here, separately from the script's own list. */
const READS = new Set([
    "connect",
    "close",
    "host",
    "din",
    "curtailment_active",
    "get_din",
    "get_meters_aggregates",
    "get_battery_soe",
    "get_battery_soe_raw",
    "get_grid_status",
    "get_config",
    "get_status",
    "get_device_controller",
    "get_components",
    "get_firmware_details",
    "get_backup_events",
    "get_battery_calibration_delay_status",
    "get_controllable_device_programs",
    "list_authorized_clients",
    "find_authorized_clients",
    "live_status",
    "local_config",
]);

function members(prototype: object): string[] {
    return Object.getOwnPropertyNames(prototype).filter((name) => name !== "constructor");
}

/** Every member of both classes that is not a stated read, getters and seams included. */
const FORBIDDEN = [...members(PowerwallClient.prototype), ...members(PowerwallEnergySite.prototype)].filter(
    (name) => !READS.has(name),
);

/** Names that reach a method without naming it, or load code the imports below do not show. */
const ESCAPES = new Set([
    "constructor",
    "eval",
    "Function",
    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
    "getOwnPropertyNames",
    "getPrototypeOf",
    "globalThis",
    "prototype",
    "Proxy",
    "Reflect",
    "require",
    "__proto__",
]);

const ALLOWED_IMPORTS = new Set([
    "node:crypto",
    "node:fs",
    "node:fs/promises",
    "node:timers/promises",
    "node:tls",
    "node:url",
    "../src/powerwall/index.js",
]);

/** Every way this source could reach past its read-only types. Empty means none. */
function violations(source: string): string[] {
    const found: string[] = [];
    const file = ts.createSourceFile("check.ts", source, ts.ScriptTarget.ES2022, true);
    const forbiddenText = new RegExp(`\\b(${FORBIDDEN.join("|")})\\b`);
    const visit = (node: ts.Node): void => {
        if (ts.isImportDeclaration(node)) {
            const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
            if (!ALLOWED_IMPORTS.has(specifier)) {
                found.push(`import ${specifier}`);
            }
            return; // Its specifier holds the word `powerwall`, which is not the getter.
        }
        if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) {
            if (FORBIDDEN.includes(node.text) || ESCAPES.has(node.text)) {
                found.push(`name ${node.text}`);
            }
        } else if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddleOrTemplateTail(node)) {
            if (forbiddenText.test(node.text)) {
                found.push(`text ${node.text}`);
            }
        } else if (ts.isElementAccessExpression(node) && !ts.isNumericLiteral(node.argumentExpression)) {
            found.push(`computed access ${node.getText()}`);
        } else if (node.kind === ts.SyntaxKind.ImportKeyword) {
            found.push("dynamic import");
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    return found;
}

describe("docs/powerwall.md", () => {
    const docs = readFileSync(new URL("../../docs/powerwall.md", import.meta.url), "utf8");
    const table = docs.slice(docs.indexOf("## Writes"), docs.indexOf("## The read-only check"));

    it("says the writes are unverified", () => {
        expect(table).toContain("not yet verified from Node on hardware");
    });

    it("lists every write", () => {
        const writes = FORBIDDEN.filter(
            (name) => !name.startsWith("_") && name !== "powerwall",
        );
        expect(writes.length).toBeGreaterThan(25);
        expect(writes.filter((name) => !table.includes(`\`${name}\``))).toEqual([]);
    });
});

describe("the script's source", () => {
    it("has a meaningful list of forbidden methods", () => {
        for (const name of [
            "write_config",
            "set_backup_reserve",
            "set_operation_mode",
            "dispatch_battery_power",
            "set_island_mode",
            "go_off_grid",
            "trigger_islanding",
            "remove_authorized_client",
            "operation",
            "backup",
            "powerwall",
            "_post",
            "_send_command_request",
        ]) {
            expect(FORBIDDEN).toContain(name);
        }
    });

    it("has no path to anything but a read", () => {
        expect(violations(SCRIPT)).toEqual([]);
    });

    it("types its client and site to reads only, in a file CI compiles", () => {
        const picked = [...SCRIPT.matchAll(/\| "(\w+)"/g)].map((match) => match[1]);
        expect(picked.length).toBeGreaterThan(10);
        expect(picked.filter((name) => !READS.has(name))).toEqual([]);
        const tsconfig = JSON.parse(readFileSync(new URL("../../tsconfig.test.json", import.meta.url), "utf8"));
        expect(tsconfig.include).toContain("scripts/*.ts");
    });

    it.each([
        ["a direct call", 'await client.set_backup_reserve(20);'],
        ["a cast", '(client as any).write_config({});'],
        ["a site command", 'await site.go_off_grid();'],
        ["the getter", 'site.powerwall;'],
        ["a computed name", 'client["set_" + "island_mode"]();'],
        ["a dynamic import", 'await import("../src/powerwall/client.js");'],
        ["a prototype walk", "Object.getPrototypeOf(client);"],
        ["another module", 'import { go } from "../src/commands.js";'],
        ["a name in a string", 'const name = "trigger_islanding";'],
    ])("catches %s added to it", (_name, line) => {
        expect(violations(`${SCRIPT}\n${line}\n`)).not.toEqual([]);
    });
});

/** A value the fake gateway holds. Nothing containing it may be printed. */
const MARKER = "MARKER";
const MARKER_NUMBER = 987654.321;

function requestsIn(envelope: MessageEnvelope): string[] {
    return (["common", "teg", "filestore", "graphql", "authorization"] as const).flatMap((category) =>
        Object.entries(envelope[category] ?? {})
            .filter(([, value]) => value !== undefined)
            .map(([name]) => `${category}.${name}`),
    );
}

const READ_REQUESTS = [
    "authorization.listAuthorizedClientsRequest",
    "common.getSystemInfoRequest",
    "filestore.readFileRequest",
    "graphql.queryRequest",
    "teg.getBackupEventsRequest",
    "teg.getControllableDeviceProgramsRequest",
    "teg.getDelayBatteryCalibrationStatusRequest",
];

describe("a run against the fake gateway", () => {
    let directory: string;
    let gateway: FakeGateway;
    let env: NodeJS.ProcessEnv;
    let lines: string[];
    let sleeps: number[];
    let publicKey: Buffer;
    let config: Buffer;

    function run(onSleep?: (milliseconds: number) => void): Promise<number> {
        return run_readonly_check(env, {
            print: (line) => lines.push(line),
            sleep: async (milliseconds) => {
                sleeps.push(milliseconds);
                onSleep?.(milliseconds);
            },
        });
    }

    const output = (): string => lines.join("\n");

    beforeEach(async () => {
        directory = mkdtempSync(join(tmpdir(), "powerwall-check-"));
        writeFileSync(join(directory, "password"), `${GATEWAY_PASSWORD}\n`);
        writeFileSync(join(directory, "key"), TEST_KEY_PEM);
        publicKey = crypto.createPublicKey(TEST_KEY_PEM).export({ type: "pkcs1", format: "der" }) as Buffer;

        gateway = await FakeGateway.start({ din: `${MARKER}-00-E--TG000000000000` });
        config = Buffer.from(
            JSON.stringify({
                customer: { name: `${MARKER} customer` },
                site_info: { site_name: `${MARKER} site`, backup_reserve_percent: MARKER_NUMBER },
                battery_blocks: [{ din: `${MARKER}-block` }],
                default_real_mode: "self_consumption",
            }),
        );
        gateway.config = config;
        gateway.rest.set("/api/meters/aggregates", {
            site: { instant_power: MARKER_NUMBER, serial: MARKER },
            battery: { instant_power: MARKER_NUMBER },
            load: { instant_power: MARKER_NUMBER },
            solar: { instant_power: MARKER_NUMBER },
            [`${MARKER}-TG0000`]: { instant_power: 1 },
        });
        gateway.rest.set("/api/system_status/soe", { percentage: MARKER_NUMBER });
        gateway.rest.set("/api/system_status/grid_status", { grid_status: "SystemGridConnected" });
        gateway.graphql.DeviceControllerQuery = JSON.stringify({
            control: { systemStatus: { nominalEnergyRemainingWh: MARKER_NUMBER, nominalFullPackEnergyWh: 2 * MARKER_NUMBER } },
            vin: MARKER,
        });
        gateway.graphql.ComponentsQuery = JSON.stringify({ components: { bms: [{ serialNumber: MARKER }] } });
        gateway.systemInfo = {
            din: gateway.din,
            deviceId: { serialNumber: MARKER, partNumber: MARKER },
            firmwareVersion: { version: MARKER },
        };
        gateway.respond = (envelope) =>
            envelope.authorization?.listAuthorizedClientsRequest
                ? {
                      authorization: {
                          listAuthorizedClientsResponse: {
                              clients: [{ publicKey, state: 3, description: MARKER, identifier: MARKER }],
                          },
                      },
                  }
                : undefined;

        lines = [];
        sleeps = [];
        env = {
            POWERWALL_HOST: gateway.host,
            POWERWALL_PASSWORD_PATH: join(directory, "password"),
            POWERWALL_KEY_PATH: join(directory, "key"),
            POWERWALL_SOAK_TICKS: "3",
        };
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await gateway.stop();
        rmSync(directory, { recursive: true });
    });

    it("passes every step, in order", async () => {
        await expect(run()).resolves.toBe(0);
        expect(lines.filter((line) => line.startsWith("PASS")).map((line) => line.split(" ")[1])).toEqual(
            Array.from({ length: 12 }, (_, index) => `R${index + 1}`),
        );
        expect(lines.at(-1)).toMatch(/^DONE/);
    });

    it("waits 1 second between steps, and 5 seconds between soak reads", async () => {
        await run();
        expect(sleeps).toEqual([...Array(11).fill(1000), 5000, 5000]);
    });

    it("prints key names and types", async () => {
        await run();
        expect(output()).toContain("get_config {");
        expect(output()).toContain("site_info:object");
        expect(output()).toContain("get_grid_status string");
        expect(output()).toContain("get_battery_soe number");
        expect(output()).toContain("state:string");
    });

    it("prints no value the gateway holds, and no secret", async () => {
        await run();
        const text = output();
        expect(text).not.toContain(MARKER);
        expect(text).not.toContain(String(MARKER_NUMBER));
        expect(text).not.toContain("self_consumption");
        expect(text).not.toContain("SystemGridConnected");
        expect(text).not.toContain(gateway.din);
        expect(text).not.toContain(gateway.host);
        expect(text).not.toContain(gateway.host.split(":")[1]);
        expect(text).not.toContain(GATEWAY_PASSWORD);
        expect(text).not.toContain(GATEWAY_PASSWORD.slice(-5));
        expect(text).not.toContain(publicKey.toString("base64"));
        expect(text).not.toContain(directory);
    });

    it("masks a key that could be an identifier", async () => {
        await run();
        expect(output()).toContain("<key>:object");
    });

    it("prints no value when a step fails on a body it quotes", async () => {
        gateway.rest.set("/api/meters/aggregates", Buffer.from(`${MARKER} not json`));
        await expect(run()).resolves.toBe(1);
        expect(output()).toContain("FAIL R3 meters_soe_grid PowerwallProtocolError");
        expect(output()).not.toContain(MARKER);
    });

    it("stops at the first unexpected error and goes no further", async () => {
        gateway.rest.set("/api/meters/aggregates", Buffer.from("not json"));
        await expect(run()).resolves.toBe(1);
        expect(lines.at(-1)).toMatch(/^FAIL R3/);
        expect(lines.filter((line) => line.startsWith("PASS"))).toHaveLength(2);
        expect(gateway.posts).toEqual([]);
        expect(sleeps).toHaveLength(2);
    });

    it("fails R4 when the signature is refused", async () => {
        gateway.registeredKey = Buffer.from([1, 2, 3]);
        await expect(run()).resolves.toBe(1);
        expect(lines.at(-1)).toBe("FAIL R4 get_firmware_details PowerwallAuthenticationError");
    });

    it("fails R4 when the DIN differs from R2's, without printing either", async () => {
        gateway.systemInfo = { din: `${MARKER}-other` };
        await expect(run()).resolves.toBe(1);
        expect(lines.at(-1)).toBe("FAIL R4 get_firmware_details din differs from R2");
        expect(output()).not.toContain(MARKER);
    });

    it("fails R6 without site_info", async () => {
        gateway.config = Buffer.from("{}");
        await expect(run()).resolves.toBe(1);
        expect(lines.at(-1)).toBe("FAIL R6 get_config no site_info");
    });

    it.each([
        ["not listed", [], "FAIL R8 list_authorized_clients the signing key is not listed"],
        ["pending", [{ state: 2 }], "FAIL R8 list_authorized_clients the signing key is not VERIFIED"],
    ])("fails R8 when the key is %s", async (_name, clients, line) => {
        gateway.respond = (envelope) =>
            envelope.authorization?.listAuthorizedClientsRequest
                ? { authorization: { listAuthorizedClientsResponse: { clients: clients.map((client) => ({ publicKey, ...client })) } } }
                : undefined;
        await expect(run()).resolves.toBe(1);
        expect(lines.at(-1)).toBe(line);
    });

    it("passes R9 when the firmware does not implement it", async () => {
        const respond = gateway.respond;
        gateway.respond = (envelope) =>
            envelope.teg?.getDelayBatteryCalibrationStatusRequest
                ? { common: { errorResponse: { status: { code: 12, message: MARKER } } } }
                : respond?.(envelope);
        await expect(run()).resolves.toBe(0);
        expect(output()).toContain("get_battery_calibration_delay_status not supported");
    });

    it("counts resets and rate limits in R12 and carries on", async () => {
        let soakWaits = 0;
        const result = await run((milliseconds) => {
            if (milliseconds === 5000 && soakWaits++ === 0) {
                gateway.forceStatus("/api/meters/aggregates", 429);
            } else if (milliseconds === 5000) {
                gateway.reply({ dropConnection: true });
            }
        });
        expect(result).toBe(0);
        expect(output()).toContain("rate_limit_count 1");
        expect(output()).toContain("econnreset_count 1");
    });

    it("stops R12 on any other error", async () => {
        const result = await run((milliseconds) => {
            if (milliseconds === 5000) {
                gateway.forceStatus("/api/meters/aggregates", 500);
            }
        });
        expect(result).toBe(1);
        expect(lines.at(-1)).toBe("FAIL R12 live_status_soak PowerwallProtocolError");
        expect(sleeps.filter((milliseconds) => milliseconds === 5000)).toHaveLength(1);
    });

    describe("setup", () => {
        it("names each missing variable and reads nothing", async () => {
            env = {};
            await expect(run()).resolves.toBe(2);
            expect(lines).toEqual(["FAIL setup missing POWERWALL_HOST POWERWALL_PASSWORD_PATH POWERWALL_KEY_PATH"]);
        });

        it("prints no path for an unreadable file", async () => {
            env.POWERWALL_KEY_PATH = join(directory, "absent");
            await expect(run()).resolves.toBe(2);
            expect(output()).toContain("ENOENT");
            expect(output()).not.toContain(directory);
        });

        it("rejects a bad key before any request", async () => {
            writeFileSync(join(directory, "key"), MARKER);
            await expect(run()).resolves.toBe(2);
            expect(output()).toContain("PowerwallAuthenticationError");
            expect(output()).not.toContain(MARKER);
            expect(gateway.logins).toEqual([]);
        });

        it("rejects a bad soak length", async () => {
            env.POWERWALL_SOAK_TICKS = "0";
            await expect(run()).resolves.toBe(2);
        });

        it("runs as a script, through the package's runner", () => {
            let status: number | undefined;
            let stdout = "";
            try {
                execFileSync(process.execPath, ["--import", "tsx", SCRIPT_PATH], { env: {}, encoding: "utf8", stdio: "pipe" });
            } catch (error) {
                ({ status, stdout } = error as { status: number; stdout: string });
            }
            expect(status).toBe(2);
            expect(stdout).toContain("FAIL setup missing POWERWALL_HOST");
        }, 20_000);
    });

    describe("no write", () => {
        function trapWrites() {
            return [PowerwallClient.prototype, PowerwallEnergySite.prototype].flatMap((prototype) =>
                members(prototype)
                    .filter(
                        (name) =>
                            !READS.has(name) &&
                            // The shared request seams serve reads too. Everything that writes goes through a named method.
                            !name.startsWith("_") &&
                            typeof Object.getOwnPropertyDescriptor(prototype, name)?.value === "function",
                    )
                    .map((name) =>
                        vi.spyOn(prototype as any, name).mockImplementation(() => {
                            throw new Error(`reached ${name}`);
                        }),
                    ),
            );
        }

        it("traps every write: a call throws", () => {
            const traps = trapWrites();
            expect(traps.length).toBeGreaterThan(30);
            const client = new PowerwallClient({ host: gateway.host, gatewayPassword: GATEWAY_PASSWORD, rsaPrivateKeyPem: TEST_KEY_PEM });
            expect(() => client.set_backup_reserve(20)).toThrow("reached set_backup_reserve");
            expect(() => new PowerwallEnergySite(client).go_off_grid()).toThrow("reached go_off_grid");
        });

        it("reaches none of them in a full run", async () => {
            const traps = trapWrites();
            await expect(run()).resolves.toBe(0);
            for (const trap of traps) {
                expect(trap).not.toHaveBeenCalled();
            }
        });

        it("sends only reads on the wire and leaves config.json alone", async () => {
            await expect(run()).resolves.toBe(0);
            const sent = new Set(gateway.posts.flatMap((post) => requestsIn(post.envelope)));
            expect([...sent].sort()).toEqual(READ_REQUESTS);
            expect(gateway.configWrites).toEqual([]);
            expect(gateway.config).toEqual(config);
        });
    });
});
