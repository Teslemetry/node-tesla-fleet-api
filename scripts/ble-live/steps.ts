// What the live harness can do to a car. This list is the whole of it: the CLI
// takes step names, never a command name, and `HarnessVehicle` is the only surface
// a step can reach. `test/bluetooth/ble-live.test.ts` fails if a destructive
// command, or a way around that type, appears in this directory.
import type VehicleBluetooth from "../../src/bluetooth/vehiclebluetooth.js";

export type HarnessVehicle = Pick<
    VehicleBluetooth,
    | "vehicle_state"
    | "charge_state"
    | "climate_state"
    | "closures_state"
    | "drive_state"
    | "location_state"
    | "media_state"
    | "software_update_state"
    | "tire_pressure_state"
    | "query_version"
    | "wake_up"
    | "set_charge_limit"
    | "set_sentry_mode"
    | "door_lock"
    | "door_unlock"
    | "honk_horn"
    | "flash_lights"
    | "charge_port_door_open"
    | "pair"
>;

/** Who must be there: document 06, section 4. `"captain"` steps have a physical or external effect. */
export type StepClass = "bench" | "captain";

interface BaseStep {
    name: string;
    class: StepClass;
    summary: string;
    /** Reads infotainment, so the car must be awake first. */
    infotainment: boolean;
    /** Keepalive reads keep a car awake, so a run with one of these turns them off. */
    sleepOrWake?: boolean;
}

/** One read. Prints that it worked and how long it took, never what it read. */
export interface ReadStep extends BaseStep {
    kind: "read";
    read(vehicle: HarnessVehicle): Promise<unknown>;
}

/** Snapshot, act, verify, restore, on one absolute value. */
export interface SettingStep<Value extends number | boolean = number | boolean> extends BaseStep {
    kind: "setting";
    /** A fresh read of the absolute state. It must be safe to print. */
    read(vehicle: HarnessVehicle): Promise<Value>;
    /** The value to change to, given the snapshot. */
    target(before: Value): Value;
    /** An absolute command, so that restoring it needs no count of what ran. */
    write(vehicle: HarnessVehicle, value: Value): Promise<unknown>;
}

/** Sent once, with no state to restore. A person checks what it did. */
export interface ActionStep extends BaseStep {
    kind: "action";
    act(vehicle: HarnessVehicle): Promise<unknown>;
}

export type Step = ReadStep | SettingStep<number> | SettingStep<boolean> | ActionStep;

function reader(name: string, infotainment: boolean, read: ReadStep["read"]): ReadStep {
    return { kind: "read", name, class: "bench", infotainment, summary: `Read ${name}.`, read };
}

function setting<Value extends number | boolean>(step: Omit<SettingStep<Value>, "kind">): SettingStep<Value> {
    return { kind: "setting", ...step };
}

function present<T>(value: T | undefined, field: string): T {
    if (value === undefined) {
        throw new Error(`The car did not report ${field}.`);
    }
    return value;
}

export const STEPS: readonly Step[] = [
    reader("vehicle_state", false, (vehicle) => vehicle.vehicle_state()),
    reader("query_version", false, (vehicle) => vehicle.query_version()),
    reader("charge_state", true, (vehicle) => vehicle.charge_state()),
    reader("climate_state", true, (vehicle) => vehicle.climate_state()),
    reader("closures_state", true, (vehicle) => vehicle.closures_state()),
    reader("drive_state", true, (vehicle) => vehicle.drive_state()),
    reader("location_state", true, (vehicle) => vehicle.location_state()),
    reader("media_state", true, (vehicle) => vehicle.media_state()),
    reader("software_update_state", true, (vehicle) => vehicle.software_update_state()),
    reader("tire_pressure_state", true, (vehicle) => vehicle.tire_pressure_state()),
    {
        kind: "action",
        name: "wake",
        class: "bench",
        infotainment: false,
        sleepOrWake: true,
        summary: "Wake the car and wait for infotainment.",
        act: (vehicle) => vehicle.wake_up({ wait: true }),
    },
    setting<number>({
        name: "charge_limit",
        class: "bench",
        infotainment: true,
        summary: "Move the charge limit by 1, then restore it.",
        read: async (vehicle) => present((await vehicle.charge_state()).chargeLimitSoc, "chargeLimitSoc"),
        target: (before) => (before > 50 ? before - 1 : before + 1),
        write: (vehicle, percent) => vehicle.set_charge_limit(percent),
    }),
    setting<boolean>({
        name: "sentry_mode",
        class: "bench",
        infotainment: true,
        summary: "Flip Sentry Mode, then restore it.",
        read: async (vehicle) => present((await vehicle.closures_state()).sentryModeState, "sentryModeState").Off === undefined,
        target: (before) => !before,
        write: (vehicle, on) => vehicle.set_sentry_mode(on),
    }),
    setting<boolean>({
        name: "lock",
        class: "captain",
        infotainment: false,
        summary: "Flip the locks, then restore them.",
        read: async (vehicle) => {
            const { vehicleLockState } = await vehicle.vehicle_state();
            // 1 locked, 2 internal locked. Both hold the car shut.
            return vehicleLockState === 1 || vehicleLockState === 2;
        },
        target: (before) => !before,
        write: (vehicle, locked) => (locked ? vehicle.door_lock() : vehicle.door_unlock()),
    }),
    { kind: "action", name: "honk_horn", class: "captain", infotainment: true, summary: "Honk once.", act: (vehicle) => vehicle.honk_horn() },
    { kind: "action", name: "flash_lights", class: "captain", infotainment: true, summary: "Flash once.", act: (vehicle) => vehicle.flash_lights() },
    {
        kind: "action",
        name: "charge_port_open",
        class: "captain",
        infotainment: true,
        summary: "Open the charge port once. Run with a person at the cable.",
        act: (vehicle) => vehicle.charge_port_door_open(),
    },
    {
        kind: "action",
        name: "pair",
        class: "captain",
        infotainment: false,
        summary: "Enrol this key. Someone must tap a key card at the car.",
        act: (vehicle) => vehicle.pair(),
    },
];
