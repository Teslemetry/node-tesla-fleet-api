# Observations

Measured behaviour of real vehicles and backends, from this library. Add a dated heading per finding, with the setup (model, firmware, backend, RSSI, key, keepalive) and the sample size, so another run can re-check it. Record results that overturn an entry too, and update that entry.

Never record a VIN, key, BLE name, peripheral uuid, MAC or proxy address.

## Hardware stages

Stages from design document 06, section 4, and where each stands.

| Stage | Proves | Status |
| -- | -- | -- |
| HW-0 (BLE-00) | What Homey's BLE does, with the probe app. Decides the Homey adapter's constants. | Done 2026-11-03, except step 10 (needs the owner at the car) |
| HW-1 | The library on noble. | Not run: the development host has no Bluetooth adapter |
| HW-3 | Rare paths: image paging, readers only Python's mocks cover. | Readers done 2026-11-03. Image paging not provable on this car |
| HW-4 | Pairing, with the owner at the car. | Done 2026-11-04 |
| HW-5 | Homey end to end, and a 24 h soak. | Done 2026-11-03. The 24 h soak is running until 2026-11-04 23:00 UTC |
| HW-6 | Charge-port acceptance, with the owner present. | Waiting for the owner |

## Homey BLE, probe app (HW-0, BLE-00, 2026-11-03)

**Setup:** a throwaway probe app on a Homey Pro 2026 ("Homey Dev"), indoors, with the owner's Model 3 parked nearby. It sent only an unsigned VCSEC session-info request with a throwaway key, built by hand, not with this library.

**Result:**

- The vehicle's name is visible to `discover()` with the car awake and asleep, so name matching works.
- A 114-byte frame works in one write, with the reply 0.23 s after the write began. Six 20-byte writes took 0.56 s to a reply.
- `connect()` took 0.4 s median and 1.4 s at most, over 10 connects.
- A `discover()` that is not cached takes a fixed 10.04 s.
- An idle link stayed up for the 5 minutes the probe held it.

These set `HOMEY_MAX_WRITE_SIZE`, `HOMEY_SCAN_TIMEOUT_MS` and `HOMEY_VEHICLE_OPTIONS` in `src/bluetooth/adapters/homey.ts`. Step 10, the time a write takes to fail on a lost link, needs the car taken out of range and has not run.

## Homey end to end (HW-5, 2026-11-03)

**Setup:** `tesla-fleet-api` 0.6.0 from npm, in a test app (`homey:wireless:ble`) on the same Homey Pro 2026, firmware 13.5.4-rc.6, whose apps run Node 22.23.4. `HomeyBleTransport` with its defaults (`maxWriteSize: null`), `confirmation: "ack"`, `keepalive_interval_ms: null`. The car is a Model 3 on 2026.38.6, parked and charging, with RSSI -46 to -63 at the Homey. The key was already on the car. Every command ran after a fresh read showed the car parked with nobody in it.

**Signed frames go in one write.** Every frame the library sent went in one write, and none failed: 114 bytes (unsigned session request), 183 (signed VCSEC), 187 and 188 (signed infotainment reads), 192 (image request) and 195 (`set_temps`), with each write taking 0.27 to 0.58 s. So `HOMEY_MAX_WRITE_SIZE` stays `null`. Over 29 replies, the first notification arrived p50 279 ms after the write began, p90 291 ms and at most 333 ms.

**Link:** `find_vehicle` took 10.05 to 10.10 s (5 runs). `connect`, which here includes `ble.find`, connecting, discovery and subscribing, took 1.46 to 2.26 s in the 6 runs that came within 30 s of a scan, and 12.05 to 12.36 s in the 4 that came later, with the car awake or asleep. Timing Homey's calls separately shows why: `ble.find` takes 2 to 3 ms from a warm cache and 10.05 s once the 30 s cache has expired, as it runs its own discovery. The rest is the same either way: `connect()` 0.41 to 0.45 s, `getService` 1.49 to 1.60 s, `discoverCharacteristics` 3 to 4 ms and subscribing 0.19 to 0.25 s. So HW-0's 0.4 s connect was `connect()` alone, and `HOMEY_VEHICLE_OPTIONS`' one 4 s attempt would fail every cold connect (#55 raised it to 15 s). A `discover()` within 30 s of an earlier `discover()` or cold `ble.find` returns its cached list in 10 to 20 ms. Both times that happened, no entry in it matched the car's name, so `find_vehicle` raised `BluetoothTransportError` at once. All 10 `discover()` calls that ran a full scan (about 10 s) found the car. An advertisement kept from an old `discover()` is no way round it: connecting through one 90 s later failed after 10 s, and the next try 90 s after that connected in 0.41 s (one sample each). `query_version`, `query_display_name` and `query_appearance` all answered, so Homey does not hide Generic Access.

**Readers:** each was sent once, with the car awake.

| Result | Readers |
| -- | -- |
| Answered, 0.29 to 0.49 s | `vehicle_state`, `charge_state`, `climate_state`, `drive_state`, `location_state`, `closures_state`, `charge_schedule_state`, `preconditioning_schedule_state`, `tire_pressure_state`, `media_state`, `media_detail_state`, `software_update_state`, `parental_controls_state`, `gui_settings`, `current_vehicle_state`, `vehicle_config`, `soh_state`, `vehicle_detail_state`, `alert_state`, `light_show_state`, `child_presence_detection_state` |
| `InvalidResponse`: the reply had no block for the field | `parked_accessory_state`, `suspension_state`, `display_state` |
| `TeslaFleetMessageFaultResponseSizeExceedsMTU`, on its own | `legacy_vehicle_state` |

`vehicle_data` with one `BluetoothVehicleData` value answered for each of the 19 values except `GetLegacyVehicleState` (the same MTU fault), and the replies to `GetParkedAccessoryState` and `GetSuspensionState` carried no block at all. This car has no parked accessory and no adjustable suspension. `GetDriveState` also returns `locationState`.

**Commands:** all acked, and each value was confirmed by a fresh read, restored, and confirmed again over Bluetooth and by Fleet Telemetry.

| Command | Result |
| -- | -- |
| `wake_up()` (signed RKE, awake car) | Acked, 0.28 s |
| `door_lock()` on a locked car | Acked, 0.29 s, still locked |
| `set_charge_limit` 80, 81, 80 | Applied and restored, about 0.29 s each |
| `set_temps` driver 21, 20.5, 21 | Applied and restored, about 0.29 s each |
| `set_charging_amps` | Not run: the car was charging |

`wake_up({ wait: true })` returned in 0.6 to 3.0 s with the car already awake.

**What the car reports while parked and charging:** VCSEC `gear` was `GEAR_UNKNOWN` (0), and `drive_state.shiftState` was `Invalid`, not `P`. A caller that needs "parked" cannot take it from either field alone.

**Idle link, nothing sent:** each hold was a fresh link, with no keepalive and no reads until one VCSEC read at the end.

| Hold | Result |
| -- | -- |
| 10 min | Link up, read answered in 0.59 s. The car was awake (charging). |
| 20 min | Link up, read answered in 0.28 s. The car had finished charging and was **asleep**: an idle link held from Homey did not keep it awake. |
| 40 min | The disconnect event fired after 29.8 min. The car had woken about 20 minutes earlier, and nothing in the log shows why. The end read reconnected (one attempt failed with "Peripheral disconnected during service discovery") and answered in 6.4 s in all. |

One sample each. Every drop seen here fired Homey's `disconnect` event.

**Broadcasts:** a held link heard VCSEC `VehicleStatus` broadcasts. When the car woke during the 40-minute hold, 10 arrived within 0.6 s, with the sleep status going from asleep to awake.

**24 h soak (running, results so far):** started 2026-11-03 22:59 UTC on the same app. Every 15 minutes it connects, reads `vehicle_state` from VCSEC and disconnects. It never wakes the car and never holds a link. After 13 cycles (to 01:50 UTC): 12 passed, and the one failure was the cached `discover()` described under **Link**. The car was asleep in 9 cycles. Connects took 2.1 to 2.3 s after a scan and 12.2 to 12.5 s without one, and one took 6.2 s. Reads took 0.29 to 0.73 s, and one took 1.95 s. The app's heap stayed at 15 to 16 MB. The app restarted 5 times, every one a reinstall of the test app, not a crash. The final result replaces this paragraph.

## Pairing (HW-4, 2026-11-04)

**Setup:** the Teslemetry Homey app (`com.teslemetry`, a development build on `tesla-fleet-api` 0.6.1) on the same Homey Pro 2026, with the owner at the car and a key card. Times come from the app's log. The app does not log the connect on its own, so scan, connect and the VCSEC handshake count as one span.

**Result:** `pair` enrolled the key on the second request.

| Run | Request written to the car | Result |
| -- | -- | -- |
| 1 | 15.7 s after the user saved, for a fresh scan, connect and a handshake answered `NotOnWhitelistFault` | The owner saw no prompt on the car. `pair` raised `BluetoothTimeout` after 5 min 3 s. |
| 2 | 15.0 s after the user saved | The owner, sitting in the car, was prompted, tapped a key card, and the key was accepted 30.0 s after the request was written. |
| Check | | An authenticated VCSEC handshake with the new key 12.7 s after the user turned the setting off and on, including scan and connect. |

Why the car showed no prompt for the first request is not known. One sample: the owner was not in the car for the first and was for the second.

## Rare Bluetooth paths (HW-3, 2026-11-03)

Same setup as HW-5.

- **Readers only mocks covered:** all ran on the car, in the HW-5 table above.
- **Image paging:** not provable on this car. For `AUTOPILOT_VISUALIZATION_WRAP` and `LICENSE_PLATE`, the `ID` request was answered in about 0.3 s with a `vehicleImageState` that had a fresh timestamp and an empty `vehicleImages`, so `vehicle_image_state` raised `InvalidResponse` before any `DATA` request. The car has no custom wrap or licence-plate image. A run needs one loaded on the car first.

## noble (HW-1)

Not run. The development host has no Bluetooth adapter. HW-1 is a development path and does not block 1.0.0.

## Local Powerwall (2026-11-02)

**Setup:** `pnpm powerwall:check` (`scripts/powerwall-readonly-check.ts`) at `main` 24ddc2d, run once from a LAN host on the same network as the gateway, with the paired "Home Assistant" gateway client key and the gateway password. Node 24.22.1, `pnpm install --frozen-lockfile --ignore-scripts`. The gateway is a Powerwall 3 (site Moorinya) at a private LAN address with a self-signed certificate. The script prints key names and types only, so it did not record the firmware version. The run took about ten minutes, almost all of it the R12 soak.

**Result:** R1 to R12 all passed, and the script exited on `DONE R1-R12 passed`. No step failed, and nothing was retried.

| Step | Result |
| --- | --- |
| R1 `tls_handshake` | pass |
| R2 `connect` | pass |
| R3 `meters_soe_grid` | pass |
| R4 `get_firmware_details` | pass |
| R5 `status_controller_components` | pass |
| R6 `get_config` | pass |
| R7 `get_backup_events` | pass |
| R8 `list_authorized_clients` | pass |
| R9 `get_battery_calibration_delay_status` | pass, reported "not supported" on this gateway, which the step accepts |
| R10 `get_controllable_device_programs` | pass |
| R11 `live_status_local_config` | pass |
| R12 `live_status_soak` | pass, 0 connection resets and 0 rate-limit errors over the soak |

**Seen on this gateway:** `live_status` came back with `backup_capable`, `generator_power`, `grid_services_active`, `grid_services_power`, `storm_mode_active`, `timestamp` and `wall_connectors` as null.

**Not covered:** R13 (Python comparison) and R14 (`connect_gateway`) run separately, and no write has run against a real gateway.

## Offline checks of backend packages (2026-11-02)

**Setup:** the published packages, read and run on a development machine, with no radio, proxy or car. These check our reading of each package, and say nothing about hardware.

- **`@stoprocent/noble` 2.8.0:**
  - The package's main entry builds a default noble as it loads. `lib/resolve-bindings.js` does not, and loads with no native build present.
  - `disconnectAsync()` waits for a `disconnect` event, so calling it on a dead link would never settle.
  - `connectAsync()` on a device it has not seen can never resolve.
- **`homey-apps-sdk-v3-types` 0.3.12:** `tsc` accepts its real classes against the adapter's structural types (`test/homey-adapter.types.ts`).
