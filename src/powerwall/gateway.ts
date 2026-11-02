// Connecting to a gateway whose address may have moved, and proving a stored
// password and key. Only the cloud can report the LAN address, so healing takes
// any `find_gateway_address`. Homey passes `parse_gateway_address` over a raw
// `@teslemetry/api` reply.
import { DEFAULT_GATEWAY_HOST, PowerwallClient, type PowerwallClientOptions } from "./client.js";
import {
    PowerwallAuthenticationError,
    PowerwallConnectionError,
    PowerwallError,
    PowerwallKeyRejectedError,
    PowerwallRateLimitError,
} from "./exceptions.js";

export type GatewayOutcome =
    /** Connected at the stored host. */
    | "connected"
    /** The gateway answered 429 or 503: it is there, so there is nothing to repair. */
    | "rate_limited"
    /** Connected at a new host. The caller must persist `host`: nothing here does. */
    | "moved"
    /** The cloud confirms this address and the gateway refused us. A wrong password lands here. */
    | "refused"
    /** No usable address. The caller should offer a repair. */
    | "not_found";

export type ConnectGatewayOptions = {
    client: PowerwallClientOptions;
    /** A cloud site, or anything that can report the gateway's address. */
    cloud: { find_gateway_address(): Promise<string | null> };
    /** Use `PowerwallClient.legacy_gateway` for an early Gateway 1 unit. */
    legacy_gateway?: boolean;
};

export type ConnectGatewayResult = {
    client: PowerwallClient;
    host: string;
    outcome: GatewayOutcome;
    /** Why the stored host did not connect. Absent for `connected` and `moved`. */
    error?: PowerwallError;
};

function createClient(options: PowerwallClientOptions, legacy_gateway?: boolean): PowerwallClient {
    return legacy_gateway ? PowerwallClient.legacy_gateway(options) : new PowerwallClient(options);
}

/**
 * Connect at the stored host, and if that fails ask the cloud where the gateway
 * is. Any error is a lead, because another device may have taken the address.
 *
 * Every outcome returns a client, so the caller still builds the router. A stale
 * client's calls fail with `PowerwallConnectionError` and go to the cloud, so a
 * site degrades to cloud control and does not break.
 *
 * @throws PowerwallAuthenticationError for a bad PEM, which no address can repair.
 */
export async function connect_gateway(options: ConnectGatewayOptions): Promise<ConnectGatewayResult> {
    const { client: clientOptions, cloud, legacy_gateway } = options;
    const stored = clientOptions.host ?? DEFAULT_GATEWAY_HOST;
    const client = createClient(clientOptions, legacy_gateway);

    let error: PowerwallError;
    try {
        await client.connect();
        return { client, host: stored, outcome: "connected" };
    } catch (caught) {
        if (!(caught instanceof PowerwallError)) {
            throw caught;
        }
        if (caught instanceof PowerwallRateLimitError) {
            return { client, host: stored, outcome: "rate_limited", error: caught };
        }
        error = caught;
    }

    let address: string | null = null;
    try {
        address = await cloud.find_gateway_address();
    } catch {
        // A cloud failure says nothing about the gateway, so it counts as no address.
    }

    if (address === stored && !(error instanceof PowerwallConnectionError)) {
        return { client, host: stored, outcome: "refused", error };
    }
    if (address != null && address !== stored) {
        const moved = createClient({ ...clientOptions, host: address }, legacy_gateway);
        try {
            await moved.connect();
            client.close();
            return { client: moved, host: address, outcome: "moved" };
        } catch (caught) {
            moved.close();
            if (!(caught instanceof PowerwallError)) {
                throw caught;
            }
        }
    }
    return { client, host: stored, outcome: "not_found", error };
}

/**
 * Prove a stored password and key against the gateway. A login proves the
 * password and a signed read proves the key: they are independent.
 *
 * @throws PowerwallAuthenticationError when the password is wrong.
 * @throws PowerwallKeyRejectedError when the password worked and the key did not.
 * @throws Any other `PowerwallError` when the gateway cannot be reached.
 */
export async function verify_local_gateway(client: PowerwallClient): Promise<void> {
    await client.connect();
    try {
        await client.get_status();
    } catch (error) {
        if (error instanceof PowerwallAuthenticationError) {
            throw new PowerwallKeyRejectedError("The gateway accepted the password but not the signing key", { cause: error });
        }
        throw error;
    }
}
