---
"tesla-fleet-api": minor
---

Add `TeslemetryEnergySite` and `TeslemetryEnergySites`, which back `Teslemetry.energySites`. A site with a signing key sends the flat `device_command` body, and a site without one uses Teslemetry's own routes. Add `find_authorized_clients`, `find_gateway_address` and the free functions `parse_authorized_clients` and `parse_gateway_address`, which raise `InvalidResponse` on a null body rather than reading it as "no clients" or "no address".
