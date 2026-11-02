import { describe, expect, it, vi } from "vitest";
import {
    ClosureState,
    DistanceUnit,
    EnergyDisplayFormat,
    SeatHeaterLevel,
    TemperatureUnit,
    TimeDisplayFormat,
    TirePressureUnit,
} from "../src/const.js";
import Teslemetry from "../src/teslemetry.js";
import { TeslemetryVehicle, TeslemetryVehicles } from "../src/teslemetryvehicle.js";
import VehicleSpecific from "../src/vehiclespecific.js";

const VIN = "5YJ3E1EA1JF000001";
const SERVER = "https://api.teslemetry.com";
const CUSTOM = `api/1/vehicles/${VIN}/custom_command`;

function fakeFetch() {
    return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ response: { result: true } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }),
    );
}

function makeVehicle() {
    const fetch = fakeFetch();
    const api = new Teslemetry("test-token", "api", { fetch: fetch as unknown as typeof globalThis.fetch });
    return { fetch, api, vehicle: api.vehicles.create(VIN) };
}

/** The single request sent: verb, URL and decoded body. */
function sent(fetch: ReturnType<typeof fakeFetch>) {
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0];
    return { method: init?.method, url, body: init?.body == null ? undefined : JSON.parse(init.body as string) };
}

type Call = (vehicle: TeslemetryVehicle) => Promise<unknown>;

/** method name, call, verb, path below the server, and body (undefined for none). */
const ROUTES: [string, Call, string, string, unknown?][] = [
    ["ping", (v) => v.ping(), "POST", `${CUSTOM}/ping`],
    ["data_refresh", (v) => v.data_refresh(), "GET", `api/refresh/${VIN}`],
    ["closure", (v) => v.closure({ front_trunk: ClosureState.OPEN }), "POST", `${CUSTOM}/closure`, { frontTrunk: "open" }],
    ["open_rear_trunk", (v) => v.open_rear_trunk(), "POST", `${CUSTOM}/closure`, { rearTrunk: "open" }],
    ["close_rear_trunk", (v) => v.close_rear_trunk(), "POST", `${CUSTOM}/closure`, { rearTrunk: "close" }],
    ["open_tonneau", (v) => v.open_tonneau(), "POST", `${CUSTOM}/closure`, { tonneau: "open" }],
    ["close_tonneau", (v) => v.close_tonneau(), "POST", `${CUSTOM}/closure`, { tonneau: "close" }],
    ["stop_tonneau", (v) => v.stop_tonneau(), "POST", `${CUSTOM}/closure`, { tonneau: "stop" }],
    ["seat_heater", (v) => v.seat_heater({ front_left: SeatHeaterLevel.HIGH, third_row_right: SeatHeaterLevel.OFF }), "POST", `${CUSTOM}/seat_heater`, { frontLeft: "high", thirdRowRight: "off" }],
    ["charge_on_solar", (v) => v.charge_on_solar(false, 0, 80), "POST", `${CUSTOM}/charge_on_solar`, { enabled: false, lowerChargeLimit: 0, upperChargeLimit: 80 }],
    ["get_charge_on_solar", (v) => v.get_charge_on_solar(), "GET", `${CUSTOM}/charge_on_solar`],
    ["dashcam_save", (v) => v.dashcam_save(), "POST", `${CUSTOM}/dashcam_save`],
    ["play_video", (v) => v.play_video("https://example.com/v"), "POST", `${CUSTOM}/play_video`, { url: "https://example.com/v" }],
    ["stop_light_show", (v) => v.stop_light_show(), "POST", `${CUSTOM}/stop_light_show`],
    ["start_light_show", (v) => v.start_light_show(0, 1000, 0.5, false), "POST", `${CUSTOM}/start_light_show`, { show_index: 0, start_time: 1000, volume: 0.5, dance_moves: false }],
    ["clear_pin_to_drive", (v) => v.clear_pin_to_drive("1234"), "POST", `${CUSTOM}/clear_pin_to_drive`, { pin: "1234" }],
    ["remove_key", (v) => v.remove_key(), "POST", `${CUSTOM}/remove_key`],
    ["set_front_zone_lights", (v) => v.set_front_zone_lights(2), "POST", `${CUSTOM}/front_zone_light`, { level: 2 }],
    ["set_rear_zone_lights", (v) => v.set_rear_zone_lights(1), "POST", `${CUSTOM}/rear_zone_light`, { level: 1 }],
    ["set_outlets", (v) => v.set_outlets(1), "POST", `${CUSTOM}/set_outlets`, { request: 1 }],
    ["set_outlet_soc_limit", (v) => v.set_outlet_soc_limit(80), "POST", `${CUSTOM}/set_outlet_soc_limit`, { percent: 80 }],
    ["set_power_feed", (v) => v.set_power_feed(3), "POST", `${CUSTOM}/set_power_feed`, { request: 3 }],
    ["set_power_feed_soc_limit", (v) => v.set_power_feed_soc_limit(90), "POST", `${CUSTOM}/set_power_feed_soc_limit`, { percent: 90 }],
    ["set_lightbar_brightness", (v) => v.set_lightbar_brightness(50), "POST", `${CUSTOM}/set_lightbar_brightness`, { brightness: 50 }],
    ["set_lightbar_middle", (v) => v.set_lightbar_middle(true), "POST", `${CUSTOM}/set_lightbar_middle`, { on: true }],
    ["set_lightbar_ditch", (v) => v.set_lightbar_ditch(false), "POST", `${CUSTOM}/set_lightbar_ditch`, { on: false }],
    ["set_trailer_light_test", (v) => v.set_trailer_light_test(true), "POST", `${CUSTOM}/set_trailer_light_test`, { on: true }],
    ["set_truck_bed_light_auto", (v) => v.set_truck_bed_light_auto(true), "POST", `${CUSTOM}/set_truck_bed_light_auto`, { on: true }],
    ["set_truck_bed_light_brightness", (v) => v.set_truck_bed_light_brightness(75), "POST", `${CUSTOM}/set_truck_bed_light_brightness`, { brightness: 75 }],
    ["set_powershare_feature", (v) => v.set_powershare_feature(true), "POST", `${CUSTOM}/set_powershare_feature`, { on: true }],
    ["set_powershare_request", (v) => v.set_powershare_request(false), "POST", `${CUSTOM}/set_powershare_request`, { on: false }],
    ["set_powershare_discharge_limit", (v) => v.set_powershare_discharge_limit(20), "POST", `${CUSTOM}/set_powershare_discharge_limit`, { percent: 20 }],
    ["set_recirculation", (v) => v.set_recirculation(true), "POST", `${CUSTOM}/hvac_recirculation`, { on: true }],
    ["set_tent_mode", (v) => v.set_tent_mode(true), "POST", `${CUSTOM}/set_tent_mode`, { on: true }],
    ["set_suspension_level", (v) => v.set_suspension_level(4), "POST", `${CUSTOM}/set_suspension_level`, { level: 4 }],
    ["set_low_power_mode", (v) => v.set_low_power_mode(false), "POST", `${CUSTOM}/set_low_power_mode`, { on: false }],
    ["set_keep_accessory_power_mode", (v) => v.set_keep_accessory_power_mode(true), "POST", `${CUSTOM}/set_keep_accessory_power_mode`, { on: true }],
    ["set_temperature_unit", (v) => v.set_temperature_unit(TemperatureUnit.CELSIUS), "POST", `${CUSTOM}/set_temperature_unit`, { unit: 1 }],
    ["set_distance_unit", (v) => v.set_distance_unit(DistanceUnit.MILES), "POST", `${CUSTOM}/set_distance_unit`, { unit: 0 }],
    ["set_time_display_format", (v) => v.set_time_display_format(TimeDisplayFormat.HOUR_24), "POST", `${CUSTOM}/set_time_display_format`, { format: 1 }],
    ["set_tire_pressure_unit", (v) => v.set_tire_pressure_unit(TirePressureUnit.BAR), "POST", `${CUSTOM}/set_tire_pressure_unit`, { unit: 1 }],
    ["set_energy_display_format", (v) => v.set_energy_display_format(EnergyDisplayFormat.DISTANCE), "POST", `${CUSTOM}/set_energy_display_format`, { format: 1 }],
    ["parental_controls", (v) => v.parental_controls(true, "1234"), "POST", `${CUSTOM}/parental_controls`, { activate: true, pin: "1234" }],
    ["parental_controls_clear_pin", (v) => v.parental_controls_clear_pin("1234"), "POST", `${CUSTOM}/parental_controls_clear_pin`, { pin: "1234" }],
    ["parental_controls_clear_pin_admin", (v) => v.parental_controls_clear_pin_admin(), "POST", `${CUSTOM}/parental_controls_clear_pin_admin`],
    ["parental_controls_enable_setting", (v) => v.parental_controls_enable_setting(1, false), "POST", `${CUSTOM}/parental_controls_enable_setting`, { setting: 1, enable: false }],
    ["parental_controls_set_speed_limit", (v) => v.parental_controls_set_speed_limit(65), "POST", `${CUSTOM}/parental_controls_set_speed_limit`, { limit_mph: 65 }],
    ["navigation_gps_destination_request", (v) => v.navigation_gps_destination_request(37.323, -122.0322, "Tesla HQ", 0), "POST", `${CUSTOM}/navigation_gps_destination`, { lat: 37.323, lon: -122.0322, destination: "Tesla HQ", order: 0 }],
    ["auto_secure_vehicle", (v) => v.auto_secure_vehicle(), "POST", `${CUSTOM}/auto_secure_vehicle`],
    ["cancel_soh_test", (v) => v.cancel_soh_test(), "POST", `${CUSTOM}/cancel_soh_test`],
    ["get_nearby_charging_sites", (v) => v.get_nearby_charging_sites(5, 25, false), "POST", `${CUSTOM}/get_nearby_charging_sites`, { count: 5, radius: 25, detail: false }],
    ["get_rate_tariff", (v) => v.get_rate_tariff(), "POST", `${CUSTOM}/get_rate_tariff`],
    ["trigger_rate_tariff_update", (v) => v.trigger_rate_tariff_update(), "POST", `${CUSTOM}/set_rate_tariff`],
];

/** Methods with their own tests below, or helpers that are not routes. */
const NOT_IN_TABLE = new Set(["constructor", "_request", "_custom_command", "server_side_polling", "telemetry", "create_telemetry_tracker"]);

describe("TeslemetryVehicle routes", () => {
    it.each(ROUTES)("%s", async (_name, call, method, path, body) => {
        const { fetch, vehicle } = makeVehicle();

        await expect(call(vehicle)).resolves.toEqual({ response: { result: true } });
        expect(sent(fetch)).toEqual({ method, url: `${SERVER}/${path}`, body });
    });

    it("covers every method", () => {
        const methods = Object.getOwnPropertyNames(TeslemetryVehicle.prototype).filter((name) => !NOT_IN_TABLE.has(name));
        expect(methods.sort()).toEqual(ROUTES.map(([name]) => name).sort());
    });

    it.each([
        [true, "POST"],
        [false, "DELETE"],
        [undefined, "GET"],
    ])("server_side_polling(%s) uses %s and unwraps the response", async (value, method) => {
        const { fetch, vehicle } = makeVehicle();

        await expect(vehicle.server_side_polling(value)).resolves.toEqual({ result: true });
        expect(sent(fetch)).toEqual({ method, url: `${SERVER}/api/auto/${VIN}`, body: undefined });
    });
});

describe("optional bodies", () => {
    it("closure omits none keys", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.closure({
            front_driver_door: ClosureState.NONE,
            front_passenger_door: ClosureState.CLOSE,
            rear_driver_door: ClosureState.MOVE,
            rear_passenger_door: ClosureState.STOP,
            rear_trunk: ClosureState.NONE,
            charge_port: ClosureState.OPEN,
        });
        expect(sent(fetch).body).toEqual({
            frontPassengerDoor: "close",
            rearDriverDoor: "move",
            rearPassengerDoor: "stop",
            chargePort: "open",
        });
    });

    it("closure maps every key", async () => {
        const { fetch, vehicle } = makeVehicle();
        const open = ClosureState.OPEN;

        await vehicle.closure({
            front_driver_door: open,
            front_passenger_door: open,
            rear_driver_door: open,
            rear_passenger_door: open,
            rear_trunk: open,
            front_trunk: open,
            charge_port: open,
            tonneau: open,
        });
        expect(sent(fetch).body).toEqual({
            frontDriverDoor: "open",
            frontPassengerDoor: "open",
            rearDriverDoor: "open",
            rearPassengerDoor: "open",
            rearTrunk: "open",
            frontTrunk: "open",
            chargePort: "open",
            tonneau: "open",
        });
    });

    it("closure with nothing to do sends an empty object", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.closure();
        expect(sent(fetch).body).toEqual({});
    });

    it("seat_heater maps every key and omits unset seats", async () => {
        const { fetch, vehicle } = makeVehicle();
        const low = SeatHeaterLevel.LOW;

        await vehicle.seat_heater({
            front_left: low,
            front_right: low,
            rear_left: low,
            rear_right: low,
            rear_left_back: low,
            rear_center: low,
            rear_right_back: low,
            third_row_left: low,
            third_row_right: low,
        });
        expect(sent(fetch).body).toEqual({
            frontLeft: "low",
            frontRight: "low",
            rearLeft: "low",
            rearRight: "low",
            rearLeftBack: "low",
            rearCenter: "low",
            rearRightBack: "low",
            thirdRowLeft: "low",
            thirdRowRight: "low",
        });
    });

    it("charge_on_solar omits unset keys", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.charge_on_solar(undefined, 20);
        expect(sent(fetch).body).toEqual({ lowerChargeLimit: 20 });
    });

    it("start_light_show sends only show_index by default", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.start_light_show(3);
        expect(sent(fetch).body).toEqual({ show_index: 3 });
    });

    it("get_nearby_charging_sites omits unset fields", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.get_nearby_charging_sites();
        expect(sent(fetch).body).toEqual({});
    });
});

describe("TeslemetryVehicles", () => {
    it("is the Teslemetry vehicles factory, and create returns a TeslemetryVehicle", () => {
        const { api, vehicle } = makeVehicle();

        expect(api.vehicles).toBeInstanceOf(TeslemetryVehicles);
        expect(vehicle).toBeInstanceOf(TeslemetryVehicle);
        expect(vehicle).toBeInstanceOf(VehicleSpecific);
        expect(api.vehicles.byVin.get(VIN)).toBe(vehicle);
    });

    it("still reaches the inherited Fleet REST commands through Teslemetry", async () => {
        const { fetch, vehicle } = makeVehicle();

        await vehicle.door_lock();
        expect(sent(fetch)).toEqual({ method: "POST", url: `${SERVER}/api/1/vehicles/${VIN}/command/door_lock`, body: undefined });
    });

    it("has no Fleet or signed factories", () => {
        const { api } = makeVehicle();
        const vehicles = api.vehicles as unknown as Record<string, unknown>;

        expect(vehicles.createFleet).toBeUndefined();
        expect(vehicles.createSigned).toBeUndefined();
        expect(vehicles.createBluetooth).toBeUndefined();
        expect(vehicles.specific).toBeUndefined();
        expect(vehicles.specificSigned).toBeUndefined();
    });

    it("lets a subclass replace the vehicle type", () => {
        class FakeVehicle extends TeslemetryVehicle {}
        class FakeVehicles extends TeslemetryVehicles {
            static override Vehicle = FakeVehicle;
        }
        class FakeApi extends Teslemetry {
            static override Vehicles = FakeVehicles;
        }

        expect(new FakeApi("t").vehicles.create(VIN)).toBeInstanceOf(FakeVehicle);
    });
});
