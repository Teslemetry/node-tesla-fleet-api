import TeslaFleetApi from "./teslafleetapi.js";

export default class Telemetry extends TeslaFleetApi {
    constructor(accessToken: string) {
        super({ accessToken, server: `https://api.tessie.com`, partnerScope: false, userScope: false });
    }
}
