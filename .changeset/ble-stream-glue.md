---
"tesla-fleet-api": minor
---

Add `BleBroadcastStreamGlue` and `BleBroadcastPublisher` to `tesla-fleet-api/bluetooth`. The glue feeds a `VehicleBluetooth`'s broadcasts into any object with `ingest(data, metadata)`, and the publisher feeds them into an `ObservationFunnel`. Neither imports a stream package or touches the link.
