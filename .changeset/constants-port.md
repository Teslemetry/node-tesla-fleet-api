---
"tesla-fleet-api": minor
---

Add `src/const.ts`, a port of `python-tesla-fleet-api`'s `const.py`, exporting every enum (with the same member names and values) plus `Region`, `SERVERS`, `TOKEN_URLS` and `is_valid_region` from the package root.

- **Breaking:** the third-row `Seats` are now `7` and `8` (they were `6` and `7`, which selected the wrong seat). `THIRD_LEFT`/`THIRD_RIGHT` are added, `THIRD_ROW_LEFT`/`THIRD_ROW_RIGHT` stay as aliases, and `REAR_LEFT_BACK` (3) and `REAR_RIGHT_BACK` (6) now work for signed seat heating.
- **Breaking:** `remote_auto_seat_climate_request` takes the new 1-indexed `AutoSeat` (front left is `1`, front right is `2`), matching Tesla's REST wire values and the proto enum, on both the REST and the signed path.
- `Scope` gains `email`, `profile`, `metadata` and `vehicle_location`. `VehicleDataEndpoint` gains `charge_schedule_data` and `preconditioning_schedule_data`. `Models` gains Roadster (`R`). The HTTP `Method` type gains `PATCH` and drops the unused `PUT`.
