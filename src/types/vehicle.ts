export type VehicleResponse = {
    id: number;
    vehicle_id: number;
    vin: string;
    color: null;
    access_type: string;
    display_name: string;
    option_codes: null;
    granular_access: GranularAccess;
    tokens: string[];
    state: string;
    in_service: boolean;
    id_s: string;
    calendar_enabled: boolean;
    api_version: number;
    backseat_token: null;
    backseat_token_updated_at: null;
    ble_autopair_enrolled: boolean;
};

export type WakeUpOptions = {
    /** Poll `vehicle()` until the vehicle reports `online`, raising `VehicleOffline` at the deadline. */
    wait?: boolean;
    /** Deadline for `wait`, in milliseconds. */
    timeoutMs?: number;
};

export type GranularAccess = {
    hide_private: boolean;
};

export { Models } from "../const.js";
