---
"tesla-fleet-api": minor
---

Keep more secrets out of debug logs. Redaction now covers `password` (the PIN in `set_pin_to_drive` and `set_valet_mode`), `token`, `tokens` and `private_key`, in any case or separator style. A failed request logs a message only for a `TeslaFleetError`; any other error logs its class name alone, because its message may hold a secret from a token function or transport.
