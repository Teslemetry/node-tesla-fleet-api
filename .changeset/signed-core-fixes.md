---
"tesla-fleet-api": minor
---

Signed commands now handle a session info reply with no public key: `KEY_NOT_ON_WHITELIST` raises `NotOnWhitelistFault` and any other status raises `SessionInfoAuthenticationFault`, instead of a crypto error. Undecodable session info and an invalid public key also raise `SessionInfoAuthenticationFault`. VCSEC `commandStatus` is interpreted as in Python: a rejected whitelist operation raises the matching `WhitelistOperation*` class, and `OPERATIONSTATUS_ERROR` never reports success.
