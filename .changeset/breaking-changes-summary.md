---
"tesla-fleet-api": minor
---

**Breaking changes in this release, in one place.** Each has its own entry below with the detail.

Renames, with no aliases:

- `api.vehicle` is `api.vehicles`, `api.energy` is `api.energySites`, `vehicle.signed()` is `createSigned()`, `energy.specific()` is `create()`, and `Tessie.vehicles()` is `list_vehicles()`.
- `actuate_truck` is `actuate_trunk`, `fleet_telemetry_config` is `fleet_telemetry_config_create`, and `validateAndUpdateSession` is `validate_msg`.
- `loadPrivateKey` is gone. Use `get_private_key`.
- `Teslemetry` and `Tessie` vehicles come from `vehicles.create(vin)`. `createFleet`, `createSigned`, `specific` and `specificSigned` are gone from both.

Reply shapes:

- `products`, `vehicle`, `vehicle_data`, `drivers`, `live_status` and `site_info` return the `{ response }` envelope. `Teslemetry.test()` does too, and `Tessie.list_vehicles()` returns `{ results }`.
- `LiveStatusResponse` values may be `null`.
- Signed `nearby_charging_sites` returns its sites under `response.getNearbyChargingSites`.
- Signed replies carry their payloads, so a read no longer resolves as a bare success.

Arguments:

- `trigger_homelink` takes `(token?, lat?, lon?)`, after `vehicle_tag` on `Vehicle`.
- `remote_seat_cooler_request` takes `AutoSeat` positions on both paths.
- Signed `remote_steering_wheel_heat_level_request` takes `Level` 0, 1 and 3, where 3 is high.
- `backup_history` and `energy_history` take `(period, start_date?, end_date?, time_zone?)`, and `charge_history` takes `(start_date, end_date, time_zone?)`.
- `wake_up` takes `{ wait?, timeoutMs? }`.

Subclasses of `Commands`:

- `_send` is `_send(msg, requires, options?)`, and `validate_msg` needs the request's domain as a third argument.
- A session pins the vehicle's public key at first contact, so a vehicle that really was re-keyed needs a new instance.
