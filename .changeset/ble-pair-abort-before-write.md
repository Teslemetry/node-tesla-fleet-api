---
"tesla-fleet-api": patch
---

Aborting `VehicleBluetooth.pair` now stops the write itself. An abort during the connect, or while another call held the GATT queue, used to end the wait and still send the whitelist operation, which prompts at the car.
