---
"tesla-fleet-api": minor
---

Ship a dual ESM and CommonJS build (via `tsdown`) with an `exports` map: `tesla-fleet-api`, `tesla-fleet-api/tariff`, `tesla-fleet-api/const`, `tesla-fleet-api/router` and `tesla-fleet-api/types`. **Breaking:** deep imports such as `tesla-fleet-api/dist/tariff.js` or `dist/types/site_info.js` no longer resolve; import from the subpaths instead. The package no longer ships `src`, and is marked `"sideEffects": false`.
