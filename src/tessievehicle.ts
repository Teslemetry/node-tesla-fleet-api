import { Method } from "./const.js";
import type Tessie from "./tessie.js";
import Vehicle from "./vehicle.js";
import VehicleSpecific from "./vehiclespecific.js";

/** Tessie replies at the top level, not in Fleet's `{ response }`, so Fleet's reply types do not fit. */
type Reply = any;

/** Options of `tessie_set_scheduled_departure`. Each flag defaults to `false`. */
export type TessieScheduledDepartureOptions = {
  preconditioning_enabled?: boolean;
  preconditioning_weekdays_only?: boolean;
  off_peak_charging_enabled?: boolean;
  off_peak_charging_weekdays_only?: boolean;
  end_off_peak_time?: number;
  max_attempts?: number;
  wait_for_completion?: boolean;
};

/** Options of `tessie_add_charge_schedule`. */
export type TessieChargeScheduleOptions = {
  start_time?: number;
  end_time?: number;
  one_time?: boolean;
  id?: number;
  max_attempts?: number;
  wait_for_completion?: boolean;
};

/** Options of `tessie_add_precondition_schedule`. */
export type TessiePreconditionScheduleOptions = {
  one_time?: boolean;
  id?: number;
  max_attempts?: number;
  wait_for_completion?: boolean;
};

/**
 * A Tessie vehicle: Tessie's commands and reads, on top of the Fleet REST commands.
 *
 * Commands take `wait_for_completion` and `max_attempts` last, falling back to
 * the client's. As in Python, the `tessie_*` methods take the two in the
 * opposite order to the rest.
 */
export class TessieVehicle extends VehicleSpecific {
  declare parent: TessieVehicles;

  private _request(method: Method, path: string, params?: Record<string, any> | null, json?: Record<string, any> | null): Promise<any> {
    return this.parent.parent._request(method, path, params, json);
  }

  /** The query string of a command, with the client's defaults for anything not given. */
  _command_params(
    wait_for_completion?: boolean | null,
    max_attempts?: number | null,
    params: Record<string, any> = {},
  ): Record<string, any> {
    return {
      wait_for_completion: wait_for_completion ?? this.parent.parent.wait_for_completion,
      ...params,
      max_attempts: max_attempts ?? this.parent.parent.max_attempts,
    };
  }

  private _command(
    name: string,
    wait_for_completion?: boolean | null,
    max_attempts?: number | null,
    params?: Record<string, any>,
  ): Promise<Reply> {
    return this._request("POST", `${this.vin}/command/${name}`, this._command_params(wait_for_completion, max_attempts, params));
  }

  /** Wake the vehicle from sleep. `_wait_for_completion` is accepted and ignored, as in Python. */
  async wake(_wait_for_completion?: boolean | null): Promise<Reply> {
    return this._request("POST", `${this.vin}/wake`);
  }

  /** Lock the doors. */
  async lock(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("lock", wait_for_completion, max_attempts);
  }

  /** Unlock the doors. */
  async unlock(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("unlock", wait_for_completion, max_attempts);
  }

  /** Open the front trunk. */
  async activate_front_trunk(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("activate_front_trunk", wait_for_completion, max_attempts);
  }

  /** Open or close the rear trunk. */
  async activate_rear_trunk(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("activate_rear_trunk", wait_for_completion, max_attempts);
  }

  /** Open the truck tonneau cover. */
  async open_tonneau(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("open_tonneau", wait_for_completion, max_attempts);
  }

  /** Close the truck tonneau cover. */
  async close_tonneau(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("close_tonneau", wait_for_completion, max_attempts);
  }

  /** Open all windows. */
  async vent_windows(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("vent_windows", wait_for_completion, max_attempts);
  }

  /** Close all windows. */
  async close_windows(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("close_windows", wait_for_completion, max_attempts);
  }

  /** Start the climate system. */
  async start_climate(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("start_climate", wait_for_completion, max_attempts);
  }

  /** Stop the climate system. */
  async stop_climate(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("stop_climate", wait_for_completion, max_attempts);
  }

  /** Set the cabin temperature. */
  async set_temperatures(temperature: number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("set_temperatures", wait_for_completion, max_attempts, { temperature });
  }

  /** Adjust a seat's heating level. */
  async set_seat_heat(seat: string, level: number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("set_seat_heat", wait_for_completion, max_attempts, { seat, level });
  }

  /** Adjust a seat's cooling level. */
  async set_seat_cool(seat: string, level: number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("set_seat_cool", wait_for_completion, max_attempts, { seat, level });
  }

  /** Begin defrosting. */
  async start_max_defrost(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("start_max_defrost", wait_for_completion, max_attempts);
  }

  /** End defrosting. */
  async stop_max_defrost(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("stop_max_defrost", wait_for_completion, max_attempts);
  }

  /** Enable the heated steering wheel. */
  async start_steering_wheel_heater(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("start_steering_wheel_heater", wait_for_completion, max_attempts);
  }

  /** Disable the heated steering wheel. */
  async stop_steering_wheel_heater(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("stop_steering_wheel_heater", wait_for_completion, max_attempts);
  }

  /** Configure overheat protection. */
  async tessie_set_cabin_overheat_protection(
    on: boolean,
    fan_only: boolean = false,
    max_attempts?: number | null,
    wait_for_completion?: boolean | null,
  ): Promise<Reply> {
    return this._command("set_cabin_overheat_protection", wait_for_completion, max_attempts, { on, fan_only });
  }

  /** Set the overheat protection temperature. */
  async tessie_set_cop_temp(cop_temp: number, max_attempts?: number | null, wait_for_completion?: boolean | null): Promise<Reply> {
    return this._command("set_cop_temp", wait_for_completion, max_attempts, { cop_temp });
  }

  /** Enable or disable defense mode. */
  async tessie_set_bioweapon_mode(on: boolean, max_attempts?: number | null, wait_for_completion?: boolean | null): Promise<Reply> {
    return this._command("set_bioweapon_mode", wait_for_completion, max_attempts, { on });
  }

  /** Configure climate keeper. */
  async tessie_set_climate_keeper_mode(mode: number, max_attempts?: number | null, wait_for_completion?: boolean | null): Promise<Reply> {
    return this._command("set_climate_keeper_mode", wait_for_completion, max_attempts, { mode });
  }

  /** Begin a charging session. */
  async start_charging(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("start_charging", wait_for_completion, max_attempts);
  }

  /** End a charging session. */
  async stop_charging(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("stop_charging", wait_for_completion, max_attempts);
  }

  /** Set the target charge percentage. */
  override async set_charge_limit(percent: number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("set_charge_limit", wait_for_completion, max_attempts, { percent });
  }

  /** Adjust the charging amperage. */
  async tessie_set_charging_amps(amps: number, max_attempts?: number | null, wait_for_completion?: boolean | null): Promise<Reply> {
    return this._command("set_charging_amps", wait_for_completion, max_attempts, { amps });
  }

  /** Open or unlock the charge port. */
  async open_charge_port(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("open_charge_port", wait_for_completion, max_attempts);
  }

  /** Close the charge port. */
  async close_charge_port(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("close_charge_port", wait_for_completion, max_attempts);
  }

  /** Flash the lights. */
  async flash(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("flash", wait_for_completion, max_attempts);
  }

  /** Sound the horn. */
  async honk(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("honk", wait_for_completion, max_attempts);
  }

  /** Activate a HomeLink device. */
  async tessie_trigger_homelink(max_attempts?: number | null, wait_for_completion?: boolean | null): Promise<Reply> {
    return this._command("trigger_homelink", wait_for_completion, max_attempts);
  }

  /** Enable keyless driving. */
  async remote_start(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("remote_start", wait_for_completion, max_attempts);
  }

  /** Open the sunroof. */
  async vent_sunroof(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("vent_sunroof", wait_for_completion, max_attempts);
  }

  /** Close the sunroof. */
  async close_sunroof(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("close_sunroof", wait_for_completion, max_attempts);
  }

  /** Activate Sentry Mode. */
  async enable_sentry(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("enable_sentry", wait_for_completion, max_attempts);
  }

  /** Deactivate Sentry Mode. */
  async disable_sentry(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("disable_sentry", wait_for_completion, max_attempts);
  }

  /** Activate Valet Mode. */
  async enable_valet(pin?: string | number | null, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("enable_valet", wait_for_completion, max_attempts, { pin: pin != null ? String(pin) : null });
  }

  /** Deactivate Valet Mode. */
  async disable_valet(pin?: string | number | null, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("disable_valet", wait_for_completion, max_attempts, { pin: pin != null ? String(pin) : null });
  }

  /** Schedule an update installation. */
  async tessie_schedule_software_update(in_seconds: number, max_attempts?: number | null, wait_for_completion?: boolean | null): Promise<Reply> {
    return this._command("schedule_software_update", wait_for_completion, max_attempts, { in_seconds });
  }

  /** Cancel a pending update. */
  override async cancel_software_update(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("cancel_software_update", wait_for_completion, max_attempts);
  }

  /** Configure scheduled charging. */
  override async set_scheduled_charging(
    enable: boolean,
    time: number,
    wait_for_completion?: boolean | null,
    max_attempts?: number | null,
  ): Promise<Reply> {
    return this._command("set_scheduled_charging", wait_for_completion, max_attempts, { enable, time });
  }

  /** Configure scheduled departure. */
  async tessie_set_scheduled_departure(
    enable: boolean,
    departure_time: number,
    options: TessieScheduledDepartureOptions = {},
  ): Promise<Reply> {
    return this._command("set_scheduled_departure", options.wait_for_completion, options.max_attempts, {
      enable,
      departure_time,
      preconditioning_enabled: options.preconditioning_enabled ?? false,
      preconditioning_weekdays_only: options.preconditioning_weekdays_only ?? false,
      off_peak_charging_enabled: options.off_peak_charging_enabled ?? false,
      off_peak_charging_weekdays_only: options.off_peak_charging_weekdays_only ?? false,
      end_off_peak_time: options.end_off_peak_time,
    });
  }

  /**
   * Add a charging schedule.
   * @throws Error when neither end is enabled, or an enabled end has no time.
   */
  async tessie_add_charge_schedule(
    days_of_week: string,
    enabled: boolean,
    start_enabled: boolean,
    end_enabled: boolean,
    lat: number,
    lon: number,
    options: TessieChargeScheduleOptions = {},
  ): Promise<Reply> {
    const { start_time, end_time, one_time = false, id } = options;
    if (!start_enabled && !end_enabled) {
      throw new Error("Either start_enabled or end_enabled must be True");
    }
    if (start_enabled && start_time == null) {
      throw new Error("start_time is required when start_enabled is True");
    }
    if (end_enabled && end_time == null) {
      throw new Error("end_time is required when end_enabled is True");
    }
    return this._command("add_charge_schedule", options.wait_for_completion, options.max_attempts, {
      days_of_week,
      enabled,
      start_enabled,
      end_enabled,
      lat,
      lon,
      one_time,
      start_time,
      end_time,
      id,
    });
  }

  /** Delete a charging schedule. */
  override async remove_charge_schedule(id: number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("remove_charge_schedule", wait_for_completion, max_attempts, { id });
  }

  /** Add a preconditioning schedule. */
  async tessie_add_precondition_schedule(
    days_of_week: string,
    enabled: boolean,
    lat: number,
    lon: number,
    precondition_time: number,
    options: TessiePreconditionScheduleOptions = {},
  ): Promise<Reply> {
    const { one_time = false, id } = options;
    return this._command("add_precondition_schedule", options.wait_for_completion, options.max_attempts, {
      days_of_week,
      enabled,
      lat,
      lon,
      precondition_time,
      one_time,
      id,
    });
  }

  /** Delete a preconditioning schedule. */
  override async remove_precondition_schedule(id: number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("remove_precondition_schedule", wait_for_completion, max_attempts, { id });
  }

  /** Share an address or location to the vehicle. */
  async share(value: string, locale: string = "en-US", wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("share", wait_for_completion, max_attempts, { value, locale });
  }

  /** Trigger a novelty sound effect. */
  override async remote_boombox(sound?: number | null, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("remote_boombox", wait_for_completion, max_attempts, { sound });
  }

  /**
   * Set the speed limit.
   * @param limit_mph Used when `mph` is not given.
   * @param wait_for_completion
   * @param max_attempts
   * @param mph
   * @throws Error when neither `mph` nor `limit_mph` is given.
   */
  async set_speed_limit(
    limit_mph?: number | null,
    wait_for_completion?: boolean | null,
    max_attempts?: number | null,
    mph?: number | null,
  ): Promise<Reply> {
    const speed_limit = mph ?? limit_mph;
    if (speed_limit == null) {
      throw new Error("mph or limit_mph is required");
    }
    return this._command("set_speed_limit", wait_for_completion, max_attempts, { mph: speed_limit });
  }

  /** Activate the speed limit. */
  async enable_speed_limit(pin: string | number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("enable_speed_limit", wait_for_completion, max_attempts, { pin: String(pin) });
  }

  /** Deactivate the speed limit. */
  async disable_speed_limit(pin: string | number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("disable_speed_limit", wait_for_completion, max_attempts, { pin: String(pin) });
  }

  /** Remove the speed limit PIN. */
  async clear_speed_limit_pin(pin: string | number, wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("clear_speed_limit_pin", wait_for_completion, max_attempts, { pin: String(pin) });
  }

  /** Activate guest mode. */
  async enable_guest(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("enable_guest", wait_for_completion, max_attempts);
  }

  /** Deactivate guest mode. */
  async disable_guest(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("disable_guest", wait_for_completion, max_attempts);
  }

  /** Enable Keep Accessory Power Mode. */
  async enable_keep_accessory_power_mode(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("enable_keep_accessory_power_mode", wait_for_completion, max_attempts);
  }

  /** Disable Keep Accessory Power Mode. */
  async disable_keep_accessory_power_mode(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("disable_keep_accessory_power_mode", wait_for_completion, max_attempts);
  }

  /** Enable Low Power Mode. */
  async enable_low_power_mode(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("enable_low_power_mode", wait_for_completion, max_attempts);
  }

  /** Disable Low Power Mode. */
  async disable_low_power_mode(wait_for_completion?: boolean | null, max_attempts?: number | null): Promise<Reply> {
    return this._command("disable_low_power_mode", wait_for_completion, max_attempts);
  }
}

/** Creates `TessieVehicle`s. Tessie cannot use the Fleet API directly, so `create` is the only factory. */
export class TessieVehicles extends Vehicle {
  /** Class `create` instantiates; a subclass overrides it to supply its own vehicle type. */
  static Vehicle: new (parent: Vehicle, vin: string) => TessieVehicle = TessieVehicle;

  declare parent: Tessie;
  declare byVin: Map<string, TessieVehicle>;

  // The base factories raise in Python. Shadowed so calling one is a compile error, and undefined at run time.
  override readonly createFleet = undefined as never;
  override readonly createSigned = undefined as never;
  override readonly specific = undefined as never;
  override readonly specificSigned = undefined as never;

  /** Creates a vehicle, and records it by VIN. */
  create(vin: string): TessieVehicle {
    const vehicle = new (this.constructor as typeof TessieVehicles).Vehicle(this, vin);
    this.byVin.set(vin, vehicle);
    return vehicle;
  }
}
