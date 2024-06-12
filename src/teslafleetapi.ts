import Charging from "./charging.js";
import Energy from "./energy.js";
import Partner from "./partner.js";
import User from "./user.js";
import Vehicle from "./vehicle.js";

import { EnergyProduct, ProductsResponse, VehicleProduct } from "./types/products.js";

type Region = "na" | "eu" | "cn";
type Method = "GET" | "POST" | "PUT" | "DELETE";

const servers: Record<Region, string> = {
    na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
    eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
    cn: "https://fleet-api.prd.cn.vn.cloud.tesla.cn",
};

export type ProductsByType = { vehicles: VehicleProduct[]; energy_sites: EnergyProduct[] };

export default class TeslaFleetApi {
    server: string | null = null;
    accessToken: string | null;
    charging?: Charging;
    energy?: Energy;
    partner?: Partner;
    user?: User;
    vehicle?: Vehicle;

    constructor(options: {
        accessToken?: string;
        region?: Region;
        server?: string;
        chargingScope?: boolean;
        energyScope?: boolean;
        partnerScope?: boolean;
        userScope?: boolean;
        vehicleScope?: boolean;
    }) {
        this.accessToken = options.accessToken;

        if (options.server) {
            this.server = options.server;
        } else if (options.region && options.region in servers) {
            this.server = servers[options.region];
        } else {
            throw new Error("Either server or region must be provided.");
        }

        console.debug(`Using server ${this.server}`);

        if (options.chargingScope !== false) {
            this.charging = new Charging(this);
        }
        if (options.energyScope !== false) {
            this.energy = new Energy(this);
        }
        if (options.userScope !== false) {
            this.user = new User(this);
        }
        if (options.partnerScope !== false) {
            this.partner = new Partner(this);
        }

        if (options.vehicleScope !== false) {
            this.vehicle = new Vehicle(this);
        }
    }

    /**
     * Make a request to the Tesla Fleet API.
     * @param method
     * @param path
     * @param params
     * @param json
     * @returns
     */
    async _request(method: Method, path: string, params: Record<string, any> | null = null, json: Record<string, any> | null = null): Promise<any> {
        if (!this.server) {
            throw new Error("Server was not set at init. Call findServer() first.");
        }

        if (method === "GET" && json !== null) {
            throw new Error("GET requests cannot have a body.");
        }

        console.debug(`Sending request to ${path}`);

        // Remove null and undefined values from params and json
        if (params) {
            params = Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null));
            console.debug(`Parameters: ${JSON.stringify(params)}`);
        }
        if (json) {
            json = Object.fromEntries(Object.entries(json).filter(([_, v]) => v != null));
            console.debug(`Body: ${JSON.stringify(json)}`);
        }

        const headers = {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            "X-Library": `node tesla_fleet_api`,
        };

        const query = params ? "?" + new URLSearchParams(params).toString() : "";

        return fetch(`${this.server}/${path}${query}`, {
            method,
            headers,
            body: json ? JSON.stringify(json) : null,
        }).then((res) => {
            console.debug(res.status);
            if (!res.ok) {
                throw new Error(`HTTP status code ${res.status}`);
            }
            if (res.headers.get("content-type").startsWith("application/json")) {
                return res.json();
            }
            throw new Error(`Not JSON ${res.status}`);
        });
    }

    /**
     * Returns products mapped to user.
     * @returns An array of products including both vehicles and energy sites.
     */
    async products(): Promise<ProductsResponse> {
        return this._request("GET", "api/1/products").then((data) => data.response);
    }

    /**
     * Return Tesla products separated into vehicles and energy_sites
     * @returns A dictionary of vehicles and energy sites, each with an array of those products
     */
    async products_by_type(): Promise<ProductsByType> {
        return this.products().then((products) => ({
            vehicles: products.filter((product): product is VehicleProduct => "vin" in product),
            energy_sites: products.filter((product): product is EnergyProduct => "energy_site_id" in product),
        }));
    }
}
