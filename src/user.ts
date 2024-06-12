import TeslaFleetApi from "./teslafleetapi.js";
import { CommandResponse } from "./types/commands.js";

export default class User {
    parent: TeslaFleetApi;

    constructor(parent: TeslaFleetApi) {
        this.parent = parent;
    }

    /** Returns the public key associated with the user. */
    async backup_key(): Promise<CommandResponse> {
        return this.parent._request("GET", "api/1/users/backup_key");
    }

    /** Returns any custom feature flag applied to a user. */
    async feature_config(): Promise<CommandResponse> {
        return this.parent._request("GET", "api/1/users/feature_config");
    }

    /** Returns a summary of a user's account. */
    async me(): Promise<CommandResponse> {
        return this.parent._request("GET", "api/1/users/me");
    }

    /** Returns the active orders for a user. */
    async orders(): Promise<CommandResponse> {
        return this.parent._request("GET", "api/1/users/orders");
    }

    /** Returns a user's region and appropriate fleet-api base URL. Accepts no parameters, response is based on the authentication token subject. */
    async region(): Promise<CommandResponse> {
        return this.parent._request("GET", "api/1/users/region");
    }
}
