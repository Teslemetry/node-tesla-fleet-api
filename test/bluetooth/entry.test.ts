import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BluetoothCloudUnavailableError } from "../../src/exceptions.js";
import { TeslaBluetooth, VehicleBluetooth, VehiclesBluetooth, get_name, name_matches_vin, valid_name } from "../../src/bluetooth/index.js";
import Vehicle from "../../src/vehicle.js";
import TeslaFleetApi from "../../src/teslafleetapi.js";

const ROOT = resolve(import.meta.dirname, "../..");

/** Every module `entry` reaches by a runtime import, with the bare package names it uses. */
function walk(entry: string): { modules: Set<string>; packages: Set<string> } {
    const modules = new Set<string>();
    const packages = new Set<string>();
    const pending = [resolve(ROOT, entry)];
    for (let file = pending.pop(); file; file = pending.pop()) {
        if (modules.has(file)) continue;
        modules.add(file);
        const source = readFileSync(file, "utf8");
        for (const [, type, specifier] of source.matchAll(/^\s*(?:import|export)\s+(type\s+)?(?:[^"';]*?\s+from\s+)?["']([^"']+)["']/gm)) {
            if (type) continue;
            if (specifier!.startsWith(".")) {
                pending.push(resolve(dirname(file), specifier!.replace(/\.js$/, ".ts")));
            } else {
                packages.add(specifier!);
            }
        }
    }
    return { modules, packages };
}

describe("the entry points", () => {
    it.each(["src/index.ts", "src/router/index.ts", "src/const.ts", "src/tariff.ts"])("%s does not load src/bluetooth", (entry) => {
        const { modules } = walk(entry);
        expect(modules.size).toBeGreaterThan(0);
        expect([...modules].filter((file) => file.includes("/src/bluetooth/"))).toEqual([]);
    });

    it("walks the root entry far enough to mean it", () => {
        expect(walk("src/index.ts").modules).toContain(resolve(ROOT, "src/vehiclesigned.ts"));
        expect(walk("src/bluetooth/index.ts").modules).toContain(resolve(ROOT, "src/bluetooth/vehiclebluetooth.ts"));
    });

    it("leaves ./bluetooth depending on tesla-protocol and Node's own modules alone", () => {
        const { packages } = walk("src/bluetooth/index.ts");
        const allowed = /^(@teslemetry\/tesla-protocol\/|node:|crypto$)/;
        expect([...packages].filter((name) => !allowed.test(name))).toEqual([]);
    });

    it.each(["homey", "noble", "esphome"])("the %s adapter statically imports no package at all", (adapter) => {
        expect([...walk(`src/bluetooth/adapters/${adapter}.ts`).packages]).toEqual([]);
    });

    it("keeps every adapter out of ./bluetooth, and so out of the root", () => {
        expect([...walk("src/bluetooth/index.ts").modules].filter((file) => file.includes("/adapters/"))).toEqual([]);
    });

    it("exports each adapter in both package.json and tsdown.config.ts", () => {
        const manifest = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
        const build = readFileSync(resolve(ROOT, "tsdown.config.ts"), "utf8");
        for (const adapter of ["homey", "noble", "esphome"]) {
            expect(manifest.exports[`./bluetooth/${adapter}`].import.default).toBe(`./dist/bluetooth/${adapter}.mjs`);
            expect(build).toContain(`"bluetooth/${adapter}": "src/bluetooth/adapters/${adapter}.ts"`);
        }
    });

    it("installs no backend: each is an optional peer, and homey is no dependency", () => {
        const manifest = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
        expect(Object.keys(manifest.dependencies)).toEqual(["@teslemetry/tesla-protocol"]);
        for (const name of Object.keys(manifest.peerDependencies)) {
            expect(manifest.peerDependenciesMeta[name].optional).toBe(true);
        }
        expect(manifest.peerDependencies.homey).toBeUndefined();
    });

    it("has no createBluetooth on the root Vehicle", () => {
        expect("createBluetooth" in Vehicle.prototype).toBe(false);
        expect("createBluetooth" in VehiclesBluetooth.prototype).toBe(true);
    });
});

describe("names", () => {
    it("derives the name in protocol.md's example", () => {
        expect(get_name("5YJS0000000000000")).toBe("S1a87a5a75f3df858C");
    });

    it.each([
        ["S1a87a5a75f3df858C", true],
        ["S1a87a5a75f3df858D", true],
        ["S1a87a5a75f3df858R", true],
        ["S1a87a5a75f3df858P", true],
        ["S1a87a5a75f3df858X", false],
        ["S1A87A5A75F3DF858C", false],
        ["S1a87a5a75f3df85C", false],
        ["xS1a87a5a75f3df858C", false],
        ["S1a87a5a75f3df858C\n", false],
    ])("valid_name(%j) is %s", (name, valid) => {
        expect(valid_name(name)).toBe(valid);
    });

    it.each(["C", "D", "R", "P"])("name_matches_vin accepts suffix %s", (suffix) => {
        expect(name_matches_vin(`S1a87a5a75f3df858${suffix}`, "5YJS0000000000000")).toBe(true);
    });

    it("name_matches_vin rejects another VIN's name and an invalid suffix", () => {
        expect(name_matches_vin(get_name("5YJXCAE43LF123456"), "5YJS0000000000000")).toBe(false);
        expect(name_matches_vin("S1a87a5a75f3df858X", "5YJS0000000000000")).toBe(false);
    });

    it("are on the client too, as in Python", () => {
        const tesla = new TeslaBluetooth();
        expect(tesla.get_name("5YJS0000000000000")).toBe("S1a87a5a75f3df858C");
        expect(tesla.valid_name("S1a87a5a75f3df858D")).toBe(true);
        expect(tesla.name_matches_vin("S1a87a5a75f3df858D", "5YJS0000000000000")).toBe(true);
    });
});

describe("TeslaBluetooth", () => {
    const VIN = "5YJXCAE43LF123456";
    const KEY = Buffer.alloc(32, 7);
    const transport = { scan: async () => [], connect: async () => Promise.reject(new Error("unused")) };

    it("is a TeslaFleetApi with only vehicles", () => {
        const tesla = new TeslaBluetooth();
        expect(tesla).toBeInstanceOf(TeslaFleetApi);
        expect(tesla.vehicles).toBeInstanceOf(VehiclesBluetooth);
        expect(tesla.energySites).toBeUndefined();
        expect(tesla.user).toBeUndefined();
        expect(tesla.partner).toBeUndefined();
        expect(tesla.charging).toBeUndefined();
        expect(tesla._transport_name).toBe("bluetooth");
    });

    it("refuses every way to the cloud", async () => {
        const tesla = new TeslaBluetooth();
        await expect(tesla._request()).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
        await expect(tesla.vehicles.list()).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
        await expect(tesla.status()).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
        await expect(tesla.partner_login("id", "secret")).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
    });

    it("creates a tracked vehicle with the client's key", () => {
        const tesla = new TeslaBluetooth({ privateKey: KEY });
        const vehicle = tesla.vehicles.createBluetooth(VIN, { transport });
        expect(vehicle).toBeInstanceOf(VehicleBluetooth);
        expect(vehicle._transport_name).toBe("bluetooth");
        expect(tesla.vehicles.byVin.get(VIN)).toBe(vehicle);
    });

    it("needs a key unless signing is turned off", () => {
        const tesla = new TeslaBluetooth();
        expect(() => tesla.vehicles.createBluetooth(VIN, { transport })).toThrow("No private key");
        expect(() => tesla.vehicles.createBluetooth(VIN, { transport, privateKey: false })).not.toThrow();
    });

    it("lets a subclass supply the vehicle type", () => {
        class Mine extends VehicleBluetooth {}
        class MyVehicles extends VehiclesBluetooth {
            static override Bluetooth = Mine;
        }
        class MyTesla extends TeslaBluetooth {
            static override Vehicles = MyVehicles;
        }
        expect(new MyTesla({ privateKey: KEY }).vehicles.createBluetooth(VIN, { transport })).toBeInstanceOf(Mine);
    });

    it("lets a cloud vehicle share a key with Bluetooth", () => {
        const api = new TeslaFleetApi({ server: "https://fleet.test", accessToken: "token" });
        const vehicle = new VehicleBluetooth(api.vehicles!, VIN, { transport, privateKey: KEY });
        expect(vehicle.parent).toBe(api.vehicles);
    });

    it("keeps the raw key off the vehicle", () => {
        const tesla = new TeslaBluetooth({ privateKey: KEY });
        const vehicle = tesla.vehicles.createBluetooth(VIN, { transport, privateKey: KEY });
        const reachable = JSON.stringify(vehicle, (key, value) => (key === "parent" || key === "transport" ? undefined : value));
        expect(reachable).not.toContain(KEY.toString("hex"));
        expect(reachable).not.toContain('"data":[7,7,7');
    });
});
