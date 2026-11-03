---
"tesla-fleet-api": minor
---

Remove the `./bluetooth/esphome` export (`EsphomeBleTransport`) and the optional `@2colors/esphome-native-api` peer dependency. Use `./bluetooth/noble` or `./bluetooth/homey` instead.
