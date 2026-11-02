// Errors of the local Powerwall client. They extend `Error`, not
// `TeslaFleetError`: they come from a LAN gateway, never the cloud API. The
// `failover_safe` marker tells a router the gateway gave no usable answer, so
// the next backend may try. A class without it means the gateway answered, and
// the cloud reaches the same gateway.

/** Base class of every local Powerwall error. */
export class PowerwallError extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
        this.name = new.target.name;
    }
}

/** The gateway could not be reached, or the request timed out. */
export class PowerwallConnectionError extends PowerwallError {
    readonly failover_safe = true;
}

/** The gateway refused the password, or the RSA key is unusable, unregistered or not verified. */
export class PowerwallAuthenticationError extends PowerwallError {
    readonly failover_safe = true;
}

/**
 * The gateway password was accepted but the RSA key was not. Lets a repair flow
 * tell a rejected key from a wrong password. Python has no counterpart.
 */
export class PowerwallKeyRejectedError extends PowerwallAuthenticationError {}

/** The gateway answered 429 or 503. Back off before retrying. */
export class PowerwallRateLimitError extends PowerwallError {
    readonly failover_safe = true;
}

/** The gateway answered with something unexpected, such as a bad protobuf or JSON body. */
export class PowerwallProtocolError extends PowerwallError {}

/** A signed request came back with a non-zero `message_fault`. */
export class PowerwallFaultError extends PowerwallError {
    /** The fault's enum name. */
    readonly fault: string;

    constructor(fault: string, message?: string, options?: ErrorOptions) {
        super(message ?? `Powerwall returned message fault: ${fault}`, options);
        this.fault = fault;
    }
}

/** The gateway answered a command with `common.error_response`, or refused it with a result code. */
export class PowerwallCommandError extends PowerwallProtocolError {
    readonly command: string;
    readonly code: number;
    readonly status_message: string;

    constructor(command: string, code: number, status_message: string) {
        super(`Powerwall rejected ${command}: ${status_message || "no message"} (status code ${code})`);
        this.command = command;
        this.code = code;
        this.status_message = status_message;
    }
}

/** The gateway firmware does not implement the command: status code 12, `UNIMPLEMENTED`. */
export class PowerwallNotSupportedError extends PowerwallCommandError {}
