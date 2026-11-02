// Behaviour specs ported from Python's `tests/test_energysite_merge_contract.py`
// and the energy-site cases of `tests/test_router.py`, plus one test for each row
// of the routing tables in design document 02, section 3. The Powerwall classes
// here are stand-ins: `./router` must not import `src/powerwall`, and the marker
// is the whole of the contract between them.
import { describe, expect, it, vi } from "vitest";
import { TeslaFleetConnectionError } from "../src/exceptions.js";
import {
    EnergySiteRouter,
    LOCAL_LIVE_STATUS_KEYS,
    LOCAL_SITE_INFO_KEYS,
    merge_live_status,
    merge_local_into_cloud,
    merge_site_info,
    is_failover_safe,
} from "../src/router/index.js";

describe("merge_local_into_cloud", () => {
    it("returns the cloud values for a null local", () => {
        const cloud = { solar_power: 100, grid_power: 50, generator_power: 0 };
        expect(merge_local_into_cloud(cloud, null, LOCAL_LIVE_STATUS_KEYS)).toEqual(cloud);
    });

    it("overlays an owned key", () => {
        const result = merge_local_into_cloud({ solar_power: 100, grid_power: 50 }, { solar_power: 200 }, LOCAL_LIVE_STATUS_KEYS);
        expect(result).toEqual({ solar_power: 200, grid_power: 50 });
    });

    it.each([
        ["0", 0],
        ["-0", -0],
        ["false", false],
        ['""', ""],
        ["NaN", NaN],
    ])("overlays the falsy value %s", (_name, value) => {
        const result = merge_local_into_cloud({ grid_power: 999 }, { grid_power: value }, LOCAL_LIVE_STATUS_KEYS);
        expect(result.grid_power).toBe(value);
    });

    it("overlays false over a string", () => {
        const result = merge_local_into_cloud({ island_status: "on_grid" }, { island_status: false }, LOCAL_LIVE_STATUS_KEYS);
        expect(result.island_status).toBe(false);
    });

    it.each([
        ["null", null],
        ["undefined", undefined],
    ])("keeps the cloud value for an owned key that is %s", (_name, value) => {
        const result = merge_local_into_cloud({ solar_power: 100, grid_power: 50 }, { solar_power: value, grid_power: 75 }, LOCAL_LIVE_STATUS_KEYS);
        expect(result).toEqual({ solar_power: 100, grid_power: 75 });
    });

    it("ignores local keys outside the owned set", () => {
        const result = merge_local_into_cloud({ solar_power: 100 }, { solar_power: 200, some_unowned_field: "surprise" }, LOCAL_LIVE_STATUS_KEYS);
        expect(result).not.toHaveProperty("some_unowned_field");
    });

    it("adds an owned key the cloud document lacks", () => {
        expect(merge_local_into_cloud({}, { grid_power: 0 }, LOCAL_LIVE_STATUS_KEYS)).toEqual({ grid_power: 0 });
    });

    it("does not mutate its inputs", () => {
        const cloud = { solar_power: 100 };
        const local = { solar_power: 200 };
        const result = merge_local_into_cloud(cloud, local, LOCAL_LIVE_STATUS_KEYS);

        expect(cloud).toEqual({ solar_power: 100 });
        expect(local).toEqual({ solar_power: 200 });
        expect(result).not.toBe(cloud);
    });

    it("returns a copy for a null local", () => {
        const cloud = { solar_power: 100 };
        expect(merge_local_into_cloud(cloud, null, LOCAL_LIVE_STATUS_KEYS)).not.toBe(cloud);
    });

    it("treats undefined from a plain JS caller as a failed poll", () => {
        const cloud = { solar_power: 100 };
        expect(merge_local_into_cloud(cloud, undefined as never, LOCAL_LIVE_STATUS_KEYS)).toEqual(cloud);
    });

    it("works with the site info keys", () => {
        const result = merge_local_into_cloud(
            { backup_reserve_percent: 20, default_real_mode: "self_consumption" },
            { backup_reserve_percent: 30 },
            LOCAL_SITE_INFO_KEYS,
        );
        expect(result).toEqual({ backup_reserve_percent: 30, default_real_mode: "self_consumption" });
    });

    it("takes a caller's own subset, as Homey's list without island_status", () => {
        const owned = LOCAL_LIVE_STATUS_KEYS.filter((key) => key !== "island_status");
        const result = merge_local_into_cloud({ island_status: "on_grid" }, { island_status: "off_grid" }, owned);
        expect(result.island_status).toBe("on_grid");
    });
});

describe("the owned key sets", () => {
    it("match Python", () => {
        expect([...LOCAL_LIVE_STATUS_KEYS].sort()).toEqual(
            [
                "battery_power",
                "energy_left",
                "generator_power",
                "grid_power",
                "grid_status",
                "island_status",
                "load_power",
                "percentage_charged",
                "solar_power",
                "total_pack_energy",
            ].sort(),
        );
        expect([...LOCAL_SITE_INFO_KEYS].sort()).toEqual(["backup_reserve_percent", "default_real_mode"]);
    });
});

describe("merge_live_status", () => {
    it("matches the generic call with the live status keys", () => {
        const cloud = { solar_power: 100, grid_power: 50 };
        const local = { solar_power: 200, some_unowned_field: "surprise" };

        const result = merge_live_status(cloud, local);

        expect(result).toEqual(merge_local_into_cloud(cloud, local, LOCAL_LIVE_STATUS_KEYS));
        expect(result).toEqual({ solar_power: 200, grid_power: 50 });
    });

    it("overlays a zero reading", () => {
        expect(merge_live_status({ battery_power: 1500 }, { battery_power: 0 }).battery_power).toBe(0);
    });

    it("passes a null local through", () => {
        expect(merge_live_status({ solar_power: 100 }, null)).toEqual({ solar_power: 100 });
    });
});

describe("merge_site_info", () => {
    it("matches the generic call with the site info keys", () => {
        const cloud = { backup_reserve_percent: 20, default_real_mode: "self_consumption" };
        const local = { backup_reserve_percent: 30 };

        const result = merge_site_info(cloud, local);

        expect(result).toEqual(merge_local_into_cloud(cloud, local, LOCAL_SITE_INFO_KEYS));
        expect(result).toEqual({ backup_reserve_percent: 30, default_real_mode: "self_consumption" });
    });

    it("overlays a zero backup reserve", () => {
        expect(merge_site_info({ backup_reserve_percent: 20 }, { backup_reserve_percent: 0 }).backup_reserve_percent).toBe(0);
    });

    it("does not treat grid readings as site info", () => {
        expect(merge_site_info({ grid_power: 1 }, { grid_power: 2 }).grid_power).toBe(1);
    });

    it("passes a null local through", () => {
        expect(merge_site_info({ backup_reserve_percent: 20 }, null)).toEqual({ backup_reserve_percent: 20 });
    });
});

class FakeEnergySite {
    calls = 0;
    constructor(
        readonly tag: string,
        readonly energy_site_id: number,
        private readonly error?: { value: unknown },
    ) {}

    async operation(mode: string): Promise<string> {
        this.calls += 1;
        if (this.error) {
            throw this.error.value;
        }
        return `${this.tag}:${mode}`;
    }
}

const local = (error?: unknown) => new FakeEnergySite("local", 1, error === undefined ? undefined : { value: error });
const cloud = () => new FakeEnergySite("cloud", 2);

describe("EnergySiteRouter", () => {
    it("routes to the local primary", async () => {
        const [primary, fallback] = [local(), cloud()];
        await expect(new EnergySiteRouter([primary, fallback]).operation("self_consumption")).resolves.toBe("local:self_consumption");
        expect([primary.calls, fallback.calls]).toEqual([1, 0]);
    });

    it("falls back to the cloud", async () => {
        const [primary, fallback] = [local(new TeslaFleetConnectionError()), cloud()];
        await expect(new EnergySiteRouter([primary, fallback]).operation("backup")).resolves.toBe("cloud:backup");
        expect([primary.calls, fallback.calls]).toEqual([1, 1]);
    });

    it("resolves energy_site_id to the first backend that has it", () => {
        expect(new EnergySiteRouter([local(), cloud()]).energy_site_id).toBe(1);
        expect(new EnergySiteRouter([{}, cloud()]).energy_site_id).toBe(2);
    });

    it("exposes the primary and secondary directly, for local-only and registration calls", () => {
        const [primary, fallback] = [local(), cloud()];
        const router = new EnergySiteRouter([primary, fallback]);
        expect(router.primary).toBe(primary);
        expect(router.secondary).toBe(fallback);
    });

    it("logs transport=lan for the primary and backend= for a cloud fallback", async () => {
        const logger = { debug: vi.fn() };
        const router = new EnergySiteRouter([local(new TeslaFleetConnectionError()), cloud()], { logger });

        await router.operation("backup");

        expect(logger.debug.mock.calls).toEqual([
            ["command=operation transport=lan result=error error=TeslaFleetConnectionError: Could not connect to the API."],
            ["command=operation backend=FakeEnergySite result=success"],
        ]);
    });
});

describe("Energy routing rules", () => {
    const fromLocal = (name: string) => ({ [name]: vi.fn(async () => "local") });
    const fromCloud = (name: string) => ({ [name]: vi.fn(async () => "cloud") });

    it.each(["operation", "backup", "grid_import_export", "set_island_mode", "live_status", "dispatch_battery_power"])(
        "sends %s, on both backends, to the local one first",
        async (name) => {
            const [primary, secondary] = [fromLocal(name), fromCloud(name)];
            const router = new EnergySiteRouter([primary, secondary]) as unknown as Record<string, () => Promise<string>>;

            await expect(router[name]()).resolves.toBe("local");
            expect(secondary[name]).not.toHaveBeenCalled();
        },
    );

    it.each(["local_config", "powerwall"])("has %s from the local backend only", async (name) => {
        const router = new EnergySiteRouter([fromLocal(name), {}]) as unknown as Record<string, () => Promise<string>>;
        await expect(router[name]()).resolves.toBe("local");
    });

    it.each(["site_info", "storm_mode", "time_of_use_settings", "add_authorized_client"])(
        "sends %s, absent on the local backend, straight to the cloud",
        async (name) => {
            const health = vi.fn(() => false);
            const router = new EnergySiteRouter([{}, fromCloud(name)], { health }) as unknown as Record<string, () => Promise<string>>;

            await expect(router[name]()).resolves.toBe("cloud");
            expect(health).not.toHaveBeenCalled();
        },
    );

    // The failover table. The names are design document 02's; only the marker counts.
    class PowerwallError extends Error {}
    class PowerwallConnectionError extends PowerwallError {
        readonly failover_safe = true;
    }
    class PowerwallRateLimitError extends PowerwallError {
        readonly failover_safe = true;
    }
    class PowerwallAuthenticationError extends PowerwallError {
        readonly failover_safe = true;
    }
    class PowerwallCommandError extends PowerwallError {}
    class PowerwallNotSupportedError extends PowerwallError {}
    class PowerwallProtocolError extends PowerwallError {}
    class PowerwallFaultError extends PowerwallError {}

    it.each([[PowerwallConnectionError], [PowerwallRateLimitError], [PowerwallAuthenticationError]])("fails over on %o", async (Cls) => {
        const error = new Cls();
        const [primary, fallback] = [local(error), cloud()];

        expect(is_failover_safe(error)).toBe(true);
        await expect(new EnergySiteRouter([primary, fallback]).operation("backup")).resolves.toBe("cloud:backup");
        expect([primary.calls, fallback.calls]).toEqual([1, 1]);
    });

    it.each([[PowerwallCommandError], [PowerwallNotSupportedError], [PowerwallProtocolError], [PowerwallFaultError]])(
        "does not fail over on %o: the gateway answered, and the cloud reaches the same gateway",
        async (Cls) => {
            const error = new Cls();
            const [primary, fallback] = [local(error), cloud()];

            expect(is_failover_safe(error)).toBe(false);
            await expect(new EnergySiteRouter([primary, fallback]).operation("backup")).rejects.toBe(error);
            expect([primary.calls, fallback.calls]).toEqual([1, 0]);
        },
    );
});
