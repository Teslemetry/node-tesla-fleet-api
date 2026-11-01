# tesla-fleet-api

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
