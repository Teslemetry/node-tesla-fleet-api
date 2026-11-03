---
"tesla-fleet-api": minor
---

Apply the BLE-00 (HW-0) measurements from a real Homey to the Homey Bluetooth adapter. `HOMEY_MAX_WRITE_SIZE` is now `null`, so a frame goes in one write (only a 114-byte frame was measured; pass `maxWriteSize: 20` to chunk again). The adapter sets a 15 s scan bound, `HOMEY_SCAN_TIMEOUT_MS`, because a fresh `discover()` takes about 10 s. `BleTransport` gains an optional `scanTimeoutMs`, which `scan_timeout_ms` overrides.
