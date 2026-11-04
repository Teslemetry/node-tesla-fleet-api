---
"tesla-fleet-api": minor
---

`VehicleBluetooth` takes `idle_disconnect_ms`, which closes the link once no command, read or connect has been in progress for that long, so an app that connects per command does not hold one of the vehicle's Bluetooth slots. The next command reconnects. It is off by default, and `HOMEY_VEHICLE_OPTIONS` sets it to 30 s.
