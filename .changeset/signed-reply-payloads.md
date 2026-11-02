---
"tesla-fleet-api": minor
---

Signed replies now carry their payloads as in Python. An Infotainment reply returns `vehicleData`, and any other `Response` payload under its field name alongside `result` and `reason`. `vehicleStatus` is success for an actuation and the data for a read. New on `Commands`: `ping` (`reason` is the vehicle's timestamp in ISO 8601), `handshakeVehicleSecurity`, `handshakeInfotainment`, `shared_key`, and the protected reads `_getVehicleSecurity` and `_getInfotainment`, which raise `InvalidResponse` for a reply with no data. `validateAndUpdateSession` is renamed `validate_msg`, with no alias.
