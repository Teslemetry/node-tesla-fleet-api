/**
 * Tesla Fleet API constants, ported from `python-tesla-fleet-api`'s `const.py`.
 *
 * Each Python enum is a frozen object of the same member names and values, with
 * a same-named type for the union of its values.
 */

export type Region = "na" | "eu" | "cn";

/** BLE command-confirmation ladder depth. */
export type BluetoothConfirmation = "optimistic" | "ack" | "verify";

export const SERVERS: Readonly<Record<Region, string>> = Object.freeze({
    na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
    eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
    cn: "https://fleet-api.prd.cn.vn.cloud.tesla.cn",
});

export const TOKEN_URLS: Readonly<Record<Region, string>> = Object.freeze({
    na: "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token",
    eu: "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token",
    cn: "https://auth.tesla.cn/oauth2/v3/token",
});

/** Check if a string is a valid region and narrow its type. */
export function is_valid_region(value: string): value is Region {
    return Object.hasOwn(SERVERS, value);
}

/** Model name keyed by the fourth character of the VIN. */
export const Models: Readonly<Record<string, string>> = Object.freeze({
    S: "Model S",
    X: "Model X",
    "3": "Model 3",
    Y: "Model Y",
    C: "Cybertruck",
    R: "Roadster",
    T: "Semi",
    A: "Cybercab",
});

type ValueOf<T> = T[keyof T];

/** HTTP methods. */
export const Method = Object.freeze({
    GET: "GET",
    POST: "POST",
    DELETE: "DELETE",
    PATCH: "PATCH",
} as const);
export type Method = ValueOf<typeof Method>;

export const Trunk = Object.freeze({
    FRONT: "front",
    REAR: "rear",
} as const);
export type Trunk = ValueOf<typeof Trunk>;

/** REST `seat_position` values for seat heating. */
export const Seats = Object.freeze({
    FRONT_LEFT: 0,
    FRONT_RIGHT: 1,
    REAR_LEFT: 2,
    REAR_LEFT_BACK: 3,
    /** @deprecated Misspelling kept for parity with Python's `Seat.REAT_LEFT_BACK`; use `REAR_LEFT_BACK`. */
    REAT_LEFT_BACK: 3,
    REAR_CENTER: 4,
    REAR_RIGHT: 5,
    REAR_RIGHT_BACK: 6,
    THIRD_LEFT: 7,
    THIRD_RIGHT: 8,
    /** Alias of `THIRD_LEFT`. */
    THIRD_ROW_LEFT: 7,
    /** Alias of `THIRD_RIGHT`. */
    THIRD_ROW_RIGHT: 8,
} as const);
/** A `Seats` member name. */
export type Seat = keyof typeof Seats;

/** REST `auto_seat_position` values for auto seat climate, which are 1-indexed unlike `Seats`. */
export const AutoSeat = Object.freeze({
    FRONT_LEFT: 1,
    FRONT_RIGHT: 2,
} as const);
export type AutoSeat = ValueOf<typeof AutoSeat>;

/** Rendered vehicle image kinds, matching the proto `VehicleImageStateType` enum. */
export const VehicleImageType = Object.freeze({
    AUTOPILOT_VISUALIZATION_WRAP: 1,
    LICENSE_PLATE: 2,
} as const);
export type VehicleImageType = ValueOf<typeof VehicleImageType>;

export const Level = Object.freeze({
    OFF: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
} as const);
export type Level = ValueOf<typeof Level>;

export const ClimateKeeperMode = Object.freeze({
    OFF: 0,
    KEEP_MODE: 1,
    DOG_MODE: 2,
    CAMP_MODE: 3,
} as const);
export type ClimateKeeperMode = ValueOf<typeof ClimateKeeperMode>;

/** Climate keeper modes keyed by the short names Node's commands accept. */
export const ClimateModes = Object.freeze({ Off: 0, Keep: 1, Dog: 2, Camp: 3 } as const);
export type ClimateMode = keyof typeof ClimateModes;

export const CabinOverheatProtectionTemp = Object.freeze({
    LOW: 0, // 30C 90F
    MEDIUM: 1, // 35C 95F
    HIGH: 2, // 40C 100F
} as const);
export type CabinOverheatProtectionTemp = ValueOf<typeof CabinOverheatProtectionTemp>;

export const VehicleDataEndpoint = Object.freeze({
    CHARGE_STATE: "charge_state",
    CLIMATE_STATE: "climate_state",
    CLOSURES_STATE: "closures_state",
    DRIVE_STATE: "drive_state",
    GUI_SETTINGS: "gui_settings",
    LOCATION_DATA: "location_data",
    CHARGE_SCHEDULE_DATA: "charge_schedule_data",
    PRECONDITIONING_SCHEDULE_DATA: "preconditioning_schedule_data",
    VEHICLE_CONFIG: "vehicle_config",
    VEHICLE_STATE: "vehicle_state",
    VEHICLE_DATA_COMBO: "vehicle_data_combo",
} as const);
export type VehicleDataEndpoint = ValueOf<typeof VehicleDataEndpoint>;

export const SunRoofCommand = Object.freeze({
    STOP: "stop",
    CLOSE: "close",
    VENT: "vent",
} as const);
export type SunRoofCommand = ValueOf<typeof SunRoofCommand>;

export const WindowCommand = Object.freeze({
    VENT: "vent",
    CLOSE: "close",
} as const);
export type WindowCommand = ValueOf<typeof WindowCommand>;

export const DeviceType = Object.freeze({
    ANDROID: "android",
    IOS_DEVELOPMENT: "ios-development",
    IOS_ENTERPRISE: "ios-enterprise",
    IOS_BETA: "ios-beta",
    IOS_PRODUCTION: "ios-production",
} as const);
export type DeviceType = ValueOf<typeof DeviceType>;

/** Fleet API OAuth scopes. */
export const Scope = Object.freeze({
    OPENID: "openid",
    EMAIL: "email",
    PROFILE: "profile",
    METADATA: "metadata",
    OFFLINE_ACCESS: "offline_access",
    USER_DATA: "user_data",
    VEHICLE_DEVICE_DATA: "vehicle_device_data",
    VEHICLE_LOCATION: "vehicle_location",
    VEHICLE_CMDS: "vehicle_cmds",
    VEHICLE_CHARGING_CMDS: "vehicle_charging_cmds",
    ENERGY_DEVICE_DATA: "energy_device_data",
    ENERGY_CMDS: "energy_cmds",
} as const);
export type Scope = ValueOf<typeof Scope>;

export const EnergyOperationMode = Object.freeze({
    AUTONOMOUS: "autonomous",
    SELF_CONSUMPTION: "self_consumption",
    BACKUP: "backup",
} as const);
export type EnergyOperationMode = ValueOf<typeof EnergyOperationMode>;

export const EnergyExportMode = Object.freeze({
    BATTERY_OK: "battery_ok",
    PV_ONLY: "pv_only",
    NEVER: "never",
} as const);
export type EnergyExportMode = ValueOf<typeof EnergyExportMode>;

/** Period for energy site history. */
export const TeslaEnergyPeriod = Object.freeze({
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
    LIFETIME: "lifetime",
} as const);
export type TeslaEnergyPeriod = ValueOf<typeof TeslaEnergyPeriod>;

/**
 * Island mode values for `setIslandModeRequest`. `OFF_GRID` (6) opens the grid
 * contactor when sent with force; `ON_GRID` (1) closes it. Mode 2 only sets a
 * preference and does not operate the contactor.
 */
export const EnergyIslandMode = Object.freeze({
    ON_GRID: 1,
    OFF_GRID: 6,
} as const);
export type EnergyIslandMode = ValueOf<typeof EnergyIslandMode>;

/** Identifier type for energy device gRPC commands. */
export const EnergyDeviceIdentifierType = Object.freeze({
    GATEWAY_DIN: 1,
    SITE_UUID: 2,
    SOLAR_INVERTER_DIN: 3,
    WALL_CONNECTOR_DIN: 4,
} as const);
export type EnergyDeviceIdentifierType = ValueOf<typeof EnergyDeviceIdentifierType>;

/** Key type for energy gateway authorized clients. */
export const AuthorizedClientKeyType = Object.freeze({
    INVALID: 0,
    RSA: 1,
    ECC: 2,
} as const);
export type AuthorizedClientKeyType = ValueOf<typeof AuthorizedClientKeyType>;

/** Client type used when registering an authorized client on an energy gateway. */
export const AuthorizedClientType = Object.freeze({
    INVALID: 0,
    CUSTOMER_MOBILE_APP: 1,
    VEHICLE: 2,
} as const);
export type AuthorizedClientType = ValueOf<typeof AuthorizedClientType>;

/**
 * State of an authorized client on an energy gateway. `PENDING_VERIFICATION_TIMEOUT`
 * is terminal: the presence-proof window expired, so a pairing poll must stop on it.
 */
export const AuthorizedClientState = Object.freeze({
    INVALID: 0,
    PENDING_VERIFICATION: 1,
    PENDING_VERIFICATION_TIMEOUT: 2,
    VERIFIED: 3,
    REMOVED: 4,
} as const);
export type AuthorizedClientState = ValueOf<typeof AuthorizedClientState>;

/** Role granted to an authorized client on an energy gateway. */
export const AuthorizationRole = Object.freeze({
    INVALID: 0,
    CUSTOMER: 1,
    VEHICLE: 2,
} as const);
export type AuthorizationRole = ValueOf<typeof AuthorizationRole>;

/** How an authorized client's presence was verified on an energy gateway. */
export const AuthorizedVerificationType = Object.freeze({
    INVALID: 0,
    PRESENCE_PROOF: 1,
    BLE: 2,
    SIGNED: 3,
    HERMES_COMMAND: 4,
} as const);
export type AuthorizedVerificationType = ValueOf<typeof AuthorizedVerificationType>;

export const ClosureState = Object.freeze({
    NONE: "none",
    MOVE: "move",
    STOP: "stop",
    OPEN: "open",
    CLOSE: "close",
} as const);
export type ClosureState = ValueOf<typeof ClosureState>;

export const SeatHeaterLevel = Object.freeze({
    OFF: "off",
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
} as const);
export type SeatHeaterLevel = ValueOf<typeof SeatHeaterLevel>;

export const TemperatureUnit = Object.freeze({
    FAHRENHEIT: 0,
    CELSIUS: 1,
} as const);
export type TemperatureUnit = ValueOf<typeof TemperatureUnit>;

export const DistanceUnit = Object.freeze({
    MILES: 0,
    KILOMETERS: 1,
} as const);
export type DistanceUnit = ValueOf<typeof DistanceUnit>;

export const TimeDisplayFormat = Object.freeze({
    HOUR_12: 0,
    HOUR_24: 1,
} as const);
export type TimeDisplayFormat = ValueOf<typeof TimeDisplayFormat>;

export const TirePressureUnit = Object.freeze({
    PSI: 0,
    BAR: 1,
} as const);
export type TirePressureUnit = ValueOf<typeof TirePressureUnit>;

export const EnergyDisplayFormat = Object.freeze({
    PERCENTAGE: 0,
    DISTANCE: 1,
} as const);
export type EnergyDisplayFormat = ValueOf<typeof EnergyDisplayFormat>;

export const PhoneFontSize = Object.freeze({
    STANDARD: 0,
    LARGE: 1,
} as const);
export type PhoneFontSize = ValueOf<typeof PhoneFontSize>;

export const BluetoothVehicleData = Object.freeze({
    CHARGE_STATE: "GetChargeState",
    CLIMATE_STATE: "GetClimateState",
    DRIVE_STATE: "GetDriveState",
    LOCATION_STATE: "GetLocationState",
    CLOSURES_STATE: "GetClosuresState",
    CHARGE_SCHEDULE_STATE: "GetChargeScheduleState",
    PRECONDITIONING_SCHEDULE_STATE: "GetPreconditioningScheduleState",
    TIRE_PRESSURE_STATE: "GetTirePressureState",
    MEDIA_STATE: "GetMediaState",
    MEDIA_DETAIL_STATE: "GetMediaDetailState",
    SOFTWARE_UPDATE_STATE: "GetSoftwareUpdateState",
    PARENTAL_CONTROLS_STATE: "GetParentalControlsState",
    GUI_SETTINGS: "GetGuiSettings",
    PARKED_ACCESSORY_STATE: "GetParkedAccessoryState",
    LEGACY_VEHICLE_STATE: "GetLegacyVehicleState",
    ALERT_STATE: "GetAlertState",
    LIGHT_SHOW_STATE: "GetLightShowState",
    SUSPENSION_STATE: "GetSuspensionState",
    CHILD_PRESENCE_DETECTION_STATE: "GetChildPresenceDetectionState",
} as const);
export type BluetoothVehicleData = ValueOf<typeof BluetoothVehicleData>;
