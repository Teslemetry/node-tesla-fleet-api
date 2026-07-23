import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import Commands from "../src/commands.js";
import Vehicle from "../src/vehicle.js";
import { NotOnVehicleWhitelistError, SignedCommandFaultError } from "../src/signing/errors.js";
import { publicKeyFor } from "../src/signing/crypto.js";
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
    /** FIFO queue of artificial network delays (ms), one consumed per `_send` call - lets tests force reordering that would occur over a real, unlocked, concurrent network round trip. */
    sendDelaysMs: number[] = [];

    constructor(vin: string = VIN) {
        super(makeParent(), vin, OUR_PRIVATE_KEY);
        this.retryDelayMs = 0; // don't actually wait during WAIT-retry tests
    }

    protected async _send(msg: RoutableMessage, _requires: string, _expectsData?: boolean, _confirmBroadcast?: (status: VehicleStatus) => boolean): Promise<RoutableMessage> {
        this.sendCount++;
        const delay = this.sendDelaysMs.shift();
        if (delay) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const replyBytes = this.fakeVehicle.handle(Buffer.from(RoutableMessage.encode(msg).finish()));
        const resp = RoutableMessage.decode(replyBytes);
        this.validateAndUpdateSession(resp, Buffer.from(msg.uuid));
        return resp;
    }
}

describe("Commands: constructor validation", () => {
    // privateKey/publicKey are native private fields (not just TS `private`) -
    // not reachable off the instance at all, so these tests verify key
    // derivation the same way any real caller would observe it: what
    // actually goes out on the wire.
    class RecordingCommands extends Commands {
        sentMessages: RoutableMessage[] = [];

        protected async _send(msg: RoutableMessage): Promise<RoutableMessage> {
            this.sentMessages.push(msg);
            throw new Error("stop-after-send-capture");
        }
    }

    it("rejects a VIN that is not 17 characters", () => {
        expect(() => new RecordingCommands(makeParent(), "TOOSHORT", OUR_PRIVATE_KEY)).toThrow(/17-character/);
    });

    it("rejects construction with no private key available anywhere", () => {
        expect(() => new RecordingCommands(makeParent(), VIN)).toThrow(/No private key/);
    });

    it("falls back to the parent Vehicle's private_key when none is passed explicitly, and uses it for real signing", async () => {
        const parent = makeParent();
        parent.private_key = OUR_PRIVATE_KEY;
        const commands = new RecordingCommands(parent, VIN);

        await expect(commands.door_lock()).rejects.toThrow("stop-after-send-capture");

        const sentPublicKey = Buffer.from(commands.sentMessages[0].sessionInfoRequest!.publicKey);
        expect(sentPublicKey.toString("hex")).toBe(publicKeyFor(OUR_PRIVATE_KEY).toString("hex"));
    });

    it("derives its own public key from the private key when none is passed", async () => {
        const commands = new RecordingCommands(makeParent(), VIN, OUR_PRIVATE_KEY);

        await expect(commands.door_lock()).rejects.toThrow("stop-after-send-capture");

        const sentPublicKey = Buffer.from(commands.sentMessages[0].sessionInfoRequest!.publicKey);
        expect(sentPublicKey).toHaveLength(65);
        expect(sentPublicKey[0]).toBe(0x04);
        expect(sentPublicKey.toString("hex")).toBe(publicKeyFor(OUR_PRIVATE_KEY).toString("hex"));
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

    // Regression test for a round-2 fix: real VCSEC hardware leaves
    // request_uuid empty on its replies (protocol.md's handshake section),
    // so its absence must never be treated as a rejection - only the
    // session_info_tag (verified separately, and still checked here) is
    // authentication. A prior fix's overly strict echo guard broke every
    // VCSEC command - door_lock, door_unlock, trunk, charge port,
    // remote_start_drive - against real vehicles.
    it("accepts a real-VCSEC-style handshake reply that omits request_uuid entirely", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.omitRequestUuidLikeRealVcsec();

        await expect(commands.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });

        const vcsecSession = (commands as any).sessions[2];
        expect(vcsecSession.ready).toBe(true);
    });

    it("still rejects a tampered tag even when request_uuid is omitted (the tag remains the real authentication)", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.omitRequestUuidLikeRealVcsec();
        commands.fakeVehicle.corruptNextSessionInfoTag();

        await expect(commands.door_lock()).rejects.toThrow(/authentication/i);
    });
});

describe("Commands: VCSEC dispatch serialization", () => {
    // Regression test for a round-2 fix: VCSEC requires messages to arrive in
    // counter order (and the spec warns against simultaneous VCSEC requests
    // at all), but the lock previously covered only the synchronous
    // message-build step, releasing it before the network round trip - so
    // two concurrent VCSEC commands could race and reach the vehicle out of
    // counter order. `sendDelaysMs` simulates that race deterministically: the
    // first command's network leg is made slower than the second's, which
    // would reorder their arrival at the vehicle if dispatch weren't
    // serialized end-to-end.
    it("delivers concurrent VCSEC commands to the vehicle in strict counter order", async () => {
        const commands = new TestCommands();
        await commands.door_lock(); // establish the session first, outside the race

        commands.sendDelaysMs = [30, 5]; // first command's _send is slower than the second's
        const [a, b] = await Promise.all([commands.door_unlock(), commands.door_lock()]);

        expect(a).toEqual({ response: { result: true, reason: "" } });
        expect(b).toEqual({ response: { result: true, reason: "" } });

        const arrivals = commands.fakeVehicle.vcsecCounterArrivals;
        expect(arrivals.length).toBeGreaterThanOrEqual(2);
        for (let i = 1; i < arrivals.length; i++) {
            expect(arrivals[i]).toBeGreaterThan(arrivals[i - 1]);
        }
    });
});

describe("Commands: session-info authentication (rejects tampered/spoofed handshake state)", () => {
    it("rejects a handshake reply whose session_info_tag was tampered with", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.corruptNextSessionInfoTag();
        await expect(commands.door_lock()).rejects.toThrow(/authentication/i);
    });

    it("does not adopt the tampered session's epoch/counter after rejecting it", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.corruptNextSessionInfoTag();
        await expect(commands.door_lock()).rejects.toThrow();

        const vcsecSession = (commands as any).sessions[2];
        expect(vcsecSession.ready).toBe(false);

        // A retry with an honest handshake must still succeed - the earlier
        // rejection didn't corrupt any state that would block recovery.
        await expect(commands.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });
    });

    it("rejects a session-info reply replayed against a request it wasn't tagged for", async () => {
        const commands = new TestCommands();
        commands.fakeVehicle.spoofNextSessionInfoChallenge();
        await expect(commands.door_lock()).rejects.toThrow(/outstanding request/i);
    });

    it("rejects a validly-signed but stale (rolled-back clock, same epoch) session-info resync", async () => {
        const commands = new TestCommands();
        // Establish a real, current session first (commits the initial clock time).
        await commands.door_lock();
        const vcsecSession = (commands as any).sessions[2];
        const counterBefore = vcsecSession.counter;
        const deltaBefore = vcsecSession.delta;

        // Piggy-back an honestly-signed but stale resync (same epoch, clock
        // far in the past) onto the reply of the *next* ordinary command,
        // exactly as the spec describes for "Recovering from synchronization
        // errors" - this must not go through the handshake path at all.
        commands.fakeVehicle.attachSessionInfoToNextReply();
        commands.fakeVehicle.replayStaleSessionInfo(1, Math.floor(Date.now() / 1000) - 100000);

        await expect(commands.door_unlock()).rejects.toThrow(/stale/i);
        // The rejected resync's stale counter (1) and clock must not have been
        // adopted - the counter only ever moves forward (from signing the
        // outgoing door_unlock itself), and delta is untouched entirely.
        expect(vcsecSession.counter).toBeGreaterThan(counterBefore);
        expect(vcsecSession.delta).toBe(deltaBefore);
    });

    it("never lowers the counter even when a later (authentic) session-info resync claims a smaller one", async () => {
        const commands = new TestCommands();
        await commands.door_lock();
        await commands.door_lock();
        const vcsecSession = (commands as any).sessions[2];
        const counterAfterTwoCommands = vcsecSession.counter;
        expect(counterAfterTwoCommands).toBeGreaterThanOrEqual(2);

        // An honestly-signed resync, same epoch, non-regressing clock, but a
        // lower counter - must be clamped, not adopted.
        commands.fakeVehicle.attachSessionInfoToNextReply();
        commands.fakeVehicle.replayStaleSessionInfo(1, Math.floor(Date.now() / 1000) + 100000);
        await commands.door_lock();

        expect(vcsecSession.counter).toBeGreaterThanOrEqual(counterAfterTwoCommands);
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
