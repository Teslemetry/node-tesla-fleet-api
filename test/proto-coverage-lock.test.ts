// Python tests/test_proto_coverage_lock.py: every `VehicleAction` and
// `GetVehicleData` field must have a library wrapper or a reasoned allowlist
// entry, so a `tesla-protocol` bump that adds a field fails here instead of
// silently drifting out of coverage.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GetVehicleData, VehicleAction } from "@teslemetry/tesla-protocol/command/car_server";
import Commands from "../src/commands.js";
import VehicleSigned from "../src/vehiclesigned.js";
import VehicleSpecific from "../src/vehiclespecific.js";

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8");

/** Comments out of the way, so that mentioning a field in one does not count as wrapping it. */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const COMMANDS_SOURCE = code(source("commands.ts"));
const bluetoothDir = new URL("../src/bluetooth/", import.meta.url);
const BLUETOOTH_SOURCE = existsSync(bluetoothDir)
    ? readdirSync(bluetoothDir, { recursive: true, encoding: "utf8" })
          .filter((file) => file.endsWith(".ts"))
          .map((file) => code(source(`bluetooth/${file}`)))
          .join("\n")
    : "";

const wrappedIn = (text: string, field: string) => new RegExp(`\\b${field}\\b`).test(text);

/** Outside the action oneof, so it is a flag on every action rather than a command. */
const VEHICLE_ACTION_FLAGS = new Set(["dropNominalSuccessResponses"]);

/** Covered via an equivalent alternate proto path (VCSEC), not the CarServer field of the same name or intent. */
const ALTERNATE_PATH_VEHICLE_ACTION_FIELDS = new Set([
    "getVehicleData", // the wrapper's own input message, not a command
    "remoteStartDrive", // built from VCSEC RKEActionE.RKE_ACTION_REMOTE_DRIVE
    "chargePortDoorClose", // built from VCSEC ClosureMoveRequest
    "chargePortDoorOpen", // built from VCSEC ClosureMoveRequest
]);

/**
 * A persistent push-style subscription sub-protocol: the vehicle sends
 * unsolicited updates after a subscription is established, unlike every other
 * VehicleAction's one-shot send and reply. It needs its own broadcast-dispatcher
 * design, not a one-shot wrapper.
 */
const STREAMING_SUBSCRIPTION_VEHICLE_ACTION_FIELDS = new Set([
    "createStreamSession",
    "streamMessage",
    "vehicleDataSubscription",
    "vehicleDataAck",
    "vitalsSubscription",
    "vitalsAck",
    "cancelVehicleDataSubscription",
]);

/** Added by tesla-protocol 3.0.0. Python tracks wrapping them as follow-up work. */
const TESLA_PROTOCOL_3_UNWRAPPED_VEHICLE_ACTION_FIELDS = new Set([
    "setUpkeepUsernameAction",
    "prepareMobileUploadAction",
    "putMobileUploadChunkAction",
    "displayStateAction",
    "drivingSetCruiseSpeedLimitAction",
    "setDeckLightAction",
]);

/**
 * Added by tesla-protocol 5.0.0. Python tracks wrapping them as follow-up work:
 * the keep-on-port actions and the accessory-port reader need a design for their
 * shared mode enum and a live vehicle check.
 */
const TESLA_PROTOCOL_5_UNWRAPPED_VEHICLE_ACTION_FIELDS = new Set(["setKeepOnCabin12vPortAction", "setKeepOnCabin48vPortAction"]);

const KNOWN_UNWRAPPED_VEHICLE_ACTION_FIELDS = new Set([
    ...ALTERNATE_PATH_VEHICLE_ACTION_FIELDS,
    ...STREAMING_SUBSCRIPTION_VEHICLE_ACTION_FIELDS,
    ...TESLA_PROTOCOL_3_UNWRAPPED_VEHICLE_ACTION_FIELDS,
    ...TESLA_PROTOCOL_5_UNWRAPPED_VEHICLE_ACTION_FIELDS,
]);

/** Added by tesla-protocol 5.0.0. The reader is follow-up work with the keep-on-port actions above. */
const KNOWN_UNWRAPPED_GET_VEHICLE_DATA_FIELDS = new Set(["getKeepOnAccessoryPortsState"]);

/**
 * Node only: Python's lock counts the readers on `VehicleBluetooth`, which Node
 * has not ported yet (doc 05 section 10). Each name leaves this list as its
 * reader lands, and the last test below fails until it does.
 */
const BLUETOOTH_READERS_NOT_YET_PORTED = new Set([
    "getChargeState",
    "getClimateState",
    "getDriveState",
    "getLocationState",
    "getClosuresState",
    "getChargeScheduleState",
    "getPreconditioningScheduleState",
    "getTirePressureState",
    "getMediaState",
    "getMediaDetailState",
    "getSoftwareUpdateState",
    "getParentalControlsState",
    "getGuiSettings",
    "getParkedAccessoryState",
    "getLegacyVehicleState",
    "getVehicleState",
    "getVehicleConfig",
    "getSohState",
    "getVehicleDetailState",
    "getDisplayState",
    "getAlertState",
    "getLightShowState",
    "getSuspensionState",
    "getChildPresenceDetectionState",
]);

/** `VehicleSpecific` methods with no signed form, because they are Fleet API requests rather than vehicle commands. */
const NOT_VEHICLE_COMMANDS = [
    "drivers",
    "drivers_remove",
    "eligible_subscriptions",
    "eligible_upgrades",
    "fleet_status",
    "fleet_telemetry_config_delete",
    "fleet_telemetry_config_get",
    "fleet_telemetry_config_jws",
    "mobile_enabled",
    "options",
    "recent_alerts",
    "release_notes",
    "service_data",
    "share_invites",
    "share_invites_create",
    "share_invites_revoke",
    "signed_command",
    "vehicle",
    "vehicle_data",
    "wake_up",
    "warranty_details",
];

const vehicleActionFields = Object.keys(VehicleAction.create({})).filter((field) => !VEHICLE_ACTION_FLAGS.has(field));
const getVehicleDataFields = Object.keys(GetVehicleData.create({}));

describe("VehicleAction coverage lock", () => {
    it("reads the whole message", () => {
        expect(Object.keys(VehicleAction.create({}))).toHaveLength(138);
        expect(vehicleActionFields).toContain("ping");
    });

    it("has a wrapper or an allowlist entry for every field", () => {
        const unwrapped = vehicleActionFields.filter((field) => !KNOWN_UNWRAPPED_VEHICLE_ACTION_FIELDS.has(field) && !wrappedIn(COMMANDS_SOURCE, field));

        expect(unwrapped).toEqual([]);
    });

    it("has no allowlist entry the proto dropped", () => {
        expect([...KNOWN_UNWRAPPED_VEHICLE_ACTION_FIELDS, ...VEHICLE_ACTION_FLAGS].filter((field) => !(field in VehicleAction.create({})))).toEqual([]);
    });
});

describe("GetVehicleData coverage lock", () => {
    const allowlisted = new Set([...KNOWN_UNWRAPPED_GET_VEHICLE_DATA_FIELDS, ...BLUETOOTH_READERS_NOT_YET_PORTED]);

    it("reads the whole message", () => {
        expect(getVehicleDataFields).toHaveLength(26);
    });

    it("has a reader or an allowlist entry for every field", () => {
        const unwrapped = getVehicleDataFields.filter(
            (field) => !allowlisted.has(field) && !wrappedIn(COMMANDS_SOURCE, field) && !wrappedIn(BLUETOOTH_SOURCE, field),
        );

        expect(unwrapped).toEqual([]);
    });

    it("has no allowlist entry the proto dropped", () => {
        expect([...allowlisted].filter((field) => !getVehicleDataFields.includes(field))).toEqual([]);
    });

    it("drops a pending Bluetooth reader from the allowlist as it lands", () => {
        expect([...BLUETOOTH_READERS_NOT_YET_PORTED].filter((field) => wrappedIn(BLUETOOTH_SOURCE, field))).toEqual([]);
    });
});

describe("signing coverage", () => {
    // A method left out of `Commands` is inherited unsigned, and a vehicle that
    // requires signing rejects it on the plaintext route.
    it("overrides every vehicle command VehicleSpecific sends as plaintext", () => {
        const signed = new Set([...Object.getOwnPropertyNames(Commands.prototype), ...Object.getOwnPropertyNames(VehicleSigned.prototype)]);
        const inheritedUnsigned = Object.getOwnPropertyNames(VehicleSpecific.prototype).filter((name) => !signed.has(name));

        expect(inheritedUnsigned.sort()).toEqual([...NOT_VEHICLE_COMMANDS].sort());
    });
});
