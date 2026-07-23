import { describe, expect, it } from "vitest";
import { getTariffPeriods } from "../src/tariff.js";
import { TariffContentV2 } from "../src/types/site_info.js";
import { SAMPLE_TARIFF } from "./fixtures/sample-tariff.js";

const TZ = "Australia/Brisbane";

function brisbane(year: number, month: number, day: number, hour: number, minute = 0): Date {
    return new Date(Date.UTC(year, month - 1, day, hour - 10, minute));
}

describe("getTariffPeriods: live sample fixture", () => {
    it("resolves the current buy/sell rate at a normal half-hour boundary", () => {
        const now = brisbane(2026, 7, 23, 7, 15);
        const result = getTariffPeriods(SAMPLE_TARIFF, now, { timeZone: TZ });
        expect(result).not.toBeNull();
        expect(result!.buy).toEqual({ price: 0.3294, periodName: "PERIOD_07_00", seasonName: "Summer" });
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 7, 0));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 23, 7, 30));
        expect(result!.currency).toBe("AUD");
    });

    it("returns a real 0.0 sell price, not null (key-presence, not truthiness)", () => {
        const now = brisbane(2026, 7, 23, 10, 15);
        const result = getTariffPeriods(SAMPLE_TARIFF, now, { timeZone: TZ });
        expect(result!.sell.price).toBe(0);
        expect(result!.sell.periodName).toBe("PERIOD_10_00");
    });

    it("resolves a nonzero sell peak rate", () => {
        const now = brisbane(2026, 7, 23, 18, 15);
        const result = getTariffPeriods(SAMPLE_TARIFF, now, { timeZone: TZ });
        expect(result!.sell.price).toBe(0.45);
        expect(result!.sell.periodName).toBe("PERIOD_18_00");
    });

    it("normalizes toHour:24 instead of crashing, and rolls nextChange into the next day", () => {
        const now = brisbane(2026, 7, 23, 23, 45);
        const result = getTariffPeriods(SAMPLE_TARIFF, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.3107, periodName: "PERIOD_23_30", seasonName: "Summer" });
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 23, 30));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 24, 0, 0));
    });

    it("wraps forward past midnight into PERIOD_00_00", () => {
        const now = brisbane(2026, 7, 24, 0, 10);
        const result = getTariffPeriods(SAMPLE_TARIFF, now, { timeZone: TZ });
        expect(result!.buy.periodName).toBe("PERIOD_00_00");
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 24, 0, 0));
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 24, 0, 30));
    });

    it("builds an upcoming schedule across the requested horizon", () => {
        const now = brisbane(2026, 7, 23, 7, 15);
        const result = getTariffPeriods(SAMPLE_TARIFF, now, { timeZone: TZ, horizonHours: 1 });
        expect(result!.upcoming).not.toBeNull();
        const upcoming = result!.upcoming!;
        expect(upcoming[0].start).toEqual(now);
        expect(upcoming[0].buy.periodName).toBe("PERIOD_07_00");
        expect(upcoming[upcoming.length - 1].end).toEqual(brisbane(2026, 7, 23, 8, 15));
        expect(upcoming.some((p) => p.buy.periodName === "PERIOD_07_30")).toBe(true);
    });

    it("throws when the caller omits the site timeZone", () => {
        const now = brisbane(2026, 7, 23, 7, 15);
        expect(() => getTariffPeriods(SAMPLE_TARIFF, now)).toThrow(/timeZone/);
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

    it("falls back to ALL when the matched season key has no rates at all (not just an absent key)", () => {
        const tariff: TariffContentV2 = {
            version: 1,
            utility: "Test",
            code: "TEST",
            name: "Empty Season Rates",
            currency: "USD",
            daily_charges: [],
            demand_charges: {},
            // "Solo" is matched by date but carries no `rates` key at all - must still fall back to ALL.
            energy_charges: { ALL: { rates: { ALL_DAY: 0.6 } }, Solo: {} },
            seasons: { Solo: { fromMonth: 1, fromDay: 1, toMonth: 12, toDay: 31, tou_periods: { ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } } },
        };
        const now = brisbane(2026, 7, 23, 12, 0);
        const result = getTariffPeriods(tariff, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.6, periodName: "ALL_DAY", seasonName: "Solo" });
    });
});

describe("getTariffPeriods: sparse schedule (gap between periods)", () => {
    const SPARSE_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "Sparse",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { ALL: { rates: { MORNING: 0.4, EVENING: 0.5 } } },
        seasons: {
            ALL: {
                fromMonth: 1,
                fromDay: 1,
                toMonth: 12,
                toDay: 31,
                tou_periods: {
                    // 10:00-11:00, then a real gap, then 17:00-18:00 - nothing scheduled in between.
                    MORNING: { periods: [{ toDayOfWeek: 6, fromHour: 10, toHour: 11 }] },
                    EVENING: { periods: [{ toDayOfWeek: 6, fromHour: 17, toHour: 18 }] },
                },
            },
        },
    };

    it("reports nextChange at the active period's own end, not the next period found later", () => {
        const now = brisbane(2026, 7, 23, 10, 30);
        const result = getTariffPeriods(SPARSE_TARIFF, now, { timeZone: TZ });
        expect(result!.buy).toEqual({ price: 0.4, periodName: "MORNING", seasonName: "ALL" });
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 23, 11, 0));
    });

    it("returns null while sitting inside the gap itself", () => {
        const now = brisbane(2026, 7, 23, 12, 0);
        expect(getTariffPeriods(SPARSE_TARIFF, now, { timeZone: TZ })).toBeNull();
    });

    it("omits the gap from the upcoming schedule instead of stretching MORNING across it", () => {
        const now = brisbane(2026, 7, 23, 10, 30);
        const result = getTariffPeriods(SPARSE_TARIFF, now, { timeZone: TZ, horizonHours: 8 });
        const upcoming = result!.upcoming!;
        const morning = upcoming.find((p) => p.buy.periodName === "MORNING")!;
        expect(morning.end).toEqual(brisbane(2026, 7, 23, 11, 0));
        const gap = upcoming.find((p) => p.start.getTime() === morning.end.getTime())!;
        expect(gap.buy).toEqual({ price: null, periodName: null, seasonName: null });
    });
});

describe("getTariffPeriods: upcoming re-resolves seasons across a boundary", () => {
    const SEASON_SWITCH_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "Season Switch",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { Summer: { rates: { ALL_DAY: 0.5 } }, Winter: { rates: { ALL_DAY: 0.2 } } },
        seasons: {
            Summer: { fromMonth: 1, fromDay: 1, toMonth: 7, toDay: 31, tou_periods: { ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } },
            Winter: { fromMonth: 8, fromDay: 1, toMonth: 12, toDay: 31, tou_periods: { ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } },
        },
    };

    it("relabels and reprices upcoming segments once the horizon crosses into the next season", () => {
        const now = brisbane(2026, 7, 31, 12, 0);
        const result = getTariffPeriods(SEASON_SWITCH_TARIFF, now, { timeZone: TZ, horizonHours: 36 });
        const upcoming = result!.upcoming!;
        const before = upcoming.find((p) => p.start.getTime() === now.getTime())!;
        expect(before.buy).toEqual({ price: 0.5, periodName: "ALL_DAY", seasonName: "Summer" });
        const after = upcoming.find((p) => p.start.getTime() === brisbane(2026, 8, 1, 0, 0).getTime())!;
        expect(after.buy).toEqual({ price: 0.2, periodName: "ALL_DAY", seasonName: "Winter" });
    });
});

describe("getTariffPeriods: DST-observing timezone", () => {
    const DST_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "DST",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { ALL: { rates: { NIGHT: 0.1, DAY: 0.3 } } },
        seasons: {
            ALL: {
                fromMonth: 1,
                fromDay: 1,
                toMonth: 12,
                toDay: 31,
                tou_periods: {
                    NIGHT: { periods: [{ toDayOfWeek: 6, fromHour: 1, toHour: 3 }] },
                    DAY: { periods: [{ toDayOfWeek: 6, fromHour: 3, toHour: 1 }] },
                },
            },
        },
    };

    it("keeps nextChange at the correct wall-clock label across a spring-forward transition", () => {
        // America/New_York: clocks jump 02:00 -> 03:00 on 2026-03-08. At 01:30 local (still EST,
        // UTC-5), NIGHT (01:00-03:00) should end at 03:00 EDT (UTC-4) - not 90 elapsed UTC minutes later.
        const now = new Date("2026-03-08T06:30:00Z"); // 2026-03-08 01:30 EST
        const result = getTariffPeriods(DST_TARIFF, now, { timeZone: "America/New_York" });
        expect(result!.buy.periodName).toBe("NIGHT");
        expect(result!.nextChange).toEqual(new Date("2026-03-08T07:00:00Z")); // 2026-03-08 03:00 EDT
    });

    it("derives upcoming's day-2 boundary from wall-clock arithmetic, not a 24h-per-day assumption, across a fall-back transition", () => {
        // America/New_York: clocks fall back 02:00 -> 01:00 on 2026-11-01 (a Sunday), so that day
        // has 25 real hours. A period keyed only off day-of-week must still flip from Sunday's to
        // Monday's at the true local midnight, not 24 elapsed hours after the start of Sunday.
        const FALL_BACK_TARIFF: TariffContentV2 = {
            version: 1,
            utility: "Test",
            code: "TEST",
            name: "Fall Back",
            currency: "USD",
            daily_charges: [],
            demand_charges: {},
            energy_charges: { ALL: { rates: { SUNDAY_ONLY: 0.9, OTHER: 0.1 } } },
            seasons: {
                ALL: {
                    fromMonth: 1,
                    fromDay: 1,
                    toMonth: 12,
                    toDay: 31,
                    tou_periods: {
                        SUNDAY_ONLY: { periods: [{ fromDayOfWeek: 6, toDayOfWeek: 6, toHour: 24 }] },
                        OTHER: { periods: [{ fromDayOfWeek: 0, toDayOfWeek: 5, toHour: 24 }] },
                    },
                },
            },
        };
        const now = new Date("2026-11-01T04:30:00Z"); // 2026-11-01 00:30 EDT, a Sunday
        const result = getTariffPeriods(FALL_BACK_TARIFF, now, { timeZone: "America/New_York", horizonHours: 30 });
        expect(result!.buy).toEqual({ price: 0.9, periodName: "SUNDAY_ONLY", seasonName: "ALL" });
        const upcoming = result!.upcoming!;
        const monday = upcoming.find((p) => p.buy.periodName === "OTHER");
        expect(monday).toBeDefined();
        expect(monday!.start).toEqual(new Date("2026-11-02T05:00:00Z")); // true Monday 00:00 EST (post-fallback, UTC-5)
        expect(upcoming.every((p) => p.buy.periodName === "SUNDAY_ONLY" || p.start.getTime() >= monday!.start.getTime())).toBe(true);
    });
});

describe("getTariffPeriods: buy/sell schedules differ", () => {
    // All-day buy rate; sell only opens for a 17:00-19:00 export window - a common "feed-in" shape.
    const SELL_WINDOW_TARIFF: TariffContentV2 = {
        version: 1,
        utility: "Test",
        code: "TEST",
        name: "Sell Window",
        currency: "USD",
        daily_charges: [],
        demand_charges: {},
        energy_charges: { ALL: { rates: { ALL_DAY: 0.3 } } },
        seasons: { ALL: { fromMonth: 1, fromDay: 1, toMonth: 12, toDay: 31, tou_periods: { ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 24 }] } } } },
        sell_tariff: {
            energy_charges: { ALL: { rates: { ALL_DAY: 0, EXPORT: 0.5 } } },
            seasons: {
                ALL: {
                    fromMonth: 1,
                    fromDay: 1,
                    toMonth: 12,
                    toDay: 31,
                    tou_periods: {
                        ALL_DAY: { periods: [{ toDayOfWeek: 6, toHour: 17 }] },
                        EXPORT: { periods: [{ toDayOfWeek: 6, fromHour: 17, toHour: 19 }] },
                        // Nothing scheduled 19:00-24:00: sell is in a gap overnight.
                    },
                },
            },
        },
    };

    it("tracks the next sell boundary even while sell is currently in a gap", () => {
        const now = brisbane(2026, 7, 23, 16, 30);
        const result = getTariffPeriods(SELL_WINDOW_TARIFF, now, { timeZone: TZ });
        expect(result!.buy.periodName).toBe("ALL_DAY");
        expect(result!.sell.periodName).toBe("ALL_DAY");
        // Sell's own EXPORT window starts at 17:00, well before buy's midnight boundary.
        expect(result!.nextChange).toEqual(brisbane(2026, 7, 23, 17, 0));
    });

    it("uses the later of buy/sell currentStart when sell started after buy", () => {
        const now = brisbane(2026, 7, 23, 18, 0);
        const result = getTariffPeriods(SELL_WINDOW_TARIFF, now, { timeZone: TZ });
        expect(result!.sell).toEqual({ price: 0.5, periodName: "EXPORT", seasonName: "ALL" });
        // Buy's own period started at local midnight, but the returned pair is only valid from
        // when sell's EXPORT window opened at 17:00.
        expect(result!.currentStart).toEqual(brisbane(2026, 7, 23, 17, 0));
    });
});
