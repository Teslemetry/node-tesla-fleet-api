---
"tesla-fleet-api": minor
---

`validate_msg` now takes the request's domain as a third argument and refuses a `SessionInfo` from any other domain, since a reply's `fromDestination` is unauthenticated. A `Commands` subclass passes `msg.toDestination?.domain` from `_send`.
