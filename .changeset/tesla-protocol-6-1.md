---
"tesla-fleet-api": patch
---

Pin `@teslemetry/tesla-protocol` to `~6.1.0`, whose `uint64` energy fields decode as strings, so a backup event with `priority = 2^64 - 1` no longer throws.
