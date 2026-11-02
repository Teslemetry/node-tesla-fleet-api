---
"tesla-fleet-api": minor
---

Sign the charging and schedule commands on `Commands`: `add_charge_schedule`, `remove_charge_schedule`, `add_precondition_schedule`, `remove_precondition_schedule`, `batch_remove_charge_schedules` and `batch_remove_precondition_schedules`, which were plaintext REST on `VehicleSigned`, plus `update_charge_on_solar`, `get_charge_on_solar`, `set_rate_tariff`, `get_rate_tariff`, `add_managed_charging_site`, `remove_managed_charging_site`, `get_managed_charging_sites` and `set_discharge_limit`. Schedule methods take a trailing `name`, which only the signed path sends.

Fix signed `set_scheduled_departure`: it always sent both recurrence blocks, and a present block switches its feature on, so preconditioning and off-peak charging could not be left off. It now reads `preconditioning_enabled` and `off_peak_charging_enabled`.
