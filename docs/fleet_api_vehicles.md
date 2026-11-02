# Fleet API for vehicles

`VehicleSpecific` sends plaintext REST commands to one vehicle. Vehicles that require the Vehicle Command Protocol refuse most of them, so use [signed commands](fleet_api_signed_commands.md) there.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });

const { response } = await api.vehicles!.list();
const vehicle = api.vehicles!.createFleet(vin);
console.log(response, vehicle.model, vehicle.pre2021);
```

`vehicles.createFleet(vin)` remembers the vehicle in `vehicles.byVin`. `specific` is the legacy name. `Vehicle`, the class of `api.vehicles`, takes a VIN on each method and holds the routes with no VIN: `list`, `fleet_status` and `share_invites_redeem`.

## Waking and reading

```ts
import { TeslaFleetApi, VehicleDataEndpoint, VehicleOffline } from "tesla-fleet-api";

const vehicle = new TeslaFleetApi({ accessToken, region: "na" }).vehicles!.createFleet(vin);

try {
    await vehicle.wake_up({ wait: true, timeoutMs: 30_000 });
} catch (error) {
    if (!(error instanceof VehicleOffline)) throw error;
}

await vehicle.vehicle_data([VehicleDataEndpoint.CHARGE_STATE, VehicleDataEndpoint.CLIMATE_STATE]);
```

## Commands

Method names, arguments and routes are Python's, so Python's [vehicle docs](https://github.com/Teslemetry/python-tesla-fleet-api/blob/main/docs/fleet_api_vehicles.md) apply. Arguments are positional here.

```ts
import { AutoSeat, Level, Seats, TeslaFleetApi, Trunk } from "tesla-fleet-api";

const vehicle = new TeslaFleetApi({ accessToken, region: "na" }).vehicles!.createFleet(vin);

await vehicle.door_lock();
await vehicle.actuate_trunk(Trunk.REAR);
await vehicle.set_charge_limit(80);
await vehicle.remote_seat_heater_request(Seats.FRONT_LEFT, Level.HIGH);
await vehicle.remote_seat_cooler_request(AutoSeat.FRONT_LEFT, Level.LOW);
await vehicle.add_charge_schedule("Mon,Tues", true, -33.8, 151.2, 120);
```

Two things are easy to get wrong:

- `Seats` is 0-indexed and only for seat heating. Seat cooling and auto seat climate take the 1-indexed `AutoSeat`.
- `fleet_telemetry_config_create` takes the inner config here, and adds this VIN.

Some routes are not on every vehicle or account, and a refused command resolves as `{ response: { result: false, reason } }`. Failures of the request itself raise the classes in `src/exceptions.ts`.
