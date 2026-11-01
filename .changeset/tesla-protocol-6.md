---
"tesla-fleet-api": minor
---

Move to `@teslemetry/tesla-protocol` 6.0 (pinned `~6.0.0`). Signed `navigation_sc_request(id, order?)` now sends the supercharger `id` and the trip order (`0` replace, the default; `1` prepend; `2` append) instead of putting the id in the old `order` field, and no longer throws when `order` is given.
