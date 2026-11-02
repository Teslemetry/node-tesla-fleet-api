// Debug-log lines shared by REST requests (`TeslaFleetApi._request`) and
// signed commands (`Commands`), in Python's `command= transport= result=` shape.

import { TeslaFleetError } from "./exceptions.js";

/** Receives the library's debug lines. Tokens, PINs and passcodes are never logged. */
export type Logger = { debug(message: string): void };

/**
 * Parameter and body keys whose values never reach a log, lower-cased with
 * separators removed. `migrate_to_oauth` sends and receives tokens through
 * `_request`; PINs travel as `pin` or `password` body keys (Fleet, Teslemetry)
 * or query parameters (Tessie); `trigger_homelink` and the telemetry JWS send
 * `token`; a vehicle reply lists `tokens`.
 */
const SECRET_KEYS = new Set([
  "accesstoken",
  "clientsecret",
  "idtoken",
  "password",
  "pin",
  "privatekey",
  "refreshtoken",
  "token",
  "tokens",
]);
const REDACTED = "[redacted]";

function isSecretKey(key: string): boolean {
  return SECRET_KEYS.has(key.replace(/[_-]/g, "").toLowerCase());
}

/** `JSON.stringify` for a log line, with secret values replaced at any depth. */
export function redactedJson(value: unknown): string | undefined {
  return JSON.stringify(value, (key, val) => (isSecretKey(key) ? REDACTED : val));
}

/** A query string for a log line, with secret values replaced. */
export function redactedQuery(query: URLSearchParams): string {
  const redacted = new URLSearchParams(query);
  for (const key of new Set(query.keys())) {
    if (isSecretKey(key)) {
      redacted.set(key, REDACTED);
    }
  }
  return redacted.toString();
}

/**
 * A `TeslaFleetError`'s message is its class's, with per-instance detail in
 * `data`, so it is safe to log. Any other message, or thrown value, comes from
 * outside (a token function, a transport) and may hold a secret, so only its
 * type is logged.
 */
function errorText(error: unknown): string {
  if (error instanceof TeslaFleetError) {
    return `${error.name}: ${error.message}`;
  }
  return error instanceof Error ? error.name : typeof error;
}

/**
 * Log the outcome of a completed request: a command's `result` and `reason`
 * (inside `response`, or at the top level as Tessie replies) when present,
 * otherwise plain success. Mirrors Python's `_log_request_result`.
 */
export function logRequestResult(log: (message: string) => void, command: string, transport: string, data: unknown): void {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    log(`command=${command} transport=${transport} result=success`);
    return;
  }
  const response = (data as Record<string, unknown>).response;
  let result: Record<string, unknown>;
  if (response !== null && typeof response === "object" && "result" in response) {
    result = response as Record<string, unknown>;
  } else if ("result" in data) {
    result = data as Record<string, unknown>;
  } else {
    log(`command=${command} transport=${transport} result=success`);
    return;
  }
  log(`command=${command} transport=${transport} result=${result.result} reason=${result.reason ?? ""}`);
}

/** Log a failed request or command. The error class name carries the failure kind. */
export function logRequestError(log: (message: string) => void, command: string, transport: string, error: unknown): void {
  log(`command=${command} transport=${transport} result=error error=${errorText(error)}`);
}
