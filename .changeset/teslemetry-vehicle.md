---
"tesla-fleet-api": minor
---

Add `TeslemetryVehicle`, with Teslemetry's `custom_command` routes (`closure`, `seat_heater`, `charge_on_solar`, the lightbar, outlet, power feed, Powershare and parental control commands, `trigger_rate_tariff_update` and others), `data_refresh` and the deprecated `server_side_polling`. `Teslemetry.vehicles` is now a `TeslemetryVehicles`: `vehicles.create(vin)` returns a `TeslemetryVehicle`, and `createFleet`, `createSigned`, `specific` and `specificSigned` are gone, because Teslemetry cannot use the Fleet API directly.
