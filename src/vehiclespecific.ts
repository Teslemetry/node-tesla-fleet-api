import { AlertTypes, ClimateMode, ClimateModes, Level, Seat, Seats, Trunk, VehicleDataEndpoint } from "./types.js";
import Vehicle from "./vehicle.js";

interface FleetTelemetryConfig {
    hostname: string;
    ca: string;
    fields: {
        [key: string]: {
            interval_seconds: number;
        };
    };
    alert_types: AlertTypes[];
    exp: number;
    port: number;
}

export default class VehicleSpecific {
    parent: Vehicle;
    vin: String;

    constructor(parent: Vehicle, vin: String) {
        this.parent = parent;
        this.vin = vin;
    }

    // Vehicle Commands

    /**
     * Controls the front (which_trunk: "front") or rear (which_trunk: "rear") trunk.
     * @param which_trunk "front" or "rear"
     */
    async actuate_truck(which_trunk: Trunk): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/actuate_trunk`, null, { which_trunk });
    }

    /**
     * Adjusts vehicle media playback volume.
     * @param volume A floating point number from 0.0 to 11.0.
     */
    async adjust_volume(volume: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/adjust_volume`, null, { volume });
    }

    /**
     * Starts climate preconditioning.
     */
    async auto_conditioning_start(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/auto_conditioning_start`);
    }

    /**
     * Stops climate preconditioning.
     */
    async auto_conditioning_stop(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/auto_conditioning_stop`);
    }

    /**
     * Cancels the countdown to install the vehicle software update.
     */
    async cancel_software_update(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/cancel_software_update`);
    }

    /**
     * Charges in max range mode -- we recommend limiting the use of this mode to long trips.
     */
    async charge_max_range(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/charge_max_range`);
    }

    /**
     * Closes the charge port door.
     */
    async charge_port_door_close(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/charge_port_door_close`);
    }

    /**
     * Opens the charge port door.
     */
    async charge_port_door_open(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/charge_port_door_open`);
    }

    /**
     * Charges in Standard mode.
     */
    async charge_standard(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/charge_standard`);
    }

    /**
     * Starts charging the vehicle.
     */
    async charge_start(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/charge_start`);
    }

    /**
     * Stops charging the vehicle.
     */
    async charge_stop(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/charge_stop`);
    }

    /**
     * Deactivates PIN to Drive and resets the associated PIN for vehicles running firmware versions 2023.44+. This command is only accessible to fleet managers or owners.
     */
    async clear_pin_to_drive_admin(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/clear_pin_to_drive_admin`);
    }

    /**
     * Locks the vehicle.
     */
    async door_lock(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/door_lock`);
    }

    /**
     * Unlocks the vehicle.
     */
    async door_unlock(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/door_unlock`);
    }

    /**
     * Erases user's data from the user interface. Requires the vehicle to be in park.
     */
    async erase_user_data(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/erase_user_data`);
    }

    /**
     * Briefly flashes the vehicle headlights. Requires the vehicle to be in park.
     */
    async flash_lights(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/flash_lights`);
    }

    /**
     * Restricts certain vehicle UI functionality from guest users
     * @param enable `true` or `false`
     */
    async guest_mode(enable: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/guest_mode`, null, { enable });
    }

    /**
     * Honks the vehicle horn. Requires the vehicle to be in park.
     */
    async honk_horn(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/honk_horn`);
    }

    /**
     * Advances media player to next favorite track.
     */
    async media_next_fav(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/media_next_fav`);
    }

    /**
     * Advances media player to next track.
     */
    async media_next_track(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/media_next_track`);
    }

    /**
     * Advances media player to previous favorite track.
     */
    async media_prev_fav(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/media_prev_fav`);
    }

    /**
     * Advances media player to previous track.
     */
    async media_prev_track(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/media_prev_track`);
    }

    /**
     * Toggles current play/pause state.
     */
    async media_toggle_playback(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/media_toggle_playback`);
    }

    /**
     * Turns the volume down by one.
     */
    async media_volume_down(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/media_volume_down`);
    }

    /**
     * Start navigation to given coordinates. Order can be used to specify order of multiple stops.
     * @param lat Latitude
     * @param lon Longitude
     * @param order Order of multiple stops
     */
    async navigation_gps_request(lat: number, lon: number, order?: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/navigation_gps_request`, null, { lat, lon, order });
    }

    /**
     * Sends a location to the in-vehicle navigation system.
     * @param type "share_ext_content_raw"
     * @param locale ISO locale such as "en-US"
     * @param timestamp_ms
     */
    async navigation_request(value: string, locale: string, type: string = "share_ext_content_raw"): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/navigation_request`, null, {
            type,
            locale,
            timestamp_ms: String(Date.now()),
            value: {
                "android.intent.extra.TEXT": value,
            },
        });
    }

    /**
     * Start navigation to a supercharger.
     * @param id Supercharger ID
     * @param order Order of multiple stops
     * @returns
     */
    async navigation_sc_request(id: number, order?: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/navigation_sc_request`, null, { id, order });
    }

    /**
     * Sets automatic seat heating and cooling.
     * @param auto_seat_position Seat position
     * @param auto_climate_on `true` or `false`
     */
    async remote_auto_seat_climate_request(auto_seat_position: Seat | number, auto_climate_on: boolean): Promise<Record<string, any>> {
        if (typeof auto_seat_position === "string") {
            auto_seat_position = Seats[auto_seat_position];
        }
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_auto_seat_climate_request`, null, {
            auto_seat_position,
            auto_climate_on,
        });
    }

    /**
     * Sets automatic steering wheel heating on/off.
     * @param on `true` or `false`
     */
    async remote_auto_steering_wheel_heat_climate_request(on: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_auto_steering_wheel_heat_climate_request`, null, { on });
    }

    /**
     * Plays a sound through the vehicle external speaker.
     * @param sound Fart is `0`, Locate ping is `2000`
     */
    async remote_boombox(sound: number = 0): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_boombox`, null, { sound });
    }

    /**
     * Sets seat cooling.
     * @param seat_position Seat position
     * @param seat_cooler_level Cooling level
     */
    async remote_seat_cooler_request(seat_position: Seat | number, seat_cooler_level: Level): Promise<Record<string, any>> {
        if (typeof seat_position === "string") {
            seat_position = Seats[seat_position];
        }
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_seat_cooler_request`, null, {
            seat_position,
            seat_cooler_level,
        });
    }

    /**
     * Sets seat heating.
     * @param seat_position Seat position
     * @param seat_heater_level Heating level
     */
    async remote_seat_heater_request(seat_position: Seat | number, seat_heater_level: Level): Promise<Record<string, any>> {
        if (typeof seat_position === "string") {
            seat_position = Seats[seat_position];
        }
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_seat_heater_request`, null, {
            seat_position,
            seat_heater_level,
        });
    }

    /**
     * Starts the vehicle remotely. Requires keyless driving to be enabled.
     */
    async remote_start_drive(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_start_drive`);
    }

    /**
     * Sets steering wheel heat level.
     * @param level Heating level
     */
    async remote_steering_wheel_heat_level_request(level: Level): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_steering_wheel_heat_level_request`, null, { level });
    }

    /**
     * Sets steering wheel heating on/off. For vehicles that do not support auto steering wheel heat.
     * @param on `true` or `false`
     */
    async remote_steering_wheel_heater_request(on: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/remote_steering_wheel_heater_request`, null, { on });
    }

    /**
     * Removes PIN to Drive. Requires the car to be in Pin to Drive mode and not in Valet mode. Note that this only works if PIN to Drive is not active. This command also requires the Tesla Vehicle Command Protocol - for more information, please see refer to the documentation here.
     */
    async reset_pin_to_drive_pin(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/reset_pin_to_drive_pin`);
    }

    /**
     * Removes PIN for Valet Mode.
     */
    async reset_valet_pin(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/reset_valet_pin`);
    }

    /**
     * Schedules a vehicle software update (over the air "OTA") to be installed in the future.
     * @param offset_sec Offset in seconds
     */
    async schedule_software_update(offset_sec: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/schedule_software_update`, null, { offset_sec });
    }

    /**
     * Turns Bioweapon Defense Mode on and off.
     * @param on `true` or `false`
     * @param manual_override `true` or `false`
     */
    async set_bioweapon_mode(on: boolean, manual_override: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_bioweapon_mode`, null, { on, manual_override });
    }

    /**
     * Sets the vehicle overheat protection.
     * @param on `true` or `false`
     * @param fan_only `true` or `false`
     */
    async set_cabin_overheat_protection(on: boolean, fan_only: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_cabin_overheat_protection`, null, { on, fan_only });
    }

    /**
     * Sets the vehicle's charge limit to a custom percentage.
     * @param percent Charge limit percentage typically between 50-100
     */
    async set_charge_limit(percent: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_charge_limit`, null, { percent });
    }

    /**
     * Sets the charge limit to the standard setting.
     * @param percent Current limit in Amps typically between 5-32
     */
    async set_charging_amps(charging_amps: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_charging_amps`, null, { charging_amps });
    }

    /**
     * Enables climate keeper mode.
     * @param climate_keeper_mode `0` is Off, `1` is Keep, `2` is Dog, `3` is Camp
     */
    async set_climate_keeper_mode(climate_keeper_mode: number | ClimateMode): Promise<Record<string, any>> {
        if (typeof climate_keeper_mode === "string") {
            climate_keeper_mode = ClimateModes[climate_keeper_mode];
        }
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_climate_keeper_mode`, null, { climate_keeper_mode });
    }

    /**
     * Adjusts the Cabin Overheat Protection temperature (COP).
     * @param cop_temp Integer representing Low (0/30C/90F), Medium (1/35C/95F), or High (2/40C/100F)
     */
    async set_cop_temp(cop_temp: 0 | 1 | 2 | 30 | 35 | 40 | 90 | 95 | 100): Promise<Record<string, any>> {
        if (cop_temp >= 90) {
            cop_temp = (cop_temp - 90) / 5;
        } else if (cop_temp >= 30) {
            cop_temp = (cop_temp - 30) / 5;
        }

        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_cop_temp`, null, { cop_temp });
    }

    /**
     * Sets a four-digit passcode for PIN to Drive. This PIN must then be entered before the vehicle can be driven.
     * @param on `true` or `false`
     * @param password Four-digit passcode
     */
    async set_pin_to_drive(on: boolean, password: string | number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_pin_to_drive`, null, { on, password: String(password) });
    }

    /**
     * Sets an override for preconditioning — it should default to empty if no override is used.
     * Also known as "Defrost Mode"
     * @param on `true` or `false`
     * @param manual_override `true` or `false`
     */
    async set_preconditioning_max(on: boolean, manual_override: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_preconditioning_max`, null, { on, manual_override });
    }

    /**
     * Sets a time at which charging should be completed. The time parameter is minutes after midnight (e.g: time=120 schedules charging for 2:00am vehicle local time).
     * @param enable `true` or `false`
     * @param time Minutes after midnight
     */
    async set_scheduled_charging(enable: boolean, time: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_scheduled_charging`, null, { enable, time });
    }

    /**
     * Sets a time at which departure should be completed. The time parameter is minutes after midnight (e.g: time=120 schedules departure for 2:00am vehicle local time).
     * @param enable `true` or `false`
     * @param preconditioning_enabled `true` or `false`
     * @param preconditioning_weekdays_only `true` or `false`
     * @param departure_time Minutes after midnight
     * @param off_peak_charging_enabled `true` or `false`
     * @param off_peak_charging_weekdays_only `true` or `false`
     * @param end_off_peak_time Minutes after midnight
     */
    async set_scheduled_departure(
        enable: boolean = true,
        preconditioning_enabled: boolean = false,
        preconditioning_weekdays_only: boolean = false,
        departure_time: number = 0,
        off_peak_charging_enabled: boolean = false,
        off_peak_charging_weekdays_only: boolean = false,
        end_off_peak_time: number = 0
    ): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_scheduled_departure`, null, {
            enable,
            preconditioning_enabled,
            preconditioning_weekdays_only,
            departure_time,
            off_peak_charging_enabled,
            off_peak_charging_weekdays_only,
            end_off_peak_time,
        });
    }

    /**
     * Enables and disables Sentry Mode. Sentry Mode allows customers to watch the vehicle cameras live from the mobile app, as well as record sentry events.
     * @param on `true` or `false`
     */
    async set_sentry_mode(on: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_sentry_mode`, null, { on });
    }

    /**
     * Sets the driver and/or passenger-side cabin temperature (and other zones if sync is enabled).
     * @param driver_temp Driver temperature
     * @param passenger_temp Passenger temperature
     */
    async set_temps(driver_temp: number, passenger_temp: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_temps`, null, { driver_temp, passenger_temp });
    }

    /**
     * Turns on Valet Mode and sets a four-digit passcode that must then be entered to disable Valet Mode.
     * @param on `true` or `false`
     * @param password Four-digit passcode
     */
    async set_valet_mode(on: boolean, password: string | number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_valet_mode`, null, { on, password: String(password) });
    }

    /**
     * Changes the name of a vehicle. This command also requires the Tesla Vehicle Command Protocol - for more information, please see refer to the documentation here.
     * @param vehicle_name New name
     */
    async set_vehicle_name(vehicle_name: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/set_vehicle_name`, null, { vehicle_name });
    }

    /**
     * Activates Speed Limit Mode with a four-digit PIN.
     * @param pin Four-digit PIN
     */
    async speed_limit_activate(pin: string | number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/speed_limit_activate`, null, { pin: String(pin) });
    }

    /**
     * Deactivates Speed Limit Mode and resets the associated PIN.
     * @param pin Four-digit PIN
     */
    async speed_limit_clear_pin(pin: string | number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/speed_limit_clear_pin`, null, { pin: String(pin) });
    }

    /**
     * Deactivates Speed Limit Mode and resets the associated PIN for vehicles running firmware versions 2023.38+. This command is only accessible to fleet managers or owners.
     */
    async speed_limit_clear_pin_admin(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/speed_limit_clear_pin_admin`);
    }

    /**
     * Deactivates Speed Limit Mode.
     * @param pin Four-digit PIN
     */
    async speed_limit_deactivate(pin: string | number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/speed_limit_deactivate`, null, { pin: String(pin) });
    }

    /**
     * Sets the maximum speed allowed when Speed Limit Mode is active.
     * @param limit_mph Maximum speed in MPH
     */
    async speed_limit_set_limit(limit_mph: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/speed_limit_set_limit`, null, { limit_mph });
    }

    /**
     * Controls the panoramic sunroof on the Model S.
     * @param state "stop", "close" or "vent"
     */
    async sun_roof_control(state: "stop" | "close" | "vent"): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/sun_roof_control`, null, { state });
    }

    /**
     * Records a drive note. The note parameter is truncated to 80 characters in length.
     * @param note Drive note
     */
    async take_drivenote(note: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/take_drivenote`, null, { note });
    }

    /**
     * Turns on HomeLink (used to open and close garage doors).
     * @param token
     * @param lat Latitude
     * @param lon Longitude
     */
    async trigger_homelink(lat: number, lon: number, token?: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/trigger_homelink`, null, { token, lat, lon });
    }

    /**
     * Upcoming calendar entries stored on the vehicle.
     * @param calendar_data Calendar data
     */
    async upcoming_calendar_entries(calendar_data: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/upcoming_calendar_entries`, null, { calendar_data });
    }

    /**
     * Control the windows of a parked vehicle. Supported commands: vent and close. When closing, specify lat and lon of user to ensure they are within range of vehicle (unless this is an M3 platform vehicle).
     * @param command "vent" or "close"
     * @param lat Latitude
     * @param lon Longitude
     */
    async window_control(command: "vent" | "close", lat: number, lon: number): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/command/window_control`, null, { command, lat, lon });
    }

    // Vehicle Endpoints

    /**
     * Returns all allowed drivers for a vehicle. This endpoint is only available for the vehicle owner.
     */
    async drivers(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/drivers`);
    }

    /**
     * Removes driver access from a vehicle. Share users can only remove their own access. Owners can remove share access or their own.
     * @param share_user_id
     */
    async drivers_remove(share_user_id?: number): Promise<Record<string, any>> {
        return this.parent.parent._request("DELETE", `api/1/vehicles/${this.vin}/drivers`, null, { share_user_id });
    }

    /**
     * Returns eligible vehicle subscriptions.
     * @param vin Vehicle Identification Number
     */
    async eligible_subscriptions(vin: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", "/api/1/dx/vehicles/subscriptions/eligibility", { vin });
    }

    /**
     * Returns eligibile vehicle upgrades.
     * @param vin Vehicle Identification Number
     */
    async eligible_upgrades(vin: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", "/api/1/dx/vehicles/upgrades/eligibility", { vin });
    }

    /**
     * Checks whether vehicles can accept Tesla commands protocol for the partner's public key
     * @param vins list of Vehicle Identification Number
     * @returns
     */
    async fleet_status(vins: Array<String>): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", "api/1/vehicles/fleet_status", null, { vins });
    }

    /**
     * Configures vehicles to connect to self-hosted fleet-telemetry server. This endpoint has concurrency 1 (status 429 will be returned if many calls are made at the same time). Multiple vehicles can be configured with a single call.
     * @param config A dictionary description the fleet telemetry configuration
     * @returns
     */
    async fleet_telemetry_config(config: FleetTelemetryConfig): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", "api/1/vehicles/fleet_telemetry_config", null, { vins: [this.vin], config });
    }

    /**
     * Disconnects vehicles to stream telemetry data to self hosted fleet-telemetry server.
     * @returns
     */
    async fleet_telemetry_config_delete(): Promise<Record<string, any>> {
        return this.parent.parent._request("DELETE", `api/1/vehicles/${this.vin}/fleet_telemetry_config`);
    }

    /**
     * Fetches a vehicle's fleet telemetry config. synced set to true means the vehicle has adopted the target config. synced set to false means the vehicle will attempt to adopt the target config when it next establishes a backend connection.
     * @returns
     */
    async fleet_telemetry_config_get(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/fleet_telemetry_config`);
    }

    /**
     * Returns vehicles belonging to the account.
     * @param page Page number
     * @param per_page Number of items per page
     */
    async list(page?: number, per_page?: number): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", "api/1/vehicles", { page, per_page });
    }

    /**
     * Returns whether or not mobile access is enabled for the vehicle.
     */
    async mobile_enabled(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/mobile_enabled`);
    }

    /**
     * Returns the charging sites near the current location of the vehicle.
     * @param count
     * @param radius
     * @param detail
     */
    async nearby_charging_sites(count?: number, radius?: number, detail?: boolean): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/nearby_charging_sites`, { count, radius, detail });
    }

    /**
     * Returns vehicle option details.
     * @param vin Vehicle Identification Number
     */
    async options(vin: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", "api/1/dx/vehicles/options", { vin });
    }

    /**
     * List of recent alerts
     */
    async recent_alerts(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/recent_alerts`);
    }

    /**
     * Returns firmware release notes.
     * @param staged
     * @param language
     */

    async release_notes(staged?: boolean, language?: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/release_notes`, { staged, language });
    }

    /**
     * Returns service data.
     */
    async service_data(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/service_data`);
    }

    /**
     * Returns the share invites for a vehicle.
     */
    async share_invites(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/invitations`);
    }

    /**
     * Creates a share invite for a vehicle.
     */
    async share_invites_create(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/invitations`);
    }

    /**
     * Redeems a share invite.
     * @param code
     */
    async share_invites_redeem(code: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", "api/1/invitations/redeem", { code });
    }

    /**
     * Revokes a share invite.
     * @param id
     */
    async share_invites_revoke(id: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/invitations/${id}/revoke`);
    }

    /**
     * Signed Commands is a generic endpoint replacing legacy commands.
     * @param routable_message
     */
    async signed_command(routable_message: string): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/signed_command`, null, { routable_message });
    }

    /**
     * Returns information about a vehicle.
     */
    async vehicle(): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}`);
    }

    /**
     * Makes a live call to the vehicle. This may return cached data if the vehicle is offline. For vehicles running firmware versions 2023.38+, location_data is required to fetch vehicle location. This will result in a location sharing icon to show on the vehicle UI.
     * @param endpoints
     */
    async vehicle_data(endpoints?: VehicleDataEndpoint[] | string): Promise<Record<string, any>> {
        if (typeof endpoints === "object") endpoints = endpoints.join(";");
        return this.parent.parent._request("GET", `api/1/vehicles/${this.vin}/vehicle_data`, null, { endpoints });
    }

    /**
     * Wakes the vehicle from sleep, which is a state to minimize idle energy consumption.
     */
    async wake_up(): Promise<Record<string, any>> {
        return this.parent.parent._request("POST", `api/1/vehicles/${this.vin}/wake_up`);
    }

    /**
     * Returns warranty details.
     * @param vin
     */
    async warranty_details(vin: string): Promise<Record<string, any>> {
        return this.parent.parent._request("GET", "api/1/dx/warranty/details", { vin });
    }
}
