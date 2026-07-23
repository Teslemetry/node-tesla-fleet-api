import { EnergyCharges, Season, TariffContentV2, TouPeriods } from "./types/site_info.js";

export interface TariffRate {
    price: number | null;
    periodName: string | null;
    seasonName: string | null;
}

export interface TariffPeriod {
    start: Date;
    end: Date;
    buy: TariffRate;
    sell: TariffRate;
}

export interface TariffResolution {
    buy: TariffRate;
    sell: TariffRate;
    currentStart: Date;
    nextChange: Date;
    currency: string | null;
    upcoming: TariffPeriod[] | null;
}

const MINUTES_PER_DAY = 1440;

type WallClock = { year: number; month: number; day: number; dow: number; minuteOfDay: number };

/** One day's period windows, expressed in that day's own minute-of-day (0..1440). */
type DaySegment = { periodName: string; startMin: number; endMin: number; trueStartMin: number };

function formatParts(date: Date, timeZone: string): Record<string, number> {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const out: Record<string, number> = {};
    for (const p of parts) out[p.type] = Number(p.value);
    return out;
}

function getWallClock(now: Date, timeZone: string): WallClock {
    const { year, month, day, hour, minute } = formatParts(now, timeZone);
    // Weekday derived from the site-local date (not name matching): Tesla is Mon=0..Sun=6, JS Date.getUTCDay() is Sun=0..Sat=6.
    const jsDow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const dow = (jsDow + 6) % 7;
    return { year, month, day, dow, minuteOfDay: hour * 60 + minute };
}

/**
 * Converts a target site-local wall-clock (year/month/day/hour/minute in `timeZone`) to the UTC
 * instant it represents. Iterates because the zone's UTC offset at the target instant is itself
 * what we're solving for (DST) - 3 rounds converges for any real-world offset change.
 */
function wallClockToUtcMillis(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): number {
    const target = Date.UTC(year, month - 1, day, hour, minute);
    let guess = target;
    for (let i = 0; i < 3; i++) {
        const p = formatParts(new Date(guess), timeZone);
        const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
        const offset = asUtc - guess;
        const next = target - offset;
        if (next === guess) break;
        guess = next;
    }
    return guess;
}

/** Adds `deltaMinutes` of wall-clock time (not elapsed real time) to a wall-clock reading. */
function shiftWallClock(wallClock: WallClock, deltaMinutes: number): { year: number; month: number; day: number; hour: number; minute: number } {
    const naive = new Date(Date.UTC(wallClock.year, wallClock.month - 1, wallClock.day, 0, wallClock.minuteOfDay + deltaMinutes));
    return { year: naive.getUTCFullYear(), month: naive.getUTCMonth() + 1, day: naive.getUTCDate(), hour: naive.getUTCHours(), minute: naive.getUTCMinutes() };
}

function dowInRange(d: number, fromDow: number, toDow: number): boolean {
    return fromDow <= toDow ? d >= fromDow && d <= toDow : d >= fromDow || d <= toDow;
}

function seasonContains(season: Season, month: number, day: number): boolean {
    if (!season?.tou_periods) return false;
    const fromMonth = season.fromMonth ?? 1;
    const fromDay = season.fromDay ?? 1;
    const toMonth = season.toMonth ?? 12;
    const toDay = season.toDay ?? 31;
    const from = fromMonth * 100 + fromDay;
    const to = toMonth * 100 + toDay;
    const cur = month * 100 + day;
    return from <= to ? cur >= from && cur <= to : cur >= from || cur <= to;
}

function findSeason(seasons: Record<string, Season> | undefined, month: number, day: number): { name: string; season: Season } | null {
    if (!seasons) return null;
    for (const [name, season] of Object.entries(seasons)) {
        if (seasonContains(season, month, day)) {
            return { name, season };
        }
    }
    return null;
}

/**
 * Expands a season's `tou_periods` into the windows active on one specific calendar day (given
 * as a Tesla weekday, Mon=0..Sun=6). A period whose `fromDayOfWeek..toDayOfWeek` includes `dow`
 * contributes its own window (clamped to this day, `endMin` capped at 1440 if it crosses
 * midnight); a period that crosses midnight and includes *yesterday* also contributes its
 * early-morning continuation here, `trueStartMin` carrying its real (pre-midnight) start so a
 * currently-active continuation can still report an accurate `currentStart`.
 */
function dayPeriods(touPeriods: TouPeriods, dow: number): DaySegment[] {
    const segments: DaySegment[] = [];
    const prevDow = (dow + 6) % 7;
    for (const [periodName, def] of Object.entries(touPeriods)) {
        for (const window of def.periods ?? []) {
            const fromDow = window.fromDayOfWeek ?? 0;
            const toDow = window.toDayOfWeek ?? 6;
            const fromMin = (window.fromHour ?? 0) * 60 + (window.fromMinute ?? 0);
            const toMin = (window.toHour ?? 0) * 60 + (window.toMinute ?? 0);
            const crossesMidnight = toMin <= fromMin;
            if (dowInRange(dow, fromDow, toDow)) {
                const endMin = crossesMidnight ? MINUTES_PER_DAY : toMin;
                if (endMin > fromMin) segments.push({ periodName, startMin: fromMin, endMin, trueStartMin: fromMin });
            }
            if (crossesMidnight && toMin > 0 && dowInRange(prevDow, fromDow, toDow)) {
                segments.push({ periodName, startMin: 0, endMin: toMin, trueStartMin: fromMin - MINUTES_PER_DAY });
            }
        }
    }
    return segments;
}

function lookupPrice(charges: EnergyCharges | undefined, seasonName: string, periodName: string): number | null {
    if (!charges) return null;
    // A season key can be present but carry no rates at all (e.g. an empty `"Winter": {}` stub
    // alongside a populated `"ALL"`) - that must fall back to ALL exactly like a missing key.
    const seasonRates = charges[seasonName]?.rates ?? charges["ALL"]?.rates;
    if (!seasonRates) return null;
    const value = Object.prototype.hasOwnProperty.call(seasonRates, periodName) ? seasonRates[periodName] : seasonRates["ALL"];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const EMPTY_RATE: TariffRate = { price: null, periodName: null, seasonName: null };

type PointResolution = {
    rate: TariffRate;
    currentStartGM: number;
    nextChangeGM: number;
};

/**
 * Resolves the rate active at `wallClock` (site-local "now"), and the next minute-of-week
 * boundary at which it changes - capped at the active period's own end so a sparse tariff
 * (a real gap between scheduled periods) reports the gap, not the next period found arbitrarily
 * far in the future. Both values are in GM units: wall-clock minutes relative to `wallClock`.
 */
function resolveAt(seasons: Record<string, Season> | undefined, charges: EnergyCharges | undefined, wallClock: WallClock, now: Date, timeZone: string): PointResolution | null {
    const matched = findSeason(seasons, wallClock.month, wallClock.day);
    if (!matched) return null;
    const todaySegs = dayPeriods(matched.season.tou_periods!, wallClock.dow);
    const current = todaySegs.find((s) => s.startMin <= wallClock.minuteOfDay && wallClock.minuteOfDay < s.endMin);
    if (!current) return null;

    const laterTodayStarts = todaySegs.filter((s) => s.startMin > wallClock.minuteOfDay).map((s) => s.startMin);
    let nextMin = current.endMin;
    if (laterTodayStarts.length > 0) {
        nextMin = Math.min(nextMin, Math.min(...laterTodayStarts));
    } else if (current.endMin >= MINUTES_PER_DAY) {
        // The active period runs up to midnight with nothing else scheduled today - check whether
        // it's the same period continuing tomorrow (a midnight-crossing window) before treating
        // midnight itself as the boundary.
        const tomorrowDate = new Date(now.getTime() + (MINUTES_PER_DAY - wallClock.minuteOfDay) * 60_000);
        const tomorrowWallClock = getWallClock(tomorrowDate, timeZone);
        const tomorrowMatched = findSeason(seasons, tomorrowWallClock.month, tomorrowWallClock.day);
        const tomorrowSegs = tomorrowMatched ? dayPeriods(tomorrowMatched.season.tou_periods!, tomorrowWallClock.dow) : [];
        const continuation = tomorrowMatched?.name === matched.name ? tomorrowSegs.find((s) => s.startMin === 0 && s.periodName === current.periodName) : undefined;
        if (continuation) {
            nextMin = MINUTES_PER_DAY + continuation.endMin;
        } else if (tomorrowSegs.length > 0) {
            nextMin = MINUTES_PER_DAY + Math.min(...tomorrowSegs.map((s) => s.startMin));
        }
    }

    return {
        rate: { price: lookupPrice(charges, matched.name, current.periodName), periodName: current.periodName, seasonName: matched.name },
        currentStartGM: current.trueStartMin - wallClock.minuteOfDay,
        nextChangeGM: nextMin - wallClock.minuteOfDay,
    };
}

type ScheduleSegment = { startGM: number; endGM: number; periodName: string; seasonName: string };

/** Walks one calendar day at a time across the horizon, re-resolving the season fresh on each day so a horizon that crosses a season boundary re-prices and re-labels correctly. */
function collectSegments(seasons: Record<string, Season> | undefined, wallClock: WallClock, now: Date, timeZone: string, horizonMinutes: number): ScheduleSegment[] {
    const segments: ScheduleSegment[] = [];
    let dayStartGM = -wallClock.minuteOfDay;
    while (dayStartGM < horizonMinutes) {
        const dayDate = new Date(now.getTime() + dayStartGM * 60_000);
        const dayWallClock = getWallClock(dayDate, timeZone);
        const matched = findSeason(seasons, dayWallClock.month, dayWallClock.day);
        if (matched) {
            for (const seg of dayPeriods(matched.season.tou_periods!, dayWallClock.dow)) {
                const startGM = dayStartGM + seg.startMin;
                const endGM = dayStartGM + seg.endMin;
                if (endGM > 0 && startGM < horizonMinutes) {
                    segments.push({ startGM, endGM, periodName: seg.periodName, seasonName: matched.name });
                }
            }
        }
        dayStartGM += MINUTES_PER_DAY;
    }
    segments.sort((a, b) => a.startGM - b.startGM);
    const merged: ScheduleSegment[] = [];
    for (const seg of segments) {
        const last = merged[merged.length - 1];
        if (last && last.endGM === seg.startGM && last.periodName === seg.periodName && last.seasonName === seg.seasonName) {
            last.endGM = seg.endGM;
        } else {
            merged.push({ ...seg });
        }
    }
    return merged;
}

function buildUpcoming(
    buySeasons: Record<string, Season> | undefined,
    buyCharges: EnergyCharges | undefined,
    sellSeasons: Record<string, Season> | undefined,
    sellCharges: EnergyCharges | undefined,
    hasSell: boolean,
    now: Date,
    wallClock: WallClock,
    timeZone: string,
    horizonMinutes: number,
    toDate: (gm: number) => Date,
): TariffPeriod[] {
    const buySegs = collectSegments(buySeasons, wallClock, now, timeZone, horizonMinutes);
    const sellSegs = hasSell ? collectSegments(sellSeasons, wallClock, now, timeZone, horizonMinutes) : [];

    const boundaries = new Set<number>([0, horizonMinutes]);
    const addBoundary = (gm: number): void => {
        if (gm > 0 && gm < horizonMinutes) boundaries.add(gm);
    };
    for (const s of buySegs) {
        addBoundary(s.startGM);
        addBoundary(s.endGM);
    }
    for (const s of sellSegs) {
        addBoundary(s.startGM);
        addBoundary(s.endGM);
    }

    const sorted = [...boundaries].sort((a, b) => a - b);
    const periods: TariffPeriod[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const segStart = sorted[i];
        const segEnd = sorted[i + 1];
        if (segStart === segEnd) continue;
        const buyAt = buySegs.find((s) => s.startGM <= segStart && segStart < s.endGM);
        const sellAt = sellSegs.find((s) => s.startGM <= segStart && segStart < s.endGM);
        periods.push({
            start: toDate(segStart),
            end: toDate(segEnd),
            buy: buyAt ? { price: lookupPrice(buyCharges, buyAt.seasonName, buyAt.periodName), periodName: buyAt.periodName, seasonName: buyAt.seasonName } : EMPTY_RATE,
            sell: sellAt ? { price: lookupPrice(sellCharges, sellAt.seasonName, sellAt.periodName), periodName: sellAt.periodName, seasonName: sellAt.seasonName } : EMPTY_RATE,
        });
    }
    return periods;
}

/**
 * Resolves the current buy/sell time-of-use rate for a Tariff V2 object at a given instant.
 * `tariff` carries no timezone; the caller must supply the site's IANA zone (e.g. from
 * `site_info.installation_time_zone`) so wall-clock period boundaries match correctly.
 */
export function getTariffPeriods(tariff: TariffContentV2, now: Date, opts?: { timeZone: string; horizonHours?: number }): TariffResolution | null {
    if (!tariff?.seasons || !tariff?.energy_charges) return null;
    if (!opts?.timeZone) throw new Error("getTariffPeriods requires opts.timeZone");
    const timeZone = opts.timeZone;

    const wallClock = getWallClock(now, timeZone);
    const buy = resolveAt(tariff.seasons, tariff.energy_charges, wallClock, now, timeZone);
    if (!buy) return null;

    const sellSeasons = tariff.sell_tariff?.seasons ?? tariff.seasons;
    const sell = tariff.sell_tariff ? resolveAt(sellSeasons, tariff.sell_tariff.energy_charges, wallClock, now, timeZone) : null;

    // Boundaries are wall-clock minute deltas, so converting one back to an instant means
    // re-deriving the target wall-clock label and reconverting *that*, not adding elapsed
    // real minutes to `now` - the two differ across a DST transition.
    const toDate = (gm: number): Date => {
        const target = shiftWallClock(wallClock, gm);
        return new Date(wallClockToUtcMillis(target.year, target.month, target.day, target.hour, target.minute, timeZone));
    };

    const nextChangeGM = sell ? Math.min(buy.nextChangeGM, sell.nextChangeGM) : buy.nextChangeGM;

    const resolution: TariffResolution = {
        buy: buy.rate,
        sell: sell ? sell.rate : EMPTY_RATE,
        currentStart: toDate(buy.currentStartGM),
        nextChange: toDate(nextChangeGM),
        currency: typeof tariff.currency === "string" ? tariff.currency : null,
        upcoming: null,
    };

    if (opts.horizonHours) {
        resolution.upcoming = buildUpcoming(tariff.seasons, tariff.energy_charges, sellSeasons, tariff.sell_tariff?.energy_charges, !!tariff.sell_tariff, now, wallClock, timeZone, opts.horizonHours * 60, toDate);
    }

    return resolution;
}
