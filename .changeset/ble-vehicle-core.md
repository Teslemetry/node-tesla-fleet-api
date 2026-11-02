---
"tesla-fleet-api": minor
---

Add `VehicleBluetooth` and `TeslaBluetooth` to `tesla-fleet-api/bluetooth`: connect with retries, reply routing, and signed commands over any `BleTransport`. A REST method on a Bluetooth-only vehicle raises `BluetoothCloudUnavailableError` and sends nothing.
