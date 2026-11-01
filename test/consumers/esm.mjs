// Smoke test of the published entry points from an ESM consumer. Resolves
// through package.json `exports` (self-reference), so run it after a build.
import assert from "node:assert/strict";
import { TeslaFleetApi, getTariffPeriods as rootGetTariffPeriods, Models as rootModels } from "tesla-fleet-api";
import { getTariffPeriods } from "tesla-fleet-api/tariff";
import { Models, SERVERS } from "tesla-fleet-api/const";
import * as router from "tesla-fleet-api/router";

assert.equal(typeof TeslaFleetApi, "function");
assert.equal(typeof getTariffPeriods, "function");
assert.equal(rootGetTariffPeriods, getTariffPeriods);
assert.equal(rootModels, Models);
assert.equal(typeof SERVERS.na, "string");
assert.equal(typeof router, "object");
console.log("ESM consumer OK");
