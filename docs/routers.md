# Routers

A router holds an ordered list of backends and tries them per command. `new VehicleRouter([primary, secondary, ...more], options)` is a typed facade: methods come from the backends at construction, so a misspelt method or wrong argument is a compile error, and a method only some backends have is tried on those.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";
import { TeslaBluetooth } from "tesla-fleet-api/bluetooth";
import { NobleBleTransport } from "tesla-fleet-api/bluetooth/noble";
import { VehicleRouter, is_failover_safe } from "tesla-fleet-api/router";

const ble = new TeslaBluetooth({ privateKey }).vehicles.createBluetooth(vin, { transport: new NobleBleTransport() });
const cloud = new TeslaFleetApi({ accessToken, region: "na" }).vehicles!.createSigned(vin, privateKey);

let connected = false;
ble.listen_connection_status((value) => {
    connected = value;
});

const router = new VehicleRouter([ble, cloud], {
    health: () => connected,
    on_result: (error) => is_failover_safe(error),
    logger: console,
});
await router.door_lock();
```

## When it fails over

- `health` skips the primary while it reports false. Leave it out to try the primary every time.
- `is_failover_safe` is true only for a failure in that backend's own path, before the device judged the command. A device's refusal is the same on every path, so it propagates.
- A backend that cannot be imported here marks its own errors with a boolean `failover_safe`.
- `BluetoothUnconfirmedCommand` means the car may have run the command, so it never fails over, whatever `on_result` says. A command that resolved as `{ result: false }` is a reply, not a failure.
- `on_result` replaces `is_failover_safe` in both directions, and receives `(error, backend, method)`. On a success `error` is `null` and its return is ignored.

A cloud-only call on a Bluetooth vehicle raises `BluetoothCloudUnavailableError`, which sent nothing and fails over.

## Energy sites

`EnergySiteRouter` routes a local site and a cloud site the same way. The merge helpers overlay a local document on a cloud one. They take unwrapped documents, the value under `response`. A key overlays only when local owns it and it is not null, so a zero reading wins and a key local cannot serve keeps its cloud value.

```ts
import { merge_live_status, merge_site_info } from "tesla-fleet-api/router";

const live = merge_live_status({ percentage_charged: 50 }, { percentage_charged: 51 });
const info = merge_site_info({ backup_reserve_percent: 20 }, { backup_reserve_percent: 25 });
console.log(live, info);
```

The local backend is [not exported yet](powerwall.md).
