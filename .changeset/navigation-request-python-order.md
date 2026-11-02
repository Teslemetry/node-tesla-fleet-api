---
"tesla-fleet-api": minor
---

**Breaking:** `navigation_request` now matches Python: `(value, type?, locale?, timestamp_ms?)`, after `vehicle_tag` on `Vehicle`. `locale` was second and required, so `navigation_request(value, "en-AU")` now sends `"en-AU"` as the `type`. `locale` defaults to the new exported `DEFAULT_LOCALE`, this process's locale, and `timestamp_ms` to now. `timestamp_ms` is sent as an integer rather than a string, and the body's keys follow Python's order. The signed path keeps the same positions and sends only the destination, as Python's does.
