---
"tesla-fleet-api": patch
---

Send `backup_history`, `charge_history` and `energy_history` arguments as query parameters instead of a GET body, which previously made every call reject.
