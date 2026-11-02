// Live Bluetooth harness, for a person with a car. Stages HW-1 to HW-6 of design
// document 06, section 4. Nothing runs it automatically, and CI only ever runs it
// on a fake link.
//
//   BLE_LIVE_VIN=<vin> BLE_LIVE_KEY_PATH=<file> pnpm ble:live --transport noble
//   BLE_LIVE_VIN=<vin> BLE_LIVE_KEY_PATH=<file> BLE_LIVE_PROXY_HOST=<host> \
//     [BLE_LIVE_PROXY_PORT=<port>] [BLE_LIVE_PROXY_KEY=<base64>] [BLE_LIVE_PROXY_PASSWORD=<password>] \
//     pnpm ble:live --transport esphome --steps charge_limit
//
// Options:
//   --transport <name>   noble or esphome. Homey has no CLI: it needs a test app.
//   --steps <a,b,c>      Steps to run. Defaults to every plain read.
//   --captain-present    Allow steps with a physical effect. Only say so if it is true.
//   --list               Print the steps, and touch nothing.
//
// Prints step names, classes of error, write counts, and the values of a setting
// under test. Never a VIN, a key, a BLE name or an address. Keep the output out of
// git, and record findings in OBSERVATIONS.md.
//
// Exits 0 when every step ended cleanly, 1 when one did not, 2 on bad setup.
import { existsSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EsphomeBleTransport } from "../../src/bluetooth/adapters/esphome.js";
import { NobleBleTransport } from "../../src/bluetooth/adapters/noble.js";
import { get_name } from "../../src/bluetooth/names.js";
import TeslaBluetooth from "../../src/bluetooth/teslabluetooth.js";
import type { BleTransport } from "../../src/bluetooth/transport.js";
import { CountingTransport, keepaliveFor, Print, redactor, refusal, runSteps } from "./harness.js";
import { Step, STEPS } from "./steps.js";

type Env = Record<string, string | undefined>;
type TransportFactory = (env: Env) => BleTransport;

const TRANSPORTS: Record<string, TransportFactory> = {
    noble: () => new NobleBleTransport(),
    esphome: (env) => {
        if (!env.BLE_LIVE_PROXY_HOST) {
            throw new Error("Set BLE_LIVE_PROXY_HOST.");
        }
        return new EsphomeBleTransport({
            host: env.BLE_LIVE_PROXY_HOST,
            port: env.BLE_LIVE_PROXY_PORT ? Number(env.BLE_LIVE_PROXY_PORT) : undefined,
            encryptionKey: env.BLE_LIVE_PROXY_KEY,
            password: env.BLE_LIVE_PROXY_PASSWORD,
        });
    },
};

interface Arguments {
    transport?: string;
    steps?: string[];
    captainPresent: boolean;
    list: boolean;
}

function parse(argv: readonly string[]): Arguments | string {
    const parsed: Arguments = { captainPresent: false, list: false };
    for (let index = 0; index < argv.length; index++) {
        const flag = argv[index];
        switch (flag) {
            case "--transport":
                parsed.transport = argv[++index];
                break;
            case "--steps":
                parsed.steps = argv[++index]?.split(",").filter(Boolean);
                break;
            case "--captain-present":
                parsed.captainPresent = true;
                break;
            case "--list":
                parsed.list = true;
                break;
            default:
                // Strict, so a mistyped safety flag fails instead of being ignored.
                return `Unknown option: ${flag}`;
        }
    }
    return parsed;
}

function select(names: string[] | undefined): Step[] | string {
    if (!names) {
        return STEPS.filter((step) => step.kind === "read");
    }
    const selected: Step[] = [];
    for (const name of names) {
        const step = STEPS.find((candidate) => candidate.name === name);
        if (!step) {
            return `Unknown step: ${name}. See --list.`;
        }
        selected.push(step);
    }
    return selected;
}

export interface Dependencies {
    print?: Print;
    /** Extra transports by name, which is how CI reaches a fake link. */
    transports?: Record<string, TransportFactory>;
}

/** @returns The exit code. */
export async function main(argv: readonly string[], env: Env, { print = console.log, transports = {} }: Dependencies = {}): Promise<number> {
    const args = parse(argv);
    if (typeof args === "string") {
        print(args);
        return 2;
    }
    if (args.list) {
        for (const step of STEPS) {
            print(`${step.name}  [${step.class}]  ${step.summary}`);
        }
        return 0;
    }
    const steps = select(args.steps);
    if (typeof steps === "string") {
        print(steps);
        return 2;
    }
    // First, so that a refused run reads no key and opens no radio.
    const refused = refusal(steps, args.captainPresent);
    if (refused) {
        print(refused);
        return 2;
    }

    const factory = { ...TRANSPORTS, ...transports }[args.transport ?? ""];
    if (!factory) {
        print(`Pick a transport: ${Object.keys(TRANSPORTS).join(", ")}.`);
        return 2;
    }
    const { BLE_LIVE_VIN: vin, BLE_LIVE_KEY_PATH: keyPath } = env;
    if (!vin || !keyPath) {
        print("Set BLE_LIVE_VIN and BLE_LIVE_KEY_PATH.");
        return 2;
    }
    // `get_private_key` creates a missing file, and a new key is on no car.
    if (!existsSync(keyPath)) {
        print("BLE_LIVE_KEY_PATH names no file.");
        return 2;
    }

    const output = redactor([vin, get_name(vin).slice(0, -1), keyPath, env.BLE_LIVE_PROXY_HOST, env.BLE_LIVE_PROXY_KEY, env.BLE_LIVE_PROXY_PASSWORD], print);
    let transport: BleTransport;
    try {
        transport = factory(env);
    } catch (error) {
        output(error instanceof Error ? error.message : "The transport could not be built.");
        return 2;
    }

    const tesla = new TeslaBluetooth();
    await tesla.get_private_key(keyPath);
    const counter = new CountingTransport(transport);
    const vehicle = tesla.vehicles.createBluetooth(vin, {
        transport: counter,
        // So a lost ack is reported as what it is, and not as best-effort success.
        raise_unconfirmed: true,
        keepalive_interval_ms: keepaliveFor(steps),
    });

    try {
        const results = await runSteps(steps, { vehicle, counter, print: output });
        output(`Done: ${results.map(({ step, outcome }) => `${step}=${outcome}`).join(" ")}`);
        return results.length === steps.length && results.every(({ outcome }) => outcome === "ok") ? 0 : 1;
    } finally {
        await vehicle.disconnect();
        if (transport instanceof EsphomeBleTransport) {
            transport.close();
        }
    }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await main(process.argv.slice(2), process.env);
}
