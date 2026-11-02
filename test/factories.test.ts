import { generateKeyPairSync } from "crypto";
import { describe, expect, it } from "vitest";
import Energy from "../src/energy.js";
import EnergySpecific from "../src/energyspecific.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Teslemetry from "../src/teslemetry.js";
import Vehicle from "../src/vehicle.js";
import VehicleSigned from "../src/vehiclesigned.js";
import VehicleSpecific from "../src/vehiclespecific.js";

const VIN = "5YJXCAE43LF123456";
const PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");

function fleetApi() {
    return new TeslaFleetApi({ accessToken: "test-token", region: "na" });
}

describe("vehicles factory", () => {
    it("createFleet returns a VehicleSpecific and records it by VIN", () => {
        const api = fleetApi();
        const vehicle = api.vehicles!.createFleet(VIN);

        expect(vehicle).toBeInstanceOf(VehicleSpecific);
        expect(vehicle).not.toBeInstanceOf(VehicleSigned);
        expect(api.vehicles!.byVin.get(VIN)).toBe(vehicle);
    });

    it("createSigned returns a VehicleSigned and replaces the earlier entry", () => {
        const api = fleetApi();
        api.vehicles!.createFleet(VIN);
        const vehicle = api.vehicles!.createSigned(VIN, PRIVATE_KEY);

        expect(vehicle).toBeInstanceOf(VehicleSigned);
        expect(api.vehicles!.byVin.get(VIN)).toBe(vehicle);
        expect(api.vehicles!.byVin.size).toBe(1);
    });

    it("specific and specificSigned are the legacy names for the create factories", () => {
        const api = fleetApi();
        expect(api.vehicles!.specific(VIN)).toBeInstanceOf(VehicleSpecific);
        expect(api.vehicles!.specificSigned(VIN, PRIVATE_KEY)).toBeInstanceOf(VehicleSigned);
    });

    it("uses the parent's private_key when createSigned is not given one", () => {
        const api = fleetApi();
        expect(() => api.vehicles!.createSigned(VIN)).toThrow("No private key");
        api.vehicles!.private_key = PRIVATE_KEY;
        expect(api.vehicles!.createSigned(VIN)).toBeInstanceOf(VehicleSigned);
    });

    it("lets a subclass replace the vehicle factories without overriding a constructor", () => {
        class FakeFleet extends VehicleSpecific {}
        class FakeSigned extends VehicleSigned {}
        class FakeVehicles extends Vehicle {
            static override Fleet = FakeFleet;
            static override Signed = FakeSigned;
        }
        class FakeApi extends Teslemetry {
            static override Vehicles = FakeVehicles;
        }

        const api = new FakeApi("test-token");
        expect(api.vehicles).toBeInstanceOf(FakeVehicles);
        expect(api.vehicles!.createFleet(VIN)).toBeInstanceOf(FakeFleet);
        expect(api.vehicles!.createSigned(VIN, PRIVATE_KEY)).toBeInstanceOf(FakeSigned);
        // The base class is untouched.
        expect(fleetApi().vehicles!.createFleet(VIN)).not.toBeInstanceOf(FakeFleet);
    });

    it("omits the factory when its scope is disabled", () => {
        const api = new TeslaFleetApi({ accessToken: "t", region: "na", vehicleScope: false, energyScope: false });
        expect(api.vehicles).toBeUndefined();
        expect(api.energySites).toBeUndefined();
    });
});

describe("energySites factory", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

    it("create returns an EnergySpecific and records it by id", () => {
        const api = fleetApi();
        const site = api.energySites!.create(123);

        expect(site).toBeInstanceOf(EnergySpecific);
        expect(site.energy_site_id).toBe(123);
        expect(site.din).toBeUndefined();
        expect(site.signing).toBe(false);
        expect(api.energySites!.byId.get(123)).toBe(site);
    });

    it("create accepts a private_key and din without exposing the key", () => {
        const site = fleetApi().energySites!.create(123, privateKey, "1232100-00-E--TG123");

        expect(site.din).toBe("1232100-00-E--TG123");
        expect(site.signing).toBe(true);
        expect(JSON.stringify(site, (k, v) => (k === "parent" ? undefined : v))).not.toContain("privateKey");
    });

    it("rejects a private_key without a din", () => {
        expect(() => fleetApi().energySites!.create(123, privateKey)).toThrow("requires the gateway din");
    });

    it("lets a subclass replace the site factory", () => {
        class FakeSite extends EnergySpecific {}
        class FakeSites extends Energy {
            static override Site = FakeSite;
        }
        class FakeApi extends TeslaFleetApi {
            static override EnergySites = FakeSites;
        }

        const api = new FakeApi({ accessToken: "t", region: "na" });
        expect(api.energySites!.create(1)).toBeInstanceOf(FakeSite);
    });
});
