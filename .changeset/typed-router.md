---
"tesla-fleet-api": minor
---

`tesla-fleet-api/router` adds `VehicleRouter`, a typed facade with per-command failover across an ordered list of backends, ported from python-tesla-fleet-api (RTR-1):

- `new VehicleRouter([primary, secondary, ...more], { health, on_result, logger })`. Methods are derived from the backends at construction, with no `Proxy` and no method list, and are typed from them: a misspelt method, a wrong argument, and a method whose backends disagree on arguments are compile errors. Use `router.primary` where backends legitimately differ.
- `is_failover_safe` and `FAILOVER_SAFE_ERRORS` decide failover. A boolean `failover_safe` on any thrown value decides for itself, which lets a backend the router cannot import mark its own errors.
- `BluetoothUnconfirmedCommand` is rethrown at once, is never replayed and never reaches `on_result`, on any backend in the chain. It is recognised by its `unconfirmed` field as well as `instanceof`, so it holds when the package is loaded through both `import` and `require`.
- A failed call is replayed on the next backend, so a non-idempotent command that fails mid-flight can run twice. Callers that need exactly-once gate with a health check or call a backend directly.
