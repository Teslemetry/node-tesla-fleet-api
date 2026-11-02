---
"tesla-fleet-api": minor
---

Add the observation funnel, ported from python-tesla-fleet-api (FNL-1): `ObservationFunnel`, `FieldPath`, `VehicleDataResultPublisher`, `TeslemetryStreamPublisher`, `LOCK_STATES` and `CLOSURE_STATES`, with the `Observation`, `ObservationSink` and `Publisher` types. Many push sources feed one listener per field, so a field survives the loss of any one source. It is a funnel, not a selector: entirely synchronous, with no request path, source selection, health or priority. Older observations drop, unchanged values skip, and an unmapped value emits nothing.
