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

export type GranularAccess = {
    hide_private: boolean;
};

export const Models: Record<string, string> = {
    S: "Model S",
    "3": "Model 3",
    X: "Model X",
    Y: "Model Y",
    C: "Cybertruck",
    T: "Semi",
    A: "Cybercab",
};
