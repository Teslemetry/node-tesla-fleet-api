# Tesla Fleet API

A TypeScript library for Tesla vehicles and energy sites. It reaches them through the [Tesla Fleet API](https://developer.tesla.com/docs/fleet-api), [Teslemetry](https://teslemetry.com/docs/getting-started/api), [Tessie](https://developer.tessie.com/docs/tesla-api-comparison), or directly over Bluetooth. It is the Node counterpart of [`python-tesla-fleet-api`](https://github.com/Teslemetry/python-tesla-fleet-api), with the same method names in `snake_case`, so docs and router code line up across the two.

```sh
npm install tesla-fleet-api
```

It needs Node 22 or later, ships ESM and CommonJS, and has one runtime dependency, which is pure JavaScript. Nothing native is installed.

> **Partly proven on hardware.** Vehicle Bluetooth through Homey, pairing included, has run on a real car, and a read-only check and a session of writes have run on a real Powerwall gateway. noble has not run on hardware, and everything is also tested against independent fakes in this repository. [OBSERVATIONS.md](OBSERVATIONS.md) records what has been measured.

## What is in the package

| Client | Reaches | Vehicles | Energy sites |
| -- | -- | -- | -- |
| `TeslaFleetApi` | Tesla Fleet API | `vehicles.createFleet(vin)`, `vehicles.createSigned(vin, key?)` | `energySites.create(id, key?, din?)` |
| `TeslaFleetOAuth` | Fleet API, with its own token refresh | As `TeslaFleetApi` | As `TeslaFleetApi` |
| `Teslemetry` | Teslemetry | `vehicles.create(vin)` | `energySites.create(id, key?, din?)` |
| `Tessie` | Tessie | `vehicles.create(vin)` | None |
| `TeslaBluetooth` | The vehicle, over Bluetooth | `vehicles.createBluetooth(vin, options)` | None |

| Import | Contents |
| -- | -- |
| `tesla-fleet-api` | The cloud clients, errors, constants, tariff, firmware helpers, funnel, `jws` |
| `tesla-fleet-api/router` | `VehicleRouter`, `EnergySiteRouter`, merge helpers, `is_failover_safe` |
| `tesla-fleet-api/bluetooth` | `TeslaBluetooth`, `VehicleBluetooth`, the `BleTransport` contract, stream glue |
| `tesla-fleet-api/bluetooth/homey` | Bluetooth through a Homey app |
| `tesla-fleet-api/bluetooth/noble` | Bluetooth through `@stoprocent/noble` |
| `tesla-fleet-api/tariff` | `getTariffPeriods`, `unwrapTariffV2`, with no protobuf code |
| `tesla-fleet-api/const` | Enums, `Models`, `Region`, `SERVERS` |
| `tesla-fleet-api/types` | Response types |

Deep imports such as `tesla-fleet-api/dist/...` are blocked by the `exports` map.

## Quick start

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });

const { response } = await api.products();
const car = api.vehicles!.createFleet(vin);
await car.wake_up({ wait: true });
await car.vehicle_data();

const site = api.energySites!.create(energySiteId);
await site.live_status();
```

Replies keep the service's `{ response }` envelope. `api.vehicles.byVin` and `api.energySites.byId` are `Map`s of what each factory created. More: [vehicles](docs/fleet_api_vehicles.md), [energy sites](docs/fleet_api_energy_sites.md).

`accessToken` may be a function returning `Promise<string | null>`, which is called for every request. Other options are `fetch`, `logger`, `debug`, `timeout` (milliseconds) and `client`, a short name for your application sent as the `X-Client` header on every request.

## Signed commands

A vehicle that requires the Vehicle Command Protocol refuses plaintext commands. `createSigned` builds each one locally and sends it through `signed_command`. The key is the raw 32-byte P-256 private key registered with the car.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const privateKey = await api.get_private_key("private_key.pem");

const signed = api.vehicles!.createSigned(vin, privateKey);
await signed.door_lock();
await signed.set_charge_limit(80);
```

A refusal by the vehicle resolves as `{ response: { result: false, reason } }`. It is not an error. Passing `false` as the key disables signing, and leaving it out falls back to the client's `private_key`. See [signed commands](docs/fleet_api_signed_commands.md).

## Energy sites

Device commands are signed with an RSA key, so create the site with the key and the gateway DIN to send them. A site created without a key sends the unsigned form, except the commands that must never go unsigned: `set_island_mode`, `go_off_grid` and `reconnect_grid` raise `SignedCommandRequired`, because gateways acknowledge the unsigned command without moving the contactor.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const rsaKey = await api.get_rsa_private_key("tedapi_rsa_private.pem");

const site = api.energySites!.create(energySiteId, rsaKey, din);
await site.get_system_info();
await site.go_off_grid();
```

`add_authorized_client` registers a key with a gateway, and `TeslemetryEnergySite.wait_until_paired` waits for the owner's breaker toggle. A signed send is never retried, because the same bytes would execute again.

## Teslemetry and Tessie

```ts
import { ClosureState, Teslemetry, Tessie } from "tesla-fleet-api";

const teslemetry = new Teslemetry(accessToken);
await teslemetry.ping();
const car = teslemetry.vehicles.create(vin);
await car.closure({ front_trunk: ClosureState.OPEN });
const site = teslemetry.energySites!.create(energySiteId);
await site.find_authorized_clients();

const tessie = new Tessie(accessToken, { wait_for_completion: true, max_attempts: 3 });
const tessieCar = tessie.vehicles.create(vin);
await tessieCar.lock();
await tessieCar.drives({ limit: 10 });
```

Both clients expose `vehicles.create` only: `createFleet` and `createSigned` are compile errors, because these services do not take Fleet API credentials. See [Teslemetry](docs/teslemetry.md) and [Tessie](docs/tessie.md).

## Routers

A router tries one backend after another, per command. It falls over only on a failure that proves the command did not reach the car or gateway. A refusal by the device is returned, and a Bluetooth command with an unresolved outcome is never replayed.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";
import { TeslaBluetooth } from "tesla-fleet-api/bluetooth";
import { NobleBleTransport } from "tesla-fleet-api/bluetooth/noble";
import { VehicleRouter } from "tesla-fleet-api/router";

const ble = new TeslaBluetooth({ privateKey }).vehicles.createBluetooth(vin, { transport: new NobleBleTransport() });
const cloud = new TeslaFleetApi({ accessToken, region: "na" }).vehicles!.createSigned(vin, privateKey);

const router = new VehicleRouter([ble, cloud]);
await router.door_lock();
```

Methods and their types come from the backends. A misspelt method is a compile error, and a method only one backend has goes to that backend. `EnergySiteRouter` does the same for sites, and `merge_live_status` and `merge_site_info` overlay local readings on cloud documents. See [routers](docs/routers.md).

## Bluetooth

Install the backend you want, and pass its transport to `createBluetooth`. Each adapter is its own entry point, and importing one loads no backend.

| Adapter | Class | Install | Runs on |
| -- | -- | -- | -- |
| `./bluetooth/homey` | `HomeyBleTransport` | Nothing. It takes `this.homey.ble`. | A Homey app |
| `./bluetooth/noble` | `NobleBleTransport` | `@stoprocent/noble`, which is native | Linux, macOS, Windows |

On a computer:

```ts
import { TeslaBluetooth } from "tesla-fleet-api/bluetooth";
import { NobleBleTransport } from "tesla-fleet-api/bluetooth/noble";

const tesla = new TeslaBluetooth({ privateKey });
const vehicle = tesla.vehicles.createBluetooth(vin, { transport: new NobleBleTransport() });

await vehicle.wake_up({ wait: true });
await vehicle.door_lock();
await vehicle.charge_state();
await vehicle.disconnect();
```

In a Homey app, which needs the `homey:wireless:ble` permission:

```ts
import Homey from "homey";
import { TeslaBluetooth } from "tesla-fleet-api/bluetooth";
import { HOMEY_VEHICLE_OPTIONS, HomeyBleTransport } from "tesla-fleet-api/bluetooth/homey";

class TeslaApp extends Homey.App {
    async lock(vin: string, privateKey: Buffer): Promise<void> {
        const transport = new HomeyBleTransport(this.homey.ble);
        const vehicle = new TeslaBluetooth({ privateKey }).vehicles.createBluetooth(vin, {
            transport,
            ...HOMEY_VEHICLE_OPTIONS, // one 15 s attempt: a connect with no recent scan takes about 12 s
        });
        await vehicle.door_lock();
        await vehicle.disconnect();
    }
}

export default TeslaApp;
```

The Homey adapter's defaults come from a BLE-00 run on a real Homey (one write per frame, a 15 s scan bound). `confirmation` sets how much proof a command needs: `"optimistic"`, `"ack"` (the default) or `"verify"`. New keys are enrolled with `vehicle.pair()`. [docs/bluetooth_vehicles.md](docs/bluetooth_vehicles.md) has every option and each adapter's limits.

## Local Powerwall

A client for a Powerwall gateway on your LAN is exported as `tesla-fleet-api/powerwall`. A read-only check and a session of writes, island mode included, have passed on a real gateway. [docs/powerwall.md](docs/powerwall.md) describes the API.

## OAuth

```ts
import { Scope, TeslaFleetOAuth } from "tesla-fleet-api";

const api = new TeslaFleetOAuth({ region: "na", client_id, client_secret, redirect_uri });
const url = api.get_login_url([Scope.OPENID, Scope.OFFLINE_ACCESS]);
await api.get_refresh_token(code);
```

An expired token refreshes before the next request. Tesla's refresh tokens are single use, so store `api.refresh_token` and `api.expires` (epoch seconds) after `get_refresh_token`, and whatever `refresh_access_token()` or `check_access_token()` returns. To store a refresh made by a request, read those two fields after it.

## Keys

`get_private_key` and `get_rsa_private_key` load a PEM file, or create it at mode 0600. Python's library reads the same files.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });

await api.get_private_key("private_key.pem"); // raw 32-byte Buffer
api.vehicles!.createSigned(vin); // falls back to it
console.log(api.public_pem);

await api.get_rsa_private_key("tedapi_rsa_private.pem"); // RSA KeyObject
console.log(api.rsa_public_der_pkcs1_b64);
```

To keep keys somewhere other than a file, as Homey does:

```ts
import {
    TeslaFleetApi,
    ec_private_key_from_pem,
    generate_ec_private_key_pem,
    generate_rsa_private_key_pem,
    rsa_public_der_pkcs1,
} from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const pem = await generate_ec_private_key_pem();
api.private_key = ec_private_key_from_pem(pem);

const rsaPem = await generate_rsa_private_key_pem();
console.log(rsa_public_der_pkcs1(rsaPem));
```

An existing file or PEM that cannot be used raises `PrivateKeyError`, whose `reason` is `unreadable`, `encrypted`, `malformed` or `wrong_type`.

## Errors

Every failure rejects with a real `Error` subclass, named as in Python's `exceptions.py`, so `except X` there is `instanceof X` here.

```ts
import { RateLimited, TeslaFleetApi, TeslaFleetError } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
try {
    await api.products();
} catch (error) {
    if (error instanceof RateLimited) console.log(error.data);
    else if (error instanceof TeslaFleetError) console.log(error.status, error.key);
    else throw error;
}
```

## Everything else

- `getTariffPeriods(tariff, now, { timeZone })` resolves Tariff V2 rates, and `unwrapTariffV2` finds the tariff in a `site_info` reply. A tariff carries no time zone, so `timeZone` is required.
- `firmwareCompare` and `firmwareAtLeast` compare firmware versions numerically, because `"2025.10" < "2025.9"` as strings.
- `ObservationFunnel` feeds one listener per field from many sources, so a value survives the loss of any one of them. `VehicleDataResultPublisher` and `TeslemetryStreamPublisher` publish into it, and `BleBroadcastPublisher` does from `./bluetooth`.
- `jws` holds the Tesla.SS256 signatures behind signed Fleet Telemetry configuration.

The classes a factory creates are static fields, so a subclass swaps them without redefining a constructor:

```ts
import { Teslemetry, Vehicle, VehicleSpecific } from "tesla-fleet-api";

class MyVehicleSpecific extends VehicleSpecific {}
class MyVehicles extends Vehicle {
    static override Fleet = MyVehicleSpecific;
}
class MyApi extends Teslemetry {
    static override Vehicles = MyVehicles;
}

export { MyApi };
```

Behaviour that differs from Python on purpose is listed by `pnpm parity --python <clone>`, which compares this package with Python's public surface.
