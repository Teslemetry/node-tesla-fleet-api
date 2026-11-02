// Python's `tesla/vehicle/stream_glue.py`, and `BleBroadcastPublisher` from its
// `funnel.py`. Both only register listeners: neither connects, reads or commands,
// and a dropped link just ends the broadcasts.
//
// Sleep status, user presence and UI desire are left unwired, as in Python: the
// stream has a separate `state` topic for the first and no signal for the others.

import { ClosureStateE, ClosureStatuses, GearE, VehicleLockStateE, closureStateEToJSON, gearEToJSON, vehicleLockStateEToJSON } from "@teslemetry/tesla-protocol/command/vcsec";
import { CLOSURE_STATES, Clock, FieldPath, LOCK_STATES, ObservationSink, Publisher, Unsubscribe } from "../funnel.js";
import type { BroadcastListeners } from "./broadcast.js";

/**
 * What the glue feeds. Structurally a Teslemetry stream's `ingest`: no stream
 * package is imported here, so a sink can be anything with this method.
 */
export interface StreamSink {
    ingest(data: Record<string, unknown>, metadata?: Record<string, unknown>): unknown;
}

// Stream listeners read prefixed wire strings. `GEAR_UNKNOWN` is unmapped: it is
// the proto3 default, so every lock-only broadcast carries it, and emitting it
// would overwrite a real gear.
export const GEAR_STATES: ReadonlyMap<number, string> = new Map([
    [GearE.GEAR_PARK, "ShiftStateP"],
    [GearE.GEAR_DRIVE, "ShiftStateD"],
    [GearE.GEAR_REVERSE, "ShiftStateR"],
    [GearE.GEAR_NEUTRAL, "ShiftStateN"],
]);

// Coarser than VCSEC's closure states. Only these translate unambiguously.
export const TONNEAU_POSITION_STATES: ReadonlyMap<number, string> = new Map([
    [ClosureStateE.CLOSURESTATE_CLOSED, "TonneauPositionStateClosed"],
    [ClosureStateE.CLOSURESTATE_OPEN, "TonneauPositionStateFullyOpen"],
    [ClosureStateE.CLOSURESTATE_AJAR, "TonneauPositionStatePartiallyOpen"],
]);

/** A closure state's name, or the bare number for one this build has no name for. */
function closureName(state: ClosureStateE): string {
    const name = closureStateEToJSON(state);
    return name === "UNRECOGNIZED" ? String(state) : name;
}

/**
 * Feeds a vehicle's broadcasts into a stream-shaped sink, so a Bluetooth reading
 * reaches the listeners a native stream event does. There is no source ranking:
 * every call reaches them in arrival order.
 */
export class BleBroadcastStreamGlue {
    readonly #sink: StreamSink;
    #unsubscribes: Unsubscribe[];

    constructor(vehicle: BroadcastListeners, sink: StreamSink) {
        this.#sink = sink;
        this.#unsubscribes = [
            vehicle.listen_vehicle_lock_state((state) => this.#onLockState(state)),
            vehicle.listen_charge_port((state) => this.#onChargePort(state)),
            vehicle.listen_closure_statuses((closures) => this.#onClosures(closures)),
            vehicle.listen_gear((gear) => this.#onGear(gear)),
            vehicle.listen_tonneau((state) => this.#onTonneau(state)),
            vehicle.listen_tonneau_percent_open((percent) => this.#sink.ingest({ TonneauOpenPercent: percent }, { source: "bluetooth" })),
        ];
    }

    /** Stop listening. Safe to call twice. */
    stop(): void {
        for (const unsubscribe of this.#unsubscribes) {
            unsubscribe();
        }
        this.#unsubscribes = [];
    }

    #onLockState(state: VehicleLockStateE): void {
        const locked = LOCK_STATES.get(state);
        if (locked !== undefined) {
            this.#sink.ingest({ Locked: locked }, { source: "bluetooth", raw: vehicleLockStateEToJSON(state) });
        }
    }

    #onChargePort(state: ClosureStateE): void {
        const open = CLOSURE_STATES.get(state);
        if (open !== undefined) {
            this.#sink.ingest({ ChargePortDoorOpen: open }, { source: "bluetooth", raw: closureStateEToJSON(state) });
        }
    }

    /**
     * Every door listener fires on any `DoorState` event and reads its own key, so
     * a leaf sent alone would reach the other five as missing. All six go in one
     * event, as a native event's do, with a leaf in an unmapped state left out.
     */
    #onClosures(closures: ClosureStatuses): void {
        const raw = {
            DriverFront: closures.frontDriverDoor,
            PassengerFront: closures.frontPassengerDoor,
            DriverRear: closures.rearDriverDoor,
            PassengerRear: closures.rearPassengerDoor,
            TrunkFront: closures.frontTrunk,
            TrunkRear: closures.rearTrunk,
        };
        const leaves = Object.entries(raw);
        const doorState = leaves.flatMap(([key, state]) => {
            const open = CLOSURE_STATES.get(state);
            return open === undefined ? [] : [[key, open] as const];
        });
        if (doorState.length > 0) {
            this.#sink.ingest(
                { DoorState: Object.fromEntries(doorState) },
                { source: "bluetooth", raw: Object.fromEntries(leaves.map(([key, state]) => [key, closureName(state)])) },
            );
        }
    }

    #onGear(gear: GearE): void {
        const state = GEAR_STATES.get(gear);
        if (state !== undefined) {
            this.#sink.ingest({ Gear: state }, { source: "bluetooth", raw: gearEToJSON(gear) });
        }
    }

    #onTonneau(state: ClosureStateE): void {
        const position = TONNEAU_POSITION_STATES.get(state);
        if (position !== undefined) {
            this.#sink.ingest({ TonneauPosition: position }, { source: "bluetooth", raw: closureStateEToJSON(state) });
        }
    }
}

/** The map and listener behind each field a broadcast carries. */
const BROADCAST_FIELDS: ReadonlyMap<
    FieldPath,
    { states: ReadonlyMap<number, boolean>; listen: (vehicle: BroadcastListeners, callback: (state: number) => void) => Unsubscribe }
> = new Map([
    [FieldPath.LOCKED, { states: LOCK_STATES, listen: (vehicle, callback) => vehicle.listen_vehicle_lock_state(callback) }],
    [FieldPath.CHARGE_PORT_DOOR_OPEN, { states: CLOSURE_STATES, listen: (vehicle, callback) => vehicle.listen_charge_port(callback) }],
    [FieldPath.DOOR_STATE_TRUNK_FRONT, { states: CLOSURE_STATES, listen: (vehicle, callback) => vehicle.listen_front_trunk(callback) }],
]);

/**
 * Publishes VCSEC status broadcasts to an `ObservationFunnel`. Registration only:
 * a dropped session ends the broadcasts and says nothing about the fields, so it
 * publishes nothing.
 */
export class BleBroadcastPublisher implements Publisher {
    readonly paths: ReadonlySet<FieldPath> = new Set(BROADCAST_FIELDS.keys());
    readonly #vehicle: BroadcastListeners;
    readonly #clock: Clock;
    readonly #subscriptions = new Map<FieldPath, Unsubscribe>();
    #sink: ObservationSink | null = null;

    constructor(vehicle: BroadcastListeners, options: { clock?: Clock } = {}) {
        this.#vehicle = vehicle;
        this.#clock = options.clock ?? (() => performance.now() / 1000);
    }

    attach(sink: ObservationSink): Unsubscribe {
        this.#sink = sink;
        return () => {
            this.release(new Set(this.#subscriptions.keys()));
            this.#sink = null;
        };
    }

    request(paths: ReadonlySet<FieldPath>): void {
        for (const path of paths) {
            const field = BROADCAST_FIELDS.get(path);
            if (field && !this.#subscriptions.has(path)) {
                this.#subscriptions.set(
                    path,
                    field.listen(this.#vehicle, (state) => {
                        const value = field.states.get(state);
                        if (value !== undefined) {
                            this.#sink?.publish({ path, value, observed_at: this.#clock() });
                        }
                    }),
                );
            }
        }
    }

    release(paths: ReadonlySet<FieldPath>): void {
        for (const path of paths) {
            this.#subscriptions.get(path)?.();
            this.#subscriptions.delete(path);
        }
    }
}
