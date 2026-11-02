---
"tesla-fleet-api": minor
---

Add the Teslemetry account routes: `ping`, `userdata`, `scopes`, `server_side_polling`, `vehicle_data_refresh`, `migrate_to_oauth`, `fields`, `vehicle_config`, `streaming_config`, `stop_streaming`, `modify_streaming_config` and `create_streaming_config`, plus the `register_client` function with `REGISTER_URL` and the `TeslemetryClientRegistration` type. `Teslemetry.test()` now returns the `{ response }` envelope, matching Python, and `Teslemetry` gains the `user` client. Debug logs no longer contain tokens or PINs, and the status line no longer repeats the query string.
