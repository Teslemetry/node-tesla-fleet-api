import {
  AlertTypes,
  ClimateMode,
  ClimateModes,
  CommandResponse,
  Level,
  Seat,
  Seats,
  Trunk,
  VehicleDataEndpoint,
} from "./types/commands.js";
import { OptionsResponse } from "./types/responses.js";
import { VehicleResponse } from "./types/vehicle.js";
import { VehicleDataResponse } from "./types/vehicle_data.js";
import { FleetTelemetryConfig } from "./types/fleet_telemetry_config.js";
import Vehicle from "./vehicle.js";

export default class VehicleSpecific {
  parent: Vehicle;
  vin: string;
  model: string;
  pre2021: boolean;

  constructor(parent: Vehicle, vin: string) {
    this.parent = parent;
    this.vin = vin;
    this.model = this.parent.model(this.vin);
    this.pre2021 = this.parent.pre2021(this.vin);
  }

  // Vehicle Commands

  /**
   * Controls the front (which_trunk: "front") or rear (which_trunk: "rear") trunk.
   * @param which_trunk "front" or "rear"
   */
  async actuate_truck(which_trunk: Trunk): Promise<CommandResponse> {
    return this.parent.actuate_truck(this.vin, which_trunk);
  }

  /**
   * Adjusts vehicle media playback volume.
   * @param volume A floating point number from 0.0 to 11.0.
   */
  async adjust_volume(volume: number): Promise<CommandResponse> {
    return this.parent.adjust_volume(this.vin, volume);
  }

  /**
   * Starts climate preconditioning.
   */
  async auto_conditioning_start(): Promise<CommandResponse> {
    return this.parent.auto_conditioning_start(this.vin);
  }

  /**
   * Stops climate preconditioning.
   */
  async auto_conditioning_stop(): Promise<CommandResponse> {
    return this.parent.auto_conditioning_stop(this.vin);
  }

  /**
   * Cancels the countdown to install the vehicle software update.
   */
  async cancel_software_update(): Promise<CommandResponse> {
    return this.parent.cancel_software_update(this.vin);
  }

  /**
   * Charges in max range mode -- we recommend limiting the use of this mode to long trips.
   */
  async charge_max_range(): Promise<CommandResponse> {
    return this.parent.charge_max_range(this.vin);
  }

  /**
   * Closes the charge port door.
   */
  async charge_port_door_close(): Promise<CommandResponse> {
    return this.parent.charge_port_door_close(this.vin);
  }

  /**
   * Opens the charge port door.
   */
  async charge_port_door_open(): Promise<CommandResponse> {
    return this.parent.charge_port_door_open(this.vin);
  }

  /**
   * Charges in Standard mode.
   */
  async charge_standard(): Promise<CommandResponse> {
    return this.parent.charge_standard(this.vin);
  }

  /**
   * Starts charging the vehicle.
   */
  async charge_start(): Promise<CommandResponse> {
    return this.parent.charge_start(this.vin);
  }

  /**
   * Stops charging the vehicle.
   */
  async charge_stop(): Promise<CommandResponse> {
    return this.parent.charge_stop(this.vin);
  }

  /**
   * Deactivates PIN to Drive and resets the associated PIN for vehicles running firmware versions 2023.44+. This command is only accessible to fleet managers or owners.
   */
  async clear_pin_to_drive_admin(): Promise<CommandResponse> {
    return this.parent.clear_pin_to_drive_admin(this.vin);
  }

  /**
   * Locks the vehicle.
   */
  async door_lock(): Promise<CommandResponse> {
    return this.parent.door_lock(this.vin);
  }

  /**
   * Unlocks the vehicle.
   */
  async door_unlock(): Promise<CommandResponse> {
    return this.parent.door_unlock(this.vin);
  }

  /**
   * Erases user's data from the user interface. Requires the vehicle to be in park.
   */
  async erase_user_data(): Promise<CommandResponse> {
    return this.parent.erase_user_data(this.vin);
  }

  /**
   * Briefly flashes the vehicle headlights. Requires the vehicle to be in park.
   */
  async flash_lights(): Promise<CommandResponse> {
    return this.parent.flash_lights(this.vin);
  }

  /**
   * Restricts certain vehicle UI functionality from guest users
   * @param enable `true` or `false`
   */
  async guest_mode(enable: boolean): Promise<CommandResponse> {
    return this.parent.guest_mode(this.vin, enable);
  }

  /**
   * Honks the vehicle horn. Requires the vehicle to be in park.
   */
  async honk_horn(): Promise<CommandResponse> {
    return this.parent.honk_horn(this.vin);
  }

  /**
   * Advances media player to next favorite track.
   */
  async media_next_fav(): Promise<CommandResponse> {
    return this.parent.media_next_fav(this.vin);
  }

  /**
   * Advances media player to next track.
   */
  async media_next_track(): Promise<CommandResponse> {
    return this.parent.media_next_track(this.vin);
  }

  /**
   * Advances media player to previous favorite track.
   */
  async media_prev_fav(): Promise<CommandResponse> {
    return this.parent.media_prev_fav(this.vin);
  }

  /**
   * Advances media player to previous track.
   */
  async media_prev_track(): Promise<CommandResponse> {
    return this.parent.media_prev_track(this.vin);
  }

  /**
   * Toggles current play/pause state.
   */
  async media_toggle_playback(): Promise<CommandResponse> {
    return this.parent.media_toggle_playback(this.vin);
  }

  /**
   * Turns the volume down by one.
   */
  async media_volume_down(): Promise<CommandResponse> {
    return this.parent.media_volume_down(this.vin);
  }

  /**
   * Start navigation to given coordinates. Order can be used to specify order of multiple stops.
   * @param lat Latitude
   * @param lon Longitude
   * @param order Order of multiple stops
   */
  async navigation_gps_request(
    lat: number,
    lon: number,
    order?: number,
  ): Promise<CommandResponse> {
    return this.parent.navigation_gps_request(this.vin, lat, lon, order);
  }

  /**
   * Sends a location to the in-vehicle navigation system.
   * @param type "share_ext_content_raw"
   * @param locale ISO locale such as "en-US"
   * @param timestamp_ms
   */
  async navigation_request(
    value: string,
    locale: string,
    type: string = "share_ext_content_raw",
  ): Promise<CommandResponse> {
    return this.parent.navigation_request(this.vin, value, locale, type);
  }

  /**
   * Start navigation to a supercharger.
   * @param id Supercharger ID
   * @param order Order of multiple stops
   * @returns
   */
  async navigation_sc_request(
    id: number,
    order?: number,
  ): Promise<CommandResponse> {
    return this.parent.navigation_sc_request(this.vin, id, order);
  }

  /**
   * Sets automatic seat heating and cooling.
   * @param auto_seat_position Seat position
   * @param auto_climate_on `true` or `false`
   */
  async remote_auto_seat_climate_request(
    auto_seat_position: Seat | number,
    auto_climate_on: boolean,
  ): Promise<CommandResponse> {
    return this.parent.remote_auto_seat_climate_request(
      this.vin,
      auto_seat_position,
      auto_climate_on,
    );
  }

  /**
   * Sets automatic steering wheel heating on/off.
   * @param on `true` or `false`
   */
  async remote_auto_steering_wheel_heat_climate_request(
    on: boolean,
  ): Promise<CommandResponse> {
    return this.parent.remote_auto_steering_wheel_heat_climate_request(
      this.vin,
      on,
    );
  }

  /**
   * Plays a sound through the vehicle external speaker.
   * @param sound Fart is `0`, Locate ping is `2000`
   */
  async remote_boombox(sound: number = 0): Promise<CommandResponse> {
    return this.parent.remote_boombox(this.vin, sound);
  }

  /**
   * Sets seat cooling.
   * @param seat_position Seat position
   * @param seat_cooler_level Cooling level
   */
  async remote_seat_cooler_request(
    seat_position: Seat | number,
    seat_cooler_level: Level,
  ): Promise<CommandResponse> {
    return this.parent.remote_seat_cooler_request(
      this.vin,
      seat_position,
      seat_cooler_level,
    );
  }

  /**
   * Sets seat heating.
   * @param seat_position Seat position
   * @param seat_heater_level Heating level
   */
  async remote_seat_heater_request(
    seat_position: Seat | number,
    seat_heater_level: Level,
  ): Promise<CommandResponse> {
    return this.parent.remote_seat_heater_request(
      this.vin,
      seat_position,
      seat_heater_level,
    );
  }

  /**
   * Starts the vehicle remotely. Requires keyless driving to be enabled.
   */
  async remote_start_drive(): Promise<CommandResponse> {
    return this.parent.remote_start_drive(this.vin);
  }

  /**
   * Sets steering wheel heat level.
   * @param level Heating level
   */
  async remote_steering_wheel_heat_level_request(
    level: Level,
  ): Promise<CommandResponse> {
    return this.parent.remote_steering_wheel_heat_level_request(
      this.vin,
      level,
    );
  }

  /**
   * Sets steering wheel heating on/off. For vehicles that do not support auto steering wheel heat.
   * @param on `true` or `false`
   */
  async remote_steering_wheel_heater_request(
    on: boolean,
  ): Promise<CommandResponse> {
    return this.parent.remote_steering_wheel_heater_request(this.vin, on);
  }

  /**
   * Removes PIN to Drive. Requires the car to be in Pin to Drive mode and not in Valet mode. Note that this only works if PIN to Drive is not active. This command also requires the Tesla Vehicle Command Protocol - for more information, please see refer to the documentation here.
   */
  async reset_pin_to_drive_pin(): Promise<CommandResponse> {
    return this.parent.reset_pin_to_drive_pin(this.vin);
  }

  /**
   * Removes PIN for Valet Mode.
   */
  async reset_valet_pin(): Promise<CommandResponse> {
    return this.parent.reset_valet_pin(this.vin);
  }

  /**
   * Schedules a vehicle software update (over the air "OTA") to be installed in the future.
   * @param offset_sec Offset in seconds
   */
  async schedule_software_update(offset_sec: number): Promise<CommandResponse> {
    return this.parent.schedule_software_update(this.vin, offset_sec);
  }

  /**
   * Turns Bioweapon Defense Mode on and off.
   * @param on `true` or `false`
   * @param manual_override `true` or `false`
   */
  async set_bioweapon_mode(
    on: boolean,
    manual_override: boolean,
  ): Promise<CommandResponse> {
    return this.parent.set_bioweapon_mode(this.vin, on, manual_override);
  }

  /**
   * Sets the vehicle overheat protection.
   * @param on `true` or `false`
   * @param fan_only `true` or `false`
   */
  async set_cabin_overheat_protection(
    on: boolean,
    fan_only: boolean,
  ): Promise<CommandResponse> {
    return this.parent.set_cabin_overheat_protection(this.vin, on, fan_only);
  }

  /**
   * Sets the vehicle's charge limit to a custom percentage.
   * @param percent Charge limit percentage typically between 50-100
   */
  async set_charge_limit(percent: number): Promise<CommandResponse> {
    return this.parent.set_charge_limit(this.vin, percent);
  }

  /**
   * Sets the charge limit to the standard setting.
   * @param percent Current limit in Amps typically between 5-32
   */
  async set_charging_amps(charging_amps: number): Promise<CommandResponse> {
    return this.parent.set_charging_amps(this.vin, charging_amps);
  }

  /**
   * Enables climate keeper mode.
   * @param climate_keeper_mode `0` is Off, `1` is Keep, `2` is Dog, `3` is Camp
   */
  async set_climate_keeper_mode(
    climate_keeper_mode: number | ClimateMode,
  ): Promise<CommandResponse> {
    return this.parent.set_climate_keeper_mode(this.vin, climate_keeper_mode);
  }

  /**
   * Adjusts the Cabin Overheat Protection temperature (COP).
   * @param cop_temp Integer representing Low (0/30C/90F), Medium (1/35C/95F), or High (2/40C/100F)
   */
  async set_cop_temp(
    cop_temp: 0 | 1 | 2 | 30 | 35 | 40 | 90 | 95 | 100,
  ): Promise<CommandResponse> {
    return this.parent.set_cop_temp(this.vin, cop_temp);
  }

  /**
   * Sets a four-digit passcode for PIN to Drive. This PIN must then be entered before the vehicle can be driven.
   * @param on `true` or `false`
   * @param password Four-digit passcode
   */
  async set_pin_to_drive(
    on: boolean,
    password: string | number,
  ): Promise<CommandResponse> {
    return this.parent.set_pin_to_drive(this.vin, on, password);
  }

  /**
   * Sets an override for preconditioning — it should default to empty if no override is used.
   * Also known as "Defrost Mode"
   * @param on `true` or `false`
   * @param manual_override `true` or `false`
   */
  async set_preconditioning_max(
    on: boolean,
    manual_override: boolean,
  ): Promise<CommandResponse> {
    return this.parent.set_preconditioning_max(this.vin, on, manual_override);
  }

  /**
   * Sets a time at which charging should be completed. The time parameter is minutes after midnight (e.g: time=120 schedules charging for 2:00am vehicle local time).
   * @param enable `true` or `false`
   * @param time Minutes after midnight
   */
  async set_scheduled_charging(
    enable: boolean,
    time: number,
  ): Promise<CommandResponse> {
    return this.parent.set_scheduled_charging(this.vin, enable, time);
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
    end_off_peak_time: number = 0,
  ): Promise<CommandResponse> {
    return this.parent.set_scheduled_departure(
      this.vin,
      enable,
      preconditioning_enabled,
      preconditioning_weekdays_only,
      departure_time,
      off_peak_charging_enabled,
      off_peak_charging_weekdays_only,
      end_off_peak_time,
    );
  }

  /**
   * Enables and disables Sentry Mode. Sentry Mode allows customers to watch the vehicle cameras live from the mobile app, as well as record sentry events.
   * @param on `true` or `false`
   */
  async set_sentry_mode(on: boolean): Promise<CommandResponse> {
    return this.parent.set_sentry_mode(this.vin, on);
  }

  /**
   * Sets the driver and/or passenger-side cabin temperature (and other zones if sync is enabled).
   * @param driver_temp Driver temperature
   * @param passenger_temp Passenger temperature
   */
  async set_temps(
    driver_temp: number,
    passenger_temp: number,
  ): Promise<CommandResponse> {
    return this.parent.set_temps(this.vin, driver_temp, passenger_temp);
  }

  /**
   * Turns on Valet Mode and sets a four-digit passcode that must then be entered to disable Valet Mode.
   * @param on `true` or `false`
   * @param password Four-digit passcode
   */
  async set_valet_mode(
    on: boolean,
    password: string | number,
  ): Promise<CommandResponse> {
    return this.parent.set_valet_mode(this.vin, on, password);
  }

  /**
   * Changes the name of a vehicle. This command also requires the Tesla Vehicle Command Protocol - for more information, please see refer to the documentation here.
   * @param vehicle_name New name
   */
  async set_vehicle_name(vehicle_name: string): Promise<CommandResponse> {
    return this.parent.set_vehicle_name(this.vin, vehicle_name);
  }

  /**
   * Activates Speed Limit Mode with a four-digit PIN.
   * @param pin Four-digit PIN
   */
  async speed_limit_activate(pin: string | number): Promise<CommandResponse> {
    return this.parent.speed_limit_activate(this.vin, pin);
  }

  /**
   * Deactivates Speed Limit Mode and resets the associated PIN.
   * @param pin Four-digit PIN
   */
  async speed_limit_clear_pin(pin: string | number): Promise<CommandResponse> {
    return this.parent.speed_limit_clear_pin(this.vin, pin);
  }

  /**
   * Deactivates Speed Limit Mode and resets the associated PIN for vehicles running firmware versions 2023.38+. This command is only accessible to fleet managers or owners.
   */
  async speed_limit_clear_pin_admin(): Promise<CommandResponse> {
    return this.parent.speed_limit_clear_pin_admin(this.vin);
  }

  /**
   * Deactivates Speed Limit Mode.
   * @param pin Four-digit PIN
   */
  async speed_limit_deactivate(pin: string | number): Promise<CommandResponse> {
    return this.parent.speed_limit_deactivate(this.vin, pin);
  }

  /**
   * Sets the maximum speed allowed when Speed Limit Mode is active.
   * @param limit_mph Maximum speed in MPH
   */
  async speed_limit_set_limit(limit_mph: number): Promise<CommandResponse> {
    return this.parent.speed_limit_set_limit(this.vin, limit_mph);
  }

  /**
   * Controls the panoramic sunroof on the Model S.
   * @param state "stop", "close" or "vent"
   */
  async sun_roof_control(
    state: "stop" | "close" | "vent",
  ): Promise<CommandResponse> {
    return this.parent.sun_roof_control(this.vin, state);
  }

  /**
   * Records a drive note. The note parameter is truncated to 80 characters in length.
   * @param note Drive note
   */
  async take_drivenote(note: string): Promise<CommandResponse> {
    return this.parent.take_drivenote(this.vin, note);
  }

  /**
   * Turns on HomeLink (used to open and close garage doors).
   * @param token
   * @param lat Latitude
   * @param lon Longitude
   */
  async trigger_homelink(
    lat: number,
    lon: number,
    token?: string,
  ): Promise<CommandResponse> {
    return this.parent.trigger_homelink(this.vin, lat, lon, token);
  }

  /**
   * Upcoming calendar entries stored on the vehicle.
   * @param calendar_data Calendar data
   */
  async upcoming_calendar_entries(
    calendar_data: string,
  ): Promise<CommandResponse> {
    return this.parent.upcoming_calendar_entries(this.vin, calendar_data);
  }

  /**
   * Control the windows of a parked vehicle. Supported commands: vent and close. When closing, specify lat and lon of user to ensure they are within range of vehicle (unless this is an M3 platform vehicle).
   * @param command "vent" or "close"
   * @param lat Latitude
   * @param lon Longitude
   */
  async window_control(
    command: "vent" | "close",
    lat: number,
    lon: number,
  ): Promise<CommandResponse> {
    return this.parent.window_control(this.vin, command, lat, lon);
  }

  // Vehicle Endpoints

  /**
   * Returns all allowed drivers for a vehicle. This endpoint is only available for the vehicle owner.
   */
  async drivers(): Promise<Record<string, any>> {
    return this.parent.drivers(this.vin);
  }

  /**
   * Removes driver access from a vehicle. Share users can only remove their own access. Owners can remove share access or their own.
   * @param share_user_id
   */
  async drivers_remove(share_user_id?: number): Promise<Record<string, any>> {
    return this.parent.drivers_remove(this.vin, share_user_id);
  }

  /**
   * Returns eligible vehicle subscriptions.
   * @param vin Vehicle Identification Number
   */
  async eligible_subscriptions(): Promise<Record<string, any>> {
    return this.parent.eligible_subscriptions(this.vin);
  }

  /**
   * Returns eligibile vehicle upgrades.
   * @param vin Vehicle Identification Number
   */
  async eligible_upgrades(): Promise<Record<string, any>> {
    return this.parent.eligible_upgrades(this.vin);
  }

  /**
   * Checks whether vehicles can accept Tesla commands protocol for the partner's public key
   * @param vins list of Vehicle Identification Number
   * @returns
   */
  async fleet_status(): Promise<Record<string, any>> {
    return this.parent.fleet_status([this.vin]);
  }

  /**
   * Configures vehicles to connect to self-hosted fleet-telemetry server. This endpoint has concurrency 1 (status 429 will be returned if many calls are made at the same time). Multiple vehicles can be configured with a single call.
   * @param config A dictionary description the fleet telemetry configuration
   * @returns
   */
  async fleet_telemetry_config(
    config: FleetTelemetryConfig,
  ): Promise<Record<string, any>> {
    return this.parent.fleet_telemetry_config({
      vins: [this.vin],
      config,
    });
  }

  /**
   * Disconnects vehicles to stream telemetry data to self hosted fleet-telemetry server.
   * @returns
   */
  async fleet_telemetry_config_delete(): Promise<Record<string, any>> {
    return this.parent.fleet_telemetry_config_delete(this.vin);
  }

  /**
   * Fetches a vehicle's fleet telemetry config. synced set to true means the vehicle has adopted the target config. synced set to false means the vehicle will attempt to adopt the target config when it next establishes a backend connection.
   * @returns
   */
  async fleet_telemetry_config_get(): Promise<Record<string, any>> {
    return this.parent.fleet_telemetry_config_get(this.vin);
  }

  /**
   * Returns whether or not mobile access is enabled for the vehicle.
   */
  async mobile_enabled(): Promise<Record<string, any>> {
    return this.parent.mobile_enabled(this.vin);
  }

  /**
   * Returns the charging sites near the current location of the vehicle.
   * @param count
   * @param radius
   * @param detail
   */
  async nearby_charging_sites(
    count?: number,
    radius?: number,
    detail?: boolean,
  ): Promise<Record<string, any>> {
    return this.parent.nearby_charging_sites(this.vin, count, radius, detail);
  }

  /**
   * Returns vehicle option details.
   * @param vin Vehicle Identification Number
   */
  async options(vin: string): Promise<OptionsResponse> {
    return this.parent.options(this.vin);
  }

  /**
   * List of recent alerts
   */
  async recent_alerts(): Promise<Record<string, any>> {
    return this.parent.recent_alerts(this.vin);
  }

  /**
   * Returns firmware release notes.
   * @param staged
   * @param language
   */

  async release_notes(
    staged?: boolean,
    language?: string,
  ): Promise<Record<string, any>> {
    return this.parent.release_notes(this.vin, staged, language);
  }

  /**
   * Returns service data.
   */
  async service_data(): Promise<Record<string, any>> {
    return this.parent.service_data(this.vin);
  }

  /**
   * Returns the share invites for a vehicle.
   */
  async share_invites(): Promise<Record<string, any>> {
    return this.parent.share_invites(this.vin);
  }

  /**
   * Creates a share invite for a vehicle.
   */
  async share_invites_create(): Promise<Record<string, any>> {
    return this.parent.share_invites_create(this.vin);
  }

  /**
   * Revokes a share invite.
   * @param id
   */
  async share_invites_revoke(id: string): Promise<Record<string, any>> {
    return this.parent.share_invites_revoke(this.vin, id);
  }

  /**
   * Signed Commands is a generic endpoint replacing legacy commands.
   * @param routable_message
   */
  async signed_command(routable_message: string): Promise<Record<string, any>> {
    return this.parent.signed_command(this.vin, routable_message);
  }

  /**
   * Returns information about a vehicle.
   */
  async vehicle(): Promise<VehicleResponse> {
    return this.parent.vehicle(this.vin);
  }

  /**
   * Makes a live call to the vehicle. This may return cached data if the vehicle is offline. For vehicles running firmware versions 2023.38+, location_data is required to fetch vehicle location. This will result in a location sharing icon to show on the vehicle UI.
   * @param endpoints
   */
  async vehicle_data(
    endpoints?: VehicleDataEndpoint[] | string,
  ): Promise<VehicleDataResponse> {
    return this.parent.vehicle_data(this.vin, endpoints);
  }

  /**
   * Wakes the vehicle from sleep, which is a state to minimize idle energy consumption.
   */
  async wake_up(): Promise<Record<string, any>> {
    return this.parent.wake_up(this.vin);
  }

  /**
   * Returns warranty details.
   * @param vin
   */
  async warranty_details(): Promise<Record<string, any>> {
    return this.parent.warranty_details(this.vin);
  }
}
