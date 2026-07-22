import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import Commands from "./commands.js";

/**
 * The Fleet API `/signed_command` transport: fills `Commands`'s abstract
 * `_send` seam by base64-encoding the signed `RoutableMessage`, POSTing it to
 * the cloud `signed_command` endpoint, and decoding the reply. A future BLE
 * transport (Story 3) fills the same seam over a GATT link instead - nothing
 * else in `Commands` needs to change for that to work.
 */
export default class VehicleSigned extends Commands {
    protected async _send(msg: RoutableMessage, _requires: string, _expectsData?: boolean, _confirmBroadcast?: (status: VehicleStatus) => boolean): Promise<RoutableMessage> {
        const encoded = Buffer.from(RoutableMessage.encode(msg).finish()).toString("base64");
        const json = await this.parent.signed_command(this.vin, encoded);
        const resp = RoutableMessage.decode(Buffer.from(json.response, "base64"));
        this.validateAndUpdateSession(resp, Buffer.from(msg.uuid));
        return resp;
    }
}
