import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    PowerwallAuthenticationError,
    PowerwallConnectionError,
    PowerwallRateLimitError,
} from "../../src/powerwall/exceptions.js";
import {
    ENERGY_CONFIG_INTERVAL_MS,
    ENERGY_LIVE_INTERVAL_MS,
    ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS,
    LiveStatusMerge,
    SiteInfoMerge,
} from "../../src/powerwall/merge.js";
import { LOCAL_LIVE_STATUS_KEYS, LOCAL_SITE_INFO_KEYS } from "../../src/router/energysite.js";
import type { LiveStatusResponse } from "../../src/types/live_status.js";
import type { SiteInfoResponse } from "../../src/types/site_info.js";

const CLOUD_LIVE: LiveStatusResponse = {
    solar_power: 100,
    grid_power: 50,
    island_status: "on_grid",
    grid_services_active: true,
};

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void };

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function liveSite(...replies: (LiveStatusResponse | Error)[]) {
    const live_status = vi.fn(async () => {
        const reply = replies.shift();
        if (reply instanceof Error) {
            throw reply;
        }
        return { response: reply ?? {} };
    });
    return { live_status };
}

function configSite(...replies: (Record<string, unknown> | Error)[]) {
    const local_config = vi.fn(async () => {
        const reply = replies.shift();
        if (reply instanceof Error) {
            throw reply;
        }
        return reply ?? {};
    });
    return { local_config };
}

/** A local `live_status` reply with a `null` for each key a gateway cannot serve. */
const LOCAL_LIVE: LiveStatusResponse = {
    solar_power: 0,
    grid_power: 75,
    energy_left: null,
    island_status: "off_grid",
    grid_services_active: null,
};

/** The merged `site_info` keys these tests watch. */
function cloudInfo(document: Record<string, unknown> = {}): SiteInfoResponse {
    return { backup_reserve_percent: 20, default_real_mode: "self_consumption", ...document } as SiteInfoResponse;
}

describe("constants", () => {
    it("match document 02", () => {
        expect(ENERGY_LIVE_INTERVAL_MS).toBe(5_000);
        expect(ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS).toBe(60_000);
        expect(ENERGY_CONFIG_INTERVAL_MS).toBe(30_000);
    });
});

describe("LiveStatusMerge", () => {
    it("shows the cloud document before the first poll, and healthy is null", () => {
        const merge = new LiveStatusMerge(liveSite(), CLOUD_LIVE);
        expect(merge.merged).toEqual(CLOUD_LIVE);
        expect(merge.merged).not.toBe(CLOUD_LIVE);
        expect(merge.healthy).toBeNull();
        expect(merge.last_error).toBeNull();
    });

    it("overlays a zero, and a null does not overlay", async () => {
        const merge = new LiveStatusMerge(liveSite(LOCAL_LIVE), { ...CLOUD_LIVE, energy_left: 9000 });
        await expect(merge.poll()).resolves.toEqual({
            solar_power: 0,
            grid_power: 75,
            energy_left: 9000,
            island_status: "off_grid",
            grid_services_active: true,
        });
        expect(merge.healthy).toBe(true);
    });

    it("takes the value under `response`", async () => {
        const merge = new LiveStatusMerge(liveSite({ grid_power: 7 }), CLOUD_LIVE);
        const merged = await merge.poll();
        expect(merged).not.toHaveProperty("response");
        expect(merged?.grid_power).toBe(7);
    });

    it("keeps local keys across a cloud update, and takes the cloud's other keys", async () => {
        const merge = new LiveStatusMerge(liveSite(LOCAL_LIVE), CLOUD_LIVE);
        await merge.poll();
        expect(merge.set_cloud({ ...CLOUD_LIVE, grid_power: 999, grid_services_active: false })).toEqual({
            solar_power: 0,
            grid_power: 75,
            island_status: "off_grid",
            grid_services_active: false,
        });
        expect(merge.merged.grid_power).toBe(75);
    });

    it("leaves a key out of owned_keys at the cloud value", async () => {
        const owned_keys = LOCAL_LIVE_STATUS_KEYS.filter((key) => key !== "island_status");
        const merge = new LiveStatusMerge(liveSite(LOCAL_LIVE), CLOUD_LIVE, { owned_keys });
        const merged = await merge.poll();
        expect(merged?.island_status).toBe("on_grid");
        expect(merged?.grid_power).toBe(75);
    });

    it("falls back to the cloud on a failed poll, and reports it", async () => {
        const error = new PowerwallConnectionError("down");
        const merge = new LiveStatusMerge(liveSite(LOCAL_LIVE, error), CLOUD_LIVE);
        await merge.poll();
        await expect(merge.poll()).resolves.toEqual(CLOUD_LIVE);
        expect(merge.healthy).toBe(false);
        expect(merge.last_error).toBe(error);
    });

    it("clears last_error on recovery", async () => {
        const merge = new LiveStatusMerge(liveSite(new PowerwallRateLimitError("slow"), LOCAL_LIVE), CLOUD_LIVE);
        await merge.poll();
        await merge.poll(); // Skipped by the backoff.
        await merge.poll();
        expect(merge.healthy).toBe(true);
        expect(merge.last_error).toBeNull();
    });

    /** The ticks on which a run of failing polls reached the gateway, over `ticks` ticks. */
    async function attemptTicks(merge: LiveStatusMerge, site: { live_status: ReturnType<typeof vi.fn> }, ticks: number) {
        const attempts: number[] = [];
        for (let tick = 0; tick < ticks; tick++) {
            const before = site.live_status.mock.calls.length;
            await merge.poll();
            if (site.live_status.mock.calls.length > before) {
                attempts.push(tick);
            }
        }
        return attempts;
    }

    it("backs off 2, 4, 8 then 12 ticks, and stays at 12", async () => {
        const failures = Array.from({ length: 10 }, () => new PowerwallConnectionError("down"));
        const site = liveSite(...failures);
        const merge = new LiveStatusMerge(site, CLOUD_LIVE);
        const attempts = await attemptTicks(merge, site, 62);
        expect(attempts.slice(1).map((tick, index) => tick - attempts[index])).toEqual([2, 4, 8, 12, 12, 12]);
    });

    it("reaches the backoff ceiling at ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS", () => {
        expect(12 * ENERGY_LIVE_INTERVAL_MS).toBe(ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS);
    });

    it("resets the backoff to every tick after a success", async () => {
        const down = () => new PowerwallConnectionError("down");
        const site = liveSite(down(), down(), down(), {}, {}, {}, down(), {});
        const merge = new LiveStatusMerge(site, CLOUD_LIVE);
        // Fail on 0, 2 and 6, succeed on 14, 15 and 16, fail on 17, then retry on 19.
        const attempts = await attemptTicks(merge, site, 20);
        expect(attempts).toEqual([0, 2, 6, 14, 15, 16, 17, 19]);
    });

    it("returns null for a skipped tick, and keeps the merged view", async () => {
        const merge = new LiveStatusMerge(liveSite(new PowerwallConnectionError("down")), CLOUD_LIVE);
        await merge.poll();
        await expect(merge.poll()).resolves.toBeNull();
        expect(merge.merged).toEqual(CLOUD_LIVE);
    });

    it("skips a tick while a poll is in flight, without consuming the backoff", async () => {
        const read = deferred<{ response: LiveStatusResponse }>();
        const site = { live_status: vi.fn(() => read.promise) };
        const merge = new LiveStatusMerge(site, CLOUD_LIVE);
        const first = merge.poll();
        await expect(merge.poll()).resolves.toBeNull();
        await expect(merge.poll()).resolves.toBeNull();
        expect(site.live_status).toHaveBeenCalledTimes(1);
        read.resolve({ response: { grid_power: 1 } });
        await expect(first).resolves.toMatchObject({ grid_power: 1 });
    });

    it("rejects on anything else, keeps its state and can poll again", async () => {
        const bug = new TypeError("a bug");
        const site = liveSite(LOCAL_LIVE, bug, LOCAL_LIVE);
        const merge = new LiveStatusMerge(site, CLOUD_LIVE);
        await merge.poll();
        await expect(merge.poll()).rejects.toBe(bug);
        expect(merge.healthy).toBe(true);
        expect(merge.last_error).toBeNull();
        expect(merge.merged.grid_power).toBe(75);
        await expect(merge.poll()).resolves.toMatchObject({ grid_power: 75 });
    });

    it("treats every PowerwallError as a failed poll", async () => {
        const error = new PowerwallAuthenticationError("password changed");
        const merge = new LiveStatusMerge(liveSite(error), CLOUD_LIVE);
        await expect(merge.poll()).resolves.toEqual(CLOUD_LIVE);
        expect(merge.last_error).toBe(error);
    });
});

describe("SiteInfoMerge", () => {
    it("shows the cloud document before the first poll, and healthy is null", () => {
        const merge = new SiteInfoMerge(configSite(), cloudInfo());
        expect(merge.merged).toEqual(cloudInfo());
        expect(merge.healthy).toBeNull();
        expect(merge.last_error).toBeNull();
    });

    it("overlays a zero reserve", async () => {
        const merge = new SiteInfoMerge(configSite({ backup_reserve_percent: 0 }), cloudInfo());
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 0 }));
        expect(merge.healthy).toBe(true);
    });

    it("keeps the cloud value for a null or absent key", async () => {
        const merge = new SiteInfoMerge(configSite({ backup_reserve_percent: null }), cloudInfo());
        await expect(merge.poll()).resolves.toEqual(cloudInfo());
    });

    it("keeps local keys across a cloud update", async () => {
        const merge = new SiteInfoMerge(configSite({ backup_reserve_percent: 35 }), cloudInfo());
        await merge.poll();
        expect(merge.set_cloud(cloudInfo({ backup_reserve_percent: 90, site_name: "cloud" }))).toEqual(
            cloudInfo({ backup_reserve_percent: 35, site_name: "cloud" }),
        );
    });

    it("falls back to the cloud on a failed read, with no backoff", async () => {
        const error = new PowerwallConnectionError("down");
        const site = configSite({ backup_reserve_percent: 35 }, error, { backup_reserve_percent: 40 });
        const merge = new SiteInfoMerge(site, cloudInfo());
        await merge.poll();
        await expect(merge.poll()).resolves.toEqual(cloudInfo());
        expect(merge.healthy).toBe(false);
        expect(merge.last_error).toBe(error);
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 40 }));
        expect(site.local_config).toHaveBeenCalledTimes(3);
        expect(merge.healthy).toBe(true);
        expect(merge.last_error).toBeNull();
    });

    it("returns null while a read is in flight", async () => {
        const read = deferred<Record<string, unknown>>();
        const site = { local_config: vi.fn(() => read.promise) };
        const merge = new SiteInfoMerge(site, cloudInfo());
        const first = merge.poll();
        await expect(merge.poll()).resolves.toBeNull();
        expect(site.local_config).toHaveBeenCalledTimes(1);
        read.resolve({ backup_reserve_percent: 1 });
        await expect(first).resolves.toEqual(cloudInfo({ backup_reserve_percent: 1 }));
    });

    it("rejects on anything else, and can poll again", async () => {
        const bug = new TypeError("a bug");
        const merge = new SiteInfoMerge(configSite(bug, { backup_reserve_percent: 1 }), cloudInfo());
        await expect(merge.poll()).rejects.toBe(bug);
        expect(merge.healthy).toBeNull();
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 1 }));
    });

    it("discards a read that a command landed in, and its value stands", async () => {
        const read = deferred<Record<string, unknown>>();
        const merge = new SiteInfoMerge({ local_config: () => read.promise }, cloudInfo());
        const poll = merge.poll();
        expect(merge.hold_command_value("backup_reserve_percent", 60).backup_reserve_percent).toBe(60);
        read.resolve({ backup_reserve_percent: 20 });
        await expect(poll).resolves.toBeNull();
        expect(merge.merged.backup_reserve_percent).toBe(60);
    });

    it("discards a failed read that a command landed in, and its value stands", async () => {
        const read = deferred<Record<string, unknown>>();
        const merge = new SiteInfoMerge({ local_config: () => read.promise }, cloudInfo());
        const poll = merge.poll();
        merge.hold_command_value("backup_reserve_percent", 60);
        read.reject(new PowerwallConnectionError("down"));
        await expect(poll).resolves.toBeNull();
        expect(merge.merged.backup_reserve_percent).toBe(60);
        expect(merge.healthy).toBe(false);
    });

    it("does not discard a read for a command on a key it does not own", async () => {
        const read = deferred<Record<string, unknown>>();
        const merge = new SiteInfoMerge({ local_config: () => read.promise }, cloudInfo());
        const poll = merge.poll();
        merge.hold_command_value("site_name", "held");
        read.resolve({ backup_reserve_percent: 35 });
        await expect(poll).resolves.toEqual(cloudInfo({ backup_reserve_percent: 35, site_name: "held" }));
    });

    it("keeps a held value through a failed poll", async () => {
        const merge = new SiteInfoMerge(configSite(new PowerwallConnectionError("down")), cloudInfo());
        merge.hold_command_value("backup_reserve_percent", 60);
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 60 }));
    });

    it("keeps a held value the gateway does not report", async () => {
        const merge = new SiteInfoMerge(configSite({ default_real_mode: "autonomous" }, new PowerwallConnectionError("down")), cloudInfo());
        merge.hold_command_value("backup_reserve_percent", 60);
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 60, default_real_mode: "autonomous" }));
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 60 }));
    });

    it("releases a held value once the gateway reports the key, even as zero", async () => {
        const site = configSite({ backup_reserve_percent: 0 }, new PowerwallConnectionError("down"));
        const merge = new SiteInfoMerge(site, cloudInfo());
        merge.hold_command_value("backup_reserve_percent", 60);
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 0 }));
        // Nothing is held now, so a failed read falls through to the cloud.
        await expect(merge.poll()).resolves.toEqual(cloudInfo());
    });

    it("holds a key it does not own until the cloud reports", async () => {
        const merge = new SiteInfoMerge(configSite({ site_name: "local" }), cloudInfo());
        expect(merge.hold_command_value("site_name", "held")).toEqual(cloudInfo({ site_name: "held" }));
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ site_name: "held" }));
        expect(merge.set_cloud(cloudInfo({ site_name: "cloud" }))).toEqual(cloudInfo({ site_name: "cloud" }));
    });

    it("clears held values on a cloud update, leaving the local overlay", () => {
        const merge = new SiteInfoMerge(configSite(), cloudInfo());
        merge.hold_command_value("backup_reserve_percent", 60);
        merge.hold_command_value("site_name", "held");
        expect(merge.set_cloud(cloudInfo())).toEqual(cloudInfo({ backup_reserve_percent: 60 }));
    });

    it("honours owned_keys", async () => {
        const owned_keys = LOCAL_SITE_INFO_KEYS.filter((key) => key !== "default_real_mode");
        const site = configSite({ backup_reserve_percent: 35, default_real_mode: "autonomous" });
        const merge = new SiteInfoMerge(site, cloudInfo(), { owned_keys });
        await expect(merge.poll()).resolves.toEqual(cloudInfo({ backup_reserve_percent: 35 }));
    });
});

describe("no timer", () => {
    const TIMERS = ["setTimeout", "setInterval", "setImmediate", "queueMicrotask"] as const;

    beforeEach(() => {
        for (const name of TIMERS) {
            vi.spyOn(globalThis, name);
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("starts none on import, construction or a poll", async () => {
        vi.resetModules();
        const exceptions = await import("../../src/powerwall/exceptions.js");
        const merge = await import("../../src/powerwall/merge.js");
        const live = new merge.LiveStatusMerge(liveSite(new exceptions.PowerwallConnectionError("down"), {}), CLOUD_LIVE);
        const info = new merge.SiteInfoMerge(configSite({}), cloudInfo());
        await live.poll();
        await live.poll();
        await info.poll();
        info.hold_command_value("backup_reserve_percent", 1);
        for (const name of TIMERS) {
            expect(globalThis[name]).not.toHaveBeenCalled();
        }
    });

    it("names none in its source", () => {
        const source = readFileSync(new URL("../../src/powerwall/merge.ts", import.meta.url), "utf8");
        const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
        expect(code).not.toMatch(/\b(setTimeout|setInterval|setImmediate|queueMicrotask|node:timers)\b/);
    });
});
