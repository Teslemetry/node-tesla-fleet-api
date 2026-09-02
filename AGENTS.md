# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

## Build & tooling

- `pnpm install` (whose `prepare` script runs `tsc`) is the build gate; `npx tsc --noEmit` typechecks without emitting. `pnpm test` runs the vitest suite under `test/`, which `tsconfig.json`'s `include` deliberately excludes so tests never ship in `dist`.
- `tsconfig.json` must keep `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`. `@teslemetry/tesla-protocol` gates its subpaths behind a package.json `exports` map with per-subpath types; under classic/ESNext resolution every scoped-package import (even `@types/node` internals) fails to resolve.
- Tesla protobuf types (`RoutableMessage`, `vcsec`, `car_server`, `signatures`, `keys`, ...) come only from `@teslemetry/tesla-protocol` (subpaths like `@teslemetry/tesla-protocol/command/signatures`); nothing is vendored or generated here. It is ts-proto output: plain-object messages with `Type.create(partial)` / `Type.encode(msg).finish()` / `Type.decode(bytes)`, not `google-protobuf`'s `.setX()`/`.serializeBinary()`.

## Signed commands

- The layer is split as in `python-tesla-fleet-api`: `src/commands.ts` (`Commands`, abstract) builds and HMAC-signs every vehicle command into a `RoutableMessage` and dispatches it through one abstract seam, `_send`; `src/vehiclesigned.ts` (`VehicleSigned`) fills that seam over the cloud `/signed_command` endpoint. Another transport (e.g. BLE) belongs as a second subclass of `Commands`, not as a change to it. `src/signing/` holds the per-domain session state (`session.ts`), ECDH/SHA-1 key derivation (`crypto.ts`), and the fault taxonomy driving the bounded WAIT/epoch-fault retry (`errors.ts`). Only HMAC-personalized signing exists; AES-GCM personalized signing is BLE-only and unimplemented.
- Every command a signing-required vehicle would reject on the plaintext endpoint **must** be overridden in `Commands` so it is signed rather than silently inherited unsigned from `VehicleSpecific` — including the non-obvious signed Infotainment actions `take_drivenote` (`takeDrivenoteAction`) and `upcoming_calendar_entries` (`uiSetUpcomingCalendarEntries`), matching `python-tesla-fleet-api`.
- A `SessionInfo` (handshake reply, or piggy-backed on a later reply for resync) is untrusted wire data until `Commands.validateAndUpdateSession` verifies its `signatureData.sessionInfoTag`: HMAC-SHA256 over the exact received `session_info` bytes, keyed by `HMAC-SHA256(K, "session info")`, TLV-bound to the VIN and to the request's own `uuid` as challenge (`SIGNATURE_TYPE_HMAC` + `TAG_PERSONALIZATION` + `TAG_CHALLENGE`). Only once that tag verifies does `Session.commit` apply the new epoch/counter/clock — and it still refuses a clock that regresses within an epoch and never lets the anti-replay counter roll backward within one. Skipping tag verification, or trusting counter/clock from an unauthenticated reply, is a real vulnerability — don't reintroduce it. Authoritative spec (with the worked vectors `test/hmac-golden-vector.test.ts` reproduces): `pkg/protocol/protocol.md` in `github.com/teslamotors/vehicle-command`, fetchable via `gh api`.
- **`resp.requestUuid` must never gate acceptance of a `SessionInfo` reply — only cross-check it when the vehicle actually populated it.** Real VCSEC hardware leaves it empty (protocol.md: "due to memory constraints, the `request_uuid` field is typically not populated in replies from VCSEC"), so an equality-or-reject guard silently breaks every VCSEC command against real vehicles. The `session_info_tag` HMAC, which binds the *sent* uuid as `TAG_CHALLENGE`, is the actual authentication. `test/helpers/fakevehicle.ts` always echoes the uuid and so cannot catch that regression; `FakeVehicle.omitRequestUuidLikeRealVcsec()` reproduces the real-hardware shape.
- For `DOMAIN_VEHICLE_SECURITY`, `Commands.dispatch` holds the domain's session lock across the *entire* dispatch (handshake, build, send, retry), not just message-build: VCSEC requires strict counter order and the spec warns against concurrent requests to it at all. Infotainment (sliding window) keeps the narrower build-only lock.
- `Commands`'s `#privateKey`/`#publicKey` are native private class fields, not `protected`/TS-only `private` — the raw signing key must be unreachable off the instance entirely (`JSON.stringify`, structured logs), not merely inaccessible to outside code. Tests observe key derivation through a captured handshake message on the wire, never by reading the field.
- `test/helpers/fakevehicle.ts` is a from-scratch reimplementation of the vehicle side (independent HMAC verification, not a mock), so round-trip tests check the client against a second implementation of the wire format.

## Tariff resolver (`src/tariff.ts`)

`getTariffPeriods(tariff, now, opts)` is a pure Tariff V2 rate resolver mirroring `python-tesla-fleet-api`'s sibling. Invariants worth keeping:

- The tariff carries no timezone; the caller must pass `opts.timeZone` (IANA, e.g. `site_info.installation_time_zone`) — there is no other way to get site-local wall-clock parts from a JS `Date`.
- Resolution is one calendar day at a time (`dayPeriods`), not a minute-of-week span: a `tou_periods` entry's `fromDayOfWeek..toDayOfWeek` means "this daily window recurs on these weekdays". `nextChange`/`upcoming` re-resolve the season per day so a horizon crossing a season boundary re-prices, and a gap between periods is reported as a gap.
- Wall-clock boundary → `Date` goes through `wallClockToUtcMillis` (iterative: the zone's offset at the target instant is what's being solved for), never by adding elapsed minutes to `now`. The reverse — "what calendar day is N wall-clock minutes from now" — must go through `wallClockAt` (pure calendar arithmetic), never `now.getTime() + minutes*60000`, which lands on the wrong day across a DST fall-back (25h) or spring-forward (23h) day.
- Buy and sell resolve independently via `scheduleAt`, which reports `nextChangeGM`/`sinceGM` even for a grid sitting in a gap (a sell window not yet open, or closed). `nextChange` (earlier of the two) and `currentStart` (later) must fold in the sell side even when sell has no active period, or a differently-scheduled sell tariff is silently ignored or backdated. Both are nullable (bounded to one day of lookahead/lookback) and must be excluded via `!= null`, never treated as `0`.
- `TariffContentV2.seasons` (`src/types/site_info.ts`) is `Record<string, Season>` — an object keyed by season name, not an array. Don't regress it to an array shape.

## Releases

Releases go through Changesets, not hand-cut GitHub Releases: a PR that changes behavior includes a changeset (`pnpm changeset`). Merging to `main` runs `.github/workflows/publish.yml`, whose `validate` job re-runs `reusable-ci.yml` (lint/typecheck/test/publint/pack) on the exact SHA being released and whose `release` job (`needs: validate`) either opens/updates a "Version Packages" PR or, if one was just merged, publishes via `changeset publish`.

- `ci.yml` and `publish.yml`'s `validate` both call `reusable-ci.yml` — keep checks there, not duplicated inline, and keep `needs: validate` so a stale CI run on another SHA can never stand in for the one being published.
- The `production` environment has no protection rules configured: merging the "Version Packages" PR is the sole approval gate, and `release` publishes immediately after.
- Publishing uses npm trusted publishing (OIDC, `id-token: write`, no `NPM_TOKEN`). It must be configured per-package on npmjs.com (package Settings → Trusted Publisher, github-actions provider, matching repo + `.github/workflows/publish.yml`).
- `--provenance` requires `package.json`'s `repository.url` to resolve to `https://github.com/Teslemetry/node-tesla-fleet-api`; sigstore checks it against the Actions run's own repo and fails the publish (`E422`) on a mismatch.
- Before assuming a version is live, check `npm view tesla-fleet-api@<version>` rather than trusting `package.json`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
