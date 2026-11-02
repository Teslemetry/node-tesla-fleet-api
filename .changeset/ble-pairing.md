---
"tesla-fleet-api": minor
---

Add `VehicleBluetooth.pair({ role, form, timeoutMs, pollIntervalMs, signal })`. It writes the whitelist operation exactly once and confirms by the reply or by polling a VCSEC handshake, so the wait survives a dropped link. An `AbortSignal` ends the wait with no further write.
