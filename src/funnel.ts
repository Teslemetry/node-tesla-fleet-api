// Observation funnel: many push sources, one listener per field. Ported from
// Python's `tesla_fleet_api/funnel.py`.
//
// A field bound to a single source disappears whenever that source is
// unavailable. Every publisher attached here feeds the same listeners, so a field
// survives the loss of any one source. Nothing here chooses between sources:
// unavailability is a value a source reports, never something the funnel infers
// from a link dropping.
//
// The funnel is a pure consumer of observations pushed to it. It is entirely
// synchronous and holds no request callable, polling loop, or timer: a source the
// funnel could drive is a source it could be made to poll. `test/funnel.test.ts`
// enforces this against the module's syntax tree.

import { ClosureStateE, VehicleLockStateE } from "@teslemetry/tesla-protocol/command/vcsec";
import { errorText, type Logger } from "./log.js";

export type Unsubscribe = () => void;

/** Seconds off a monotonic clock. */
export type Clock = () => number;

/** A reading, or null for a source reporting the field itself as unavailable. */
export type Value = boolean | null;

/**
 * A canonical routable field, valued to match its public signal name. A compound
 * signal is split into one path per facet, because a broadcast and a
 * `vehicle_data` result each expose individual leaves.
 */
export const FieldPath = Object.freeze({
    LOCKED: "Locked",
    CHARGE_PORT_DOOR_OPEN: "ChargePortDoorOpen",
    DOOR_STATE_TRUNK_FRONT: "DoorState.TrunkFront",
} as const);
export type FieldPath = (typeof FieldPath)[keyof typeof FieldPath];

/** One timestamped value for one field. */
export interface Observation {
    readonly path: FieldPath;
    readonly value: Value;
    /**
     * Seconds off one monotonic clock shared by every publisher on a funnel;
     * observations from different sources are ordered against each other.
     */
    readonly observed_at: number;
}

/** The handle a publisher is given to feed the funnel. */
export interface ObservationSink {
    publish(observation: Observation): void;
}

/** A source of observations for one or more canonical fields. */
export interface Publisher {
    readonly paths: ReadonlySet<FieldPath>;
    attach(sink: ObservationSink): Unsubscribe;
    /** Begin supplying `paths`: subscription accounting, not a data request. */
    request(paths: ReadonlySet<FieldPath>): void;
    /** Stop supplying `paths`. */
    release(paths: ReadonlySet<FieldPath>): void;
}

interface Attached {
    publisher: Publisher;
    detach: Unsubscribe;
}

interface DemandObserver {
    paths: ReadonlySet<FieldPath>;
    callback: (active: boolean) => void;
    active: boolean;
}

function noop(): void {}

/**
 * Funnels observations from every attached publisher into one listener set.
 *
 * Many to one: a listener registered for a field receives what any publisher
 * reports for it, in arrival order. There is no source selection, ranking, or
 * health model here, and detaching or silencing a publisher produces no value of
 * its own. The only arbitration, dropping older observations and skipping
 * unchanged values, is hard-coded.
 */
export class ObservationFunnel implements ObservationSink {
    readonly #publishers: Attached[] = [];
    readonly #listeners = new Map<FieldPath, ((value: Value) => void)[]>();
    readonly #demandObservers: DemandObserver[] = [];
    readonly #observed = new Map<FieldPath, Observation>();
    readonly #logger?: Logger;

    constructor(options: { logger?: Logger } = {}) {
        this.#logger = options.logger;
    }

    /** Attach `publisher` and return its detach closure. */
    attach(publisher: Publisher): Unsubscribe {
        const attached: Attached = { publisher, detach: noop };
        // Registered before attaching so a publisher that reports an observation
        // synchronously is not discarded as unknown.
        this.#publishers.push(attached);
        attached.detach = publisher.attach(this);
        const active = this.#activePaths(publisher);
        if (active.size > 0) {
            publisher.request(active);
        }

        return () => {
            const index = this.#publishers.indexOf(attached);
            if (index === -1) {
                return;
            }
            this.#publishers.splice(index, 1);
            const stillActive = this.#activePaths(publisher);
            if (stillActive.size > 0) {
                publisher.release(stillActive);
            }
            attached.detach();
        };
    }

    #activePaths(publisher: Publisher): Set<FieldPath> {
        return new Set([...publisher.paths].filter((path) => this.#listeners.get(path)?.length));
    }

    /** Accept one observation from any publisher and fan it out. */
    publish(observation: Observation): void {
        const { path } = observation;
        const previous = this.#observed.get(path);
        if (previous !== undefined && observation.observed_at < previous.observed_at) {
            // A later reading of this field already stands.
            return;
        }
        this.#observed.set(path, observation);
        if (previous !== undefined && previous.value === observation.value) {
            return;
        }
        for (const callback of [...(this.#listeners.get(path) ?? [])]) {
            // A callback may publish, and that nested update has already given
            // every listener the newer value; continuing here would leave the
            // rest holding a value the funnel no longer holds.
            if (this.#observed.get(path) !== observation) {
                return;
            }
            this.#dispatch(callback, observation.value);
        }
    }

    /**
     * The last value observed for `path`. Null means there is no reading: either
     * nothing has ever been observed, or a source reported the field as unavailable.
     */
    value(path: FieldPath): Value {
        return this.#observed.get(path)?.value ?? null;
    }

    /**
     * Register a listener for `path`, called on each changed value. The first
     * listener for a path activates it on every capable publisher; the last one
     * to leave releases it. Registration dispatches nothing: the value standing at
     * that moment is `value()`.
     */
    listen(path: FieldPath, callback: (value: Value) => void): Unsubscribe {
        let listeners = this.#listeners.get(path);
        if (listeners === undefined) {
            listeners = [];
            this.#listeners.set(path, listeners);
        }
        const registered = listeners;
        registered.push(callback);
        if (registered.length === 1) {
            this.#forCapable(path, (publisher, paths) => publisher.request(paths));
        }
        this.#notifyDemand();

        // Guarded per registration: the same callback may be registered twice, and
        // a repeated release must not drop the other one.
        let released = false;
        return () => {
            if (released) {
                return;
            }
            released = true;
            registered.splice(registered.indexOf(callback), 1);
            if (registered.length === 0) {
                this.#forCapable(path, (publisher, paths) => publisher.release(paths));
            }
            this.#notifyDemand();
        };
    }

    #forCapable(path: FieldPath, action: (publisher: Publisher, paths: ReadonlySet<FieldPath>) => void): void {
        const paths = new Set([path]);
        for (const { publisher } of [...this.#publishers]) {
            if (publisher.paths.has(path)) {
                action(publisher, paths);
            }
        }
    }

    /**
     * Observe whether any of `paths` has at least one live listener. Derived from
     * the activation counts the funnel already keeps. It reports; it never starts
     * work of its own.
     */
    listen_demand(paths: ReadonlySet<FieldPath>, callback: (active: boolean) => void): Unsubscribe {
        const observer: DemandObserver = { paths, callback, active: this.#demand(paths) };
        this.#demandObservers.push(observer);
        this.#dispatch(callback, observer.active);

        let released = false;
        return () => {
            if (released) {
                return;
            }
            released = true;
            const index = this.#demandObservers.indexOf(observer);
            if (index !== -1) {
                this.#demandObservers.splice(index, 1);
            }
        };
    }

    #demand(paths: ReadonlySet<FieldPath>): boolean {
        return [...paths].some((path) => this.#listeners.get(path)?.length);
    }

    #notifyDemand(): void {
        for (const observer of [...this.#demandObservers]) {
            const active = this.#demand(observer.paths);
            if (active !== observer.active) {
                observer.active = active;
                this.#dispatch(observer.callback, active);
            }
        }
    }

    /** A listener's error stays with that listener: the rest still hear the value. */
    #dispatch<T>(callback: (value: T) => void, value: T): void {
        try {
            callback(value);
        } catch (error) {
            this.#logger?.debug(`observation funnel listener callback failed error=${errorText(error)}`);
        }
    }
}

// UNLOCKED is 0 and the enum has no proto3 presence, so every status broadcast
// reports a lock state and the funnel deduplicates the repeats.
//
// Only a locked state reads as locked; any unlocked state, however partial or
// selective, reads as unlocked.
export const LOCK_STATES: ReadonlyMap<number, boolean> = new Map([
    [VehicleLockStateE.VEHICLELOCKSTATE_LOCKED, true],
    [VehicleLockStateE.VEHICLELOCKSTATE_UNLOCKED, false],
    [VehicleLockStateE.VEHICLELOCKSTATE_INTERNAL_LOCKED, true],
    [VehicleLockStateE.VEHICLELOCKSTATE_SELECTIVE_UNLOCKED, false],
]);

// UNKNOWN and FAILED_UNLATCH are unmapped: reducing either to one boolean is
// unvalidated against live frames, and emitting nothing keeps the last confirmed
// value instead of guessing.
export const CLOSURE_STATES: ReadonlyMap<number, boolean> = new Map([
    [ClosureStateE.CLOSURESTATE_CLOSED, false],
    [ClosureStateE.CLOSURESTATE_OPEN, true],
    [ClosureStateE.CLOSURESTATE_AJAR, true],
    [ClosureStateE.CLOSURESTATE_OPENING, true],
    [ClosureStateE.CLOSURESTATE_CLOSING, true],
]);

/** `paths` of a passive publisher: every field. */
const ALL_PATHS: ReadonlySet<FieldPath> = new Set(Object.values(FieldPath));

const monotonicSeconds: Clock = () => performance.now() / 1000;

const ABSENT = Symbol("absent");

function isMapping(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A present leaf, or `ABSENT`: a missing key is not a null reading. */
function leaf(section: unknown, key: string): unknown {
    return isMapping(section) && Object.hasOwn(section, key) ? section[key] : ABSENT;
}

/** A value usable as a reading: a boolean, or null for an explicit "unavailable". */
function isReading(value: unknown): value is Value {
    return value === null || typeof value === "boolean";
}

/**
 * A source whose readings are handed to it as arguments. It holds no client,
 * session, endpoint, or callable able to obtain one, so nothing here can originate
 * a request, and activation subscribes to nothing.
 */
abstract class SuppliedPublisher<Input> implements Publisher {
    readonly #clock: Clock;
    #sink: ObservationSink | null = null;

    constructor(options: { clock?: Clock } = {}) {
        this.#clock = options.clock ?? monotonicSeconds;
    }

    get paths(): ReadonlySet<FieldPath> {
        return ALL_PATHS;
    }

    attach(sink: ObservationSink): Unsubscribe {
        this.#sink = sink;
        return () => {
            this.#sink = null;
        };
    }

    request(_paths: ReadonlySet<FieldPath>): void {}

    release(_paths: ReadonlySet<FieldPath>): void {}

    protected _publish(input: Input, observed_at: number | undefined): readonly Observation[] {
        const observations = this._translate(input, observed_at ?? this.#clock());
        const sink = this.#sink;
        if (sink !== null) {
            for (const observation of observations) {
                sink.publish(observation);
            }
        }
        return observations;
    }

    protected abstract _translate(input: Input, observed_at: number): Observation[];
}

/** Translates a caller-supplied `vehicle_data` result into observations. */
export class VehicleDataResultPublisher extends SuppliedPublisher<unknown> {
    /** Translate a supplied result and feed the audited leaves to the sink. */
    publish_result(result: unknown, options: { observed_at?: number } = {}): readonly Observation[] {
        return this._publish(result, options.observed_at);
    }

    protected _translate(result: unknown, observed_at: number): Observation[] {
        const response = leaf(result, "response");
        const payload = isMapping(response) ? response : result;
        const vehicle_state = leaf(payload, "vehicle_state");
        const charge_state = leaf(payload, "charge_state");
        const observations: Observation[] = [];

        // An explicit null is the vehicle reporting the field unavailable; an
        // absent or unrecognised leaf is no reading at all.
        const locked = leaf(vehicle_state, "locked");
        if (isReading(locked)) {
            observations.push({ path: FieldPath.LOCKED, value: locked, observed_at });
        }

        const charge_port = leaf(charge_state, "charge_port_door_open");
        if (isReading(charge_port)) {
            observations.push({ path: FieldPath.CHARGE_PORT_DOOR_OPEN, value: charge_port, observed_at });
        }

        // `ft` is an ajar/open code, and only 0 and 1 have a documented boolean
        // meaning. A boolean is not a code.
        const front_trunk = leaf(vehicle_state, "ft");
        if (front_trunk === null) {
            observations.push({ path: FieldPath.DOOR_STATE_TRUNK_FRONT, value: null, observed_at });
        } else if (front_trunk === 0 || front_trunk === 1) {
            observations.push({ path: FieldPath.DOOR_STATE_TRUNK_FRONT, value: front_trunk === 1, observed_at });
        }
        return observations;
    }
}

/**
 * `"true"` and `"false"` become real booleans; anything else passes through. Some
 * vehicles stream a boolean signal as that literal string even when the stream
 * prefers typed values.
 */
function coerceStreamBool(value: unknown): unknown {
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    return value;
}

/**
 * Translates a caller-supplied Teslemetry stream signal update into observations.
 * The update is keyed by signal name the way a stream push is (`Locked`,
 * `ChargePortDoorOpen`, `DoorState` with a nested `TrunkFront`). `@teslemetry/api`
 * owns the stream client; the two meet here.
 */
export class TeslemetryStreamPublisher extends SuppliedPublisher<unknown> {
    /** Translate a supplied stream signal update and feed it to the sink. */
    publish_update(data: unknown, options: { observed_at?: number } = {}): readonly Observation[] {
        return this._publish(data, options.observed_at);
    }

    protected _translate(data: unknown, observed_at: number): Observation[] {
        const observations: Observation[] = [];

        const locked = coerceStreamBool(leaf(data, "Locked"));
        if (isReading(locked)) {
            observations.push({ path: FieldPath.LOCKED, value: locked, observed_at });
        }

        const charge_port = coerceStreamBool(leaf(data, "ChargePortDoorOpen"));
        if (isReading(charge_port)) {
            observations.push({ path: FieldPath.CHARGE_PORT_DOOR_OPEN, value: charge_port, observed_at });
        }

        const door_state = leaf(data, "DoorState");
        if (door_state === null) {
            observations.push({ path: FieldPath.DOOR_STATE_TRUNK_FRONT, value: null, observed_at });
        } else if (isMapping(door_state)) {
            const trunk_front = coerceStreamBool(leaf(door_state, "TrunkFront"));
            if (isReading(trunk_front)) {
                observations.push({ path: FieldPath.DOOR_STATE_TRUNK_FRONT, value: trunk_front, observed_at });
            }
        }
        return observations;
    }
}
