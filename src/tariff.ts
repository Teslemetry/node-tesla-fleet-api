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

/** Tesla weekday (Mon=0..Sun=6) for a calendar date, via JS Date.getUTCDay() (Sun=0..Sat=6). */
function dowFromDate(year: number, month: number, day: number): number {
    const jsDow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return (jsDow + 6) % 7;
}

function getWallClock(now: Date, timeZone: string): WallClock {
    const { year, month, day, hour, minute } = formatParts(now, timeZone);
    return { year, month, day, dow: dowFromDate(year, month, day), minuteOfDay: hour * 60 + minute };
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

/**
 * Adds `deltaMinutes` of wall-clock time (not elapsed real time) to a wall-clock reading, staying
 * in pure calendar arithmetic throughout - no `timeZone`/`Intl` round trip, so this is safe to use
 * for "what day/weekday is N minutes from now" even across a DST transition, where a real-time-ms
 * shift and a wall-clock-minutes shift land on different calendar days.
 */
function wallClockAt(wallClock: WallClock, deltaMinutes: number): WallClock {
    const naive = new Date(Date.UTC(wallClock.year, wallClock.month - 1, wallClock.day, 0, wallClock.minuteOfDay + deltaMinutes));
    const year = naive.getUTCFullYear();
    const month = naive.getUTCMonth() + 1;
    const day = naive.getUTCDate();
    const minuteOfDay = naive.getUTCHours() * 60 + naive.getUTCMinutes();
    return { year, month, day, dow: dowFromDate(year, month, day), minuteOfDay };
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

type Schedule = {
    seasonName: string;
    /** The segment active right now, or null if `wallClock` falls in a gap between scheduled periods. */
    current: DaySegment | null;
    /**
     * The next minute-of-day boundary (GM units relative to `wallClock`) at which this grid's rate
     * changes - present whether or not a period is active right now, so a caller can still learn
     * when a currently-empty grid (a gap) is about to start a period. Null only when neither today
     * nor tomorrow has anything scheduled at all.
     */
    nextChangeGM: number | null;
    /**
     * When the *current state* began (GM units relative to `wallClock`) - the active period's true
     * start if one is active, or the moment the current gap began (the previous period's end)
     * otherwise, so a currently-empty grid still reports an accurate "valid since". Bounded to at
     * most one day of lookback (mirrors `nextChangeGM`'s one-day lookahead bound): null only when
     * neither today nor yesterday has anything scheduled at all (this grid never constrains the
     * combined `currentStart`).
     */
    sinceGM: number | null;
};

/**
 * Resolves one grid's (buy's, or sell's) state at `wallClock`: the active period if any, and the
 * next boundary regardless of whether a period is currently active - a sparse tariff's gap still
 * has a "next change" (the gap's own end) and a "since" (the gap's own start), just like an active
 * period does (its own end and start).
 */
function scheduleAt(seasons: Record<string, Season> | undefined, wallClock: WallClock): Schedule | null {
    const matched = findSeason(seasons, wallClock.month, wallClock.day);
    if (!matched) return null;

    const todaySegs = dayPeriods(matched.season.tou_periods!, wallClock.dow);
    const current = todaySegs.find((s) => s.startMin <= wallClock.minuteOfDay && wallClock.minuteOfDay < s.endMin) ?? null;
    const laterTodayStarts = todaySegs.filter((s) => s.startMin > wallClock.minuteOfDay).map((s) => s.startMin);

    let nextMin: number | null = current ? current.endMin : null;
    if (laterTodayStarts.length > 0) {
        nextMin = nextMin === null ? Math.min(...laterTodayStarts) : Math.min(nextMin, Math.min(...laterTodayStarts));
    } else if (nextMin === null || nextMin >= MINUTES_PER_DAY) {
        // Either in a gap with nothing left today, or the active period runs up to midnight -
        // check tomorrow before treating midnight itself as the boundary.
        const tomorrowWallClock = wallClockAt(wallClock, MINUTES_PER_DAY - wallClock.minuteOfDay);
        const tomorrowMatched = findSeason(seasons, tomorrowWallClock.month, tomorrowWallClock.day);
        const tomorrowSegs = tomorrowMatched ? dayPeriods(tomorrowMatched.season.tou_periods!, tomorrowWallClock.dow) : [];
        const continuation = current && tomorrowMatched?.name === matched.name ? tomorrowSegs.find((s) => s.startMin === 0 && s.periodName === current.periodName) : undefined;
        if (continuation) {
            nextMin = MINUTES_PER_DAY + continuation.endMin;
        } else if (tomorrowSegs.length > 0) {
            const tomorrowFirst = MINUTES_PER_DAY + Math.min(...tomorrowSegs.map((s) => s.startMin));
            nextMin = nextMin === null ? tomorrowFirst : Math.min(nextMin, tomorrowFirst);
        }
    }

    let sinceMin: number | null;
    if (current) {
        sinceMin = current.trueStartMin;
    } else {
        const earlierTodayEnds = todaySegs.filter((s) => s.endMin <= wallClock.minuteOfDay).map((s) => s.endMin);
        if (earlierTodayEnds.length > 0) {
            sinceMin = Math.max(...earlierTodayEnds);
        } else {
            // Nothing has ended yet today either - the gap may have started yesterday (or earlier).
            // Peek one day back, same one-day bound as the forward "tomorrow" check above.
            const yesterdayWallClock = wallClockAt(wallClock, -MINUTES_PER_DAY);
            const yesterdayMatched = findSeason(seasons, yesterdayWallClock.month, yesterdayWallClock.day);
            const yesterdaySegs = yesterdayMatched ? dayPeriods(yesterdayMatched.season.tou_periods!, yesterdayWallClock.dow) : [];
            sinceMin = yesterdaySegs.length > 0 ? Math.max(...yesterdaySegs.map((s) => s.endMin)) - MINUTES_PER_DAY : null;
        }
    }

    return {
        seasonName: matched.name,
        current,
        nextChangeGM: nextMin === null ? null : nextMin - wallClock.minuteOfDay,
        sinceGM: sinceMin === null ? null : sinceMin - wallClock.minuteOfDay,
    };
}

type ScheduleSegment = { startGM: number; endGM: number; periodName: string; seasonName: string };

/** Walks one calendar day at a time across the horizon, re-resolving the season fresh on each day (via pure wall-clock arithmetic, not elapsed-ms/DST-sensitive arithmetic) so a horizon crossing a season boundary re-prices and re-labels correctly. */
function collectSegments(seasons: Record<string, Season> | undefined, wallClock: WallClock, horizonMinutes: number): ScheduleSegment[] {
    const segments: ScheduleSegment[] = [];
    let dayStartGM = -wallClock.minuteOfDay;
    while (dayStartGM < horizonMinutes) {
        const dayWallClock = wallClockAt(wallClock, dayStartGM);
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
    wallClock: WallClock,
    horizonMinutes: number,
    toDate: (gm: number) => Date,
): TariffPeriod[] {
    const buySegs = collectSegments(buySeasons, wallClock, horizonMinutes);
    const sellSegs = hasSell ? collectSegments(sellSeasons, wallClock, horizonMinutes) : [];

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
    const buySchedule = scheduleAt(tariff.seasons, wallClock);
    if (!buySchedule?.current) return null;

    const sellSeasons = tariff.sell_tariff?.seasons ?? tariff.seasons;
    const sellSchedule = tariff.sell_tariff ? scheduleAt(sellSeasons, wallClock) : null;

    const buyRate: TariffRate = { price: lookupPrice(tariff.energy_charges, buySchedule.seasonName, buySchedule.current.periodName), periodName: buySchedule.current.periodName, seasonName: buySchedule.seasonName };
    const sellRate: TariffRate = sellSchedule?.current
        ? { price: lookupPrice(tariff.sell_tariff!.energy_charges, sellSchedule.seasonName, sellSchedule.current.periodName), periodName: sellSchedule.current.periodName, seasonName: sellSchedule.seasonName }
        : EMPTY_RATE;

    // Boundaries are wall-clock minute deltas, so converting one back to an instant means
    // re-deriving the target wall-clock label and reconverting *that*, not adding elapsed
    // real minutes to `now` - the two differ across a DST transition.
    const toDate = (gm: number): Date => {
        const target = wallClockAt(wallClock, gm);
        const hour = Math.floor(target.minuteOfDay / 60);
        const minute = target.minuteOfDay % 60;
        return new Date(wallClockToUtcMillis(target.year, target.month, target.day, hour, minute, timeZone));
    };

    // `scheduleAt` reports a next-boundary GM even for a grid that's currently in a gap (e.g. a
    // sell/export window not open yet), so combining via the sell side's own next boundary - not
    // skipping it just because sell has no active period right now - catches "sell starts" too.
    const nextChangeGM = sellSchedule?.nextChangeGM != null ? Math.min(buySchedule.nextChangeGM!, sellSchedule.nextChangeGM) : buySchedule.nextChangeGM!;

    // When buy and sell schedules differ, the interval the returned pair is valid for only began
    // once BOTH sides' current *states* began - the later of the two, not just buy's. `sinceGM`
    // covers sell being in a gap too (e.g. an export window that already closed), not only sell
    // having its own active period. `buySchedule.sinceGM` is always non-null: buy is guaranteed to
    // have an active `current` period at this point (checked above), and that branch always sets it.
    const currentStartGM = sellSchedule?.sinceGM != null ? Math.max(buySchedule.sinceGM!, sellSchedule.sinceGM) : buySchedule.sinceGM!;

    const resolution: TariffResolution = {
        buy: buyRate,
        sell: sellRate,
        currentStart: toDate(currentStartGM),
        nextChange: toDate(nextChangeGM),
        currency: typeof tariff.currency === "string" ? tariff.currency : null,
        upcoming: null,
    };

    if (opts.horizonHours) {
        resolution.upcoming = buildUpcoming(tariff.seasons, tariff.energy_charges, sellSeasons, tariff.sell_tariff?.energy_charges, !!tariff.sell_tariff, wallClock, opts.horizonHours * 60, toDate);
    }

    return resolution;
}
