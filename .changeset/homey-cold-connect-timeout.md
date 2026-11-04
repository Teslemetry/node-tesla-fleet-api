---
"tesla-fleet-api": patch
---

`HOMEY_VEHICLE_OPTIONS.connect_timeout_ms` is now 15 s instead of 4 s. On a real Homey, a connect made more than 30 s after a scan takes about 12 s, because `ble.find` runs its own 10 s discovery, so the 4 s bound failed every such connect.
