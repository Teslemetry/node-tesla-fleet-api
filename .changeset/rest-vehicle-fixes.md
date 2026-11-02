---
"tesla-fleet-api": minor
---

REST vehicle fixes (breaking):

- Rename `actuate_truck` to `actuate_trunk` and `fleet_telemetry_config` to `fleet_telemetry_config_create`, with no aliases.
- `clear_pin_to_drive_admin` takes a `pin`, sent in the request body.
- `wake_up` takes `{ wait?, timeoutMs? }`. With `wait: true` it polls `vehicle()` until the vehicle is `online` and throws `VehicleOffline` at the deadline (default 60s).
- `products`, `vehicle`, `vehicle_data` and `drivers` return the full `{ response }` envelope instead of unwrapping it.
- `remote_seat_heater_request` sends `heater` and `level`, which is what the REST endpoint expects.
