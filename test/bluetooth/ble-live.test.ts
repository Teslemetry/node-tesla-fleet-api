// The live harness is what stands between a script and a real car, so its rules
// are tested here on a fake one. Run this way it is the CI dry run of BLE-25.
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Response } from "@teslemetry/tesla-protocol/command/car_server";
import { RKEActionE, VehicleLockStateE, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import { VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import { CountingTransport, keepaliveFor, redactor, refusal, runSteps, StepResult } from "../../scripts/ble-live/harness.js";
import { main } from "../../scripts/ble-live/run.js";
import { Step, STEPS } from "../../scripts/ble-live/steps.js";
import { get_name } from "../../src/bluetooth/names.js";
import TeslaBluetooth from "../../src/bluetooth/teslabluetooth.js";
import VehicleBluetooth from "../../src/bluetooth/vehiclebluetooth.js";
import { bleHarness, finish, VIN } from "../helpers/blevehicle.js";
import { FakeVehicle } from "../helpers/fakevehicle.js";
import { FakeBleLink } from "../helpers/fakeblelink.js";

const DIRECTORY = resolve(import.meta.dirname, "../../scripts/ble-live");
const SOURCES = readdirSync(DIRECTORY).map((file) => readFileSync(join(DIRECTORY, file), "utf8"));
const FORBIDDEN = ["erase_user_data", "format_usb", "delete_dashcam_clips"];

function step(name: string): Step {
    return STEPS.find((candidate) => candidate.name === name)!;
}

/** A car with state that commands really change. */
function dryRunCar(fakeVehicle: FakeVehicle) {
    const car = { limit: 80, sentry: false, limitWrites: 0, sentryWrites: 0, ignoreLimit: false };
    fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });
    fakeVehicle.onInfotainmentAction = (action) => {
        const request = action.vehicleAction;
        if (request?.chargingSetLimitAction) {
            car.limitWrites++;
            if (!car.ignoreLimit) {
                car.limit = request.chargingSetLimitAction.percent;
            }
        }
        if (request?.vehicleControlSetSentryModeAction) {
            car.sentryWrites++;
            car.sentry = request.vehicleControlSetSentryModeAction.on;
        }
        if (request?.getVehicleData) {
            const sentryModeState = car.sentry ? { Armed: {} } : { Off: {} };
            return Response.create({
                vehicleData: VehicleData.fromPartial({
                    chargeState: { chargeLimitSoc: car.limit },
                    closuresState: { sentryModeState },
                    climateState: {},
                    driveState: {},
                    locationState: {},
                    mediaState: {},
                    softwareUpdateState: {},
                    tirePressureState: {},
                }),
            });
        }
        return null;
    };
    fakeVehicle.onVcsecCommand = (command) => {
        if (command.RKEAction === RKEActionE.RKE_ACTION_LOCK || command.RKEAction === RKEActionE.RKE_ACTION_UNLOCK) {
            const locked = command.RKEAction === RKEActionE.RKE_ACTION_LOCK;
            fakeVehicle.vehicleStatus = VehicleStatus.create({
                vehicleLockState: locked ? VehicleLockStateE.VEHICLELOCKSTATE_LOCKED : VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED,
            });
        }
    };
    return car;
}

function harness() {
    const lines: string[] = [];
    const { tesla, link, fakeVehicle } = bleHarness();
    const counter = new CountingTransport(link);
    const vehicle = tesla.vehicles.createBluetooth(VIN, { transport: counter, raise_unconfirmed: true, keepalive_interval_ms: null });
    const car = dryRunCar(fakeVehicle);
    const run = (...steps: Step[]) => finish(runSteps(steps, { vehicle, counter, print: (line) => lines.push(line) }));
    return { car, link, fakeVehicle, lines, run, counter, vehicle };
}

describe("the harness's steps", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("snapshots, acts, verifies and restores a setting", async () => {
        const { car, run, lines } = harness();
        const [result] = (await run(step("charge_limit"))) as [StepResult];
        expect(result.outcome).toBe("ok");
        expect(car.limit).toBe(80);
        expect(car.limitWrites).toBe(2);
        const phases = lines.map((line) => line.split(" ")[2]);
        expect(phases).toEqual(["snapshot", "act", "verify", "restore", "restored", "ok"]);
        expect(lines.find((line) => line.includes(" act "))).toContain("sent 79");
    });

    it("restores Sentry Mode", async () => {
        const { car, run } = harness();
        const [result] = (await run(step("sentry_mode"))) as [StepResult];
        expect(result.outcome).toBe("ok");
        expect(car.sentry).toBe(false);
        expect(car.sentryWrites).toBe(2);
    });

    it("never sends a command again after a lost ack: the next read decides", async () => {
        const { car, link, fakeVehicle, run, lines } = harness();
        const answer = fakeVehicle.onInfotainmentAction!;
        let lost = false;
        // The car runs the command, and only its ack is lost.
        fakeVehicle.onInfotainmentAction = (action) => {
            if (action.vehicleAction?.chargingSetLimitAction && !lost) {
                lost = true;
                link.dropNextReply("any");
            }
            return answer(action);
        };
        const [result] = (await run(step("charge_limit"))) as [StepResult];
        // One to change it, one to restore it, and no third.
        expect(car.limitWrites).toBe(2);
        expect(car.limit).toBe(80);
        expect(result.outcome).toBe("ok");
        expect(lines.find((line) => line.includes(" act "))).toContain("Not sent again");
    });

    it("sends nothing to restore when the state never changed", async () => {
        const { car, run } = harness();
        car.ignoreLimit = true;
        const [result] = (await run(step("charge_limit"))) as [StepResult];
        expect(result.outcome).toBe("not-applied");
        expect(car.limitWrites).toBe(1);
    });

    it("stops at the first step that did not end cleanly", async () => {
        const { car, run } = harness();
        car.ignoreLimit = true;
        const results = await run(step("charge_limit"), step("sentry_mode"));
        expect(results).toHaveLength(1);
        expect(car.sentryWrites).toBe(0);
    });

    it("changes nothing when the snapshot fails", async () => {
        const { car, fakeVehicle, run } = harness();
        fakeVehicle.onInfotainmentAction = (action) => (action.vehicleAction?.getVehicleData ? Response.create({ vehicleData: VehicleData.fromPartial({}) }) : null);
        const [result] = (await run(step("charge_limit"))) as [StepResult];
        expect(result.outcome).toBe("failed");
        expect(car.limitWrites).toBe(0);
    });

    it("sends an action once, and reports a lost ack as unresolved", async () => {
        const { fakeVehicle, link, run, lines } = harness();
        const answer = fakeVehicle.onInfotainmentAction!;
        let honks = 0;
        fakeVehicle.onInfotainmentAction = (action) => {
            if (action.vehicleAction?.vehicleControlHonkHornAction) {
                honks++;
                link.dropNextReply("any");
            }
            return answer(action);
        };
        const [result] = (await run(step("honk_horn"))) as [StepResult];
        expect(honks).toBe(1);
        expect(result.outcome).toBe("unresolved");
        expect(lines.join("\n")).toContain("Not sent again");
    });

    it("counts writes and frames from the link", async () => {
        const { link, run } = harness();
        const [result] = (await run(step("vehicle_state"))) as [StepResult];
        expect(result.outcome).toBe("ok");
        expect(result.writes).toBe(link.writes.length);
        expect(result.frames).toBe(link.frames.length);
        expect(result.writes).toBeGreaterThanOrEqual(result.frames);
    });

    it("prints that a read worked, and not what it read", async () => {
        const { run, lines } = harness();
        await run(step("charge_state"));
        // The whole shape of each line: a search for the value would also match a timestamp.
        const stamp = String.raw`\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[charge_state\]`;
        expect(lines).toHaveLength(2);
        expect(lines[0]).toMatch(new RegExp(String.raw`^${stamp} read ok \d+ms$`));
        expect(lines[1]).toMatch(new RegExp(String.raw`^${stamp} ok writes=\d+ frames=\d+$`));
    });
});

describe("what the harness refuses", () => {
    it("refuses a captain step without the flag", () => {
        expect(refusal([step("lock")], false)).toContain("lock");
        expect(refusal([step("lock")], true)).toBeNull();
        expect(refusal([step("charge_limit")], false)).toBeNull();
    });

    it.each(["lock", "honk_horn", "flash_lights", "charge_port_open", "pair"])("classes %s as needing the captain", (name) => {
        expect(step(name).class).toBe("captain");
    });

    it("has no individual door step at all: an ack does not mean it latched", () => {
        expect(SOURCES.join("\n")).not.toMatch(/open_\w+_door|close_\w+_door/);
    });

    it("turns keepalive off only for a sleep or wake step", () => {
        expect(keepaliveFor([step("wake"), step("vehicle_state")])).toBeNull();
        expect(keepaliveFor([step("vehicle_state")])).toBeUndefined();
    });

    it.each(FORBIDDEN)("has no path to %s", (command) => {
        expect(command in VehicleBluetooth.prototype).toBe(true);
        expect(SOURCES.join("\n")).not.toContain(command);
    });

    it("cannot reach around its types", () => {
        const source = SOURCES.join("\n");
        expect(source).not.toMatch(/\bas any\b|\bvehicle\[|\bas unknown\b|Reflect\.apply/);
    });

    it("carries nothing shaped like a VIN", () => {
        expect(SOURCES.join("\n")).not.toMatch(/\b[A-HJ-NPR-Z0-9]{17}\b/);
    });

    it("removes secrets from any line", () => {
        const lines: string[] = [];
        redactor(["secret", undefined], (line) => lines.push(line))("a secret and a secret");
        expect(lines).toEqual(["a <redacted> and a <redacted>"]);
    });
});

describe("the command line, on a fake link", () => {
    let directory: string;
    let keyPath: string;

    beforeEach(async () => {
        directory = mkdtempSync(join(tmpdir(), "ble-live-"));
        keyPath = join(directory, "key.pem");
        await new TeslaBluetooth().get_private_key(keyPath);
    });

    afterEach(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    function cli() {
        const fakeVehicle = new FakeVehicle();
        const car = dryRunCar(fakeVehicle);
        const link = new FakeBleLink(fakeVehicle, { vin: VIN });
        const lines: string[] = [];
        return {
            car,
            link,
            lines,
            run: (argv: string[], env: Record<string, string> = { BLE_LIVE_VIN: VIN, BLE_LIVE_KEY_PATH: keyPath }) =>
                main(argv, env, { print: (line) => lines.push(line), transports: { fake: () => link } }),
        };
    }

    it("runs the default reads, and exits 0", async () => {
        const { run, lines, link } = cli();
        expect(await run(["--transport", "fake"])).toBe(0);
        expect(lines.at(-1)).toContain("vehicle_state=ok");
        expect(link.openConnections).toBe(0);
    }, 30_000);

    it("runs every bench setting, and leaves the car as it found it", async () => {
        const { run, car } = cli();
        expect(await run(["--transport", "fake", "--steps", "charge_limit,sentry_mode"])).toBe(0);
        expect(car).toMatchObject({ limit: 80, sentry: false });
    }, 30_000);

    it("prints nothing identifying", async () => {
        const { run, lines } = cli();
        await run(["--transport", "fake", "--steps", "vehicle_state,charge_limit"]);
        const output = lines.join("\n");
        expect(output).not.toContain(VIN);
        expect(output).not.toContain(get_name(VIN).slice(0, -1));
        expect(output).not.toContain(keyPath);
    }, 30_000);

    it("refuses a captain step before it touches a link", async () => {
        const { run, link, lines } = cli();
        expect(await run(["--transport", "fake", "--steps", "lock"])).toBe(2);
        expect(link.calls).toEqual([]);
        expect(lines[0]).toContain("--captain-present");
    });

    it("runs a captain step with the flag", async () => {
        const { run } = cli();
        expect(await run(["--transport", "fake", "--steps", "lock", "--captain-present"])).toBe(0);
    }, 30_000);

    it.each([
        [["--transport", "fake", "--captain-presnet"], "Unknown option"],
        [["--transport", "fake", "--steps", "erase"], "Unknown step"],
        [["--transport", "nope"], "Pick a transport"],
    ])("rejects %j", async (argv, message) => {
        const { run, lines, link } = cli();
        expect(await run(argv)).toBe(2);
        expect(lines[0]).toContain(message);
        expect(link.calls).toEqual([]);
    });

    it("needs the VIN and key from the environment", async () => {
        const { run, link } = cli();
        expect(await run(["--transport", "fake"], {})).toBe(2);
        expect(link.calls).toEqual([]);
    });

    it("never makes a new key for a path that names no file", async () => {
        const { run, lines } = cli();
        const missing = join(directory, "missing.pem");
        expect(await run(["--transport", "fake"], { BLE_LIVE_VIN: VIN, BLE_LIVE_KEY_PATH: missing })).toBe(2);
        expect(lines[0]).toContain("names no file");
        expect(readdirSync(directory)).toEqual(["key.pem"]);
    });

    it("lists the steps and touches nothing", async () => {
        const { run, lines, link } = cli();
        expect(await run(["--list"], {})).toBe(0);
        expect(lines).toHaveLength(STEPS.length);
        expect(link.calls).toEqual([]);
    });
});
