---
"tesla-fleet-api": minor
---

Bring the REST and signed paths of `VehicleSpecific` and `Commands` to the same instruction from the same arguments, matching `python-tesla-fleet-api`:

- Breaking: `remote_seat_cooler_request` takes `AutoSeat` positions (1 front left, 2 front right) on both paths, as Tesla's proxy reads them. It no longer takes `Seats` names other than the two fronts, and signed `0` and `1` no longer mean the front seats.
- Breaking: signed `remote_steering_wheel_heat_level_request` takes `Level` 0, 1 and 3, as REST does. `2` is refused, since there is no medium level, and `3` is now high.
- Signed `adjust_volume` rejects a volume outside 0 to 11, and signed `window_control` rejects an unknown command rather than closing the windows.
- Signed `sun_roof_control` accepts `"open"`.
- `set_valet_mode` password, `trigger_homelink` coordinates and token, and `window_control` coordinates are optional. `trigger_homelink` sends a location only when it has both coordinates, and `0` is a coordinate.
- REST `navigation_gps_request` sends `order: 0` when omitted, like the signed path.
