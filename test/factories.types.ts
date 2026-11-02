// Compile-time checks, run by `npx tsc -p tsconfig.test.json --noEmit`. Never
// executed. An unused `@ts-expect-error` is itself an error, so removing a
// shadow from TeslemetryVehicles or TessieVehicles fails that command.
import TeslaFleetApi from "../src/teslafleetapi.js";
import Teslemetry from "../src/teslemetry.js";
import { TeslemetryVehicle, TeslemetryVehicles } from "../src/teslemetryvehicle.js";
import Tessie from "../src/tessie.js";
import { TessieVehicle, TessieVehicles } from "../src/tessievehicle.js";
import VehicleSigned from "../src/vehiclesigned.js";
import VehicleSpecific from "../src/vehiclespecific.js";

const VIN = "5YJXCAE43LF123456";

export function teslemetryFactories(api: Teslemetry, vehicles: TeslemetryVehicles): TeslemetryVehicle {
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    api.vehicles.createFleet(VIN);
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    api.vehicles.createSigned(VIN);
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    api.vehicles.specific(VIN);
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    api.vehicles.specificSigned(VIN);

    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    vehicles.createFleet(VIN);
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    vehicles.createSigned(VIN);
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    vehicles.specific(VIN);
    // @ts-expect-error Teslemetry cannot use the Fleet API directly
    vehicles.specificSigned(VIN);

    return api.vehicles.create(VIN);
}

export function teslemetryVehicle(vehicle: TeslemetryVehicle): void {
    // @ts-expect-error a vehicle is not a factory
    vehicle.createFleet(VIN);
    // @ts-expect-error a vehicle is not a factory
    vehicle.createSigned(VIN);
    // @ts-expect-error a vehicle is not a factory
    vehicle.specific(VIN);
    // @ts-expect-error a vehicle is not a factory
    vehicle.specificSigned(VIN);
}

export function tessieFactories(api: Tessie, vehicles: TessieVehicles): TessieVehicle {
    // @ts-expect-error Tessie cannot use the Fleet API directly
    api.vehicles.createFleet(VIN);
    // @ts-expect-error Tessie cannot use the Fleet API directly
    api.vehicles.createSigned(VIN);
    // @ts-expect-error Tessie cannot use the Fleet API directly
    api.vehicles.specific(VIN);
    // @ts-expect-error Tessie cannot use the Fleet API directly
    api.vehicles.specificSigned(VIN);

    // @ts-expect-error Tessie cannot use the Fleet API directly
    vehicles.createFleet(VIN);
    // @ts-expect-error Tessie cannot use the Fleet API directly
    vehicles.createSigned(VIN);
    // @ts-expect-error Tessie cannot use the Fleet API directly
    vehicles.specific(VIN);
    // @ts-expect-error Tessie cannot use the Fleet API directly
    vehicles.specificSigned(VIN);

    return api.vehicles.create(VIN);
}

export function tessieVehicle(vehicle: TessieVehicle): void {
    // @ts-expect-error a vehicle is not a factory
    vehicle.createFleet(VIN);
    // @ts-expect-error a vehicle is not a factory
    vehicle.createSigned(VIN);
    // @ts-expect-error a vehicle is not a factory
    vehicle.specific(VIN);
    // @ts-expect-error a vehicle is not a factory
    vehicle.specificSigned(VIN);
}

/** The control: the same calls compile on the Fleet client, so the errors above come from the shadows. */
export function fleetFactories(api: TeslaFleetApi): [VehicleSpecific, VehicleSigned, VehicleSpecific, VehicleSigned] {
    const vehicles = api.vehicles!;
    return [vehicles.createFleet(VIN), vehicles.createSigned(VIN), vehicles.specific(VIN), vehicles.specificSigned(VIN)];
}
