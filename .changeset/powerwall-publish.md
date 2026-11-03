---
"tesla-fleet-api": minor
---

Publish the local Powerwall client as `tesla-fleet-api/powerwall` (PW-17): `PowerwallClient`, the gateway merge classes and the `Powerwall*` errors. The read-only check ran on a real Powerwall 3 gateway. No write has run from Node on real hardware, so treat each write as not yet verified.
