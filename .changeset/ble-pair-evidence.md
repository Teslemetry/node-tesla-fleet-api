---
"tesla-fleet-api": patch
---

`VehicleBluetooth.pair` now needs positive evidence: an explicit success reply, or an authenticated handshake with this key. A WAIT, a bare ack or an unrecognised reply keeps it waiting, and an ERROR or a `nominalError` raises `WhitelistOperationStatus`. Each of these used to report success with the key not enrolled.
