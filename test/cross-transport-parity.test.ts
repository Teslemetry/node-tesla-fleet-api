// Python tests/test_cross_transport_parity.py, widened to every command on both
// transports: the same call must build the same instruction over REST and over
// the signed protocol. Replies legitimately differ in form, so this compares
// what each transport sends, from identical arguments.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    AutoSeatClimateAction_AutoSeatPositionE,
    HvacClimateKeeperAction_ClimateKeeperActionE,
    HvacSeatCoolerActions_HvacSeatCoolerLevelE,
    HvacSeatCoolerActions_HvacSeatCoolerPositionE,
    VehicleAction,
} from "@teslemetry/tesla-protocol/command/car_server";
import { StwHeatLevel } from "@teslemetry/tesla-protocol/command/common";
import { ClimateState_CopActivationTemp } from "@teslemetry/tesla-protocol/command/vehicle";
import { ClosureMoveTypeE, RKEActionE, UnsignedMessage } from "@teslemetry/tesla-protocol/command/vcsec";
import Commands from "../src/commands.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import VehicleSpecific from "../src/vehiclespecific.js";
import { FakeVehicleCommands } from "./helpers/testcommands.js";

const VIN = "5YJXCAE43LF123456";
const VOID = {};

type DeepPartial<T> = T extends Date | Uint8Array ? T : T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

type Signed = { action: DeepPartial<VehicleAction> } | { vcsec: DeepPartial<UnsignedMessage> };

/** One call on both transports: its name, its arguments, the REST body, and the signed message. */
type Case = [name: string, args: unknown[], rest: Record<string, unknown> | undefined, signed: Signed];

const action = (value: DeepPartial<VehicleAction>): Signed => ({ action: value });
const vcsec = (value: DeepPartial<UnsignedMessage>): Signed => ({ vcsec: value });

const CASES: Case[] = [
    ["actuate_trunk", ["front"], { which_trunk: "front" }, vcsec({ closureMoveRequest: { frontTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE } })],
    ["adjust_volume", [5], { volume: 5 }, action({ mediaUpdateVolume: { volumeAbsoluteFloat: 5 } })],
    ["auto_conditioning_start", [], undefined, action({ hvacAutoAction: { powerOn: true } })],
    ["auto_conditioning_stop", [], undefined, action({ hvacAutoAction: { powerOn: false } })],
    ["cancel_software_update", [], undefined, action({ vehicleControlCancelSoftwareUpdateAction: {} })],
    ["charge_max_range", [], undefined, action({ chargingStartStopAction: { startMaxRange: VOID } })],
    ["charge_port_door_close", [], undefined, vcsec({ closureMoveRequest: { chargePort: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE } })],
    ["charge_port_door_open", [], undefined, vcsec({ closureMoveRequest: { chargePort: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN } })],
    ["charge_standard", [], undefined, action({ chargingStartStopAction: { startStandard: VOID } })],
    ["charge_start", [], undefined, action({ chargingStartStopAction: { start: VOID } })],
    ["charge_stop", [], undefined, action({ chargingStartStopAction: { stop: VOID } })],
    // Accepted gap, as in Python: REST takes the PIN in its body, and the signed action has no PIN field.
    ["clear_pin_to_drive_admin", ["1234"], { pin: "1234" }, action({ vehicleControlResetPinToDriveAdminAction: {} })],
    ["door_lock", [], undefined, vcsec({ RKEAction: RKEActionE.RKE_ACTION_LOCK })],
    ["door_unlock", [], undefined, vcsec({ RKEAction: RKEActionE.RKE_ACTION_UNLOCK })],
    ["erase_user_data", [], undefined, action({ eraseUserDataAction: {} })],
    ["flash_lights", [], undefined, action({ vehicleControlFlashLightsAction: {} })],
    ["guest_mode", [true], { enable: true }, action({ guestModeAction: { GuestModeActive: true } })],
    ["honk_horn", [], undefined, action({ vehicleControlHonkHornAction: {} })],
    ["media_next_fav", [], undefined, action({ mediaNextFavorite: {} })],
    ["media_next_track", [], undefined, action({ mediaNextTrack: {} })],
    ["media_prev_fav", [], undefined, action({ mediaPreviousFavorite: {} })],
    ["media_prev_track", [], undefined, action({ mediaPreviousTrack: {} })],
    ["media_toggle_playback", [], undefined, action({ mediaPlayAction: {} })],
    ["media_volume_down", [], undefined, action({ mediaUpdateVolume: { volumeDelta: -1 } })],
    ["navigation_gps_request", [37.5, -122.25], { lat: 37.5, lon: -122.25, order: 0 }, action({ navigationGpsRequest: { lat: 37.5, lon: -122.25, order: 0 } })],
    ["navigation_gps_request", [37.5, -122.25, 2], { lat: 37.5, lon: -122.25, order: 2 }, action({ navigationGpsRequest: { lat: 37.5, lon: -122.25, order: 2 } })],
    // Omitted order, as in Python: REST leaves it to the server, and the signed field has to hold a value. Doc 01 section 12.
    ["navigation_sc_request", [9], { id: 9 }, action({ navigationSuperchargerRequest: { id: 9, remoteNavTripOrder: 0 } })],
    ["navigation_sc_request", [9, 2], { id: 9, order: 2 }, action({ navigationSuperchargerRequest: { id: 9, remoteNavTripOrder: 2 } })],
    ["navigation_waypoints_request", ["refId:a"], { waypoints: "refId:a" }, action({ navigationWaypointsRequest: { waypoints: "refId:a" } })],
    [
        "remote_auto_seat_climate_request",
        [2, true],
        { auto_seat_position: 2, auto_climate_on: true },
        action({ autoSeatClimateAction: { carseat: [{ on: true, seatPosition: AutoSeatClimateAction_AutoSeatPositionE.AutoSeatPosition_FrontRight }] } }),
    ],
    ["remote_auto_steering_wheel_heat_climate_request", [true], { on: true }, action({ autoStwHeatAction: { on: true } })],
    ["remote_boombox", [2000], { sound: 2000 }, action({ boomboxAction: { sound: 2000 } })],
    [
        "remote_seat_cooler_request",
        [1, 1],
        { seat_position: 1, seat_cooler_level: 1 },
        action({
            hvacSeatCoolerActions: {
                hvacSeatCoolerAction: [
                    {
                        seatCoolerLevel: HvacSeatCoolerActions_HvacSeatCoolerLevelE.HvacSeatCoolerLevel_Low,
                        seatPosition: HvacSeatCoolerActions_HvacSeatCoolerPositionE.HvacSeatCoolerPosition_FrontLeft,
                    },
                ],
            },
        }),
    ],
    [
        "remote_seat_cooler_request",
        ["FRONT_RIGHT", 3],
        { seat_position: 2, seat_cooler_level: 3 },
        action({
            hvacSeatCoolerActions: {
                hvacSeatCoolerAction: [
                    {
                        seatCoolerLevel: HvacSeatCoolerActions_HvacSeatCoolerLevelE.HvacSeatCoolerLevel_High,
                        seatPosition: HvacSeatCoolerActions_HvacSeatCoolerPositionE.HvacSeatCoolerPosition_FrontRight,
                    },
                ],
            },
        }),
    ],
    [
        "remote_seat_heater_request",
        [4, 2],
        { heater: 4, level: 2 },
        action({ hvacSeatHeaterActions: { hvacSeatHeaterAction: [{ carSeatRearCenter: VOID, seatHeaterMed: VOID }] } }),
    ],
    ["remote_start_drive", [], undefined, vcsec({ RKEAction: RKEActionE.RKE_ACTION_REMOTE_DRIVE })],
    ["remote_steering_wheel_heat_level_request", [0], { level: 0 }, action({ stwHeatLevelAction: { stwHeatLevel: StwHeatLevel.StwHeatLevel_Off } })],
    ["remote_steering_wheel_heat_level_request", [1], { level: 1 }, action({ stwHeatLevelAction: { stwHeatLevel: StwHeatLevel.StwHeatLevel_Low } })],
    ["remote_steering_wheel_heat_level_request", [3], { level: 3 }, action({ stwHeatLevelAction: { stwHeatLevel: StwHeatLevel.StwHeatLevel_High } })],
    ["remote_steering_wheel_heater_request", [true], { on: true }, action({ hvacSteeringWheelHeaterAction: { powerOn: true } })],
    ["reset_pin_to_drive_pin", [], undefined, action({ vehicleControlResetPinToDriveAction: {} })],
    ["reset_valet_pin", [], undefined, action({ vehicleControlResetValetPinAction: {} })],
    ["schedule_software_update", [60], { offset_sec: 60 }, action({ vehicleControlScheduleSoftwareUpdateAction: { offsetSec: 60 } })],
    ["set_bioweapon_mode", [true, false], { on: true, manual_override: false }, action({ hvacBioweaponModeAction: { on: true, manualOverride: false } })],
    ["set_cabin_overheat_protection", [true, true], { on: true, fan_only: true }, action({ setCabinOverheatProtectionAction: { on: true, fanOnly: true } })],
    ["set_charge_limit", [80], { percent: 80 }, action({ chargingSetLimitAction: { percent: 80 } })],
    ["set_charging_amps", [16], { charging_amps: 16 }, action({ setChargingAmpsAction: { chargingAmps: 16 } })],
    [
        "set_climate_keeper_mode",
        [2],
        { climate_keeper_mode: 2 },
        action({ hvacClimateKeeperAction: { ClimateKeeperAction: HvacClimateKeeperAction_ClimateKeeperActionE.ClimateKeeperAction_Dog } }),
    ],
    ["set_cop_temp", [1], { cop_temp: 1 }, action({ setCopTempAction: { copActivationTemp: ClimateState_CopActivationTemp.CopActivationTempMedium } })],
    ["set_pin_to_drive", [true, 1234], { on: true, password: "1234" }, action({ vehicleControlSetPinToDriveAction: { on: true, password: "1234" } })],
    ["set_preconditioning_max", [true, false], { on: true, manual_override: false }, action({ hvacSetPreconditioningMaxAction: { on: true, manualOverride: false } })],
    ["set_scheduled_charging", [true, 120], { enable: true, time: 120 }, action({ scheduledChargingAction: { enabled: true, chargingTime: 120 } })],
    [
        "set_scheduled_departure",
        [true, true, false, 480, false, true, 360],
        {
            enable: true,
            preconditioning_enabled: true,
            preconditioning_weekdays_only: false,
            departure_time: 480,
            off_peak_charging_enabled: false,
            off_peak_charging_weekdays_only: true,
            end_off_peak_time: 360,
        },
        action({
            scheduledDepartureAction: {
                enabled: true,
                departureTime: 480,
                preconditioningTimes: { allWeek: VOID },
                offPeakChargingTimes: { weekdays: VOID },
                offPeakHoursEndTime: 360,
            },
        }),
    ],
    // REST takes day names, which Tesla's proxy turns into the mask the signed path builds itself. Only the signed path has a name.
    [
        "add_charge_schedule",
        ["monday", true, 0, 0, 0],
        { days_of_week: "monday", enabled: true, end_enabled: false, lat: 0, lon: 0, start_enabled: true, start_time: 0 },
        action({ addChargeScheduleAction: { daysOfWeek: 2, enabled: true, startEnabled: true, startTime: 0 } }),
    ],
    [
        "add_charge_schedule",
        [127, false, 1.5, 2.5, 60, 360, true, 7],
        { days_of_week: 127, enabled: false, end_enabled: true, lat: 1.5, lon: 2.5, start_enabled: true, start_time: 60, end_time: 360, one_time: true, id: 7 },
        action({
            addChargeScheduleAction: {
                daysOfWeek: 127,
                latitude: 1.5,
                longitude: 2.5,
                startEnabled: true,
                startTime: 60,
                endEnabled: true,
                endTime: 360,
                oneTime: true,
                id: 7,
            },
        }),
    ],
    [
        "add_precondition_schedule",
        [127, true, 1.5, 2.5, 450, 3, true],
        { days_of_week: 127, enabled: true, lat: 1.5, lon: 2.5, precondition_time: 450, id: 3, one_time: true },
        action({ addPreconditionScheduleAction: { daysOfWeek: 127, enabled: true, latitude: 1.5, longitude: 2.5, preconditionTime: 450, id: 3, oneTime: true } }),
    ],
    ["remove_charge_schedule", [7], { id: 7 }, action({ removeChargeScheduleAction: { id: 7 } })],
    ["remove_precondition_schedule", [3], { id: 3 }, action({ removePreconditionScheduleAction: { id: 3 } })],
    ["batch_remove_charge_schedules", [true, false, true], { home: true, work: false, other: true }, action({ batchRemoveChargeSchedulesAction: { home: true, other: true } })],
    ["batch_remove_precondition_schedules", [false, true, false], { home: false, work: true, other: false }, action({ batchRemovePreconditionSchedulesAction: { work: true } })],
    ["set_sentry_mode", [true], { on: true }, action({ vehicleControlSetSentryModeAction: { on: true } })],
    ["set_temps", [21.5, 22.5], { driver_temp: 21.5, passenger_temp: 22.5 }, action({ hvacTemperatureAdjustmentAction: { driverTempCelsius: 21.5, passengerTempCelsius: 22.5 } })],
    ["set_valet_mode", [true, 1234], { on: true, password: "1234" }, action({ vehicleControlSetValetModeAction: { on: true, password: "1234" } })],
    ["set_valet_mode", [false], { on: false }, action({ vehicleControlSetValetModeAction: { on: false } })],
    ["set_vehicle_name", ["Herbie"], { vehicle_name: "Herbie" }, action({ setVehicleNameAction: { vehicleName: "Herbie" } })],
    ["speed_limit_activate", [1234], { pin: "1234" }, action({ drivingSpeedLimitAction: { activate: true, pin: "1234" } })],
    ["speed_limit_clear_pin", [1234], { pin: "1234" }, action({ drivingClearSpeedLimitPinAction: { pin: "1234" } })],
    ["speed_limit_clear_pin_admin", [], undefined, action({ drivingClearSpeedLimitPinAdminAction: {} })],
    ["speed_limit_deactivate", [1234], { pin: "1234" }, action({ drivingSpeedLimitAction: { activate: false, pin: "1234" } })],
    ["speed_limit_set_limit", [65], { limit_mph: 65 }, action({ drivingSetSpeedLimitAction: { limitMph: 65 } })],
    ["sun_roof_control", ["vent"], { state: "vent" }, action({ vehicleControlSunroofOpenCloseAction: { vent: VOID } })],
    ["sun_roof_control", ["close"], { state: "close" }, action({ vehicleControlSunroofOpenCloseAction: { close: VOID } })],
    ["take_drivenote", ["brake noise up front"], { note: "brake noise up front" }, action({ takeDrivenoteAction: { note: "brake noise up front" } })],
    // Zero coordinates are coordinates: the regression Python's parity test guards.
    ["trigger_homelink", [0, 0, "tok"], { lat: 0, lon: 0, token: "tok" }, action({ vehicleControlTriggerHomelinkAction: { location: { latitude: 0, longitude: 0 }, token: "tok" } })],
    ["trigger_homelink", [undefined, undefined, "tok"], { token: "tok" }, action({ vehicleControlTriggerHomelinkAction: { token: "tok" } })],
    ["upcoming_calendar_entries", ["some-ics-payload"], { calendar_data: "some-ics-payload" }, action({ uiSetUpcomingCalendarEntries: { calendarData: "some-ics-payload" } })],
    // Accepted gap: the signed action has no coordinates, which only REST uses to check the user's range when closing.
    ["window_control", ["close", 1.5, 2.5], { command: "close", lat: 1.5, lon: 2.5 }, action({ vehicleControlWindowAction: { close: VOID } })],
    ["window_control", ["vent"], { command: "vent" }, action({ vehicleControlWindowAction: { vent: VOID } })],
];

/** Same-named methods this table leaves to a test of its own, below. */
const COVERED_BELOW = ["navigation_request", "nearby_charging_sites"];

describe("cross-transport parity", () => {
    let api: TeslaFleetApi;
    let request: ReturnType<typeof vi.fn>;
    let rest: Record<string, (...args: unknown[]) => Promise<unknown>>;
    let signed: FakeVehicleCommands;

    const call = (target: unknown, name: string, args: unknown[]) => (target as typeof rest)[name](...args);

    beforeEach(() => {
        api = new TeslaFleetApi({ server: "https://fleet.test" });
        request = vi.fn().mockResolvedValue({ response: { result: true, reason: "" } });
        api._request = request as unknown as TeslaFleetApi["_request"];
        rest = new VehicleSpecific(new Vehicle(api), VIN) as unknown as typeof rest;
        signed = new FakeVehicleCommands();
    });

    it("covers every command both transports have", () => {
        const onBoth = Object.getOwnPropertyNames(VehicleSpecific.prototype).filter(
            (name) => name !== "constructor" && Object.getOwnPropertyNames(Commands.prototype).includes(name),
        );

        expect([...new Set([...CASES.map(([name]) => name), ...COVERED_BELOW])].sort()).toEqual(onBoth.sort());
    });

    it.each(CASES)("%s(%j)", async (name, args, body, expected) => {
        await call(rest, name, args);
        await call(signed, name, args);

        expect(request).toHaveBeenCalledOnce();
        const [method, path, params, sent] = request.mock.calls[0];
        expect([method, path, params]).toEqual(["POST", `api/1/vehicles/${VIN}/command/${name}`, body ? null : undefined]);
        expect(sent).toEqual(body);

        const { infotainmentActions, vcsecCommands } = signed.fakeVehicle;
        if ("action" in expected) {
            expect(vcsecCommands).toEqual([]);
            expect(infotainmentActions.map((action) => action.vehicleAction)).toEqual([VehicleAction.create(expected.action as never)]);
        } else {
            expect(infotainmentActions).toEqual([]);
            expect(vcsecCommands).toEqual([UnsignedMessage.create(expected.vcsec as never)]);
        }
    });

    // Accepted gap: `locale` and `type` are REST intent fields with no equivalent in the signed protocol.
    it("navigation_request carries the destination on both transports", async () => {
        await call(rest, "navigation_request", ["Home", "en-AU"]);
        await call(signed, "navigation_request", ["Home", "en-AU"]);

        expect(request.mock.calls[0][3]).toMatchObject({ locale: "en-AU", value: { "android.intent.extra.TEXT": "Home" } });
        expect(signed.fakeVehicle.infotainmentActions[0].vehicleAction?.navigationRequest?.destination).toBe("Home");
    });

    it("nearby_charging_sites asks for the same sites on both transports", async () => {
        await call(rest, "nearby_charging_sites", [5, 100, true]);
        await call(signed, "nearby_charging_sites", [5, 100, true]);

        const [method, path, params] = request.mock.calls[0];
        expect([method, path, params]).toEqual(["GET", `api/1/vehicles/${VIN}/nearby_charging_sites`, { count: 5, radius: 100, detail: true }]);
        expect(signed.fakeVehicle.infotainmentActions[0].vehicleAction?.getNearbyChargingSites).toMatchObject({ count: 5, radius: 100, includeMetaData: true });
    });

    it.each([-1, 11.5])("adjust_volume rejects %s on both transports", async (volume) => {
        await expect(call(rest, "adjust_volume", [volume])).rejects.toThrow("Volume must a number from 0.0 to 11.0");
        await expect(call(signed, "adjust_volume", [volume])).rejects.toThrow("Volume must a number from 0.0 to 11.0");

        expect(request).not.toHaveBeenCalled();
        expect(signed.fakeVehicle.infotainmentActions).toEqual([]);
    });

    it("add_charge_schedule needs a start or an end time on both transports", async () => {
        const message = "Either start_time or end_time or both must be provided";

        await expect(call(rest, "add_charge_schedule", ["All", true, 1, 2])).rejects.toThrow(message);
        await expect(call(signed, "add_charge_schedule", ["All", true, 1, 2])).rejects.toThrow(message);
    });

    // Accepted gap: the signed protocol has no sunroof stop, so it is refused rather than guessed at.
    it("sun_roof_control stop is REST only", async () => {
        await call(rest, "sun_roof_control", ["stop"]);

        expect(request.mock.calls[0][3]).toEqual({ state: "stop" });
        await expect(call(signed, "sun_roof_control", ["stop"])).rejects.toThrow(/not representable/);
    });

    describe("only the signed path validates these locally", () => {
        // REST forwards the value and leaves the verdict to the server.
        it.each([
            ["remote_seat_cooler_request", [0, 1], "Invalid seat position for seat cooling: 0"],
            ["remote_steering_wheel_heat_level_request", [2], "Invalid steering wheel heat level 2; expected 0, 1 or 3"],
            ["window_control", ["open"], "Invalid window command: open"],
        ])("%s", async (name, args, message) => {
            await expect(call(signed, name, args)).rejects.toThrow(message);

            expect(signed.fakeVehicle.infotainmentActions).toEqual([]);
        });
    });
});
