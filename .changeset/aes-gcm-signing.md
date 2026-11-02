---
"tesla-fleet-api": minor
---

Add AES-GCM personalized signing and response decryption to `Commands`, for transports that set `authMethod = "aes"`. `Session` gains `aesGcmPersonalized()` and `record_response_counter`, a 256-entry replay cache cleared on a new epoch, and a repeated `(requestHash, counter)` raises `SignedCommandResponseReplayed`. Any encrypted reply is now opened, by either auth method. `VehicleSigned` keeps sending HMAC-signed plaintext.
