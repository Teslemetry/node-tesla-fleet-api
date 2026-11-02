---
"tesla-fleet-api": minor
---

Sign the closure and navigation commands on `Commands`: `media_volume_up`, `navigation_waypoints_request`, `navigation_gps_destination_request`, `navigation_route`, `open_tonneau`, `close_tonneau`, `stop_tonneau`, `auto_secure_vehicle` and `reset_pin_to_drive_admin`. `navigation_waypoints_request` no longer falls through to the plaintext REST route on `VehicleSigned`.
