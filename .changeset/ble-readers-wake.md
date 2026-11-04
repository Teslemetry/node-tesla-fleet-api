---
"tesla-fleet-api": minor
---

Bluetooth readers of infotainment, such as `charge_state`, now wake a sleeping car and read again when `wake_if_asleep` is on, as commands already did, instead of raising `BluetoothTimeout`. `vehicle_state` reads VCSEC and still never wakes the car. Python's readers do not wake the car.
