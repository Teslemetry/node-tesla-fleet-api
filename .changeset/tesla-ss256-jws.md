---
"tesla-fleet-api": minor
---

Add Tesla.SS256, exported as `jws` with `sign`, `verify`, `sign_jws` and `sign_fleet_telemetry_config`. `VehicleSigned.fleet_telemetry_config_create` now signs the config with the vehicle's command key and posts `{ vins, token }` to `fleet_telemetry_config_jws`, taking either the config alone or Python's `{ vins, config }`.
