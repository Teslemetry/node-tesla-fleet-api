import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizedClientState } from "../src/const.js";
import { AuthorizedClientPairingTimedOut, AuthorizedClientWaitExpired } from "../src/exceptions.js";
import Teslemetry from "../src/teslemetry.js";
import {
    AuthorizedClient,
    AuthorizedClients,
    DEFAULT_PAIRING_POLL_INTERVAL,
    DEFAULT_PAIRING_TIMEOUT,
    TeslemetryEnergySite,
} from "../src/teslemetryenergy.js";

const PUBLIC_KEY_B64 = "MIIBCgKCAQEAsomeBase64EncodedRsaPublicKeyBytes==";

function client(state: number, public_key: string = PUBLIC_KEY_B64): AuthorizedClient {
    return { public_key, state, roles: null, verification: null, raw: {} };
}

function reply(...clients: AuthorizedClient[]): AuthorizedClients {
    return { clients, raw: {} };
}

const OPTIONS = { timeout_ms: 5_000, poll_interval_ms: 10 };

describe("wait_until_paired", () => {
    let site: TeslemetryEnergySite;

    beforeEach(() => {
        vi.useFakeTimers();
        site = new Teslemetry("token", "na").energySites!.create(12345);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    /** Attach rejection expectations before timers run, so a rejection is never unhandled. */
    async function settle<T>(promise: Promise<T>): Promise<PromiseSettledResult<T>> {
        const settled = Promise.allSettled([promise]);
        await vi.runAllTimersAsync();
        return (await settled)[0];
    }

    const reason = (result: PromiseSettledResult<unknown>) => (result as PromiseRejectedResult).reason;

    it("defaults to ten minutes, polling every five seconds", () => {
        expect(DEFAULT_PAIRING_TIMEOUT).toBe(600_000);
        expect(DEFAULT_PAIRING_POLL_INTERVAL).toBe(5_000);
    });

    it("returns immediately on VERIFIED", async () => {
        const find = vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));

        const result = await site.wait_until_paired(PUBLIC_KEY_B64, OPTIONS);

        expect(result.state).toBe(AuthorizedClientState.VERIFIED);
        expect(find).toHaveBeenCalledOnce();
    });

    it("polls until VERIFIED, waiting the poll interval", async () => {
        const find = vi
            .spyOn(site, "find_authorized_clients")
            .mockResolvedValueOnce(reply(client(AuthorizedClientState.PENDING_VERIFICATION)))
            .mockResolvedValueOnce(reply(client(AuthorizedClientState.PENDING_VERIFICATION)))
            .mockResolvedValueOnce(reply(client(AuthorizedClientState.VERIFIED)));

        const waiting = site.wait_until_paired(PUBLIC_KEY_B64, OPTIONS);
        await vi.advanceTimersByTimeAsync(9);
        expect(find).toHaveBeenCalledOnce();
        await vi.advanceTimersByTimeAsync(11);

        await expect(waiting).resolves.toMatchObject({ state: AuthorizedClientState.VERIFIED });
        expect(find).toHaveBeenCalledTimes(3);
    });

    it("raises AuthorizedClientPairingTimedOut at once on PENDING_VERIFICATION_TIMEOUT", async () => {
        const find = vi
            .spyOn(site, "find_authorized_clients")
            .mockResolvedValue(reply(client(AuthorizedClientState.PENDING_VERIFICATION_TIMEOUT)));

        const error = await site.wait_until_paired(PUBLIC_KEY_B64, OPTIONS).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(AuthorizedClientPairingTimedOut);
        expect((error as AuthorizedClientPairingTimedOut).data).toEqual({
            public_key: PUBLIC_KEY_B64,
            state: AuthorizedClientState.PENDING_VERIFICATION_TIMEOUT,
        });
        expect(find).toHaveBeenCalledOnce();
    });

    it("raises AuthorizedClientWaitExpired at the deadline while pending, carrying the last state", async () => {
        const find = vi
            .spyOn(site, "find_authorized_clients")
            .mockResolvedValue(reply(client(AuthorizedClientState.PENDING_VERIFICATION)));

        const result = await settle(site.wait_until_paired(PUBLIC_KEY_B64, { timeout_ms: 30, poll_interval_ms: 10 }));

        expect(reason(result)).toBeInstanceOf(AuthorizedClientWaitExpired);
        expect(reason(result).data).toEqual({
            public_key: PUBLIC_KEY_B64,
            state: AuthorizedClientState.PENDING_VERIFICATION,
        });
        expect(find.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it("raises AuthorizedClientWaitExpired when the client lookup hangs", async () => {
        const find = vi.spyOn(site, "find_authorized_clients").mockReturnValue(new Promise(() => {}));

        const result = await settle(site.wait_until_paired(PUBLIC_KEY_B64, { timeout_ms: 30, poll_interval_ms: 10 }));

        expect(reason(result)).toBeInstanceOf(AuthorizedClientWaitExpired);
        expect(find).toHaveBeenCalledOnce();
    });

    it("confirms with verify_by_use after VERIFIED", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));
        const verify_by_use = vi.fn(async () => undefined);

        const result = await site.wait_until_paired(PUBLIC_KEY_B64, { ...OPTIONS, verify_by_use });

        expect(result.state).toBe(AuthorizedClientState.VERIFIED);
        expect(verify_by_use).toHaveBeenCalledOnce();
    });

    it("does not call verify_by_use before VERIFIED", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(
            reply(client(AuthorizedClientState.PENDING_VERIFICATION)),
        );
        const verify_by_use = vi.fn(async () => undefined);

        await settle(site.wait_until_paired(PUBLIC_KEY_B64, { timeout_ms: 30, poll_interval_ms: 10, verify_by_use }));

        expect(verify_by_use).not.toHaveBeenCalled();
    });

    it("keeps polling after a verify_by_use failure", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));
        const verify_by_use = vi.fn<() => Promise<void>>().mockRejectedValueOnce(new Error("not yet")).mockResolvedValue();

        const result = await settle(site.wait_until_paired(PUBLIC_KEY_B64, { ...OPTIONS, verify_by_use }));

        expect(result.status).toBe("fulfilled");
        expect(verify_by_use).toHaveBeenCalledTimes(2);
    });

    it("treats a verify_by_use that throws synchronously as not yet", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));
        const verify_by_use = vi
            .fn<() => Promise<void>>()
            .mockImplementationOnce(() => {
                throw new Error("not yet");
            })
            .mockResolvedValue();

        const result = await settle(site.wait_until_paired(PUBLIC_KEY_B64, { ...OPTIONS, verify_by_use }));

        expect(result.status).toBe("fulfilled");
    });

    it("raises AuthorizedClientWaitExpired when verify_by_use never succeeds", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));
        const verify_by_use = vi.fn(async () => {
            throw new Error("never confirms");
        });

        const result = await settle(
            site.wait_until_paired(PUBLIC_KEY_B64, { timeout_ms: 30, poll_interval_ms: 10, verify_by_use }),
        );

        expect(reason(result)).toBeInstanceOf(AuthorizedClientWaitExpired);
    });

    it("raises AuthorizedClientWaitExpired when verify_by_use hangs", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));
        const verify_by_use = vi.fn(() => new Promise<void>(() => {}));

        const result = await settle(
            site.wait_until_paired(PUBLIC_KEY_B64, { timeout_ms: 30, poll_interval_ms: 10, verify_by_use }),
        );

        expect(reason(result)).toBeInstanceOf(AuthorizedClientWaitExpired);
        expect(verify_by_use).toHaveBeenCalledOnce();
    });

    it("counts a failed poll as no signal", async () => {
        const find = vi
            .spyOn(site, "find_authorized_clients")
            .mockRejectedValueOnce(new Error("gateway unreachable"))
            .mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));

        const result = await settle(site.wait_until_paired(PUBLIC_KEY_B64, OPTIONS));

        expect(result.status).toBe("fulfilled");
        expect(find).toHaveBeenCalledTimes(2);
    });

    it("keeps polling while no client matches", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(
            reply(client(AuthorizedClientState.VERIFIED, "another-key")),
        );

        const result = await settle(site.wait_until_paired(PUBLIC_KEY_B64, { timeout_ms: 30, poll_interval_ms: 10 }));

        expect(reason(result)).toBeInstanceOf(AuthorizedClientWaitExpired);
    });

    it("matches raw public key bytes as base64", async () => {
        const raw = Buffer.from("raw-der-bytes");
        const b64 = raw.toString("base64");
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED, b64)));

        await expect(site.wait_until_paired(raw, OPTIONS)).resolves.toMatchObject({ public_key: b64 });
    });

    it("rejects with the signal's reason, in place of task cancellation", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(
            reply(client(AuthorizedClientState.PENDING_VERIFICATION)),
        );
        const controller = new AbortController();
        const cancelled = new Error("cancelled");

        const waiting = Promise.allSettled([site.wait_until_paired(PUBLIC_KEY_B64, { ...OPTIONS, signal: controller.signal })]);
        await vi.advanceTimersByTimeAsync(25);
        controller.abort(cancelled);

        const [result] = await waiting;
        expect(reason(result)).toBe(cancelled);
    });

    it("rejects an abort during a hanging poll rather than counting it as a failed poll", async () => {
        const find = vi.spyOn(site, "find_authorized_clients").mockReturnValue(new Promise(() => {}));
        const controller = new AbortController();
        const cancelled = new Error("cancelled");

        const waiting = Promise.allSettled([site.wait_until_paired(PUBLIC_KEY_B64, { ...OPTIONS, signal: controller.signal })]);
        await vi.advanceTimersByTimeAsync(1);
        controller.abort(cancelled);

        const [result] = await waiting;
        expect(reason(result)).toBe(cancelled);
        expect(find).toHaveBeenCalledOnce();
    });

    it("rejects at once on an already aborted signal", async () => {
        const find = vi.spyOn(site, "find_authorized_clients");
        const signal = AbortSignal.abort(new Error("cancelled"));

        await expect(site.wait_until_paired(PUBLIC_KEY_B64, { ...OPTIONS, signal })).rejects.toThrow("cancelled");

        expect(find).not.toHaveBeenCalled();
    });

    it("leaves no timer behind", async () => {
        vi.spyOn(site, "find_authorized_clients").mockResolvedValue(reply(client(AuthorizedClientState.VERIFIED)));

        await site.wait_until_paired(PUBLIC_KEY_B64, OPTIONS);

        expect(vi.getTimerCount()).toBe(0);
    });
});
