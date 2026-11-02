// HTTP and signing for the local gateway. Three kinds of request share one
// `https.Agent`: the login, bearer-token REST reads, and RSA-signed
// `RoutableMessage` posts to `/tedapi/v1r`, which carry no bearer token and no
// cookie. A token expiry therefore never affects a signed request.
//
// The gateway certificate is self-signed, and global `fetch` cannot accept one
// without a process-wide switch. Certificate checks are off for this agent only:
// never set `NODE_TLS_REJECT_UNAUTHORIZED`, which would disable them for the cloud too.
import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";
import https from "node:https";
import { promisify } from "node:util";
import zlib from "node:zlib";
import {
    MessageFaultE,
    messageFaultEToJSON,
    RoutableMessage,
} from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { EnergyDeviceSigner } from "../signing/energy.js";
import {
    PowerwallAuthenticationError,
    PowerwallConnectionError,
    PowerwallError,
    PowerwallFaultError,
    PowerwallProtocolError,
    PowerwallRateLimitError,
} from "./exceptions.js";

/** A signed LAN message must reach the gateway within this window. */
const SIGNATURE_TTL_SECONDS = 12;
const DEFAULT_TIMEOUT_MS = 5000;

const gunzip = promisify(zlib.gunzip);
const utf8 = new TextDecoder("utf-8", { fatal: true });

function isAuthStatus(status: number): boolean {
    return status === 401 || status === 403;
}

function isRateLimitStatus(status: number): boolean {
    return status === 429 || status === 503;
}

/**
 * Firmware 25.42.2 and later can gzip any body, with or without a header, and
 * `node:https` decompresses nothing. A valid `RoutableMessage` cannot start with
 * the magic bytes, so they decide. A failed gunzip keeps the raw bytes.
 */
async function decompress(body: Buffer): Promise<Buffer> {
    if (body.length > 2 && body[0] === 0x1f && body[1] === 0x8b) {
        return gunzip(body).catch(() => body);
    }
    return body;
}

function loadPrivateKey(pem: string | Buffer): crypto.KeyObject {
    let key: crypto.KeyObject;
    try {
        key = crypto.createPrivateKey(pem);
    } catch (error) {
        throw new PowerwallAuthenticationError("Invalid RSA private key PEM", { cause: error });
    }
    if (key.asymmetricKeyType !== "rsa") {
        throw new PowerwallAuthenticationError(`v1r requires an RSA private key, got ${key.asymmetricKeyType}`);
    }
    return key;
}

export interface V1rTransportOptions {
    /** The gateway address, optionally `host:port`. */
    host: string;
    /** The full gateway password, or its last 5 characters. */
    password: string;
    rsaPrivateKeyPem: string | Buffer;
    /** Total time allowed per request. */
    timeoutMs?: number;
    /** Early Gateway 1 units reject the truncated login and need the full password. */
    legacyGateway?: boolean;
}

/** The gateway's wire protocol, with no knowledge of what each message means. */
export class V1rTransport {
    readonly #host: string;
    readonly #timeoutMs: number;
    // Native private fields: unreachable through `JSON.stringify` or a structured log.
    readonly #password: string;
    readonly #signer: EnergyDeviceSigner;
    readonly #agent: https.Agent;
    #token: string | null = null;
    #login: Promise<string> | null = null;

    /** @throws PowerwallAuthenticationError for a bad PEM or a key that is not RSA. */
    constructor(options: V1rTransportOptions) {
        this.#host = options.host;
        this.#timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.#password = options.legacyGateway ? options.password : options.password.slice(-5);
        this.#signer = new EnergyDeviceSigner(loadPrivateKey(options.rsaPrivateKeyPem), SIGNATURE_TTL_SECONDS);
        this.#agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false, ALPNProtocols: ["http/1.1"] });
    }

    get host(): string {
        return this.#host;
    }

    get has_token(): boolean {
        return this.#token !== null;
    }

    /** Destroy the idle sockets. A later request opens a new one. */
    close(): void {
        this.#agent.destroy();
    }

    /**
     * Get a new bearer token. Concurrent callers share one request.
     * @throws PowerwallAuthenticationError on 401 or 403, which means a wrong password.
     * @throws PowerwallRateLimitError on 429 or 503.
     * @throws PowerwallProtocolError on any other status, or a reply with no token.
     * @throws PowerwallConnectionError on a transport failure or timeout.
     */
    login(): Promise<string> {
        this.#login ??= this.#requestToken().finally(() => {
            this.#login = null;
        });
        return this.#login;
    }

    /**
     * Fetch the gateway DIN with the bearer token.
     * @throws PowerwallProtocolError when the reply is empty or not UTF-8.
     */
    async fetch_din(): Promise<string> {
        const body = await this.#authedGet("/tedapi/din");
        let din: string;
        try {
            din = utf8.decode(body).trim();
        } catch (error) {
            throw new PowerwallProtocolError("DIN response is not UTF-8", { cause: error });
        }
        if (!din) {
            throw new PowerwallProtocolError("Empty DIN from gateway");
        }
        return din;
    }

    /**
     * GET a JSON REST endpoint with the bearer token, logging in again once on 401 or 403.
     * @throws PowerwallProtocolError when the body is not JSON.
     */
    async api_get(path: string): Promise<unknown> {
        const body = await this.#authedGet(path);
        try {
            return JSON.parse(body.toString("utf8"));
        } catch (error) {
            throw new PowerwallProtocolError(`GET ${path} did not return JSON`, { cause: error });
        }
    }

    /**
     * POST a signed `RoutableMessage`, once, and return the inner `MessageEnvelope` bytes.
     *
     * There is no retry at any level: the same bytes execute again if they arrive
     * before `expires_at`.
     * @param envelope The serialized `MessageEnvelope`.
     * @param din The gateway DIN.
     * @param signing `now` and `messageUuid` exist for test vectors.
     * @throws PowerwallAuthenticationError on 401 or 403, an unknown key fault, or the "authorization not verified" placeholder.
     * @throws PowerwallRateLimitError on 429 or 503.
     * @throws PowerwallFaultError on any other fault.
     * @throws PowerwallProtocolError on any other status, or a malformed or empty reply.
     * @throws PowerwallConnectionError on a transport failure or timeout.
     */
    async post_v1r(
        envelope: Uint8Array,
        din: string,
        signing?: { now?: number; messageUuid?: Uint8Array },
    ): Promise<Uint8Array> {
        const payload = await this.#signer.sign(envelope, din, signing);
        const { status, body } = await this.#request("v1r POST", "/tedapi/v1r", {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: payload,
        });
        if (isAuthStatus(status)) {
            throw new PowerwallAuthenticationError(`v1r POST rejected with ${status}`);
        }
        if (isRateLimitStatus(status)) {
            throw new PowerwallRateLimitError(`Rate-limited by gateway on v1r POST (status ${status})`);
        }
        if (status !== 200) {
            throw new PowerwallProtocolError(`v1r POST returned ${status}`);
        }

        let response: RoutableMessage;
        try {
            response = RoutableMessage.decode(body);
        } catch (error) {
            throw new PowerwallProtocolError("Malformed RoutableMessage", { cause: error });
        }

        const fault = response.signedMessageStatus?.messageFault ?? MessageFaultE.MESSAGEFAULT_ERROR_NONE;
        if (fault === MessageFaultE.MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID) {
            throw new PowerwallAuthenticationError(
                `RSA key not registered with this Powerwall (fault: ${messageFaultEToJSON(fault)})`,
            );
        }
        if (fault !== MessageFaultE.MESSAGEFAULT_ERROR_NONE) {
            const name = messageFaultEToJSON(fault);
            throw new PowerwallFaultError(name === "UNRECOGNIZED" ? `UNRECOGNIZED_FAULT_${fault}` : name);
        }

        const inner = response.protobufMessageAsBytes;
        // A gateway refuses an unverified key with HTTP 200, no fault and a placeholder
        // string in the envelope, worded differently across firmware.
        if (inner && /authorization not verified/i.test(Buffer.from(inner).toString("latin1"))) {
            throw new PowerwallAuthenticationError("v1r: client authorization not verified: the RSA key is not paired");
        }
        if (!inner?.length) {
            throw new PowerwallProtocolError("RoutableMessage response is empty");
        }
        return inner;
    }

    async #requestToken(): Promise<string> {
        const { status, body } = await this.#request("Login", "/api/login/Basic", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(
                JSON.stringify({
                    // Fixed protocol values, not account data.
                    username: "customer",
                    password: this.#password,
                    email: "customer@customer.domain",
                    clientInfo: { timezone: "America/Chicago" },
                }),
            ),
        });
        if (isAuthStatus(status)) {
            throw new PowerwallAuthenticationError(`Login rejected (${status}): check the gateway password`);
        }
        if (isRateLimitStatus(status)) {
            throw new PowerwallRateLimitError(`Rate-limited by gateway on login (status ${status})`);
        }
        if (status !== 200) {
            throw new PowerwallProtocolError(`Login failed (${status}): ${body.toString("utf8").slice(0, 200)}`);
        }

        let data: unknown;
        try {
            data = JSON.parse(body.toString("utf8"));
        } catch {
            data = null;
        }
        const token = (data as { token?: unknown } | null)?.token;
        if (typeof token !== "string" || !token) {
            throw new PowerwallProtocolError("Login response missing 'token'");
        }
        this.#token = token;
        return token;
    }

    async #authedGet(path: string): Promise<Buffer> {
        let token = this.#token ?? (await this.login());
        for (let attempt = 0; attempt < 2; attempt++) {
            const { status, body } = await this.#request(`GET ${path}`, path, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (status === 200) {
                return body;
            }
            if (isRateLimitStatus(status)) {
                throw new PowerwallRateLimitError(`Rate-limited by gateway on GET ${path} (status ${status})`);
            }
            if (!isAuthStatus(status)) {
                throw new PowerwallProtocolError(`GET ${path} returned ${status}`);
            }
            if (attempt === 0) {
                this.#token = null;
                token = await this.login();
            }
        }
        throw new PowerwallAuthenticationError(`GET ${path} unauthorized after token refresh`);
    }

    /** Send one request and read the whole body. Every failure here is a `PowerwallConnectionError`. */
    async #request(
        label: string,
        path: string,
        init: { method: string; headers: Record<string, string>; body?: Uint8Array },
    ): Promise<{ status: number; body: Buffer }> {
        const signal = AbortSignal.timeout(this.#timeoutMs);
        try {
            const response = await new Promise<IncomingMessage>((resolve, reject) => {
                const request = https.request(
                    new URL(`https://${this.#host}${path}`),
                    {
                        method: init.method,
                        agent: this.#agent,
                        signal,
                        headers: {
                            ...init.headers,
                            "Accept-Encoding": "gzip",
                            ...(init.body ? { "Content-Length": String(init.body.length) } : {}),
                        },
                    },
                    resolve,
                );
                request.on("error", reject);
                request.end(init.body);
            });
            // `for await` rather than events, so a connection dropped mid-body throws.
            const chunks: Buffer[] = [];
            for await (const chunk of response) {
                chunks.push(chunk as Buffer);
            }
            return { status: response.statusCode ?? 0, body: await decompress(Buffer.concat(chunks)) };
        } catch (error) {
            if (error instanceof PowerwallError) {
                throw error;
            }
            const detail = signal.aborted ? "timed out" : `transport error: ${(error as Error).message}`;
            throw new PowerwallConnectionError(`${label} ${detail}`, { cause: error });
        }
    }
}
