# Fleet API with signed vehicle commands

`VehicleSigned` signs each command locally, with the key registered on the car, and sends it through Tesla's `signed_command` endpoint. Everything on [`VehicleSpecific`](fleet_api_vehicles.md) that a vehicle would refuse in plaintext is overridden, and a test fails if a new command is not.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const privateKey = await api.get_private_key("private_key.pem");

const vehicle = api.vehicles!.createSigned(vin, privateKey);
await vehicle.handshakeVehicleSecurity();
await vehicle.handshakeInfotainment();
await vehicle.door_unlock();
await vehicle.charge_start();
```

The handshake is optional, because the first command of each domain makes one. The key is resolved by identity: `undefined` falls back to the client's `private_key`, and `false` disables signing, so any handshake raises `SigningDisabled`.

## Keys and the session

The key is a raw 32-byte `Buffer`, as `get_private_key` returns. It lives in a native private field, so it stays out of `JSON.stringify` and logs.

A session's replies are authenticated before anything acts on them, and the vehicle's public key is pinned at first contact. A vehicle that really was re-keyed fails with `SessionInfoAuthenticationFault`, and needs a new instance. `IncorrectEpoch` and `InvalidTokenOrCounter` faults retry a bounded number of times.

## Reading

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const vehicle = api.vehicles!.createSigned(vin);

await vehicle.ping();
await vehicle.get_messages();
const image = await vehicle.vehicle_image_state(0);
console.log(image.byteLength);
```

Signed `nearby_charging_sites` returns its sites under `response.getNearbyChargingSites`, not the REST shape.

## Fleet Telemetry configuration

Tesla requires a Tesla.SS256 JWS for this route. `fleet_telemetry_config_create` builds it with the vehicle's key, and overwrites any `iss` or `aud`.

```ts
import { TeslaFleetApi } from "tesla-fleet-api";

const api = new TeslaFleetApi({ accessToken, region: "na" });
const vehicle = api.vehicles!.createSigned(vin);

await vehicle.fleet_telemetry_config_create({
    vins: [vin],
    config: { hostname: "telemetry.example.com", port: 443, ca: "", fields: {}, alert_types: [], exp: 1_800_000_000 },
});
```

## Trip order

On `tesla-protocol` 6, navigation `order` is `RemoteNavTripOrderE`: 0 replaces the trip, 1 prepends and 2 appends. Python's docstrings still give the 1-based protocol 5 values.

## Other transports

`Commands` builds and signs. A transport fills `_send`, as `VehicleSigned` does for the cloud and `VehicleBluetooth` does [over Bluetooth](bluetooth_vehicles.md), which uses AES-GCM rather than HMAC. Two commands cannot be undone and take no confirmation argument, as in Python: `format_usb` and `delete_dashcam_clips`.
