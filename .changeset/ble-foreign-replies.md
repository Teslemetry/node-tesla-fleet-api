---
"tesla-fleet-api": patch
---

`VehicleBluetooth` now ignores a reply that names another request, before anything acts on it. A reply with no `request_uuid` is still heard, because real VCSEC leaves it empty, but it can no longer trigger a resend or a fault, and a status no longer stands in for an actuation's ack.
