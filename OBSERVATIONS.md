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
| HW-2 | The library on an ESPHome proxy, including that the CCCD write is needed. |
| HW-3 | Rare paths: image paging, readers only Python's mocks cover. |
| HW-4 | Pairing, with the captain at the car. |
| HW-5 | Homey end to end, and a 24 h soak. |
| HW-6 | Charge-port acceptance, with the captain present. |

## Offline checks of backend packages (2026-11-02)

**Setup:** the published packages, read and run on a development machine, with no radio, proxy or car. These check our reading of each package, and say nothing about hardware.

- **`@2colors/esphome-native-api` 1.3.6, with `google-protobuf` 4.0.3:**
  - A `BluetoothGATTGetServicesResponse` hand-encoded as ESPHome sends it, with unpacked `uuid` fields, decoded to the dashed UUIDs for the Tesla service, the write and notify characteristics, and the CCCD, with no precision lost on the 64-bit halves. Packed `uuid` fields throw inside the package, since `reader.readPackedUint64` is gone from `google-protobuf` 4, so a stub that packs them cannot stand in for a proxy.
  - `read` and notification `data` come back base64 encoded, not as bytes, though the package's types call them only `string`.
  - A `Buffer` passed as a write's value round-trips byte for byte, including `0xff` and `0x80`.
- **`@stoprocent/noble` 2.8.0:**
  - The package's main entry builds a default noble as it loads. `lib/resolve-bindings.js` does not, and loads with no native build present.
  - `disconnectAsync()` waits for a `disconnect` event, so calling it on a dead link would never settle.
  - `connectAsync()` on a device it has not seen can never resolve.
- **`homey-apps-sdk-v3-types` 0.3.12:** `tsc` accepts its real classes against the adapter's structural types (`test/homey-adapter.types.ts`).
