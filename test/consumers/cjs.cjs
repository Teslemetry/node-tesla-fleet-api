// Smoke test of the published entry points from a CommonJS consumer. Resolves
// through package.json `exports` (self-reference), so run it after a build.
const assert = require("node:assert/strict");
const { TeslaFleetApi, InvalidResponse, firmwareAtLeast, getTariffPeriods: rootGetTariffPeriods, Models: rootModels } = require("tesla-fleet-api");
const { getTariffPeriods, unwrapTariffV2 } = require("tesla-fleet-api/tariff");
const { Models, SERVERS } = require("tesla-fleet-api/const");
const router = require("tesla-fleet-api/router");

assert.equal(typeof TeslaFleetApi, "function");
assert.equal(typeof getTariffPeriods, "function");
assert.equal(rootGetTariffPeriods, getTariffPeriods);
assert.equal(rootModels, Models);
// ./tariff must throw the same InvalidResponse class the root entry exports.
assert.throws(() => unwrapTariffV2(null), InvalidResponse);
assert.equal(firmwareAtLeast("2025.10", "2025.9"), true);
assert.equal(typeof SERVERS.na, "string");
assert.equal(typeof router, "object");
console.log("CJS consumer OK");
