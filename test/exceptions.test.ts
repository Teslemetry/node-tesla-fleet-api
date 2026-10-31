import { afterEach, describe, expect, it, vi } from "vitest";
import * as exceptions from "../src/exceptions.js";
import * as library from "../src/index.js";
import TeslaFleetApi from "../src/teslafleetapi.js";
import {
    BadGateway,
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothUnconfirmedCommand,
    ClientClosedRequest,
    CouldNotRetrieveKeyFault,
    DeviceUnexpectedResponse,
    EnergyGatewayUnreachable,
    Forbidden,
    GatewayTimeout,
    InsufficientCredits,
    InternalServerError,
    InvalidAuthCode,
    InvalidCommand,
    InvalidField,
    InvalidMethod,
    InvalidRedirectUrl,
    InvalidRegion,
    InvalidRequest,
    InvalidResource,
    InvalidResponse,
    InvalidScope,
    InvalidTeslemetryToken,
    InvalidTessieToken,
    LibraryError,
    Locked,
    LoginRequired,
    MissingTeslemetryToken,
    MissingTessieToken,
    MobileAccessDisabled,
    NotAcceptable,
    NotAllowed,
    NotFound,
    NotOnWhitelistFault,
    OAuthExpired,
    PaymentRequired,
    PreconditionFailed,
    PrivateKeyError,
    RateLimited,
    ResourceUnavailableForLegalReasons,
    ResponseError,
    ServiceUnavailable,
    SignedMessageInformationFaultCouldNotRetrieveKey,
    SignedMessageInformationFaultNotOnWhitelist,
    SignedMessageInformationFaultTimeExpired,
    SigningDisabled,
    SubscriptionRequired,
    TeslaFleetConnectionError,
    TeslaFleetError,
    TeslaFleetMessageFaultInactiveKey,
    TeslaFleetMessageFaultInvalidKeyHandle,
    TeslaFleetMessageFaultKeychainIsFull,
    TeslaFleetMessageFaultUnknownKeyId,
    TimeExpiredFault,
    UnauthorizedClient,
    UnsupportedVehicle,
    VehicleOffline,
    VehicleSubscriptionRequired,
    WHITELIST_OPERATION_STATUS,
    WhitelistOperationStatus,
    is_key_rejected,
    raise_for_status,
} from "../src/exceptions.js";

/** Every class name in python-tesla-fleet-api's `tesla_fleet_api/exceptions.py`. */
const PYTHON_CLASS_NAMES = [
    "TeslaFleetError",
    "BluetoothTimeout",
    "BluetoothUnconfirmedCommand",
    "BluetoothCommandFailed",
    "BluetoothTransportError",
    "ResponseError",
    "InvalidCommand",
    "InvalidField",
    "InvalidRequest",
    "InvalidAuthCode",
    "InvalidRedirectUrl",
    "UnauthorizedClient",
    "MobileAccessDisabled",
    "MissingToken",
    "MissingTeslemetryToken",
    "MissingTessieToken",
    "InvalidToken",
    "InvalidTeslemetryToken",
    "InvalidTessieToken",
    "OAuthInvalid",
    "OAuthExpired",
    "TeslemetryRegistrationError",
    "LoginRequired",
    "PaymentRequired",
    "SubscriptionRequired",
    "VehicleSubscriptionRequired",
    "InsufficientCredits",
    "Forbidden",
    "InvalidScope",
    "UnsupportedVehicle",
    "NotFound",
    "InvalidMethod",
    "NotAllowed",
    "NotAcceptable",
    "VehicleOffline",
    "PreconditionFailed",
    "InvalidRegion",
    "InvalidResource",
    "Locked",
    "InvalidResponse",
    "RateLimited",
    "ResourceUnavailableForLegalReasons",
    "ClientClosedRequest",
    "InternalServerError",
    "BadGateway",
    "EnergyGatewayUnreachable",
    "ServiceUnavailable",
    "GatewayTimeout",
    "DeviceUnexpectedResponse",
    "LibraryError",
    "SigningDisabled",
    "PrivateKeyError",
    "SignedCommandRequired",
    "AuthorizedClientPairingTimedOut",
    "AuthorizedClientWaitExpired",
    "SessionInfoAuthenticationFault",
    "SignedCommandResponseReplayed",
    "TeslaFleetInformationFault",
    "UnknownFault",
    "NotOnWhitelistFault",
    "IVSmallerThanExpectedFault",
    "InvalidTokenFault",
    "TokenAndCounterInvalidFault",
    "AESDecryptAuthFault",
    "ECDSAInputFault",
    "ECDSASignatureFault",
    "LocalEntityStartFault",
    "LocalEntityResultFault",
    "CouldNotRetrieveKeyFault",
    "CouldNotRetrieveTokenFault",
    "SignatureTooShortFault",
    "TokenIsIncorrectLengthFault",
    "IncorrectEpochFault",
    "IVIncorrectLengthFault",
    "TimeExpiredFault",
    "NotProvisionedWithIdentityFault",
    "CouldNotHashMetadataFault",
    "TeslaFleetMessageFault",
    "TeslaFleetMessageFaultBusy",
    "TeslaFleetMessageFaultTimeout",
    "TeslaFleetMessageFaultUnknownKeyId",
    "TeslaFleetMessageFaultInactiveKey",
    "TeslaFleetMessageFaultInvalidSignature",
    "TeslaFleetMessageFaultInvalidTokenOrCounter",
    "TeslaFleetMessageFaultInsufficientPrivileges",
    "TeslaFleetMessageFaultInvalidDomains",
    "TeslaFleetMessageFaultInvalidCommand",
    "TeslaFleetMessageFaultDecoding",
    "TeslaFleetMessageFaultInternal",
    "TeslaFleetMessageFaultWrongPersonalization",
    "TeslaFleetMessageFaultBadParameter",
    "TeslaFleetMessageFaultKeychainIsFull",
    "TeslaFleetMessageFaultIncorrectEpoch",
    "TeslaFleetMessageFaultIVIncorrectLength",
    "TeslaFleetMessageFaultTimeExpired",
    "TeslaFleetMessageFaultNotProvisionedWithIdentity",
    "TeslaFleetMessageFaultCouldNotHashMetadata",
    "TeslaFleetMessageFaultTimeToLiveTooLong",
    "TeslaFleetMessageFaultRemoteAccessDisabled",
    "TeslaFleetMessageFaultRemoteServiceAccessDisabled",
    "TeslaFleetMessageFaultCommandRequiresAccountCredentials",
    "TeslaFleetMessageFaultFieldExceedsMTU",
    "TeslaFleetMessageFaultResponseSizeExceedsMTU",
    "TeslaFleetMessageFaultRepeatedCounter",
    "TeslaFleetMessageFaultInvalidKeyHandle",
    "TeslaFleetMessageFaultRequiresResponseEncryption",
    "SignedMessageInformationFault",
    "SignedMessageInformationFaultUnknown",
    "SignedMessageInformationFaultNotOnWhitelist",
    "SignedMessageInformationFaultIVSmallerThanExpected",
    "SignedMessageInformationFaultInvalidToken",
    "SignedMessageInformationFaultTokenAndCounterInvalid",
    "SignedMessageInformationFaultAESDecryptAuth",
    "SignedMessageInformationFaultECDSAInput",
    "SignedMessageInformationFaultECDSASignature",
    "SignedMessageInformationFaultLocalEntityStart",
    "SignedMessageInformationFaultLocalEntityResult",
    "SignedMessageInformationFaultCouldNotRetrieveKey",
    "SignedMessageInformationFaultCouldNotRetrieveToken",
    "SignedMessageInformationFaultSignatureTooShort",
    "SignedMessageInformationFaultTokenIsIncorrectLength",
    "SignedMessageInformationFaultIncorrectEpoch",
    "SignedMessageInformationFaultIVIncorrectLength",
    "SignedMessageInformationFaultTimeExpired",
    "SignedMessageInformationFaultNotProvisionedWithIdentity",
    "SignedMessageInformationFaultCouldNotHashMetadata",
    "WhitelistOperationStatus",
    "WhitelistOperationUndocumentedError",
    "WhitelistOperationNoPermissionToRemoveOneself",
    "WhitelistOperationKeyfobSlotsFull",
    "WhitelistOperationWhitelistFull",
    "WhitelistOperationNoPermissionToAdd",
    "WhitelistOperationInvalidPublicKey",
    "WhitelistOperationNoPermissionToRemove",
    "WhitelistOperationNoPermissionToChangePermissions",
    "WhitelistOperationAttemptingToElevateOthersAboveOneself",
    "WhitelistOperationAttemptingToDemoteSuperiorToOneself",
    "WhitelistOperationAttemptingToRemoveOwnPermissions",
    "WhitelistOperationPublicKeyNotOnWhitelist",
    "WhitelistOperationAttemptingToAddExistingKey",
    "WhitelistOperationNotAllowedToAddUnlessOnReader",
    "WhitelistOperationFMModifyingOutsideOfFMode",
    "WhitelistOperationFMAttemptingToAddPermanentKey",
    "WhitelistOperationFMAttemptingToRemovePermanentKey",
    "WhitelistOperationKeychainWhileFSFull",
    "WhitelistOperationAttemptingToAddKeyWithoutRole",
    "WhitelistOperationAttemptingToAddKeyWithServiceRole",
    "WhitelistOperationNonServiceKeyAttemptingToAddServiceTech",
    "WhitelistOperationServiceKeyAttemptingToAddServiceTechOutsideServiceMode",
    "WhitelistOperationCouldNotStartLocalEntityAuth",
    "WhitelistOperationLocalEntityAuthFailedUIDenied",
    "WhitelistOperationLocalEntityAuthFailedTimedOutWaitingForTap",
    "WhitelistOperationLocalEntityAuthFailedTimedOutWaitingForUIAck",
    "WhitelistOperationLocalEntityAuthFailedValetMode",
    "WhitelistOperationLocalEntityAuthFailedCancelled"
];

type ErrorClass = new (...args: any[]) => Error;

function instantiate(cls: ErrorClass): Error {
    return cls === (PrivateKeyError as ErrorClass) ? new PrivateKeyError("malformed", "bad pem") : new cls();
}

function response(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
    if (body === undefined) {
        return new Response(null, { status, headers });
    }
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

async function thrownBy(resp: Response): Promise<unknown> {
    return raise_for_status(resp).then(
        () => undefined,
        (error: unknown) => error,
    );
}

class RequestTestApi extends TeslaFleetApi {
    constructor() {
        super({ server: "https://fleet.example.com", accessToken: "access-token" });
    }
}

function stubFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
    const fetchMock = vi.fn(impl);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

async function requestError(path: string): Promise<unknown> {
    return new RequestTestApi()._request("GET", path).then(
        () => undefined,
        (error: unknown) => error,
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("exception classes", () => {
    it("exports every class name in Python exceptions.py, from the module and the package root", () => {
        expect(PYTHON_CLASS_NAMES).toHaveLength(155);
        for (const name of PYTHON_CLASS_NAMES) {
            expect(exceptions, name).toHaveProperty(name);
            expect(library, name).toHaveProperty(name);
        }
    });

    it("makes every exported class a real Error subclass named after itself", () => {
        for (const name of [...PYTHON_CLASS_NAMES, "TeslaFleetConnectionError", "BluetoothCloudUnavailableError"]) {
            const cls = (exceptions as unknown as Record<string, ErrorClass>)[name];
            const error = instantiate(cls);
            expect(error, name).toBeInstanceOf(Error);
            expect(error.name, name).toBe(name);
            if (error instanceof TeslaFleetError) {
                expect(error.message, name).toBe((cls as unknown as typeof TeslaFleetError).message);
            }
        }
    });

    it("copies the Python class attributes onto instances", () => {
        const error = new InvalidCommand({ error: "invalid_command" });
        expect(error.message).toBe(InvalidCommand.message);
        expect(error.status).toBe(400);
        expect(error.key).toBe("invalid_command");
        expect(error.data).toEqual({ error: "invalid_command" });
        expect(new NotOnWhitelistFault().code).toBe(2);
        expect(new ResponseError("<html>", 418).status).toBe(418);
    });

    it("has 28 distinct WhitelistOperation* classes indexed by their protobuf code", () => {
        const classes = Object.entries(exceptions).filter(
            ([name, value]) =>
                name.startsWith("WhitelistOperation") && name !== "WhitelistOperationStatus" && typeof value === "function",
        );
        expect(classes).toHaveLength(28);
        expect(WHITELIST_OPERATION_STATUS).toHaveLength(29);
        expect(WHITELIST_OPERATION_STATUS[0]).toBeNull();
        WHITELIST_OPERATION_STATUS.slice(1).forEach((cls, index) => {
            expect(cls!.code).toBe(index + 1);
            expect(new cls!()).toBeInstanceOf(WhitelistOperationStatus);
        });
        expect(new Set(WHITELIST_OPERATION_STATUS.slice(1)).size).toBe(28);
    });

    it("keeps Python's parents for Bluetooth and library errors", () => {
        expect(new BluetoothTimeout()).toBeInstanceOf(TeslaFleetError);
        expect(new BluetoothCommandFailed()).toBeInstanceOf(TeslaFleetError);
        expect(new BluetoothCommandFailed()).not.toBeInstanceOf(BluetoothTimeout);
        expect(new BluetoothUnconfirmedCommand()).toBeInstanceOf(BluetoothTimeout);
        expect(new BluetoothUnconfirmedCommand().unconfirmed).toBe(true);
        expect(new SigningDisabled()).toBeInstanceOf(LibraryError);
        expect(new SigningDisabled()).not.toBeInstanceOf(TeslaFleetError);
        expect(new PrivateKeyError("encrypted", "needs a passphrase").reason).toBe("encrypted");
    });
});

describe("is_key_rejected", () => {
    it("is true for every key-rejection fault", () => {
        for (const cls of [
            NotOnWhitelistFault,
            SignedMessageInformationFaultNotOnWhitelist,
            CouldNotRetrieveKeyFault,
            SignedMessageInformationFaultCouldNotRetrieveKey,
            TeslaFleetMessageFaultUnknownKeyId,
            TeslaFleetMessageFaultInactiveKey,
            TeslaFleetMessageFaultInvalidKeyHandle,
        ]) {
            expect(is_key_rejected(new cls()), cls.name).toBe(true);
        }
    });

    it("is false for a full keychain, which means no room to add a key, not a rejected key", () => {
        expect(is_key_rejected(new TeslaFleetMessageFaultKeychainIsFull())).toBe(false);
    });

    it("is false for unrelated faults", () => {
        expect(is_key_rejected(new TimeExpiredFault())).toBe(false);
        expect(is_key_rejected(new SignedMessageInformationFaultTimeExpired())).toBe(false);
    });

    it("is false for transport errors", () => {
        expect(is_key_rejected(new BluetoothTimeout())).toBe(false);
        expect(is_key_rejected(new TypeError("fetch failed"))).toBe(false);
        expect(is_key_rejected(undefined)).toBe(false);
    });
});

describe("raise_for_status", () => {
    it("resolves for a non-error status", async () => {
        await expect(raise_for_status(response(200, { response: true }))).resolves.toBeUndefined();
        await expect(raise_for_status(response(302))).resolves.toBeUndefined();
    });

    const cases: [number, string | undefined, ErrorClass][] = [
        [400, "invalid_command", InvalidCommand],
        [400, "invalid_field", InvalidField],
        [400, "invalid_request", InvalidRequest],
        [400, "invalid_auth_code", InvalidAuthCode],
        [400, "invalid_redirect_url", InvalidRedirectUrl],
        [400, "unauthorized_client", UnauthorizedClient],
        [400, "something_else", InvalidRequest],
        [400, undefined, InvalidRequest],
        [401, "token expired (401)", OAuthExpired],
        [401, "mobile_access_disabled", MobileAccessDisabled],
        [401, "login_required", LoginRequired],
        [401, "missing_token", MissingTeslemetryToken],
        [401, "Access token is required", MissingTessieToken],
        [401, "invalid_token", InvalidTeslemetryToken],
        [401, "Invalid access token", InvalidTessieToken],
        [401, "something_else", OAuthExpired],
        [401, undefined, OAuthExpired],
        [402, "subscription_required", SubscriptionRequired],
        [402, "vehicle_subscription_required", VehicleSubscriptionRequired],
        [402, "insufficient_credits", InsufficientCredits],
        [402, undefined, PaymentRequired],
        [403, "invalid_scope", InvalidScope],
        [403, "unsupported vehicle", UnsupportedVehicle],
        [403, undefined, Forbidden],
        [404, undefined, NotFound],
        [405, "invalid_method", InvalidMethod],
        [405, undefined, NotAllowed],
        [406, undefined, NotAcceptable],
        [408, undefined, VehicleOffline],
        [412, undefined, PreconditionFailed],
        [421, undefined, InvalidRegion],
        [422, undefined, InvalidResource],
        [423, undefined, Locked],
        [424, undefined, InvalidResponse],
        [429, undefined, RateLimited],
        [451, undefined, ResourceUnavailableForLegalReasons],
        [499, undefined, ClientClosedRequest],
        [500, undefined, InternalServerError],
        [502, "energy_gateway_unreachable", EnergyGatewayUnreachable],
        [502, "proxy_failed", BadGateway],
        [502, undefined, BadGateway],
        [503, undefined, ServiceUnavailable],
        [504, undefined, GatewayTimeout],
        [540, undefined, DeviceUnexpectedResponse],
    ];

    it.each(cases)("%i with error %j throws %o", async (status, key, cls) => {
        const body = key === undefined ? { response: null } : { response: null, error: key };
        const error = await thrownBy(response(status, body));
        expect(error).toBeInstanceOf(TeslaFleetError);
        expect((error as Error).constructor).toBe(cls);
        expect((error as TeslaFleetError).status).toBe(status);
    });

    it("keeps the decoded body as data", async () => {
        const body = { response: null, error: "invalid_field", error_description: "bad" };
        const error = (await thrownBy(response(400, body))) as TeslaFleetError;
        expect(error.data).toEqual(body);
    });

    it("reports rate-limit headers as data on 429", async () => {
        const error = (await thrownBy(
            response(429, { error: "rate limited" }, { "RateLimit-Reset": "30", "Retry-After": "31" }),
        )) as RateLimited;
        expect(error.data).toEqual({ reset: "30", after: "31" });
    });

    it("classifies a JSON body with a charset parameter", async () => {
        const resp = new Response(JSON.stringify({ error: "invalid_scope" }), {
            status: 403,
            headers: { "Content-Type": "application/json; charset=utf-8" },
        });
        expect(await thrownBy(resp)).toBeInstanceOf(InvalidScope);
    });

    it("classifies a non-JSON body by status alone", async () => {
        const resp = new Response("<html>Bad Gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } });
        const error = (await thrownBy(resp)) as BadGateway;
        expect(error.constructor).toBe(BadGateway);
        expect(error.data).toBeNull();
    });

    it("throws ResponseError with the text body for an unlisted status without JSON", async () => {
        const resp = new Response("I'm a teapot", { status: 418, headers: { "Content-Type": "text/plain" } });
        const error = (await thrownBy(resp)) as ResponseError;
        expect(error).toBeInstanceOf(ResponseError);
        expect(error.status).toBe(418);
        expect(error.data).toBe("I'm a teapot");
    });

    it("throws a plain TeslaFleetError for an unlisted status with JSON", async () => {
        const error = (await thrownBy(response(418, { error: "teapot" }))) as TeslaFleetError;
        expect(error.constructor).toBe(TeslaFleetError);
        expect(error.status).toBe(418);
        expect(error.data).toEqual({ error: "teapot" });
    });
});

describe("_request", () => {
    it("returns the decoded body on success", async () => {
        stubFetch(async () => new Response(JSON.stringify({ response: [] }), { status: 200 }));
        await expect(new RequestTestApi()._request("GET", "api/1/products")).resolves.toEqual({ response: [] });
    });

    it("throws InternalServerError with status 500 for an HTML 500", async () => {
        stubFetch(async () => new Response("<html>oops</html>", { status: 500, headers: { "Content-Type": "text/html" } }));
        const error = (await requestError("api/1/products")) as InternalServerError;
        expect(error).toBeInstanceOf(InternalServerError);
        expect(error.status).toBe(500);
    });

    it("throws ResponseError for a successful response whose body is not JSON", async () => {
        stubFetch(async () => new Response("<html>ok</html>", { status: 200, headers: { "Content-Type": "text/html" } }));
        const error = (await requestError("api/1/products")) as ResponseError;
        expect(error).toBeInstanceOf(ResponseError);
        expect(error.status).toBe(200);
        expect(error.data).toBe("<html>ok</html>");
    });

    it("wraps a fetch rejection in TeslaFleetConnectionError, keeping the cause", async () => {
        const cause = new TypeError("fetch failed");
        stubFetch(async () => {
            throw cause;
        });
        const error = (await requestError("api/1/products")) as TeslaFleetConnectionError;
        expect(error).toBeInstanceOf(TeslaFleetConnectionError);
        expect(error).toBeInstanceOf(TeslaFleetError);
        expect(error.cause).toBe(cause);
    });

    it("wraps a timeout in TeslaFleetConnectionError", async () => {
        stubFetch(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason));
                }),
        );
        const api = new RequestTestApi();
        api.timeout = 10;
        const error = await api._request("GET", "api/1/products").catch((e: unknown) => e);
        expect(error).toBeInstanceOf(TeslaFleetConnectionError);
        expect(((error as Error).cause as Error).name).toBe("TimeoutError");
    });

    // Ported from python-tesla-fleet-api tests/test_bad_gateway_classification.py:
    // a 502 is always a TeslaFleetError, whatever the body or endpoint.
    describe("502 classification", () => {
        it("raises BadGateway for a JSON-bodied 502", async () => {
            stubFetch(async () => response(502, { error: "gateway unreachable" }));
            expect(await requestError("api/1/energy_sites/123/command/add_authorized_client")).toBeInstanceOf(BadGateway);
        });

        it("raises BadGateway for a bodyless 502", async () => {
            stubFetch(async () => new Response("", { status: 502, headers: { "Content-Type": "text/plain" } }));
            expect(await requestError("api/1/energy_sites/123/command/authorized_clients")).toBeInstanceOf(BadGateway);
        });

        it("raises BadGateway for a non-gateway endpoint", async () => {
            stubFetch(async () => response(502, { error: "upstream error" }));
            expect(await requestError("api/1/vehicles/123/vehicle_data")).toBeInstanceOf(BadGateway);
        });

        it("raises the keyed EnergyGatewayUnreachable subclass", async () => {
            stubFetch(async () => response(502, { error: "energy_gateway_unreachable" }));
            const error = await requestError("api/1/energy_sites/123/live_status");
            expect(error).toBeInstanceOf(EnergyGatewayUnreachable);
            expect(error).toBeInstanceOf(BadGateway);
        });

        it.each(["proxy_failed", "upstream_error"])("raises plain BadGateway for %s", async (key) => {
            stubFetch(async () => response(502, { error: key }));
            const error = await requestError("api/1/energy_sites/123/live_status");
            expect((error as Error).constructor).toBe(BadGateway);
        });
    });
});
