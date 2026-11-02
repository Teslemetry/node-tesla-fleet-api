# tesla-fleet-api

## 0.5.0

### Minor Changes

- 036d760: Rename the product factories to their `python-tesla-fleet-api` names, with no aliases: `api.vehicle` is now `api.vehicles` and `api.energy` is now `api.energySites`. `api.vehicles` gains `createFleet(vin)` (returns `VehicleSpecific`), `createSigned(vin, private_key?, public_key?)` (returns `VehicleSigned`) and the legacy `specificSigned`, replacing `signed()`. `api.energySites.specific(id)` is now `create(id, private_key?, din?)`. Each factory keeps a `Map` of what it created (`byVin`, `byId`). The instantiated classes are static fields (`TeslaFleetApi.Vehicles`/`EnergySites`, `Vehicle.Fleet`/`Signed`, `Energy.Site`) that subclasses override. `Tessie.vehicles()` is now `list_vehicles()`, matching Python and freeing the `vehicles` field.
- f247145: `_request` parity with python-tesla-fleet-api (COR-2):

  - `accessToken` may be a function returning `Promise<string | null>`, called on every request; `access_token()` raises `MissingToken` for a null token.
  - New `fetch` option (used in place of the global `fetch`) and `logger` option (`{ debug(message) }`, silent by default; `debug: true` still logs to `console.debug`). Log lines use Python's `command= transport= result=` fields, for REST and signed commands alike, and never contain the token.
  - `X-Library: node tesla_fleet_api <version>`. No `?` on an empty query, booleans lower-cased in the query, `Content-Type` only with a body, and a GET body is dropped instead of throwing.
  - New `find_server()` (walks `SERVERS`, skipping `InvalidRegion`; Teslemetry uses `metadata()`), `status()`, `partner_login()`, `region`, and the `vcsec_command_name` / `infotainment_command_name` helpers.
  - `Teslemetry` and `Tessie` accept the token function and an options object (`fetch`, `logger`, `debug`, `timeout`).

- 9c91c69: Add the REST vehicle methods `navigation_waypoints_request`, `fleet_telemetry_config_jws`, `add_charge_schedule`, `add_precondition_schedule`, `remove_charge_schedule`, `remove_precondition_schedule`, `batch_remove_charge_schedules` and `batch_remove_precondition_schedules` to `VehicleSpecific`, and export `days_of_week_mask` and `DAY_OF_WEEK_BITS`, matching `python-tesla-fleet-api`.
- 861ee5b: REST vehicle fixes (breaking):

  - Rename `actuate_truck` to `actuate_trunk` and `fleet_telemetry_config` to `fleet_telemetry_config_create`, with no aliases.
  - `clear_pin_to_drive_admin` takes an optional `pin`, sent in the request body.
  - `wake_up` takes `{ wait?, timeoutMs? }`. With `wait: true` it polls `vehicle()` until the vehicle is `online` and throws `VehicleOffline` at the deadline (default 60s).
  - `products`, `vehicle`, `vehicle_data` and `drivers` return the full `{ response }` envelope instead of unwrapping it.
  - `remote_seat_heater_request` sends `heater` and `level`, which is what the REST endpoint expects.

- 3605b2f: Add `unwrapTariffV2` (also on `tesla-fleet-api/tariff`), which extracts `tariff_content_v2` from a `site_info` response, a `time_of_use_settings` body, or a bare tariff, and throws `InvalidResponse` on a null or malformed body. Add `firmwareCompare` and `firmwareAtLeast`, which compare dotted firmware versions numerically, so `"2025.10"` is ahead of `"2025.9"` and `"Unknown"` sorts behind any version.

## 0.4.0

### Minor Changes

- a15ec11: Add `src/const.ts`, a port of `python-tesla-fleet-api`'s `const.py`, exporting every enum (with the same member names and values) plus `Region`, `SERVERS`, `TOKEN_URLS` and `is_valid_region` from the package root.

  - **Breaking:** the third-row `Seats` are now `7` and `8` (they were `6` and `7`, which selected the wrong seat). `THIRD_LEFT`/`THIRD_RIGHT` are added, `THIRD_ROW_LEFT`/`THIRD_ROW_RIGHT` stay as aliases, and `REAR_LEFT_BACK` (3) and `REAR_RIGHT_BACK` (6) now work for signed seat heating.
  - **Breaking:** `remote_auto_seat_climate_request` takes the new 1-indexed `AutoSeat` (front left is `1`, front right is `2`), matching Tesla's REST wire values and the proto enum, on both the REST and the signed path.
  - `Scope` gains `email`, `profile`, `metadata` and `vehicle_location`. `VehicleDataEndpoint` gains `charge_schedule_data` and `preconditioning_schedule_data`. `Models` gains Roadster (`R`). The HTTP `Method` type gains `PATCH` and drops the unused `PUT`.

- 4b44a96: Ship a dual ESM and CommonJS build (via `tsdown`) with an `exports` map: `tesla-fleet-api`, `tesla-fleet-api/tariff`, `tesla-fleet-api/const`, `tesla-fleet-api/router` and `tesla-fleet-api/types`. **Breaking:** deep imports such as `tesla-fleet-api/dist/tariff.js` or `dist/types/site_info.js` no longer resolve; import from the subpaths instead. The package no longer ships `src`, and is marked `"sideEffects": false`.
- 04ba9df: Throw real `Error` subclasses everywhere, ported class-for-class from `python-tesla-fleet-api`'s `exceptions.py` (all 155 classes, the fault lookup tables, `is_key_rejected` and `raise_for_status`). `_request` now rejects with the matching `TeslaFleetError` subclass instead of a bare `{ status, data }` or `{ error }` object; a `fetch` rejection or timeout (new `timeout` option, in ms) becomes `TeslaFleetConnectionError` with the original error as `cause`, and a non-JSON success body becomes `ResponseError`. Adds `BluetoothCloudUnavailableError`.

  **Breaking:** `SignedCommandError`, `NotOnVehicleWhitelistError`, `SignedCommandFaultError` and `RetryableSignedCommandFaultError` are removed, with no aliases. Use `SessionInfoAuthenticationFault`, `NotOnWhitelistFault`, the `TeslaFleetMessageFault*` classes and the `SignedMessageInformationFault*` classes instead. Detail that used to be in the message is now in `data`.

- f6d8e64: Compile with TypeScript `strict` mode targeting ES2022, and require Node.js 22 or newer (`engines.node: ">=22"`). An omitted `accessToken` is now stored as `null` rather than `undefined`, matching its declared type.
- 391ac07: Move to `@teslemetry/tesla-protocol` 6.0 (pinned `~6.0.0`). Signed `navigation_sc_request(id, order?)` now sends the supercharger `id` and the trip order (`0` replace, the default; `1` prepend; `2` append) instead of putting the id in the old `order` field, and no longer throws when `order` is given.

### Patch Changes

- 6b9d973: Send `backup_history`, `charge_history` and `energy_history` arguments as query parameters instead of a GET body, which previously made every call reject.
- cde6455: Fix every authenticated `Teslemetry` call failing: the region-following response handler lost `this`. Also drop the leading slash that produced `//` in the `test()`, `metadata()` and vehicle subscription/upgrade eligibility URLs, type `test()` as `Promise<boolean>` to match the value it actually returns, and rename the default classes in `teslemetry.ts` and `tessie.ts` from `Telemetry` to `Teslemetry` and `Tessie`.
