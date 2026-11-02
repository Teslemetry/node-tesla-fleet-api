// Smoke test of the published entry points from an ESM consumer. Resolves
// through package.json `exports` (self-reference), so run it after a build.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { BluetoothUnconfirmedCommand, TeslaFleetApi, InvalidResponse, firmwareAtLeast, getTariffPeriods as rootGetTariffPeriods, Models as rootModels } from "tesla-fleet-api";
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
assert.equal(typeof router.VehicleRouter, "function");
assert.equal(typeof router.is_failover_safe, "function");

// The dual-package hazard, for real: this process now holds both copies of the
// package, and a backend loaded through `require` throws the CJS class into the
// ESM router. `instanceof` fails across the copies, so the field has to catch it.
const cjs = createRequire(import.meta.url)("tesla-fleet-api");
assert.notEqual(cjs.BluetoothUnconfirmedCommand, BluetoothUnconfirmedCommand);
const thrown = new cjs.BluetoothUnconfirmedCommand();
assert.equal(thrown instanceof BluetoothUnconfirmedCommand, false);
let replayed = false;
const dualRouter = new router.VehicleRouter(
    [
        {
            async door_lock() {
                throw thrown;
            },
        },
        {
            async door_lock() {
                replayed = true;
            },
        },
    ],
    { on_result: () => assert.fail("an unconfirmed command must not reach on_result") },
);
await assert.rejects(dualRouter.door_lock(), (error) => error === thrown);
assert.equal(replayed, false);
assert.equal(router.is_failover_safe(thrown), false);
console.log("ESM consumer OK");
