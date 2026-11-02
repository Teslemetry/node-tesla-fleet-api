// Behaviour specs ported from Python's `tests/test_ble_mocked_state_readers.py`,
// `test_ble_mocked_state_readers_new.py` and `test_ble_mocked_closures_locks.py`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GetVehicleData, Response } from "@teslemetry/tesla-protocol/command/car_server";
import {
    ClosureMoveRequest,
    ClosureMoveTypeE,
    InformationRequestType,
    RKEActionE,
    VehicleLockStateE,
    VehicleStatus,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import { BluetoothVehicleData, VehicleDataEndpoint, VehicleImageType } from "../../src/const.js";
import { BluetoothCloudUnavailableError, InvalidResponse, TeslaFleetMessageFaultResponseSizeExceedsMTU } from "../../src/exceptions.js";
import { BleHarnessOptions, INFOTAINMENT, VCSEC, bareAck, bleHarness, finish } from "../helpers/blevehicle.js";
import { MessageFaultE } from "@teslemetry/tesla-protocol/command/universal_message";

const OK = { response: { result: true, reason: "" } };

async function ready(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return harness;
}

type Harness = Awaited<ReturnType<typeof ready>>;

function answerWith({ fakeVehicle }: Harness, data: object): void {
    fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ vehicleData: VehicleData.fromPartial(data) }));
}

function request({ fakeVehicle }: Harness): GetVehicleData {
    return fakeVehicle.infotainmentActions.at(-1)!.vehicleAction!.getVehicleData!;
}

/** The sub-requests a `GetVehicleData` set. */
function requested(data: GetVehicleData): string[] {
    return Object.entries(data)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => key);
}

const READERS = [
    ["charge_state", "getChargeState", "chargeState", { chargeLimitSoc: 77 }],
    ["climate_state", "getClimateState", "climateState", { insideTempCelsius: 21.5 }],
    ["drive_state", "getDriveState", "driveState", { speed: 42 }],
    ["location_state", "getLocationState", "locationState", { latitude: 12.5 }],
    ["closures_state", "getClosuresState", "closuresState", { doorOpenDriverFront: true }],
    ["charge_schedule_state", "getChargeScheduleState", "chargeScheduleState", { maxNumChargeSchedules: 4 }],
    ["preconditioning_schedule_state", "getPreconditioningScheduleState", "preconditioningScheduleState", { maxNumPreconditionSchedules: 4 }],
    ["tire_pressure_state", "getTirePressureState", "tirePressureState", { tpmsPressureFl: 2.5 }],
    ["media_state", "getMediaState", "mediaState", { nowPlayingArtist: "artist" }],
    ["media_detail_state", "getMediaDetailState", "mediaDetailState", { nowPlayingDuration: 180 }],
    ["software_update_state", "getSoftwareUpdateState", "softwareUpdateState", { scheduledTimeMs: 1000 }],
    ["parental_controls_state", "getParentalControlsState", "parentalControlsState", { parentalControlsActive: true }],
    ["gui_settings", "getGuiSettings", "guiSettings", { gui24HourTime: true }],
    ["parked_accessory_state", "getParkedAccessoryState", "parkedAccessoryState", { tentModeRequest: true }],
    ["legacy_vehicle_state", "getLegacyVehicleState", "legacyVehicleState", { allowAuthorizedMobileDevicesOnly: true }],
    ["current_vehicle_state", "getVehicleState", "vehicleState", { apiVersion: 42 }],
    ["vehicle_config", "getVehicleConfig", "vehicleConfig", { redBrakeCalipers: true }],
    ["soh_state", "getSohState", "sohState", {}],
    ["vehicle_detail_state", "getVehicleDetailState", "vehicleDetailState", { vehicleName: "name" }],
    ["display_state", "getDisplayState", "displayState", { displayBrightnessAuto: true }],
    ["alert_state", "getAlertState", "alertState", {}],
    ["light_show_state", "getLightShowState", "lightShowState", { lightShowActive: true }],
    ["suspension_state", "getSuspensionState", "suspensionState", { offroadOn: true }],
    ["child_presence_detection_state", "getChildPresenceDetectionState", "childPresenceDetectionState", { cpdHvacActive: true }],
] as const;

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("the readers", () => {
    it("covers all 24", () => {
        expect(new Set(READERS.map(([reader]) => reader)).size).toBe(24);
    });

    it.each(READERS)("%s asks for %s and returns %s", async (reader, requestField, replyField, sample) => {
        const harness = await ready();
        answerWith(harness, { [replyField]: sample });

        const state = await finish(harness.vehicle[reader]());

        expect(state).toEqual(VehicleData.fromPartial({ [replyField]: sample })[replyField]);
        expect(state).toMatchObject(sample);
        expect(requested(request(harness))).toEqual([requestField]);
    });

    it("signs each one", async () => {
        const harness = await ready();
        answerWith(harness, { driveState: {} });

        await finish(harness.vehicle.drive_state());

        expect(harness.link.commands(INFOTAINMENT)[0]?.signatureData?.AESGCMPersonalizedData).toBeDefined();
    });

    it("raises InvalidResponse for a reply without the field, rather than make up a default", async () => {
        const harness = await ready();
        answerWith(harness, {});

        await expect(finish(harness.vehicle.drive_state())).rejects.toBeInstanceOf(InvalidResponse);
    });

    it("tells the three vehicle states apart", async () => {
        const harness = await ready();

        answerWith(harness, { legacyVehicleState: {} });
        await finish(harness.vehicle.legacy_vehicle_state());
        expect(requested(request(harness))).toEqual(["getLegacyVehicleState"]);

        answerWith(harness, { vehicleState: {} });
        await finish(harness.vehicle.current_vehicle_state());
        expect(requested(request(harness))).toEqual(["getVehicleState"]);
    });
});

describe("vehicle_state", () => {
    it("reads VCSEC's VehicleStatus", async () => {
        const { vehicle, fakeVehicle } = await ready();
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleLockState: VehicleLockStateE.VEHICLELOCKSTATE_LOCKED });

        const status = await finish(vehicle.vehicle_state());

        expect(status.vehicleLockState).toBe(VehicleLockStateE.VEHICLELOCKSTATE_LOCKED);
        expect(fakeVehicle.vcsecCommands.at(-1)?.InformationRequest?.informationRequestType).toBe(InformationRequestType.INFORMATION_REQUEST_TYPE_GET_STATUS);
    });
});

describe("vehicle_data", () => {
    it("asks for the endpoints named, and returns VehicleData", async () => {
        const harness = await ready();
        answerWith(harness, { chargeState: { chargeLimitSoc: 77 } });

        const data = await finish(harness.vehicle.vehicle_data([BluetoothVehicleData.CHARGE_STATE]));

        expect(data.chargeState.chargeLimitSoc).toBe(77);
        expect(requested(request(harness))).toEqual(["getChargeState"]);
    });

    it("sends no default set for an empty list", async () => {
        const harness = await ready();
        answerWith(harness, {});

        await finish(harness.vehicle.vehicle_data([]));

        expect(requested(request(harness))).toEqual([]);
    });

    it("leaves no argument and REST endpoint names to the cloud, sending nothing", async () => {
        const { vehicle, link } = await ready();

        await expect(finish(vehicle.vehicle_data())).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
        await expect(finish(vehicle.vehicle_data("charge_state"))).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
        await expect(finish(vehicle.vehicle_data([VehicleDataEndpoint.CHARGE_STATE]))).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);

        expect(link.commands(INFOTAINMENT)).toEqual([]);
    });

    it("asks for every endpoint a caller names", async () => {
        const harness = await ready();
        answerWith(harness, {});

        await finish(harness.vehicle.vehicle_data(Object.values(BluetoothVehicleData)));

        const fields = Object.values(BluetoothVehicleData).map((value) => `${value[0]!.toLowerCase()}${value.slice(1)}`);
        expect(requested(request(harness)).sort()).toEqual(fields.sort());
        for (const field of fields) {
            expect(field in GetVehicleData.create()).toBe(true);
        }
    });

    it("surfaces the size fault of too many endpoints", async () => {
        const harness = await ready();
        harness.link.rewriteNextReply((reply, sent) => [
            { message: { ...bareAck(reply, sent), signedMessageStatus: { operationStatus: 0, signedMessageFault: MessageFaultE.MESSAGEFAULT_ERROR_RESPONSE_MTU_EXCEEDED } } },
        ]);

        await expect(finish(harness.vehicle.vehicle_data([BluetoothVehicleData.CHARGE_STATE, BluetoothVehicleData.CLIMATE_STATE]))).rejects.toBeInstanceOf(
            TeslaFleetMessageFaultResponseSizeExceedsMTU,
        );
    });
});

describe("vehicle_image_state over Bluetooth", () => {
    it("pages through a fake link's small frames", async () => {
        const { vehicle, fakeVehicle } = await ready();
        const reply = (totalImageSize: number, data: string = "", startOffset: number = 0) =>
            Response.create({ vehicleData: { vehicleImageState: { vehicleImages: [{ totalImageSize, assetData: { data: Buffer.from(data), startOffset } }] } } });
        fakeVehicle.replyToNextInfotainmentCommandWith(reply(6));
        fakeVehicle.replyToNextInfotainmentCommandWith(reply(6, "abcd"));
        fakeVehicle.replyToNextInfotainmentCommandWith(reply(6, "ef", 4));

        await expect(finish(vehicle.vehicle_image_state(VehicleImageType.AUTOPILOT_VISUALIZATION_WRAP, 4))).resolves.toEqual(Buffer.from("abcdef"));

        expect(fakeVehicle.infotainmentActions).toHaveLength(3);
    });
});

describe("GATT characteristics", () => {
    const named = (name: string) => Buffer.from(`\u{1F511} ${name}`, "utf8");

    it("reads the display name, without its prefix", async () => {
        const { vehicle, link } = bleHarness();
        link.genericAccess.deviceName = named("Road Runner");

        await expect(finish(vehicle.query_display_name())).resolves.toBe("Road Runner");
    });

    it("retries 1 s apart until the prefix appears", async () => {
        const { vehicle, link } = bleHarness();
        link.genericAccess.deviceName = Buffer.from("S1a87a5a75f3df858C");
        setTimeout(() => {
            link.genericAccess.deviceName = named("Road Runner");
        }, 1500);

        await expect(finish(vehicle.query_display_name())).resolves.toBe("Road Runner");

        expect(link.calls.filter((call) => call.kind === "read")).toHaveLength(3);
    });

    it("gives up with null", async () => {
        const { vehicle, link } = bleHarness();

        await expect(finish(vehicle.query_display_name(2))).resolves.toBeNull();

        expect(link.calls.filter((call) => call.kind === "read")).toHaveLength(2);
    });

    it("fails softly when 0x2A00 is unreachable", async () => {
        const { vehicle, link } = bleHarness();
        for (let i = 0; i < 5; i++) {
            link.failNextRead(new Error("characteristic not found"));
        }

        await expect(finish(vehicle.query_display_name())).resolves.toBeNull();

        expect(link.openConnections).toBe(1);
    });

    it("fails softly with no link at all", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1 });
        link.failConnect(5);

        await expect(finish(vehicle.query_display_name())).resolves.toBeNull();
    });

    it("reads the appearance", async () => {
        const { vehicle, link } = bleHarness();
        link.genericAccess.appearance = Buffer.from([0x40, 0x03]);

        await expect(finish(vehicle.query_appearance())).resolves.toEqual(Buffer.from([0x40, 0x03]));
    });

    it("returns null for an unreadable appearance", async () => {
        const { vehicle, link } = bleHarness();
        await finish(vehicle.connect());
        link.failNextRead();

        await expect(finish(vehicle.query_appearance())).resolves.toBeNull();
    });

    it("reads the version as a big-endian integer", async () => {
        const { vehicle, link } = bleHarness();
        link.version = Buffer.from([0x01, 0x02]);

        await expect(finish(vehicle.query_version())).resolves.toBe(0x0102);
    });

    it("returns null for an empty or unreadable version", async () => {
        const { vehicle, link } = bleHarness();
        link.version = Buffer.alloc(0);
        await expect(finish(vehicle.query_version())).resolves.toBeNull();

        link.failNextRead();
        await expect(finish(vehicle.query_version())).resolves.toBeNull();
    });
});

describe("closures and locks", () => {
    const CLOSURES = [
        ["open_front_driver_door", "frontDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN],
        ["close_front_driver_door", "frontDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE],
        ["open_front_passenger_door", "frontPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN],
        ["close_front_passenger_door", "frontPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE],
        ["open_rear_driver_door", "rearDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN],
        ["close_rear_driver_door", "rearDriverDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE],
        ["open_rear_passenger_door", "rearPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN],
        ["close_rear_passenger_door", "rearPassengerDoor", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE],
        ["open_rear_trunk", "rearTrunk", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN],
        ["close_rear_trunk", "rearTrunk", ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE],
    ] as const;

    it.each(CLOSURES)("%s moves only %s", async (method, field, move) => {
        const { vehicle, fakeVehicle } = await ready();

        await expect(finish(vehicle[method]())).resolves.toEqual(OK);

        expect(fakeVehicle.vcsecCommands.at(-1)?.closureMoveRequest).toEqual(ClosureMoveRequest.create({ [field]: move }));
    });

    it("unlocks", async () => {
        const { vehicle, fakeVehicle } = await ready();

        await expect(finish(vehicle.door_unlock())).resolves.toEqual(OK);

        expect(fakeVehicle.vcsecCommands.at(-1)?.RKEAction).toBe(RKEActionE.RKE_ACTION_UNLOCK);
    });

    it("secures the car", async () => {
        const { vehicle, fakeVehicle } = await ready();

        await expect(finish(vehicle.auto_secure_vehicle())).resolves.toEqual(OK);

        expect(fakeVehicle.vcsecCommands.at(-1)?.RKEAction).toBe(RKEActionE.RKE_ACTION_AUTO_SECURE_VEHICLE);
    });

    it("moves the charge port both ways", async () => {
        const { vehicle, fakeVehicle } = await ready();

        await finish(vehicle.charge_port_door_open());
        expect(fakeVehicle.vcsecCommands.at(-1)?.closureMoveRequest?.chargePort).toBe(ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN);

        await finish(vehicle.charge_port_door_close());
        expect(fakeVehicle.vcsecCommands.at(-1)?.closureMoveRequest?.chargePort).toBe(ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE);
    });

    it("sends a closure once, even with the ack lost", async () => {
        const { vehicle, link } = await ready();
        link.dropNextReply();

        await expect(finish(vehicle.open_rear_trunk())).resolves.toEqual(OK);

        expect(link.commands(VCSEC)).toHaveLength(1);
    });
});
