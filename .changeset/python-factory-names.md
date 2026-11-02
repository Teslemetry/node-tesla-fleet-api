---
"tesla-fleet-api": minor
---

Rename the product factories to their `python-tesla-fleet-api` names, with no aliases: `api.vehicle` is now `api.vehicles` and `api.energy` is now `api.energySites`. `api.vehicles` gains `createFleet(vin)` (returns `VehicleSpecific`), `createSigned(vin, private_key?, public_key?)` (returns `VehicleSigned`) and the legacy `specificSigned`, replacing `signed()`. `api.energySites.specific(id)` is now `create(id, private_key?, din?)`. Each factory keeps a `Map` of what it created (`byVin`, `byId`). The instantiated classes are static fields (`TeslaFleetApi.Vehicles`/`EnergySites`, `Vehicle.Fleet`/`Signed`, `Energy.Site`) that subclasses override. `Tessie.vehicles()` is now `list_vehicles()`, matching Python and freeing the `vehicles` field.
