---
"tesla-fleet-api": minor
---

Pin the vehicle's public key at first contact, as Tesla's Go SDK does. An established session now verifies every `SessionInfo` with its stored keys and refuses a different public key with `SessionInfoAuthenticationFault`, changing nothing, so a forged reply can no longer replace the session key. A vehicle that really was re-keyed needs a new instance. `Session.publicKey` is read-only, and `Session.trustedKeys` is new. A clock or counter too near the `uint32` limit to sign with now raises `SessionInfoAuthenticationFault` instead of a bare `invalid uint32`.
