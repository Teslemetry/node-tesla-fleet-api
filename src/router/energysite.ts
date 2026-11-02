// Energy-site routing and the local-over-cloud merge helpers, ported from
// Python's `tesla_fleet_api/router/energysite.py`. The merge helpers are pure and
// independent of `Router` dispatch. They take unwrapped documents: the value under
// `response`. The polling state that drives them is `src/powerwall/merge.ts`.

import { Router, type Backends, type MemberOf, type Routed, type RouterOptions } from "./base.js";

/** The `live_status` keys a local Powerwall owns. */
export const LOCAL_LIVE_STATUS_KEYS = [
    "solar_power",
    "energy_left",
    "total_pack_energy",
    "percentage_charged",
    "battery_power",
    "load_power",
    "grid_power",
    "generator_power",
    "grid_status",
    "island_status",
] as const;

/** The `site_info` keys a local Powerwall owns. */
export const LOCAL_SITE_INFO_KEYS = ["backup_reserve_percent", "default_real_mode"] as const;

/**
 * Overlay `owned_keys` present in `local` onto a copy of `cloud`. Every other key
 * keeps its cloud value.
 *
 * A local `live_status` returns every cloud key, with `null` for the ones it
 * cannot serve, so presence cannot be the ownership test. A fixed owned-key set
 * overlays local readings without clobbering cloud values, and lets a local outage
 * fall back to the cloud value rather than to an unavailable one.
 *
 * A key overlays only when it is owned, present, and not null: null means "not
 * served this tick" and the cloud value is kept. Any other falsy value (`0`,
 * `false`, `""`) overlays, because a zero reading must win. `local` of null, a
 * failed poll, yields a copy of `cloud`.
 */
export function merge_local_into_cloud<T extends object>(cloud: T, local: object | null, owned_keys: readonly string[]): T {
    const merged: any = { ...cloud };
    if (local == null) {
        return merged;
    }
    for (const key of owned_keys) {
        const value = (local as any)[key];
        if (value !== undefined && value !== null) {
            merged[key] = value;
        }
    }
    return merged;
}

/** Overlay a local `live_status` onto the cloud document. See {@link merge_local_into_cloud}. */
export function merge_live_status<T extends object>(cloud: T, local: object | null): T {
    return merge_local_into_cloud(cloud, local, LOCAL_LIVE_STATUS_KEYS);
}

/** Overlay a local `site_info` onto the cloud document. See {@link merge_local_into_cloud}. */
export function merge_site_info<T extends object>(cloud: T, local: object | null): T {
    return merge_local_into_cloud(cloud, local, LOCAL_SITE_INFO_KEYS);
}

class EnergySiteRouterBase<Bs extends Backends> extends Router<Bs> {
    /** The site id of the first backend that has one. */
    get energy_site_id(): MemberOf<Bs[number], "energy_site_id"> {
        return this._first_attribute("energy_site_id");
    }

    /** Logs `transport=lan` for the local primary. Cloud fallbacks keep `backend=`. */
    protected override _backend_field(backend: object): string {
        return backend === this.primary ? "transport=lan" : super._backend_field(backend);
    }
}

/**
 * A router over energy sites: a local primary, such as `PowerwallEnergySite`,
 * and one or more cloud fallbacks. See `Router` for dispatch, failover and the
 * replay warning.
 *
 * There is no per-method list. A method the local backend omits goes straight to
 * the cloud, and registration and discovery (`add_authorized_client`,
 * `find_gateway_address`) belong on `router.secondary` directly. A local-only
 * caller that must not fail over uses `router.primary`.
 *
 * A failed-over write can run twice. `operation`, `backup` and
 * `grid_import_export` all write `config.json`, so do not split them across
 * backends: one write would stomp the other.
 */
export type EnergySiteRouter<Bs extends Backends> = EnergySiteRouterBase<Bs> & Routed<Bs[number]>;
export const EnergySiteRouter = EnergySiteRouterBase as unknown as new <const Bs extends Backends>(
    backends: Bs,
    options?: RouterOptions,
) => EnergySiteRouter<Bs>;
