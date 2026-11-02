# Teslemetry

```ts
import { Teslemetry } from "tesla-fleet-api";

const api = new Teslemetry(accessToken);

await api.ping();
await api.metadata();
await api.scopes();
await api.fields();
await api.streaming_config(vin);
await api.create_streaming_config(vin, { BatteryLevel: { interval_seconds: 60 } });
```

The server follows the region in each reply's `x-region` header, or call `find_server()`. Python's account methods keep their names: `userdata`, `vehicle_config`, `stop_streaming`, `modify_streaming_config`, `vehicle_data_refresh` and `migrate_to_oauth`. `register_client(client_name, software_id, software_version, options?)` is a free function, for OAuth dynamic client registration.

## Vehicles

`vehicles.create(vin)` returns a `TeslemetryVehicle`. It has every `VehicleSpecific` method, and Teslemetry's custom commands, which sign on the server. Options objects carry Python's keyword arguments.

```ts
import { ClosureState, SeatHeaterLevel, SnapshotTopic, Teslemetry } from "tesla-fleet-api";

const api = new Teslemetry(accessToken);
const vehicle = api.vehicles.create(vin);

await vehicle.closure({ front_trunk: ClosureState.OPEN });
await vehicle.seat_heater({ front_left: SeatHeaterLevel.HIGH });
await vehicle.charge_on_solar(true, 50, 90);
await vehicle.dashcam_save();
await vehicle.play_video("https://example.com/video.mp4");

const tracker = vehicle.create_telemetry_tracker([SnapshotTopic.STATE]);
await tracker.update();
console.log(tracker.snapshot);
```

## Energy sites

`energySites.create(id)` returns a `TeslemetryEnergySite`. With an RSA key and DIN it signs and sends the flat `device_command` body. Without one it uses Teslemetry's own routes, which sign on the server.

```ts
import { Teslemetry } from "tesla-fleet-api";

const api = new Teslemetry(accessToken);
const site = api.energySites!.create(energySiteId);

await site.find_authorized_clients();
await site.find_gateway_address();
await site.get_system_info();
await site.go_off_grid();
```

Pairing a key needs a physical breaker toggle. `wait_until_paired(public_key, { timeout_ms, poll_interval_ms, signal })` waits for it, and raises `AuthorizedClientPairingTimedOut` when the proof window expires.

`parse_authorized_clients` and `parse_gateway_address` are free functions, so they work on replies from another client. A null body raises `InvalidResponse`. It never means "no clients".
