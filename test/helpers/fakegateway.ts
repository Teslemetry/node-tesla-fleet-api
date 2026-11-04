// A from-scratch gateway on a real self-signed HTTPS server, the way
// `fakevehicle.ts` reimplements a vehicle: it verifies RSA signatures from the
// TLV rules itself and shares no code with `src/powerwall`, so a round trip
// checks the client against a second implementation of the protocol.
import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import https from "node:https";
import type { AddressInfo } from "node:net";
import zlib from "node:zlib";
import { MessageFaultE, RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { FAKE_GATEWAY_TLS_CERT, FAKE_GATEWAY_TLS_KEY, GATEWAY_DIN, GATEWAY_PASSWORD } from "../fixtures/powerwall.js";

type Json = Record<string, any>;

/** A canned answer to the next `/tedapi/v1r` POST. */
export type V1rReply =
    | { envelope: Json }
    | { inner: Uint8Array }
    | { noInner: true }
    | { fault: MessageFaultE }
    | { raw: Buffer }
    | { dropConnection: true };

export type RecordedPost = {
    headers: IncomingMessage["headers"];
    message: RoutableMessage;
    envelope: MessageEnvelope;
    /** The envelope bytes exactly as the client sent them. */
    envelopeBytes: Buffer;
};

export type GatewayOptions = {
    din?: string;
    password?: string;
    /** The key the gateway knows, PKCS#1 DER. Any other signer gets `UNKNOWN_KEY_ID`. Omit to accept any key. */
    registeredKey?: Buffer;
};

export class FakeGateway {
    readonly din: string;
    readonly password: string;
    registeredKey?: Buffer;

    /** Every login body, every GET, every POST to `/tedapi/v1r`, in order. */
    readonly logins: Json[] = [];
    readonly gets: { path: string; authorization?: string }[] = [];
    readonly posts: RecordedPost[] = [];

    /** Compress every body. `gzipHeader` controls whether the reply admits it. */
    gzip = false;
    gzipHeader = true;
    /** Answer the next login with this body instead of a token. */
    loginReply?: Buffer;
    /** Accept connections and never answer. */
    hang = false;
    /** The gateway's clock, in seconds. */
    now = (): number => Date.now() / 1000;

    /** REST replies, by path. A value is JSON, a `Buffer` is sent as it is. */
    readonly rest = new Map<string, unknown>([
        [
            "/api/meters/aggregates",
            {
                site: { instant_power: 1500 },
                battery: { instant_power: -1000 },
                load: { instant_power: 500 },
                solar: { instant_power: 2000 },
                generator: { instant_power: 0 },
            },
        ],
        ["/api/system_status/soe", { percentage: 52.77777777777778 }],
        ["/api/system_status/grid_status", { grid_status: "SystemGridConnected" }],
    ]);
    /** JSON text per GraphQL query, chosen by the operation name in the signed query. */
    graphql: Record<string, string> = {
        DeviceControllerQuery: '{"control":{}}',
        ComponentsQuery: '{"components":{}}',
    };
    systemInfo: Json = {};
    /** Awaited after a v1r request is recorded and before it is answered, to hold replies back. */
    holdReply?: (envelope: MessageEnvelope) => Promise<void>;
    /** Answer a v1r request by its content: a body for the envelope, or nothing for the default. */
    respond?: (envelope: MessageEnvelope) => Json | undefined;
    /** `config.json` as stored. Its hash is SHA-256, which is opaque to a client. */
    config: Buffer = Buffer.from('{"default_real_mode":"self_consumption","site_info":{"backup_reserve_percent":24}}');
    /** The `hash` of each accepted `config.json` update. */
    readonly configWrites: { hash: Buffer; blob: Buffer }[] = [];

    #server: https.Server;
    #tokens = new Set<string>();
    #forced: { path: string; status: number; remaining: number }[] = [];
    #replies: V1rReply[] = [];

    private constructor(options: GatewayOptions) {
        this.din = options.din ?? GATEWAY_DIN;
        this.password = options.password ?? GATEWAY_PASSWORD.slice(-5);
        this.registeredKey = options.registeredKey;
        this.#server = https.createServer(
            { key: FAKE_GATEWAY_TLS_KEY, cert: FAKE_GATEWAY_TLS_CERT, ALPNProtocols: ["http/1.1"] },
            (request, response) => {
                this.#handle(request, response).catch((error: unknown) => {
                    response.destroy(error as Error);
                });
            },
        );
    }

    static async start(options: GatewayOptions = {}): Promise<FakeGateway> {
        const gateway = new FakeGateway(options);
        await new Promise<void>((resolve) => gateway.#server.listen(0, "127.0.0.1", resolve));
        return gateway;
    }

    get host(): string {
        return `127.0.0.1:${(this.#server.address() as AddressInfo).port}`;
    }

    async stop(): Promise<void> {
        this.#server.closeAllConnections();
        await new Promise((resolve) => this.#server.close(resolve));
    }

    /** Answer the next `times` requests to `path` with `status`. */
    forceStatus(path: string, status: number, times = 1): void {
        this.#forced.push({ path, status, remaining: times });
    }

    /** Invalidate every issued bearer token. */
    expireTokens(): void {
        this.#tokens.clear();
    }

    /** Queue canned answers for the next v1r POSTs. Without one the gateway acts on the request. */
    reply(...replies: V1rReply[]): void {
        this.#replies.push(...replies);
    }

    get configJson(): Json {
        return JSON.parse(this.config.toString("utf8"));
    }

    #hash(): Buffer {
        return crypto.createHash("sha256").update(this.config).digest();
    }

    async #handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        const chunks: Buffer[] = [];
        for await (const chunk of request) {
            chunks.push(chunk as Buffer);
        }
        const body = Buffer.concat(chunks);
        const path = request.url ?? "";
        if (this.hang) {
            return;
        }

        const forced = this.#forced.find((entry) => entry.path === path && entry.remaining > 0);
        if (forced) {
            forced.remaining--;
            if (path === "/api/login/Basic") {
                this.logins.push(JSON.parse(body.toString("utf8")));
            } else if (path === "/tedapi/v1r") {
                this.#record(request, body);
            } else {
                this.gets.push({ path, authorization: request.headers.authorization });
            }
            this.#send(response, forced.status, Buffer.from(`forced ${forced.status}`));
            return;
        }
        if (request.method === "POST" && path === "/api/login/Basic") {
            this.#login(body, response);
        } else if (request.method === "POST" && path === "/tedapi/v1r") {
            await this.#v1r(request, body, response);
        } else if (request.method === "GET") {
            this.#get(path, request, response);
        } else {
            this.#send(response, 404, Buffer.alloc(0));
        }
    }

    #send(response: ServerResponse, status: number, body: Buffer): void {
        if (this.gzip) {
            body = zlib.gzipSync(body);
            if (this.gzipHeader) {
                response.setHeader("Content-Encoding", "gzip");
            }
        }
        response.writeHead(status, { "Content-Length": body.length });
        response.end(body);
    }

    #login(body: Buffer, response: ServerResponse): void {
        const login = JSON.parse(body.toString("utf8"));
        this.logins.push(login);
        if (this.loginReply) {
            this.#send(response, 200, this.loginReply);
            this.loginReply = undefined;
            return;
        }
        if (
            login.username !== "customer" ||
            login.email !== "customer@customer.domain" ||
            login.password !== this.password
        ) {
            this.#send(response, 401, Buffer.from('{"error":"bad credentials"}'));
            return;
        }
        const token = crypto.randomBytes(16).toString("hex");
        this.#tokens.add(token);
        this.#send(response, 200, Buffer.from(JSON.stringify({ token, loginTime: "2026-01-01T00:00:00Z" })));
    }

    #get(path: string, request: IncomingMessage, response: ServerResponse): void {
        const authorization = request.headers.authorization;
        this.gets.push({ path, authorization });
        if (!this.#tokens.has(authorization?.replace(/^Bearer /, "") ?? "")) {
            this.#send(response, 401, Buffer.alloc(0));
        } else if (path === "/tedapi/din") {
            this.#send(response, 200, Buffer.from(`${this.din}\n`));
        } else if (!this.rest.has(path)) {
            this.#send(response, 404, Buffer.alloc(0));
        } else {
            const reply = this.rest.get(path);
            this.#send(response, 200, Buffer.isBuffer(reply) ? reply : Buffer.from(JSON.stringify(reply)));
        }
    }

    #record(request: IncomingMessage, body: Buffer): RecordedPost {
        const message = RoutableMessage.decode(body);
        const envelopeBytes = Buffer.from(message.protobufMessageAsBytes ?? []);
        const post = {
            headers: request.headers,
            message,
            envelope: MessageEnvelope.decode(envelopeBytes),
            envelopeBytes,
        };
        this.posts.push(post);
        return post;
    }

    /** The bytes a sender with this DIN and expiry signed, by the protocol's TLV rules. */
    #signedData(envelope: Buffer, expiresAt: number): Buffer {
        const din = Buffer.from(this.din, "ascii");
        const expiry = Buffer.alloc(4);
        expiry.writeUInt32BE(expiresAt);
        return Buffer.concat([
            Buffer.from([0x00, 0x01, 0x07, 0x01, 0x01, 0x07, 0x02, din.length]),
            din,
            Buffer.from([0x04, 0x04]),
            expiry,
            Buffer.from([0xff]),
            envelope,
        ]);
    }

    #checkSignature(post: RecordedPost): MessageFaultE {
        const publicKeyDer = Buffer.from(post.message.signatureData?.signerIdentity?.publicKey ?? []);
        const rsa = post.message.signatureData?.rsaData;
        if (this.registeredKey && !publicKeyDer.equals(this.registeredKey)) {
            return MessageFaultE.MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID;
        }
        if (!rsa || publicKeyDer.length === 0) {
            return MessageFaultE.MESSAGEFAULT_ERROR_INVALID_SIGNATURE;
        }
        const key = crypto.createPublicKey({ key: publicKeyDer, format: "der", type: "pkcs1" });
        const valid = crypto.verify(
            "sha512",
            this.#signedData(post.envelopeBytes, rsa.expiresAt),
            { key, padding: crypto.constants.RSA_PKCS1_PADDING },
            rsa.signature,
        );
        if (!valid) {
            return MessageFaultE.MESSAGEFAULT_ERROR_INVALID_SIGNATURE;
        }
        return rsa.expiresAt <= this.now()
            ? MessageFaultE.MESSAGEFAULT_ERROR_TIME_EXPIRED
            : MessageFaultE.MESSAGEFAULT_ERROR_NONE;
    }

    async #v1r(request: IncomingMessage, body: Buffer, response: ServerResponse): Promise<void> {
        const post = this.#record(request, body);
        const fault = this.#checkSignature(post);
        // Taken in arrival order, before any hold, as `reply()` promises.
        const reply = this.#replies.shift();
        await this.holdReply?.(post.envelope);
        if (fault !== MessageFaultE.MESSAGEFAULT_ERROR_NONE) {
            this.#sendRoutable(response, { fault });
        } else if (reply === undefined) {
            const envelope = this.respond?.(post.envelope) ?? this.#act(post.envelope);
            this.#sendRoutable(response, { envelope });
        } else if ("dropConnection" in reply) {
            response.destroy();
        } else if ("raw" in reply) {
            this.#send(response, 200, reply.raw);
        } else {
            this.#sendRoutable(response, reply);
        }
    }

    #sendRoutable(
        response: ServerResponse,
        reply: { envelope: Json } | { inner: Uint8Array } | { noInner: true } | { fault: MessageFaultE },
    ): void {
        let inner: Uint8Array | undefined;
        if ("envelope" in reply) {
            inner = MessageEnvelope.encode(MessageEnvelope.create(reply.envelope as Partial<MessageEnvelope>)).finish();
        } else if ("inner" in reply) {
            inner = reply.inner;
        }
        const message = RoutableMessage.create({
            protobufMessageAsBytes: inner,
            signedMessageStatus: "fault" in reply ? { messageFault: reply.fault } : undefined,
        });
        this.#send(response, 200, Buffer.from(RoutableMessage.encode(message).finish()));
    }

    /** Do what the request asks, as far as a test needs: an empty acknowledgement unless overridden. */
    #act(envelope: MessageEnvelope): Json {
        const header = { recipient: { authorizedClient: 1 }, sender: { din: this.din } };
        const read = envelope.filestore?.readFileRequest;
        if (read) {
            const file = { name: read.name, blob: this.config };
            return { ...header, filestore: { readFileResponse: { file, hash: this.#hash() } } };
        }
        const update = envelope.filestore?.updateFileRequest;
        if (update) {
            if (!this.#hash().equals(Buffer.from(update.hash))) {
                return { ...header, common: { errorResponse: { status: { code: 10, message: "hash mismatch" } } } };
            }
            this.config = Buffer.from(update.file?.blob ?? []);
            this.configWrites.push({ hash: Buffer.from(update.hash), blob: this.config });
            return { ...header, filestore: { updateFileResponse: { hash: this.#hash() } } };
        }
        const query = envelope.graphql?.queryRequest;
        if (query) {
            const name = /query\s+(\w+)/.exec(Buffer.from(query.query).toString("utf8"))?.[1] ?? "";
            return { ...header, graphql: { queryResponse: { data: this.graphql[name] ?? "" } } };
        }
        if (envelope.common?.getSystemInfoRequest) {
            return { ...header, common: { getSystemInfoResponse: this.systemInfo } };
        }
        for (const category of ["teg", "authorization"] as const) {
            const request = Object.entries(envelope[category] ?? {}).find(([, value]) => value !== undefined)?.[0];
            if (request) {
                return { ...header, [category]: { [request.replace(/Request$/, "Response")]: {} } };
            }
        }
        return header;
    }
}
