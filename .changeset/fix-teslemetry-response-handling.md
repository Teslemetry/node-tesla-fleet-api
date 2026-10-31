---
"tesla-fleet-api": patch
---

Fix every authenticated `Teslemetry` call failing: the region-following response handler lost `this`. Also drop the leading slash that produced `//` in the `test()`, `metadata()` and vehicle subscription/upgrade eligibility URLs, and rename the default classes in `teslemetry.ts` and `tessie.ts` from `Telemetry` to `Teslemetry` and `Tessie`.
