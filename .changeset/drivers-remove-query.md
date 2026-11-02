---
"tesla-fleet-api": patch
---

`drivers_remove` now sends `share_user_id` in the query string, as Python does, instead of in a `DELETE` body, and accepts a string or a number.
