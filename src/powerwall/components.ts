// Helpers over `PowerwallClient.get_components`. The payload is
// `{components: {<kind>: [{partNumber, serialNumber, signals: [...]}, ...]}}`,
// where `kind` is `pch`, `pws`, `bms`, `hvp` or `baggr` and each list position
// is a component slot. A signal is `{name, value, textValue, boolValue, timestamp}`
// with at most one of the three value fields set.
import type { ComponentsPayload, ConfigPayload, StatusPayload } from "./models.js";

export type SignalValue = number | string | boolean;
export type BatteryRole = "leader" | "follower" | "expansion";

/**
 * One battery unit: a Powerwall or an expansion.
 *
 * `din` comes from `config.json` or the status, and is `null` for an expansion
 * found only in the components payload. `component_slot` is the index in each
 * `components[<kind>]` list, which can be past the end of them while the gateway
 * returns no BMS rows. `block_index` is the owning Powerwall's position in
 * `battery_blocks`.
 */
export type BatteryUnit = {
    role: BatteryRole;
    block_index: number;
    component_slot: number;
    din: string | null;
    serial_number: string | null;
    part_number: string | null;
};

type Json = Record<string, any>;

/** Idle PCH string currents read as float noise around 1e-16 A. */
const PV_CURRENT_NOISE_FLOOR_A = 1e-3;
const SERIAL_KINDS = ["hvp", "bms", "pch", "baggr"];

function isRecord(value: unknown): value is Json {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Walk nested objects and lists; `undefined` if a step is missing. */
function path(data: unknown, ...keys: (string | number)[]): unknown {
    let value = data;
    for (const key of keys) {
        if (typeof key === "number") {
            value = Array.isArray(value) ? value[key] : undefined;
        } else {
            value = isRecord(value) ? value[key] : undefined;
        }
    }
    return value;
}

/** The `kind` component at `slot`, or `null`. */
export function component(components: ComponentsPayload, kind: string, slot: number = 0): Json | null {
    const item = path(components, "components", kind, slot);
    return isRecord(item) ? item : null;
}

/** One signal of a component: its `value`, else `textValue`, else `boolValue`, or `null` when none is set. */
export function component_signal(
    components: ComponentsPayload,
    kind: string,
    name: string,
    slot: number = 0,
): SignalValue | null {
    const signals: unknown = component(components, kind, slot)?.signals;
    const signal = (Array.isArray(signals) ? signals : []).find((item) => isRecord(item) && item.name === name);
    return signal?.value ?? signal?.textValue ?? signal?.boolValue ?? null;
}

/** A numeric signal, or `null` when it is missing or not a number. */
export function component_float(
    components: ComponentsPayload,
    kind: string,
    name: string,
    slot: number = 0,
): number | null {
    const value = component_signal(components, kind, name, slot);
    return typeof value === "number" ? value : null;
}

/** PCH PV string current in amps, for a `string` from `A` to `F`. An idle string's noise reads as 0. */
export function pv_string_current(components: ComponentsPayload, string: string, slot: number = 0): number | null {
    const value = component_float(components, "pch", `PCH_PvCurrent${string}`, slot);
    return value !== null && Math.abs(value) < PV_CURRENT_NOISE_FLOOR_A ? 0 : value;
}

function firstAcrossKinds(components: ComponentsPayload, slot: number, field: string): string | null {
    for (const kind of SERIAL_KINDS) {
        const value = path(components, "components", kind, slot, field);
        if (typeof value === "string" && value) {
            return value;
        }
    }
    return null;
}

/** The first non-empty serial number reported for `slot`. */
export function component_serial(components: ComponentsPayload, slot: number): string | null {
    return firstAcrossKinds(components, slot, "serialNumber");
}

/** The first non-empty part number reported for `slot`. */
export function component_part_number(components: ComponentsPayload, slot: number): string | null {
    return firstAcrossKinds(components, slot, "partNumber");
}

function unitDin(item: Json): string | null {
    for (const key of ["din", "vin"]) {
        const value = item[key];
        if (typeof value === "string" && value) {
            return value;
        }
    }
    return null;
}

function serialFromDin(din: string): string {
    return din.split("--").at(-1) as string;
}

function bmsFull(components: ComponentsPayload, slot: number): number | null {
    return component_float(components, "bms", "BMS_nominalFullPackEnergy", slot);
}

/** Component slots that look like real BMS modules. */
function bmsSlots(components: ComponentsPayload): number[] {
    const items = path(components, "components", "bms");
    if (!Array.isArray(items)) {
        return [];
    }
    return items.flatMap((_, slot) => ((bmsFull(components, slot) ?? 0) > 0 ? [slot] : []));
}

/**
 * BMS slots after dropping phantom expansion rows. A gateway can keep a
 * registered but uninstalled expansion: a plausible capacity, no serial and
 * near-zero energy. Such rows are dropped only when the system aggregate already
 * matches the kept rows, so a real pack with a stale reading stays.
 */
function ghostFilteredBmsSlots(components: ComponentsPayload, status: StatusPayload): number[] {
    const slots = bmsSlots(components);
    const aggregateWh = path(status, "control", "systemStatus", "nominalFullPackEnergyWh");
    if (slots.length === 0 || typeof aggregateWh !== "number" || aggregateWh <= 0) {
        return slots;
    }
    const aggregateKwh = aggregateWh / 1000;

    const ghosts = slots.filter((slot) => {
        if (component_serial(components, slot)) {
            return false;
        }
        const full = bmsFull(components, slot);
        const remaining = component_float(components, "bms", "BMS_nominalEnergyRemaining", slot);
        if (full === null || full <= 0 || remaining === null) {
            return false;
        }
        return remaining < 0.5 || remaining / full < 0.05;
    });
    if (ghosts.length === 0) {
        return slots;
    }

    const kept = slots.filter((slot) => !ghosts.includes(slot));
    const keptKwh = kept.reduce((sum, slot) => sum + (bmsFull(components, slot) ?? 0), 0);
    return keptKwh > 0 && Math.abs(aggregateKwh - keptKwh) / aggregateKwh < 0.1 ? kept : slots;
}

/**
 * Choose the component slots of follower Powerwalls. A slot matched to a
 * configured expansion is never chosen. Candidates with no serial win when
 * there are enough of them; otherwise the last candidates are taken.
 */
function followerSlots(
    components: ComponentsPayload,
    powerwallCount: number,
    expansionSlots: Set<number>,
    slots: number[],
): number[] {
    const followerCount = Math.max(0, powerwallCount - 1);
    if (followerCount === 0) {
        return [];
    }
    if (slots.length === 0) {
        return Array.from({ length: followerCount }, (_, index) => index + 1);
    }

    const candidates = slots.filter((slot) => slot !== 0 && !expansionSlots.has(slot));
    const noSerial = candidates.filter((slot) => !component_serial(components, slot));
    const pool = noSerial.length >= followerCount ? noSerial : candidates;
    const chosen = pool.slice(-followerCount);
    for (let fallback = 1; chosen.length < followerCount; fallback++) {
        if (!chosen.includes(fallback) && !expansionSlots.has(fallback)) {
            chosen.push(fallback);
        }
    }
    return chosen.sort((a, b) => a - b);
}

function statusBatteryDins(status: StatusPayload): string[] {
    const blocks = path(status, "control", "batteryBlocks");
    if (!Array.isArray(blocks)) {
        return [];
    }
    return blocks.filter(isRecord).flatMap((block) => unitDin(block) ?? []);
}

/**
 * Every battery unit of the site with its component slot, by block: each
 * Powerwall, then its expansions.
 *
 * Powerwalls come from `battery_blocks` plus any extra DIN in the status; the
 * first is the leader at slot 0. Expansions come from each block's
 * `battery_expansions` and match a slot by serial number. A configured expansion
 * with no real BMS row is dropped, and a real row no configured unit claims
 * becomes an expansion of the leader with `din: null`.
 */
export function battery_units(
    config: ConfigPayload,
    status: StatusPayload,
    components: ComponentsPayload,
): BatteryUnit[] {
    const configured: unknown = config.battery_blocks;
    const blocks: Json[] = Array.isArray(configured) ? configured.filter(isRecord) : [];
    const known = new Set(blocks.map(unitDin));
    for (const din of statusBatteryDins(status)) {
        if (!known.has(din)) {
            blocks.push({ din });
            known.add(din);
        }
    }
    if (blocks.length === 0) {
        blocks.push({});
    }
    const powerwallCount = blocks.length;

    const expansionDinsByBlock = blocks.map((block): string[] => {
        const expansions: unknown = block.battery_expansions;
        return Array.isArray(expansions) ? expansions.filter(isRecord).flatMap((item) => unitDin(item) ?? []) : [];
    });
    const slots = ghostFilteredBmsSlots(components, status);

    const serialToDin = new Map<string, string>();
    for (const din of expansionDinsByBlock.flat()) {
        const serial = serialFromDin(din);
        if (serial) {
            serialToDin.set(serial, din);
        }
    }
    const matched = new Map<string, number>();
    for (const slot of slots) {
        const serial = component_serial(components, slot);
        const din = serial ? serialToDin.get(serial) : undefined;
        if (din !== undefined && !matched.has(din)) {
            matched.set(din, slot);
        }
    }

    const followers = followerSlots(components, powerwallCount, new Set(matched.values()), slots);
    const assigned = new Set([0, ...followers, ...matched.values()]);
    const unclaimed = slots.filter((slot) => !assigned.has(slot));
    let nextUnobserved = Math.max(powerwallCount, slots.length);

    const expansionsByBlock = expansionDinsByBlock.map((dins) => {
        const expansions: [string | null, number][] = [];
        for (const din of dins) {
            const slot = matched.get(din) ?? unclaimed.shift();
            if (slot !== undefined) {
                expansions.push([din, slot]);
            } else if (slots.length === 0) {
                // No BMS rows at all: keep the config-driven list until the gateway returns them.
                expansions.push([din, nextUnobserved++]);
            }
        }
        return expansions;
    });
    expansionsByBlock[0].push(...unclaimed.map((slot): [null, number] => [null, slot]));

    const unit = (role: BatteryRole, block_index: number, din: string | null, slot: number): BatteryUnit => ({
        role,
        block_index,
        component_slot: slot,
        din,
        serial_number: component_serial(components, slot),
        part_number: component_part_number(components, slot),
    });
    return blocks.flatMap((block, index) => [
        unit(index === 0 ? "leader" : "follower", index, unitDin(block), index === 0 ? 0 : (followers[index - 1] ?? index)),
        ...expansionsByBlock[index].map(([din, slot]) => unit("expansion", index, din, slot)),
    ]);
}
