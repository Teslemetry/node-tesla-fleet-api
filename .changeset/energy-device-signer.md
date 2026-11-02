---
"tesla-fleet-api": minor
---

Add `EnergyDeviceSigner` and the signed energy device transport. A site created with an RSA key and the gateway DIN signs device commands and posts them to `device_command`, except the four pre-pairing reads in `UNSIGNED_DEVICE_COMMANDS`. A device error inside an HTTP 200 reply raises `InvalidCommand` (code 12) or `DeviceUnexpectedResponse`, and a signed send is never retried. A site created without a key is unsigned: unlike vehicles, it does not fall back to the parent's key.
