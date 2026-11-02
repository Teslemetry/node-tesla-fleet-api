// Python tests/test_vehicle_image_state.py, over FakeVehicle.
import { beforeEach, describe, expect, it } from "vitest";
import { Response, VehicleImageRequest, VehicleImageRequest_Type } from "@teslemetry/tesla-protocol/command/car_server";
import { VehicleImageStateType } from "@teslemetry/tesla-protocol/command/vehicle";
import { VehicleImageType } from "../src/const.js";
import { InvalidResponse } from "../src/exceptions.js";
import VehicleSigned from "../src/vehiclesigned.js";
import { FakeVehicleCommands } from "./helpers/testcommands.js";

function imageReply(totalImageSize: number, data: string = "", startOffset: number = 0): Response {
    return Response.create({
        vehicleData: { vehicleImageState: { vehicleImages: [{ totalImageSize, assetData: { data: Buffer.from(data), startOffset } }] } },
    });
}

describe("vehicle_image_state", () => {
    let vehicle: FakeVehicleCommands;

    function scriptReplies(...replies: Response[]): void {
        replies.forEach((reply) => vehicle.fakeVehicle.replyToNextInfotainmentCommandWith(reply));
    }

    function sentRequests(): VehicleImageRequest[] {
        return vehicle.fakeVehicle.infotainmentActions.map((action) => action.vehicleAction!.getVehicleData!.getVehicleImageState!.imageRequests[0]);
    }

    beforeEach(() => {
        vehicle = new FakeVehicleCommands();
    });

    it("reassembles three chunks, ending on a short final chunk", async () => {
        scriptReplies(imageReply(10), imageReply(10, "abcd"), imageReply(10, "efgh", 4), imageReply(10, "ij", 8));

        const image = await vehicle.vehicle_image_state(VehicleImageType.AUTOPILOT_VISUALIZATION_WRAP, 4);

        expect(image).toEqual(Buffer.from("abcdefghij"));
        expect(sentRequests()).toEqual([
            VehicleImageRequest.create({ dataType: VehicleImageRequest_Type.ID, imageType: VehicleImageStateType.APVIZ_WRAP }),
            ...[
                [0, 4],
                [4, 4],
                [8, 2],
            ].map(([chunkOffset, chunkSize]) =>
                VehicleImageRequest.create({
                    dataType: VehicleImageRequest_Type.DATA,
                    imageType: VehicleImageStateType.APVIZ_WRAP,
                    chunkRequest: { chunkOffset, chunkSize },
                }),
            ),
        ]);
    });

    it("advances by the bytes that arrived, not the bytes requested", async () => {
        scriptReplies(imageReply(6), imageReply(6, "abc"), imageReply(6, "def", 3));

        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE, 6)).resolves.toEqual(Buffer.from("abcdef"));

        expect(sentRequests()[2].chunkRequest).toEqual({ chunkOffset: 3, chunkSize: 3 });
    });

    it("makes no data requests for a zero-size image", async () => {
        scriptReplies(imageReply(0));

        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE)).resolves.toEqual(Buffer.alloc(0));

        expect(sentRequests()).toHaveLength(1);
    });

    it.each([0, -1, 1.5, true as unknown as number])("rejects a chunk_size of %s before sending anything", async (chunkSize) => {
        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE, chunkSize)).rejects.toThrow("chunk_size must be a positive integer");

        expect(sentRequests()).toEqual([]);
    });

    it("rejects an empty chunk before the total size", async () => {
        scriptReplies(imageReply(4), imageReply(4));

        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE)).rejects.toThrow("Vehicle image ended after 0 of 4 bytes");
    });

    it("rejects a chunk at an unexpected offset", async () => {
        scriptReplies(imageReply(4), imageReply(4, "abcd", 1));

        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE)).rejects.toThrow("Unexpected vehicle image chunk offset 1; expected 0");
    });

    it("rejects data beyond the declared size", async () => {
        scriptReplies(imageReply(3), imageReply(3, "abcd"));

        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE)).rejects.toThrow("Vehicle image exceeded declared size of 3 bytes");
    });

    it("raises InvalidResponse for a reply with no image", async () => {
        scriptReplies(Response.create({ vehicleData: {} }));

        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE)).rejects.toBeInstanceOf(InvalidResponse);
    });

    it("raises InvalidResponse for a reply that only reports an outcome", async () => {
        await expect(vehicle.vehicle_image_state(VehicleImageType.LICENSE_PLATE)).rejects.toBeInstanceOf(InvalidResponse);
    });

    it("is available on the Fleet API signed transport too", () => {
        expect(VehicleSigned.prototype.vehicle_image_state).toBeTypeOf("function");
    });
});
