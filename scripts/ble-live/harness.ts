// The live harness's rules, with no I/O of its own, so CI can run them on a fake
// link. They follow the `ble-live-verify` skill in python-tesla-fleet-api:
// snapshot, act once, verify with a fresh read of absolute state, restore with an
// absolute command, and read again. A command that times out may have run, so it
// is never sent twice: the next read decides.
import type { BleConnection, BleDeviceRef, BleLinkHandlers, BleScanOptions, BleTransport } from "../../src/bluetooth/transport.js";
import type { ActionStep, HarnessVehicle, ReadStep, SettingStep, Step } from "./steps.js";

export type Outcome = "ok" | "not-applied" | "unresolved" | "failed";

export interface StepResult {
    step: string;
    outcome: Outcome;
    writes: number;
    frames: number;
}

/** Writes one line. Everything printed goes through `redactor`. */
export type Print = (line: string) => void;

/** Remove every secret from a line, whatever put it there. */
export function redactor(secrets: Array<string | undefined>, print: Print): Print {
    const values = secrets.filter((secret): secret is string => Boolean(secret));
    return (line) => print(values.reduce((text, secret) => text.split(secret).join("<redacted>"), line));
}

/** An error's class only. A message might carry an identifier, and the class is what the skill records. */
function errorClass(error: unknown): string {
    return error instanceof Error ? error.constructor.name : "non-Error";
}

/** Counts what actually reached the backend, so "exactly one" comes from the link and not the library. */
export class CountingTransport implements BleTransport {
    writes = 0;
    frames = 0;
    private frameBytesLeft = 0;

    constructor(readonly inner: BleTransport) {}

    scan(options: BleScanOptions): Promise<BleDeviceRef[]> {
        return this.inner.scan(options);
    }

    async connect(device: BleDeviceRef, handlers: BleLinkHandlers): Promise<BleConnection> {
        const connection = await this.inner.connect(device, handlers);
        this.frameBytesLeft = 0;
        // A live object, as an adapter's `isConnected` and `maxWriteSize` can change.
        return new Proxy(connection, {
            get: (target, property) => {
                if (property === "write") {
                    return (data: Uint8Array) => {
                        this.count(data);
                        return target.write(data);
                    };
                }
                const value = Reflect.get(target, property, target);
                return typeof value === "function" ? value.bind(target) : value;
            },
        });
    }

    /** Frames carry a 2-byte length, so a write that starts one can be told from one that continues it. */
    private count(data: Uint8Array): void {
        this.writes++;
        if (this.frameBytesLeft <= 0) {
            this.frames++;
            this.frameBytesLeft = 2 + ((data[0]! << 8) | data[1]!);
        }
        this.frameBytesLeft -= data.length;
    }
}

export interface RunOptions {
    vehicle: HarnessVehicle;
    counter: CountingTransport;
    print: Print;
}

/** Why these steps cannot run, or `null`. Checked before anything touches a car. */
export function refusal(steps: readonly Step[], captainPresent: boolean): string | null {
    const needing = steps.filter((step) => step.class === "captain").map((step) => step.name);
    return needing.length > 0 && !captainPresent ? `These steps need the captain at the car, and --captain-present: ${needing.join(", ")}` : null;
}

/** Keepalive reads keep a car awake, so a sleep or wake step turns them off. `undefined` keeps the library's default. */
export function keepaliveFor(steps: readonly Step[]): null | undefined {
    return steps.some((step) => step.sleepOrWake) ? null : undefined;
}

function log(print: Print, step: string, phase: string, detail: string = ""): void {
    print(`${new Date().toISOString()} [${step}] ${phase}${detail ? ` ${detail}` : ""}`);
}

async function runRead(step: ReadStep, { vehicle, print }: RunOptions): Promise<Outcome> {
    const started = performance.now();
    try {
        await step.read(vehicle);
        log(print, step.name, "read", `ok ${Math.round(performance.now() - started)}ms`);
        return "ok";
    } catch (error) {
        log(print, step.name, "read", `raised ${errorClass(error)}`);
        return "failed";
    }
}

async function runAction(step: ActionStep, { vehicle, print }: RunOptions): Promise<Outcome> {
    try {
        await step.act(vehicle);
        log(print, step.name, "act", "ok. Check the car: nothing here reads the effect.");
        return "ok";
    } catch (error) {
        // Sent once, and left alone: it may have run.
        log(print, step.name, "act", `raised ${errorClass(error)}. Not sent again. Check the car.`);
        return "unresolved";
    }
}

async function runSetting<Value extends number | boolean>(step: SettingStep<Value>, { vehicle, print }: RunOptions): Promise<Outcome> {
    const fresh = async (phase: string): Promise<Value | undefined> => {
        try {
            const value = await step.read(vehicle);
            log(print, step.name, phase, String(value));
            return value;
        } catch (error) {
            log(print, step.name, phase, `raised ${errorClass(error)}`);
            return undefined;
        }
    };
    const once = async (phase: string, value: Value): Promise<boolean> => {
        try {
            await step.write(vehicle, value);
            log(print, step.name, phase, `sent ${String(value)}`);
            return true;
        } catch (error) {
            log(print, step.name, phase, `raised ${errorClass(error)}. Not sent again.`);
            return false;
        }
    };

    const before = await fresh("snapshot");
    if (before === undefined) {
        // Nothing was sent, and there would be nothing to restore to.
        return "failed";
    }
    const target = step.target(before);
    const answered = await once("act", target);

    const after = await fresh("verify");
    if (after === undefined) {
        log(print, step.name, "verify", "State unknown, so nothing was restored. Check the car by hand.");
        return "unresolved";
    }
    if (after === before) {
        log(print, step.name, "verify", answered ? "The car acked it, but the state did not change." : "The state did not change.");
        return answered ? "not-applied" : "unresolved";
    }

    await once("restore", before);
    const restored = await fresh("restored");
    if (restored !== before) {
        log(print, step.name, "restored", "Not back to the snapshot. Check the car by hand.");
        return "unresolved";
    }
    // Values decide, never the number of calls: `Commands` re-sends on WAIT and epoch faults.
    return after === target ? "ok" : "unresolved";
}

/** Run the steps in order, and stop at the first that did not end cleanly. */
export async function runSteps(steps: readonly Step[], options: RunOptions): Promise<StepResult[]> {
    const { vehicle, counter, print } = options;
    const results: StepResult[] = [];
    let awake = false;
    for (const step of steps) {
        const writesBefore = counter.writes;
        const framesBefore = counter.frames;
        let outcome: Outcome;
        if (step.infotainment && !awake) {
            // VCSEC answering does not mean infotainment can: it takes 4 to 16 s more.
            try {
                await vehicle.wake_up({ wait: true });
                awake = true;
            } catch (error) {
                log(print, step.name, "wake", `raised ${errorClass(error)}`);
                results.push({ step: step.name, outcome: "failed", writes: counter.writes - writesBefore, frames: counter.frames - framesBefore });
                break;
            }
        }
        switch (step.kind) {
            case "read":
                outcome = await runRead(step, options);
                break;
            case "action":
                outcome = await runAction(step, options);
                break;
            case "setting":
                outcome = await runSetting(step as SettingStep, options);
                break;
        }
        const result = { step: step.name, outcome, writes: counter.writes - writesBefore, frames: counter.frames - framesBefore };
        results.push(result);
        log(print, step.name, outcome, `writes=${result.writes} frames=${result.frames}`);
        if (outcome !== "ok") {
            log(print, step.name, "stopped", "The rest of the run did not start.");
            break;
        }
    }
    return results;
}
