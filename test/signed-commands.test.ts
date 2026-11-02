import { describe, expect, it } from "vitest";
import { ClosureMoveTypeE, RKEActionE, UnsignedMessage } from "@teslemetry/tesla-protocol/command/vcsec";
import { VehicleAction } from "@teslemetry/tesla-protocol/command/car_server";
import { FakeVehicleCommands } from "./helpers/testcommands.js";

type Call = (vehicle: FakeVehicleCommands) => Promise<unknown>;

/** Commands the Infotainment computer takes, each with the whole `VehicleAction` it must decode to. */
const infotainment: [name: string, call: Call, expected: Parameters<typeof VehicleAction.create>[0]][] = [
    // ENG-35 / SGN-6
    ["media_volume_up", (v) => v.media_volume_up(), { mediaUpdateVolume: { volumeDelta: 1 } }],
    [
        "navigation_gps_destination_request",
        (v) => v.navigation_gps_destination_request(37.5, -122.25, "Home", 2),
        { navigationGpsDestinationRequest: { lat: 37.5, lon: -122.25, destination: "Home", order: 2 } },
    ],
    [
        "navigation_gps_destination_request, replacing the trip by default",
        (v) => v.navigation_gps_destination_request(37.5, -122.25, "Home"),
        { navigationGpsDestinationRequest: { lat: 37.5, lon: -122.25, destination: "Home", order: 0 } },
    ],
    ["navigation_route", (v) => v.navigation_route(), { navigationRouteAction: {} }],
    ["navigation_waypoints_request", (v) => v.navigation_waypoints_request("refId:a,refId:b"), { navigationWaypointsRequest: { waypoints: "refId:a,refId:b" } }],
    ["reset_pin_to_drive_admin", (v) => v.reset_pin_to_drive_admin(), { vehicleControlResetPinToDriveAdminAction: {} }],
    ["clear_pin_to_drive_admin", (v) => v.clear_pin_to_drive_admin("1234"), { vehicleControlResetPinToDriveAdminAction: {} }],
];

/** Commands the Vehicle Security computer takes, each with the whole `UnsignedMessage` it must decode to. */
const vehicleSecurity: [name: string, call: Call, expected: Parameters<typeof UnsignedMessage.create>[0]][] = [
    // ENG-35 / SGN-6
    ["actuate_trunk, front", (v) => v.actuate_trunk("front"), { closureMoveRequest: { frontTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE } }],
    ["actuate_trunk, rear", (v) => v.actuate_trunk("rear"), { closureMoveRequest: { rearTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE } }],
    ["open_tonneau", (v) => v.open_tonneau(), { closureMoveRequest: { tonneau: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN } }],
    ["close_tonneau", (v) => v.close_tonneau(), { closureMoveRequest: { tonneau: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE } }],
    ["stop_tonneau", (v) => v.stop_tonneau(), { closureMoveRequest: { tonneau: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_STOP } }],
    ["auto_secure_vehicle", (v) => v.auto_secure_vehicle(), { RKEAction: RKEActionE.RKE_ACTION_AUTO_SECURE_VEHICLE }],
];

describe("signed commands round-trip through FakeVehicle", () => {
    it.each(infotainment)("%s", async (_name, call, expected) => {
        const vehicle = new FakeVehicleCommands();

        await expect(call(vehicle)).resolves.toMatchObject({ response: { result: true, reason: "" } });

        expect(vehicle.fakeVehicle.vcsecCommands).toEqual([]);
        expect(vehicle.fakeVehicle.infotainmentActions.map((action) => action.vehicleAction)).toEqual([VehicleAction.create(expected)]);
    });

    it.each(vehicleSecurity)("%s", async (_name, call, expected) => {
        const vehicle = new FakeVehicleCommands();

        await expect(call(vehicle)).resolves.toMatchObject({ response: { result: true, reason: "" } });

        expect(vehicle.fakeVehicle.infotainmentActions).toEqual([]);
        expect(vehicle.fakeVehicle.vcsecCommands).toEqual([UnsignedMessage.create(expected)]);
    });

    it("rejects an unknown trunk before sending anything", async () => {
        const vehicle = new FakeVehicleCommands();

        await expect(vehicle.actuate_trunk("middle" as "front")).rejects.toThrow("Invalid trunk");

        expect(vehicle.fakeVehicle.vcsecCommands).toEqual([]);
    });
});
