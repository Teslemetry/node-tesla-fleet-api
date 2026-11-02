// `EnergySiteRouter` does not exist on this branch yet (RTR-1), so this holds
// document 02's `Routed` types as they compiled in the lab. Replace them with the
// real import once RTR-1 and this work share a branch. `tsconfig.json` leaves
// `test/` out, so the type assertions below need
// `npx tsc --noEmit -p <a tsconfig that includes this file>` to take effect.
import { describe, expect, it } from "vitest";
import { PowerwallEnergySite } from "../../src/powerwall/energysite.js";
import type { TeslemetryEnergySite } from "../../src/teslemetryenergy.js";

type MethodKeys<B> = { [K in keyof B]-?: B[K] extends (...args: never[]) => unknown ? K : never }[keyof B];
type AllMethodKeys<B> = B extends unknown ? MethodKeys<B> : never;
type MethodOf<B, K extends PropertyKey> = B extends { [P in K]: infer F } ? F : never;
type Asynced<F> = F extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;
type Routed<B> = { [K in AllMethodKeys<B>]: Asynced<MethodOf<B, K>> };

declare const router: Routed<PowerwallEnergySite | TeslemetryEnergySite>;

/** Compiled, never run: each call is what a caller of a mixed local and cloud router would write. */
export async function calls(): Promise<void> {
    await router.operation("self_consumption");
    await router.backup(20);
    await router.grid_import_export(true, "never");
    await router.set_island_mode(6, true);
    await router.go_off_grid();
    await router.reconnect_grid();
    await router.schedule_backup_event(null, 3600, null);
    await router.schedule_backup_event(undefined, undefined, "18446744073709551615");
    await router.cancel_backup_event();
    await router.dispatch_battery_power(-500, 30);
    await router.resume_battery_operation();
    await router.get_backup_events();
    await router.live_status();
    await router.list_authorized_clients();
    await router.find_authorized_clients();
    await router.remove_authorized_client("AQID");
    await router.local_config();
    await router.site_info();
    // @ts-expect-error A misspelt method.
    await router.opration("self_consumption");
    // @ts-expect-error A wrong argument type.
    await router.backup("20");
}

describe("router placement", () => {
    it("compiles: see `calls`", () => {
        expect(PowerwallEnergySite).toBeTypeOf("function");
    });
});
