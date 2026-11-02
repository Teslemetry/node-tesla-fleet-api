---
"tesla-fleet-api": patch
---

Debug logs now redact `routable_message`, a signed command that would execute again if replayed within 30 seconds.
