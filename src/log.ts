// Debug-log lines shared by REST requests (`TeslaFleetApi._request`) and
// signed commands (`Commands`), in Python's `command= transport= result=` shape.

/** Receives the library's debug lines. Tokens and PINs are never logged. */
export type Logger = { debug(message: string): void };

/**
 * Parameter and body keys whose values never reach a log. `migrate_to_oauth`
 * sends and receives tokens through `_request`, and PINs travel as body keys
 * (Fleet, Teslemetry) or query parameters (Tessie).
 */
const SECRET_KEYS = new Set(["access_token", "refresh_token", "id_token", "client_secret", "pin"]);
const REDACTED = "[redacted]";

/** `JSON.stringify` for a log line, with secret values replaced at any depth. */
export function redactedJson(value: unknown): string | undefined {
  return JSON.stringify(value, (key, val) => (SECRET_KEYS.has(key) ? REDACTED : val));
}

/** A query string for a log line, with secret values replaced. */
export function redactedQuery(query: URLSearchParams): string {
  const redacted = new URLSearchParams(query);
  for (const key of SECRET_KEYS) {
    if (redacted.has(key)) {
      redacted.set(key, REDACTED);
    }
  }
  return redacted.toString();
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
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
