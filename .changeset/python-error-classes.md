---
"tesla-fleet-api": minor
---

Throw real `Error` subclasses everywhere, ported class-for-class from `python-tesla-fleet-api`'s `exceptions.py` (all 155 classes, the fault lookup tables, `is_key_rejected` and `raise_for_status`). `_request` now rejects with the matching `TeslaFleetError` subclass instead of a bare `{ status, data }` or `{ error }` object; a `fetch` rejection or timeout (new `timeout` option, in ms) becomes `TeslaFleetConnectionError` with the original error as `cause`, and a non-JSON success body becomes `ResponseError`. Adds `BluetoothCloudUnavailableError`.

**Breaking:** `SignedCommandError`, `NotOnVehicleWhitelistError`, `SignedCommandFaultError` and `RetryableSignedCommandFaultError` are removed, with no aliases. Use `SessionInfoAuthenticationFault`, `NotOnWhitelistFault`, the `TeslaFleetMessageFault*` classes and the `SignedMessageInformationFault*` classes instead. Detail that used to be in the message is now in `data`.
