import { afterEach, describe, expect, it, vi } from "vitest";
import { Models, VehicleOffline } from "../src/index.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";

describe("Vehicle.model", () => {
    const api = new TeslaFleetApi({ accessToken: "test-token", region: "na" });
    const vehicle = new Vehicle(api);

    it.each([
        ["5YJSA1E14FF000001", "Model S"],
        ["5YJ3E1EA1KF000001", "Model 3"],
        ["5YJXCAE43LF123456", "Model X"],
        ["5YJYGDEE1MF000001", "Model Y"],
        ["7G2CEKED0RA000001", "Cybertruck"],
        ["5YJRE11B081000001", "Roadster"],
        ["7G2TARED8RA000001", "Semi"],
        ["7G2AARED8RA000001", "Cybercab"],
        ["5YJZZZ0000ZZZZZZZ", "Unknown"],
    ])("maps VIN %s to %s", (vin, expected) => {
        expect(vehicle.model(vin)).toBe(expected);
    });
});

describe("Models public export", () => {
    it.each([
        ["S", "Model S"],
        ["3", "Model 3"],
        ["X", "Model X"],
        ["Y", "Model Y"],
        ["C", "Cybertruck"],
        ["R", "Roadster"],
        ["T", "Semi"],
        ["A", "Cybercab"],
    ])("maps code %s to %s", (code, expected) => {
        expect(Models[code]).toBe(expected);
    });
});

const VIN = "5YJ3E1EA1KF000001";

function stubRequest(reply: (method: string, path: string) => unknown = () => ({ response: { result: true } })) {
    const api = new TeslaFleetApi({ accessToken: "test-token", region: "na" });
    const request = vi.spyOn(api, "_request").mockImplementation(async (method, path) => reply(method, path) as any);
    return { api, request, vehicle: new Vehicle(api).specific(VIN) };
}

describe("VehicleSpecific REST routes", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("actuate_trunk posts which_trunk to actuate_trunk", async () => {
        const { request, vehicle } = stubRequest();
        await vehicle.actuate_trunk("rear");
        expect(request).toHaveBeenCalledWith("POST", `api/1/vehicles/${VIN}/command/actuate_trunk`, null, { which_trunk: "rear" });
        expect((vehicle as any).actuate_truck).toBeUndefined();
    });

    it("fleet_telemetry_config_create posts the config for this VIN", async () => {
        const { request, vehicle } = stubRequest();
        const config = { hostname: "example.com", ca: "ca", fields: {}, alert_types: [] } as any;
        await vehicle.fleet_telemetry_config_create(config);
        expect(request).toHaveBeenCalledWith("POST", "api/1/vehicles/fleet_telemetry_config", null, { vins: [VIN], config });
        expect((vehicle as any).fleet_telemetry_config).toBeUndefined();
    });

    it("clear_pin_to_drive_admin sends the pin", async () => {
        const { request, vehicle } = stubRequest();
        await vehicle.clear_pin_to_drive_admin(1234);
        expect(request).toHaveBeenCalledWith("POST", `api/1/vehicles/${VIN}/command/clear_pin_to_drive_admin`, null, { pin: "1234" });
    });

    it("remote_seat_heater_request sends heater and level", async () => {
        const { request, vehicle } = stubRequest();
        await vehicle.remote_seat_heater_request("FRONT_RIGHT", 3);
        expect(request).toHaveBeenCalledWith("POST", `api/1/vehicles/${VIN}/command/remote_seat_heater_request`, null, { heater: 1, level: 3 });
    });

    it.each([
        ["vehicle", `api/1/vehicles/${VIN}`],
        ["vehicle_data", `api/1/vehicles/${VIN}/vehicle_data`],
        ["drivers", `api/1/vehicles/${VIN}/drivers`],
    ] as const)("%s returns the { response } envelope", async (method, path) => {
        const envelope = { response: { vin: VIN } };
        const { request, vehicle } = stubRequest(() => envelope);
        await expect(vehicle[method]()).resolves.toEqual(envelope);
        expect(request.mock.calls[0].slice(0, 2)).toEqual(["GET", path]);
    });

    it("products returns the { response } envelope", async () => {
        const envelope = { response: [{ vin: VIN }, { energy_site_id: 1 }], count: 2 };
        const { api } = stubRequest(() => envelope);
        await expect(api.products()).resolves.toEqual(envelope);
        await expect(api.products_by_type()).resolves.toEqual({ vehicles: [{ vin: VIN }], energy_sites: [{ energy_site_id: 1 }] });
    });

    it("wake_up without wait posts once and returns the envelope", async () => {
        const { request, vehicle } = stubRequest(() => ({ response: { state: "asleep" } }));
        await expect(vehicle.wake_up()).resolves.toEqual({ response: { state: "asleep" } });
        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith("POST", `api/1/vehicles/${VIN}/wake_up`);
    });

    it("wake_up({ wait: true }) polls vehicle() until online", async () => {
        vi.useFakeTimers();
        const states = ["asleep", "asleep", "online"];
        const { request, vehicle } = stubRequest(() => ({ response: { state: states.shift() } }));
        const result = vehicle.wake_up({ wait: true });
        await vi.runAllTimersAsync();
        await expect(result).resolves.toEqual({ response: { state: "online" } });
        expect(request.mock.calls.map(([m, p]) => [m, p])).toEqual([
            ["POST", `api/1/vehicles/${VIN}/wake_up`],
            ["GET", `api/1/vehicles/${VIN}`],
            ["GET", `api/1/vehicles/${VIN}`],
        ]);
    });

    it("wake_up({ wait: true }) raises VehicleOffline at the deadline", async () => {
        vi.useFakeTimers();
        const { request, vehicle } = stubRequest(() => ({ response: { state: "asleep" } }));
        const result = vehicle.wake_up({ wait: true, timeoutMs: 12_000 });
        const assertion = expect(result).rejects.toBeInstanceOf(VehicleOffline);
        await vi.runAllTimersAsync();
        await assertion;
        expect(request.mock.calls.filter(([m]) => m === "GET")).toHaveLength(3);
    });
});
