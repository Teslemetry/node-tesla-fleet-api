import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
    battery_units,
    component,
    component_float,
    component_part_number,
    component_serial,
    component_signal,
    pv_string_current,
    type BatteryRole,
    type BatteryUnit,
} from "../../src/powerwall/components.js";

// Copied from Python's `tests/powerwall/fixtures/`. A Powerwall 3 with two
// expansions and synthetic serials. Its `bms[3]`/`hvp[3]` row is an empty fourth slot.
const SAMPLE = JSON.parse(readFileSync(new URL("../fixtures/components_pw3_two_expansions.json", import.meta.url), "utf8"));
const LEADER_DIN = "1707000-30-L--TG10000000000A";
const EXP1_DIN = "1807000-20-B--TG10000000002C";
const EXP2_DIN = "1807000-20-B--TG10000000003D";

function unit(
    role: BatteryRole,
    block_index: number,
    component_slot: number,
    din: string | null,
    serial_number: string | null,
    part_number: string | null,
): BatteryUnit {
    return { role, block_index, component_slot, din, serial_number, part_number };
}

function setSignal(row: any, name: string, value: number): void {
    for (const signal of row.signals) {
        if (signal.name === name) {
            signal.value = value;
        }
    }
}

let sample: any;

beforeEach(() => {
    sample = structuredClone(SAMPLE);
});

function bms(slot: number): any {
    return sample.components.components.bms[slot];
}

describe("signal accessors", () => {
    const { components } = SAMPLE;

    it("prefers value, then text, then bool", () => {
        expect(component_signal(components, "bms", "BMS_nominalFullPackEnergy", 2)).toBe(14.38);
        expect(component_signal(components, "pch", "PCH_State")).toBe("Pch_Active");
        expect(component_signal(components, "pws", "PWS_ProdSwitch_State")).toBe(true);
        expect(component_signal(components, "baggr", "BAGGR_NumBatteriesConnected")).toBe(3);
    });

    it("returns null when anything is missing", () => {
        expect(component_signal(components, "bms", "BMS_nominalFullPackEnergy", 3)).toBeNull();
        expect(component_signal(components, "bms", "BMS_nominalFullPackEnergy", 9)).toBeNull();
        expect(component_signal(components, "bms", "NoSuchSignal")).toBeNull();
        expect(component_signal(components, "nope", "BMS_nominalFullPackEnergy")).toBeNull();
        expect(component_signal({}, "bms", "BMS_nominalFullPackEnergy")).toBeNull();
    });

    it("returns a falsy value rather than falling through", () => {
        const signals = [{ name: "a", value: 0, textValue: "x" }, { name: "b", boolValue: false }];
        const payload = { components: { pch: [{ signals }] } };
        expect(component_signal(payload, "pch", "a")).toBe(0);
        expect(component_signal(payload, "pch", "b")).toBe(false);
    });

    it("rejects text and bool as floats", () => {
        expect(component_float(components, "bms", "BMS_nominalEnergyRemaining", 1)).toBe(11.83);
        expect(component_float(components, "pch", "PCH_State")).toBeNull();
        expect(component_float(components, "pws", "PWS_ProdSwitch_State")).toBeNull();
    });

    it("finds a component by slot", () => {
        expect(component(components, "bms", 0)).toEqual(components.components.bms[0]);
        expect(component(components, "bms", 9)).toBeNull();
    });

    it("skips empty serials and part numbers", () => {
        expect(component_serial(components, 0)).toBe("TG10000000001B");
        expect(component_serial(components, 3)).toBeNull();
        expect(component_part_number(components, 1)).toBe("1807000-20-B");
        expect(component_part_number(components, 3)).toBeNull();
    });
});

describe("pv_string_current", () => {
    it("reads idle noise as zero", () => {
        const { components } = sample;
        // The sample reports -3.6e-16 A on every idle string.
        expect(component_float(components, "pch", "PCH_PvCurrentA")).toBeCloseTo(0);
        expect(pv_string_current(components, "A")).toBe(0);
        setSignal(components.components.pch[0], "PCH_PvCurrentB", 4.25);
        expect(pv_string_current(components, "B")).toBe(4.25);
        expect(pv_string_current({}, "A")).toBeNull();
    });
});

describe("battery_units", () => {
    const units = () => battery_units(sample.config, sample.status, sample.components);

    it("reads the real sample", () => {
        expect(units()).toEqual([
            unit("leader", 0, 0, LEADER_DIN, "TG10000000001B", "1800420-11-F"),
            unit("expansion", 0, 1, EXP1_DIN, "TG10000000002C", "1807000-20-B"),
            unit("expansion", 0, 2, EXP2_DIN, "TG10000000003D", "1807000-20-B"),
        ]);
    });

    it("drops a ghost expansion when the aggregate matches", () => {
        // Slot 3 has no serial and almost no energy; the aggregate 43.2 kWh already matches slots 0-2.
        setSignal(bms(3), "BMS_nominalFullPackEnergy", 14.4);
        setSignal(bms(3), "BMS_nominalEnergyRemaining", 0.1);
        expect(units().map((item) => item.component_slot)).toEqual([0, 1, 2]);
    });

    it("keeps a no-serial pack when the aggregate includes it", () => {
        setSignal(bms(3), "BMS_nominalFullPackEnergy", 14.4);
        setSignal(bms(3), "BMS_nominalEnergyRemaining", 0.1);
        sample.status.control.systemStatus.nominalFullPackEnergyWh = 57600;
        expect(units().at(-1)).toEqual(unit("expansion", 0, 3, null, null, null));
    });

    it("matches an expansion whose DIN has no separator by the whole DIN", () => {
        sample.config.battery_blocks[0].battery_expansions = [{ din: "TG10000000003D" }, { din: EXP1_DIN }];
        expect(units().map((item) => [item.component_slot, item.din])).toEqual([
            [0, LEADER_DIN],
            [2, "TG10000000003D"],
            [1, EXP1_DIN],
        ]);
    });

    it("drops a configured expansion with no BMS row", () => {
        sample.config.battery_blocks[0].battery_expansions.push({ din: "1807000-20-B--TG10000000009Z" });
        expect(units().map((item) => item.din)).toEqual([LEADER_DIN, EXP1_DIN, EXP2_DIN]);
    });

    it("gives a follower from the status the unserialed slot", () => {
        const follower = "1707000-30-L--TG10000000004E";
        sample.status.control.batteryBlocks.push({ din: follower });
        setSignal(bms(3), "BMS_nominalFullPackEnergy", 14.4);
        setSignal(bms(3), "BMS_nominalEnergyRemaining", 10);

        expect(units().map((item) => [item.role, item.block_index, item.component_slot, item.din])).toEqual([
            ["leader", 0, 0, LEADER_DIN],
            ["expansion", 0, 1, EXP1_DIN],
            ["expansion", 0, 2, EXP2_DIN],
            ["follower", 1, 3, follower],
        ]);
    });

    it("infers an unconfigured BMS row as a leader expansion", () => {
        sample.config.battery_blocks[0].battery_expansions = [{ din: EXP1_DIN }];
        expect(units().at(-1)).toEqual(unit("expansion", 0, 2, null, "TG10000000003D", "1807000-20-B"));
    });

    it("keeps the config shape with no BMS rows", () => {
        sample.components.components.bms = [];
        expect(units().map((item) => [item.role, item.component_slot, item.din])).toEqual([
            ["leader", 0, LEADER_DIN],
            ["expansion", 1, EXP1_DIN],
            ["expansion", 2, EXP2_DIN],
        ]);
    });

    it("gives empty payloads a single leader", () => {
        expect(battery_units({}, {}, {})).toEqual([unit("leader", 0, 0, null, null, null)]);
    });

    it("does not modify the config", () => {
        const follower = "1707000-30-L--TG10000000004E";
        sample.status.control.batteryBlocks.push({ din: follower });
        const before = structuredClone(sample.config);
        units();
        expect(sample.config).toEqual(before);
    });
});
