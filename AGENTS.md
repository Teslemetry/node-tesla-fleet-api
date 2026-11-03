# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code. `CLAUDE.md` is a symlink to it.

## Build & tooling

- `pnpm install` (whose `prepare` runs `tsdown`) is the build gate. In an existing checkout, run `pnpm install --frozen-lockfile` before trusting a build, `tsc` or test result: a stale `node_modules` gives false `tsc` errors in `src/powerwall/` and `test/homey-adapter.types.ts`, or no `tsdown` or `tsx` at all. `npx tsc --noEmit` typechecks `src`, and `npx tsc -p tsconfig.test.json --noEmit` typechecks `test/*.types.ts` and `scripts/`, which must keep its literal `scripts/*.ts`. Vitest and plain `tsc` never typecheck `test/*.test.ts`.
- The public surface is exactly `package.json`'s `exports`, with deep `dist/...` imports blocked by design. A new subpath needs an entry in both that and `tsdown.config.ts`. `./tariff` must never pull in `@teslemetry/tesla-protocol` (`@teslemetry/api` inlines it), and `./types` is type-only. CI runs `attw --pack . --profile node16`, `test/consumers/` from both module systems, and a grep of `dist/tariff.*`.
- `tsconfig.json` must keep `NodeNext` for `module` and `moduleResolution`, or `@teslemetry/tesla-protocol`'s `exports` map stops resolving.
- `__VERSION__` is a compile-time `define`, set in both `tsdown.config.ts` and `vitest.config.ts`.
- Pin `@teslemetry/tesla-protocol` with `~`, and bump it on purpose: its middle digit can break, and `test/proto-coverage-lock.test.ts` forces a decision on each new field. Python is capped below 6, so trip `order` values are protocol 6's (0 replace, 1 prepend, 2 append), not Python's docstrings. It is the only source of Tesla protobuf types, as ts-proto output: `Type.create`, `Type.encode(msg).finish()`, `Type.decode`.
- No native module and no hard dependency on a GATT library, ever: Homey is the primary consumer.
- `test/docs-samples.test.ts` compiles every `ts` sample in `README.md` and `docs/`, except the two pages it names. A sample takes its free names from `GLOBALS` there.
- `pnpm parity --python <clone>` compares Python's public surface with `src`, and its tables hold each deliberate difference. Use a fresh clone of the reference repository.

## API rules

- Keep Python's `snake_case` names, so docs and routers line up across languages. `@teslemetry/api` is the `camelCase` client. Python keyword-heavy methods take an options object; short ones stay positional, in Python's order. Node times are milliseconds, and the name says so.
- Put a new method on the bound class only (`VehicleSpecific`, `EnergySpecific` and subclasses), not on the VIN-free `Vehicle` or `Energy`. Methods with no VIN stay there.
- Backend methods must not use overloads: the router's `infer` reads only the last one.
- A refusal by the device stays a resolved `{ response: { result: false, reason } }`. Router failover depends on exceptions only.

## Signed commands

- `src/commands.ts` (`Commands`, abstract) builds and signs, and dispatches through one seam, `_send`. `VehicleSigned` (cloud, `"hmac"`) and `VehicleBluetooth` (`"aes"`) fill it. A new transport is another subclass, not a change to `Commands`.
- Every command a signing-required vehicle would reject in plaintext **must** be overridden in `Commands`. `test/proto-coverage-lock.test.ts` enforces this, and `test/cross-transport-parity.test.ts` holds the accepted REST/signed gaps with reasons. Seat positions differ by command: `Seats` is 0-indexed and only for heating; cooling and auto climate take 1-indexed `AutoSeat`. In `set_scheduled_departure` a present block turns its feature on, so a disabled feature sends none.
- A `SessionInfo` is untrusted until `Commands.validate_msg` verifies `signatureData.sessionInfoTag`, bound to the VIN and the request's own `uuid`. Only then does `Session.commit` apply it, and it refuses a regressing clock, a rolled-back counter or a value outside `uint32`. Spec, with the vectors `test/hmac-golden-vector.test.ts` reproduces: `pkg/protocol/protocol.md` in `teslamotors/vehicle-command`.
- **The vehicle key is pinned at first contact, as in Tesla's Go SDK. Python's `Commands` has this flaw.** ECDH is symmetric, so anyone who saw the client's public key can tag a reply naming a key of their own. Replies reach key material only through `Session.trustedKeys`, and nothing clears the pin. `test/helpers/sessionattacker.ts` models the attack.
- `validate_msg` picks the session by the request's domain. A reply's `fromDestination` is unauthenticated.
- **`resp.requestUuid` must never gate acceptance of a `SessionInfo`.** Real VCSEC leaves it empty, so an equality guard breaks every VCSEC command on real cars, and only `FakeVehicle.omitRequestUuidLikeRealVcsec()` shows it. The tag's `TAG_CHALLENGE` is the authentication.
- VCSEC holds the domain's session lock across the whole dispatch, and Infotainment only across build. `_send` must never take `Session.withLock`, or every VCSEC command deadlocks. Nor may `ensureHandshake` run inside it.
- `decryptResponse` runs only when a reply has `AESGCMResponseData`, as firmware before 2024.38 ignores the flag. A reply that fails to open says nothing about whether the command ran.
- `Commands`'s keys are native `#private` fields, unreachable by `JSON.stringify`. Tests observe them through a handshake on the wire.
- `test/helpers/fakevehicle.ts` is an independent second implementation of the wire format, not a mock. Signed commands round-trip through it. Vectors in `test/fixtures/ss256_vectors.json` and `test/fixtures/keys.ts` come from outside this repository: never regenerate them.

## Keys (`src/signing/keys.ts`)

`get_private_key` returns, and `Commands` takes, a raw 32-byte `Buffer`; `get_rsa_private_key` returns the `KeyObject` `EnergySpecific` takes. The PEMs are shared with Python (SEC1, PKCS#1), so don't change the format. A raw scalar has no curve, so a non-P-256 file is `wrong_type`.

## Bluetooth (`src/bluetooth/`)

- `./bluetooth` is the only way in: the root entry must never load it, which is why `createBluetooth` is on `VehiclesBluetooth` (`test/bluetooth/entry.test.ts`, `test/consumers/cjs.cjs`). `transport.ts`'s header holds the adapter rules, and `test/bluetooth/adapters/contract.test.ts` runs them on every adapter.
- Homey is the weakest backend, so the contract asks only for what it does: a fixed `discover()` window of about 10 s, no connect or write timeout, write-with-response only, no MTU, and `isConnected` and the disconnect event that can both lie. Every backend call is bounded here. A rejected read, or a failed write then silence, marks the link lost whatever `isConnected` says. `BleNotSubmittedError` alone leaves it up, as no radio I/O happened.
- **A timed-out mutating command is unresolved, never failed, and is never sent again.** Only `BluetoothTransportError` and `BluetoothCommandFailed` are safe to replay. After a write, every failure but the car's own refusal goes through `leavesOutcomeUnknown`. The known exception, matching Python, is the resend when VCSEC reports the car asleep.
- `UNLOCKED` is the proto3 zero value, so a status with no lock field decodes to it, and it proves nothing. Python compares it. Verify plans compare with `sameFloat`, and a left-out state field proves nothing. Never add a plan for a toggle, a relative step or an ack-only action.
- A reply is checked against its request first (`isForeignReply`). An empty uuid can only ack or answer a read, because real VCSEC leaves it empty.
- `pair` writes through `_send` exactly once, and resolves only on an explicit success or an authenticated handshake with this key. An abort is checked in `writeFrame`, the last point before the radio.
- Attempts on one peripheral share one radio link, so an abandoned attempt must never close or resubscribe a link a newer one owns (`LinkClaims`, `test/bluetooth/adapters/late-connect.test.ts`).
- Adapters are one file each, with no top-level import of a backend, and `autoInstallPeers: false` keeps native builds out of this repository.
- `test/bluetooth/coverage.test.ts` locks what falls through to REST. `test/helpers/fakeblelink.ts` keeps its own framing, and `FakeBleLink.vcsecWrites` is how to prove "exactly one".
- `scripts/ble-live/` is the live harness. `STEPS` is a closed list, and the CLI takes step names, never a command name. Never add a pass-through, a destructive command or a re-send after a timeout.

## Energy

- A site signs only with the `private_key` passed to it: unlike vehicles, an omitted key means unsigned. `EnergySpecific._command` signs all but `UNSIGNED_DEVICE_COMMANDS`, and `TeslemetryEnergySite` overrides each `_command` method (`test/teslemetry-energy.test.ts`).
- `EnergyDeviceSigner` is stateless, so identical bytes execute again before `expires_at`: a signed send never retries. `envelope` takes Python's snake_case names, and `assertParsed` raises on anything ts-proto dropped.
- `set_island_mode`, `go_off_grid` and `reconnect_grid` must never reach the unsigned `grpc_command`: gateways acknowledge it without moving the contactor. `src/energyisland.ts` holds the mode check and rejection codes for cloud and LAN.
- `src/energyparsers.ts` stays free of protobuf. A null body raises `InvalidResponse`; it never means "no clients".

## Cloud clients

- `TeslemetryVehicle` and `TessieVehicle` extend `VehicleSpecific`, with `vehicles.create(vin)` as their only factory. The base factories are shadowed as `undefined as never` fields, and `test/factories.types.ts` enforces that. Tessie's `tessie_*` commands take `max_attempts` before `wait_for_completion`, the reverse of every other Tessie command.
- `_request` only ever rejects with a `TeslaFleetError`. Log lines go through `src/log.ts`: a new secret-bearing key belongs in `SECRET_KEYS`, and error `data` is never logged.

## Router (`src/router/`)

- A port of Python's `router/`. `./router` imports only `exceptions` at run time, so a backend it cannot import (Bluetooth, Powerwall) marks its own errors with a boolean `failover_safe`. No `Proxy` and no method list: methods come from the backends' prototypes, and `Routed<B>` types them, so the two must agree on what is skipped.
- `BluetoothUnconfirmedCommand` is checked before `on_result` and the policy, by `instanceof` **and** its `unconfirmed` field, because `instanceof` fails across the dual-package hazard (`test/consumers/esm.mjs`). `test/router.types.ts` runs in CI.

## Observation funnel (`src/funnel.ts`)

A funnel, not a selector: no source health, availability, grace windows or priority. It stays synchronous and never originates a request (`test/funnel.test.ts`). Translations are positive allowlists.

## Local Powerwall (`src/powerwall/`)

- `./powerwall` is published (PW-17), after a read-only run on a real gateway. Writes have only ever run against `test/helpers/fakegateway.ts`, and no autonomous session sends one to a real gateway.
- TLS verification is off on `V1rTransport`'s own `https.Agent` only: `NODE_TLS_REJECT_UNAUTHORIZED` would also disable the cloud's checks.
- A v1r POST is sent once and never retried. Only REST GETs retry, once, after a re-login. LAN envelopes differ from the cloud's, which is why `EnergyDeviceSigner.envelope` is cloud-only.
- **Rules that differ from Python on purpose, so do not "fix" them back:** `cancel_max_backup` and `remove_authorized_client` tolerate only an empty reply, plus code 5 on a cancel. An island reply that does not decode raises. `connect_gateway` sends nothing to an address outside `is_lan_address`, and refuses another DIN. `write_config` rejects non-finite numbers and runs one at a time.
- `Powerwall*` errors extend `Error`, and only `failover_safe = true` lets a router fail over. `PowerwallEnergySite` omits what has no local mapping instead of stubbing it. `LiveStatusMerge` and `SiteInfoMerge` own no timer: the caller drives `poll()`.
- Golden envelopes (`test/fixtures/powerwall-envelopes.json`) come from the real Python client, so never regenerate them. `src/powerwall/queries.ts` is pinned by SHA-256.
- `scripts/powerwall-readonly-check.ts` runs on a real home's gateway, so it must stay unable to write and print only key names, types and pass or fail. `test/powerwall/readonly-check.test.ts` holds its allowlist: a new client method counts as a write until added to `READS`, and a new write joins the table in `docs/powerwall.md`.

## Errors (`src/exceptions.ts`)

A class-for-class port of Python's `exceptions.py`: same names, parents, and `message`/`status`/`key`/`code` as statics copied onto instances. Add new errors there under their Python name, with no aliases. `message` is always the class message, and per-instance detail goes in `data`.

## Tariff resolver (`src/tariff.ts`)

- The tariff carries no timezone, so the caller passes `opts.timeZone`.
- Resolution is one calendar day at a time (`dayPeriods`), and a horizon re-resolves the season per day.
- Wall-clock to `Date` goes through `wallClockToUtcMillis`. "What day is N wall-clock minutes from now" goes through `wallClockAt`, never `now.getTime() + minutes*60000`, which lands on the wrong day across DST.
- Buy and sell resolve independently. `nextChange` and `currentStart` must fold in the sell side even with no active sell period, and are nullable: exclude them with `!= null`, never as `0`.

## Releases

Releases go through Changesets: a PR that changes behaviour includes a changeset. Merging to `main` runs `.github/workflows/publish.yml`, whose `validate` job re-runs `reusable-ci.yml` on the exact SHA and whose `release` job opens a "Version Packages" PR or publishes.

- Keep checks in `reusable-ci.yml`, and keep `needs: validate`, so a stale run can never stand in for the SHA being published. Its `gate` job keeps the check name the `main` ruleset requires.
- The `production` environment has no protection rules: merging "Version Packages" is the only approval, and `release` publishes immediately.
- Publishing uses npm trusted publishing (OIDC, no `NPM_TOKEN`). `--provenance` needs `repository.url` to resolve to this repository, or it fails with `E422`.
- Check `npm view tesla-fleet-api@<version>` before assuming a version is live.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
