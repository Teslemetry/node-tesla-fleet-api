import TeslaFleetApi from "./teslafleetapi.js";

export default class Charging {
    parent: TeslaFleetApi;

    constructor(parent: TeslaFleetApi) {
        this.parent = parent;
    }

    /**
     * Returns the paginated charging history.
     * @param vin Vehicle Identification Number (VIN) of the selected vehicle.
     * @param startTime Start time of the windows to download charging history for (i,e "2023-07-27T11:43:45-07:00").
     * @param endTime End time of the windows to download charging history for (i,e "2023-07-28T11:43:45-07:00").
     * @param pageNo Current page number.
     * @param pageSize Number of records per page.
     * @param sortBy Field to sort by.
     * @param sortOrder Sort order (ASC or DESC).
     */
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

    /**
     * Returns a charging invoice pdf for an event from charging history.
     * @param id Content ID. This can be obtained from the invoices.contentId of a charging history event.
     */
    async invoice(id: string): Promise<Record<string, any>> {
        return await this.parent._request("GET", `api/1/dx/charging/invoices/${id}`);
    }

    /**
     * Returns the charging session information including pricing and energy data. This endpoint is only available for business accounts that own a fleet of vehicles.
     * @param vin Vehicle Identification Number (VIN) of the selected vehicle.
     * @param date_from Start date of the windows to download charging sessions.
     * @param date_to End date of the windows to download charging sessions.
     * @param limit Number of entities to be returned.
     * @param offset Number of entities to be skipped.
     */

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
