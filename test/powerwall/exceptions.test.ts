import { describe, expect, it } from "vitest";
import { TeslaFleetError } from "../../src/exceptions.js";
import {
    PowerwallAuthenticationError,
    PowerwallCommandError,
    PowerwallConnectionError,
    PowerwallError,
    PowerwallFaultError,
    PowerwallKeyRejectedError,
    PowerwallNotSupportedError,
    PowerwallProtocolError,
    PowerwallRateLimitError,
} from "../../src/powerwall/exceptions.js";

describe("Powerwall errors", () => {
    it.each([
        new PowerwallConnectionError("unreachable"),
        new PowerwallRateLimitError("429"),
        new PowerwallAuthenticationError("401"),
        new PowerwallKeyRejectedError("not paired"),
    ])("marks %s failover-safe", (error) => {
        expect((error as { failover_safe?: boolean }).failover_safe).toBe(true);
    });

    it.each([
        new PowerwallCommandError("set_backup_reserve", 3, "invalid"),
        new PowerwallNotSupportedError("set_backup_reserve", 12, "unimplemented"),
        new PowerwallProtocolError("bad"),
        new PowerwallFaultError("MESSAGEFAULT_ERROR_BUSY"),
    ])("does not mark a gateway rejection: %s", (error) => {
        expect((error as { failover_safe?: boolean }).failover_safe).toBeUndefined();
    });

    it("extends Error, not TeslaFleetError", () => {
        const error = new PowerwallConnectionError("unreachable");
        expect(error).toBeInstanceOf(PowerwallError);
        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(TeslaFleetError);
    });

    it("keeps the hierarchy and names", () => {
        const notSupported = new PowerwallNotSupportedError("cmd", 12, "not implemented");
        expect(notSupported).toBeInstanceOf(PowerwallCommandError);
        expect(notSupported).toBeInstanceOf(PowerwallProtocolError);
        expect(new PowerwallKeyRejectedError("no")).toBeInstanceOf(PowerwallAuthenticationError);
        expect(notSupported.name).toBe("PowerwallNotSupportedError");
    });

    it("carries the command and fault details", () => {
        const command = new PowerwallCommandError("cmd", 7, "permission denied");
        expect(command).toMatchObject({ command: "cmd", code: 7, status_message: "permission denied" });
        expect(command.message).toContain("permission denied");
        expect(new PowerwallCommandError("cmd", 7, "").message).toContain("no message");

        const fault = new PowerwallFaultError("MESSAGEFAULT_ERROR_BUSY");
        expect(fault.fault).toBe("MESSAGEFAULT_ERROR_BUSY");
        expect(fault.message).toContain("MESSAGEFAULT_ERROR_BUSY");
    });
});
