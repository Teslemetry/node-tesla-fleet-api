---
"tesla-fleet-api": patch
---

A Bluetooth connect attempt that lands after it was abandoned now closes before the next attempt starts, for a bounded time, so on a backend with one peripheral its late close no longer ends the new link.
