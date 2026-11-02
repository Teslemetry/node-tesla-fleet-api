// Smoke test of the published entry points from an ESM consumer. Resolves
// through package.json `exports` (self-reference), so run it after a build.
import assert from "node:assert/strict";
import { TeslaFleetApi, InvalidResponse, firmwareAtLeast, getTariffPeriods as rootGetTariffPeriods, Models as rootModels } from "tesla-fleet-api";
import { getTariffPeriods, unwrapTariffV2 } from "tesla-fleet-api/tariff";
import { Models, SERVERS } from "tesla-fleet-api/const";
import * as router from "tesla-fleet-api/router";
import { BleNotSubmittedError, ReassemblingBuffer, SERVICE_UUID } from "tesla-fleet-api/bluetooth";

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
assert.equal(typeof router, "object");
console.log("ESM consumer OK");
