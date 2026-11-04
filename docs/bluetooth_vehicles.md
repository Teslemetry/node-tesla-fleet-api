# Bluetooth for vehicles

Control a Tesla directly over Bluetooth Low Energy, with no cloud. The entry point is `tesla-fleet-api/bluetooth`, and a backend comes in as a `BleTransport`.

> **Only the Homey path has run on a real car from Node** (HW-5 and HW-4, `pair` included, 2026-11-03 and 04). noble has not. The library is also tested against an independent fake vehicle, and each adapter against a stub of its backend. See [What has run on hardware](#what-has-run-on-hardware).

## Quick start

```ts
import { TeslaBluetooth } from "tesla-fleet-api/bluetooth";
import { NobleBleTransport } from "tesla-fleet-api/bluetooth/noble";

const tesla = new TeslaBluetooth({ privateKey });
const vehicle = tesla.vehicles.createBluetooth(vin, { transport: new NobleBleTransport() });

await vehicle.wake_up({ wait: true });
console.log(await vehicle.charge_state());
await vehicle.disconnect();
```

`privateKey` is the raw 32-byte P-256 scalar of a key already on the car. To enrol one, see [`pair`](#pairing). `new VehicleBluetooth(client.vehicles, vin, options)` shares a cloud client's key instead, for a vehicle that uses both paths with a router.

## Adapters

Each adapter is its own entry point, and importing one loads no backend. `npm install tesla-fleet-api` adds nothing native, because backends are optional peer dependencies that you install yourself.

| Entry | Class | Backend | Runs on |
| -- | -- | -- | -- |
| `./bluetooth/homey` | `HomeyBleTransport` | `this.homey.ble`, by structural types. No package. | A Homey app |
| `./bluetooth/noble` | `NobleBleTransport` | `@stoprocent/noble` (native) | Linux, macOS, Windows |

Web Bluetooth is not provided: the core uses Node `crypto` and `Buffer`, so it does not run in a browser.

### Homey

```ts
import { TeslaBluetooth } from "tesla-fleet-api/bluetooth";
import { HOMEY_VEHICLE_OPTIONS, HomeyBleTransport } from "tesla-fleet-api/bluetooth/homey";

const transport = new HomeyBleTransport(this.homey.ble);
const vehicle = new TeslaBluetooth({ privateKey }).vehicles.createBluetooth(vin, {
    transport,
    ...HOMEY_VEHICLE_OPTIONS, // one 15 s attempt
});
```

The app needs the `homey:wireless:ble` permission. Options: `maxWriteSize`, bytes per write, default `null`: a whole frame in one write. Pass `20` to chunk at the ATT minimum.

Limits:

- **Measured on a real Homey (BLE-00, HW-0 and HW-5, 2026-11-03).** The vehicle's name is visible to `discover()`, so name matching works. Every frame the library sent, signed ones up to 195 bytes included, went in one write.
- The scan window is about 10 s and fixed, and `scan` ignores `timeoutMs`. The adapter sets `scanTimeoutMs` to 15 s, which `scan_timeout_ms` overrides.
- `discover()` results stay cached for at least 30 s, so a fast retry sees old data. Treat repeated connect failures as a reason to wait, not to retry.
- The MTU is hidden, but a frame goes in one write.
- `isConnected` can stay true after a silent drop, and the `disconnect` event is not guaranteed. So `listen_connection_status(false)` can be as late as the next operation to time out. `true` is reliable.
- Homey offers no connect, write or read timeout. The library adds them.
- Range is the largest limit, and nothing can fix it in software. A Homey sits indoors. Expect "in range" to mean parked close to it.
- A connect takes about 2 s within 30 s of a scan, and about 12 s otherwise, because `find` then runs its own 10 s discovery. `HOMEY_VEHICLE_OPTIONS` (one attempt, 15 s) allows for that. A connect with no `device` scans first, and that scan is outside `connect_timeout_ms`. A caller that must answer faster has to hold the link.

### noble

```ts
new NobleBleTransport();                          // loads @stoprocent/noble on first use
new NobleBleTransport({ bindings: "hci" });       // or "dbus", "mac", "win", "default"
new NobleBleTransport({ noble: myNoble });        // one you built
```

Limits:

- **Native code, so it cannot run on Homey.**
- On Linux the default is `dbus`, which shares the adapter with BlueZ, needs no root, and needs `dbus-next` installed. `hci` needs `sudo setcap cap_net_raw+eip` on the Node binary.
- macOS needs a Bluetooth permission grant for the host process. Whether that works headless is unknown.
- Generic Access (`1800`) may be hidden on BlueZ and CoreBluetooth paths. `query_display_name` and `query_appearance` then return `null`.
- Connecting to a device no scan has seen first runs a scan.

### Writing your own

Implement `BleTransport` from `tesla-fleet-api/bluetooth`. `src/bluetooth/transport.ts` lists the rules, and `test/bluetooth/adapters/contract.test.ts` tests them.

## `VehicleBluetooth` options

| Option | Default | Meaning |
| -- | -- | -- |
| `transport` | required | The backend. |
| `privateKey` | the parent's key | `Buffer`, or `false` to disable signing for a passive listener. |
| `device` | scan | Skip the scan and connect to this `BleDeviceRef`. |
| `confirmation` | `"ack"` | See [Confirmation](#confirmation). |
| `raise_unconfirmed` | `false` | `true` raises `BluetoothUnconfirmedCommand` when nothing resolved a command. |
| `keepalive_interval_ms` | `20000` | Read a characteristic after this much idle time. `null` or `0` disables it. It delays an awake car's sleep. |
| `idle_disconnect_ms` | `null` (Homey: `30000`) | Close the link after this long with no command in progress, so it does not hold one of the car's slots. The next command reconnects. Keepalive reads do not count as use. |
| `wake_if_asleep` | `true` | Wake a sleeping car for an infotainment command, instead of raising. |
| `max_connect_attempts` | `3` | Attempts per connect. |
| `connect_timeout_ms` | `20000` | One attempt. |
| `scan_timeout_ms` | `10000` (Homey: `15000`) | One scan. It must outlast the backend's window. |
| `wake_probe_timeout_ms` | `1000` | The reply wait of one infotainment readiness probe. |

## Methods

`vehicle.optimistic` and `vehicle.verify_commands` report `confirmation`. Every signed command on `Commands` works here too, with the same name it has on the cloud path. These are Bluetooth's own.

### Link

| Method | Meaning |
| -- | -- |
| `find_vehicle({ name, address, timeoutMs })` | Scan, with no service filter, and keep the device. A device with free slots wins, then the strongest signal. |
| `set_device(device)`, `get_device()` | Set or read the device later connections use. |
| `connect(maxAttempts)` | Connect unless a link is up. Sends also do this. |
| `connect_if_needed(maxAttempts)` | The same. |
| `disconnect()` | Close the link, and return whether there was one. |
| `listen_connection_status(callback)` | Hear the link come up and go down. Returns an unsubscribe. |

On the client: `tesla.valid_name(name)`, `tesla.get_name(vin)`, `tesla.name_matches_vin(advertised, vin)`.

### Wake

`wake_up({ wait, timeoutMs })`. Without `wait` it sends one wake. With `wait` it resends every 3 s and probes infotainment until it answers, up to `timeoutMs` (default 30000). VCSEC being awake does not mean infotainment is: it takes 4 to 16 s longer.

### Readers

`vehicle_state()` answers from VCSEC, even while the car sleeps, and never wakes it. Each of these sends one signed request to infotainment and returns one block:

`charge_state`, `climate_state`, `drive_state`, `location_state`, `closures_state`, `charge_schedule_state`, `preconditioning_schedule_state`, `tire_pressure_state`, `media_state`, `media_detail_state`, `software_update_state`, `parental_controls_state`, `gui_settings`, `parked_accessory_state`, `legacy_vehicle_state`, `current_vehicle_state`, `vehicle_config`, `soh_state`, `vehicle_detail_state`, `display_state`, `alert_state`, `light_show_state`, `suspension_state`, `child_presence_detection_state`.

A reader for a feature the car lacks raises `InvalidResponse`, because the reply has no block for it: on a Model 3, `parked_accessory_state`, `suspension_state` and `display_state`. `legacy_vehicle_state` alone exceeds the MTU on a Model 3 and raises `TeslaFleetMessageFaultResponseSizeExceedsMTU`.

`vehicle_data(endpoints)` takes `BluetoothVehicleData` values. Ask for one at a time: two or more can raise `TeslaFleetMessageFaultResponseSizeExceedsMTU`. With no list, or REST endpoint names, it raises `BluetoothCloudUnavailableError`, which a router sends to the cloud.

`vehicle_image_state(image_type, chunk_size = 16384)` pages an image. It has not been proven over Bluetooth, and that chunk size cannot fit the 1024-byte frame cap. A car with no custom wrap or plate image answers with an empty list, so it raises `InvalidResponse`.

`query_version()`, `query_appearance()` and `query_display_name(max_attempts = 5)` read GATT directly and return `null` when they cannot.

### Bluetooth-only closures

`open_front_driver_door`, `close_front_driver_door`, `open_front_passenger_door`, `close_front_passenger_door`, `open_rear_driver_door`, `close_rear_driver_door`, `open_rear_passenger_door`, `close_rear_passenger_door`, `open_rear_trunk`, `close_rear_trunk`.

Doors have no reliable powered close on a Model 3: an ack does not mean the door latched. Never automate one.

### Pairing

`pair({ role, form, timeoutMs, pollIntervalMs, signal })` asks the car to accept this key, then waits up to `timeoutMs` (default 300000) for someone to tap a key card. `signal`, an `AbortSignal`, stops the wait, as when a pairing screen closes.

The request is written exactly once and never again, because a resend prompts the user again.

### Broadcasts

A held link receives unsigned `VehicleStatus` broadcasts. Each `listen_*` returns an idempotent unsubscribe, and listeners survive a reconnect. A throwing callback is logged and does not stop the others.

- Fire on every status: `listen_vehicle_lock_state`, `listen_vehicle_sleep_status`, `listen_user_presence`, `listen_gear`, `listen_ui_desire`.
- Fire when closures are present: `listen_closure_statuses`, `listen_front_driver_door`, `listen_front_passenger_door`, `listen_rear_driver_door`, `listen_rear_passenger_door`, `listen_front_trunk`, `listen_rear_trunk`, `listen_charge_port`, `listen_tonneau`.
- Fires when detailed closures are present: `listen_tonneau_percent_open`.
- `listen_broadcast(domain, callback)` hears every raw broadcast on a domain.

`BleBroadcastStreamGlue(vehicle, sink)` feeds these to any object with `ingest(data, metadata?)`, and `stop()` ends it. `BleBroadcastPublisher(vehicle)` exposes them as a `Publisher` for an `ObservationFunnel`.

## Confirmation

| `confirmation` | A command succeeds when |
| -- | -- |
| `"optimistic"` | The write completes. |
| `"ack"` | The car acks it. Lock and unlock also accept a matching broadcast. |
| `"verify"` | As `"ack"`, and on a timeout a state read decides, for commands with an absolute state to read. |

`verify` covers lock, unlock, charge limit, charging amps, absolute volume, temperatures, climate on or off, and `charge_port_door_open`. Toggles, relative steps and ack-only actions have no plan, by design.

**A timed-out command is unresolved, not failed.** It may have run on the car, so it is never sent again. In Python's field data, 2 of 3 write-level failures had still executed.

| Error | Meaning | Router |
| -- | -- | -- |
| `BluetoothTransportError` | Connect failed, or nothing was written. | Fails over |
| `BluetoothTimeout` | A read or pre-write step got no reply. | Fails over |
| `BluetoothUnconfirmedCommand` | A mutating command may have run. | **Never replays** |
| `BluetoothCommandFailed` | State proved it did not apply, or the car was asleep. | Fails over |
| `BluetoothCloudUnavailableError` | A REST call on a Bluetooth-only vehicle. Nothing was sent. | Fails over |
| `SigningDisabled` | This instance has no key. | Fails over |

`charge_port_door_open` under `"verify"` raises `BluetoothUnconfirmedCommand` if the latch never shows released, even with `raise_unconfirmed: false`.

## Not provided

- **Streaming.** There is no vehicle data subscription, as in Python. Broadcasts are what a held link hears.
- **A vehicle `Merge` class.** None exists. The merge helpers are for Powerwall.
- **Web Bluetooth.** See [Adapters](#adapters).

## What has run on hardware

| Path | From Node | From Python, same car protocol |
| -- | -- | -- |
| Homey | HW-5: reads and quiet signed commands on a Model 3. Its 24 h soak is still running. | Never |
| noble | **Never** | Direct adapters, through `bleak` |
| `pair` | HW-4: one key enrolled through Homey | One real key card tap |
| Signing, framing and sessions | A Model 3 through Homey (HW-5, HW-4), and the fake vehicle against golden vectors | Yes |

The adapters' decisions come from reading each backend's code and types, and from what Python measured. Dated results go in [`OBSERVATIONS.md`](../OBSERVATIONS.md), and nothing here should be read as proven until an entry says so.

## Live harness

`scripts/ble-live/` is how a person proves this on a car. It has not been run on one: CI runs it on a fake link. Keep its output out of git.

```bash
BLE_LIVE_VIN=<vin> BLE_LIVE_KEY_PATH=<file> pnpm ble:live --transport noble
BLE_LIVE_VIN=<vin> BLE_LIVE_KEY_PATH=<file> pnpm ble:live --transport noble --steps charge_limit
```

`--list` shows the steps. With no `--steps` it runs the plain reads. Homey has no command line, as it needs a test app.

- A setting is snapshotted, changed once, verified by a fresh read, restored by an absolute command, and read again.
- **A command that times out is never sent again.** The next read decides, and the run stops at the first step that did not end cleanly.
- Steps with a physical effect, and `pair`, refuse to run without `--captain-present`. Pass it only when someone is at the car.
- There is no step for an individual door, and no path at all to a destructive command. A run takes step names, never a command name.
- A run with a sleep or wake step sets `keepalive_interval_ms: null`, as keepalive reads keep a car awake.
- It prints step names, error classes, write and frame counts, and the value of the setting under test. It never prints a VIN, a key, a BLE name or an address, and reads print only that they worked.
