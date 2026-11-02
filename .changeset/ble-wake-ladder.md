---
"tesla-fleet-api": minor
---

`VehicleBluetooth` now wakes a sleeping car. `wake_up({ wait, timeoutMs })` resends the RKE wake every 3 s until a fresh infotainment handshake answers, an infotainment command on a sleeping car wakes it and sends once more, and an awake car whose infotainment is still booting gets up to 20 s of handshake retries. The new `wake_probe_timeout_ms` option sets the reply wait of one readiness probe, for a link with slow replies.
