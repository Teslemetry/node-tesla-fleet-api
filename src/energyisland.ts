// Island-mode rules shared by the LAN client and the cloud energy site, so the two
// paths to one contactor cannot drift apart.
import { TEGSetIslandModeResult, tEGSetIslandModeResultToJSON } from "@teslemetry/tesla-protocol/energy_device/teg_api";
import { EnergyIslandMode } from "./const.js";

/** The `TEGSetIslandModeResult` values that mean the gateway refused. */
const REJECTIONS: readonly TEGSetIslandModeResult[] = [
    TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_REJECTED_NOT_READY_FOR_ISLANDING,
    TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_REJECTED_LOAD_DROP_EXPECTED,
    TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_REJECTED_LOW_ENERGY,
    TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_REJECTED_EXCESSIVE_SOLAR,
];

/**
 * The refusal a `setIslandModeResponse.result` reports, or `null` for anything
 * else, which is not guessed at. Takes the enum's number or its name, because a
 * JSON route may carry either.
 */
export function island_mode_rejection(result: unknown): { code: number; name: string } | null {
    for (const code of REJECTIONS) {
        const name = tEGSetIslandModeResultToJSON(code);
        if (result === code || result === name) {
            return { code, name };
        }
    }
    return null;
}

/**
 * Check an island command before it is signed. A contactor command takes only the
 * two modes Python's `go_off_grid` and `reconnect_grid` use: `ON_GRID` (1) and
 * `OFF_GRID` (6). There is no coercion and no default, because `"6"` or a missing
 * mode could otherwise close the contactor when the caller meant to open it.
 * @throws TypeError on any other mode, or a `force` that is not a boolean.
 */
export function validate_island_mode(mode: unknown, force?: unknown): void {
    if (mode !== EnergyIslandMode.ON_GRID && mode !== EnergyIslandMode.OFF_GRID) {
        throw new TypeError("mode must be EnergyIslandMode.ON_GRID (1) or EnergyIslandMode.OFF_GRID (6)");
    }
    if (force !== undefined && force !== null && typeof force !== "boolean") {
        throw new TypeError("force must be a boolean");
    }
}
