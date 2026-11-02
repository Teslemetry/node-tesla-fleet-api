import crypto from "node:crypto";
import { MessageFaultE, RoutableMessage } from "@teslemetry/tesla-protocol/energy_device/signed_message";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    PowerwallAuthenticationError,
    PowerwallConnectionError,
    PowerwallFaultError,
    PowerwallProtocolError,
    PowerwallRateLimitError,
} from "../../src/powerwall/exceptions.js";
import { V1rTransport, type V1rTransportOptions } from "../../src/powerwall/transport.js";
import { rsa_public_der_pkcs1 } from "../../src/signing/keys.js";
import { GATEWAY_DIN, GATEWAY_PASSWORD, SIGNED_REQUEST_VECTOR, TEST_KEY_PEM } from "../fixtures/powerwall.js";
import { FakeGateway } from "../helpers/fakegateway.js";

const ENVELOPE = Buffer.from("2a03b20200", "hex");

let gateway: FakeGateway;
let transport: V1rTransport;

function transportFor(options: Partial<V1rTransportOptions> = {}): V1rTransport {
    return new V1rTransport({
        host: gateway.host,
        password: GATEWAY_PASSWORD,
        rsaPrivateKeyPem: TEST_KEY_PEM,
        ...options,
    });
}

beforeEach(async () => {
    gateway = await FakeGateway.start();
    transport = transportFor();
});

afterEach(async () => {
    transport.close();
    await gateway.stop();
});

describe("login", () => {
    it("sends the last 5 characters of the password", async () => {
        const token = await transport.login();

        expect(token).toEqual(expect.any(String));
        expect(transport.has_token).toBe(true);
        expect(gateway.logins).toEqual([
            {
                username: "customer",
                password: "KLMNO",
                email: "customer@customer.domain",
                clientInfo: { timezone: "America/Chicago" },
            },
        ]);
    });

    it("accepts a stored 5-character password", async () => {
        const stored = transportFor({ password: "KLMNO" });
        await stored.login();
        stored.close();
        expect(gateway.logins[0].password).toBe("KLMNO");
    });

    it("sends the full password to a legacy gateway", async () => {
        await gateway.stop();
        gateway = await FakeGateway.start({ password: GATEWAY_PASSWORD });
        const legacy = transportFor({ legacyGateway: true });
        await legacy.login();
        legacy.close();
        expect(gateway.logins[0].password).toBe(GATEWAY_PASSWORD);
    });

    it.each([
        [401, PowerwallAuthenticationError],
        [403, PowerwallAuthenticationError],
        [429, PowerwallRateLimitError],
        [503, PowerwallRateLimitError],
        [500, PowerwallProtocolError],
    ])("maps status %i", async (status, error) => {
        gateway.forceStatus("/api/login/Basic", status);
        await expect(transport.login()).rejects.toBeInstanceOf(error);
        expect(transport.has_token).toBe(false);
    });

    it("quotes the first 200 characters of an unexpected status", async () => {
        gateway.forceStatus("/api/login/Basic", 500);
        await expect(transport.login()).rejects.toThrow("Login failed (500): forced 500");
    });

    it("rejects a reply with no token", async () => {
        for (const body of ['{"loginTime":"now"}', '{"token":""}', "<html>"]) {
            gateway.loginReply = Buffer.from(body);
            await expect(transport.login()).rejects.toBeInstanceOf(PowerwallProtocolError);
        }
    });

    it("shares one request between concurrent callers", async () => {
        const [first, second] = await Promise.all([transport.login(), transport.login()]);
        expect(first).toBe(second);
        expect(gateway.logins).toHaveLength(1);
    });

    it("logs in again after a failed login", async () => {
        gateway.forceStatus("/api/login/Basic", 503);
        await expect(transport.login()).rejects.toBeInstanceOf(PowerwallRateLimitError);
        await expect(transport.login()).resolves.toEqual(expect.any(String));
    });

    it("maps a refused connection", async () => {
        await gateway.stop();
        await expect(transport.login()).rejects.toBeInstanceOf(PowerwallConnectionError);
        gateway = await FakeGateway.start();
    });
});

describe("REST reads", () => {
    it("fetches the DIN with the bearer token", async () => {
        const token = await transport.login();
        await expect(transport.fetch_din()).resolves.toBe(GATEWAY_DIN);
        expect(gateway.gets).toEqual([{ path: "/tedapi/din", authorization: `Bearer ${token}` }]);
    });

    it("logs in on first use", async () => {
        await expect(transport.api_get("/api/system_status/soe")).resolves.toEqual({ percentage: 52.77777777777778 });
        expect(gateway.logins).toHaveLength(1);
    });

    it("rejects an empty DIN", async () => {
        await gateway.stop();
        gateway = await FakeGateway.start({ din: "  " });
        const blank = transportFor();
        await expect(blank.fetch_din()).rejects.toBeInstanceOf(PowerwallProtocolError);
        blank.close();
    });

    it("parses JSON without checking the content type", async () => {
        gateway.rest.set("/api/x", Buffer.from('{"a":1}'));
        await expect(transport.api_get("/api/x")).resolves.toEqual({ a: 1 });
    });

    it("rejects a body that is not JSON", async () => {
        gateway.rest.set("/api/x", Buffer.from("<html>"));
        await expect(transport.api_get("/api/x")).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it.each([401, 403])("logs in again and retries once after %i", async (status) => {
        await transport.login();
        gateway.forceStatus("/api/system_status/soe", status);

        await expect(transport.api_get("/api/system_status/soe")).resolves.toHaveProperty("percentage");

        expect(gateway.logins).toHaveLength(2);
        const [first, second] = gateway.gets.map((get) => get.authorization);
        expect(second).toEqual(expect.stringMatching(/^Bearer /));
        expect(second).not.toBe(first);
    });

    it("recovers from an expired token", async () => {
        await transport.login();
        gateway.expireTokens();
        await expect(transport.api_get("/api/system_status/soe")).resolves.toHaveProperty("percentage");
        expect(gateway.logins).toHaveLength(2);
    });

    it.each([401, 403])("raises authentication on a second %i", async (status) => {
        await transport.login();
        gateway.forceStatus("/api/system_status/soe", status, 2);

        await expect(transport.api_get("/api/system_status/soe")).rejects.toBeInstanceOf(PowerwallAuthenticationError);

        expect(gateway.gets).toHaveLength(2);
        expect(gateway.logins).toHaveLength(2);
    });

    it.each([
        [429, PowerwallRateLimitError],
        [503, PowerwallRateLimitError],
        [500, PowerwallProtocolError],
        [404, PowerwallProtocolError],
    ])("maps status %i", async (status, error) => {
        await transport.login();
        gateway.forceStatus("/api/system_status/soe", status);
        await expect(transport.api_get("/api/system_status/soe")).rejects.toBeInstanceOf(error);
        expect(gateway.logins).toHaveLength(1);
    });
});

describe("gzip", () => {
    it.each([true, false])("decompresses every body (Content-Encoding header: %s)", async (gzipHeader) => {
        gateway.gzip = true;
        gateway.gzipHeader = gzipHeader;
        gateway.reply({ inner: ENVELOPE });

        await expect(transport.fetch_din()).resolves.toBe(GATEWAY_DIN);
        await expect(transport.api_get("/api/system_status/soe")).resolves.toHaveProperty("percentage");
        expect(Buffer.from(await transport.post_v1r(ENVELOPE, GATEWAY_DIN))).toEqual(ENVELOPE);
    });

    it("keeps the raw bytes when gunzip fails", async () => {
        gateway.reply({ raw: Buffer.from([0x1f, 0x8b, 0x00, 0x01]) });
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toThrow("Malformed RoutableMessage");
    });
});

describe("post_v1r", () => {
    it("sends no bearer token and no cookie, even after a login", async () => {
        await transport.login();
        gateway.reply({ inner: ENVELOPE });

        await transport.post_v1r(ENVELOPE, GATEWAY_DIN);

        const { headers } = gateway.posts[0];
        expect(headers.authorization).toBeUndefined();
        expect(headers.cookie).toBeUndefined();
        expect(headers["content-type"]).toBe("application/octet-stream");
        expect(headers["accept-encoding"]).toBe("gzip");
    });

    it("needs no login", async () => {
        gateway.reply({ inner: ENVELOPE });
        await transport.post_v1r(ENVELOPE, GATEWAY_DIN);
        expect(gateway.logins).toHaveLength(0);
    });

    it("passes the fake gateway's own signature check", async () => {
        gateway.registeredKey = rsa_public_der_pkcs1(TEST_KEY_PEM);
        gateway.reply({ inner: ENVELOPE });
        expect(Buffer.from(await transport.post_v1r(ENVELOPE, GATEWAY_DIN))).toEqual(ENVELOPE);
    });

    it("fails the signature check for a different DIN", async () => {
        await expect(transport.post_v1r(ENVELOPE, "1232100-00-E--TG000000000000")).rejects.toMatchObject({
            fault: "MESSAGEFAULT_ERROR_INVALID_SIGNATURE",
        });
    });

    it("expires a signed request after 12 seconds", async () => {
        gateway.now = () => Date.now() / 1000 + 14;
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toMatchObject({
            fault: "MESSAGEFAULT_ERROR_TIME_EXPIRED",
        });
    });

    it.each([
        [401, PowerwallAuthenticationError],
        [403, PowerwallAuthenticationError],
        [429, PowerwallRateLimitError],
        [503, PowerwallRateLimitError],
        [500, PowerwallProtocolError],
    ])("sends once and maps status %i", async (status, error) => {
        gateway.forceStatus("/tedapi/v1r", status);
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toBeInstanceOf(error);
        expect(gateway.posts).toHaveLength(1);
        expect(gateway.logins).toHaveLength(0);
    });

    it("rejects a body that is not a RoutableMessage", async () => {
        gateway.reply({ raw: Buffer.from("not protobuf") });
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toBeInstanceOf(PowerwallProtocolError);
    });

    it("treats an unknown key as an authentication failure", async () => {
        gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID });
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toBeInstanceOf(PowerwallAuthenticationError);
    });

    it("rejects a key the gateway does not hold", async () => {
        gateway.registeredKey = Buffer.from("another key");
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toBeInstanceOf(PowerwallAuthenticationError);
    });

    it("names any other fault", async () => {
        gateway.reply({ fault: MessageFaultE.MESSAGEFAULT_ERROR_BUSY });
        const error = await transport.post_v1r(ENVELOPE, GATEWAY_DIN).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(PowerwallFaultError);
        expect((error as PowerwallFaultError).fault).toBe("MESSAGEFAULT_ERROR_BUSY");
    });

    it("survives a fault number it does not know", async () => {
        gateway.reply({ fault: 999 as MessageFaultE });
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toMatchObject({
            fault: "UNRECOGNIZED_FAULT_999",
        });
    });

    it.each(["v1r: client authorization not verified", "Client Authorization NOT Verified", "AUTHORIZATION NOT VERIFIED"])(
        "treats the placeholder %j as an authentication failure",
        async (placeholder) => {
            gateway.reply({ inner: Buffer.from(placeholder) });
            await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toBeInstanceOf(PowerwallAuthenticationError);
        },
    );

    it("rejects an empty inner message", async () => {
        gateway.reply({ noInner: true });
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toThrow("RoutableMessage response is empty");
    });

    it("maps a dropped connection and does not resend", async () => {
        gateway.reply({ dropConnection: true });
        await expect(transport.post_v1r(ENVELOPE, GATEWAY_DIN)).rejects.toBeInstanceOf(PowerwallConnectionError);
        expect(gateway.posts).toHaveLength(1);
    });
});

describe("timeouts", () => {
    it.each([
        ["login", () => transport.login()],
        ["GET", () => transport.fetch_din()],
        ["v1r", () => transport.post_v1r(ENVELOPE, GATEWAY_DIN)],
    ])("maps a %s timeout", async (_name, call) => {
        transport.close();
        transport = transportFor({ timeoutMs: 50 });
        gateway.hang = true;
        const error = await call().catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(PowerwallConnectionError);
        expect((error as Error).message).toContain("timed out");
    });
});

describe("private key", () => {
    it.each(["not a pem", "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n"])("rejects %j", (pem) => {
        expect(() => transportFor({ rsaPrivateKeyPem: pem })).toThrow(PowerwallAuthenticationError);
    });

    it("rejects a key that is not RSA", () => {
        const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
        const pem = privateKey.export({ type: "pkcs8", format: "pem" });
        expect(() => transportFor({ rsaPrivateKeyPem: pem })).toThrow(PowerwallAuthenticationError);
    });

    it("loads a PKCS#1 PEM from a Buffer", () => {
        const pkcs1 = crypto.createPrivateKey(TEST_KEY_PEM).export({ type: "pkcs1", format: "pem" });
        transportFor({ rsaPrivateKeyPem: Buffer.from(pkcs1) }).close();
    });
});

describe("secrets", () => {
    it("exposes no secret on the instance", async () => {
        const token = await transport.login();
        const serialized = JSON.stringify(transport);
        expect(serialized).not.toContain(token);
        expect(serialized).not.toContain("KLMNO");
        expect(Object.keys(transport)).toEqual([]);
    });
});

describe("signed request vector", () => {
    beforeEach(() => {
        gateway.now = () => SIGNED_REQUEST_VECTOR.now;
    });

    async function postVector() {
        gateway.reply({ inner: ENVELOPE });
        const { now, messageUuid, envelope } = SIGNED_REQUEST_VECTOR;
        const inner = await transport.post_v1r(envelope, GATEWAY_DIN, { now, messageUuid });
        const { message } = gateway.posts[0];
        return { inner, message };
    }

    it("matches Python's bytes", async () => {
        const { inner, message } = await postVector();
        expect(Buffer.from(RoutableMessage.encode(message).finish())).toEqual(SIGNED_REQUEST_VECTOR.expected);
        expect(Buffer.from(inner)).toEqual(ENVELOPE);
    });

    it("carries a 12 second TTL", async () => {
        const { message } = await postVector();
        expect(message.signatureData?.rsaData?.expiresAt).toBe(1_790_000_001 + 12);
    });
});
