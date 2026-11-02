import { describe, expect, it, vi } from "vitest";
import Tessie, { TessieOptions } from "../src/tessie.js";
import { TessieVehicle, TessieVehicles } from "../src/tessievehicle.js";
import VehicleSpecific from "../src/vehiclespecific.js";

const VIN = "5YJXCAE43LF123456";

function fakeFetch(body: unknown = { result: true }) {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
}

function makeApi(options: TessieOptions = {}, body?: unknown) {
    const fetch = fakeFetch(body);
    const api = new Tessie("test-token", { ...options, fetch: fetch as unknown as typeof globalThis.fetch });
    return { fetch, api };
}

function makeVehicle(options: TessieOptions = {}) {
    const { fetch, api } = makeApi(options);
    return { fetch, api, vehicle: api.vehicles.create(VIN) };
}

/** The single request sent: verb, path, decoded query and decoded body. */
function sent(fetch: ReturnType<typeof fakeFetch>) {
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.origin).toBe("https://api.tessie.com");
    return {
        method: init?.method,
        path: parsed.pathname.slice(1),
        query: Object.fromEntries(parsed.searchParams),
        body: init?.body == null ? undefined : JSON.parse(init.body as string),
    };
}

type Call = (vehicle: TessieVehicle) => Promise<unknown>;

const DEFAULTS = { wait_for_completion: "true", max_attempts: "3" };

/** method name, call, command route, and query parameters beyond the defaults. */
const COMMANDS: [string, Call, string, Record<string, string>?][] = [
    ["lock", (v) => v.lock(), "lock"],
    ["unlock", (v) => v.unlock(), "unlock"],
    ["activate_front_trunk", (v) => v.activate_front_trunk(), "activate_front_trunk"],
    ["activate_rear_trunk", (v) => v.activate_rear_trunk(), "activate_rear_trunk"],
    ["open_tonneau", (v) => v.open_tonneau(), "open_tonneau"],
    ["close_tonneau", (v) => v.close_tonneau(), "close_tonneau"],
    ["vent_windows", (v) => v.vent_windows(), "vent_windows"],
    ["close_windows", (v) => v.close_windows(), "close_windows"],
    ["start_climate", (v) => v.start_climate(), "start_climate"],
    ["stop_climate", (v) => v.stop_climate(), "stop_climate"],
    ["set_temperatures", (v) => v.set_temperatures(21.5), "set_temperatures", { temperature: "21.5" }],
    ["set_seat_heat", (v) => v.set_seat_heat("front_left", 0), "set_seat_heat", { seat: "front_left", level: "0" }],
    ["set_seat_cool", (v) => v.set_seat_cool("front_right", 3), "set_seat_cool", { seat: "front_right", level: "3" }],
    ["start_max_defrost", (v) => v.start_max_defrost(), "start_max_defrost"],
    ["stop_max_defrost", (v) => v.stop_max_defrost(), "stop_max_defrost"],
    ["start_steering_wheel_heater", (v) => v.start_steering_wheel_heater(), "start_steering_wheel_heater"],
    ["stop_steering_wheel_heater", (v) => v.stop_steering_wheel_heater(), "stop_steering_wheel_heater"],
    ["tessie_set_cabin_overheat_protection", (v) => v.tessie_set_cabin_overheat_protection(true), "set_cabin_overheat_protection", { on: "true", fan_only: "false" }],
    ["tessie_set_cop_temp", (v) => v.tessie_set_cop_temp(3), "set_cop_temp", { cop_temp: "3" }],
    ["tessie_set_bioweapon_mode", (v) => v.tessie_set_bioweapon_mode(false), "set_bioweapon_mode", { on: "false" }],
    ["tessie_set_climate_keeper_mode", (v) => v.tessie_set_climate_keeper_mode(2), "set_climate_keeper_mode", { mode: "2" }],
    ["start_charging", (v) => v.start_charging(), "start_charging"],
    ["stop_charging", (v) => v.stop_charging(), "stop_charging"],
    ["set_charge_limit", (v) => v.set_charge_limit(80), "set_charge_limit", { percent: "80" }],
    ["tessie_set_charging_amps", (v) => v.tessie_set_charging_amps(16), "set_charging_amps", { amps: "16" }],
    ["open_charge_port", (v) => v.open_charge_port(), "open_charge_port"],
    ["close_charge_port", (v) => v.close_charge_port(), "close_charge_port"],
    ["flash", (v) => v.flash(), "flash"],
    ["honk", (v) => v.honk(), "honk"],
    ["tessie_trigger_homelink", (v) => v.tessie_trigger_homelink(), "trigger_homelink"],
    ["remote_start", (v) => v.remote_start(), "remote_start"],
    ["vent_sunroof", (v) => v.vent_sunroof(), "vent_sunroof"],
    ["close_sunroof", (v) => v.close_sunroof(), "close_sunroof"],
    ["enable_sentry", (v) => v.enable_sentry(), "enable_sentry"],
    ["disable_sentry", (v) => v.disable_sentry(), "disable_sentry"],
    ["enable_valet", (v) => v.enable_valet(1234), "enable_valet", { pin: "1234" }],
    ["disable_valet", (v) => v.disable_valet("0000"), "disable_valet", { pin: "0000" }],
    ["tessie_schedule_software_update", (v) => v.tessie_schedule_software_update(3600), "schedule_software_update", { in_seconds: "3600" }],
    ["cancel_software_update", (v) => v.cancel_software_update(), "cancel_software_update"],
    ["set_scheduled_charging", (v) => v.set_scheduled_charging(false, 0), "set_scheduled_charging", { enable: "false", time: "0" }],
    ["tessie_set_scheduled_departure", (v) => v.tessie_set_scheduled_departure(true, 0), "set_scheduled_departure", {
        enable: "true",
        departure_time: "0",
        preconditioning_enabled: "false",
        preconditioning_weekdays_only: "false",
        off_peak_charging_enabled: "false",
        off_peak_charging_weekdays_only: "false",
    }],
    ["tessie_add_charge_schedule", (v) => v.tessie_add_charge_schedule("All", true, true, false, 1.5, -2.5, { start_time: 0 }), "add_charge_schedule", {
        days_of_week: "All",
        enabled: "true",
        start_enabled: "true",
        end_enabled: "false",
        lat: "1.5",
        lon: "-2.5",
        start_time: "0",
        one_time: "false",
    }],
    ["remove_charge_schedule", (v) => v.remove_charge_schedule(7), "remove_charge_schedule", { id: "7" }],
    ["tessie_add_precondition_schedule", (v) => v.tessie_add_precondition_schedule("All", true, 1.5, -2.5, 420), "add_precondition_schedule", {
        days_of_week: "All",
        enabled: "true",
        lat: "1.5",
        lon: "-2.5",
        precondition_time: "420",
        one_time: "false",
    }],
    ["remove_precondition_schedule", (v) => v.remove_precondition_schedule(7), "remove_precondition_schedule", { id: "7" }],
    ["share", (v) => v.share("1 Tesla Road"), "share", { value: "1 Tesla Road", locale: "en-US" }],
    ["remote_boombox", (v) => v.remote_boombox(), "remote_boombox"],
    ["set_speed_limit", (v) => v.set_speed_limit(65), "set_speed_limit", { mph: "65" }],
    ["enable_speed_limit", (v) => v.enable_speed_limit(1234), "enable_speed_limit", { pin: "1234" }],
    ["disable_speed_limit", (v) => v.disable_speed_limit(1234), "disable_speed_limit", { pin: "1234" }],
    ["clear_speed_limit_pin", (v) => v.clear_speed_limit_pin("1234"), "clear_speed_limit_pin", { pin: "1234" }],
    ["enable_guest", (v) => v.enable_guest(), "enable_guest"],
    ["disable_guest", (v) => v.disable_guest(), "disable_guest"],
    ["enable_keep_accessory_power_mode", (v) => v.enable_keep_accessory_power_mode(), "enable_keep_accessory_power_mode"],
    ["disable_keep_accessory_power_mode", (v) => v.disable_keep_accessory_power_mode(), "disable_keep_accessory_power_mode"],
    ["enable_low_power_mode", (v) => v.enable_low_power_mode(), "enable_low_power_mode"],
    ["disable_low_power_mode", (v) => v.disable_low_power_mode(), "disable_low_power_mode"],
];

/** Helpers, and methods with their own tests below. */
const NOT_IN_TABLE = new Set(["constructor", "_request", "_command", "_command_params", "wake"]);

describe("Tessie client", () => {
    it("defaults to waiting, with 3 attempts", () => {
        const { api } = makeApi();
        expect(api.wait_for_completion).toBe(true);
        expect(api.max_attempts).toBe(3);
    });

    it("has no partner, and has a user", () => {
        const { api } = makeApi();
        expect(api.partner).toBeUndefined();
        expect(api.user).toBeDefined();
    });

    it("scopes()", async () => {
        const { api, fetch } = makeApi({}, { scopes: ["vehicle_cmds"] });

        await expect(api.scopes()).resolves.toEqual(["vehicle_cmds"]);
        expect(sent(fetch)).toEqual({ method: "GET", path: "auth/tesla_scopes", query: {}, body: undefined });
    });

    it("list_vehicles() returns Tessie's reply, and defaults only_active to false", async () => {
        const { api, fetch } = makeApi({}, { results: [{ vin: VIN }] });

        await expect(api.list_vehicles()).resolves.toEqual({ results: [{ vin: VIN }] });
        expect(sent(fetch)).toEqual({ method: "GET", path: "vehicles", query: { only_active: "false" }, body: undefined });
    });

    it("list_vehicles(true)", async () => {
        const { api, fetch } = makeApi({}, { results: [] });

        await api.list_vehicles(true);
        expect(sent(fetch).query).toEqual({ only_active: "true" });
    });
});

describe("TessieVehicle commands", () => {
    it.each(COMMANDS)("%s", async (_name, call, route, params = {}) => {
        const { fetch, vehicle } = makeVehicle();

        await expect(call(vehicle)).resolves.toEqual({ result: true });
        expect(sent(fetch)).toEqual({
            method: "POST",
            path: `${VIN}/command/${route}`,
            query: { ...DEFAULTS, ...params },
            body: undefined,
        });
    });

    it("covers every command", () => {
        const methods = Object.getOwnPropertyNames(TessieVehicle.prototype).filter((name) => !NOT_IN_TABLE.has(name) && !READS.has(name));
        expect(methods.sort()).toEqual(COMMANDS.map(([name]) => name).sort());
    });

    it("wake posts outside /command, with no query", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.wake();
        expect(sent(fetch)).toEqual({ method: "POST", path: `${VIN}/wake`, query: {}, body: undefined });
    });
});

/** Filled by the read half of `TessieVehicle`. */
const READS = new Set<string>([]);

describe("wait_for_completion and max_attempts", () => {
    it("come from the client", async () => {
        const { fetch, vehicle } = makeVehicle({ wait_for_completion: false, max_attempts: 5 });

        await vehicle.lock();
        expect(sent(fetch).query).toEqual({ wait_for_completion: "false", max_attempts: "5" });
    });

    it("explicit false and zero win over the client's", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.lock(false, 0);
        expect(sent(fetch).query).toEqual({ wait_for_completion: "false", max_attempts: "0" });
    });

    it("tessie_* methods take max_attempts first", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.tessie_set_cop_temp(3, 2, false);
        expect(sent(fetch).query).toEqual({ cop_temp: "3", max_attempts: "2", wait_for_completion: "false" });
    });

    it("tessie_set_cabin_overheat_protection", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.tessie_set_cabin_overheat_protection(true, true, 2, false);
        expect(sent(fetch).query).toEqual({ on: "true", fan_only: "true", max_attempts: "2", wait_for_completion: "false" });
    });

    it.each([
        ["tessie_set_bioweapon_mode", (v: TessieVehicle) => v.tessie_set_bioweapon_mode(true, 2, false), { on: "true" }],
        ["tessie_set_climate_keeper_mode", (v: TessieVehicle) => v.tessie_set_climate_keeper_mode(2, 2, false), { mode: "2" }],
        ["tessie_set_charging_amps", (v: TessieVehicle) => v.tessie_set_charging_amps(16, 2, false), { amps: "16" }],
        ["tessie_trigger_homelink", (v: TessieVehicle) => v.tessie_trigger_homelink(2, false), {}],
        ["tessie_schedule_software_update", (v: TessieVehicle) => v.tessie_schedule_software_update(3600, 2, false), { in_seconds: "3600" }],
    ])("%s", async (_name, call, params) => {
        const { fetch, vehicle } = makeVehicle();

        await call(vehicle);
        expect(sent(fetch).query).toEqual({ ...params, max_attempts: "2", wait_for_completion: "false" });
    });
});

describe("TessieVehicle command parameters", () => {
    it("tessie_set_scheduled_departure", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.tessie_set_scheduled_departure(true, 480, {
            preconditioning_enabled: true,
            end_off_peak_time: 360,
            max_attempts: 2,
            wait_for_completion: false,
        });
        expect(sent(fetch).query).toEqual({
            enable: "true",
            departure_time: "480",
            preconditioning_enabled: "true",
            preconditioning_weekdays_only: "false",
            off_peak_charging_enabled: "false",
            off_peak_charging_weekdays_only: "false",
            end_off_peak_time: "360",
            max_attempts: "2",
            wait_for_completion: "false",
        });
    });

    it("tessie_add_charge_schedule uses the documented parameters", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.tessie_add_charge_schedule("Weekdays", true, true, false, 1.23, 4.56, {
            start_time: 360,
            one_time: true,
            id: 7,
            max_attempts: 2,
            wait_for_completion: false,
        });
        expect(sent(fetch).query).toEqual({
            days_of_week: "Weekdays",
            enabled: "true",
            start_enabled: "true",
            end_enabled: "false",
            lat: "1.23",
            lon: "4.56",
            start_time: "360",
            one_time: "true",
            id: "7",
            max_attempts: "2",
            wait_for_completion: "false",
        });
    });

    it("tessie_add_charge_schedule validates the enabled times", async () => {
        const { fetch, vehicle } = makeVehicle();

        await expect(vehicle.tessie_add_charge_schedule("Weekdays", true, false, false, 1.23, 4.56)).rejects.toThrow(
            "Either start_enabled or end_enabled must be True",
        );
        await expect(vehicle.tessie_add_charge_schedule("Weekdays", true, true, false, 1.23, 4.56)).rejects.toThrow(
            "start_time is required when start_enabled is True",
        );
        await expect(vehicle.tessie_add_charge_schedule("Weekdays", true, false, true, 1.23, 4.56)).rejects.toThrow(
            "end_time is required when end_enabled is True",
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    it("tessie_add_precondition_schedule uses the documented parameters", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.tessie_add_precondition_schedule("Weekdays", true, 1.23, 4.56, 420, {
            one_time: true,
            id: 7,
            max_attempts: 2,
            wait_for_completion: false,
        });
        expect(sent(fetch).query).toEqual({
            days_of_week: "Weekdays",
            enabled: "true",
            lat: "1.23",
            lon: "4.56",
            precondition_time: "420",
            one_time: "true",
            id: "7",
            max_attempts: "2",
            wait_for_completion: "false",
        });
    });

    it("enable_valet omits an unset pin and keeps a zero", async () => {
        const unset = makeVehicle();
        await unset.vehicle.enable_valet();
        expect(sent(unset.fetch).query).toEqual(DEFAULTS);

        const zero = makeVehicle();
        await zero.vehicle.enable_valet(0);
        expect(sent(zero.fetch).query).toEqual({ ...DEFAULTS, pin: "0" });
    });

    it("remote_boombox sends a sound when given", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.remote_boombox(2);
        expect(sent(fetch).query).toEqual({ ...DEFAULTS, sound: "2" });
    });

    it("set_speed_limit prefers mph", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.set_speed_limit(50, undefined, undefined, 70);
        expect(sent(fetch).query).toEqual({ ...DEFAULTS, mph: "70" });
    });

    it("set_speed_limit requires a limit", async () => {
        const { fetch, vehicle } = makeVehicle();

        await expect(vehicle.set_speed_limit()).rejects.toThrow("mph or limit_mph is required");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("share takes a locale", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.share("1 Tesla Road", "en-AU");
        expect(sent(fetch).query.locale).toBe("en-AU");
    });
});

describe("TessieVehicles", () => {
    it("is the Tessie vehicles factory, and create returns a TessieVehicle", () => {
        const { api, vehicle } = makeVehicle();

        expect(api.vehicles).toBeInstanceOf(TessieVehicles);
        expect(vehicle).toBeInstanceOf(TessieVehicle);
        expect(vehicle).toBeInstanceOf(VehicleSpecific);
        expect(api.vehicles.byVin.get(VIN)).toBe(vehicle);
    });

    it("has no Fleet or signed factories", () => {
        const vehicles = makeApi().api.vehicles as unknown as Record<string, unknown>;

        expect(vehicles.createFleet).toBeUndefined();
        expect(vehicles.createSigned).toBeUndefined();
        expect(vehicles.createBluetooth).toBeUndefined();
        expect(vehicles.specific).toBeUndefined();
        expect(vehicles.specificSigned).toBeUndefined();
    });
});
