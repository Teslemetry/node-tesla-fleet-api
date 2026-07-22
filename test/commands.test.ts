import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import Commands from "../src/commands.js";
import Vehicle from "../src/vehicle.js";
import { NotOnVehicleWhitelistError, SignedCommandFaultError } from "../src/signing/errors.js";
import { FakeVehicle } from "./helpers/fakevehicle.js";

const VIN = "5YJXCAE43LF123456";
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");

function makeParent(): Vehicle {
    // Only `model`/`pre2021`, which VehicleSpecific's constructor calls, are exercised here.
    return new Vehicle({} as any);
}

/** Concrete `Commands` whose `_send` seam is a direct in-process call into a `FakeVehicle`. */
class TestCommands extends Commands {
    fakeVehicle = new FakeVehicle();
    sendCount = 0;

    constructor(vin: string = VIN) {
        super(makeParent(), vin, OUR_PRIVATE_KEY);
        this.retryDelayMs = 0; // don't actually wait during WAIT-retry tests
    }

    protected async _send(msg: RoutableMessage, _requires: string, _expectsData?: boolean, _confirmBroadcast?: (status: VehicleStatus) => boolean): Promise<RoutableMessage> {
        this.sendCount++;
        const replyBytes = this.fakeVehicle.handle(Buffer.from(RoutableMessage.encode(msg).finish()));
        const resp = RoutableMessage.decode(replyBytes);
        this.validateAndUpdateSession(resp);
        return resp;
    }
}

describe("Commands: constructor validation", () => {
    class MinimalCommands extends Commands {
        protected async _send(): Promise<RoutableMessage> {
            throw new Error("not exercised in these tests");
        }
    }

    it("rejects a VIN that is not 17 characters", () => {
        expect(() => new MinimalCommands(makeParent(), "TOOSHORT", OUR_PRIVATE_KEY)).toThrow(/17-character/);
    });

    it("rejects construction with no private key available anywhere", () => {
        expect(() => new MinimalCommands(makeParent(), VIN)).toThrow(/No private key/);
    });

    it("falls back to the parent Vehicle's private_key when none is passed explicitly", () => {
        const parent = makeParent();
        parent.private_key = OUR_PRIVATE_KEY;
        const commands = new MinimalCommands(parent, VIN);
        expect(commands.privateKey).toBe(OUR_PRIVATE_KEY);
    });

    it("derives its own public key from the private key when none is passed", () => {
        const commands = new MinimalCommands(makeParent(), VIN, OUR_PRIVATE_KEY);
        expect(commands.publicKey).toHaveLength(65);
        expect(commands.publicKey[0]).toBe(0x04);
    });
});

describe("Commands: session handshake", () => {
    it("performs a handshake before the first command on a domain", async () => {
        const commands = new TestCommands();
        const result = await commands.door_lock();
        expect(result.response.result).toBe(true);
        // One send for the handshake, one for the signed RKE command.
        expect(commands.sendCount).toBe(2);
    });

    it("does not re-handshake once a domain session is established", async () => {
        const commands = new TestCommands();
        await commands.door_lock();
        const afterFirst = commands.sendCount;
        await commands.door_unlock();
        // Only one additional send (the command itself) - no second handshake.
        expect(commands.sendCount).toBe(afterFirst + 1);
    });

    it("handshakes VCSEC and Infotainment domains independently", async () => {
        const commands = new TestCommands();
        await commands.door_lock(); // VCSEC
        const afterVcsec = commands.sendCount;
        await commands.charge_start(); // Infotainment - separate domain, separate handshake
        expect(commands.sendCount).toBe(afterVcsec + 2);
    });

    it("throws when the vehicle reports this key is not on its whitelist", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.rejectNextAsNotWhitelisted();
        await expect(commands.door_lock()).rejects.toThrow(NotOnVehicleWhitelistError);
    });
});

describe("Commands: HMAC round trip against an independent vehicle simulator", () => {
    it("locks and unlocks the vehicle", async () => {
        const commands = new TestCommands();
        await expect(commands.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });
        await expect(commands.door_unlock()).resolves.toEqual({ response: { result: true, reason: "" } });
    });

    it("increments the per-domain counter across successive commands", async () => {
        const commands = new TestCommands();
        await commands.door_lock();
        await commands.door_unlock();
        await commands.honk_horn();
        // honk_horn is Infotainment, doors are VCSEC - independent counters, both > 1 after 2 VCSEC sends.
        const vcsecSession = (commands as any).sessions[2];
        expect(vcsecSession.counter).toBeGreaterThanOrEqual(2);
    });

    it("rejects a tampered command instead of silently succeeding", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.rejectNextAsBadSignature();
        await expect(commands.door_lock()).rejects.toThrow(SignedCommandFaultError);
    });

    it("retries on a WAIT reply and eventually succeeds", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.queueWaits(2);
        const result = await commands.charge_start();
        expect(result.response.result).toBe(true);
    });

    it("gives up after exhausting WAIT retries", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.queueWaits(10);
        const result = await commands.charge_start();
        expect(result).toEqual({ response: { result: false, reason: "Too many retries" } });
    });
});

describe("Commands: protobuf construction for representative commands", () => {
    let commands: TestCommands;

    beforeEach(() => {
        commands = new TestCommands();
    });

    it("charge_start / charge_stop / charge_max_range / charge_standard all succeed", async () => {
        await expect(commands.charge_start()).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.charge_stop()).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.charge_max_range()).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.charge_standard()).resolves.toMatchObject({ response: { result: true } });
    });

    it("actuate_truck builds a front or rear trunk closure request", async () => {
        await expect(commands.actuate_truck("front")).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.actuate_truck("rear")).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.actuate_truck("side" as any)).rejects.toThrow(/Invalid trunk/);
    });

    it("window_control builds vent/close, not a REST-style command string", async () => {
        await expect(commands.window_control("vent")).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.window_control("close")).resolves.toMatchObject({ response: { result: true } });
    });

    it("set_charge_limit, set_charging_amps, set_temps all succeed", async () => {
        await expect(commands.set_charge_limit(80)).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.set_charging_amps(16)).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.set_temps(21, 21)).resolves.toMatchObject({ response: { result: true } });
    });

    it("remote_seat_heater_request rejects an unmapped seat position", async () => {
        await expect(commands.remote_seat_heater_request(3 as any, 1)).rejects.toThrow(/Invalid seat position/);
    });

    it("remote_seat_heater_request accepts every seat Node's Seats enum defines", async () => {
        for (const seat of [0, 1, 2, 4, 5, 6, 7]) {
            await expect(commands.remote_seat_heater_request(seat, 2)).resolves.toMatchObject({ response: { result: true } });
        }
    });

    it("set_climate_keeper_mode accepts both string and numeric modes", async () => {
        await expect(commands.set_climate_keeper_mode("Dog")).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.set_climate_keeper_mode(2)).resolves.toMatchObject({ response: { result: true } });
    });

    it("set_cop_temp accepts the enum index and both unit aliases", async () => {
        await expect(commands.set_cop_temp(1)).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.set_cop_temp(35)).resolves.toMatchObject({ response: { result: true } });
        await expect(commands.set_cop_temp(95)).resolves.toMatchObject({ response: { result: true } });
    });

    it("rejects cross-transport gaps rather than silently dropping data", async () => {
        await expect(commands.sun_roof_control("stop")).rejects.toThrow(/not representable/);
        await expect(commands.navigation_sc_request(12345, 2)).rejects.toThrow(/not representable/);
    });

    it("navigation_sc_request without an order builds successfully", async () => {
        await expect(commands.navigation_sc_request(12345)).resolves.toMatchObject({ response: { result: true } });
    });
});
