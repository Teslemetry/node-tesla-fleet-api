import { VehicleAction } from "@teslemetry/tesla-protocol/command/car_server";
import { RKEActionE, UnsignedMessage, VehicleLockStateE, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import { ChargeState, ClimateState, MediaState } from "@teslemetry/tesla-protocol/command/vehicle";

/**
 * How hard a mutating command tries to confirm itself before returning.
 *
 * - `"optimistic"`: success once the write completes.
 * - `"ack"`: wait for the addressed ack. Lock and unlock also race a matching
 *   status broadcast, because the car keeps broadcasting when an ack is lost.
 * - `"verify"`: as `"ack"`, then read state back after a timeout.
 */
export type BluetoothConfirmation = "optimistic" | "ack" | "verify";

/**
 * Whether state shows a command ran. `undefined` means the reply left the field
 * out: that proves nothing, so it is treated as a read that could not complete,
 * and never as proof the command did not run.
 */
type Executed<State> = (state: State) => boolean | undefined;

/** A lock or unlock's check, which a status broadcast can also answer. */
export interface VcsecVerifyPlan {
    reader: "vehicle_state";
    executed: (state: VehicleStatus) => boolean;
}

/** Which reader proves a timed-out command, and how. */
export type VerifyPlan =
    | VcsecVerifyPlan
    | { reader: "charge_state"; executed: Executed<ChargeState> }
    | { reader: "media_state"; executed: Executed<MediaState> }
    | { reader: "climate_state"; executed: Executed<ClimateState> };

/**
 * These are float32 on the wire, so a double set by the caller only equals the
 * value the car reports back once it is narrowed the same way: 21.7 would
 * otherwise compare unequal and prove a command that ran did not.
 */
function sameFloat(sent: number, reported: number | undefined): boolean | undefined {
    return reported === undefined ? undefined : Math.fround(sent) === Math.fround(reported);
}

function same<T>(sent: T, reported: T | undefined): boolean | undefined {
    return reported === undefined ? undefined : sent === reported;
}

/** The plan for a VCSEC actuation. Only lock and unlock have one. */
export function vcsecVerifyPlan(command: UnsignedMessage): VcsecVerifyPlan | null {
    if (command.RKEAction === RKEActionE.RKE_ACTION_LOCK) {
        return { reader: "vehicle_state", executed: (state) => state.vehicleLockState === VehicleLockStateE.VEHICLELOCKSTATE_LOCKED };
    }
    if (command.RKEAction === RKEActionE.RKE_ACTION_UNLOCK) {
        return { reader: "vehicle_state", executed: (state) => state.vehicleLockState === VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED };
    }
    return null;
}

/**
 * The plan for an infotainment command. Only clearly derivable absolute
 * commands have one. Never add a toggle, a relative step or an ack-only action:
 * nothing about their outcome can be read back.
 */
export function infotainmentVerifyPlan(action: VehicleAction | undefined): VerifyPlan | null {
    if (action?.chargingSetLimitAction) {
        const { percent } = action.chargingSetLimitAction;
        return { reader: "charge_state", executed: (state) => same(percent, state.chargeLimitSoc) };
    }
    if (action?.setChargingAmpsAction) {
        const { chargingAmps } = action.setChargingAmpsAction;
        return { reader: "charge_state", executed: (state) => same(chargingAmps, state.chargingAmps) };
    }
    const target = action?.mediaUpdateVolume?.volumeAbsoluteFloat;
    if (target !== undefined) {
        return { reader: "media_state", executed: (state) => sameFloat(target, state.audioVolume) };
    }
    if (action?.hvacTemperatureAdjustmentAction) {
        const { driverTempCelsius, passengerTempCelsius } = action.hvacTemperatureAdjustmentAction;
        return {
            reader: "climate_state",
            executed: (state) => {
                const driver = sameFloat(driverTempCelsius, state.driverTempSetting);
                const passenger = sameFloat(passengerTempCelsius, state.passengerTempSetting);
                return driver === undefined || passenger === undefined ? undefined : driver && passenger;
            },
        };
    }
    if (action?.hvacAutoAction) {
        const { powerOn } = action.hvacAutoAction;
        return { reader: "climate_state", executed: (state) => same(powerOn, state.isClimateOn) };
    }
    return null;
}
