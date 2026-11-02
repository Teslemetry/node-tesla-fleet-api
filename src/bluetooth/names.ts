import crypto from "crypto";

const VALID_NAME = /^S[a-f0-9]{16}[CDRP]$/;

/** Whether a BLE device name is a valid Tesla vehicle's. */
export function valid_name(name: string): boolean {
    return VALID_NAME.test(name);
}

/** The BLE device name of a vehicle. */
export function get_name(vin: string): string {
    return `S${crypto.createHash("sha1").update(vin, "utf8").digest("hex").slice(0, 16)}C`;
}

/**
 * Whether an advertised name belongs to this VIN. The hash matches, with any of
 * the four suffixes `valid_name` allows, which is wider than Python's exact
 * match on `C`.
 */
export function name_matches_vin(advertised: string, vin: string): boolean {
    return valid_name(advertised) && advertised.slice(0, 17) === get_name(vin).slice(0, 17);
}
