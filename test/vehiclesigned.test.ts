import { describe, expect, it, vi } from "vitest";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import { FakeVehicle } from "./helpers/fakevehicle.js";

const VIN = "5YJXCAE43LF123456";
const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");

/**
 * Wires a real `VehicleSigned` through the real `Vehicle.signed_command` ->
 * `TeslaFleetApi._request` call chain, with only the final HTTP call itself
 * mocked out and redirected into a `FakeVehicle`. This exercises the full
 * production code path: signed-command building in `Commands`, base64
 * encode/decode in `VehicleSigned._send`, and the `Vehicle`/`TeslaFleetApi`
 * plumbing in between - not just the abstract `Commands` seam in isolation.
 */
function makeSignedVehicle(fakeVehicle: FakeVehicle) {
    const api = new TeslaFleetApi({ accessToken: "test-token", region: "na" });
    const request = vi.spyOn(api, "_request").mockImplementation(async (_method, path: string, _params, json) => {
        if (path.endsWith("/signed_command")) {
            const requestBytes = Buffer.from((json as { routable_message: string }).routable_message, "base64");
            const replyBytes = fakeVehicle.handle(requestBytes);
            return { response: replyBytes.toString("base64") };
        }
        throw new Error(`Unexpected request to ${path}`);
    });

    const vehicle = new Vehicle(api);
    const signed = vehicle.signed(VIN, OUR_PRIVATE_KEY);
    return { signed, request };
}

describe("VehicleSigned: end-to-end through the cloud /signed_command transport", () => {
    it("locks the vehicle via base64-over-HTTP, not the plaintext cloud parent", async () => {
        const fakeVehicle = new FakeVehicle();
        const { signed, request } = makeSignedVehicle(fakeVehicle);

        const result = await signed.door_lock();

        expect(result).toEqual({ response: { result: true, reason: "" } });
        // Every call went through /signed_command - never the plaintext /command/door_lock path.
        for (const call of request.mock.calls) {
            expect(call[1]).toMatch(/\/signed_command$/);
        }
        expect(request).toHaveBeenCalled();
    });

    it("round-trips charge_start and set_charge_limit", async () => {
        const fakeVehicle = new FakeVehicle();
        const { signed } = makeSignedVehicle(fakeVehicle);

        await expect(signed.charge_start()).resolves.toEqual({ response: { result: true, reason: "" } });
        await expect(signed.set_charge_limit(85)).resolves.toEqual({ response: { result: true, reason: "" } });
    });

    it("propagates a whitelist rejection from the real transport", async () => {
        const fakeVehicle = new FakeVehicle();
        fakeVehicle.rejectNextAsNotWhitelisted();
        const { signed } = makeSignedVehicle(fakeVehicle);

        await expect(signed.door_lock()).rejects.toThrow(/whitelist/i);
    });

    it("still exposes plaintext cloud endpoints for reads that don't require signing", async () => {
        const fakeVehicle = new FakeVehicle();
        const api = new TeslaFleetApi({ accessToken: "test-token", region: "na" });
        vi.spyOn(api, "_request").mockImplementation(async (_method, path: string) => {
            if (path.endsWith("/signed_command")) {
                throw new Error("should not be reached for vehicle_data reads");
            }
            return { response: { vin: VIN } };
        });
        const vehicle = new Vehicle(api);
        const signed = vehicle.signed(VIN, OUR_PRIVATE_KEY);

        await expect(signed.vehicle()).resolves.toEqual({ vin: VIN });
        void fakeVehicle; // unused in this read-only case, kept for symmetry with the others
    });
});
