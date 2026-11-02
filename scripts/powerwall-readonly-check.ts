// Read-only check of a real gateway: steps R1 to R12 of document 09, section 4.1.
//
//   POWERWALL_HOST=<host> POWERWALL_PASSWORD_PATH=<file> POWERWALL_KEY_PATH=<file> \
//     pnpm powerwall:check
//
// Prints key names, types and pass or fail, never a value. DINs, serials and
// addresses stay on the runner. Waits 1 second between steps and stops at the
// first unexpected error. Exits 0 on a pass, 1 on a failed step, 2 on bad setup.
//
// Nothing here can change a gateway. The two `Pick` types below are the whole
// reachable surface, and `test/powerwall/readonly-check.test.ts` fails if this
// file names anything else, or reaches around those types.
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import { PowerwallClient, PowerwallEnergySite, PowerwallNotSupportedError, PowerwallRateLimitError } from "../src/powerwall/index.js";

type ReadOnlyClient = Pick<
    PowerwallClient,
    | "connect"
    | "close"
    | "get_meters_aggregates"
    | "get_battery_soe"
    | "get_grid_status"
    | "get_firmware_details"
    | "get_status"
    | "get_device_controller"
    | "get_components"
    | "get_config"
    | "get_backup_events"
    | "list_authorized_clients"
    | "get_battery_calibration_delay_status"
    | "get_controllable_device_programs"
>;
type ReadOnlySite = Pick<PowerwallEnergySite, "live_status" | "local_config">;

export type CheckDependencies = {
    print?: (line: string) => void;
    sleep?: (milliseconds: number) => Promise<unknown>;
};

const STEP_WAIT_MS = 1_000;
const SOAK_INTERVAL_MS = 5_000;
/** Ten minutes at the interval above. */
const DEFAULT_SOAK_TICKS = 120;

/** Document 08, section 4. */
const LIVE_STATUS_KEYS = [
    "backup_capable",
    "battery_power",
    "energy_left",
    "generator_power",
    "grid_power",
    "grid_services_active",
    "grid_services_power",
    "grid_status",
    "island_status",
    "load_power",
    "percentage_charged",
    "solar_power",
    "storm_mode_active",
    "timestamp",
    "total_pack_energy",
    "wall_connectors",
];
const LOCAL_CONFIG_KEYS = ["backup_reserve_percent", "default_real_mode"];

/** A pass condition that did not hold. */
class CheckFailed extends Error {
    override readonly name = "CheckFailed";
}

function check(condition: boolean, what: string): asserts condition {
    if (!condition) {
        throw new CheckFailed(what);
    }
}

function typeName(value: unknown): string {
    if (value === null) {
        return "null";
    }
    return Array.isArray(value) ? "array" : typeof value;
}

/** A key name, unless it could be an identifier: a DIN has dashes and a serial starts upper-case. */
function safeKey(key: string): string {
    return /^[a-z_][A-Za-z0-9_]{0,63}$/.test(key) ? key : "<key>";
}

/** Top-level key names and types, or the type alone for anything but an object. */
function shape(value: unknown): string {
    if (typeName(value) !== "object") {
        return typeName(value);
    }
    const entries = Object.entries(value as object).map(([key, item]) => `${safeKey(key)}:${typeName(item)}`);
    return `{${entries.sort().join(" ")}}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeName(value) === "object";
}

/** An error's class and system code. Its message can quote a reply body, so that is never printed. */
function describeError(error: unknown): string {
    const name = error instanceof Error ? error.name : typeName(error);
    const code = errorCode(error);
    return code ? `${name} ${code}` : name;
}

function errorCode(error: unknown): string | undefined {
    for (let current = error; isObject(current); current = current.cause) {
        const code = current.code;
        if (typeof code === "string" && /^[A-Z0-9_]+$/.test(code)) {
            return code;
        }
    }
    return undefined;
}

function tlsHandshake(host: string): Promise<void> {
    const { hostname, port } = new URL(`https://${host}`);
    return new Promise((resolve, reject) => {
        const socket = tls.connect(
            { host: hostname, port: Number(port || 443), rejectUnauthorized: false, ALPNProtocols: ["http/1.1"] },
            () => {
                socket.destroy();
                resolve();
            },
        );
        socket.setTimeout(5_000, () => socket.destroy(new CheckFailed("handshake timed out")));
        socket.on("error", reject);
    });
}

type Config = { host: string; gatewayPassword: string; rsaPrivateKeyPem: string; soakTicks: number };

/** Read the setup, or print what is wrong and return null. Only variable names are printed. */
async function loadConfig(env: NodeJS.ProcessEnv, print: (line: string) => void): Promise<Config | null> {
    const { POWERWALL_HOST: host, POWERWALL_PASSWORD_PATH: passwordPath, POWERWALL_KEY_PATH: keyPath, POWERWALL_SOAK_TICKS: ticks } = env;
    if (!host || !passwordPath || !keyPath) {
        const required = { POWERWALL_HOST: host, POWERWALL_PASSWORD_PATH: passwordPath, POWERWALL_KEY_PATH: keyPath };
        const missing = Object.entries(required).filter(([, value]) => !value);
        print(`FAIL setup missing ${missing.map(([name]) => name).join(" ")}`);
        return null;
    }
    const soakTicks = ticks === undefined ? DEFAULT_SOAK_TICKS : Number(ticks);
    if (!Number.isInteger(soakTicks) || soakTicks < 1) {
        print("FAIL setup POWERWALL_SOAK_TICKS is not a positive integer");
        return null;
    }
    try {
        return {
            host,
            gatewayPassword: (await readFile(passwordPath, "utf8")).trim(),
            rsaPrivateKeyPem: await readFile(keyPath, "utf8"),
            soakTicks,
        };
    } catch (error) {
        print(`FAIL setup cannot read the password or key file: ${describeError(error)}`);
        return null;
    }
}

/** `show` takes what the gateway sent and prints only its shape. `note` takes text this file wrote. */
type Report = { show(label: string, value: unknown): void; note(label: string, text: string): void };

/** The steps, in order. Each throws to fail, and reports what it read. */
function buildSteps(
    client: ReadOnlyClient,
    site: ReadOnlySite,
    config: Config,
    signingKey: string,
    report: Report,
    sleep: (milliseconds: number) => Promise<unknown>,
): [string, () => Promise<void>][] {
    const { show, note } = report;
    let din = "";
    return [
        ["R1 tls_handshake", () => tlsHandshake(config.host)],
        [
            "R2 connect",
            async () => {
                din = await client.connect();
                check(typeof din === "string" && din.length > 0, "no DIN");
                show("din", din);
            },
        ],
        [
            "R3 meters_soe_grid",
            async () => {
                const meters = await client.get_meters_aggregates();
                const { battery, load, site: siteMeter, solar } = meters;
                check([battery, load, siteMeter, solar].every(isObject), "a meter is missing");
                show("get_meters_aggregates", meters);
                const soe = await client.get_battery_soe();
                check(typeof soe === "number", "state of energy is not a number");
                show("get_battery_soe", soe);
                const grid = await client.get_grid_status();
                check(typeof grid === "string", "grid status is not a string");
                show("get_grid_status", grid);
            },
        ],
        [
            "R4 get_firmware_details",
            async () => {
                const firmware = await client.get_firmware_details();
                show("get_firmware_details", firmware.system);
                check(firmware.system.din === din, "din differs from R2");
            },
        ],
        [
            "R5 status_controller_components",
            async () => {
                for (const [label, read] of [
                    ["get_status", () => client.get_status()],
                    ["get_device_controller", () => client.get_device_controller()],
                    ["get_components", () => client.get_components()],
                ] as const) {
                    const payload = await read();
                    check(isObject(payload), `${label} is not an object`);
                    show(label, payload);
                }
            },
        ],
        [
            "R6 get_config",
            async () => {
                const gatewayConfig = await client.get_config();
                show("get_config", gatewayConfig);
                check(isObject(gatewayConfig.site_info), "no site_info");
                check(Array.isArray(gatewayConfig.battery_blocks), "no battery_blocks");
            },
        ],
        [
            "R7 get_backup_events",
            async () => {
                const events = await client.get_backup_events();
                show("get_backup_events", events);
                check(Array.isArray(events.backup_events), "no event list");
            },
        ],
        [
            "R8 list_authorized_clients",
            async () => {
                const { clients } = await client.list_authorized_clients();
                const entry = clients.find((candidate) => candidate.public_key === signingKey);
                check(entry !== undefined, "the signing key is not listed");
                show("signing_key_entry", entry);
                check(entry.state === "VERIFIED", "the signing key is not VERIFIED");
            },
        ],
        [
            "R9 get_battery_calibration_delay_status",
            async () => {
                try {
                    show("get_battery_calibration_delay_status", await client.get_battery_calibration_delay_status());
                } catch (error) {
                    if (!(error instanceof PowerwallNotSupportedError)) {
                        throw error;
                    }
                    note("get_battery_calibration_delay_status", "not supported");
                }
            },
        ],
        [
            "R10 get_controllable_device_programs",
            async () => {
                const programs = await client.get_controllable_device_programs();
                show("get_controllable_device_programs", programs);
                check(Array.isArray(programs.active_programs), "no active list");
                check(Array.isArray(programs.inactive_programs), "no inactive list");
            },
        ],
        [
            "R11 live_status_local_config",
            async () => {
                const { response } = await site.live_status();
                show("live_status", response);
                check(Object.keys(response).sort().join() === LIVE_STATUS_KEYS.join(), "live_status keys differ from document 08");
                const local = await site.local_config();
                show("local_config", local);
                check(Object.keys(local).every((key) => LOCAL_CONFIG_KEYS.includes(key)), "local_config has an unknown key");
            },
        ],
        [
            "R12 live_status_soak",
            async () => {
                let resets = 0;
                let rateLimits = 0;
                for (let tick = 0; tick < config.soakTicks; tick++) {
                    if (tick > 0) {
                        await sleep(SOAK_INTERVAL_MS);
                    }
                    try {
                        await site.live_status();
                    } catch (error) {
                        if (error instanceof PowerwallRateLimitError) {
                            rateLimits++;
                        } else if (errorCode(error) === "ECONNRESET") {
                            resets++;
                        } else {
                            throw error;
                        }
                    }
                }
                note("econnreset_count", String(resets));
                note("rate_limit_count", String(rateLimits));
            },
        ],
    ];
}

/** The two read-only views. The full classes are named nowhere else. */
function open(config: Config): { client: ReadOnlyClient; site: ReadOnlySite } {
    const client = new PowerwallClient({
        host: config.host,
        gatewayPassword: config.gatewayPassword,
        rsaPrivateKeyPem: config.rsaPrivateKeyPem,
    });
    return { client, site: new PowerwallEnergySite(client) };
}

/** Run the steps and return the exit code. */
export async function run_readonly_check(env: NodeJS.ProcessEnv, dependencies: CheckDependencies = {}): Promise<number> {
    const print = dependencies.print ?? console.log;
    const sleep = dependencies.sleep ?? delay;

    const config = await loadConfig(env, print);
    if (config === null) {
        return 2;
    }
    let opened: ReturnType<typeof open>;
    let signingKey: string;
    try {
        opened = open(config);
        signingKey = crypto.createPublicKey(config.rsaPrivateKeyPem).export({ type: "pkcs1", format: "der" }).toString("base64");
    } catch (error) {
        print(`FAIL setup bad key file: ${describeError(error)}`);
        return 2;
    }

    const { client, site } = opened;
    const report: Report = {
        show: (label, value) => print(`     ${label} ${shape(value)}`),
        note: (label, text) => print(`     ${label} ${text}`),
    };
    const steps = buildSteps(client, site, config, signingKey, report, sleep);
    try {
        for (const [index, [name, run]] of steps.entries()) {
            if (index > 0) {
                await sleep(STEP_WAIT_MS);
            }
            try {
                await run();
            } catch (error) {
                print(`FAIL ${name} ${error instanceof CheckFailed ? error.message : describeError(error)}`);
                return 1;
            }
            print(`PASS ${name}`);
        }
    } finally {
        client.close();
    }
    print("DONE R1-R12 passed. R13 (Python comparison) and R14 (connect_gateway) run separately.");
    return 0;
}

if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await run_readonly_check(process.env);
}
