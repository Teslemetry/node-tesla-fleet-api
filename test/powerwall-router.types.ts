// Compile-time checks, run by `npx tsc -p tsconfig.test.json --noEmit`. Never
// executed. They place the real `PowerwallEnergySite` in the real
// `EnergySiteRouter`, in front of the real cloud site.
import { connect_gateway } from "../src/powerwall/index.js";
import type { CommandResult, LocalConfig, PowerwallClient, PowerwallEnergySite } from "../src/powerwall/index.js";
import { EnergySiteRouter } from "../src/router/index.js";
import type { TeslemetryEnergySite } from "../src/teslemetryenergy.js";
import type { LiveStatusResponse } from "../src/types/live_status.js";
import type { SiteInfoResponse } from "../src/types/site_info.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function assertType<_T extends true>(): void {}

type Site = EnergySiteRouter<readonly [PowerwallEnergySite, TeslemetryEnergySite]>;
type LocalMethod = {
    [K in keyof PowerwallEnergySite]: PowerwallEnergySite[K] extends (...args: never[]) => unknown ? K : never;
}[keyof PowerwallEnergySite];

/**
 * What a caller of a mixed router would write, one case per local method. The
 * mapped type makes this exhaustive: dropping a case, adding a method without a
 * case, or removing a method a case calls, each fails the compile.
 */
export const everyLocalMethod: { [K in LocalMethod]: (router: Site) => Promise<unknown> } = {
    operation: (router) => router.operation("self_consumption"),
    backup: (router) => router.backup(20),
    grid_import_export: (router) => router.grid_import_export(true, "never"),
    set_island_mode: (router) => router.set_island_mode(6, true),
    go_off_grid: (router) => router.go_off_grid(),
    reconnect_grid: (router) => router.reconnect_grid(),
    schedule_backup_event: (router) => router.schedule_backup_event(null, 3600, null),
    cancel_backup_event: (router) => router.cancel_backup_event(),
    dispatch_battery_power: (router) => router.dispatch_battery_power(-500, 30),
    resume_battery_operation: (router) => router.resume_battery_operation(),
    get_backup_events: (router) => router.get_backup_events(),
    live_status: (router) => router.live_status(),
    local_config: (router) => router.local_config(),
    list_authorized_clients: (router) => router.list_authorized_clients(),
    find_authorized_clients: (router) => router.find_authorized_clients(),
    remove_authorized_client: (router) => router.remove_authorized_client("AQID"),
};

export async function routed(local: PowerwallEnergySite, cloud: TeslemetryEnergySite): Promise<void> {
    const router = new EnergySiteRouter([local, cloud]);
    assertType<Equal<typeof router.primary, PowerwallEnergySite>>();
    assertType<Equal<typeof router.secondary, TeslemetryEnergySite>>();

    // A method one backend lacks keeps the other's type.
    assertType<Equal<Awaited<ReturnType<typeof router.local_config>>, LocalConfig>>();
    assertType<Equal<Awaited<ReturnType<typeof router.site_info>>, { response: SiteInfoResponse }>>();

    // A local reply is a valid cloud-shaped one.
    const _live: LiveStatusResponse = (await local.live_status()).response;
    const _command: CommandResult = await local.backup(20);

    await router.schedule_backup_event(undefined, undefined, "18446744073709551615");

    // What only the primary has stays reachable there, and is not routed.
    await router.primary.powerwall.get_status();
    // @ts-expect-error A getter is not routed.
    void router.powerwall;

    // Discovery never routes: it is the cloud backend's alone.
    await router.secondary.find_gateway_address();
    const _healed = await connect_gateway({ client: { gatewayPassword: "", rsaPrivateKeyPem: "" }, cloud });
    assertType<Equal<typeof _healed.client, PowerwallClient>>();

    // @ts-expect-error A misspelt method.
    await router.opration("self_consumption");
    // @ts-expect-error A wrong argument type.
    await router.backup("20");
}
