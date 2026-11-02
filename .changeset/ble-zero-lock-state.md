---
"tesla-fleet-api": patch
---

A Bluetooth status can no longer confirm `door_unlock`, or fail `door_lock`, through `UNLOCKED`. It is the proto3 zero value, so any status with no lock field decodes to it, and a sleep-only broadcast could report an unlock that never happened. `door_unlock` now needs its ack. A status received before the write finished no longer counts either.
