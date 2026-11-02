import {
  ClosureState,
  DistanceUnit,
  EnergyDisplayFormat,
  Method,
  SeatHeaterLevel,
  TemperatureUnit,
  TimeDisplayFormat,
  TirePressureUnit,
} from "./const.js";
import type Teslemetry from "./teslemetry.js";
import Vehicle from "./vehicle.js";
import VehicleSpecific from "./vehiclespecific.js";

type Reply = Record<string, any>;

/** What each closure should do. A closure left out, or set to `none`, is not sent. */
export type ClosureOptions = {
  front_driver_door?: ClosureState;
  front_passenger_door?: ClosureState;
  rear_driver_door?: ClosureState;
  rear_passenger_door?: ClosureState;
  rear_trunk?: ClosureState;
  front_trunk?: ClosureState;
  charge_port?: ClosureState;
  tonneau?: ClosureState;
};

/** The heater level for each seat. A seat left out is not sent. */
export type SeatHeaterOptions = {
  front_left?: SeatHeaterLevel;
  front_right?: SeatHeaterLevel;
  rear_left?: SeatHeaterLevel;
  rear_right?: SeatHeaterLevel;
  rear_left_back?: SeatHeaterLevel;
  rear_center?: SeatHeaterLevel;
  rear_right_back?: SeatHeaterLevel;
  third_row_left?: SeatHeaterLevel;
  third_row_right?: SeatHeaterLevel;
};

/** A Teslemetry vehicle: the Fleet REST commands plus Teslemetry's `custom_command` routes. */
export class TeslemetryVehicle extends VehicleSpecific {
  declare parent: TeslemetryVehicles;

  private _request(method: Method, path: string, params?: Record<string, any> | null, json?: Record<string, any> | null): Promise<any> {
    return this.parent.parent._request(method, path, params, json);
  }

  private _custom_command(name: string, json?: Record<string, any>): Promise<Reply> {
    return this._request("POST", `api/1/vehicles/${this.vin}/custom_command/${name}`, null, json);
  }

  /**
   * Get or set Auto mode.
   * @deprecated Python marks this for removal in a future release.
   * @param value `true` enables it, `false` disables it, omit to read it.
   */
  async server_side_polling(value?: boolean | null): Promise<boolean | undefined> {
    this.parent.parent._log("This method is deprecated and will be removed in a future release.");
    return this.parent.parent.server_side_polling(this.vin, value);
  }

  /** Force a refresh of the vehicle data. */
  async data_refresh(): Promise<Reply> {
    return this.parent.parent.vehicle_data_refresh(this.vin);
  }

  /** Performs a no-op on the vehicle. */
  async ping(): Promise<Reply> {
    return this._custom_command("ping");
  }

  /**
   * Open, close, move and stop the vehicle's doors, frunk, trunk, charge port and tonneau.
   * @example await vehicle.closure({ front_trunk: ClosureState.OPEN });
   */
  async closure(options: ClosureOptions = {}): Promise<Reply> {
    const keys: [string, ClosureState | undefined][] = [
      ["frontDriverDoor", options.front_driver_door],
      ["frontPassengerDoor", options.front_passenger_door],
      ["rearDriverDoor", options.rear_driver_door],
      ["rearPassengerDoor", options.rear_passenger_door],
      ["rearTrunk", options.rear_trunk],
      ["frontTrunk", options.front_trunk],
      ["chargePort", options.charge_port],
      ["tonneau", options.tonneau],
    ];
    return this._custom_command("closure", Object.fromEntries(keys.filter(([, state]) => state !== ClosureState.NONE)));
  }

  /** Opens the rear trunk; unlike `actuate_trunk`, never closes it. */
  async open_rear_trunk(): Promise<Reply> {
    return this.closure({ rear_trunk: ClosureState.OPEN });
  }

  /** Closes the rear trunk; unlike `actuate_trunk`, never opens it. */
  async close_rear_trunk(): Promise<Reply> {
    return this.closure({ rear_trunk: ClosureState.CLOSE });
  }

  /** Opens the tonneau cover. */
  async open_tonneau(): Promise<Reply> {
    return this.closure({ tonneau: ClosureState.OPEN });
  }

  /** Closes the tonneau cover. */
  async close_tonneau(): Promise<Reply> {
    return this.closure({ tonneau: ClosureState.CLOSE });
  }

  /** Stops the tonneau cover. */
  async stop_tonneau(): Promise<Reply> {
    return this.closure({ tonneau: ClosureState.STOP });
  }

  /**
   * Sets multiple seat heaters at once.
   * @example await vehicle.seat_heater({ front_left: SeatHeaterLevel.HIGH });
   */
  async seat_heater(options: SeatHeaterOptions = {}): Promise<Reply> {
    return this._custom_command("seat_heater", {
      frontLeft: options.front_left,
      frontRight: options.front_right,
      rearLeft: options.rear_left,
      rearRight: options.rear_right,
      rearLeftBack: options.rear_left_back,
      rearCenter: options.rear_center,
      rearRightBack: options.rear_right_back,
      thirdRowLeft: options.third_row_left,
      thirdRowRight: options.third_row_right,
    });
  }

  /**
   * Enable or disable charging on solar, and set its charge limits.
   * @param enabled
   * @param lower_charge_limit 0 to `upper_charge_limit`
   * @param upper_charge_limit `lower_charge_limit` to 100
   */
  async charge_on_solar(enabled?: boolean, lower_charge_limit?: number, upper_charge_limit?: number): Promise<Reply> {
    return this._custom_command("charge_on_solar", {
      enabled,
      lowerChargeLimit: lower_charge_limit,
      upperChargeLimit: upper_charge_limit,
    });
  }

  /** Gets the current charge-on-solar settings. */
  async get_charge_on_solar(): Promise<Reply> {
    return this._request("GET", `api/1/vehicles/${this.vin}/custom_command/charge_on_solar`);
  }

  /** Save the last 10 minutes of dashcam footage. */
  async dashcam_save(): Promise<Reply> {
    return this._custom_command("dashcam_save");
  }

  /**
   * Play a supported video URL in the vehicle.
   * @param url Video URL, e.g. a YouTube URL.
   */
  async play_video(url: string): Promise<Reply> {
    return this._custom_command("play_video", { url });
  }

  /** Stop the currently playing light show. */
  async stop_light_show(): Promise<Reply> {
    return this._custom_command("stop_light_show");
  }

  /**
   * Start a light show on the vehicle.
   * @param show_index Index of the light show to play.
   * @param start_time Start time in milliseconds since epoch.
   * @param volume Volume level for the light show.
   * @param dance_moves Enable dance moves during the light show.
   */
  async start_light_show(show_index: number, start_time?: number, volume?: number, dance_moves?: boolean): Promise<Reply> {
    return this._custom_command("start_light_show", { show_index, start_time, volume, dance_moves });
  }

  /**
   * Deactivates PIN to Drive.
   * @param pin 4-digit PIN to clear.
   */
  async clear_pin_to_drive(pin: string): Promise<Reply> {
    return this._custom_command("clear_pin_to_drive", { pin });
  }

  /** Remove all impermanent keys from the vehicle. */
  async remove_key(): Promise<Reply> {
    return this._custom_command("remove_key");
  }

  // Below: custom_command routes with no public OpenAPI schema. Python infers
  // their body keys from tesla-protocol field names and the confirmed
  // set_keep_accessory_power_mode {on} shape; they are unverified against
  // Tesla or Teslemetry documentation.

  /**
   * Sets the front zone light level. Named to match the signed sibling for router failover.
   * @param level 0 off, 1 low, 2 medium, 3 high.
   */
  async set_front_zone_lights(level: number): Promise<Reply> {
    return this._custom_command("front_zone_light", { level });
  }

  /**
   * Sets the rear zone light level. Named to match the signed sibling for router failover.
   * @param level 0 off, 1 low, 2 medium, 3 high.
   */
  async set_rear_zone_lights(level: number): Promise<Reply> {
    return this._custom_command("rear_zone_light", { level });
  }

  /**
   * Sets outlets on or off.
   * @param request 0 off, 1 cabin and bed, 2 cabin.
   */
  async set_outlets(request: number): Promise<Reply> {
    return this._custom_command("set_outlets", { request });
  }

  /** Sets the outlet SOC limit percentage. */
  async set_outlet_soc_limit(percent: number): Promise<Reply> {
    return this._custom_command("set_outlet_soc_limit", { percent });
  }

  /**
   * Sets power feed on or off.
   * @param request 0 off, 1 feed 1, 2 feed 2, 3 both.
   */
  async set_power_feed(request: number): Promise<Reply> {
    return this._custom_command("set_power_feed", { request });
  }

  /** Sets the power feed SOC limit percentage. */
  async set_power_feed_soc_limit(percent: number): Promise<Reply> {
    return this._custom_command("set_power_feed_soc_limit", { percent });
  }

  /** Sets the lightbar brightness. */
  async set_lightbar_brightness(brightness: number): Promise<Reply> {
    return this._custom_command("set_lightbar_brightness", { brightness });
  }

  /** Enables or disables the lightbar middle light. */
  async set_lightbar_middle(on: boolean): Promise<Reply> {
    return this._custom_command("set_lightbar_middle", { on });
  }

  /** Enables or disables the ditch lights. */
  async set_lightbar_ditch(on: boolean): Promise<Reply> {
    return this._custom_command("set_lightbar_ditch", { on });
  }

  /** Starts or stops the trailer light test. */
  async set_trailer_light_test(on: boolean): Promise<Reply> {
    return this._custom_command("set_trailer_light_test", { on });
  }

  /** Sets the truck bed light auto state. */
  async set_truck_bed_light_auto(on: boolean): Promise<Reply> {
    return this._custom_command("set_truck_bed_light_auto", { on });
  }

  /** Sets the truck bed light brightness. */
  async set_truck_bed_light_brightness(brightness: number): Promise<Reply> {
    return this._custom_command("set_truck_bed_light_brightness", { brightness });
  }

  /** Enables or disables the Powershare feature. */
  async set_powershare_feature(on: boolean): Promise<Reply> {
    return this._custom_command("set_powershare_feature", { on });
  }

  /** Enables or disables an active Powershare session. */
  async set_powershare_request(on: boolean): Promise<Reply> {
    return this._custom_command("set_powershare_request", { on });
  }

  /** Sets the Powershare discharge limit percentage. */
  async set_powershare_discharge_limit(percent: number): Promise<Reply> {
    return this._custom_command("set_powershare_discharge_limit", { percent });
  }

  /** Sets HVAC recirculation on or off. Named to match the signed sibling for router failover. */
  async set_recirculation(on: boolean): Promise<Reply> {
    return this._custom_command("hvac_recirculation", { on });
  }

  /** Enables or disables tent mode. */
  async set_tent_mode(on: boolean): Promise<Reply> {
    return this._custom_command("set_tent_mode", { on });
  }

  /**
   * Sets the suspension level.
   * @param level 1 entry, 2 low, 3 medium, 4 high, 5 very high, 6 extract.
   */
  async set_suspension_level(level: number): Promise<Reply> {
    return this._custom_command("set_suspension_level", { level });
  }

  /** Turns Low Power mode on or off, reducing standby consumption while parked. */
  async set_low_power_mode(on: boolean): Promise<Reply> {
    return this._custom_command("set_low_power_mode", { on });
  }

  /** Turns Keep Accessory Power mode on or off, keeping 12V accessory power available while parked. */
  async set_keep_accessory_power_mode(on: boolean): Promise<Reply> {
    return this._custom_command("set_keep_accessory_power_mode", { on });
  }

  /** Sets the displayed temperature unit. */
  async set_temperature_unit(unit: TemperatureUnit | number): Promise<Reply> {
    return this._custom_command("set_temperature_unit", { unit });
  }

  /** Sets the displayed distance unit. */
  async set_distance_unit(unit: DistanceUnit | number): Promise<Reply> {
    return this._custom_command("set_distance_unit", { unit });
  }

  /** Sets the displayed clock format (12h or 24h). */
  async set_time_display_format(format: TimeDisplayFormat | number): Promise<Reply> {
    return this._custom_command("set_time_display_format", { format });
  }

  /** Sets the displayed tire pressure unit. */
  async set_tire_pressure_unit(unit: TirePressureUnit | number): Promise<Reply> {
    return this._custom_command("set_tire_pressure_unit", { unit });
  }

  /** Sets the displayed energy unit (percentage or distance). */
  async set_energy_display_format(format: EnergyDisplayFormat | number): Promise<Reply> {
    return this._custom_command("set_energy_display_format", { format });
  }

  /** Activates or deactivates parental controls with a PIN. */
  async parental_controls(activate: boolean, pin: string): Promise<Reply> {
    return this._custom_command("parental_controls", { activate, pin });
  }

  /** Clears the parental controls PIN. */
  async parental_controls_clear_pin(pin: string): Promise<Reply> {
    return this._custom_command("parental_controls_clear_pin", { pin });
  }

  /** Clears the parental controls PIN as admin (fleet manager or owner). */
  async parental_controls_clear_pin_admin(): Promise<Reply> {
    return this._custom_command("parental_controls_clear_pin_admin");
  }

  /**
   * Enables or disables a parental controls setting.
   * @param setting 1 speed limit, 2 acceleration, 3 safety features, 4 curfew.
   * @param enable
   */
  async parental_controls_enable_setting(setting: number, enable: boolean): Promise<Reply> {
    return this._custom_command("parental_controls_enable_setting", { setting, enable });
  }

  /** Sets the parental controls speed limit. */
  async parental_controls_set_speed_limit(limit_mph: number): Promise<Reply> {
    return this._custom_command("parental_controls_set_speed_limit", { limit_mph });
  }

  /**
   * Navigates to coordinates with a named destination. Named to match the signed sibling for router failover.
   * @param lat
   * @param lon
   * @param destination
   * @param order Sent as given: on tesla-protocol 6, `RemoteNavTripOrder_E` is 0 replace, 1 prepend, 2 append.
   */
  async navigation_gps_destination_request(lat: number, lon: number, destination: string, order: number): Promise<Reply> {
    return this._custom_command("navigation_gps_destination", { lat, lon, destination, order });
  }

  /** Auto-secures the vehicle: locks it, closes windows, and so on. */
  async auto_secure_vehicle(): Promise<Reply> {
    return this._custom_command("auto_secure_vehicle");
  }

  /** Cancels a State of Health test. */
  async cancel_soh_test(): Promise<Reply> {
    return this._custom_command("cancel_soh_test");
  }

  /** Returns the charging sites near the vehicle's current location. */
  async get_nearby_charging_sites(count?: number, radius?: number, detail?: boolean): Promise<Reply> {
    return this._custom_command("get_nearby_charging_sites", { count, radius, detail });
  }

  /** Gets the current time-of-use rate tariff schedule. */
  async get_rate_tariff(): Promise<Reply> {
    return this._custom_command("get_rate_tariff");
  }

  /**
   * Triggers a time-of-use rate tariff update, with no schedule payload.
   * Deliberately not named `set_rate_tariff`: the signed sibling takes a
   * required schedule, which a router failing over here would silently drop.
   */
  async trigger_rate_tariff_update(): Promise<Reply> {
    return this._custom_command("set_rate_tariff");
  }
}

/** Creates `TeslemetryVehicle`s. Teslemetry cannot use the Fleet API directly, so `create` is the only factory. */
export class TeslemetryVehicles extends Vehicle {
  /** Class `create` instantiates; a subclass overrides it to supply its own vehicle type. */
  static Vehicle: new (parent: Vehicle, vin: string) => TeslemetryVehicle = TeslemetryVehicle;

  declare parent: Teslemetry;
  declare byVin: Map<string, TeslemetryVehicle>;

  // The base factories raise in Python. Shadowed so calling one is a compile error, and undefined at run time.
  override readonly createFleet = undefined as never;
  override readonly createSigned = undefined as never;
  override readonly specific = undefined as never;
  override readonly specificSigned = undefined as never;

  /** Creates a vehicle, and records it by VIN. */
  create(vin: string): TeslemetryVehicle {
    const vehicle = new (this.constructor as typeof TeslemetryVehicles).Vehicle(this, vin);
    this.byVin.set(vin, vehicle);
    return vehicle;
  }
}
