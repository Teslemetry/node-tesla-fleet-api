# Tesla Fleet API
A library for the [Tesla Fleet API](https://developer.tesla.com/docs/fleet-api), and the third parties services [Teslemetry](https://teslemetry.com/docs/getting-started/api) and [Tessie](https://developer.tessie.com/docs/tesla-api-comparison), which provide access to the Fleet API for their customers.


## Usage

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });

// Plaintext REST commands (`VehicleSpecific`)
const car = api.vehicles!.createFleet(vin);
await car.wake_up();

// Vehicle Command Protocol, signed with your raw P-256 private key (`VehicleSigned`)
const signed = api.vehicles!.createSigned(vin, privateKey);
await signed.door_lock();

// Energy sites; pass an RSA `KeyObject` and the gateway DIN to carry a device-command signing key
const site = api.energySites!.create(energySiteId);
await site.live_status();
```

Each factory remembers what it created: `api.vehicles.byVin` and `api.energySites.byId` are `Map`s. `specific` and `specificSigned` remain as legacy names for `createFleet` and `createSigned`.

The classes a factory instantiates are static fields, so a subclass swaps them without redefining a constructor:

```ts
class MyVehicles extends Vehicle {
  static override Fleet = MyVehicleSpecific;
}
class MyApi extends Teslemetry {
  static override Vehicles = MyVehicles;
}
```
