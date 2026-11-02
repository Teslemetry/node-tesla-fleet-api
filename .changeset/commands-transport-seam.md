---
"tesla-fleet-api": minor
---

Prepare `Commands` for transports other than the cloud. `_send` is now `_send(msg, requires, options?)` with `expectsData`, `timeoutMs`, `optimistic` and `confirmBroadcast`; `VehicleSigned` ignores them. `Commands` gains protected `fromDestination`, `publicKey`, `sessionFor`, `ensureHandshake`, `handshake`, `sessionInfoRequest`, `buildMessage`, `dispatch`, `sendVehicleSecurity`, `sendInfotainment` (with a `mutating` flag, false only for `ping`) and `authMethod`. A handshake now discards a reply that fails authentication and tries again, three attempts one second apart. `privateKey: false` disables signing, so any handshake raises `SigningDisabled`; `undefined` still falls back to the parent's key. `Vehicle.private_key` and the derived `Session` keys are now accessors over native private fields, so they stay out of `JSON.stringify` and structured logs.
