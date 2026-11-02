---
"tesla-fleet-api": minor
---

`_request` parity with python-tesla-fleet-api (COR-2):

- `accessToken` may be a function returning `Promise<string | null>`, called on every request; `access_token()` raises `MissingToken` for a null token.
- New `fetch` option (used in place of the global `fetch`) and `logger` option (`{ debug(message) }`, silent by default; `debug: true` still logs to `console.debug`). Log lines use Python's `command= transport= result=` fields, for REST and signed commands alike, and never contain the token.
- `X-Library: node tesla_fleet_api <version>`. No `?` on an empty query, booleans lower-cased in the query, `Content-Type` only with a body, and a GET body is dropped instead of throwing.
- New `find_server()` (walks `SERVERS`, skipping `InvalidRegion`; Teslemetry uses `metadata()`), `status()`, `partner_login()`, `region`, and the `vcsec_command_name` / `infotainment_command_name` helpers.
- `Teslemetry` and `Tessie` accept the token function and an options object (`fetch`, `logger`, `debug`, `timeout`).
