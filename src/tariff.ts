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
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

type WallClock = { dow: number; minuteOfDay: number; month: number; day: number };

type Instance = { periodName: string; start: number; end: number };

function getWallClock(now: Date, timeZone: string): WallClock {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
    const year = get("year");
    const month = get("month");
    const day = get("day");
    const hour = get("hour");
    const minute = get("minute");
    // Weekday derived from the site-local date (not name matching): Tesla is Mon=0..Sun=6, JS Date.getUTCDay() is Sun=0..Sat=6.
    const jsDow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const dow = (jsDow + 6) % 7;
    return { dow, minuteOfDay: hour * 60 + minute, month, day };
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

/** One instance per eligible weekday per week cycle (-1/0/+1), so day-of-week wrap and midnight cross fall out of plain interval containment. */
function buildInstances(touPeriods: TouPeriods): Instance[] {
    const instances: Instance[] = [];
    for (const [periodName, def] of Object.entries(touPeriods)) {
        for (const window of def.periods ?? []) {
            const fromDow = window.fromDayOfWeek ?? 0;
            const toDow = window.toDayOfWeek ?? 6;
            const fromMin = (window.fromHour ?? 0) * 60 + (window.fromMinute ?? 0);
            const toMin = (window.toHour ?? 0) * 60 + (window.toMinute ?? 0);
            const duration = toMin > fromMin ? toMin - fromMin : MINUTES_PER_DAY - fromMin + toMin;
            if (duration <= 0) continue;
            for (let anchorDow = 0; anchorDow < 7; anchorDow++) {
                if (!dowInRange(anchorDow, fromDow, toDow)) continue;
                for (const weekOffset of [-1, 0, 1]) {
                    const start = weekOffset * MINUTES_PER_WEEK + anchorDow * MINUTES_PER_DAY + fromMin;
                    instances.push({ periodName, start, end: start + duration });
                }
            }
        }
    }
    return instances;
}

function findContaining(instances: Instance[], atMinute: number): Instance | null {
    let best: Instance | null = null;
    for (const instance of instances) {
        if (instance.start <= atMinute && atMinute < instance.end) {
            if (!best || instance.start > best.start) best = instance;
        }
    }
    return best;
}

function findNextStart(instances: Instance[], afterMinute: number): number | null {
    let best: number | null = null;
    for (const instance of instances) {
        if (instance.start > afterMinute && (best === null || instance.start < best)) {
            best = instance.start;
        }
    }
    return best;
}

function lookupPrice(charges: EnergyCharges | undefined, seasonName: string, periodName: string): number | null {
    if (!charges) return null;
    const seasonRates = (Object.prototype.hasOwnProperty.call(charges, seasonName) ? charges[seasonName] : charges["ALL"])?.rates;
    if (!seasonRates) return null;
    const value = Object.prototype.hasOwnProperty.call(seasonRates, periodName) ? seasonRates[periodName] : seasonRates["ALL"];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type GridResolution = {
    rate: TariffRate;
    seasonName: string;
    instances: Instance[];
    charges: EnergyCharges | undefined;
    currentStartOffset: number;
    nextChangeOffset: number;
};

function resolveGrid(seasons: Record<string, Season> | undefined, charges: EnergyCharges | undefined, wallClock: WallClock, nowAbs: number): GridResolution | null {
    const matched = findSeason(seasons, wallClock.month, wallClock.day);
    if (!matched) return null;
    const instances = buildInstances(matched.season.tou_periods!);
    if (instances.length === 0) return null;
    const current = findContaining(instances, nowAbs);
    if (!current) return null;
    const nextChangeOffset = findNextStart(instances, nowAbs) ?? current.end;
    return {
        rate: {
            price: lookupPrice(charges, matched.name, current.periodName),
            periodName: current.periodName,
            seasonName: matched.name,
        },
        seasonName: matched.name,
        instances,
        charges,
        currentStartOffset: current.start,
        nextChangeOffset,
    };
}

const EMPTY_RATE: TariffRate = { price: null, periodName: null, seasonName: null };

function buildUpcoming(buyGrid: GridResolution, sellGrid: GridResolution | null, nowAbs: number, horizonMinutes: number, toDate: (offset: number) => Date): TariffPeriod[] {
    const horizonEnd = nowAbs + horizonMinutes;
    const boundaries = new Set<number>([nowAbs, horizonEnd]);
    for (const instance of buyGrid.instances) {
        if (instance.start > nowAbs && instance.start < horizonEnd) boundaries.add(instance.start);
    }
    if (sellGrid) {
        for (const instance of sellGrid.instances) {
            if (instance.start > nowAbs && instance.start < horizonEnd) boundaries.add(instance.start);
        }
    }
    const sorted = [...boundaries].sort((a, b) => a - b);
    const periods: TariffPeriod[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const segStart = sorted[i];
        const segEnd = sorted[i + 1];
        if (segStart === segEnd) continue;
        const buyInstance = findContaining(buyGrid.instances, segStart);
        const sellInstance = sellGrid ? findContaining(sellGrid.instances, segStart) : null;
        periods.push({
            start: toDate(segStart),
            end: toDate(segEnd),
            buy: buyInstance ? { price: lookupPrice(buyGrid.charges, buyGrid.seasonName, buyInstance.periodName), periodName: buyInstance.periodName, seasonName: buyGrid.seasonName } : EMPTY_RATE,
            sell: sellInstance ? { price: lookupPrice(sellGrid!.charges, sellGrid!.seasonName, sellInstance.periodName), periodName: sellInstance.periodName, seasonName: sellGrid!.seasonName } : EMPTY_RATE,
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

    const wallClock = getWallClock(now, opts.timeZone);
    const nowAbs = wallClock.dow * MINUTES_PER_DAY + wallClock.minuteOfDay;

    const buyGrid = resolveGrid(tariff.seasons, tariff.energy_charges, wallClock, nowAbs);
    if (!buyGrid) return null;
    const sellGrid = tariff.sell_tariff ? resolveGrid(tariff.sell_tariff.seasons ?? tariff.seasons, tariff.sell_tariff.energy_charges, wallClock, nowAbs) : null;

    const toDate = (offset: number): Date => new Date(now.getTime() + (offset - nowAbs) * 60_000);

    const nextChangeOffset = sellGrid ? Math.min(buyGrid.nextChangeOffset, sellGrid.nextChangeOffset) : buyGrid.nextChangeOffset;

    const resolution: TariffResolution = {
        buy: buyGrid.rate,
        sell: sellGrid ? sellGrid.rate : EMPTY_RATE,
        currentStart: toDate(buyGrid.currentStartOffset),
        nextChange: toDate(nextChangeOffset),
        currency: typeof tariff.currency === "string" ? tariff.currency : null,
        upcoming: null,
    };

    if (opts.horizonHours) {
        resolution.upcoming = buildUpcoming(buyGrid, sellGrid, nowAbs, opts.horizonHours * 60, toDate);
    }

    return resolution;
}
