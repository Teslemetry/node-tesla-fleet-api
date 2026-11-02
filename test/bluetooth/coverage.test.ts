// `VehicleBluetooth`'s version of Python's `tests/test_proto_coverage_lock.py`:
// every public method either signs for the car or says, before any I/O, that it
// needs the cloud. Nothing may fall through to REST unnoticed.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Domain } from "@teslemetry/tesla-protocol/command/universal_message";
import Commands from "../../src/commands.js";
import { BroadcastListeners } from "../../src/bluetooth/broadcast.js";
import VehicleBluetooth from "../../src/bluetooth/vehiclebluetooth.js";
import VehicleSpecific from "../../src/vehiclespecific.js";
import { BluetoothCloudUnavailableError } from "../../src/exceptions.js";
import { BleHarnessOptions, bleHarness, finish } from "../helpers/blevehicle.js";

/**
 * What a `VehicleBluetooth` inherits from `VehicleSpecific` on purpose, each with
 * why no signed path exists. On a `TeslaBluetooth` each raises
 * `BluetoothCloudUnavailableError`, which a router fails over on.
 */
const REST_ONLY: Record<string, string> = {
    drivers: "A Fleet API account query: the car's whitelist is not this list.",
    drivers_remove: "A Fleet API account change.",
    eligible_subscriptions: "Asks Tesla's servers what can be bought.",
    eligible_upgrades: "Asks Tesla's servers what can be bought.",
    fleet_status: "Asks Tesla's servers about their own view of the vehicle.",
    fleet_telemetry_config_create: "Configures Tesla's telemetry servers.",
    fleet_telemetry_config_delete: "Configures Tesla's telemetry servers.",
    fleet_telemetry_config_get: "Reads Tesla's telemetry servers.",
    fleet_telemetry_config_jws: "Configures Tesla's telemetry servers, with a JWS the car never sees.",
    mobile_enabled: "A Fleet API setting.",
    options: "Tesla's order records for the VIN.",
    recent_alerts: "Tesla's stored alert history.",
    release_notes: "Tesla's stored release notes.",
    service_data: "Tesla's service records.",
    share_invites: "A Fleet API account query.",
    share_invites_create: "A Fleet API account change.",
    share_invites_revoke: "A Fleet API account change.",
    signed_command: "The cloud relay for a signed command. Bluetooth writes it directly.",
    vehicle: "Tesla's record of the vehicle.",
    warranty_details: "Tesla's warranty records.",
};

/** Public methods a class defines itself, skipping seams and the constructor. */
function ownMethods(target: object): string[] {
    return Object.getOwnPropertyNames(target).filter(
        (name) => name !== "constructor" && !name.startsWith("_") && typeof Object.getOwnPropertyDescriptor(target, name)?.value === "function",
    );
}

/** `VehicleSpecific`'s methods, which send plaintext to REST, that nothing below it overrides. */
function fallsThroughToRest(): string[] {
    const overridden = new Set([VehicleBluetooth.prototype, BroadcastListeners.prototype, Commands.prototype].flatMap(ownMethods));
    return ownMethods(VehicleSpecific.prototype).filter((name) => !overridden.has(name));
}

function call(target: object, name: string, args: unknown[] = []): Promise<unknown> {
    return (async () => (target as Record<string, (...values: unknown[]) => unknown>)[name]!(...args))();
}

async function ready(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return harness;
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("what falls through to REST", () => {
    it("is exactly the explicit list", () => {
        expect(fallsThroughToRest().sort()).toEqual(Object.keys(REST_ONLY).sort());
    });

    it("gives a reason for every entry", () => {
        expect(Object.entries(REST_ONLY).filter(([, reason]) => reason.length < 10)).toEqual([]);
    });

    it("notices a new command", () => {
        const prototype = VehicleSpecific.prototype as unknown as Record<string, unknown>;
        prototype.new_cloud_command = () => undefined;
        try {
            expect(fallsThroughToRest()).toContain("new_cloud_command");
        } finally {
            delete prototype.new_cloud_command;
        }
    });

    it.each(Object.keys(REST_ONLY))("%s raises BluetoothCloudUnavailableError, sending nothing", async (name) => {
        const { vehicle, link } = bleHarness();

        await expect(call(vehicle, name, ["1", "1", "1", "1"])).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);

        expect(link.calls).toEqual([]);
    });
});

describe("what reaches the car", () => {
    const signed = ownMethods(Commands.prototype).filter((name) => !["shared_key", "validate_msg", "handshakeVehicleSecurity", "handshakeInfotainment"].includes(name));

    it("covers every command", () => {
        expect(signed.length).toBeGreaterThan(100);
    });

    it("never reaches for the parent in Commands, which is the way to REST", () => {
        const source = signed.flatMap((name) => {
            const method = (Commands.prototype as unknown as Record<string, () => unknown>)[name]!;
            return /this\.parent\.(?!parent\._log)|\bsuper\./.test(method.toString()) ? [name] : [];
        });

        expect(source).toEqual([]);
    });

    it.each(signed)("%s signs what it writes, or fails before it writes", async (name) => {
        const { vehicle, link } = await ready();
        const before = link.frames.length;
        const method = (vehicle as unknown as Record<string, (...args: unknown[]) => unknown>)[name]!;

        // Junk arguments may fail validation, and that is fine. Reaching REST is not.
        const outcome = await finish(call(vehicle, name, Array<unknown>(method.length).fill(1))).catch((error: unknown) => error);

        expect(outcome).not.toBeInstanceOf(BluetoothCloudUnavailableError);
        for (const frame of link.frames.slice(before)) {
            expect(frame.sessionInfoRequest ?? frame.signatureData?.AESGCMPersonalizedData).toBeDefined();
            expect([Domain.DOMAIN_VEHICLE_SECURITY, Domain.DOMAIN_INFOTAINMENT]).toContain(frame.toDestination?.domain);
        }
    });
});
