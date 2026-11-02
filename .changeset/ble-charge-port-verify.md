---
"tesla-fleet-api": minor
---

`VehicleBluetooth.charge_port_door_open` under `confirmation: "verify"` readies the charging subsystem, writes one opening, and succeeds only on physical state: the cable latch released, or the flap open with no cable. An unresolved opening always raises `BluetoothUnconfirmedCommand`, even with `raise_unconfirmed: false`, and is never sent again. Other confirmation modes are unchanged.
