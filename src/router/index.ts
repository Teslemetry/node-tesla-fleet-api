// Routing with per-command failover across backends. Imports `exceptions` only
// at run time: never `src/powerwall` or `src/bluetooth`.
export { FAILOVER_SAFE_ERRORS, Router, VehicleRouter, is_failover_safe } from "./base.js";
export type { Backends, HealthCheck, ResultHandler, Routed, RouterOptions } from "./base.js";
export {
    EnergySiteRouter,
    LOCAL_LIVE_STATUS_KEYS,
    LOCAL_SITE_INFO_KEYS,
    merge_live_status,
    merge_local_into_cloud,
    merge_site_info,
} from "./energysite.js";
