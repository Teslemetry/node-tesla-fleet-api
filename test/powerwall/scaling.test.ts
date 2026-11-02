import { describe, expect, it } from "vitest";
import {
    backup_time_remaining,
    battery_level,
    battery_level_raw,
    current_power,
    raw_to_scaled_reserve,
    raw_to_scaled_soc,
    scaled_to_raw_reserve,
    scaled_to_raw_soc,
} from "../../src/powerwall/client.js";

// Measured on real hardware.
const RESERVE: [number, number][] = [
    [5, 9.75],
    [10, 14.5],
    [20, 24],
    [35, 38.25],
    [60, 62],
];
const SOC: [number, number][] = [
    [0, 5],
    [20, 24],
    [50, 52.5],
    [100, 100],
];

describe.each([
    ["reserve", scaled_to_raw_reserve, raw_to_scaled_reserve, RESERVE],
    ["soc", scaled_to_raw_soc, raw_to_scaled_soc, SOC],
] as const)("%s scaling", (_name, toRaw, toScaled, points) => {
    it.each(points)("scaled %d is raw %d", (scaled, raw) => {
        expect(toRaw(scaled)).toBe(raw);
        expect(toScaled(raw)).toBe(scaled);
    });

    it.each([0, 1, 12.5, 50, 99, 100])("round trips %d", (scaled) => {
        expect(toScaled(toRaw(scaled))).toBe(scaled);
    });

    it("keeps the 5% buffer at the endpoints", () => {
        expect(toRaw(0)).toBe(5);
        expect(toRaw(100)).toBe(100);
        expect(toScaled(5)).toBe(0);
        expect(toScaled(100)).toBe(100);
    });

    it.each([-1, 100.1, 150, Number.NaN])("rejects %d", (bad) => {
        expect(() => toRaw(bad)).toThrow(RangeError);
    });

    it("rejects a value that is not a number", () => {
        expect(() => toRaw("20" as unknown as number)).toThrow(TypeError);
    });

    it("does not check a raw input", () => {
        expect(toScaled(0)).toBe(-5.2632);
    });
});

describe("status helpers", () => {
    const status = (remaining?: number, full?: number, meters?: unknown) => ({
        control: {
            systemStatus: { nominalEnergyRemainingWh: remaining, nominalFullPackEnergyWh: full },
            meterAggregates: meters,
        },
    });

    it("matches the hardware data point", () => {
        // Local raw 52.7778 equals Fleet `percentage_charged` 50.2924.
        expect(raw_to_scaled_soc(52.77777777777778)).toBeCloseTo(50.2924, 4);
        expect(battery_level_raw(status(9500, 18000))).toBeCloseTo(52.77777777777778, 10);
        expect(battery_level(status(9500, 18000))).toBeCloseTo(50.2924, 4);
    });

    it("returns null when a figure is missing or zero", () => {
        expect(battery_level({})).toBeNull();
        expect(battery_level_raw({})).toBeNull();
        expect(battery_level(status(undefined, 0))).toBeNull();
        expect(battery_level_raw(status(0, 100))).toBeNull();
    });

    it("maps power by upper-case location and skips entries with none", () => {
        const meters = [{ location: "load", realPowerW: 500 }, { realPowerW: 9 }, { location: "SITE" }, "junk"];
        expect(current_power(status(1, 1, meters))).toEqual({ LOAD: 500, SITE: undefined });
    });

    it("treats malformed meters as empty", () => {
        expect(current_power(status(1, 1, "nope"))).toEqual({});
        expect(current_power({})).toEqual({});
    });

    it("estimates backup time at the current load", () => {
        const meters = [{ location: "LOAD", realPowerW: 2000 }];
        expect(backup_time_remaining(status(10000, 20000, meters))).toBe(5);
    });

    it.each([[{ location: "LOAD", realPowerW: 0 }], [{ location: "LOAD", realPowerW: -5 }], [{ location: "SITE" }]])(
        "has no estimate for %j",
        (meter) => {
            expect(backup_time_remaining(status(10000, 20000, [meter]))).toBeNull();
        },
    );

    it("has no estimate without remaining energy", () => {
        expect(backup_time_remaining(status(0, 20000, [{ location: "LOAD", realPowerW: 100 }]))).toBeNull();
    });
});
