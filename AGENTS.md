# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- Tesla protobuf types (`RoutableMessage`, `vcsec`, `car_server`, `signatures`, `keys`, ...) come from the published `@teslemetry/tesla-protocol` package (subpaths like `@teslemetry/tesla-protocol/command/signatures`), not a bundled `src/pb2`. It is ts-proto generated: plain-object messages with `Type.create(partial)` / `Type.encode(msg).finish()` / `Type.decode(bytes)`, not the old `google-protobuf` `.setX()`/`.serializeBinary()` style.
- `tsconfig.json` must keep `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`. Dependencies like `@teslemetry/tesla-protocol` gate access behind a package.json `exports` map with per-subpath types; classic/ESNext resolution can't see those subpaths and every scoped-package import (even `@types/node` internals) fails to resolve.
- There is no test suite yet; `pnpm install` (which runs `tsc` via the `prepare` script) is the whole CI gate. Run `npx tsc --noEmit` to typecheck without emitting.
- `VehicleSigned` (`src/vehiclesigned.ts`) mostly delegates commands straight to the cloud HTTP parent rather than building and dispatching signed protobuf `RoutableMessage`s itself - the `Session`/HMAC scaffolding exists but the signed-command transport seam is unfinished. Its `Session` class is the only current protobuf call site in the library.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
