import TeslaFleetApi from "./teslafleetapi.js";

// Partner Class
export default class Partner {
    parent: TeslaFleetApi;

    constructor(parent: TeslaFleetApi) {
        this.parent = parent;
    }

    /**
     * Returns the public key associated with a domain. It can be used to ensure the registration was successful.
     * @param domain Domain of the partner account.
     * @returns
     */
    async public_key(domain: string | null = null): Promise<Record<string, any>> {
        return this.parent._request("GET", "api/1/partner_accounts/public_key", { domain });
    }

    /**
     * Registers an existing account before it can be used for general API access. Each application from developer.tesla.com must complete this step.
     * @param domain Domain of the partner account.
     * @returns
     */
    async register(domain: string): Promise<Record<string, any>> {
        return this.parent._request("POST", "api/1/partner_accounts", null, { domain });
    }

    /**
     * Returns recent fleet telemetry errors reported by vehicles after receiving the config.
     * @param domain Domain of the partner account.
     * @returns
     */
    async fleet_telemetry_errors(domain: string): Promise<Record<string, any>> {
        return this.parent._request("GET", "api/1/partner_accounts/fleet_telemetry_errors", { domain });
    }
}
