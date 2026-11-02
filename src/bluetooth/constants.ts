// GATT identifiers and timing for a Tesla vehicle's BLE link. Durations are in
// milliseconds, so a name carries `_MS` where Python's carries seconds.

/** The vehicle's GATT service. It is never advertised, so never scan for it. */
export const SERVICE_UUID = "00000211-b2d1-43f0-9b88-960cebf8b91e";
/** Client to car. Tesla's Go SDK names the two by the opposite view, hence these names. */
export const VEHICLE_WRITE_UUID = "00000212-b2d1-43f0-9b88-960cebf8b91e";
/** Car to client. */
export const VEHICLE_NOTIFY_UUID = "00000213-b2d1-43f0-9b88-960cebf8b91e";
/** Python's name for `VEHICLE_WRITE_UUID`. */
export const WRITE_UUID = VEHICLE_WRITE_UUID;
/** Python's name for `VEHICLE_NOTIFY_UUID`. */
export const READ_UUID = VEHICLE_NOTIFY_UUID;
/** The keepalive read target. */
export const VERSION_UUID = "00000214-b2d1-43f0-9b88-960cebf8b91e";
/** GATT Device Name. */
export const NAME_UUID = "00002a00-0000-1000-8000-00805f9b34fb";
/** GATT Appearance. */
export const APPEARANCE_UUID = "00002a01-0000-1000-8000-00805f9b34fb";
/** Generic Access, for a backend that needs a service UUID to reach the two above. */
export const GENERIC_ACCESS_UUID = "00001800-0000-1000-8000-00805f9b34fb";
/** Client Characteristic Configuration. Only an ESPHome proxy needs it written by hand. */
export const CCCD_UUID = "00002902-0000-1000-8000-00805f9b34fb";

/** Largest frame accepted, length prefix included. Tesla's Go SDK allows 2 more bytes. */
export const MAX_FRAME_SIZE = 1024;
/**
 * Bytes per write when a connection does not say: the ATT default MTU of 23,
 * less 3 of header. Safe on any link, and all Homey offers, as it hides the MTU.
 */
export const DEFAULT_MAX_WRITE_SIZE = 20;

/** A chunk after this much silence means the partial frame before it was abandoned. */
export const STALE_CHUNK_TIMEOUT_MS = 1000;
/** An idle held link drops at about 42 s on average; a read this often keeps it about 10 times longer. */
export const DEFAULT_KEEPALIVE_INTERVAL_MS = 20_000;
/** Infotainment answers a handshake 4 to 16 s after an RKE wake. */
export const DEFAULT_WAKE_TIMEOUT_MS = 30_000;
/**
 * One infotainment readiness probe. A ready infotainment answers in 0.26 to 0.39 s.
 * The window opens once the request is fully written, so a slow 20-byte link
 * spends none of it writing. Raise it with `wake_probe_timeout_ms` if a link's
 * replies are slower than this, as a probe that keeps timing out never proves
 * the car is ready.
 */
export const DEFAULT_WAKE_PROBE_TIMEOUT_MS = 1000;
/** How often a wake is resent while infotainment stays silent: a first wake can be missed after a long sleep. */
export const WAKE_RESEND_INTERVAL_MS = 3000;
/** How long an awake car's infotainment may take to finish booting. */
export const INFOTAINMENT_BOOT_TIMEOUT_MS = 20_000;
/** How long a charge-port opening has to show in charge state. It took about 1.4 s in live trials. */
export const CHARGE_PORT_VERIFY_TIMEOUT_MS = 5000;
/** Between charge-state polls, while waiting for readiness or for the latch. */
export const CHARGE_PORT_VERIFY_INTERVAL_MS = 250;
/** How long `pair` waits for someone to tap a key card. */
export const DEFAULT_PAIR_TIMEOUT_MS = 300_000;
/** Between `pair`'s checks of whether the key was accepted. */
export const DEFAULT_PAIR_POLL_INTERVAL_MS = 5000;
/** Connect attempts. Each is bounded by `DEFAULT_CONNECT_TIMEOUT_MS`. */
export const DEFAULT_CONNECT_ATTEMPTS = 3;
/** One connect attempt. Python takes the same figure from `bleak-retry-connector`. */
export const DEFAULT_CONNECT_TIMEOUT_MS = 20_000;
/** One scan. It must outlast the backend's window, which Homey fixes at about 5 s. */
export const DEFAULT_SCAN_TIMEOUT_MS = 10_000;
/** Bound on tearing down a link: the failure behind it is what gets reported. */
export const LINK_TEARDOWN_TIMEOUT_MS = 5000;
/**
 * One write call. Not in Python, whose backends bound their own writes. Homey's
 * have no timeout and its link state can be stale, so a hung write must end
 * here. A design choice. BLE-00 step 10 measures how long a failing write takes
 * on Homey, which sets it.
 */
export const GATT_WRITE_TIMEOUT_MS = 5000;
/** One read call, other than a keepalive's. */
export const GATT_READ_TIMEOUT_MS = 5000;
