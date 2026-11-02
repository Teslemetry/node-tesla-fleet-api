// Shapes of the payloads the local client returns. The gateway's JSON documents
// are deep and carry many more keys, so these name only what the library reads.
// Keys match Python's, so the router's merge lists apply unchanged.

export type ConfigPayload = Record<string, any>;
export type StatusPayload = Record<string, any>;
export type ControllerPayload = Record<string, any>;
export type ComponentsPayload = Record<string, any>;

/** An enum as its name without the common prefix, or the raw number when a newer firmware reports one this package does not know. */
export type EnumName = string | number;

export type FirmwareDetails = {
    system: {
        gateway: { partNumber: string; serialNumber: string };
        din: string;
        version: { text: string; githash: Uint8Array };
        update_status: number;
        device_type: number;
        wireless: { device: unknown[] };
    };
};

export type BackupEvent = {
    id: string;
    name: string;
    start_time: number;
    duration_seconds: number;
    /** A decimal string: the maximum priority, `2^64 - 1`, does not fit a JS number. */
    priority: string;
};

export type ManualBackupInfo = {
    start_time: number;
    duration_seconds: number;
    end_time: number;
    active: boolean;
    /** A decimal string: the maximum priority, `2^64 - 1`, does not fit a JS number. */
    priority: string;
};

export type BackupEventsPayload = {
    manual_backup: ManualBackupInfo | null;
    backup_events: BackupEvent[];
};

export type BatteryCalibrationDelayStatus = {
    calibration_delays_left: number;
    calibration_delay_remaining_seconds: number;
    max_calibration_delays: number;
};

/** One schedule boundary of a controllable device program. Tesla-protocol 6 replaced Python's epoch seconds with this. */
export type ProgramBoundary = {
    static_condition: EnumName;
    timestamp: number | null;
    islanding_state: EnumName;
    state_of_energy: EnumName;
};

export type ControllableDeviceProgram = {
    key: { device_id: string; priority: EnumName };
    settings: { contactor_state: EnumName };
    schedule: {
        start: ProgramBoundary | null;
        end: ProgramBoundary | null;
        expiry: ProgramBoundary | null;
    };
};

export type ControllableDeviceProgramsPayload = {
    active_programs: ControllableDeviceProgram[];
    inactive_programs: ControllableDeviceProgram[];
};

/** One record from the gateway's `list_authorized_clients`. See `find_authorized_clients` for the shared typed form. */
export type AuthorizedClientRecord = {
    /** Base64 of the DER public key. */
    public_key: string;
    state: EnumName;
    type: EnumName;
    description: string;
    key_type: EnumName;
    roles: EnumName[];
    verification: EnumName;
    /** Epoch seconds. */
    added_time: number | null;
    identifier: string | null;
    /** Base64, like `public_key`. */
    authorized_by_public_key: string | null;
};

export type AuthorizedClientsPayload = {
    clients: AuthorizedClientRecord[];
    enable_line_switch_off: boolean;
};
