import { describe, expect, it, vi } from "vitest";
import { DAY_OF_WEEK_BITS, days_of_week_mask } from "../src/index.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";

const VIN = "5YJXCAE43LF123456";

function makeVehicle() {
    const api = new TeslaFleetApi({ accessToken: "test-token", region: "na" });
    const request = vi.spyOn(api, "_request").mockResolvedValue({ response: { result: true, reason: "" } });
    return { vehicle: new Vehicle(api).specific(VIN), request };
}

/** Mirrors `_request`'s own null/undefined stripping, so the asserted body is what goes on the wire. */
function sentBody(json: Record<string, any> | null) {
    return json && Object.fromEntries(Object.entries(json).filter(([, v]) => v != null));
}

describe("VehicleSpecific REST routes match python-tesla-fleet-api", () => {
    it.each([
        [
            "navigation_waypoints_request",
            (v: any) => v.navigation_waypoints_request("refId:a,refId:b"),
            `api/1/vehicles/${VIN}/command/navigation_waypoints_request`,
            { waypoints: "refId:a,refId:b" },
        ],
        [
            "fleet_telemetry_config_jws",
            (v: any) => v.fleet_telemetry_config_jws([VIN], "jws.token.sig"),
            "api/1/vehicles/fleet_telemetry_config_jws",
            { vins: [VIN], token: "jws.token.sig" },
        ],
        [
            "add_charge_schedule (start only)",
            (v: any) => v.add_charge_schedule("Mon,Tues", true, -33.8, 151.2, 120),
            `api/1/vehicles/${VIN}/command/add_charge_schedule`,
            { days_of_week: "Mon,Tues", enabled: true, end_enabled: false, lat: -33.8, lon: 151.2, start_enabled: true, start_time: 120 },
        ],
        [
            "add_charge_schedule (all fields)",
            (v: any) => v.add_charge_schedule(127, false, 1, 2, 60, 360, true, 7),
            `api/1/vehicles/${VIN}/command/add_charge_schedule`,
            {
                days_of_week: 127,
                enabled: false,
                end_enabled: true,
                lat: 1,
                lon: 2,
                start_enabled: true,
                start_time: 60,
                end_time: 360,
                id: 7,
                one_time: true,
            },
        ],
        [
            "add_precondition_schedule",
            (v: any) => v.add_precondition_schedule("All", true, 1, 2, 450),
            `api/1/vehicles/${VIN}/command/add_precondition_schedule`,
            { days_of_week: "All", enabled: true, lat: 1, lon: 2, precondition_time: 450 },
        ],
        [
            "add_precondition_schedule (id, one_time)",
            (v: any) => v.add_precondition_schedule(62, false, 1, 2, 450, 3, false),
            `api/1/vehicles/${VIN}/command/add_precondition_schedule`,
            { days_of_week: 62, enabled: false, lat: 1, lon: 2, precondition_time: 450, id: 3, one_time: false },
        ],
        [
            "remove_charge_schedule",
            (v: any) => v.remove_charge_schedule(5),
            `api/1/vehicles/${VIN}/command/remove_charge_schedule`,
            { id: 5 },
        ],
        [
            "remove_precondition_schedule",
            (v: any) => v.remove_precondition_schedule(6),
            `api/1/vehicles/${VIN}/command/remove_precondition_schedule`,
            { id: 6 },
        ],
        [
            "batch_remove_charge_schedules",
            (v: any) => v.batch_remove_charge_schedules(true, false, true),
            `api/1/vehicles/${VIN}/command/batch_remove_charge_schedules`,
            { home: true, work: false, other: true },
        ],
        [
            "batch_remove_precondition_schedules",
            (v: any) => v.batch_remove_precondition_schedules(false, true, false),
            `api/1/vehicles/${VIN}/command/batch_remove_precondition_schedules`,
            { home: false, work: true, other: false },
        ],
    ])("%s", async (_name, call, path, body) => {
        const { vehicle, request } = makeVehicle();
        await call(vehicle);
        expect(request).toHaveBeenCalledTimes(1);
        const [method, sentPath, params, json] = request.mock.calls[0];
        expect(method).toBe("POST");
        expect(sentPath).toBe(path);
        expect(params).toBeNull();
        expect(sentBody(json)).toEqual(body);
    });

    it("add_charge_schedule requires a start_time or end_time", async () => {
        const { vehicle, request } = makeVehicle();
        await expect(vehicle.add_charge_schedule("All", true, 1, 2)).rejects.toThrow(
            "Either start_time or end_time or both must be provided",
        );
        expect(request).not.toHaveBeenCalled();
    });
});

describe("days_of_week_mask", () => {
    it.each([
        ["Sun", 1],
        ["MONDAY", 2],
        ["tues", 4],
        ["Wednesday", 8],
        ["Thurs", 16],
        ["fri", 32],
        ["Saturday", 64],
        ["All", 127],
        ["Weekdays", 62],
        ["Mon,Wed,Fri", 42],
        [" Sat , Sunday ", 65],
        ["Mon,Monday", 2],
        ["All,Mon", 127],
        ["42", 42],
        [" 7 ", 7],
        [100, 100],
    ])("%j -> %i", (input, expected) => {
        expect(days_of_week_mask(input)).toBe(expected);
    });

    it("rejects an unknown day name", () => {
        expect(() => days_of_week_mask("Mon,Funday")).toThrow("Invalid day of week: Funday");
        expect(() => days_of_week_mask("")).toThrow("Invalid day of week: ");
    });

    it("exposes the Python name table", () => {
        expect(DAY_OF_WEEK_BITS.ALL).toBe(127);
        expect(DAY_OF_WEEK_BITS.WEEKDAYS).toBe(62);
    });
});
