/**
 * Every error this library raises, ported class-for-class from
 * `python-tesla-fleet-api`'s `exceptions.py` so a Python caller's
 * `except X` maps one-to-one onto a JavaScript `instanceof X`.
 *
 * Each class carries its Python class attributes (`message`, `status`,
 * `key`, `code`) as static fields, and every instance copies them, so both
 * `err.status` and `InvalidCommand.key` work.
 */

/** The body or detail attached to an error: decoded JSON, raw text, or nothing. */
export type TeslaFleetErrorData = Record<string, unknown> | string | null;

/**
 * Base class for all Tesla exceptions.
 */
export class TeslaFleetError extends Error {
    static readonly message: string = "An unknown error has occurred.";
    static readonly status: number | null = null;
    static readonly key: string | null = null;
    static readonly code: number | null = null;

    readonly data: TeslaFleetErrorData;
    readonly status: number | null;
    readonly key: string | null;
    readonly code: number | null;

    constructor(data: TeslaFleetErrorData = null, status: number | null = null, options?: ErrorOptions) {
        const cls = new.target as typeof TeslaFleetError;
        super(cls.message, options);
        this.name = cls.name;
        this.data = data;
        this.status = status || cls.status;
        this.key = cls.key;
        this.code = cls.code;
    }
}

/**
 * A request to the API could not be completed: `fetch` rejected (DNS,
 * refused connection, TLS, reset) or the request timed out. The underlying
 * error is kept as `cause`.
 */
export class TeslaFleetConnectionError extends TeslaFleetError {
    static override readonly message: string = "Could not connect to the API.";
}

/**
 * A cloud REST call was made on a vehicle that is only reachable over Bluetooth.
 */
export class BluetoothCloudUnavailableError extends TeslaFleetError {
    static override readonly message: string = "This vehicle is only reachable over Bluetooth; the cloud API is unavailable.";
}

/**
 * Bluetooth command timed out waiting for vehicle response.
 */
export class BluetoothTimeout extends TeslaFleetError {
    static override readonly message: string = "Bluetooth command timed out waiting for vehicle response.";
}

/**
 * A mutating Bluetooth command has an unresolved outcome.
 *
 * The write either completed and its ack was lost, or it entered backend I/O
 * and then failed/timed out in a way that cannot prove whether the vehicle
 * received it. It can also have acknowledged the request without a required
 * physical state check confirming completion. The vehicle may have executed
 * the command - lock/unlock have both been observed to execute despite this
 * error. Treat the outcome as unknown, not failed: verify by reading state
 * back when possible, and never blind-retry or re-issue the same command on
 * another transport, since it may already have run.
 *
 * Extends `BluetoothTimeout` so existing `instanceof BluetoothTimeout`
 * handling still catches it, while remaining distinguishable from it (and
 * from `BluetoothTransportError`, the provable pre-submission transport
 * failure) via `unconfirmed` - e.g. a BLE-primary/cloud-fallback router should
 * not fail over on this error, since failing over risks double-executing the
 * command.
 */
export class BluetoothUnconfirmedCommand extends BluetoothTimeout {
    static override readonly message: string =
        "Bluetooth command outcome could not be confirmed after submission; it may have executed anyway.";

    readonly unconfirmed = true;
}
/**
 * A mutating Bluetooth command was proven NOT to have taken effect.
 *
 * Unlike `BluetoothUnconfirmedCommand` (ack lost, outcome unknown), this
 * means a state check - a `confirmation="verify"` post-timeout read, or
 * the vehicle's own status broadcast still showing a different value once
 * the whole confirmation window elapsed - actively contradicted the
 * requested end state. That makes it safe to fail over: a router replaying the
 * command on a fallback transport is not at risk of double-executing an
 * already-applied command, because this one demonstrably did not apply.
 * Deliberately does NOT subclass `BluetoothTimeout`/
 * `BluetoothUnconfirmedCommand` so a fallback router's per-command
 * failover (which only special-cases the ambiguous case) treats it like any
 * other ordinary failure and tries the next backend.
 */
export class BluetoothCommandFailed extends TeslaFleetError {
    static override readonly message: string = "Bluetooth command was proven not to have taken effect.";
}

/**
 * The Bluetooth transport failed provably before the write reached the vehicle.
 *
 * Covers connect, notify-subscribe, and GATT characteristic-resolution
 * failures - all raised by the local BLE stack before any bytes go out over
 * the air, so a fallback router can safely retry the same command
 * elsewhere. A GATT write that entered backend I/O and then failed or timed
 * out is delivery-ambiguous instead (the write may have reached the
 * vehicle) and raises `BluetoothTimeout`/`BluetoothUnconfirmedCommand`,
 * not this class - see those exceptions.
 */
export class BluetoothTransportError extends TeslaFleetError {
    static override readonly message: string = "The Bluetooth transport failed before a vehicle response could be awaited.";
}

/**
 * The response from the server was not JSON.
 */
export class ResponseError extends TeslaFleetError {
    static override readonly message: string = "The response from the server was not JSON.";
}

/**
 * The data request or command is unknown.
 */
export class InvalidCommand extends TeslaFleetError {
    static override readonly message: string = "The data request or command is unknown.";
    static override readonly status: number = 400;
    static override readonly key: string = "invalid_command";
}

/**
 * A field in the input is not valid.
 */
export class InvalidField extends TeslaFleetError {
    static override readonly message: string = "A field in the input is not valid.";
    static override readonly status: number = 400;
    static override readonly key: string = "invalid_field";
}

/**
 * The request body is not valid, a description giving a more specific error message may be returned.
 */
export class InvalidRequest extends TeslaFleetError {
    static override readonly message: string = "The request body is not valid";
    static override readonly status: number = 400;
    static override readonly key: string = "invalid_request";
}

/**
 * The "code" in request body is invalid, generate a new one and try again.
 */
export class InvalidAuthCode extends TeslaFleetError {
    static override readonly message: string = "The 'code' in request body is invalid, generate a new one and try again.";
    static override readonly status: number = 400;
    static override readonly key: string = "invalid_auth_code";
}

/**
 * Invalid redirect URI/URL. The authorize redirect URI and token redirect URI must match.
 */
export class InvalidRedirectUrl extends TeslaFleetError {
    static override readonly message: string = "Invalid redirect URI/URL. The authorize redirect URI and token redirect URI must match.";
    static override readonly status: number = 400;
    static override readonly key: string = "invalid_redirect_url";
}

/**
 * We don't recognize this client_id and client_secret combination. Use the client_id and client_secret that has been granted for the application.
 */
export class UnauthorizedClient extends TeslaFleetError {
    static override readonly message: string = "We don't recognize this client_id and client_secret combination. Use the client_id and client_secret that has been granted for the application.";
    static override readonly status: number = 400;
    static override readonly key: string = "unauthorized_client";
}

/**
 * The vehicle has turned off remote access.
 */
export class MobileAccessDisabled extends TeslaFleetError {
    static override readonly message: string = "The vehicle has turned off remote access.";
    static override readonly status: number = 401;
    static override readonly key: string = "mobile_access_disabled";
}

/**
 * Third party specific error when no access token is provided.
 */
export class MissingToken extends TeslaFleetError {
    static override readonly message: string = "Missing access token.";
    static override readonly status: number = 401;
}

/**
 * Teslemetry specific error when no access token is provided.
 */
export class MissingTeslemetryToken extends MissingToken {
    static override readonly key: string = "missing_token";
}

/**
 * Tessie specific error when no access token is provided.
 */
export class MissingTessieToken extends MissingToken {
    static override readonly key: string = "Access token is required";
}

/**
 * Third party specific error for invalid access token.
 */
export class InvalidToken extends TeslaFleetError {
    static override readonly message: string = "Invalid access token.";
    static override readonly status: number = 401;
}

/**
 * Teslemetry specific error for invalid access token.
 */
export class InvalidTeslemetryToken extends InvalidToken {
    static override readonly key: string = "invalid_token";
}

/**
 * Tessie specific error for invalid access token.
 */
export class InvalidTessieToken extends InvalidToken {
    static override readonly key: string = "Invalid access token";
}

/**
 * The OAuth token is invalid.
 */
export class OAuthInvalid extends TeslaFleetError {
    static override readonly message: string = "The OAuth token is invalid.";
    static override readonly status: number = 401;
    static override readonly key: string = "invalid bearer token";
}

/**
 * The OAuth token has expired.
 */
export class OAuthExpired extends TeslaFleetError {
    static override readonly message: string = "The OAuth token has expired.";
    static override readonly status: number = 401;
    static override readonly key: string = "token expired (401)";
}

/**
 * Teslemetry OAuth dynamic client registration (RFC 7591) failed.
 *
 * Covers a transport/timeout failure reaching the registration endpoint, a
 * non-2xx response, a response body that isn't valid JSON, and a
 * well-formed response missing a usable `client_id`. The specific reason
 * is carried in `data`.
 */
export class TeslemetryRegistrationError extends TeslaFleetError {
    static override readonly message: string = "Teslemetry dynamic client registration failed.";
}

/**
 * The user has reset their password and a new auth code is required, or the refresh_token has already been used.
 */
export class LoginRequired extends TeslaFleetError {
    static override readonly message: string = "The user has reset their password and a new auth code is required, or the refresh_token has already been used.";
    static override readonly status: number = 401;
    static override readonly key: string = "login_required";
}

/**
 * Payment is required in order to use the API (non-free account only).
 */
export class PaymentRequired extends TeslaFleetError {
    static override readonly message: string = "Payment is required in order to use the API (non-free account only).";
    static override readonly status: number = 402;
}

/**
 * Subscription is required in order to use Teslemetry.
 */
export class SubscriptionRequired extends TeslaFleetError {
    static override readonly message: string = "Subscription is required in order to use Teslemetry.";
    static override readonly status: number = 402;
    static override readonly key: string = "subscription_required";
}

/**
 * Subscription is required in order to use Teslemetry.
 */
export class VehicleSubscriptionRequired extends TeslaFleetError {
    static override readonly message: string = "Vehicle data subscription is required to make this request.";
    static override readonly status: number = 402;
    static override readonly key: string = "vehicle_subscription_required";
}

/**
 * Account has insufficient credits to make this request.
 */
export class InsufficientCredits extends TeslaFleetError {
    static override readonly message: string = "Account has insufficient command credits to make this request.";
    static override readonly status: number = 402;
    static override readonly key: string = "insufficient_credits";
}

/**
 * Access to this resource is not authorized, developers should check required Scope.
 */
export class Forbidden extends TeslaFleetError {
    static override readonly message: string = "Access to this resource is not authorized, developers should check required Scope.";
    static override readonly status: number = 403;
    static override readonly key: string = "Unauthorized missing scopes";
}

/**
 * The requested scopes are not granted.
 */
export class InvalidScope extends TeslaFleetError {
    static override readonly message: string = "The requested scopes are not granted.";
    static override readonly status: number = 403;
    static override readonly key: string = "invalid_scope";
}

/**
 * The vehicle is unsupported.
 */
export class UnsupportedVehicle extends TeslaFleetError {
    static override readonly message: string = "The vehicle is unsupported.";
    static override readonly status: number = 403;
    static override readonly key: string = "unsupported vehicle";
}

/**
 * The requested resource does not exist.
 */
export class NotFound extends TeslaFleetError {
    static override readonly message: string = "The requested resource does not exist.";
    static override readonly status: number = 404;
}

/**
 * The HTTP method is not allowed.
 */
export class InvalidMethod extends TeslaFleetError {
    static override readonly message: string = "The HTTP method is not allowed.";
    static override readonly status: number = 405;
    static override readonly key: string = "invalid_method";
}

/**
 * The operation is not allowed.
 */
export class NotAllowed extends TeslaFleetError {
    static override readonly message: string = "The operation is not allowed.";
    static override readonly status: number = 405;
}

/**
 * The HTTP request does not have a Content-Type header set to application/json.
 */
export class NotAcceptable extends TeslaFleetError {
    static override readonly message: string = "The HTTP request does not have a Content-Type header set to application/json.";
    static override readonly status: number = 406;
}

/**
 * The vehicle is not "online.
 */
export class VehicleOffline extends TeslaFleetError {
    static override readonly message: string = "The vehicle is not 'online'.";
    static override readonly status: number = 408;
}

/**
 * A condition has not been met to process the request.
 */
export class PreconditionFailed extends TeslaFleetError {
    static override readonly message: string = "A condition has not been met to process the request.";
    static override readonly status: number = 412;
}

/**
 * This user is not present in the current region.
 */
export class InvalidRegion extends TeslaFleetError {
    static override readonly message: string = "This user is not present in the current region.";
    static override readonly status: number = 421;
}

/**
 * There is a semantic problem with the data, e.g. missing or invalid data.
 */
export class InvalidResource extends TeslaFleetError {
    static override readonly message: string = "There is a semantic problem with the data, e.g. missing or invalid data.";
    static override readonly status: number = 422;
}

/**
 * Account is locked, and must be unlocked by Tesla.
 */
export class Locked extends TeslaFleetError {
    static override readonly message: string = "Account is locked, and must be unlocked by Tesla.";
    static override readonly status: number = 423;
}

/**
 * The response from Tesla was invalid.
 */
export class InvalidResponse extends TeslaFleetError {
    static override readonly message: string = "The response from Tesla was invalid.";
    static override readonly status: number = 424;
}

/**
 * Account or server is rate limited.
 */
export class RateLimited extends TeslaFleetError {
    static override readonly message: string = "Account or server is rate limited.";
    static override readonly status: number = 429;
}

/**
 * Querying for a user/vehicle without proper privacy settings.
 */
export class ResourceUnavailableForLegalReasons extends TeslaFleetError {
    static override readonly message: string = "Querying for a user/vehicle without proper privacy settings.";
    static override readonly status: number = 451;
}

/**
 * Client has closed the request before the server could send a response.
 */
export class ClientClosedRequest extends TeslaFleetError {
    static override readonly message: string = "Client has closed the request before the server could send a response.";
    static override readonly status: number = 499;
}

/**
 * An error occurred while processing the request.
 */
export class InternalServerError extends TeslaFleetError {
    static override readonly message: string = "An error occurred while processing the request.";
    static override readonly status: number = 500;
}

/**
 * The server, acting as a gateway, received an invalid response from an upstream server.
 */
export class BadGateway extends TeslaFleetError {
    static override readonly message: string = "The server, acting as a gateway, received an invalid response from an upstream server.";
    static override readonly status: number = 502;
}

/**
 * The energy gateway is unreachable.
 */
export class EnergyGatewayUnreachable extends BadGateway {
    static override readonly message: string = "The energy gateway is unreachable.";
    static override readonly key: string = "energy_gateway_unreachable";
}

/**
 * Either an internal service or a vehicle did not respond (timeout).
 */
export class ServiceUnavailable extends TeslaFleetError {
    static override readonly message: string = "Either an internal service or a vehicle did not respond (timeout).";
    static override readonly status: number = 503;
}

/**
 * Server did not receive a response.
 */
export class GatewayTimeout extends TeslaFleetError {
    static override readonly message: string = "Server did not receive a response.";
    static override readonly status: number = 504;
}

/**
 * Vehicle responded with an error - might need a reboot, OTA update, or service.
 */
export class DeviceUnexpectedResponse extends TeslaFleetError {
    static override readonly message: string = "Vehicle responded with an error - might need a reboot, OTA update, or service.";
    static override readonly status: number = 540;
}

/**
 * Errors related to this library.
 */
export class LibraryError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
        this.name = new.target.name;
    }
}

/**
 * A signed operation was attempted on a vehicle constructed with signing
 * explicitly disabled.
 */
export class SigningDisabled extends LibraryError {
    constructor() {
        super(
            "This vehicle was constructed with command signing explicitly disabled. " +
                "Any signed command or read needs a real private key.",
        );
    }
}

/**
 * An existing private key file could not be loaded as a usable key.
 *
 * `reason` is one of `"unreadable"` (I/O failure), `"malformed"` (not valid
 * PEM), `"encrypted"` (PEM requires a passphrase), or `"wrong_type"` (loaded
 * key is not the expected type). A local key-file failure, not an upstream
 * Fleet API error, so this extends `LibraryError` rather than
 * `TeslaFleetError`.
 */
export class PrivateKeyError extends LibraryError {
    readonly reason: string;

    constructor(reason: string, message: string, options?: ErrorOptions) {
        super(message, options);
        this.reason = reason;
    }
}

/**
 * The requested action requires a signed command; the unsigned cloud API cannot actuate it.
 *
 * Energy gateways have been observed acknowledging this class of unsigned
 * `grpc_command` without physically operating the grid contactor - see
 * `EnergySite.set_island_mode`. Pair an RSA key with
 * `EnergySite.add_authorized_client`, then either build the energy site
 * with that `private_key` and its `din` to sign it through the cloud, or
 * issue it through a signed local LAN backend (composed via
 * `EnergySiteRouter`).
 */
export class SignedCommandRequired extends TeslaFleetError {
    static override readonly message: string = "This command cannot actuate via the unsigned cloud API - gateways acknowledge it without operating the contactor. Pair a key with add_authorized_client, then create the energy site with that private_key and its din, or use a signed local control path (EnergySiteRouter).";
}

/**
 * An energy gateway's presence-proof window expired before verification.
 *
 * The gateway itself reported the terminal `PENDING_VERIFICATION_TIMEOUT`
 * state (`AuthorizedClientState`) - the ~9-minute window to confirm the
 * key (typically via a physical breaker/switch toggle) closed with no
 * confirmation. The registration is dead; re-register the *same* public
 * key with `add_authorized_client` to reset the window and retry, rather
 * than generating a new key.
 */
export class AuthorizedClientPairingTimedOut extends TeslaFleetError {
    static override readonly message: string = "Authorized-client pairing timed out: the presence-proof window expired (PENDING_VERIFICATION_TIMEOUT). Re-register the same public key to reset the window and retry.";
}

/**
 * `wait_until_paired()`'s own bounded overall wait elapsed.
 *
 * Distinct from `AuthorizedClientPairingTimedOut`: the gateway had not
 * reported a terminal state (the registration may still be alive, e.g.
 * still `PENDING_VERIFICATION`, or the local `verify_by_use` check
 * kept failing) when the caller's `timeout` ran out. Retry by calling
 * `wait_until_paired()` again.
 */
export class AuthorizedClientWaitExpired extends TeslaFleetError {
    static override readonly message: string = "Timed out waiting for authorized-client pairing to complete.";
}

/**
 * A `session_info` reply failed local authentication and was discarded.
 *
 * Raised when the reply's `session_info_tag` HMAC does not verify, is
 * absent, the echoed `request_uuid` does not match the outstanding
 * request it claims to answer, or its clock time regresses within the same
 * epoch. Also raised when the reply carries an empty `publicKey` (so no
 * shared key can be derived to verify a tag) with a status other than
 * `SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST`, which raises
 * `NotOnWhitelistFault` instead. The session's prior state is left
 * unmodified.
 */
export class SessionInfoAuthenticationFault extends TeslaFleetError {
    static override readonly message: string = "Session info reply failed authentication and was discarded.";
}

/**
 * A signed command response reused a counter value already seen on this session.
 *
 * protocol.md requires rejecting a response whose counter has previously
 * been used, to prevent an attacker from replaying a captured encrypted
 * response back at the client.
 */
export class SignedCommandResponseReplayed extends TeslaFleetError {
    static override readonly message: string = "Signed command response reused an already-seen counter; discarded as a replay.";
}

/**
 * Vehicle has responded with an error when sending a signed command
 */
export class TeslaFleetInformationFault extends TeslaFleetError {
    static override readonly message: string = "Vehicle has responded with an error when sending a signed command";
}

/**
 * Unknown fault on signed command.
 */
export class UnknownFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Unknown fault on signed command.";
    static override readonly code: number = 1;
}

/**
 * Not on whitelist fault on signed command.
 */
export class NotOnWhitelistFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Not on whitelist fault on signed command.";
    static override readonly code: number = 2;
}

/**
 * IV smaller than expected fault on signed command.
 */
export class IVSmallerThanExpectedFault extends TeslaFleetInformationFault {
    static override readonly message: string = "IV smaller than expected fault on signed command.";
    static override readonly code: number = 3;
}

/**
 * Invalid token fault on signed command.
 */
export class InvalidTokenFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Invalid token fault on signed command.";
    static override readonly code: number = 4;
}

/**
 * Token and counter invalid fault on signed command.
 */
export class TokenAndCounterInvalidFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Token and counter invalid fault on signed command.";
    static override readonly code: number = 5;
}

/**
 * AES decrypt auth fault on signed command.
 */
export class AESDecryptAuthFault extends TeslaFleetInformationFault {
    static override readonly message: string = "AES decrypt auth fault on signed command.";
    static override readonly code: number = 6;
}

/**
 * ECDSA input fault on signed command.
 */
export class ECDSAInputFault extends TeslaFleetInformationFault {
    static override readonly message: string = "ECDSA input fault on signed command.";
    static override readonly code: number = 7;
}

/**
 * ECDSA signature fault on signed command.
 */
export class ECDSASignatureFault extends TeslaFleetInformationFault {
    static override readonly message: string = "ECDSA signature fault on signed command.";
    static override readonly code: number = 8;
}

/**
 * Local entity start fault on signed command.
 */
export class LocalEntityStartFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Local entity start fault on signed command.";
    static override readonly code: number = 9;
}

/**
 * Local entity result fault on signed command.
 */
export class LocalEntityResultFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Local entity result fault on signed command.";
    static override readonly code: number = 10;
}

/**
 * Could not retrieve key fault on signed command.
 */
export class CouldNotRetrieveKeyFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Could not retrieve key fault on signed command.";
    static override readonly code: number = 11;
}

/**
 * Could not retrieve token fault on signed command.
 */
export class CouldNotRetrieveTokenFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Could not retrieve token fault on signed command.";
    static override readonly code: number = 12;
}

/**
 * Signature too short fault on signed command.
 */
export class SignatureTooShortFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Signature too short fault on signed command.";
    static override readonly code: number = 13;
}

/**
 * Token is incorrect length fault on signed command.
 */
export class TokenIsIncorrectLengthFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Token is incorrect length fault on signed command.";
    static override readonly code: number = 14;
}

/**
 * Incorrect epoch fault on signed command.
 */
export class IncorrectEpochFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Incorrect epoch fault on signed command.";
    static override readonly code: number = 15;
}

/**
 * IV incorrect length fault on signed command.
 */
export class IVIncorrectLengthFault extends TeslaFleetInformationFault {
    static override readonly message: string = "IV incorrect length fault on signed command.";
    static override readonly code: number = 16;
}

/**
 * Time expired fault on signed command.
 */
export class TimeExpiredFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Time expired fault on signed command.";
    static override readonly code: number = 17;
}

/**
 * Not provisioned with identity fault on signed command.
 */
export class NotProvisionedWithIdentityFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Not provisioned with identity fault on signed command.";
    static override readonly code: number = 18;
}

/**
 * Could not hash metadata fault on signed command.
 */
export class CouldNotHashMetadataFault extends TeslaFleetInformationFault {
    static override readonly message: string = "Could not hash metadata fault on signed command.";
    static override readonly code: number = 19;
}

/**
 * Vehicle has responded with an error when sending a signed command
 */
export class TeslaFleetMessageFault extends TeslaFleetError {
    static override readonly message: string = "Vehicle has responded with an error when sending a signed command";
}

/**
 * Required vehicle subsystem is busy. Try again
 */
export class TeslaFleetMessageFaultBusy extends TeslaFleetMessageFault {
    static override readonly message: string = "Required vehicle subsystem is busy. Try again";
    static override readonly code: number = 1;
}

/**
 * Vehicle subsystem did not respond. Try again
 */
export class TeslaFleetMessageFaultTimeout extends TeslaFleetMessageFault {
    static override readonly message: string = "Vehicle subsystem did not respond. Try again";
    static override readonly code: number = 2;
}

/**
 * Vehicle did not recognize the key used to authorize command. Make sure your key is paired with the vehicle
 */
export class TeslaFleetMessageFaultUnknownKeyId extends TeslaFleetMessageFault {
    static override readonly message: string = "Vehicle did not recognize the key used to authorize command. Make sure your key is paired with the vehicle";
    static override readonly code: number = 3;
}

/**
 * Key used to authorize command has been disabled
 */
export class TeslaFleetMessageFaultInactiveKey extends TeslaFleetMessageFault {
    static override readonly message: string = "Key used to authorize command has been disabled";
    static override readonly code: number = 4;
}

/**
 * Command signature/MAC is incorrect. Use included session info to update session and try again
 */
export class TeslaFleetMessageFaultInvalidSignature extends TeslaFleetMessageFault {
    static override readonly message: string = "Command signature/MAC is incorrect. Use included session info to update session and try again";
    static override readonly code: number = 5;
}

/**
 * Command anti-replay counter has been used before. Use included session info to update session and try again
 */
export class TeslaFleetMessageFaultInvalidTokenOrCounter extends TeslaFleetMessageFault {
    static override readonly message: string = "Command anti-replay counter has been used before. Use included session info to update session and try again";
    static override readonly code: number = 6;
}

/**
 * User is not authorized to execute command. This can be because of the role or because of vehicle state
 */
export class TeslaFleetMessageFaultInsufficientPrivileges extends TeslaFleetMessageFault {
    static override readonly message: string = "User is not authorized to execute command. This can be because of the role or because of vehicle state";
    static override readonly code: number = 7;
}

/**
 * Command was malformed or addressed to an unrecognized vehicle system. May indicate client error or older vehicle firmware
 */
export class TeslaFleetMessageFaultInvalidDomains extends TeslaFleetMessageFault {
    static override readonly message: string = "Command was malformed or addressed to an unrecognized vehicle system. May indicate client error or older vehicle firmware";
    static override readonly code: number = 8;
}

/**
 * Unrecognized command. May indicate client error or unsupported vehicle firmware
 */
export class TeslaFleetMessageFaultInvalidCommand extends TeslaFleetMessageFault {
    static override readonly message: string = "Unrecognized command. May indicate client error or unsupported vehicle firmware";
    static override readonly code: number = 9;
}

/**
 * Could not parse command. Indicates client error
 */
export class TeslaFleetMessageFaultDecoding extends TeslaFleetMessageFault {
    static override readonly message: string = "Could not parse command. Indicates client error";
    static override readonly code: number = 10;
}

/**
 * Internal vehicle error. Try again. Most commonly encountered when the vehicle has not finished booting
 */
export class TeslaFleetMessageFaultInternal extends TeslaFleetMessageFault {
    static override readonly message: string = "Internal vehicle error. Try again. Most commonly encountered when the vehicle has not finished booting";
    static override readonly code: number = 11;
}

/**
 * Command sent to wrong VIN
 */
export class TeslaFleetMessageFaultWrongPersonalization extends TeslaFleetMessageFault {
    static override readonly message: string = "Command sent to wrong VIN";
    static override readonly code: number = 12;
}

/**
 * Command was malformed or used a deprecated parameter
 */
export class TeslaFleetMessageFaultBadParameter extends TeslaFleetMessageFault {
    static override readonly message: string = "Command was malformed or used a deprecated parameter";
    static override readonly code: number = 13;
}

/**
 * Vehicle's keychain is full. You must delete a key before you can add another
 */
export class TeslaFleetMessageFaultKeychainIsFull extends TeslaFleetMessageFault {
    static override readonly message: string = "Vehicle's keychain is full. You must delete a key before you can add another";
    static override readonly code: number = 14;
}

/**
 * Session ID mismatch. Use included session info to update session and try again
 */
export class TeslaFleetMessageFaultIncorrectEpoch extends TeslaFleetMessageFault {
    static override readonly message: string = "Session ID mismatch. Use included session info to update session and try again";
    static override readonly code: number = 15;
}

/**
 * Initialization Value length is incorrect (AES-GCM must use 12-byte IVs). Indicates a client programming error
 */
export class TeslaFleetMessageFaultIVIncorrectLength extends TeslaFleetMessageFault {
    static override readonly message: string = "Initialization Value length is incorrect (AES-GCM must use 12-byte IVs). Indicates a client programming error";
    static override readonly code: number = 16;
}

/**
 * Command expired. Use included session info to determine if clocks have desynchronized and try again
 */
export class TeslaFleetMessageFaultTimeExpired extends TeslaFleetMessageFault {
    static override readonly message: string = "Command expired. Use included session info to determine if clocks have desynchronized and try again";
    static override readonly code: number = 17;
}

/**
 * Vehicle has not been provisioned with a VIN and may require service
 */
export class TeslaFleetMessageFaultNotProvisionedWithIdentity extends TeslaFleetMessageFault {
    static override readonly message: string = "Vehicle has not been provisioned with a VIN and may require service";
    static override readonly code: number = 18;
}

/**
 * Internal vehicle error
 */
export class TeslaFleetMessageFaultCouldNotHashMetadata extends TeslaFleetMessageFault {
    static override readonly message: string = "Internal vehicle error";
    static override readonly code: number = 19;
}

/**
 * Vehicle rejected command because its expiration time was too far in the future. This is a security precaution
 */
export class TeslaFleetMessageFaultTimeToLiveTooLong extends TeslaFleetMessageFault {
    static override readonly message: string = "Vehicle rejected command because its expiration time was too far in the future. This is a security precaution";
    static override readonly code: number = 20;
}

/**
 * The vehicle owner has disabled Mobile access
 */
export class TeslaFleetMessageFaultRemoteAccessDisabled extends TeslaFleetMessageFault {
    static override readonly message: string = "The vehicle owner has disabled Mobile access";
    static override readonly code: number = 21;
}

/**
 * The command was authorized with a Service key, but the vehicle has not been configured to permit remote service commands
 */
export class TeslaFleetMessageFaultRemoteServiceAccessDisabled extends TeslaFleetMessageFault {
    static override readonly message: string = "The command was authorized with a Service key, but the vehicle has not been configured to permit remote service commands";
    static override readonly code: number = 22;
}

/**
 * The command requires proof of Tesla account credentials but was not sent over a channel that provides this proof. Resend the command using Fleet API
 */
export class TeslaFleetMessageFaultCommandRequiresAccountCredentials extends TeslaFleetMessageFault {
    static override readonly message: string = "The command requires proof of Tesla account credentials but was not sent over a channel that provides this proof. Resend the command using Fleet API";
    static override readonly code: number = 23;
}

/**
 * Client sent a request with a field that exceeds MTU
 */
export class TeslaFleetMessageFaultFieldExceedsMTU extends TeslaFleetMessageFault {
    static override readonly message: string = "Client sent a request with a field that exceeds MTU";
    static override readonly code: number = 24;
}

/**
 * Client's request was received, but response size exceeded MTU
 */
export class TeslaFleetMessageFaultResponseSizeExceedsMTU extends TeslaFleetMessageFault {
    static override readonly message: string = "Client's request was received, but response size exceeded MTU";
    static override readonly code: number = 25;
}

/**
 * The vehicle has seen this counter value before. Reset the counter and try again
 */
export class TeslaFleetMessageFaultRepeatedCounter extends TeslaFleetMessageFault {
    static override readonly message: string = "The vehicle has seen this counter value before. Reset the counter and try again";
    static override readonly code: number = 26;
}

/**
 * The key handle is not valid. The key may have been revoked or expired
 */
export class TeslaFleetMessageFaultInvalidKeyHandle extends TeslaFleetMessageFault {
    static override readonly message: string = "The key handle is not valid. The key may have been revoked or expired";
    static override readonly code: number = 27;
}

/**
 * The response requires encryption but encryption was not requested
 */
export class TeslaFleetMessageFaultRequiresResponseEncryption extends TeslaFleetMessageFault {
    static override readonly message: string = "The response requires encryption but encryption was not requested";
    static override readonly code: number = 28;
}

/**
 * Vehicle has responded with an error when sending a signed command
 */
export class SignedMessageInformationFault extends TeslaFleetError {
    static override readonly message: string = "Vehicle has responded with an error when sending a signed command";
}

/**
 * Unknown fault on signed command.
 */
export class SignedMessageInformationFaultUnknown extends SignedMessageInformationFault {
    static override readonly message: string = "Unknown fault on signed command.";
    static override readonly code: number = 1;
}

/**
 * Not on whitelist fault on signed command.
 */
export class SignedMessageInformationFaultNotOnWhitelist extends SignedMessageInformationFault {
    static override readonly message: string = "Not on whitelist fault on signed command.";
    static override readonly code: number = 2;
}

/**
 * IV smaller than expected fault on signed command.
 */
export class SignedMessageInformationFaultIVSmallerThanExpected extends SignedMessageInformationFault {
    static override readonly message: string = "IV smaller than expected fault on signed command.";
    static override readonly code: number = 3;
}

/**
 * Invalid token fault on signed command.
 */
export class SignedMessageInformationFaultInvalidToken extends SignedMessageInformationFault {
    static override readonly message: string = "Invalid token fault on signed command.";
    static override readonly code: number = 4;
}

/**
 * Token and counter invalid fault on signed command.
 */
export class SignedMessageInformationFaultTokenAndCounterInvalid extends SignedMessageInformationFault {
    static override readonly message: string = "Token and counter invalid fault on signed command.";
    static override readonly code: number = 5;
}

/**
 * AES decrypt auth fault on signed command.
 */
export class SignedMessageInformationFaultAESDecryptAuth extends SignedMessageInformationFault {
    static override readonly message: string = "AES decrypt auth fault on signed command.";
    static override readonly code: number = 6;
}

/**
 * ECDSA input fault on signed command.
 */
export class SignedMessageInformationFaultECDSAInput extends SignedMessageInformationFault {
    static override readonly message: string = "ECDSA input fault on signed command.";
    static override readonly code: number = 7;
}

/**
 * ECDSA signature fault on signed command.
 */
export class SignedMessageInformationFaultECDSASignature extends SignedMessageInformationFault {
    static override readonly message: string = "ECDSA signature fault on signed command.";
    static override readonly code: number = 8;
}

/**
 * Local entity start fault on signed command.
 */
export class SignedMessageInformationFaultLocalEntityStart extends SignedMessageInformationFault {
    static override readonly message: string = "Local entity start fault on signed command.";
    static override readonly code: number = 9;
}

/**
 * Local entity result fault on signed command.
 */
export class SignedMessageInformationFaultLocalEntityResult extends SignedMessageInformationFault {
    static override readonly message: string = "Local entity result fault on signed command.";
    static override readonly code: number = 10;
}

/**
 * Could not retrieve key fault on signed command.
 */
export class SignedMessageInformationFaultCouldNotRetrieveKey extends SignedMessageInformationFault {
    static override readonly message: string = "Could not retrieve key fault on signed command.";
    static override readonly code: number = 11;
}

/**
 * Could not retrieve token fault on signed command.
 */
export class SignedMessageInformationFaultCouldNotRetrieveToken extends SignedMessageInformationFault {
    static override readonly message: string = "Could not retrieve token fault on signed command.";
    static override readonly code: number = 12;
}

/**
 * Signature too short fault on signed command.
 */
export class SignedMessageInformationFaultSignatureTooShort extends SignedMessageInformationFault {
    static override readonly message: string = "Signature too short fault on signed command.";
    static override readonly code: number = 13;
}

/**
 * Token is incorrect length fault on signed command.
 */
export class SignedMessageInformationFaultTokenIsIncorrectLength extends SignedMessageInformationFault {
    static override readonly message: string = "Token is incorrect length fault on signed command.";
    static override readonly code: number = 14;
}

/**
 * Incorrect epoch fault on signed command.
 */
export class SignedMessageInformationFaultIncorrectEpoch extends SignedMessageInformationFault {
    static override readonly message: string = "Incorrect epoch fault on signed command.";
    static override readonly code: number = 15;
}

/**
 * IV incorrect length fault on signed command.
 */
export class SignedMessageInformationFaultIVIncorrectLength extends SignedMessageInformationFault {
    static override readonly message: string = "IV incorrect length fault on signed command.";
    static override readonly code: number = 16;
}

/**
 * Time expired fault on signed command.
 */
export class SignedMessageInformationFaultTimeExpired extends SignedMessageInformationFault {
    static override readonly message: string = "Time expired fault on signed command.";
    static override readonly code: number = 17;
}

/**
 * Not provisioned with identity fault on signed command.
 */
export class SignedMessageInformationFaultNotProvisionedWithIdentity extends SignedMessageInformationFault {
    static override readonly message: string = "Not provisioned with identity fault on signed command.";
    static override readonly code: number = 18;
}

/**
 * Could not hash metadata fault on signed command.
 */
export class SignedMessageInformationFaultCouldNotHashMetadata extends SignedMessageInformationFault {
    static override readonly message: string = "Could not hash metadata fault on signed command.";
    static override readonly code: number = 19;
}

export class WhitelistOperationStatus extends TeslaFleetError {
    static override readonly message: string = "Whitelist operation failed";
}

export class WhitelistOperationUndocumentedError extends WhitelistOperationStatus {
    static override readonly message: string = "Undocumented whitelist operation error";
    static override readonly code: number = 1;
}

export class WhitelistOperationNoPermissionToRemoveOneself extends WhitelistOperationStatus {
    static override readonly message: string = "No permission to remove oneself from whitelist";
    static override readonly code: number = 2;
}

export class WhitelistOperationKeyfobSlotsFull extends WhitelistOperationStatus {
    static override readonly message: string = "Keyfob slots are full";
    static override readonly code: number = 3;
}

export class WhitelistOperationWhitelistFull extends WhitelistOperationStatus {
    static override readonly message: string = "Whitelist is full";
    static override readonly code: number = 4;
}

export class WhitelistOperationNoPermissionToAdd extends WhitelistOperationStatus {
    static override readonly message: string = "No permission to add to whitelist";
    static override readonly code: number = 5;
}

export class WhitelistOperationInvalidPublicKey extends WhitelistOperationStatus {
    static override readonly message: string = "Invalid public key";
    static override readonly code: number = 6;
}

export class WhitelistOperationNoPermissionToRemove extends WhitelistOperationStatus {
    static override readonly message: string = "No permission to remove from whitelist";
    static override readonly code: number = 7;
}

export class WhitelistOperationNoPermissionToChangePermissions extends WhitelistOperationStatus {
    static override readonly message: string = "No permission to change permissions";
    static override readonly code: number = 8;
}

export class WhitelistOperationAttemptingToElevateOthersAboveOneself extends WhitelistOperationStatus {
    static override readonly message: string = "Attempting to elevate others above oneself";
    static override readonly code: number = 9;
}

export class WhitelistOperationAttemptingToDemoteSuperiorToOneself extends WhitelistOperationStatus {
    static override readonly message: string = "Attempting to demote superior to oneself";
    static override readonly code: number = 10;
}

export class WhitelistOperationAttemptingToRemoveOwnPermissions extends WhitelistOperationStatus {
    static override readonly message: string = "Attempting to remove own permissions";
    static override readonly code: number = 11;
}

export class WhitelistOperationPublicKeyNotOnWhitelist extends WhitelistOperationStatus {
    static override readonly message: string = "Public key not on whitelist";
    static override readonly code: number = 12;
}

export class WhitelistOperationAttemptingToAddExistingKey extends WhitelistOperationStatus {
    static override readonly message: string = "Attempting to add key that is already on the whitelist";
    static override readonly code: number = 13;
}

export class WhitelistOperationNotAllowedToAddUnlessOnReader extends WhitelistOperationStatus {
    static override readonly message: string = "Not allowed to add unless on reader";
    static override readonly code: number = 14;
}

export class WhitelistOperationFMModifyingOutsideOfFMode extends WhitelistOperationStatus {
    static override readonly message: string = "FM modifying outside of F mode";
    static override readonly code: number = 15;
}

export class WhitelistOperationFMAttemptingToAddPermanentKey extends WhitelistOperationStatus {
    static override readonly message: string = "FM attempting to add permanent key";
    static override readonly code: number = 16;
}

export class WhitelistOperationFMAttemptingToRemovePermanentKey extends WhitelistOperationStatus {
    static override readonly message: string = "FM attempting to remove permanent key";
    static override readonly code: number = 17;
}

export class WhitelistOperationKeychainWhileFSFull extends WhitelistOperationStatus {
    static override readonly message: string = "Keychain while FS full";
    static override readonly code: number = 18;
}

export class WhitelistOperationAttemptingToAddKeyWithoutRole extends WhitelistOperationStatus {
    static override readonly message: string = "Attempting to add key without role";
    static override readonly code: number = 19;
}

export class WhitelistOperationAttemptingToAddKeyWithServiceRole extends WhitelistOperationStatus {
    static override readonly message: string = "Attempting to add key with service role";
    static override readonly code: number = 20;
}

export class WhitelistOperationNonServiceKeyAttemptingToAddServiceTech extends WhitelistOperationStatus {
    static override readonly message: string = "Non-service key attempting to add service tech";
    static override readonly code: number = 21;
}

export class WhitelistOperationServiceKeyAttemptingToAddServiceTechOutsideServiceMode extends WhitelistOperationStatus {
    static override readonly message: string = "Service key attempting to add service tech outside service mode";
    static override readonly code: number = 22;
}

export class WhitelistOperationCouldNotStartLocalEntityAuth extends WhitelistOperationStatus {
    static override readonly message: string = "Could not start local entity authentication";
    static override readonly code: number = 23;
}

export class WhitelistOperationLocalEntityAuthFailedUIDenied extends WhitelistOperationStatus {
    static override readonly message: string = "Local entity authentication failed - UI denied";
    static override readonly code: number = 24;
}

export class WhitelistOperationLocalEntityAuthFailedTimedOutWaitingForTap extends WhitelistOperationStatus {
    static override readonly message: string = "Authorization request timed out";
    static override readonly code: number = 25;
}

export class WhitelistOperationLocalEntityAuthFailedTimedOutWaitingForUIAck extends WhitelistOperationStatus {
    static override readonly message: string = "Local entity authentication failed - timed out waiting for UI acknowledgement";
    static override readonly code: number = 26;
}

export class WhitelistOperationLocalEntityAuthFailedValetMode extends WhitelistOperationStatus {
    static override readonly message: string = "Local entity authentication failed - valet mode";
    static override readonly code: number = 27;
}

export class WhitelistOperationLocalEntityAuthFailedCancelled extends WhitelistOperationStatus {
    static override readonly message: string = "Local entity authentication failed - cancelled";
    static override readonly code: number = 28;
}

/** `TeslaFleetInformationFault` subclasses indexed by their protobuf enum value; index 0 (no fault) is `null`. */
export const INFORMATION_FAULTS: readonly (typeof TeslaFleetInformationFault | null)[] = [
    null,
    UnknownFault,
    NotOnWhitelistFault,
    IVSmallerThanExpectedFault,
    InvalidTokenFault,
    TokenAndCounterInvalidFault,
    AESDecryptAuthFault,
    ECDSAInputFault,
    ECDSASignatureFault,
    LocalEntityStartFault,
    LocalEntityResultFault,
    CouldNotRetrieveKeyFault,
    CouldNotRetrieveTokenFault,
    SignatureTooShortFault,
    TokenIsIncorrectLengthFault,
    IncorrectEpochFault,
    IVIncorrectLengthFault,
    TimeExpiredFault,
    NotProvisionedWithIdentityFault,
    CouldNotHashMetadataFault,
];

/** `TeslaFleetMessageFault` subclasses indexed by their protobuf enum value; index 0 (no fault) is `null`. */
export const MESSAGE_FAULTS: readonly (typeof TeslaFleetMessageFault | null)[] = [
    null,
    TeslaFleetMessageFaultBusy,
    TeslaFleetMessageFaultTimeout,
    TeslaFleetMessageFaultUnknownKeyId,
    TeslaFleetMessageFaultInactiveKey,
    TeslaFleetMessageFaultInvalidSignature,
    TeslaFleetMessageFaultInvalidTokenOrCounter,
    TeslaFleetMessageFaultInsufficientPrivileges,
    TeslaFleetMessageFaultInvalidDomains,
    TeslaFleetMessageFaultInvalidCommand,
    TeslaFleetMessageFaultDecoding,
    TeslaFleetMessageFaultInternal,
    TeslaFleetMessageFaultWrongPersonalization,
    TeslaFleetMessageFaultBadParameter,
    TeslaFleetMessageFaultKeychainIsFull,
    TeslaFleetMessageFaultIncorrectEpoch,
    TeslaFleetMessageFaultIVIncorrectLength,
    TeslaFleetMessageFaultTimeExpired,
    TeslaFleetMessageFaultNotProvisionedWithIdentity,
    TeslaFleetMessageFaultCouldNotHashMetadata,
    TeslaFleetMessageFaultTimeToLiveTooLong,
    TeslaFleetMessageFaultRemoteAccessDisabled,
    TeslaFleetMessageFaultRemoteServiceAccessDisabled,
    TeslaFleetMessageFaultCommandRequiresAccountCredentials,
    TeslaFleetMessageFaultFieldExceedsMTU,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
    TeslaFleetMessageFaultRepeatedCounter,
    TeslaFleetMessageFaultInvalidKeyHandle,
    TeslaFleetMessageFaultRequiresResponseEncryption,
];

/** `SignedMessageInformationFault` subclasses indexed by their protobuf enum value; index 0 (no fault) is `null`. */
export const SIGNED_MESSAGE_INFORMATION_FAULTS: readonly (typeof SignedMessageInformationFault | null)[] = [
    null,
    SignedMessageInformationFaultUnknown,
    SignedMessageInformationFaultNotOnWhitelist,
    SignedMessageInformationFaultIVSmallerThanExpected,
    SignedMessageInformationFaultInvalidToken,
    SignedMessageInformationFaultTokenAndCounterInvalid,
    SignedMessageInformationFaultAESDecryptAuth,
    SignedMessageInformationFaultECDSAInput,
    SignedMessageInformationFaultECDSASignature,
    SignedMessageInformationFaultLocalEntityStart,
    SignedMessageInformationFaultLocalEntityResult,
    SignedMessageInformationFaultCouldNotRetrieveKey,
    SignedMessageInformationFaultCouldNotRetrieveToken,
    SignedMessageInformationFaultSignatureTooShort,
    SignedMessageInformationFaultTokenIsIncorrectLength,
    SignedMessageInformationFaultIncorrectEpoch,
    SignedMessageInformationFaultIVIncorrectLength,
    SignedMessageInformationFaultTimeExpired,
    SignedMessageInformationFaultNotProvisionedWithIdentity,
    SignedMessageInformationFaultCouldNotHashMetadata,
];

/** `WhitelistOperationStatus` subclasses indexed by their protobuf enum value; index 0 (no fault) is `null`. */
export const WHITELIST_OPERATION_STATUS: readonly (typeof WhitelistOperationStatus | null)[] = [
    null,
    WhitelistOperationUndocumentedError,
    WhitelistOperationNoPermissionToRemoveOneself,
    WhitelistOperationKeyfobSlotsFull,
    WhitelistOperationWhitelistFull,
    WhitelistOperationNoPermissionToAdd,
    WhitelistOperationInvalidPublicKey,
    WhitelistOperationNoPermissionToRemove,
    WhitelistOperationNoPermissionToChangePermissions,
    WhitelistOperationAttemptingToElevateOthersAboveOneself,
    WhitelistOperationAttemptingToDemoteSuperiorToOneself,
    WhitelistOperationAttemptingToRemoveOwnPermissions,
    WhitelistOperationPublicKeyNotOnWhitelist,
    WhitelistOperationAttemptingToAddExistingKey,
    WhitelistOperationNotAllowedToAddUnlessOnReader,
    WhitelistOperationFMModifyingOutsideOfFMode,
    WhitelistOperationFMAttemptingToAddPermanentKey,
    WhitelistOperationFMAttemptingToRemovePermanentKey,
    WhitelistOperationKeychainWhileFSFull,
    WhitelistOperationAttemptingToAddKeyWithoutRole,
    WhitelistOperationAttemptingToAddKeyWithServiceRole,
    WhitelistOperationNonServiceKeyAttemptingToAddServiceTech,
    WhitelistOperationServiceKeyAttemptingToAddServiceTechOutsideServiceMode,
    WhitelistOperationCouldNotStartLocalEntityAuth,
    WhitelistOperationLocalEntityAuthFailedUIDenied,
    WhitelistOperationLocalEntityAuthFailedTimedOutWaitingForTap,
    WhitelistOperationLocalEntityAuthFailedTimedOutWaitingForUIAck,
    WhitelistOperationLocalEntityAuthFailedValetMode,
    WhitelistOperationLocalEntityAuthFailedCancelled,
];

/**
 * Every fault a vehicle can return that means it did not recognize/accept our
 * signing key as authorized to issue commands, verified against each fault's
 * proto enum meaning rather than its name alone.
 * `TeslaFleetMessageFaultKeychainIsFull` is deliberately excluded: its proto
 * meaning is "no room to add another key", not "this key was rejected".
 */
export const KEY_REJECTED_FAULTS: readonly (typeof TeslaFleetError)[] = [
    NotOnWhitelistFault,
    CouldNotRetrieveKeyFault,
    SignedMessageInformationFaultNotOnWhitelist,
    SignedMessageInformationFaultCouldNotRetrieveKey,
    TeslaFleetMessageFaultUnknownKeyId,
    TeslaFleetMessageFaultInactiveKey,
    TeslaFleetMessageFaultInvalidKeyHandle,
];

/**
 * Whether `error` means the vehicle rejected our signing key.
 *
 * True for a fault meaning the vehicle does not recognize our key as
 * whitelisted/paired (or could not retrieve/validate it), false for every
 * other fault, including transport errors and faults about an unrelated
 * signed-command condition (e.g. a full keychain).
 */
export function is_key_rejected(error: unknown): boolean {
    return KEY_REJECTED_FAULTS.some((cls) => error instanceof cls);
}

type KeyedError = typeof TeslaFleetError & { readonly key: string };

function keyed(error: unknown, candidates: readonly KeyedError[]): KeyedError | undefined {
    return error ? candidates.find((cls) => cls.key === error) : undefined;
}

/**
 * Throw the `TeslaFleetError` subclass matching `resp` if its status is >= 400.
 * https://developer.tesla.com/docs/fleet-api#response-codes
 *
 * Consumes the response body when it throws; resolves without touching the
 * body otherwise.
 */
export async function raise_for_status(resp: Response): Promise<void> {
    if (resp.status < 400) {
        return;
    }

    const text = await resp.text();
    let data: Record<string, unknown> | null = null;
    const contentType = resp.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
    if (contentType === "application/json") {
        try {
            const parsed: unknown = JSON.parse(text);
            if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
                data = parsed as Record<string, unknown>;
            }
        } catch {
            // A body that claims to be JSON but isn't is classified by status alone.
        }
    }
    const error = data?.error;

    switch (resp.status) {
        case 400: {
            const cls = keyed(error, [
                InvalidCommand,
                InvalidField,
                InvalidRequest,
                InvalidAuthCode,
                InvalidRedirectUrl,
                UnauthorizedClient,
            ]);
            throw new (cls ?? InvalidRequest)(data);
        }
        case 401: {
            const cls = keyed(error, [
                OAuthExpired,
                MobileAccessDisabled,
                LoginRequired,
                MissingTeslemetryToken,
                MissingTessieToken,
                InvalidTeslemetryToken,
                InvalidTessieToken,
            ]);
            if (cls) {
                throw new cls(data);
            }
            // This error does not return a body
            throw new OAuthExpired();
        }
        case 402: {
            const cls = keyed(error, [SubscriptionRequired, VehicleSubscriptionRequired, InsufficientCredits]);
            throw new (cls ?? PaymentRequired)(data);
        }
        case 403: {
            const cls = keyed(error, [InvalidScope, UnsupportedVehicle]);
            throw new (cls ?? Forbidden)(data);
        }
        case 404:
            throw new NotFound(data);
        case 405:
            throw new (error === InvalidMethod.key ? InvalidMethod : NotAllowed)(data);
        case 406:
            throw new NotAcceptable(data);
        case 408:
            throw new VehicleOffline(data);
        case 412:
            throw new PreconditionFailed(data);
        case 421:
            throw new InvalidRegion(data);
        case 422:
            throw new InvalidResource(data);
        case 423:
            throw new Locked(data);
        case 424:
            throw new InvalidResponse(data);
        case 429:
            throw new RateLimited({
                reset: resp.headers.get("RateLimit-Reset"),
                after: resp.headers.get("Retry-After"),
            });
        case 451:
            throw new ResourceUnavailableForLegalReasons(data);
        case 499:
            throw new ClientClosedRequest(data);
        case 500:
            throw new InternalServerError(data);
        case 502:
            throw new (error === EnergyGatewayUnreachable.key ? EnergyGatewayUnreachable : BadGateway)(data);
        case 503:
            throw new ServiceUnavailable(data);
        case 504:
            throw new GatewayTimeout(data);
        case 540:
            throw new DeviceUnexpectedResponse(data);
    }
    if (data === null) {
        throw new ResponseError(text, resp.status);
    }
    throw new TeslaFleetError(data, resp.status);
}
