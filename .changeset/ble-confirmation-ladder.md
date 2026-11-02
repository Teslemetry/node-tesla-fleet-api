---
"tesla-fleet-api": minor
---

Add the Bluetooth confirmation ladder to `VehicleBluetooth`: `confirmation` (`"optimistic"`, `"ack"`, `"verify"`) and `raise_unconfirmed`, with broadcast confirmation of lock and unlock, and verify reads for the seven commands whose result can be read back.
