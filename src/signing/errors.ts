import { MessageFaultE, messageFaultEToJSON } from "@teslemetry/tesla-protocol/command/universal_message";

/**
 * Base class for every error raised by the signed-command layer.
 */
export class SignedCommandError extends Error {}

/**
 * The vehicle rejected the session handshake because this key has not been
 * paired with it (added via the Tesla app / NFC card).
 */
export class NotOnVehicleWhitelistError extends SignedCommandError {
    constructor() {
        super(
            "This public key is not on the vehicle's key whitelist. Pair it with the vehicle first.",
        );
    }
}

/**
 * The vehicle rejected a signed command with a `MessageFaultE` other than
 * `MESSAGEFAULT_ERROR_NONE`.
 */
export class SignedCommandFaultError extends SignedCommandError {
    fault: MessageFaultE;

    constructor(fault: MessageFaultE) {
        super(`Vehicle rejected signed command: ${messageFaultEToJSON(fault)}`);
        this.fault = fault;
    }
}

/**
 * A `SignedCommandFaultError` whose fault the vehicle resolves by handing back
 * fresh session info (epoch/counter drift) - `_command` retries these,
 * bounded, by re-signing against the updated session before giving up.
 */
export class RetryableSignedCommandFaultError extends SignedCommandFaultError {}

export function createFaultError(
    fault: MessageFaultE,
): SignedCommandFaultError {
    if (
        fault === MessageFaultE.MESSAGEFAULT_ERROR_INCORRECT_EPOCH ||
        fault === MessageFaultE.MESSAGEFAULT_ERROR_INVALID_TOKEN_OR_COUNTER
    ) {
        return new RetryableSignedCommandFaultError(fault);
    }
    return new SignedCommandFaultError(fault);
}
