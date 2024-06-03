import TeslaFleetApi from "./teslafleetapi.js";
import { RequestFunction } from "./types.js";

export default class Charging {
    parent: TeslaFleetApi;

    constructor(parent: TeslaFleetApi) {
        this.parent = parent;
    }

    async history(
        vin?: string,
        startTime?: string,
        endTime?: string,
        pageNo?: number,
        pageSize?: number,
        sortBy?: string,
        sortOrder?: string
    ): Promise<Record<string, any>> {
        return await this.parent._request("GET", "api/1/dx/charging/history", {
            vin,
            startTime,
            endTime,
            pageNo,
            pageSize,
            sortBy,
            sortOrder,
        });
    }

    async sessions(vin?: string, date_from?: string, date_to?: string, limit?: number, offset?: number): Promise<Record<string, any>> {
        return await this.parent._request("GET", "api/1/dx/charging/sessions", {
            vin,
            date_from,
            date_to,
            limit,
            offset,
        });
    }
}
