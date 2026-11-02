# Fleet API for energy sites

```ts
import { EnergyExportMode, EnergyOperationMode, TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const site = api.energySites!.create(energySiteId);

const { response } = await site.live_status();
console.log(response);
await site.site_info();
await site.backup(20);
await site.operation(EnergyOperationMode.AUTONOMOUS);
await site.grid_import_export(null, EnergyExportMode.BATTERY_OK);
await site.storm_mode(true);
await site.energy_history("day");
```

`live_status` values may be `null`. `backup_history` and `energy_history` take `(period, start_date?, end_date?, time_zone?)`, and `charge_history` takes `(start_date, end_date, time_zone?)`.

## Device commands

Pass an RSA `KeyObject` and the gateway DIN to sign device commands. Unlike a vehicle, a site does not fall back to the client's key: with none it sends the unsigned form.

```ts
import { EnergyIslandMode, TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const rsaKey = await api.get_rsa_private_key("tedapi_rsa_private.pem");
const site = api.energySites!.create(energySiteId, rsaKey, din);

await site.get_system_info();
await site.list_authorized_clients();
await site.dispatch_battery_power(-5000, 3600);
await site.resume_battery_operation();
await site.set_island_mode(EnergyIslandMode.OFF_GRID);
await site.reconnect_grid();
```

- The four reads a gateway answers before pairing are never signed: `UNSIGNED_DEVICE_COMMANDS`.
- A signed send is never retried, because identical bytes execute again until they expire.
- `set_island_mode`, `go_off_grid` and `reconnect_grid` raise `SignedCommandRequired` without a key, as gateways acknowledge the unsigned command and leave the contactor alone.
- `set_island_mode` takes only `ON_GRID` (1) and `OFF_GRID` (6). A gateway's refusal raises `DeviceUnexpectedResponse`.
- `validate_dispatch_battery_power` checks dispatch arguments, up to `MAX_DISPATCH_DURATION_SECONDS`.
