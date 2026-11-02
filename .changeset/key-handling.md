---
"tesla-fleet-api": minor
---

Key handling, compatible with python-tesla-fleet-api's key files:

- **Breaking:** `loadPrivateKey` is removed. It wrote no file and replaced `accessToken` with the PEM.
- New on every client: `get_private_key`, `get_rsa_private_key`, `private_key`, `rsa_private_key`, `has_private_key`, `has_rsa_private_key`, `public_pem`, `public_uncompressed_point`, `ec_public_der_spki`, `ec_public_der_spki_b64`, `rsa_public_der_pkcs1`, `rsa_public_der_pkcs1_b64` and `rsa_public_pem`. `get_private_key` returns the raw 32-byte `Buffer` that `Commands` takes, and `get_rsa_private_key` an RSA `KeyObject`.
- New files are created at mode 0600 with no world-readable window; a process that loses the create race reads the winner's file. An unusable existing key raises `PrivateKeyError` with reason `unreadable`, `encrypted`, `malformed` or `wrong_type`.
- `createSigned` falls back to the client's `private_key`.
- New in-memory helpers for keys kept outside files: `generate_ec_private_key_pem`, `generate_rsa_private_key_pem`, `ec_private_key_from_pem` and `rsa_public_der_pkcs1`.
