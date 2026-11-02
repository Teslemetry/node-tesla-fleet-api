---
"tesla-fleet-api": minor
---

`set_island_mode` now accepts only `EnergyIslandMode.ON_GRID` (1) and `OFF_GRID` (6), and throws `TypeError` before signing on anything else. It does not coerce `"6"`, and a missing mode has no default. `force` must be a boolean when given.
