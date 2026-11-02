// Routing with per-command failover across backends. Imports `exceptions` only
// at run time: never `src/powerwall` or `src/bluetooth`.
export { FAILOVER_SAFE_ERRORS, Router, VehicleRouter, is_failover_safe } from "./base.js";
export type { Backends, HealthCheck, ResultHandler, Routed, RouterOptions } from "./base.js";
