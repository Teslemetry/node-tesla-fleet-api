---
"tesla-fleet-api": minor
---

Allow `null` in `LiveStatusResponse`, and make `timestamp` optional. A reader of `live_status` must now handle a key being `null`.
