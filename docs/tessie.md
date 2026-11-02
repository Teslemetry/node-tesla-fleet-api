# Tessie

```ts
import { Tessie } from "tesla-fleet-api";

const api = new Tessie(accessToken, { wait_for_completion: true, max_attempts: 3 });

await api.list_vehicles();
await api.scopes();
await api.all_battery_health({ only_active: true });
```

## Vehicles

`vehicles.create(vin)` returns a `TessieVehicle`. Commands post to `{vin}/command/<name>`, and take `wait_for_completion` and `max_attempts` last, defaulting to the client's. `tessie_*` commands take them in the opposite order, as in Python.

```ts
import { Tessie } from "tesla-fleet-api";

const vehicle = new Tessie(accessToken).vehicles.create(vin);

await vehicle.lock();
await vehicle.start_climate();
await vehicle.set_temperatures(21);
await vehicle.set_charge_limit(80, false, 1);
```

Reads take an options object where Python takes many keyword arguments. `start` and `end` are sent as `from` and `to`.

```ts
import { Tessie } from "tesla-fleet-api";

const vehicle = new Tessie(accessToken).vehicles.create(vin);

await vehicle.state();
await vehicle.battery();
await vehicle.location();
await vehicle.drives({ start: 1_700_000_000, end: 1_700_086_400, limit: 10 });
await vehicle.charges({ superchargers_only: true });
await vehicle.states({ start: 1_700_000_000, end: 1_700_086_400 });
```

Tessie has no energy sites and one server, so `find_server` raises `LibraryError`.
