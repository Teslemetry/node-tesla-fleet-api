// Compile-time checks, run by `npx tsc -p tsconfig.test.json --noEmit`. Never
// executed. An unused `@ts-expect-error` is itself an error, so a router type that
// stops rejecting one of these fails that command.
import { Router, VehicleRouter, type Routed } from "../src/router/index.js";
import type { CommandResponse } from "../src/types/commands.js";
import { TeslemetryVehicle } from "../src/teslemetryvehicle.js";
import { TessieVehicle } from "../src/tessievehicle.js";
import VehicleSigned from "../src/vehiclesigned.js";
import VehicleSpecific from "../src/vehiclespecific.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function assertType<_T extends true>(): void {}

class Primary {
    readonly vin = "PRIMARY";
    level = 0;

    door_lock(): Promise<CommandResponse> {
        throw new Error("type check only");
    }
    set_level(level: number): Promise<number> {
        return Promise.resolve(level);
    }
    primary_only(): Promise<string> {
        return Promise.resolve("primary");
    }
    /** Synchronous on the backend; asynchronous through the router. */
    listen_gear(_callback: (gear: string) => void): () => void {
        return () => undefined;
    }
    disagrees(_value: number): Promise<void> {
        return Promise.resolve();
    }
    private hidden(): Promise<void> {
        return Promise.resolve();
    }
    protected guarded(): Promise<void> {
        return this.hidden();
    }
    protected _send(): Promise<void> {
        return this.guarded();
    }
    _public_seam(): void {}
}

class Secondary {
    readonly vin = "SECONDARY";

    door_lock(): Promise<CommandResponse> {
        throw new Error("type check only");
    }
    set_level(level: number): Promise<number> {
        return Promise.resolve(level);
    }
    secondary_only(): Promise<boolean> {
        return Promise.resolve(true);
    }
    disagrees(_value: string): Promise<void> {
        return Promise.resolve();
    }
}

export async function routedCalls(router: VehicleRouter<readonly [Primary, Secondary]>): Promise<void> {
    assertType<Equal<ReturnType<typeof router.door_lock>, Promise<CommandResponse>>>();
    assertType<Equal<Awaited<ReturnType<typeof router.primary_only>>, string>>();
    assertType<Equal<Awaited<ReturnType<typeof router.secondary_only>>, boolean>>();
    assertType<Equal<ReturnType<typeof router.listen_gear>, Promise<() => void>>>();
    assertType<Equal<typeof router.primary, Primary>>();
    assertType<Equal<typeof router.secondary, Secondary>>();
    assertType<Equal<typeof router.vin, "PRIMARY" | "SECONDARY">>();

    await router.set_level(1);

    // @ts-expect-error A misspelt method does not exist.
    await router.door_lokc();
    // @ts-expect-error A wrong argument type.
    await router.set_level("high");
    // @ts-expect-error A missing argument.
    await router.set_level();
    // @ts-expect-error A TS `private` method is not routed.
    await router.hidden();
    // @ts-expect-error A TS `protected` method is not routed.
    await router.guarded();
    // @ts-expect-error The `_send` seam is not routed.
    await router._send();
    // @ts-expect-error A public `_`-prefixed method is a seam too, and is not installed at run time.
    await router._public_seam();
    // @ts-expect-error No backend's plain attribute is routed: read it from `primary`.
    void router.level;
    // @ts-expect-error Backends disagree on the argument, so no value satisfies both.
    await router.disagrees(1);
    // @ts-expect-error Backends disagree on the argument, so no value satisfies both.
    await router.disagrees("one");
    await router.primary.disagrees(1);
}

export function constructors(primary: Primary, secondary: Secondary): void {
    const _inferred = new VehicleRouter([primary, secondary]);
    assertType<Equal<typeof _inferred.primary, Primary>>();

    const _threeWay = new VehicleRouter([primary, secondary, new Date()], { health: () => Promise.resolve(true), on_result: () => true });
    assertType<Equal<typeof _threeWay.backends, readonly [Primary, Secondary, Date]>>();

    // @ts-expect-error A router needs at least two backends.
    new VehicleRouter([primary]);
    // @ts-expect-error A health check is a boolean or a function returning one.
    new VehicleRouter([primary, secondary], { health: "yes" });

    // `Router` is the untyped base: `VehicleRouter` is what types the methods.
    const base = new Router([primary, secondary]);
    // @ts-expect-error The base class declares no routed methods.
    void base.door_lock;
}

// The real backends, which the design's lab never compiled against the facade.
export async function realBackends(
    signed: VehicleSigned,
    specific: VehicleSpecific,
    teslemetry: TeslemetryVehicle,
    tessie: TessieVehicle,
): Promise<void> {
    const router = new VehicleRouter([signed, teslemetry]);
    assertType<Equal<ReturnType<typeof router.door_lock>, Promise<CommandResponse>>>();
    assertType<Equal<typeof router.primary, VehicleSigned>>();
    assertType<Equal<typeof router.vin, string>>();
    await router.door_lock();
    await router.set_charge_limit(80);

    // @ts-expect-error `_send` is protected on `Commands` and a seam by name.
    await router._send();
    // @ts-expect-error `validateAndUpdateSession` is `protected` on `Commands`.
    router.validateAndUpdateSession();
    // @ts-expect-error A wrong argument type on a real command.
    await router.set_charge_limit("80");

    const cloud = new VehicleRouter([specific, tessie]);
    await cloud.door_lock();
}

export type RoutedSigned = Routed<VehicleSigned>["door_lock"];
