---
"tesla-fleet-api": minor
---

`set_island_mode`, `go_off_grid` and `reconnect_grid` now raise `DeviceUnexpectedResponse` when the gateway refuses, for example `REJECTED_LOW_ENERGY`, instead of returning the refusal as a normal reply. `data` holds `{code, message}`, with `message` the result's name.
