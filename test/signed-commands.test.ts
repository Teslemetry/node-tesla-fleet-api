import { describe, expect, it } from "vitest";
import { ClosureMoveTypeE, RKEActionE, UnsignedMessage } from "@teslemetry/tesla-protocol/command/vcsec";
import {
    SetOutletsOnOffAction_OutletRequest,
    SetPowerFeedOnOffAction_PowerFeedRequest,
    SetPowershareFeatureAction_PowershareFeatureRequest,
    SetPowershareRequestAction_PowershareRequest,
    SetZoneLightRequestAction_ZoneLightRequest,
    ActionStatus,
    ChargeOnSolarFeature,
    GetManagedChargingSitesResponse,
    GetRateTariffResponse,
    NearbyChargingSites,
    OperationStatusE,
    Response,
    SetRateTariffRequest_Seasons,
    SetRateTariffRequest_Tariff,
    SetSuspensionLevelAction_SuspensionLevel,
    VehicleAction,
} from "@teslemetry/tesla-protocol/command/car_server";
import { FakeVehicleCommands } from "./helpers/testcommands.js";

const SEASONS = SetRateTariffRequest_Seasons.create({ Winter: { fromDay: 1, fromMonth: 5, toDay: 31, toMonth: 8 } });
const TARIFF = SetRateTariffRequest_Tariff.create({ code: "TOU-1", currency: "AUD" });

type Call = (vehicle: FakeVehicleCommands) => Promise<unknown>;

type DeepPartial<T> = T extends Date | Uint8Array ? T : T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/** Commands the Infotainment computer takes, each with the whole `VehicleAction` it must decode to. */
const infotainment: [name: string, call: Call, expected: DeepPartial<VehicleAction>][] = [
    // ENG-35 / SGN-6
    ["media_volume_up", (v) => v.media_volume_up(), { mediaUpdateVolume: { volumeDelta: 1 } }],
    [
        "navigation_gps_destination_request",
        (v) => v.navigation_gps_destination_request(37.5, -122.25, "Home", 2),
        { navigationGpsDestinationRequest: { lat: 37.5, lon: -122.25, destination: "Home", order: 2 } },
    ],
    [
        "navigation_gps_destination_request, replacing the trip by default",
        (v) => v.navigation_gps_destination_request(37.5, -122.25, "Home"),
        { navigationGpsDestinationRequest: { lat: 37.5, lon: -122.25, destination: "Home", order: 0 } },
    ],
    ["navigation_route", (v) => v.navigation_route(), { navigationRouteAction: {} }],
    ["navigation_waypoints_request", (v) => v.navigation_waypoints_request("refId:a,refId:b"), { navigationWaypointsRequest: { waypoints: "refId:a,refId:b" } }],
    ["reset_pin_to_drive_admin", (v) => v.reset_pin_to_drive_admin(), { vehicleControlResetPinToDriveAdminAction: {} }],
    ["clear_pin_to_drive_admin", (v) => v.clear_pin_to_drive_admin("1234"), { vehicleControlResetPinToDriveAdminAction: {} }],

    // ENG-36 / SGN-7
    ["set_keep_accessory_power_mode", (v) => v.set_keep_accessory_power_mode(true), { setKeepAccessoryPowerModeAction: { keepAccessoryPowerMode: true } }],
    ["set_low_power_mode", (v) => v.set_low_power_mode(true), { setLowPowerModeAction: { lowPowerMode: true } }],
    ["set_recirculation", (v) => v.set_recirculation(true), { hvacRecirculationAction: { on: true } }],
    ["set_suspension_level", (v) => v.set_suspension_level(6), { setSuspensionLevelAction: { suspensionLevel: SetSuspensionLevelAction_SuspensionLevel.SUSPENSION_LEVEL_EXTRACT } }],
    ["set_tent_mode", (v) => v.set_tent_mode(true), { setTentModeRequestAction: { on: true } }],
    ["start_light_show", (v) => v.start_light_show(3, 1234, 0.5, true), { startLightShowAction: { showIndex: 3, startTime: 1234, volume: 0.5, danceMoves: true } }],
    ["start_light_show, defaults", (v) => v.start_light_show(), { startLightShowAction: {} }],
    ["stop_light_show", (v) => v.stop_light_show(), { stopLightShowAction: {} }],
    ["dashcam_save_clip", (v) => v.dashcam_save_clip(), { dashcamSaveClipAction: {} }],
    ["cancel_soh_test", (v) => v.cancel_soh_test(), { cancelSohTestAction: {} }],
    ["nearby_charging_sites", (v) => v.nearby_charging_sites(5, 100, true), { getNearbyChargingSites: { count: 5, radius: 100, includeMetaData: true } }],
    ["nearby_charging_sites, no arguments", (v) => v.nearby_charging_sites(), { getNearbyChargingSites: {} }],
    ["video_request", (v) => v.video_request("https://video.test/a"), { videoRequestAction: { url: "https://video.test/a" } }],
    ["get_messages", (v) => v.get_messages(), { getMessagesAction: {} }],

    // ENG-37 / SGN-8
    [
        "add_charge_schedule, a midnight start with no end",
        (v) => v.add_charge_schedule("monday", true, 0, 0, 0),
        { addChargeScheduleAction: { daysOfWeek: 2, enabled: true, startEnabled: true, startTime: 0, endEnabled: false } },
    ],
    [
        "add_charge_schedule, every field",
        (v) => v.add_charge_schedule("Mon,Wed", false, -33.5, 151.25, 60, 360, true, 7, "Work"),
        {
            addChargeScheduleAction: {
                daysOfWeek: 10,
                enabled: false,
                latitude: -33.5,
                longitude: 151.25,
                startEnabled: true,
                startTime: 60,
                endEnabled: true,
                endTime: 360,
                oneTime: true,
                id: 7,
                name: "Work",
            },
        },
    ],
    ["remove_charge_schedule", (v) => v.remove_charge_schedule(7), { removeChargeScheduleAction: { id: 7 } }],
    [
        "add_precondition_schedule, day names",
        (v) => v.add_precondition_schedule("Weekdays", true, 1.5, 2.5, 450),
        { addPreconditionScheduleAction: { daysOfWeek: 62, enabled: true, latitude: 1.5, longitude: 2.5, preconditionTime: 450 } },
    ],
    [
        "add_precondition_schedule, every field",
        (v) => v.add_precondition_schedule(127, false, 1.5, 2.5, 450, 3, true, "Morning"),
        {
            addPreconditionScheduleAction: {
                daysOfWeek: 127,
                enabled: false,
                latitude: 1.5,
                longitude: 2.5,
                preconditionTime: 450,
                id: 3,
                oneTime: true,
                name: "Morning",
            },
        },
    ],
    ["remove_precondition_schedule", (v) => v.remove_precondition_schedule(3), { removePreconditionScheduleAction: { id: 3 } }],
    ["batch_remove_charge_schedules", (v) => v.batch_remove_charge_schedules(true, false, true), { batchRemoveChargeSchedulesAction: { home: true, work: false, other: true } }],
    [
        "batch_remove_precondition_schedules",
        (v) => v.batch_remove_precondition_schedules(false, true, false),
        { batchRemovePreconditionSchedulesAction: { home: false, work: true, other: false } },
    ],
    [
        "update_charge_on_solar",
        (v) => v.update_charge_on_solar(true, 50.5, 80.5),
        { updateChargeOnSolarFeatureRequest: { chargeOnSolar: { enabled: true, lowerChargeLimit: 50.5, upperChargeLimit: 80.5 } } },
    ],
    ["get_charge_on_solar", (v) => v.get_charge_on_solar(), { getChargeOnSolarFeatureRequest: {} }],
    ["set_rate_tariff", (v) => v.set_rate_tariff(SEASONS, TARIFF), { setRateTariffRequest: { seasons: SEASONS, tariff: TARIFF } }],
    ["set_rate_tariff, no tariff", (v) => v.set_rate_tariff(SEASONS), { setRateTariffRequest: { seasons: SEASONS } }],
    ["get_rate_tariff", (v) => v.get_rate_tariff(), { getRateTariffRequest: {} }],
    [
        "add_managed_charging_site",
        (v) => v.add_managed_charging_site("point", "1234-DIN", 1.5, 2.5),
        {
            addManagedChargingSiteRequest: {
                site: { publicKey: "point", managerType: { siteController: { din: "1234-DIN" } }, latLon: { latitude: 1.5, longitude: 2.5 } },
            },
        },
    ],
    ["remove_managed_charging_site", (v) => v.remove_managed_charging_site("point"), { removeManagedChargingSiteRequest: { publicKey: "point" } }],
    ["get_managed_charging_sites", (v) => v.get_managed_charging_sites(), { getManagedChargingSitesRequest: {} }],
    ["set_discharge_limit", (v) => v.set_discharge_limit(20), { setDischargeLimitAction: { dischargeLimit: 20 } }],

    // Doc 01 section 12: a present recurrence block switches its feature on.
    [
        "set_scheduled_departure, leaving preconditioning and off-peak charging off",
        (v) => v.set_scheduled_departure(true, false, false, 480, false, false, 360),
        { scheduledDepartureAction: { enabled: true, departureTime: 480, offPeakHoursEndTime: 360 } },
    ],
    [
        "set_scheduled_departure, all week",
        (v) => v.set_scheduled_departure(true, true, false, 480, true, false, 360),
        {
            scheduledDepartureAction: {
                enabled: true,
                departureTime: 480,
                preconditioningTimes: { allWeek: {} },
                offPeakChargingTimes: { allWeek: {} },
                offPeakHoursEndTime: 360,
            },
        },
    ],
    [
        "set_scheduled_departure, weekdays only",
        (v) => v.set_scheduled_departure(true, false, true, 480, false, true, 360),
        {
            scheduledDepartureAction: {
                enabled: true,
                departureTime: 480,
                preconditioningTimes: { weekdays: {} },
                offPeakChargingTimes: { weekdays: {} },
                offPeakHoursEndTime: 360,
            },
        },
    ],

    // ENG-38 / SGN-9
    ["set_powershare_feature, on", (v) => v.set_powershare_feature(true), { setPowershareFeatureAction: { powershareFeatureRequest: SetPowershareFeatureAction_PowershareFeatureRequest.POWERSHARE_FEATURE_REQUEST_ON } }],
    ["set_powershare_feature, off", (v) => v.set_powershare_feature(false), { setPowershareFeatureAction: { powershareFeatureRequest: SetPowershareFeatureAction_PowershareFeatureRequest.POWERSHARE_FEATURE_REQUEST_OFF } }],
    ["set_powershare_request, on", (v) => v.set_powershare_request(true), { setPowershareRequestAction: { powershareRequest: SetPowershareRequestAction_PowershareRequest.POWERSHARE_REQUEST_ON } }],
    ["set_powershare_request, off", (v) => v.set_powershare_request(false), { setPowershareRequestAction: { powershareRequest: SetPowershareRequestAction_PowershareRequest.POWERSHARE_REQUEST_OFF } }],
    ["set_powershare_discharge_limit", (v) => v.set_powershare_discharge_limit(20), { setPowershareDischargeLimitAction: { powershareDischargeLimit: 20 } }],
    ["set_outlets", (v) => v.set_outlets(2), { setOutletsOnOffAction: { outletRequest: SetOutletsOnOffAction_OutletRequest.OUTLET_REQUEST_CABIN } }],
    ["set_outlet_timer", (v) => v.set_outlet_timer(30), { setOutletTimerAction: { numMinutes: 30 } }],
    ["set_outlet_soc_limit", (v) => v.set_outlet_soc_limit(25), { setOutletSocLimitAction: { percent: 25 } }],
    ["set_power_feed", (v) => v.set_power_feed(3), { setPowerFeedOnOffAction: { powerFeedRequest: SetPowerFeedOnOffAction_PowerFeedRequest.POWER_FEED_REQUEST_FEED_1_AND_FEED_2 } }],
    ["set_power_feed_timer", (v) => v.set_power_feed_timer(45), { setPowerFeedTimerAction: { numMinutes: 45 } }],
    ["set_power_feed_soc_limit", (v) => v.set_power_feed_soc_limit(35), { setPowerFeedSocLimitAction: { percent: 35 } }],
    ["set_lightbar_brightness", (v) => v.set_lightbar_brightness(70), { setLightbarBrightnessAction: { brightnessRequest: 70 } }],
    ["set_lightbar_middle", (v) => v.set_lightbar_middle(true), { setLightbarMiddleAction: { middleLightRequest: true } }],
    ["set_lightbar_ditch", (v) => v.set_lightbar_ditch(true), { setLightbarDitchAction: { ditchLightsRequest: true } }],
    ["set_front_zone_lights", (v) => v.set_front_zone_lights(2), { setFrontZoneLightRequestAction: { zoneLightRequest: SetZoneLightRequestAction_ZoneLightRequest.ZONE_LIGHT_REQUEST_MED } }],
    ["set_rear_zone_lights", (v) => v.set_rear_zone_lights(3), { setRearZoneLightRequestAction: { zoneLightRequest: SetZoneLightRequestAction_ZoneLightRequest.ZONE_LIGHT_REQUEST_HIGH } }],
    ["set_trailer_light_test", (v) => v.set_trailer_light_test(true), { setTrailerLightTestStartStopAction: { startStop: true } }],
    ["set_truck_bed_light_auto", (v) => v.set_truck_bed_light_auto(true), { setTruckBedLightAutoStateAction: { powerState: true } }],
    ["set_truck_bed_light_brightness", (v) => v.set_truck_bed_light_brightness(40), { setTruckBedLightBrightnessAction: { brightness: 40 } }],
];

/** Commands the Vehicle Security computer takes, each with the whole `UnsignedMessage` it must decode to. */
const vehicleSecurity: [name: string, call: Call, expected: DeepPartial<UnsignedMessage>][] = [
    // ENG-35 / SGN-6
    ["actuate_trunk, front", (v) => v.actuate_trunk("front"), { closureMoveRequest: { frontTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE } }],
    ["actuate_trunk, rear", (v) => v.actuate_trunk("rear"), { closureMoveRequest: { rearTrunk: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE } }],
    ["open_tonneau", (v) => v.open_tonneau(), { closureMoveRequest: { tonneau: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN } }],
    ["close_tonneau", (v) => v.close_tonneau(), { closureMoveRequest: { tonneau: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE } }],
    ["stop_tonneau", (v) => v.stop_tonneau(), { closureMoveRequest: { tonneau: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_STOP } }],
    ["auto_secure_vehicle", (v) => v.auto_secure_vehicle(), { RKEAction: RKEActionE.RKE_ACTION_AUTO_SECURE_VEHICLE }],
];

describe("signed commands round-trip through FakeVehicle", () => {
    it.each(infotainment)("%s", async (_name, call, expected) => {
        const vehicle = new FakeVehicleCommands();

        await expect(call(vehicle)).resolves.toMatchObject({ response: { result: true, reason: "" } });

        expect(vehicle.fakeVehicle.vcsecCommands).toEqual([]);
        expect(vehicle.fakeVehicle.infotainmentActions.map((action) => action.vehicleAction)).toEqual([VehicleAction.create(expected as never)]);
    });

    it.each(vehicleSecurity)("%s", async (_name, call, expected) => {
        const vehicle = new FakeVehicleCommands();

        await expect(call(vehicle)).resolves.toMatchObject({ response: { result: true, reason: "" } });

        expect(vehicle.fakeVehicle.infotainmentActions).toEqual([]);
        expect(vehicle.fakeVehicle.vcsecCommands).toEqual([UnsignedMessage.create(expected as never)]);
    });

    it("nearby_charging_sites returns its payload", async () => {
        const vehicle = new FakeVehicleCommands();
        const getNearbyChargingSites = { congestionSyncTimeUtcSecs: 7, superchargers: [{ name: "Site", id: 1 }] };
        vehicle.fakeVehicle.replyToNextInfotainmentCommandWith(
            Response.create({ actionStatus: ActionStatus.create({ result: OperationStatusE.OPERATIONSTATUS_OK }), getNearbyChargingSites }),
        );

        const reply = await vehicle.nearby_charging_sites(1);

        expect(reply.response.result).toBe(true);
        expect(reply.response.getNearbyChargingSites).toEqual(NearbyChargingSites.create(getNearbyChargingSites));
    });

    it("get_charge_on_solar returns its payload", async () => {
        const vehicle = new FakeVehicleCommands();
        const chargeOnSolar = ChargeOnSolarFeature.create({ enabled: true, lowerChargeLimit: 50, upperChargeLimit: 80 });
        vehicle.fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ getChargeOnSolarFeatureResponse: { chargeOnSolar } }));

        const reply = await vehicle.get_charge_on_solar();

        expect(reply.response.getChargeOnSolarFeatureResponse?.chargeOnSolar).toEqual(chargeOnSolar);
    });

    it("get_rate_tariff returns its payload", async () => {
        const vehicle = new FakeVehicleCommands();
        const getRateTariffResponse = GetRateTariffResponse.create({ seasons: SEASONS });
        vehicle.fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ getRateTariffResponse }));

        const reply = await vehicle.get_rate_tariff();

        expect(reply.response.getRateTariffResponse).toEqual(getRateTariffResponse);
    });

    it("get_managed_charging_sites tells an empty list from no reply payload", async () => {
        const vehicle = new FakeVehicleCommands();
        vehicle.fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ getManagedChargingSitesResponse: {} }));

        const empty = await vehicle.get_managed_charging_sites();

        expect(empty.response.getManagedChargingSitesResponse).toEqual(GetManagedChargingSitesResponse.create({}));
        expect((await vehicle.get_managed_charging_sites()).response.getManagedChargingSitesResponse).toBeUndefined();
    });

    it("add_charge_schedule needs a start or an end time before sending anything", async () => {
        const vehicle = new FakeVehicleCommands();

        await expect(vehicle.add_charge_schedule("All", true, 1, 2)).rejects.toThrow("Either start_time or end_time or both must be provided");

        expect(vehicle.fakeVehicle.infotainmentActions).toEqual([]);
    });

    it("a schedule's unknown day name fails before sending anything", async () => {
        const vehicle = new FakeVehicleCommands();

        await expect(vehicle.add_precondition_schedule("Someday", true, 1, 2, 3)).rejects.toThrow("Invalid day of week: Someday");

        expect(vehicle.fakeVehicle.infotainmentActions).toEqual([]);
    });

    it("set_discharge_limit and set_powershare_discharge_limit build different messages", async () => {
        const vehicle = new FakeVehicleCommands();

        await vehicle.set_discharge_limit(20);
        await vehicle.set_powershare_discharge_limit(20);

        const [general, powershare] = vehicle.fakeVehicle.infotainmentActions.map((action) => action.vehicleAction);
        expect(general).toEqual(VehicleAction.create({ setDischargeLimitAction: { dischargeLimit: 20 } }));
        expect(powershare).toEqual(VehicleAction.create({ setPowershareDischargeLimitAction: { powershareDischargeLimit: 20 } }));
    });

    it("rejects an unknown trunk before sending anything", async () => {
        const vehicle = new FakeVehicleCommands();

        await expect(vehicle.actuate_trunk("middle" as "front")).rejects.toThrow("Invalid trunk");

        expect(vehicle.fakeVehicle.vcsecCommands).toEqual([]);
    });
});
