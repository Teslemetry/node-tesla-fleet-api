import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import Commands from "../../src/commands.js";
import TeslaFleetApi from "../../src/teslafleetapi.js";
import Vehicle from "../../src/vehicle.js";
import { FakeVehicle } from "./fakevehicle.js";

const VIN = "5YJXCAE43LF123456";
const PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");

/** A concrete `Commands` whose `_send` seam is an in-process call into a `FakeVehicle`. */
export class FakeVehicleCommands extends Commands {
    readonly _transport_name = "test";
    readonly fakeVehicle = new FakeVehicle();

    constructor() {
        super(new Vehicle(new TeslaFleetApi({ server: "https://fleet.test" })), VIN, PRIVATE_KEY);
    }

    protected async _send(msg: RoutableMessage): Promise<RoutableMessage> {
        const reply = RoutableMessage.decode(this.fakeVehicle.handle(Buffer.from(RoutableMessage.encode(msg).finish())));
        this.validate_msg(reply, Buffer.from(msg.uuid));
        return reply;
    }
}
