---
"tesla-fleet-api": minor
---

Add the Bluetooth readers to `VehicleBluetooth`: all 24 vehicle-data sub-states, an explicit-list `vehicle_data(endpoints)`, and `query_display_name`, `query_appearance` and `query_version`, which return `null` when a characteristic is out of reach. Add the Bluetooth-only closure commands, `open_`/`close_` for each door and the rear trunk. `vehicle_data` with no list or REST endpoint names raises `BluetoothCloudUnavailableError`, sending nothing.
