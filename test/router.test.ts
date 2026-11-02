// Behaviour specs ported from Python's `tests/test_router.py` and
// `tests/test_ble_write_timeout_router.py`, plus one test for each row of the
// rule tables in design document 02, section 2.
import { readdirSync, readFileSync } from "node:fs";
import { inspect } from "node:util";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { describe, expect, it, vi } from "vitest";
import {
    BadGateway,
    BluetoothCloudUnavailableError,
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothTransportError,
    BluetoothUnconfirmedCommand,
    CouldNotRetrieveKeyFault,
    DeviceUnexpectedResponse,
    EnergyGatewayUnreachable,
    Forbidden,
    GatewayTimeout,
    InsufficientCredits,
    InternalServerError,
    InvalidCommand,
    InvalidScope,
    InvalidTeslemetryToken,
    InvalidToken,
    LoginRequired,
    MissingToken,
    NotOnWhitelistFault,
    OAuthExpired,
    OAuthInvalid,
    PaymentRequired,
    RateLimited,
    ServiceUnavailable,
    SessionInfoAuthenticationFault,
    SignedCommandRequired,
    SignedMessageInformationFaultCouldNotRetrieveKey,
    SignedMessageInformationFaultNotOnWhitelist,
    SigningDisabled,
    SubscriptionRequired,
    TeslaFleetConnectionError,
    TeslaFleetMessageFaultFieldExceedsMTU,
    TeslaFleetMessageFaultInactiveKey,
    TeslaFleetMessageFaultInvalidCommand,
    TeslaFleetMessageFaultInvalidKeyHandle,
    TeslaFleetMessageFaultKeychainIsFull,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
    TeslaFleetMessageFaultUnknownKeyId,
    VehicleOffline,
    VehicleSubscriptionRequired,
} from "../src/exceptions.js";
import { FAILOVER_SAFE_ERRORS, Router, VehicleRouter, is_failover_safe } from "../src/router/index.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import Vehicle from "../src/vehicle.js";
import VehicleSigned from "../src/vehiclesigned.js";
import { FakeVehicle } from "./helpers/fakevehicle.js";

class FakePrimary {
    readonly vin = "PRIMARY_VIN";
    shared_calls = 0;
    constructor(private readonly error?: { value: unknown }) {}

    async shared(value: number): Promise<string> {
        this.shared_calls += 1;
        if (this.error) {
            throw this.error.value;
        }
        return `primary:${value}`;
    }

    async primary_only(): Promise<string> {
        return "primary_only";
    }
}

class FakeFallback {
    readonly vin = "FALLBACK_VIN";
    shared_calls = 0;
    constructor(private readonly error?: { value: unknown }) {}

    async shared(value: number): Promise<string> {
        this.shared_calls += 1;
        if (this.error) {
            throw this.error.value;
        }
        return `fallback:${value}`;
    }

    async fallback_only(): Promise<string> {
        return "fallback_only";
    }
}

// Rest arguments, because `undefined` is a thrown value under test here, not "use the default".
const failing = (...thrown: [unknown?]) => new FakePrimary({ value: thrown.length ? thrown[0] : new TeslaFleetConnectionError() });
const failingFallback = (...thrown: [unknown?]) => new FakeFallback({ value: thrown.length ? thrown[0] : new TeslaFleetConnectionError() });

/** A generic backend for N-way chains. `has: false` leaves `cmd` off it entirely. */
function backend(tag: string, options: { error?: unknown; has?: boolean } = {}) {
    const state = {
        tag,
        calls: 0,
        ...(options.has === false
            ? {}
            : {
                  cmd: async (value: number) => {
                      state.calls += 1;
                      if ("error" in options) {
                          throw options.error;
                      }
                      return `${tag}:${value}`;
                  },
              }),
    };
    return state as { tag: string; calls: number; cmd: (value: number) => Promise<string> };
}

describe("VehicleRouter: routing", () => {
    it("routes to the primary when it succeeds", async () => {
        const primary = new FakePrimary();
        const fallback = new FakeFallback();
        const router = new VehicleRouter([primary, fallback]);

        await expect(router.shared(7)).resolves.toBe("primary:7");
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 0]);
    });

    it("falls back with the same arguments", async () => {
        const primary = failing();
        const fallback = new FakeFallback();
        const router = new VehicleRouter([primary, fallback]);

        await expect(router.shared(9)).resolves.toBe("fallback:9");
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 1]);
    });

    it("raises the last error when both fail", async () => {
        const last = new TeslaFleetConnectionError("second");
        const primary = failing();
        const fallback = failingFallback(last);
        const router = new VehicleRouter([primary, fallback]);

        await expect(router.shared(1)).rejects.toBe(last);
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 1]);
    });

    it("skips a backend without the method", async () => {
        const router = new VehicleRouter([new FakePrimary(), new FakeFallback()]);
        await expect(router.fallback_only()).resolves.toBe("fallback_only");
        await expect(router.primary_only()).resolves.toBe("primary_only");
    });

    it("gives a plain JS caller a TypeError for a method on no backend", () => {
        const router = new VehicleRouter([new FakePrimary(), new FakeFallback()]) as unknown as { nope: () => void; other: unknown };
        expect(router.other).toBeUndefined();
        expect(() => router.nope()).toThrow(TypeError);
    });

    it("resolves `vin` to the first backend that has it", () => {
        expect(new VehicleRouter([new FakePrimary(), new FakeFallback()]).vin).toBe("PRIMARY_VIN");
        expect(new VehicleRouter([{}, new FakeFallback()]).vin).toBe("FALLBACK_VIN");
    });

    it("exposes the chain", () => {
        const primary = new FakePrimary();
        const fallback = new FakeFallback();
        const third = {};
        const router = new VehicleRouter([primary, fallback, third]);

        expect(router.primary).toBe(primary);
        expect(router.secondary).toBe(fallback);
        expect(router.backends).toEqual([primary, fallback, third]);
    });

    it("needs a secondary, as Python's signature does", () => {
        expect(() => new VehicleRouter([new FakePrimary()] as never)).toThrow(TypeError);
    });

    it("makes every routed call async, even a synchronous method that throws", async () => {
        const unsubscribe = () => undefined;
        const router = new VehicleRouter([
            {
                listen_gear: () => unsubscribe,
                bad: () => {
                    throw new InvalidCommand();
                },
            },
            {},
        ]);

        const listening = router.listen_gear();
        expect(listening).toBeInstanceOf(Promise);
        await expect(listening).resolves.toBe(unsubscribe);
        const bad = router.bad();
        expect(bad).toBeInstanceOf(Promise);
        await expect(bad).rejects.toBeInstanceOf(InvalidCommand);
    });

    it("calls a backend method with the backend as `this`", async () => {
        class Bound {
            #secret = "bound";
            read = async () => this.#secret;
            async method() {
                return this.#secret;
            }
        }
        const router = new VehicleRouter([new Bound(), {}]);
        await expect(router.method()).resolves.toBe("bound");
        await expect(router.read()).resolves.toBe("bound");
    });
});

describe("Router: the facade", () => {
    class Base {
        inherited() {
            return "inherited";
        }
        shadowed() {
            return "base";
        }
        get getter() {
            return () => "getter";
        }
        hidden_by_value() {
            return "base";
        }
    }
    class Derived extends Base {
        override shadowed() {
            return "derived";
        }
        own() {
            return "own";
        }
        _seam() {
            return "seam";
        }
        get method_turned_getter() {
            throw new Error("a getter must never be invoked");
        }
    }

    it("awaits to the router itself, and enumerates only `backends`", async () => {
        const router = new VehicleRouter([new Derived(), new FakeFallback()]);
        await expect((async () => router)()).resolves.toBe(router);
        expect(Object.keys(router)).toEqual(["backends"]);
    });

    it("stays awaitable when a backend has a `then` method", async () => {
        const router = new VehicleRouter([{ then: () => "thenable" }, {}]);
        const awaited = await router;
        expect(awaited).toBe(router);
    });

    it("walks the prototype chain and keeps own function properties", async () => {
        const router = new VehicleRouter([new Derived(), { field: () => "field" }]);
        await expect(router.inherited()).resolves.toBe("inherited");
        await expect(router.shadowed()).resolves.toBe("derived");
        await expect(router.own()).resolves.toBe("own");
        await expect(router.field()).resolves.toBe("field");
    });

    it("skips getters without invoking them, `_` names and `constructor`", () => {
        const router = new VehicleRouter([new Derived(), {}]) as unknown as Record<string, unknown>;
        expect(Object.getOwnPropertyNames(router)).not.toContain("getter");
        expect(router.method_turned_getter).toBeUndefined();
        expect(router._seam).toBeUndefined();
        expect(router.constructor).not.toBe(Derived);
    });

    it("lets a subclass stop a method routing by shadowing it", async () => {
        class Omits extends Base {
            override get hidden_by_value(): never {
                throw new Error("must not be invoked");
            }
        }
        const fallback = { hidden_by_value: async () => "fallback" };
        const router = new VehicleRouter([new Omits(), fallback]) as unknown as { hidden_by_value: () => Promise<string> };
        await expect(router.hidden_by_value()).resolves.toBe("fallback");
    });

    it("does not proxy a context manager", () => {
        class Connected {
            async [Symbol.asyncDispose]() {}
        }
        const router = new VehicleRouter([new Connected(), new Connected()]);
        expect(Symbol.asyncDispose in router).toBe(false);
    });

    it("keeps its own members over a backend's", async () => {
        const backends = [{ primary: () => "routed", is_healthy: () => false, toString: () => "routed" }, {}] as const;
        const router = new VehicleRouter(backends);
        expect(router.primary).toBe(backends[0]);
        await expect(router.is_healthy()).resolves.toBe(true);
        expect(`${router}`).toBe("[object Object]");
    });

    it("has a usable untyped base class", async () => {
        const router = new Router([new FakePrimary(), new FakeFallback()]) as unknown as Router<[object, object]> & {
            shared(value: number): Promise<string>;
        };
        await expect(router.shared(1)).resolves.toBe("primary:1");
    });

    it("freezes its chain", () => {
        const router = new VehicleRouter([{}, {}]);
        expect(() => (router.backends as unknown as object[]).push({})).toThrow(TypeError);
    });
});

describe("BluetoothUnconfirmedCommand", () => {
    class ForeignCopy extends Error {
        // The class from the other half of the dual package: same field, unrelated prototype.
        readonly unconfirmed = true;
    }
    const FORMS: readonly (readonly [string, () => unknown])[] = [
        ["this package's class", () => new BluetoothUnconfirmedCommand()],
        ["a subclass", () => new (class extends BluetoothUnconfirmedCommand {})()],
        ["another copy of the class", () => new ForeignCopy()],
        ["a plain object with the field", () => ({ unconfirmed: true })],
        ["a value that claims to be failover-safe", () => Object.assign(new BluetoothUnconfirmedCommand(), { failover_safe: true })],
        ["a foreign value that claims to be failover-safe", () => ({ unconfirmed: true, failover_safe: true })],
    ];

    it.each(FORMS)("stops the chain without the handler: %s", async (_name, make) => {
        const error = make();
        const on_result = vi.fn(() => true);
        const primary = failing(error);
        const fallback = new FakeFallback();
        const router = new VehicleRouter([primary, fallback], { on_result });

        await expect(router.shared(10)).rejects.toBe(error);
        expect(primary.shared_calls).toBe(1);
        expect(fallback.shared_calls).toBe(0);
        expect(on_result).not.toHaveBeenCalled();
    });

    it.each(FORMS)("stops the chain with no handler: %s", async (_name, make) => {
        const error = make();
        const fallback = new FakeFallback();
        const router = new VehicleRouter([failing(error), fallback]);

        await expect(router.shared(10)).rejects.toBe(error);
        expect(fallback.shared_calls).toBe(0);
    });

    it.each(FORMS)("stops at a middle backend: %s", async (_name, make) => {
        const error = make();
        const a = backend("a", { error: new TeslaFleetConnectionError() });
        const b = backend("b", { error });
        const c = backend("c");
        const seen: unknown[] = [];
        const router = new VehicleRouter([a, b, c], {
            on_result: (thrown) => {
                seen.push(thrown);
                return true;
            },
        });

        await expect(router.cmd(9)).rejects.toBe(error);
        expect([a.calls, b.calls, c.calls]).toEqual([1, 1, 0]);
        expect(seen).toHaveLength(1);
        expect(seen[0]).toBeInstanceOf(TeslaFleetConnectionError);
    });

    it.each(FORMS)("stops on the last backend without the handler: %s", async (_name, make) => {
        const error = make();
        const on_result = vi.fn(() => true);
        const router = new VehicleRouter([failing(), failingFallback(error)], { on_result });

        await expect(router.shared(1)).rejects.toBe(error);
        expect(on_result).toHaveBeenCalledTimes(1);
    });

    it.each(FORMS)("is never failover-safe, whatever it claims: %s", (_name, make) => {
        expect(is_failover_safe(make())).toBe(false);
    });

    it("needs the field to be exactly true", async () => {
        const error = Object.assign(new TeslaFleetConnectionError(), { unconfirmed: false });
        const fallback = new FakeFallback();
        await expect(new VehicleRouter([failing(error), fallback]).shared(1)).resolves.toBe("fallback:1");
    });

    it("stays distinct from a plain timeout, which fails over", async () => {
        const fallback = new FakeFallback();
        const router = new VehicleRouter([failing(new BluetoothTimeout()), fallback]);
        await expect(router.shared(11)).resolves.toBe("fallback:11");
    });

    it("stays distinct from a proven failure, which fails over", async () => {
        const fallback = new FakeFallback();
        const router = new VehicleRouter([failing(new BluetoothCommandFailed()), fallback]);
        await expect(router.shared(13)).resolves.toBe("fallback:13");
    });
});

describe("Health check", () => {
    it("attempts the primary when true", async () => {
        const primary = new FakePrimary();
        const fallback = new FakeFallback();
        await expect(new VehicleRouter([primary, fallback], { health: true }).shared(1)).resolves.toBe("primary:1");
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 0]);
    });

    it("still fails over when true and the primary throws", async () => {
        const primary = failing();
        const fallback = new FakeFallback();
        await expect(new VehicleRouter([primary, fallback], { health: true }).shared(2)).resolves.toBe("fallback:2");
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 1]);
    });

    it("skips the primary entirely when false", async () => {
        const primary = new FakePrimary();
        await expect(new VehicleRouter([primary, new FakeFallback()], { health: false }).shared(3)).resolves.toBe("fallback:3");
        expect(primary.shared_calls).toBe(0);
    });

    it("re-evaluates a sync callable on each call", async () => {
        const state = { healthy: false };
        const router = new VehicleRouter([new FakePrimary(), new FakeFallback()], { health: () => state.healthy });

        await expect(router.shared(4)).resolves.toBe("fallback:4");
        state.healthy = true;
        await expect(router.shared(5)).resolves.toBe("primary:5");
    });

    it("awaits an async callable", async () => {
        const primary = new FakePrimary();
        const router = new VehicleRouter([primary, new FakeFallback()], { health: async () => false });

        await expect(router.shared(6)).resolves.toBe("fallback:6");
        expect(primary.shared_calls).toBe(0);
    });

    it("is not probed for a method only the primary has", async () => {
        const health = vi.fn(() => false);
        const router = new VehicleRouter([new FakePrimary(), new FakeFallback()], { health });

        await expect(router.primary_only()).resolves.toBe("primary_only");
        expect(health).not.toHaveBeenCalled();
    });

    it("is not probed when the primary lacks the method", async () => {
        const health = vi.fn(() => false);
        const a = backend("a", { has: false });
        const b = backend("b", { error: new TeslaFleetConnectionError() });
        const c = backend("c");

        await expect(new VehicleRouter([a, b, c], { health }).cmd(1)).resolves.toBe("c:1");
        expect(health).not.toHaveBeenCalled();
        expect(b.calls).toBe(1);
    });

    it("gates only the primary in a longer chain", async () => {
        const a = backend("a");
        const b = backend("b", { error: new TeslaFleetConnectionError() });
        const c = backend("c");

        await expect(new VehicleRouter([a, b, c], { health: false }).cmd(5)).resolves.toBe("c:5");
        expect([a.calls, b.calls, c.calls]).toEqual([0, 1, 1]);
    });

    it("reports through is_healthy, true when unconfigured", async () => {
        await expect(new VehicleRouter([{}, {}]).is_healthy()).resolves.toBe(true);
        await expect(new VehicleRouter([{}, {}], { health: false }).is_healthy()).resolves.toBe(false);
        await expect(new VehicleRouter([{}, {}], { health: async () => false }).is_healthy()).resolves.toBe(false);
    });

    it("propagates a health check that throws", async () => {
        const boom = new Error("probe failed");
        const health = () => {
            throw boom;
        };
        await expect(new VehicleRouter([new FakePrimary(), new FakeFallback()], { health }).shared(1)).rejects.toBe(boom);
    });
});

describe("on_result", () => {
    it("receives the error, backend and name on failure, then null on success", async () => {
        const error = new TeslaFleetConnectionError();
        const primary = failing(error);
        const fallback = new FakeFallback();
        const calls: unknown[][] = [];
        const router = new VehicleRouter([primary, fallback], {
            on_result: (...args) => {
                calls.push(args);
                return true;
            },
        });

        await expect(router.shared(8)).resolves.toBe("fallback:8");
        expect(calls).toEqual([
            [error, primary, "shared"],
            [null, fallback, "shared"],
        ]);
        expect(calls[0][1]).toBe(primary);
    });

    it("is called with null on a primary success, and its return is ignored", async () => {
        const primary = new FakePrimary();
        const on_result = vi.fn(() => false);
        const router = new VehicleRouter([primary, new FakeFallback()], { on_result });

        await expect(router.shared(7)).resolves.toBe("primary:7");
        expect(on_result.mock.calls).toEqual([[null, primary, "shared"]]);
    });

    it("continues to the next backend when it returns true", async () => {
        const primary = failing();
        const fallback = new FakeFallback();
        await expect(new VehicleRouter([primary, fallback], { on_result: () => true }).shared(2)).resolves.toBe("fallback:2");
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 1]);
    });

    it("rethrows and skips the rest when it returns false", async () => {
        const error = new TeslaFleetConnectionError();
        const fallback = new FakeFallback();
        await expect(new VehicleRouter([failing(error), fallback], { on_result: () => false }).shared(3)).rejects.toBe(error);
        expect(fallback.shared_calls).toBe(0);
    });

    it("is awaited", async () => {
        const fallback = new FakeFallback();
        await expect(new VehicleRouter([failing(), fallback], { on_result: async () => false }).shared(4)).rejects.toBeInstanceOf(
            TeslaFleetConnectionError,
        );
        expect(fallback.shared_calls).toBe(0);
    });

    it("overrides a rejection in the other direction", async () => {
        const fallback = new FakeFallback();
        const router = new VehicleRouter([failing(new InvalidCommand()), fallback], { on_result: () => true });
        await expect(router.shared(2)).resolves.toBe("fallback:2");
    });

    it("can keep the default policy", async () => {
        const seen: unknown[] = [];
        const on_result = (error: unknown) => {
            seen.push(error);
            return error === null || is_failover_safe(error);
        };
        const rejected = new InvalidCommand();
        await expect(new VehicleRouter([failing(rejected), new FakeFallback()], { on_result }).shared(4)).rejects.toBe(rejected);

        await expect(new VehicleRouter([failing(), new FakeFallback()], { on_result }).shared(5)).resolves.toBe("fallback:5");
        expect(seen[0]).toBe(rejected);
        expect(seen[1]).toBeInstanceOf(TeslaFleetConnectionError);
        expect(seen[2]).toBeNull();
    });

    it("propagates its own error on failure, without trying the next backend", async () => {
        const own = new Error("handler failed");
        const fallback = new FakeFallback();
        const on_result = () => {
            throw own;
        };
        await expect(new VehicleRouter([failing(), fallback], { on_result }).shared(1)).rejects.toBe(own);
        expect(fallback.shared_calls).toBe(0);
    });

    it("propagates its own error on success, without replaying the command", async () => {
        const own = new TeslaFleetConnectionError();
        const primary = new FakePrimary();
        const fallback = new FakeFallback();
        const on_result = async (error: unknown) => {
            if (error === null) {
                throw own;
            }
            return true;
        };

        await expect(new VehicleRouter([primary, fallback], { on_result }).shared(1)).rejects.toBe(own);
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 0]);
    });
});

describe("Failover policy", () => {
    class GatewayRejected extends Error {}
    class GatewayUnreachable extends Error {
        readonly failover_safe = true;
    }
    class RejectedConnection extends TeslaFleetConnectionError {
        readonly failover_safe = false;
    }

    const SAFE: readonly unknown[] = [
        new TeslaFleetConnectionError(),
        new BluetoothTransportError(),
        new BluetoothTimeout(),
        new BluetoothCommandFailed(),
        new BluetoothCloudUnavailableError(),
        new VehicleOffline(),
        new RateLimited(),
        new InternalServerError(),
        new BadGateway(),
        new ServiceUnavailable(),
        new GatewayTimeout(),
        new EnergyGatewayUnreachable(),
        new NotOnWhitelistFault(),
        new CouldNotRetrieveKeyFault(),
        new SignedMessageInformationFaultNotOnWhitelist(),
        new SignedMessageInformationFaultCouldNotRetrieveKey(),
        new TeslaFleetMessageFaultUnknownKeyId(),
        new TeslaFleetMessageFaultInactiveKey(),
        new TeslaFleetMessageFaultInvalidKeyHandle(),
        new SessionInfoAuthenticationFault(),
        new SigningDisabled(),
        new SignedCommandRequired(),
        new TeslaFleetMessageFaultFieldExceedsMTU(),
        new TeslaFleetMessageFaultResponseSizeExceedsMTU(),
        new InvalidToken(),
        new InvalidTeslemetryToken(),
        new MissingToken(),
        new OAuthExpired(),
        new OAuthInvalid(),
        new LoginRequired(),
        new PaymentRequired(),
        new SubscriptionRequired(),
        new VehicleSubscriptionRequired(),
        new InsufficientCredits(),
        new Forbidden(),
        new InvalidScope(),
        new GatewayUnreachable("local gateway unavailable"),
        { failover_safe: true },
        Object.assign(() => undefined, { failover_safe: true }),
    ];
    const REJECTED: readonly unknown[] = [
        new InvalidCommand(),
        new TeslaFleetMessageFaultInvalidCommand(),
        new TeslaFleetMessageFaultKeychainIsFull(),
        new DeviceUnexpectedResponse(),
        new TypeError("bad argument"),
        new Error("connect ECONNREFUSED"),
        new DOMException("cancelled", "AbortError"),
        new GatewayRejected("gateway rejected battery dispatch"),
        new RejectedConnection(),
        Object.assign(new RateLimited(), { failover_safe: false }),
        { failover_safe: false },
        { failover_safe: "true" },
        {},
        "a string",
        42,
        true,
        null,
        undefined,
    ];

    it.each(SAFE.map((error) => [error]))("fails over on %s", async (error) => {
        expect(is_failover_safe(error)).toBe(true);
        const primary = failing(error);
        const fallback = new FakeFallback();

        await expect(new VehicleRouter([primary, fallback]).shared(1)).resolves.toBe("fallback:1");
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 1]);
    });

    it.each(REJECTED.map((error) => [error]))("does not fail over on %s", async (error) => {
        expect(is_failover_safe(error)).toBe(false);
        const primary = failing(error);
        const fallback = new FakeFallback();

        await expect(new VehicleRouter([primary, fallback]).shared(1)).rejects.toBe(error);
        expect([primary.shared_calls, fallback.shared_calls]).toEqual([1, 0]);
    });

    it("lists no class that a marker has to override by accident", () => {
        expect(FAILOVER_SAFE_ERRORS).not.toContain(BluetoothUnconfirmedCommand);
        expect(FAILOVER_SAFE_ERRORS).not.toContain(TeslaFleetMessageFaultKeychainIsFull);
    });

    it("reads a marker inherited from a prototype, as Python reads a class attribute", () => {
        class Marked {}
        (Marked.prototype as { failover_safe?: boolean }).failover_safe = true;
        expect(is_failover_safe(new Marked())).toBe(true);
    });

    it("stops the chain at a middle backend's rejection", async () => {
        const a = backend("a", { error: new TeslaFleetConnectionError() });
        const b = backend("b", { error: new InvalidCommand() });
        const c = backend("c");

        await expect(new VehicleRouter([a, b, c]).cmd(1)).rejects.toBeInstanceOf(InvalidCommand);
        expect([a.calls, b.calls, c.calls]).toEqual([1, 1, 0]);
    });

    it.each([[{ reason: "nope", failover_safe: true }], ["an HTML page"], [404], [null], [undefined]])(
        "rethrows the last backend's %s as the same value",
        async (error) => {
            const router = new VehicleRouter([failing({ failover_safe: true }), failingFallback(error)]);
            await expect(router.shared(1)).rejects.toBe(error);
        },
    );
});

describe("N-way chains", () => {
    it("routes to the first", async () => {
        const [a, b, c] = [backend("a"), backend("b"), backend("c")];
        await expect(new VehicleRouter([a, b, c]).cmd(1)).resolves.toBe("a:1");
        expect([a.calls, b.calls, c.calls]).toEqual([1, 0, 0]);
    });

    it("skips a backend missing the method", async () => {
        const a = backend("a", { error: new TeslaFleetConnectionError() });
        const b = backend("b", { has: false });
        const c = backend("c");
        await expect(new VehicleRouter([a, b, c]).cmd(2)).resolves.toBe("c:2");
        expect([a.calls, b.calls, c.calls]).toEqual([1, 0, 1]);
    });

    it("fails over through several to the last", async () => {
        const a = backend("a", { error: new TeslaFleetConnectionError() });
        const b = backend("b", { error: new TeslaFleetConnectionError() });
        const c = backend("c");
        await expect(new VehicleRouter([a, b, c]).cmd(3)).resolves.toBe("c:3");
        expect([a.calls, b.calls, c.calls]).toEqual([1, 1, 1]);
    });

    it("raises the last error when all fail", async () => {
        const last = new TeslaFleetConnectionError("c failed");
        const a = backend("a", { error: new TeslaFleetConnectionError() });
        const b = backend("b", { error: new TeslaFleetConnectionError() });
        const c = backend("c", { error: last });
        await expect(new VehicleRouter([a, b, c]).cmd(4)).rejects.toBe(last);
        expect([a.calls, b.calls, c.calls]).toEqual([1, 1, 1]);
    });

    it("has no method that no backend has", () => {
        const router = new VehicleRouter([backend("a", { has: false }), backend("b", { has: false })]) as unknown as { cmd?: unknown };
        expect(router.cmd).toBeUndefined();
    });
});

describe("Double execution", () => {
    it("replays a mid-flight failure, as the class comment warns", async () => {
        const executed: string[] = [];
        const router = new VehicleRouter([
            {
                honk_horn: async () => {
                    executed.push("primary");
                    throw new TeslaFleetConnectionError();
                },
            },
            {
                honk_horn: async () => {
                    executed.push("secondary");
                },
            },
        ]);

        await router.honk_horn();
        expect(executed).toEqual(["primary", "secondary"]);
    });
});

describe("Logging", () => {
    it("logs one line per attempted backend", async () => {
        const logger = { debug: vi.fn() };
        const router = new VehicleRouter([failing(), new FakeFallback()], { logger });

        await router.shared(1);

        expect(logger.debug.mock.calls).toEqual([
            ["command=shared backend=FakePrimary result=error error=TeslaFleetConnectionError: Could not connect to the API."],
            ["command=shared backend=FakeFallback result=success"],
        ]);
    });

    it("logs an unconfirmed command as unconfirmed", async () => {
        const logger = { debug: vi.fn() };
        const router = new VehicleRouter([failing(new BluetoothUnconfirmedCommand()), new FakeFallback()], { logger });

        await expect(router.shared(1)).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug.mock.calls[0][0]).toMatch(/^command=shared backend=FakePrimary result=unconfirmed error=BluetoothUnconfirmedCommand: /);
    });

    it("keeps a foreign error's message out of the log, because it may hold a secret", async () => {
        const logger = { debug: vi.fn() };
        const router = new VehicleRouter([failing(new TypeError("token=abc123")), new FakeFallback()], { logger });

        await expect(router.shared(1)).rejects.toBeInstanceOf(TypeError);

        expect(logger.debug.mock.calls).toEqual([["command=shared backend=FakePrimary result=error error=TypeError"]]);
    });

    it("is silent by default", async () => {
        const debug = vi.spyOn(console, "debug");
        await new VehicleRouter([new FakePrimary(), new FakeFallback()]).shared(1);
        expect(debug).not.toHaveBeenCalled();
        debug.mockRestore();
    });
});

describe("Real VehicleSigned backends", () => {
    const VIN = "5YJXCAE43LF123456";
    const KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");

    /** Fills the `_send` seam as Bluetooth will: the write lands, the ack is lost. */
    class LostAck extends VehicleSigned {
        lose = false;

        protected override async _send(msg: RoutableMessage, requires: string): Promise<RoutableMessage> {
            if (this.lose) {
                this.delivered?.(Buffer.from(RoutableMessage.encode(msg).finish()));
                throw new BluetoothUnconfirmedCommand();
            }
            return super._send(msg, requires);
        }

        delivered?: (bytes: Buffer) => void;
    }

    function parentFor(fakeVehicle: FakeVehicle) {
        const api = new TeslaFleetApi({ accessToken: "test-token", region: "na" });
        const request = vi.spyOn(api, "_request").mockImplementation(async (_method, path: string, _params, json) => {
            if (path.endsWith("/signed_command")) {
                const bytes = Buffer.from((json as { routable_message: string }).routable_message, "base64");
                return { response: fakeVehicle.handle(bytes).toString("base64") };
            }
            throw new Error(`Unexpected request to ${path}`);
        });
        return { parent: new Vehicle(api), request };
    }

    it("routes a signed command through FakeVehicle", async () => {
        const { parent } = parentFor(new FakeVehicle());
        const primary = parent.createSigned(VIN, KEY);
        const router = new VehicleRouter([primary, new FakeFallback()]);

        await expect(router.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });
        expect(router.vin).toBe(VIN);
    });

    it("keeps the seam and the signing key off the router", async () => {
        const { parent } = parentFor(new FakeVehicle());
        const router = new VehicleRouter([parent.createSigned(VIN, KEY), new FakeFallback()]);

        expect((router as unknown as Record<string, unknown>)._send).toBeUndefined();
        expect(Object.keys(router)).toEqual(["backends"]);
        // The raw key's bytes, as `inspect` would print a Buffer.
        expect(inspect(router, { depth: 8, showHidden: true })).not.toContain("10 18 1f 26");
        await expect((async () => router)()).resolves.toBe(router);
    });

    it("fails over from a vehicle that rejects the key to one that accepts", async () => {
        const rejecting = new FakeVehicle();
        rejecting.rejectNextAsNotWhitelisted();
        const primary = parentFor(rejecting).parent.createSigned(VIN, KEY);
        const secondary = parentFor(new FakeVehicle()).parent.createSigned(VIN, KEY);
        const seen: unknown[] = [];
        const router = new VehicleRouter([primary, secondary], {
            on_result: (error, used) => {
                seen.push(error === null ? used : error);
                return is_failover_safe(error);
            },
        });

        await expect(router.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });
        expect(seen[0]).toBeInstanceOf(NotOnWhitelistFault);
        expect(seen[1]).toBe(secondary);
    });

    it("never replays a door lock whose ack was lost after it reached the vehicle", async () => {
        const vehicle = new FakeVehicle();
        const { parent } = parentFor(vehicle);
        const primary = new LostAck(parent, VIN, KEY);
        primary.delivered = (bytes) => vehicle.handle(bytes);
        await primary.door_lock(); // The handshake is done, so the next write is the command.
        primary.lose = true;

        const fallback = { door_lock: vi.fn(async () => ({ response: { result: true, reason: "" } })) };
        const on_result = vi.fn(() => true);
        const router = new VehicleRouter([primary, fallback], { on_result });

        await expect(router.door_lock()).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(fallback.door_lock).not.toHaveBeenCalled();
        expect(on_result).not.toHaveBeenCalled();
    });

    it("fails over a pre-write transport failure", async () => {
        class NoLink extends VehicleSigned {
            protected override async _send(): Promise<RoutableMessage> {
                throw new BluetoothTransportError();
            }
        }
        const { parent } = parentFor(new FakeVehicle());
        const fallback = { door_lock: vi.fn(async () => ({ response: { result: true, reason: "" } })) };

        const router = new VehicleRouter([new NoLink(parent, VIN, KEY), fallback]);

        await expect(router.door_lock()).resolves.toEqual({ response: { result: true, reason: "" } });
        expect(fallback.door_lock).toHaveBeenCalledTimes(1);
    });
});

describe("The ./router import boundary", () => {
    const dir = new URL("../src/router/", import.meta.url);

    it.each(readdirSync(dir).map((file) => [file]))("%s imports `exceptions` only at run time", (file) => {
        const source = readFileSync(new URL(file, dir), "utf8");
        const imports = [...source.matchAll(/^(?:import|export)(?!\s+type)[^;]*?from\s+"([^"]+)"/gms)].map((match) => match[1]);
        const dynamic = [...source.matchAll(/\b(?:import|require)\(\s*["']([^"']+)/g)].map((match) => match[1]);

        expect(dynamic).toEqual([]);
        for (const target of imports) {
            expect(["../exceptions.js", "./base.js", "./energysite.js"]).toContain(target);
        }
    });

    it("keeps `exceptions` itself free of imports", () => {
        const source = readFileSync(new URL("../src/exceptions.ts", import.meta.url), "utf8");
        expect(source).not.toMatch(/^import\b(?!\s+type)/m);
    });
});
