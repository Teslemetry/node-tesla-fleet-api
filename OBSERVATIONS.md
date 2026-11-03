# Observations

Measured behaviour of real vehicles and backends, from this library. Add a dated heading per finding, with the setup (model, firmware, backend, RSSI, key, keepalive) and the sample size, so another run can re-check it. Record results that overturn an entry too, and update that entry.

Never record a VIN, key, BLE name, peripheral uuid, MAC or proxy address.

## Hardware: nothing yet

**No Node code has talked to a real car, Homey or proxy.** Python's `OBSERVATIONS.md` holds what its stack measured, and those results are the design's evidence, not proof of this library.

Stages still to run, from design document 06, section 4:

| Stage | Proves |
| -- | -- |
| HW-0 (BLE-00) | What Homey's BLE does, with the probe app. Decides the Homey adapter's constants. |
| HW-1 | The library on noble. |
| HW-3 | Rare paths: image paging, readers only Python's mocks cover. |
| HW-4 | Pairing, with the captain at the car. |
| HW-5 | Homey end to end, and a 24 h soak. |
| HW-6 | Charge-port acceptance, with the captain present. |

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
