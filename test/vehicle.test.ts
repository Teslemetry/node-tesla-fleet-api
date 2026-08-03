import { describe, expect, it } from "vitest";
import { Models } from "../src/index.js";
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
        ["T", "Semi"],
        ["A", "Cybercab"],
    ])("maps code %s to %s", (code, expected) => {
        expect(Models[code]).toBe(expected);
    });
});
