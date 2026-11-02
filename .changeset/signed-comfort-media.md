---
"tesla-fleet-api": minor
---

Sign the comfort, media and misc commands on `Commands`: `set_keep_accessory_power_mode`, `set_low_power_mode`, `set_recirculation`, `set_suspension_level`, `set_tent_mode`, `start_light_show`, `stop_light_show`, `dashcam_save_clip`, `cancel_soh_test`, `video_request` and `get_messages`. `nearby_charging_sites` is now signed on `VehicleSigned`, and its sites arrive under `response.getNearbyChargingSites` rather than the REST shape.
