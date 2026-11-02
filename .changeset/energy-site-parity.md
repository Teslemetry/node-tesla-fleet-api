---
"tesla-fleet-api": minor
---

Bring energy site REST methods in line with `python-tesla-fleet-api`. `backup_history` and `energy_history` now take `(period, start_date?, end_date?, time_zone?)` and `charge_history` takes `(start_date, end_date, time_zone?)`, each setting `kind` itself. `live_status` and `site_info` now return the `{ response }` envelope instead of the unwrapped payload. `EnergySpecific` gains `time_of_use_settings(settings)`.
