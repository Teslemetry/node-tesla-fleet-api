// Smoke test of the published entry points from a CommonJS consumer. Resolves
// through package.json `exports` (self-reference), so run it after a build.
const assert = require("node:assert/strict");
const { TeslaFleetApi, InvalidResponse, firmwareAtLeast, getTariffPeriods: rootGetTariffPeriods, Models: rootModels } = require("tesla-fleet-api");
const { getTariffPeriods, unwrapTariffV2 } = require("tesla-fleet-api/tariff");
const { Models, SERVERS } = require("tesla-fleet-api/const");
const router = require("tesla-fleet-api/router");

// The root entry must never load Bluetooth code, so check before requiring it.
assert.deepEqual(Object.keys(require.cache).filter((path) => /[\\/]dist[\\/]bluetooth/.test(path)), []);
const { BleNotSubmittedError, ReassemblingBuffer, SERVICE_UUID } = require("tesla-fleet-api/bluetooth");

assert.equal(typeof TeslaFleetApi, "function");
// ./bluetooth must load with no GATT backend installed.
assert.equal(typeof ReassemblingBuffer, "function");
assert.ok(new BleNotSubmittedError("x") instanceof Error);
assert.equal(SERVICE_UUID, "00000211-b2d1-43f0-9b88-960cebf8b91e");
assert.equal(typeof getTariffPeriods, "function");
assert.equal(rootGetTariffPeriods, getTariffPeriods);
assert.equal(rootModels, Models);
// ./tariff must throw the same InvalidResponse class the root entry exports.
assert.throws(() => unwrapTariffV2(null), InvalidResponse);
assert.equal(firmwareAtLeast("2025.10", "2025.9"), true);
assert.equal(typeof SERVERS.na, "string");
assert.equal(typeof router.VehicleRouter, "function");
assert.equal(typeof router.is_failover_safe, "function");
console.log("CJS consumer OK");
