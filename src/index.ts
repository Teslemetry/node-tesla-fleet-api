import Commands, { infotainment_command_name, vcsec_command_name } from "./commands.js";
import Energy from "./energy.js";
import EnergySpecific, {
    MAX_DISPATCH_DURATION_SECONDS,
    UNSIGNED_DEVICE_COMMANDS,
    validate_dispatch_battery_power,
} from "./energyspecific.js";
import TeslaFleetApi from "./teslafleetapi.js";
import TeslaFleetOAuth from "./oauth.js";
import Teslemetry from "./teslemetry.js";
import Tessie from "./tessie.js";
import Vehicle from "./vehicle.js";
import VehicleSigned from "./vehiclesigned.js";
import VehicleSpecific from "./vehiclespecific.js";

export { Commands, Energy, EnergySpecific, TeslaFleetApi, TeslaFleetOAuth, Teslemetry, Tessie, Vehicle, VehicleSigned, VehicleSpecific };
export { infotainment_command_name, vcsec_command_name };
export type { SendOptions, SendRequires, SignedCommandResponse, SignedReply } from "./commands.js";
export { MAX_DISPATCH_DURATION_SECONDS, UNSIGNED_DEVICE_COMMANDS, validate_dispatch_battery_power };
export { ENERGY_SIGNATURE_TTL_SECONDS, EnergyDeviceSigner } from "./signing/energy.js";
export type { AccessToken } from "./teslafleetapi.js";
export type { RefreshedToken, TeslaFleetOAuthOptions } from "./oauth.js";
export type { Logger } from "./log.js";
export {
    DEFAULT_PAIRING_POLL_INTERVAL,
    DEFAULT_PAIRING_TIMEOUT,
    TeslemetryEnergySite,
    TeslemetryEnergySites,
    parse_authorized_clients,
    parse_gateway_address,
} from "./teslemetryenergy.js";
export type { AuthorizedClient, AuthorizedClients } from "./teslemetryenergy.js";
export { Session } from "./signing/session.js";
export * as jws from "./signing/jws.js";
export {
    ec_private_key_from_pem,
    generate_ec_private_key_pem,
    generate_rsa_private_key_pem,
    rsa_public_der_pkcs1,
} from "./signing/keys.js";
export { DAY_OF_WEEK_BITS, days_of_week_mask } from "./commands.js";
export * from "./exceptions.js";
export { getTariffPeriods, unwrapTariffV2 } from "./tariff.js";
export { firmwareAtLeast, firmwareCompare } from "./util.js";
export * from "./const.js";
export type { TariffRate, TariffPeriod, TariffResolution } from "./tariff.js";
