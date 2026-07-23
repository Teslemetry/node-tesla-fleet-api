import { describe, expect, it } from "vitest";
import { getTariffPeriods } from "../src/tariff.js";
import { TariffContentV2 } from "../src/types/site_info.js";
import { MOORINYA_TARIFF } from "./fixtures/moorinya-tariff.js";

const TZ = "Australia/Brisbane";

function brisbane(year: number, month: number, day: number, hour: number, minute = 0): Date {
    return new Date(Date.UTC(year, month - 1, day, hour - 10, minute));
}

describe("getTariffPeriods: live Moorinya fixture", () => {
    it("resolves the current buy/sell rate at a normal half-hour boundary", () => {
        const now = brisbane(2026, 7, 23, 7, 15);
        const result = getTariffPeriods(MOORINYA_TARIFF, now, { timeZone: TZ });
        expect(result).not.toBeNull();
        expect(result!.buy).toEqual({ price: 0.3294, periodName: "PERIOD_07_00", seasonName: "Summer" });
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 7, 0));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 23, 7, 30));
        expect(result!.currency).toBe("AUD");
    });

    it("returns a real 0.0 sell price, not null (key-presence, not truthiness)", () => {
        const now = brisbane(2026, 7, 23, 10, 15);
        const result = getTariffPeriods(MOORINYA_TARIFF, now, { timeZone: TZ });
        expect(result!.sell.price).toBe(0);
        expect(result!.sell.periodName).toBe("PERIOD_10_00");
    });

    it("resolves a nonzero sell peak rate", () => {
        const now = brisbane(2026, 7, 23, 18, 15);
        const result = getTariffPeriods(MOORINYA_TARIFF, now, { timeZone: TZ });
        expect(result!.sell.price).toBe(0.45);
        expect(result!.sell.periodName).toBe("PERIOD_18_00");
    });

    it("normalizes toHour:24 instead of crashing, and rolls nextChange into the next day", () => {
        const now = brisbane(2026, 7, 23, 23, 45);
        const result = getTariffPeriods(MOORINYA_TARIFF, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.3107, periodName: "PERIOD_23_30", seasonName: "Summer" });
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 23, 30));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 24, 0, 0));
    });

    it("wraps forward past midnight into PERIOD_00_00", () => {
        const now = brisbane(2026, 7, 24, 0, 10);
        const result = getTariffPeriods(MOORINYA_TARIFF, now, { timeZone: TZ });
        expect(result!.buy.periodName).toBe("PERIOD_00_00");
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 24, 0, 0));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 24, 0, 30));
    });

    it("builds an upcoming schedule across the requested horizon", () => {
        const now = brisbane(2026, 7, 23, 7, 15);
        const result = getTariffPeriods(MOORINYA_TARIFF, now, { timeZone: TZ, horizonHours: 1 });
        expect(result!.upcoming).not.toBeNull();
        const upcoming = result!.upcoming!;
        expect(upcoming[0].start).toEqual(now);
        expect(upcoming[0].buy.periodName).toBe("PERIOD_07_00");
        expect(upcoming[upcoming.length - 1].end).toEqual(brisbane(2026, 7, 23, 8, 15));
        expect(upcoming.some((p) => p.buy.periodName === "PERIOD_07_30")).toBe(true);
    });

    it("throws when the caller omits the site timeZone", () => {
        const now = brisbane(2026, 7, 23, 7, 15);
        expect(() => getTariffPeriods(MOORINYA_TARIFF, now)).toThrow(/timeZone/);
    });
});

describe("getTariffPeriods: season year-cross", () => {
    const YEAR_CROSS_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "Year Cross",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { Summer: { rates: { ALL_DAY: 0.5 } } },
        seasons: {
            Summer: { fromMonth: 10, fromDay: 1, toMonth: 3, toDay: 31, tou_periods: { ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } },
        },
    };

    it("matches a season that straddles New Year (Oct->Mar)", () => {
        const now = brisbane(2026, 1, 15, 12, 0);
        const result = getTariffPeriods(YEAR_CROSS_TARIFF, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.5, periodName: "ALL_DAY", seasonName: "Summer" });
    });

    it("returns null when no season covers the date", () => {
        const now = brisbane(2026, 6, 15, 12, 0);
        const result = getTariffPeriods(YEAR_CROSS_TARIFF, now, { timeZone: TZ });
        expect(result).toBeNull();
    });
});

describe("getTariffPeriods: day-of-week wrap", () => {
    const WEEK_WRAP_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "Week Wrap",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { ALL: { rates: { WEEKEND: 0.2, WEEKDAY: 0.4 } } },
        seasons: {
            ALL: {
                fromMonth: 1,
                fromDay: 1,
                toMonth: 12,
                toDay: 31,
                tou_periods: {
                    // Fri(4) -> Mon(0): covers Fri, Sat, Sun, Mon
                    WEEKEND: { periods: [{ fromDayOfWeek: 4, toDayOfWeek: 0, toHour: 24 }] },
                    // Tue(1) -> Thu(3)
                    WEEKDAY: { periods: [{ fromDayOfWeek: 1, toDayOfWeek: 3, toHour: 24 }] },
                },
            },
        },
    };

    it("selects the wrapped weekend period on a Saturday", () => {
        const now = brisbane(2026, 7, 25, 12, 0); // Saturday
        const result = getTariffPeriods(WEEK_WRAP_TARIFF, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.2, periodName: "WEEKEND", seasonName: "ALL" });
    });

    it("selects the non-wrapped weekday period on a Wednesday", () => {
        const now = brisbane(2026, 7, 29, 12, 0); // Wednesday
        const result = getTariffPeriods(WEEK_WRAP_TARIFF, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.4, periodName: "WEEKDAY", seasonName: "ALL" });
    });
});

describe("getTariffPeriods: midnight-crossing period", () => {
    const MIDNIGHT_CROSS_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "Midnight Cross",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { ALL: { rates: { NIGHT: 0.15, DAY: 0.25 } } },
        seasons: {
            ALL: {
                fromMonth: 1,
                fromDay: 1,
                toMonth: 12,
                toDay: 31,
                tou_periods: {
                    NIGHT: { periods: [{ toDayOfWeek: 6, fromHour: 23, toHour: 1 }] },
                    DAY: { periods: [{ toDayOfWeek: 6, fromHour: 1, toHour: 23 }] },
                },
            },
        },
    };

    it("matches the night period after 23:00 on the same day", () => {
        const now = brisbane(2026, 7, 23, 23, 30);
        const result = getTariffPeriods(MIDNIGHT_CROSS_TARIFF, now, { timeZone: TZ });
        expect(result!.buy.periodName).toBe("NIGHT");
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 23, 0));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 24, 1, 0));
    });

    it("matches the same night period's earlier-morning instance from the previous day", () => {
        const now = brisbane(2026, 7, 24, 0, 30);
        const result = getTariffPeriods(MIDNIGHT_CROSS_TARIFF, now, { timeZone: TZ });
        expect(result!.buy.periodName).toBe("NIGHT");
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 23, 0));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 24, 1, 0));
    });
});

describe("getTariffPeriods: missing / partial data", () => {
    it("returns sell = all-null when sell_tariff is absent (buy-only plan)", () => {
        const tariff: TariffContentV2 = {
            version: 1,
            utility: "Test",
            code: "TEST",
            name: "Buy Only",
            currency: "USD",
            daily_charges: [],
            demand_charges: {},
            energy_charges: { ALL: { rates: { ALL_DAY: 0.3 } } },
            seasons: { ALL: { fromMonth: 1, fromDay: 1, toMonth: 12, toDay: 31, tou_periods: { ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } } },
        };
        const now = brisbane(2026, 7, 23, 12, 0);
        const result = getTariffPeriods(tariff, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.3, periodName: "ALL_DAY", seasonName: "ALL" });
        expect(result!.sell).toEqual({ price: null, periodName: null, seasonName: null });
    });

    it("returns price = null when a matched period has no rate and no ALL fallback", () => {
        const tariff: TariffContentV2 = {
            version: 1,
            utility: "Test",
            code: "TEST",
            name: "Missing Rate",
            currency: "USD",
            daily_charges: [],
            demand_charges: {},
            energy_charges: { Solo: { rates: {} } },
            seasons: { Solo: { fromMonth: 1, fromDay: 1, toMonth: 12, toDay: 31, tou_periods: { ONLY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } } },
        };
        const now = brisbane(2026, 7, 23, 12, 0);
        const result = getTariffPeriods(tariff, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: null, periodName: "ONLY", seasonName: "Solo" });
    });

    it("returns null when the tariff has no seasons at all", () => {
        const tariff = { version: 1 } as unknown as TariffContentV2;
        const now = brisbane(2026, 7, 23, 12, 0);
        expect(getTariffPeriods(tariff, now, { timeZone: TZ })).toBeNull();
    });

    it("returns null when only an empty season object is present", () => {
        const tariff: TariffContentV2 = {
            version: 1,
            utility: "Test",
            code: "TEST",
            name: "Empty Season",
            currency: "USD",
            daily_charges: [],
            demand_charges: {},
            energy_charges: {},
            seasons: { Winter: {} },
        };
        const now = brisbane(2026, 7, 23, 12, 0);
        expect(getTariffPeriods(tariff, now, { timeZone: TZ })).toBeNull();
    });
});
