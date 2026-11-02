---
"tesla-fleet-api": minor
---

Add `TeslemetryVehicle.telemetry(topics?, cursor?)` and `create_telemetry_tracker(topics?)`, whose `TeslemetryVehicleTelemetry.update()` advances a cursor and merges each change into `snapshot`. Add the `SnapshotTopic` and `WaitTopic` constants.
