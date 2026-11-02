// Polling state over the pure merge helpers in `src/router/energysite.ts`. These
// live here, not in `./router`, because they name `PowerwallEnergySite` types.
//
// They own no timer: the caller calls `poll()` on its own schedule, so an
// integration can use whatever fits its shutdown (`homey.setInterval`, say).
import { LOCAL_LIVE_STATUS_KEYS, LOCAL_SITE_INFO_KEYS, merge_local_into_cloud } from "../router/energysite.js";
import type { LiveStatusResponse } from "../types/live_status.js";
import type { SiteInfoResponse } from "../types/site_info.js";
import type { PowerwallEnergySite } from "./energysite.js";
import { PowerwallError } from "./exceptions.js";

/** How often to call `LiveStatusMerge.poll()`. */
export const ENERGY_LIVE_INTERVAL_MS = 5_000;
/** The longest `LiveStatusMerge` waits between local attempts after failures. */
export const ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS = 60_000;
/** How often to call `SiteInfoMerge.poll()`. */
export const ENERGY_CONFIG_INTERVAL_MS = 30_000;

const MAX_BACKOFF_TICKS = ENERGY_LIVE_LOCAL_MAX_BACKOFF_MS / ENERGY_LIVE_INTERVAL_MS;

export type MergeOptions = {
    /** The keys local overlays. Homey passes the live list without `island_status`. */
    owned_keys?: readonly string[];
};

/**
 * Keeps the latest cloud `live_status` and local reading, and re-merges on either
 * update. The cloud never clobbers a healthy local key, and a failed poll clears
 * the local reading, so everything falls back to cloud values rather than to
 * unavailable. All documents are unwrapped: the value under `response`.
 *
 * A failed poll never changes availability by itself. `poll()` resolves on a
 * `PowerwallError` and rejects on anything else, which is a bug, so attach a
 * rejection handler.
 */
export class LiveStatusMerge {
    readonly #site: Pick<PowerwallEnergySite, "live_status">;
    readonly #owned_keys: readonly string[];
    #cloud: LiveStatusResponse;
    #local: LiveStatusResponse | null = null;
    #healthy: boolean | null = null;
    #last_error: PowerwallError | null = null;
    #polling = false;
    #backoff_ticks = 1;
    #ticks_to_skip = 0;

    constructor(local: Pick<PowerwallEnergySite, "live_status">, cloud: LiveStatusResponse, options: MergeOptions = {}) {
        this.#site = local;
        this.#cloud = cloud;
        this.#owned_keys = options.owned_keys ?? LOCAL_LIVE_STATUS_KEYS;
    }

    /** The cloud document with the local reading overlaid. */
    get merged(): LiveStatusResponse {
        return merge_local_into_cloud(this.#cloud, this.#local, this.#owned_keys);
    }

    /** True after a successful poll, false after a failed one, null before the first. */
    get healthy(): boolean | null {
        return this.#healthy;
    }

    /** The error from the last poll, or null after a success. */
    get last_error(): PowerwallError | null {
        return this.#last_error;
    }

    /** Store a cloud document and return the merged view. */
    set_cloud(cloud: LiveStatusResponse): LiveStatusResponse {
        this.#cloud = cloud;
        return this.merged;
    }

    /** One 5 s tick. Returns the merged view, or null when the tick was skipped. */
    async poll(): Promise<LiveStatusResponse | null> {
        // `live_status` is several sequential reads and can outrun the interval.
        if (this.#polling) {
            return null;
        }
        if (this.#ticks_to_skip > 0) {
            this.#ticks_to_skip--;
            return null;
        }
        this.#polling = true;
        try {
            this.#local = (await this.#site.live_status()).response;
            this.#backoff_ticks = 1;
            this.#healthy = true;
            this.#last_error = null;
        } catch (error) {
            if (!(error instanceof PowerwallError)) {
                throw error;
            }
            this.#local = null;
            this.#backoff_ticks = Math.min(this.#backoff_ticks * 2, MAX_BACKOFF_TICKS);
            this.#ticks_to_skip = this.#backoff_ticks - 1;
            this.#healthy = false;
            this.#last_error = error;
        } finally {
            this.#polling = false;
        }
        return this.merged;
    }
}

/**
 * Keeps the latest cloud `site_info` and local `config.json` view, and holds a
 * command's value until its source next reports it, so neither a poll that
 * straddles the command nor a failed poll reverts what the user just set. All
 * documents are unwrapped: the value under `response`.
 *
 * `poll()` resolves on a `PowerwallError` and rejects on anything else, which is a
 * bug, so attach a rejection handler.
 */
export class SiteInfoMerge {
    readonly #site: Pick<PowerwallEnergySite, "local_config">;
    readonly #owned_keys: readonly string[];
    #cloud: SiteInfoResponse;
    #local: Record<string, unknown> | null = null;
    #held: Record<string, unknown> = {};
    #generation = 0;
    #healthy: boolean | null = null;
    #last_error: PowerwallError | null = null;
    #polling = false;

    constructor(local: Pick<PowerwallEnergySite, "local_config">, cloud: SiteInfoResponse, options: MergeOptions = {}) {
        this.#site = local;
        this.#cloud = cloud;
        this.#owned_keys = options.owned_keys ?? LOCAL_SITE_INFO_KEYS;
    }

    /** The cloud document with held values, then the local view, overlaid. */
    get merged(): SiteInfoResponse {
        return merge_local_into_cloud({ ...this.#cloud, ...this.#held }, this.#local, this.#owned_keys);
    }

    /** True after a successful read, false after a failed one, null before the first. */
    get healthy(): boolean | null {
        return this.#healthy;
    }

    /** The error from the last read, or null after a success. */
    get last_error(): PowerwallError | null {
        return this.#last_error;
    }

    /** Store a cloud document, which reports every held value, and return the merged view. */
    set_cloud(cloud: SiteInfoResponse): SiteInfoResponse {
        this.#cloud = cloud;
        this.#held = {};
        return this.merged;
    }

    /** One 30 s tick. Returns the merged view, or null when the tick was skipped or its read discarded. */
    async poll(): Promise<SiteInfoResponse | null> {
        if (this.#polling) {
            return null;
        }
        const generation = this.#generation;
        this.#polling = true;
        let local: Record<string, unknown> | null = null;
        try {
            local = await this.#site.local_config();
            this.#healthy = true;
            this.#last_error = null;
        } catch (error) {
            if (!(error instanceof PowerwallError)) {
                throw error;
            }
            this.#healthy = false;
            this.#last_error = error;
        } finally {
            this.#polling = false;
        }

        // A command landed mid-read, so this snapshot predates its value. Health
        // above still stands: it says whether the gateway answered.
        if (generation !== this.#generation) {
            return null;
        }
        this.#local = local;
        for (const key of this.#owned_keys) {
            if (local?.[key] !== undefined && local[key] !== null) {
                delete this.#held[key];
            }
        }
        return this.merged;
    }

    /** Hold a successful command's value until its source next reports it. */
    hold_command_value(key: string, value: unknown): SiteInfoResponse {
        if (this.#owned_keys.includes(key)) {
            this.#local = { ...this.#local, [key]: value };
            this.#generation++;
        }
        this.#held[key] = value;
        return this.merged;
    }
}
