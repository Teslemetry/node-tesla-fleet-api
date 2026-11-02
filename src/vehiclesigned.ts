import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import Commands from "./commands.js";

/**
 * The Fleet API `/signed_command` transport: fills `Commands`'s abstract
 * `_send` seam by base64-encoding the signed `RoutableMessage`, POSTing it to
 * the cloud `signed_command` endpoint, and decoding the reply. Replies here are
 * singular and delivered whole, with no broadcast side channel, so `_send`
 * has no use for `requires` or its options.
 */
export default class VehicleSigned extends Commands {
    readonly _transport_name: string = "fleet";

    protected async _send(msg: RoutableMessage): Promise<RoutableMessage> {
        const encoded = Buffer.from(RoutableMessage.encode(msg).finish()).toString("base64");
        const json = await this.parent.signed_command(this.vin, encoded);
        const resp = RoutableMessage.decode(Buffer.from(json.response, "base64"));
        this.validate_msg(resp, Buffer.from(msg.uuid));
        return resp;
    }
}
