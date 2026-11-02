// The `tesla-fleet-api/powerwall` entry, so a cloud-only importer never loads
// `node:https`. This subpath stays out of `package.json` and `tsdown.config.ts`
// until the read-only run against a real gateway has passed (PW-17).
export type { AuthorizedClient, AuthorizedClients } from "../energyparsers.js";
export { parse_authorized_clients } from "../energyparsers.js";
export {
    DEFAULT_GATEWAY_HOST,
    GRID_EXPORT_RULES,
    OPERATION_MODES,
    PowerwallClient,
    backup_time_remaining,
    battery_level,
    battery_level_raw,
    current_power,
    raw_to_scaled_reserve,
    raw_to_scaled_soc,
    scaled_to_raw_reserve,
    scaled_to_raw_soc,
} from "./client.js";
export type { PowerwallClientOptions } from "./client.js";
export {
    battery_units,
    component,
    component_float,
    component_part_number,
    component_serial,
    component_signal,
    pv_string_current,
} from "./components.js";
export type { BatteryRole, BatteryUnit, SignalValue } from "./components.js";
export { ISLAND_MODE_OFF_GRID, ISLAND_MODE_ON_GRID, PowerwallEnergySite } from "./energysite.js";
export type { CommandResult, LocalConfig } from "./energysite.js";
export {
    PowerwallAuthenticationError,
    PowerwallCommandError,
    PowerwallConnectionError,
    PowerwallError,
    PowerwallFaultError,
    PowerwallKeyRejectedError,
    PowerwallNotSupportedError,
    PowerwallProtocolError,
    PowerwallRateLimitError,
} from "./exceptions.js";
export { connect_gateway, verify_local_gateway } from "./gateway.js";
export type { ConnectGatewayOptions, ConnectGatewayResult, GatewayOutcome } from "./gateway.js";
export {
    ENERGY_CONFIG_INTERVAL_MS,
    ENERGY_LIVE_INTERVAL_MS,
    ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS,
    LiveStatusMerge,
    SiteInfoMerge,
} from "./merge.js";
export type { MergeOptions } from "./merge.js";
export type * from "./models.js";
