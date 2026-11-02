// Island-mode rules shared by the LAN client and the cloud energy site, so the two
// paths to one contactor cannot drift apart.
import { TEGSetIslandModeResult, tEGSetIslandModeResultToJSON } from "@teslemetry/tesla-protocol/energy_device/teg_api";

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
