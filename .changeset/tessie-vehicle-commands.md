---
"tesla-fleet-api": minor
---

Add `TessieVehicle` with Tessie's commands, all sent as `POST {vin}/command/<name>` with `wait_for_completion` and `max_attempts` in the query string. `Tessie` takes both as constructor options, defaulting to `true` and 3, and gains `scopes()` and the `user` client. `Tessie.vehicles` is now a `TessieVehicles`: `vehicles.create(vin)` returns a `TessieVehicle`, and `createFleet`, `createSigned`, `specific` and `specificSigned` are gone. `Tessie.list_vehicles()` now returns Tessie's `{ results }` reply, matching Python, instead of the bare list.
