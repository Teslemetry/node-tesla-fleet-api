---
"tesla-fleet-api": minor
---

Add `dispatch_battery_power`, `resume_battery_operation`, `set_island_mode`, `go_off_grid` and `reconnect_grid` to `EnergySpecific`, with `validate_dispatch_battery_power` and `MAX_DISPATCH_DURATION_SECONDS`. Island commands are signed only and raise `SignedCommandRequired` without a key, because gateways acknowledge the unsigned `grpc_command` without operating the contactor.
