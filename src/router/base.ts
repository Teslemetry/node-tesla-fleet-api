// Per-command failover across an ordered list of backends, ported from Python's
// `tesla_fleet_api/router/base.py`. `./router` imports `exceptions` only at run
// time: a backend the router must not load (Bluetooth, Powerwall) marks its own
// errors with `failover_safe`, and every backend is reached structurally.

import {
    BadGateway,
    BluetoothCloudUnavailableError,
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothTransportError,
    BluetoothUnconfirmedCommand,
    Forbidden,
    GatewayTimeout,
    InsufficientCredits,
    InternalServerError,
    InvalidScope,
    InvalidToken,
    KEY_REJECTED_FAULTS,
    LoginRequired,
    MissingToken,
    OAuthExpired,
    OAuthInvalid,
    PaymentRequired,
    RateLimited,
    ServiceUnavailable,
    SessionInfoAuthenticationFault,
    SignedCommandRequired,
    SigningDisabled,
    SubscriptionRequired,
    TeslaFleetConnectionError,
    TeslaFleetError,
    TeslaFleetMessageFaultFieldExceedsMTU,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
    VehicleOffline,
    VehicleSubscriptionRequired,
} from "../exceptions.js";
import type { Logger } from "../log.js";

// `_`-prefixed members are seams (`_send`, `_request`), and `then` would turn the
// router into a thenable, so neither is routed. These types and `methodNames`
// must agree.
type MethodKeys<B> = {
    [K in keyof B]-?: K extends `_${string}` | "then" ? never : B[K] extends (...args: never[]) => unknown ? K : never;
}[keyof B];
type AllMethodKeys<B> = B extends unknown ? MethodKeys<B> : never;
type MemberOf<B, K extends PropertyKey> = B extends { [P in K]: infer F } ? F : never;
type Asynced<F> = F extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;

/** Every method of the union `B`. A name on several members must satisfy all their signatures. */
export type Routed<B> = { [K in AllMethodKeys<B>]: Asynced<MemberOf<B, K>> };

/** A primary, a secondary, and any number of further backends, tried in order. */
export type Backends = readonly [object, object, ...object[]];

/**
 * Gates the primary. Omit it to attempt the primary directly and fail over on a
 * failover-safe error, with no up-front probe.
 */
export type HealthCheck = boolean | (() => boolean | Promise<boolean>);

/**
 * Called after every dispatched call. On failure, `error` is the thrown value
 * and the return decides whether failover continues, replacing
 * `is_failover_safe` in both directions; return `is_failover_safe(error)` to keep
 * the default policy. On success, `error` is `null` and the return is ignored.
 * A handler that throws propagates. `BluetoothUnconfirmedCommand` never gets here.
 */
export type ResultHandler = (error: unknown, backend: object, method: string) => boolean | Promise<boolean>;

export interface RouterOptions {
    health?: HealthCheck | null;
    on_result?: ResultHandler | null;
    /** Receives one `command= backend= result=` line per attempted backend. Silent by default. */
    logger?: Logger;
}

/**
 * Failures in one backend's own path, before the device judged the command, so
 * the next backend (a different path to the same device) may still succeed.
 * Anything else, typically the device answering and refusing, propagates: the
 * next backend reaches the same device and would get the same answer.
 */
export const FAILOVER_SAFE_ERRORS: readonly (abstract new (...args: never[]) => unknown)[] = [
    // No answer. `_request` wraps `fetch` rejections and timeouts in this; the
    // Bluetooth layer wraps raw GATT failures in BluetoothTransportError.
    TeslaFleetConnectionError,
    BluetoothTransportError,
    // A plain timeout comes from a read or a step before the write. The router
    // and `is_failover_safe` handle BluetoothUnconfirmedCommand before this list.
    BluetoothTimeout,
    // A state check proved the command did not apply.
    BluetoothCommandFailed,
    // Nothing was sent: a cloud call on a Bluetooth-only vehicle.
    BluetoothCloudUnavailableError,
    // The cloud service or its link to the device did not answer.
    VehicleOffline,
    RateLimited,
    InternalServerError,
    BadGateway,
    ServiceUnavailable,
    GatewayTimeout,
    // This backend's own credentials, session, account or path limits, which the
    // next backend does not share.
    ...KEY_REJECTED_FAULTS,
    SessionInfoAuthenticationFault,
    SigningDisabled,
    SignedCommandRequired,
    TeslaFleetMessageFaultFieldExceedsMTU,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
    InvalidToken,
    MissingToken,
    OAuthExpired,
    OAuthInvalid,
    LoginRequired,
    PaymentRequired,
    SubscriptionRequired,
    VehicleSubscriptionRequired,
    InsufficientCredits,
    Forbidden,
    InvalidScope,
];

/**
 * Whether a command that threw `error` may already have executed. The field
 * check is the one that matters across the dual-package hazard: a process that
 * loads this package through both `import` and `require` has two copies of the
 * class, and `instanceof` fails across them.
 */
function is_unconfirmed(error: unknown): boolean {
    return error instanceof BluetoothUnconfirmedCommand || (error as { unconfirmed?: unknown } | null | undefined)?.unconfirmed === true;
}

/**
 * Whether a call that threw `error` may be retried on the next backend. Accepts
 * any thrown value. A boolean `failover_safe` on the value decides for itself,
 * in both directions, which lets a backend the router cannot import mark its own
 * errors. Otherwise it is safe only as an instance of `FAILOVER_SAFE_ERRORS`.
 *
 * An unconfirmed command is never safe, whatever it is marked. Python's
 * `is_failover_safe` answers true for it (it subclasses `BluetoothTimeout`) and
 * relies on the router checking first; here the predicate is safe to use alone.
 */
export function is_failover_safe(error: unknown): boolean {
    if (is_unconfirmed(error)) {
        return false;
    }
    const marker = (error as { failover_safe?: unknown } | null | undefined)?.failover_safe;
    if (typeof marker === "boolean") {
        return marker;
    }
    return FAILOVER_SAFE_ERRORS.some((cls) => error instanceof cls);
}

/**
 * The names `backend` routes: plain function properties, own or inherited, up
 * to `Object.prototype`. The most-derived property of a name decides, so a
 * subclass that shadows a method with a getter or a value stops it routing.
 * Getters are never invoked, and symbol keys (`Symbol.asyncDispose`) are not
 * seen, so a context manager is not proxied.
 */
function methodNames(backend: object): Set<string> {
    const names = new Set<string>();
    const seen = new Set<string>();
    for (let target: object | null = backend; target !== null && target !== Object.prototype; target = Object.getPrototypeOf(target)) {
        for (const name of Object.getOwnPropertyNames(target)) {
            if (seen.has(name)) {
                continue;
            }
            seen.add(name);
            if (name === "constructor" || name === "then" || name.startsWith("_")) {
                continue;
            }
            if (typeof Object.getOwnPropertyDescriptor(target, name)?.value === "function") {
                names.add(name);
            }
        }
    }
    return names;
}

/**
 * A `TeslaFleetError`'s message is its class's, so it is safe to log. Anything
 * else may hold a secret, so only its type is logged (see `src/log.ts`).
 */
function errorText(error: unknown): string {
    if (error instanceof TeslaFleetError) {
        return `${error.name}: ${error.message}`;
    }
    return error instanceof Error ? error.name : typeof error;
}

/**
 * Routes calls across an ordered list of backends, trying each in order.
 *
 * Use {@link VehicleRouter} or `EnergySiteRouter`, which type the routed
 * methods. Methods are derived from the backends' prototypes at construction, so
 * a new backend method is routed with no change here. A name on no backend does
 * not exist. A backend without the method is skipped. A method added to a backend
 * after construction is not routed.
 *
 * Each call is attempted on the backends that have the method. If one throws a
 * value `is_failover_safe` accepts, the same call is retried on the next with
 * the same arguments. Anything else propagates at once. When every backend fails
 * over, the last thrown value is rethrown unchanged, even if it is not an `Error`.
 *
 * **Warning:** a failed call is replayed on the next backend, so a non-idempotent
 * command (`honk_horn`, `actuate_trunk`, `door_unlock`, `charge_start`) that fails
 * mid-flight, after a backend may have partly applied it, can be double-executed,
 * or executed more than once across a longer chain. This is the accepted tradeoff
 * of per-command failover. Callers that need exactly-once semantics gate dispatch
 * with a health check or call a backend directly.
 *
 * `BluetoothUnconfirmedCommand` is the exception. The command may already have
 * executed, so it propagates at once on any backend in the chain, is never
 * replayed, and never reaches `on_result`.
 *
 * The health check gates the first backend only: when it is false the primary is
 * skipped and the call routes to the rest. There is deliberately no per-backend
 * health matrix.
 *
 * Plain attributes are not routed; read them from `primary` or `backends`. A
 * backend's connection lifecycle is not proxied either.
 *
 * TS `private` methods exist at run time, so they are installed too: the types
 * hide them. `#private` members are unreachable, which keeps a signing key off
 * the router as it is off the backend.
 */
export class Router<Bs extends Backends> {
    readonly backends: Bs;
    #health?: HealthCheck | null;
    #on_result?: ResultHandler | null;
    #logger?: Logger;

    constructor(backends: Bs, options: RouterOptions = {}) {
        if (backends.length < 2) {
            throw new TypeError("A router needs a primary and a secondary backend.");
        }
        this.backends = Object.freeze([...backends]) as unknown as Bs;
        this.#health = options.health;
        this.#on_result = options.on_result;
        this.#logger = options.logger;

        const targets = new Map<string, object[]>();
        for (const backend of backends) {
            for (const name of methodNames(backend)) {
                targets.set(name, [...(targets.get(name) ?? []), backend]);
            }
        }
        for (const [name, having] of targets) {
            // The router's own members win, as they do in Python.
            if (name in this) {
                continue;
            }
            Object.defineProperty(this, name, { value: (...args: unknown[]) => this.#dispatch(name, having, args) });
        }
    }

    /** The first backend, tried first when healthy. */
    get primary(): Bs[0] {
        return this.backends[0];
    }

    /** The second backend, tried when the primary is unhealthy or fails. */
    get secondary(): Bs[1] {
        return this.backends[1];
    }

    /** Resolve the health check. With none configured this reports `true`. */
    async is_healthy(): Promise<boolean> {
        const health = this.#health;
        if (health == null) {
            return true;
        }
        if (typeof health === "boolean") {
            return health;
        }
        return Boolean(await health());
    }

    /** The `key=value` log field naming a backend. */
    protected _backend_field(backend: object): string {
        return `backend=${backend.constructor?.name ?? "Object"}`;
    }

    /** `name` on the first backend that has it, for a plain attribute getter. */
    protected _first_attribute<K extends string>(name: K): MemberOf<Bs[number], K> {
        const backend = this.backends.find((candidate) => name in candidate);
        return (backend as Record<string, any> | undefined)?.[name];
    }

    async #dispatch(name: string, targets: readonly object[], args: unknown[]): Promise<unknown> {
        let start = 0;
        // The health check gates only the primary, and only when there is another
        // backend to route to. `targets[0]` is the primary iff the primary has
        // this method.
        if (this.#health != null && targets.length > 1 && targets[0] === this.backends[0] && !(await this.is_healthy())) {
            start = 1;
        }

        let last: unknown;
        for (const backend of targets.slice(start)) {
            const field = this._backend_field(backend);
            let result: unknown;
            try {
                result = await (backend as Record<string, any>)[name](...args);
            } catch (error) {
                // The command may already have executed on this backend. Replaying
                // it on the next risks double-executing it, so this comes before
                // the handler and the policy.
                if (is_unconfirmed(error)) {
                    this.#logger?.debug(`command=${name} ${field} result=unconfirmed error=${errorText(error)}`);
                    throw error;
                }
                last = error;
                this.#logger?.debug(`command=${name} ${field} result=error error=${errorText(error)}`);
                const fail_over = this.#on_result ? await this.#on_result(error, backend, name) : is_failover_safe(error);
                if (!fail_over) {
                    throw error;
                }
                continue;
            }
            this.#logger?.debug(`command=${name} ${field} result=success`);
            // Outside the `try`: a handler that throws here must not read as a
            // backend failure, because the command has already succeeded.
            await this.#on_result?.(null, backend, name);
            return result;
        }
        // The loop runs at least once (`start` only passes the primary when a
        // later backend remains), so every applicable backend threw. `last` may
        // be any thrown value, including `undefined`.
        throw last;
    }
}

class VehicleRouterBase<Bs extends Backends> extends Router<Bs> {
    /** The VIN of the first backend that has one. */
    get vin(): MemberOf<Bs[number], "vin"> {
        return this._first_attribute("vin");
    }
}

/**
 * A router over vehicles, typically a Bluetooth primary and a cloud fallback.
 * See {@link Router} for dispatch, failover and the replay warning.
 *
 * A same-named method must accept the caller's arguments on every backend that
 * has it, or the call does not compile: Python only fails at run time. Where two
 * backends legitimately differ, call `router.primary.x()`.
 */
export type VehicleRouter<Bs extends Backends> = VehicleRouterBase<Bs> & Routed<Bs[number]>;
export const VehicleRouter = VehicleRouterBase as unknown as new <const Bs extends Backends>(
    backends: Bs,
    options?: RouterOptions,
) => VehicleRouter<Bs>;
