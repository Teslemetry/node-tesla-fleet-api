---
"tesla-fleet-api": patch
---

Once a Bluetooth write may have reached the car, every failure except the car's own refusal now resolves as unconfirmed, for every command. A stale or unauthenticated reply, an undecodable one, a response-size fault or a failed resend used to escape as a failover-safe error, so a router could run a command the car had already run. A failure before any write keeps its own error.
