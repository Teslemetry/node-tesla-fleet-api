import { CommandResponse } from "./types/index.js";

export const validate = async (body: CommandResponse): Promise<void> => {
    if (body?.error) {
        return Promise.reject(body.error);
    }
    if (body?.response?.result == false) {
        return Promise.reject(body.response.reason);
    }
    return Promise.resolve();
};
