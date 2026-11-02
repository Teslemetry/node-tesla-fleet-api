---
"tesla-fleet-api": minor
---

Add `TeslaFleetOAuth`, a port of python-tesla-fleet-api's OAuth client: `get_login_url`, `get_refresh_token`, `access_token`, `check_access_token` and `refresh_access_token`, with the token host following the region and an expired token refreshed before each request. `expires` is in epoch seconds, as in Python. Concurrent requests share one refresh, because Tesla's refresh tokens are single use. A refused code exchange or refresh rejects with the matching `TeslaFleetError`, e.g. `LoginRequired`.
