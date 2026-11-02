---
"tesla-fleet-api": minor
---

Add `TeslemetryEnergySite.wait_until_paired(public_key, { verify_by_use, timeout_ms, poll_interval_ms, signal })`, with `DEFAULT_PAIRING_TIMEOUT` and `DEFAULT_PAIRING_POLL_INTERVAL` in milliseconds. It raises `AuthorizedClientPairingTimedOut` at once when the presence-proof window expires, and `AuthorizedClientWaitExpired` when its own deadline passes.
