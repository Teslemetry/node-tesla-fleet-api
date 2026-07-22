# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- Tesla protobuf types (`RoutableMessage`, `vcsec`, `car_server`, `signatures`, `keys`, ...) come from the published `@teslemetry/tesla-protocol` package (subpaths like `@teslemetry/tesla-protocol/command/signatures`), not a bundled `src/pb2`. It is ts-proto generated: plain-object messages with `Type.create(partial)` / `Type.encode(msg).finish()` / `Type.decode(bytes)`, not the old `google-protobuf` `.setX()`/`.serializeBinary()` style.
- `tsconfig.json` must keep `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`. Dependencies like `@teslemetry/tesla-protocol` gate access behind a package.json `exports` map with per-subpath types; classic/ESNext resolution can't see those subpaths and every scoped-package import (even `@types/node` internals) fails to resolve.
- `pnpm install` (which runs `tsc` via the `prepare` script) is the build gate; run `npx tsc --noEmit` to typecheck without emitting. `pnpm test` runs the vitest suite under `test/` - `tsconfig.json`'s `include` only covers `src/**.ts`, so test files never ship in `dist` and don't need to satisfy the library's own module settings beyond what vitest's esbuild transform requires.
- The signed-command layer is split the same way as `python-tesla-fleet-api`: `src/commands.ts` (`Commands`, abstract) builds and HMAC-signs every vehicle command into a `RoutableMessage` and dispatches it through one abstract seam, `_send`; `src/vehiclesigned.ts` (`VehicleSigned`, concrete) fills that seam over the cloud `/signed_command` HTTP endpoint. A future BLE transport (Story 3) is meant to be another concrete subclass of `Commands`, not a change to it. `src/signing/session.ts` holds the per-domain (VCSEC/Infotainment) handshake + HMAC session state; `src/signing/crypto.ts` holds the raw ECDH/SHA-1 key derivation; `src/signing/errors.ts` holds the fault-error taxonomy that drives `Commands`' bounded WAIT/epoch-fault retry. Only HMAC-personalized signing is implemented - AES-GCM personalized signing is BLE-only and was left out of this story. `test/helpers/fakevehicle.ts` is a from-scratch reimplementation of the vehicle side of the protocol (independent HMAC verification, not just a mock) used to round-trip-test the client against a second implementation of the same wire format.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
