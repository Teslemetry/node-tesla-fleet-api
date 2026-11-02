import crypto from "crypto";
import {
    Domain,
    Flags,
    MessageFaultE,
    RoutableMessage,
    OperationStatusE as MessageOperationStatusE,
} from "@teslemetry/tesla-protocol/command/universal_message";
import {
    KeyIdentity,
    SessionInfo,
    SessionInfoStatus,
    Tag,
    SignatureType,
} from "@teslemetry/tesla-protocol/command/signatures";
import {
    UnsignedMessage,
    RKEActionE,
    ClosureMoveRequest,
    ClosureMoveTypeE,
    FromVCSECMessage,
    VehicleStatus,
    OperationStatusE as VcsecOperationStatusE,
    WhitelistOperationInformationE,
    operationStatusEToJSON,
    signedMessageInformationEToJSON,
    rKEActionEToJSON,
    whitelistOperationInformationEToJSON,
} from "@teslemetry/tesla-protocol/command/vcsec";
import { genericErrorEToJSON } from "@teslemetry/tesla-protocol/command/errors";
import {
    Action,
    VehicleAction,
    Ping,
    Response,
    OperationStatusE as ActionOperationStatusE,
    ChargingStartStopAction,
    HvacAutoAction,
    VehicleControlFlashLightsAction,
    VehicleControlHonkHornAction,
    VehicleControlCancelSoftwareUpdateAction,
    VehicleControlScheduleSoftwareUpdateAction,
    VehicleControlResetPinToDriveAction,
    VehicleControlResetPinToDriveAdminAction,
    VehicleControlResetValetPinAction,
    VehicleControlSetPinToDriveAction,
    VehicleControlSetSentryModeAction,
    VehicleControlSetValetModeAction,
    VehicleControlSunroofOpenCloseAction,
    VehicleControlTriggerHomelinkAction,
    VehicleControlWindowAction,
    EraseUserDataAction,
    HvacBioweaponModeAction,
    HvacClimateKeeperAction_ClimateKeeperActionE,
    HvacSeatCoolerActions,
    HvacSeatCoolerActions_HvacSeatCoolerAction,
    HvacSeatCoolerActions_HvacSeatCoolerLevelE,
    HvacSeatCoolerActions_HvacSeatCoolerPositionE,
    HvacSeatHeaterActions,
    HvacSeatHeaterActions_HvacSeatHeaterAction,
    HvacSetPreconditioningMaxAction,
    HvacSteeringWheelHeaterAction,
    HvacTemperatureAdjustmentAction,
    AutoSeatClimateAction,
    AutoSeatClimateAction_CarSeat,
    AutoSeatClimateAction_AutoSeatPositionE,
    AutoStwHeatAction,
    StwHeatLevelAction,
    BoomboxAction,
    ChargingSetLimitAction,
    SetChargingAmpsAction,
    SetCabinOverheatProtectionAction,
    SetCopTempAction,
    SetVehicleNameAction,
    MediaUpdateVolume,
    NavigationGpsRequest,
    NavigationRequest,
    NavigationSuperchargerRequest,
    DrivingSetSpeedLimitAction,
    DrivingSpeedLimitAction,
    DrivingClearSpeedLimitPinAction,
    DrivingClearSpeedLimitPinAdminAction,
    ScheduledChargingAction,
    ScheduledDepartureAction,
    TakeDrivenoteAction,
    UiSetUpcomingCalendarEntries,
} from "@teslemetry/tesla-protocol/command/car_server";
import { Void, LatLong, PreconditioningTimes, OffPeakChargingTimes, StwHeatLevel } from "@teslemetry/tesla-protocol/command/common";
import { VehicleData, VehicleState_GuestMode, ClimateState_CopActivationTemp } from "@teslemetry/tesla-protocol/command/vehicle";
import { ClimateMode, ClimateModes, CommandResponse, Level, Seat, Seats, Trunk } from "./types/commands.js";
import { AutoSeat } from "./const.js";
import Vehicle from "./vehicle.js";
import VehicleSpecific from "./vehiclespecific.js";
import { sign_fleet_telemetry_config } from "./signing/jws.js";
import { Session, SessionKeys } from "./signing/session.js";
import { logRequestError, logRequestResult } from "./log.js";
import { aesGcmDecrypt, aesGcmEncrypt, deriveSharedKey, publicKeyFor, sha256, uint32BE } from "./signing/crypto.js";
import {
    InvalidResponse,
    MESSAGE_FAULTS,
    NotOnWhitelistFault,
    SIGNED_MESSAGE_INFORMATION_FAULTS,
    SessionInfoAuthenticationFault,
    SignedCommandResponseReplayed,
    SigningDisabled,
    TeslaFleetMessageFault,
    TeslaFleetMessageFaultIncorrectEpoch,
    TeslaFleetMessageFaultInvalidTokenOrCounter,
    WHITELIST_OPERATION_STATUS,
    WhitelistOperationStatus,
} from "./exceptions.js";

const VOID: Void = {};

/** A signed command's outcome, with any other `Response` payload under its field name. */
export interface SignedCommandResponse extends CommandResponse {
    response: CommandResponse["response"] & Partial<Omit<Response, "actionStatus" | "vehicleData" | "ping">>;
}

/** Which field of a reply `_send` waits for: a command's payload, or a handshake's session info. */
export type SendRequires = "protobuf_message_as_bytes" | "session_info";

/**
 * How `_send` waits for a reply. Each option only applies to a transport that
 * frames its own replies: `VehicleSigned` ignores them all.
 */
export interface SendOptions {
    /** `false` for a VCSEC actuation, whose reply is one terminal ack with no data after it. Defaults to `true`. */
    expectsData?: boolean;
    /** The whole reply wait. Defaults to the transport's own timeout. */
    timeoutMs?: number;
    /** Return as soon as the message is written, without a reply. */
    optimistic?: boolean;
    /** Lets an unsolicited state broadcast confirm the command alongside the addressed ack. */
    confirmBroadcast?: (status: VehicleStatus) => boolean;
}

/** What one signed dispatch resolves to: a command outcome, or the data a read asked for. */
export type SignedReply = SignedCommandResponse | { response: VehicleData } | { response: VehicleStatus };

/** Maximum HMAC-personalized (re)send attempts for one logical command, matching the reference implementation. */
const MAX_ATTEMPTS = 4;

const TrunkFields: Record<Trunk, "frontTrunk" | "rearTrunk"> = {
    front: "frontTrunk",
    rear: "rearTrunk",
};

/** Node's REST `Seats` values mapped onto the seat-heater oneof field they select. */
const SeatHeaterFields: Partial<Record<number, keyof HvacSeatHeaterActions_HvacSeatHeaterAction>> = {
    [Seats.FRONT_LEFT]: "carSeatFrontLeft",
    [Seats.FRONT_RIGHT]: "carSeatFrontRight",
    [Seats.REAR_LEFT]: "carSeatRearLeft",
    [Seats.REAR_LEFT_BACK]: "carSeatRearLeftBack",
    [Seats.REAR_CENTER]: "carSeatRearCenter",
    [Seats.REAR_RIGHT]: "carSeatRearRight",
    [Seats.REAR_RIGHT_BACK]: "carSeatRearRightBack",
    [Seats.THIRD_LEFT]: "carSeatThirdRowLeft",
    [Seats.THIRD_RIGHT]: "carSeatThirdRowRight",
};

const SeatHeaterLevels: Array<keyof HvacSeatHeaterActions_HvacSeatHeaterAction> = [
    "seatHeaterOff",
    "seatHeaterLow",
    "seatHeaterMed",
    "seatHeaterHigh",
];

/** Seat cooling and auto-climate only cover the front seats on the wire protocol. */
const SeatCoolerPositions: Partial<Record<number, HvacSeatCoolerActions_HvacSeatCoolerPositionE>> = {
    [Seats.FRONT_LEFT]: HvacSeatCoolerActions_HvacSeatCoolerPositionE.HvacSeatCoolerPosition_FrontLeft,
    [Seats.FRONT_RIGHT]: HvacSeatCoolerActions_HvacSeatCoolerPositionE.HvacSeatCoolerPosition_FrontRight,
};

const SeatCoolerLevels = [
    HvacSeatCoolerActions_HvacSeatCoolerLevelE.HvacSeatCoolerLevel_Off,
    HvacSeatCoolerActions_HvacSeatCoolerLevelE.HvacSeatCoolerLevel_Low,
    HvacSeatCoolerActions_HvacSeatCoolerLevelE.HvacSeatCoolerLevel_Med,
    HvacSeatCoolerActions_HvacSeatCoolerLevelE.HvacSeatCoolerLevel_High,
];

/** Keyed by the 1-indexed `AutoSeat` REST value, which equals the proto enum value. */
const AutoSeatPositions: Partial<Record<number, AutoSeatClimateAction_AutoSeatPositionE>> = {
    [AutoSeat.FRONT_LEFT]: AutoSeatClimateAction_AutoSeatPositionE.AutoSeatPosition_FrontLeft,
    [AutoSeat.FRONT_RIGHT]: AutoSeatClimateAction_AutoSeatPositionE.AutoSeatPosition_FrontRight,
};

const StwHeatLevels = [StwHeatLevel.StwHeatLevel_Off, StwHeatLevel.StwHeatLevel_Low, StwHeatLevel.StwHeatLevel_High];

const ClimateKeeperActions: Record<number, HvacClimateKeeperAction_ClimateKeeperActionE> = {
    [ClimateModes.Off]: HvacClimateKeeperAction_ClimateKeeperActionE.ClimateKeeperAction_Off,
    [ClimateModes.Keep]: HvacClimateKeeperAction_ClimateKeeperActionE.ClimateKeeperAction_On,
    [ClimateModes.Dog]: HvacClimateKeeperAction_ClimateKeeperActionE.ClimateKeeperAction_Dog,
    [ClimateModes.Camp]: HvacClimateKeeperAction_ClimateKeeperActionE.ClimateKeeperAction_Camp,
};

/** `set_cop_temp` accepts either the enum index or the Celsius/Fahrenheit value it represents. */
const CopActivationTemps: Record<number, ClimateState_CopActivationTemp> = {
    0: ClimateState_CopActivationTemp.CopActivationTempLow,
    30: ClimateState_CopActivationTemp.CopActivationTempLow,
    90: ClimateState_CopActivationTemp.CopActivationTempLow,
    1: ClimateState_CopActivationTemp.CopActivationTempMedium,
    35: ClimateState_CopActivationTemp.CopActivationTempMedium,
    95: ClimateState_CopActivationTemp.CopActivationTempMedium,
    2: ClimateState_CopActivationTemp.CopActivationTempHigh,
    40: ClimateState_CopActivationTemp.CopActivationTempHigh,
    100: ClimateState_CopActivationTemp.CopActivationTempHigh,
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The name of a message's populated oneof field, as `WhichOneof` gives it in
 * Python. ts-proto leaves unset oneof members `undefined`; `plainFields` names
 * any fields outside the oneof, which always carry a value.
 */
function populatedField(message: object, plainFields: readonly string[] = []): string | undefined {
    return Object.entries(message).find(([key, value]) => value !== undefined && !plainFields.includes(key))?.[0];
}

/** A short debug-log name for a VCSEC command: the RKE action name, or the populated field. */
export function vcsec_command_name(command: UnsignedMessage): string {
    if (command.RKEAction !== undefined) {
        return rKEActionEToJSON(command.RKEAction);
    }
    return populatedField(command) ?? "unknown";
}

/** A short debug-log name for an infotainment command: the populated `VehicleAction` field. */
export function infotainment_command_name(command: Action): string {
    return (command.vehicleAction && populatedField(command.vehicleAction, ["dropNominalSuccessResponses"])) ?? "unknown";
}

function ok(reason: string = ""): CommandResponse {
    return { response: { result: true, reason } };
}

function fail(reason: string): CommandResponse {
    return { response: { result: false, reason } };
}

/**
 * Day names Tesla's vehicle-command proxy accepts for `days_of_week`, which the
 * REST route takes as a comma-joined string rather than the proto bitmask.
 */
export const DAY_OF_WEEK_BITS: Readonly<Record<string, number>> = {
    SUN: 1,
    SUNDAY: 1,
    MON: 2,
    MONDAY: 2,
    TUES: 4,
    TUESDAY: 4,
    WED: 8,
    WEDNESDAY: 8,
    THURS: 16,
    THURSDAY: 16,
    FRI: 32,
    FRIDAY: 32,
    SAT: 64,
    SATURDAY: 64,
    ALL: 127,
    WEEKDAYS: 62,
};

/**
 * Convert a bitmask or comma-joined day names (e.g. `"Mon,Wed"`, `"All"`) to the proto bitmask.
 * @throws Error for an unknown day name.
 */
export function days_of_week_mask(days_of_week: string | number): number {
    if (typeof days_of_week === "number") return Math.trunc(days_of_week);
    if (/^\d+$/.test(days_of_week.trim())) return parseInt(days_of_week.trim(), 10);
    let mask = 0;
    for (const day of days_of_week.split(",")) {
        const bit = DAY_OF_WEEK_BITS[day.trim().toUpperCase()];
        if (bit === undefined) throw new Error(`Invalid day of week: ${day}`);
        mask |= bit;
    }
    return mask;
}

/**
 * Transport-agnostic signed-command builder for the Tesla Vehicle Command
 * Protocol: mirrors `python-tesla-fleet-api`'s `Commands` ABC. Every method
 * here builds a `RoutableMessage`, signs it by `authMethod`, and dispatches
 * it through the single abstract seam `_send`. A concrete subclass fills that
 * seam for one transport: the cloud `/signed_command` HTTP endpoint
 * (`VehicleSigned`) today, a BLE GATT link next. The protected members are
 * what such a transport builds on.
 *
 * `"hmac"` signs a plaintext command. `"aes"` encrypts it with AES-GCM and asks
 * the vehicle to encrypt its reply, which firmware before 2024.38 ignores.
 */
export default abstract class Commands extends VehicleSpecific {
    // Native private fields (not `protected`/TS-only `private`): the raw key
    // must not be reachable off the instance, e.g. via a naive
    // JSON.stringify/structured log, not just inaccessible to outside code
    // at compile time.
    #privateKey: Buffer | null;
    #publicKey: Buffer;
    /** Delay between WAIT-retries; overridable so tests don't have to wait for real timers. */
    protected retryDelayMs = 2000;
    /** Session-info requests sent before a handshake gives up on replies that fail authentication. */
    protected handshakeAttempts = 3;
    /** Delay between those requests. */
    protected handshakeRetryDelayMs = 1000;
    /** How `buildMessage` signs a command. */
    protected authMethod: "hmac" | "aes" = "hmac";
    /** One random routing address per instance: replies addressed to it are ours. */
    protected readonly fromDestination: Buffer;
    private readonly sessions: Partial<Record<Domain, Session>>;
    /** Transport identity for debug logging; set per concrete subclass. */
    abstract readonly _transport_name: string;

    /**
     * @param parent
     * @param vin
     * @param privateKey Raw 32-byte P-256 scalar. `undefined` falls back to the parent's key, and throws if there is none. `false` disables signing, for a passive listener that never sends a command: any handshake then raises `SigningDisabled`.
     * @param publicKey Uncompressed P-256 point. Derived from `privateKey` if omitted.
     */
    constructor(parent: Vehicle, vin: string, privateKey?: Buffer | false, publicKey?: Buffer) {
        super(parent, vin);

        if (vin.length !== 17) {
            throw new Error(`Signed commands require a 17-character VIN, got ${vin.length} characters.`);
        }

        // An identity check, not truthiness: `undefined` must keep falling back
        // to the parent's key rather than silently disabling signing.
        if (privateKey === false) {
            this.#privateKey = null;
        } else {
            const resolvedPrivateKey = privateKey ?? parent.private_key ?? parent.parent.private_key;
            if (!resolvedPrivateKey) {
                throw new Error("No private key provided for signed commands.");
            }
            this.#privateKey = resolvedPrivateKey;
        }
        this.#publicKey = publicKey ?? (this.#privateKey ? publicKeyFor(this.#privateKey) : Buffer.alloc(0));

        this.fromDestination = crypto.randomBytes(16);
        const deriveKey = (vehiclePublicKey: Buffer) => this.shared_key(vehiclePublicKey);
        this.sessions = {
            [Domain.DOMAIN_VEHICLE_SECURITY]: new Session(Domain.DOMAIN_VEHICLE_SECURITY, deriveKey),
            [Domain.DOMAIN_INFOTAINMENT]: new Session(Domain.DOMAIN_INFOTAINMENT, deriveKey),
        };
    }

    /** The uncompressed public key this instance signs with. Empty when signing is disabled. */
    protected get publicKey(): Buffer {
        return this.#publicKey;
    }

    /** Derive the 16-byte shared key used for signed-command session encryption. */
    shared_key(vehicleKey: Buffer): Buffer {
        if (this.#privateKey === null) {
            throw new SigningDisabled();
        }
        return deriveSharedKey(this.#privateKey, vehicleKey);
    }

    /** A Tesla.SS256 JWS over a Fleet Telemetry config, signed here so the key never leaves this class. */
    protected signFleetTelemetryConfig(config: Readonly<Record<string, unknown>>): string {
        if (this.#privateKey === null) {
            throw new SigningDisabled();
        }
        return sign_fleet_telemetry_config(this.#privateKey, config);
    }

    /**
     * Transmit a signed (or session-handshake) `RoutableMessage` to the
     * vehicle and return its reply. Implementations must call
     * `validate_msg(resp, msg.uuid)` on the reply before returning it, and
     * must not take `Session.withLock`: `dispatch` already holds that lock
     * across `_send` for VCSEC, and it is not reentrant.
     */
    protected abstract _send(msg: RoutableMessage, requires: SendRequires, options?: SendOptions): Promise<RoutableMessage>;

    protected sessionFor(domain: Domain): Session {
        const session = this.sessions[domain];
        if (!session) {
            throw new Error(`No signed-command session configured for domain ${domain}.`);
        }
        return session;
    }

    /**
     * Absorb session info piggy-backed on any signed-command reply and raise
     * on a whitelist rejection or a terminal message fault. Every concrete
     * `_send` must call this on the reply - passing the `uuid` of the request
     * it just sent - before returning it.
     *
     * A `SessionInfo` is untrusted wire data until its `session_info_tag` is
     * verified: the tag is an HMAC over the exact bytes received, keyed by a
     * key derived from the *candidate* vehicle public key carried inside that
     * same SessionInfo, and bound to this request's `uuid` as a challenge (so
     * a captured older reply can't be replayed against a newer request). Only
     * once that tag checks out do we act on anything the message claims -
     * including its own whitelist-status field - and even then `Session.commit`
     * still refuses a clock time that regresses within the same epoch.
     *
     * The one exception is an empty public key: no shared key can be derived
     * from it to verify a tag. An unpaired key has no session, so
     * key-not-on-whitelist is the only real reply that omits the key, and that
     * one status is accepted unauthenticated. Any other status with no key is
     * malformed.
     */
    validate_msg(resp: RoutableMessage, requestUuid: Buffer): void {
        if (resp.sessionInfo && resp.sessionInfo.length > 0) {
            const domain = resp.fromDestination?.domain;
            const session = domain !== undefined ? this.sessions[domain] : undefined;
            if (!session) {
                throw new SessionInfoAuthenticationFault("Session info reply is missing a recognized source domain.");
            }

            // VCSEC typically leaves request_uuid empty on real vehicles
            // (memory constraints), so its absence must not be treated as a
            // rejection - the tag below, which binds the *sent* requestUuid
            // as TAG_CHALLENGE, is the actual authentication. Only cross-check
            // the echo when the vehicle chose to populate it.
            if (resp.requestUuid && resp.requestUuid.length > 0 && !requestUuid.equals(Buffer.from(resp.requestUuid))) {
                throw new SessionInfoAuthenticationFault("Session info reply does not match an outstanding request; discarded.");
            }

            let info: SessionInfo;
            try {
                info = SessionInfo.decode(resp.sessionInfo);
            } catch (cause) {
                throw new SessionInfoAuthenticationFault("Session info reply could not be decoded.", null, { cause });
            }

            if (info.publicKey.length === 0) {
                if (info.status === SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST) {
                    throw new NotOnWhitelistFault();
                }
                throw new SessionInfoAuthenticationFault("Session info reply has no public key.");
            }

            let keys: SessionKeys;
            try {
                keys = session.keysFor(Buffer.from(info.publicKey));
            } catch (cause) {
                throw new SessionInfoAuthenticationFault("Session info reply has an invalid public key.", null, { cause });
            }

            const tag = resp.signatureData?.sessionInfoTag?.tag;
            if (!tag || tag.length === 0) {
                throw new SessionInfoAuthenticationFault("Session info reply is missing its authentication tag; discarded.");
            }
            const metadata = Buffer.concat([
                Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC]),
                Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
                Buffer.from(this.vin, "ascii"),
                Buffer.from([Tag.TAG_CHALLENGE, requestUuid.length]),
                requestUuid,
                Buffer.from([Tag.TAG_END]),
            ]);
            const expectedTag = crypto
                .createHmac("sha256", keys.sessionInfoKey)
                .update(Buffer.concat([metadata, Buffer.from(resp.sessionInfo)]))
                .digest();
            const receivedTag = Buffer.from(tag);
            if (expectedTag.length !== receivedTag.length || !crypto.timingSafeEqual(expectedTag, receivedTag)) {
                throw new SessionInfoAuthenticationFault("Session info reply failed authentication (invalid tag); discarded.");
            }

            // Only now that the reply is authenticated do we act on its contents.
            if (info.status === SessionInfoStatus.SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST) {
                throw new NotOnWhitelistFault();
            }
            if (!session.commit(info, keys)) {
                throw new SessionInfoAuthenticationFault("Session info reply is stale (clock regressed within the same epoch); discarded.");
            }
        }

        const fault = resp.signedMessageStatus?.signedMessageFault;
        if (fault !== undefined && fault !== MessageFaultE.MESSAGEFAULT_ERROR_NONE) {
            const cls = MESSAGE_FAULTS[fault] ?? TeslaFleetMessageFault;
            throw new cls({ fault });
        }
    }

    /** The unsigned session-info request that opens a domain session. */
    protected sessionInfoRequest(domain: Domain): RoutableMessage {
        return RoutableMessage.create({
            toDestination: { domain },
            fromDestination: { routingAddress: this.fromDestination },
            sessionInfoRequest: { publicKey: this.#publicKey },
            uuid: crypto.randomBytes(16),
        });
    }

    /**
     * Open or refresh a domain session. A reply that fails authentication is
     * discarded and the unsigned, idempotent request sent again, rather than
     * failing the handshake on one bad reply. Never trusted either way.
     *
     * For VCSEC the caller must hold the session lock; `ensureHandshake` and
     * `handshakeVehicleSecurity` do.
     * @returns Whether the session can now sign.
     * @throws SigningDisabled before anything is sent, when this instance has no key.
     */
    protected async handshake(domain: Domain, options?: SendOptions): Promise<boolean> {
        if (this.#privateKey === null) {
            throw new SigningDisabled();
        }
        for (let attempt = 1; ; attempt++) {
            try {
                await this._send(this.sessionInfoRequest(domain), "session_info", options);
                return this.sessionFor(domain).ready;
            } catch (error) {
                if (!(error instanceof SessionInfoAuthenticationFault) || attempt >= this.handshakeAttempts) {
                    throw error;
                }
                await sleep(this.handshakeRetryDelayMs);
            }
        }
    }

    /**
     * Open a domain session unless one is ready, for a subclass that must know
     * it can sign before it dispatches. Do not call this from inside the VCSEC
     * session lock, which it takes.
     */
    protected async ensureHandshake(domain: Domain): Promise<void> {
        const session = this.sessionFor(domain);
        if (domain !== Domain.DOMAIN_VEHICLE_SECURITY) {
            if (!session.ready) {
                await this.handshake(domain);
            }
            return;
        }
        await session.withLock(async () => {
            if (!session.ready) {
                await this.handshake(domain);
            }
        });
    }

    /** Perform a handshake with the vehicle security domain, even if a session is already established. */
    async handshakeVehicleSecurity(): Promise<void> {
        const session = this.sessionFor(Domain.DOMAIN_VEHICLE_SECURITY);
        await session.withLock(() => this.handshake(Domain.DOMAIN_VEHICLE_SECURITY));
    }

    /** Perform a handshake with the infotainment domain, even if a session is already established. */
    async handshakeInfotainment(): Promise<void> {
        await this.handshake(Domain.DOMAIN_INFOTAINMENT);
    }

    /** Sign `command` for `session` by `authMethod`. Assigns a counter, so run it under the session lock. */
    protected buildMessage(session: Session, command: Buffer): RoutableMessage {
        return this.authMethod === "aes" ? this.buildAesMessage(session, command) : this.buildHmacMessage(session, command);
    }

    private buildHmacMessage(session: Session, command: Buffer): RoutableMessage {
        const personalized = session.hmacPersonalized();
        if (!session.hmacKey) {
            throw new Error("Session HMAC key is missing.");
        }

        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]),
            Buffer.from([Tag.TAG_DOMAIN, 1, session.domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(this.vin, "ascii"),
            Buffer.from([Tag.TAG_EPOCH, personalized.epoch.length]),
            Buffer.from(personalized.epoch),
            Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
            uint32BE(personalized.expiresAt),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(personalized.counter),
            Buffer.from([Tag.TAG_END]),
        ]);

        const tag = crypto.createHmac("sha256", session.hmacKey).update(Buffer.concat([metadata, command])).digest();

        return RoutableMessage.create({
            toDestination: { domain: session.domain },
            fromDestination: { routingAddress: this.fromDestination },
            protobufMessageAsBytes: command,
            uuid: crypto.randomBytes(16),
            signatureData: {
                signerIdentity: KeyIdentity.create({ publicKey: this.#publicKey }),
                HMACPersonalizedData: { ...personalized, tag },
            },
        });
    }

    private buildAesMessage(session: Session, command: Buffer): RoutableMessage {
        const personalized = session.aesGcmPersonalized();
        if (!session.sharedKey) {
            throw new Error("Session shared key is missing.");
        }

        const flags = 1 << Flags.FLAG_ENCRYPT_RESPONSE;
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_AES_GCM_PERSONALIZED]),
            Buffer.from([Tag.TAG_DOMAIN, 1, session.domain]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(this.vin, "ascii"),
            Buffer.from([Tag.TAG_EPOCH, personalized.epoch.length]),
            Buffer.from(personalized.epoch),
            Buffer.from([Tag.TAG_EXPIRES_AT, 4]),
            uint32BE(personalized.expiresAt),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(personalized.counter),
            Buffer.from([Tag.TAG_FLAGS, 4]),
            uint32BE(flags),
            Buffer.from([Tag.TAG_END]),
        ]);

        const { ciphertext, tag } = aesGcmEncrypt(session.sharedKey, personalized.nonce, command, sha256(metadata));

        return RoutableMessage.create({
            toDestination: { domain: session.domain },
            fromDestination: { routingAddress: this.fromDestination },
            protobufMessageAsBytes: ciphertext,
            uuid: crypto.randomBytes(16),
            flags,
            signatureData: {
                signerIdentity: KeyIdentity.create({ publicKey: this.#publicKey }),
                AESGCMPersonalizedData: { ...personalized, tag },
            },
        });
    }

    /** The authentication method of `request` followed by its tag, which a response's metadata binds to. */
    private requestHash(session: Session, request: RoutableMessage): Buffer {
        const aes = request.signatureData?.AESGCMPersonalizedData;
        if (aes) {
            return Buffer.concat([Buffer.from([SignatureType.SIGNATURE_TYPE_AES_GCM_PERSONALIZED]), aes.tag]);
        }
        const hmac = request.signatureData?.HMACPersonalizedData;
        if (!hmac) {
            throw new Error("Invalid request signature data.");
        }
        const hash = Buffer.concat([Buffer.from([SignatureType.SIGNATURE_TYPE_HMAC_PERSONALIZED]), hmac.tag]);
        return session.domain === Domain.DOMAIN_VEHICLE_SECURITY ? hash.subarray(0, 17) : hash;
    }

    /**
     * Open an encrypted reply to `request`. A reply with no `AESGCMResponseData`
     * is plaintext and comes back as it is.
     *
     * A reply that fails to open cannot be trusted, and says nothing about
     * whether the command ran.
     * @returns The reply with its payload in the clear.
     * @throws Error when the reply fails to open.
     * @throws SignedCommandResponseReplayed when this request already saw this response counter.
     */
    protected decryptResponse(session: Session, request: RoutableMessage, resp: RoutableMessage): RoutableMessage {
        const data = resp.signatureData?.AESGCMResponseData;
        if (!data || resp.protobufMessageAsBytes === undefined) {
            return resp;
        }
        if (!session.sharedKey) {
            throw new Error("Session shared key is missing.");
        }

        const requestHash = this.requestHash(session, request);
        const metadata = Buffer.concat([
            Buffer.from([Tag.TAG_SIGNATURE_TYPE, 1, SignatureType.SIGNATURE_TYPE_AES_GCM_RESPONSE]),
            Buffer.from([Tag.TAG_DOMAIN, 1, resp.fromDestination?.domain ?? Domain.DOMAIN_BROADCAST]),
            Buffer.from([Tag.TAG_PERSONALIZATION, 17]),
            Buffer.from(this.vin, "ascii"),
            Buffer.from([Tag.TAG_COUNTER, 4]),
            uint32BE(data.counter),
            Buffer.from([Tag.TAG_FLAGS, 4]),
            uint32BE(resp.flags),
            Buffer.from([Tag.TAG_REQUEST_HASH, requestHash.length]),
            requestHash,
            Buffer.from([Tag.TAG_FAULT, 4]),
            uint32BE(resp.signedMessageStatus?.signedMessageFault ?? 0),
            Buffer.from([Tag.TAG_END]),
        ]);

        const plaintext = aesGcmDecrypt(session.sharedKey, data.nonce, resp.protobufMessageAsBytes, data.tag, sha256(metadata));
        if (!session.record_response_counter(requestHash, data.counter)) {
            throw new SignedCommandResponseReplayed();
        }
        return { ...resp, protobufMessageAsBytes: plaintext };
    }

    /**
     * Build, sign, dispatch (with WAIT/epoch-fault retry), and interpret one
     * domain command.
     *
     * VCSEC requires messages to arrive in strict counter order and warns
     * clients to avoid simultaneous requests to it at all (unlike
     * Infotainment, which tolerates a sliding window) - so for
     * `DOMAIN_VEHICLE_SECURITY` the *entire* dispatch (handshake, build,
     * send, and any retry) runs under the domain's lock, guaranteeing at
     * most one VCSEC message is ever in flight. Infotainment keeps the
     * narrower build-only lock, serializing only counter assignment.
     */
    protected async dispatch(domain: Domain, command: Buffer, options: Omit<SendOptions, "optimistic"> = {}): Promise<SignedReply> {
        const session = this.sessionFor(domain);
        const serializeWholeDispatch = domain === Domain.DOMAIN_VEHICLE_SECURITY;

        const run = async (): Promise<SignedReply> => {
            if (!session.ready) {
                await this.handshake(domain);
            }

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                const msg = serializeWholeDispatch
                    ? this.buildMessage(session, command)
                    : await session.withLock(() => this.buildMessage(session, command));

                let resp: RoutableMessage;
                try {
                    resp = await this._send(msg, "protobuf_message_as_bytes", options);
                } catch (error) {
                    // Epoch/counter drift: the reply carried fresh session info, so re-sign and resend.
                    const retryable =
                        error instanceof TeslaFleetMessageFaultIncorrectEpoch ||
                        error instanceof TeslaFleetMessageFaultInvalidTokenOrCounter;
                    if (retryable && attempt < MAX_ATTEMPTS - 1) {
                        continue;
                    }
                    throw error;
                }

                if (resp.signedMessageStatus?.operationStatus === MessageOperationStatusE.OPERATIONSTATUS_WAIT) {
                    if (attempt >= MAX_ATTEMPTS - 1) {
                        return fail("Too many retries");
                    }
                    await sleep(this.retryDelayMs);
                    continue;
                }

                const result = this.interpretResponse(this.decryptResponse(session, msg, resp), options.expectsData ?? true);
                if (result === "wait") {
                    if (attempt >= MAX_ATTEMPTS - 1) {
                        return fail("Too many retries");
                    }
                    await sleep(this.retryDelayMs);
                    continue;
                }
                return result;
            }

            return fail("Too many retries");
        };

        return serializeWholeDispatch ? session.withLock(run) : run();
    }

    private interpretResponse(resp: RoutableMessage, expectsData: boolean): SignedReply | "wait" {
        if (!resp.protobufMessageAsBytes || resp.protobufMessageAsBytes.length === 0) {
            return ok();
        }

        const domain = resp.fromDestination?.domain;
        if (domain === Domain.DOMAIN_VEHICLE_SECURITY) {
            return this.interpretVcsecResponse(resp.protobufMessageAsBytes, expectsData);
        }
        if (domain === Domain.DOMAIN_INFOTAINMENT) {
            return this.interpretInfotainmentResponse(resp.protobufMessageAsBytes);
        }
        return ok();
    }

    private interpretVcsecResponse(bytes: Uint8Array, expectsData: boolean): SignedReply | "wait" {
        const vcsec = FromVCSECMessage.decode(bytes);

        if (vcsec.nominalError) {
            return fail(genericErrorEToJSON(vcsec.nominalError.genericError));
        }
        if (vcsec.vehicleStatus) {
            // An actuation has no data reply of its own: a populated
            // vehicleStatus there stands in for the ack. Only a read wants it.
            return expectsData ? { response: vcsec.vehicleStatus } : ok();
        }
        if (vcsec.commandStatus) {
            const status = vcsec.commandStatus;
            if (status.operationStatus === VcsecOperationStatusE.OPERATIONSTATUS_OK) {
                // A rejected whitelist operation still replies OK at this level.
                this.raiseWhitelistFault(status.whitelistOperationStatus?.whitelistOperationInformation);
                return ok();
            }
            if (status.operationStatus === VcsecOperationStatusE.OPERATIONSTATUS_WAIT) {
                return "wait";
            }
            if (status.operationStatus === VcsecOperationStatusE.OPERATIONSTATUS_ERROR) {
                // ERROR is a car-side refusal whatever the sub-message carries,
                // so it must never reach success; the sub-message only picks the
                // exception.
                if (status.signedMessageStatus) {
                    const information = status.signedMessageStatus.signedMessageInformation;
                    const cls = SIGNED_MESSAGE_INFORMATION_FAULTS[information];
                    if (cls) {
                        throw new cls({ information: signedMessageInformationEToJSON(information) });
                    }
                } else {
                    this.raiseWhitelistFault(status.whitelistOperationStatus?.whitelistOperationInformation);
                }
                return fail(operationStatusEToJSON(status.operationStatus));
            }
        }
        return ok();
    }

    private raiseWhitelistFault(information: WhitelistOperationInformationE | undefined): void {
        if (!information) {
            return;
        }
        if (information >= WHITELIST_OPERATION_STATUS.length) {
            throw new WhitelistOperationStatus(`Unknown whitelist operation failure: ${information}`);
        }
        const cls = WHITELIST_OPERATION_STATUS[information];
        if (cls) {
            throw new cls({ information: whitelistOperationInformationEToJSON(information) });
        }
    }

    private interpretInfotainmentResponse(bytes: Uint8Array): SignedReply {
        const response = Response.decode(bytes);
        if (response.ping) {
            return ok(response.ping.localTimestamp?.toISOString() ?? "");
        }
        if (response.vehicleData) {
            return { response: response.vehicleData };
        }
        // Any other response_msg member reaches the caller under its field
        // name, so an empty payload differs from an undecoded one.
        const field = populatedField(response, ["actionStatus"]);
        const data = field ? { [field]: response[field as keyof Response] } : {};
        if (response.actionStatus) {
            return {
                response: {
                    result: response.actionStatus.result === ActionOperationStatusE.OPERATIONSTATUS_OK,
                    reason: response.actionStatus.resultReason?.plainText ?? "",
                    ...data,
                },
            };
        }
        return { response: { result: true, reason: "", ...data } };
    }

    /** Dispatch one signed command, logging its name, transport and outcome. */
    private async dispatchLogged(name: string, domain: Domain, command: Buffer, options?: Omit<SendOptions, "optimistic">): Promise<SignedReply> {
        const log = (message: string) => this.parent.parent._log(message);
        let result: SignedReply;
        try {
            result = await this.dispatch(domain, command, options);
        } catch (error) {
            logRequestError(log, name, this._transport_name, error);
            throw error;
        }
        logRequestResult(log, name, this._transport_name, result);
        return result;
    }

    /** The data a read asked for. A reply that only reports an outcome carries none. */
    private readData<T extends VehicleData | VehicleStatus>(reply: SignedReply): T {
        if ("result" in reply.response) {
            throw new InvalidResponse({ result: reply.response.result, reason: reply.response.reason });
        }
        return reply.response as T;
    }

    /** Sign and send an actuation: its reply is a bare terminal ack, so `expectsData` is false. */
    protected async sendVehicleSecurity(
        command: UnsignedMessage,
        options: Pick<SendOptions, "confirmBroadcast"> = {},
    ): Promise<CommandResponse> {
        const reply = await this.dispatchLogged(
            vcsec_command_name(command),
            Domain.DOMAIN_VEHICLE_SECURITY,
            Buffer.from(UnsignedMessage.encode(command).finish()),
            { ...options, expectsData: false },
        );
        return reply as CommandResponse;
    }

    /**
     * Sign and send a read to the Vehicle Security computer.
     * @throws InvalidResponse when the reply carries no `VehicleStatus`.
     */
    protected async _getVehicleSecurity(command: UnsignedMessage): Promise<VehicleStatus> {
        const reply = await this.dispatchLogged(
            vcsec_command_name(command),
            Domain.DOMAIN_VEHICLE_SECURITY,
            Buffer.from(UnsignedMessage.encode(command).finish()),
        );
        return this.readData<VehicleStatus>(reply);
    }

    /**
     * Sign and send a command to the Infotainment computer. Reads go through
     * `_getInfotainment`. `mutating` is false for a command that cannot change
     * the vehicle, so a transport can give up on it rather than ask whether it
     * ran; `ping` is the only one. The cloud transport has no use for it.
     */
    protected async sendInfotainment(action: Action, _options: { mutating?: boolean } = {}): Promise<SignedCommandResponse> {
        const reply = await this.dispatchLogged(
            infotainment_command_name(action),
            Domain.DOMAIN_INFOTAINMENT,
            Buffer.from(Action.encode(action).finish()),
        );
        return reply as SignedCommandResponse;
    }

    /**
     * Sign and send a read to the Infotainment computer.
     * @throws InvalidResponse when the reply carries no `VehicleData`.
     */
    protected async _getInfotainment(action: Action): Promise<VehicleData> {
        const reply = await this.dispatchLogged(
            infotainment_command_name(action),
            Domain.DOMAIN_INFOTAINMENT,
            Buffer.from(Action.encode(action).finish()),
        );
        return this.readData<VehicleData>(reply);
    }

    protected vehicleAction(action: VehicleAction, options?: { mutating?: boolean }): Promise<SignedCommandResponse> {
        return this.sendInfotainment(Action.create({ vehicleAction: action }), options);
    }

    private resolveSeat(seat_position: Seat | number): number {
        return typeof seat_position === "string" ? Seats[seat_position] : seat_position;
    }

    // Vehicle Commands

    /** Pings the vehicle. On success, `reason` is the vehicle's timestamp in ISO 8601. */
    async ping(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ ping: Ping.create({ pingId: 0 }) }), { mutating: false });
    }

    /**
     * Controls the front (which_trunk: "front") or rear (which_trunk: "rear") trunk.
     * @param which_trunk "front" or "rear"
     */
    async actuate_trunk(which_trunk: Trunk): Promise<CommandResponse> {
        const field = TrunkFields[which_trunk];
        if (!field) {
            throw new Error(`Invalid trunk: ${which_trunk}`);
        }
        const closureMoveRequest: Partial<ClosureMoveRequest> = {};
        closureMoveRequest[field] = ClosureMoveTypeE.CLOSURE_MOVE_TYPE_MOVE;
        return this.sendVehicleSecurity(
            UnsignedMessage.create({ closureMoveRequest: ClosureMoveRequest.create(closureMoveRequest) }),
        );
    }

    /**
     * Adjusts vehicle media playback volume.
     * @param volume A floating point number from 0.0 to 11.0.
     */
    async adjust_volume(volume: number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ mediaUpdateVolume: MediaUpdateVolume.create({ volumeAbsoluteFloat: volume }) }),
        );
    }

    /** Starts climate preconditioning. */
    async auto_conditioning_start(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ hvacAutoAction: HvacAutoAction.create({ powerOn: true }) }));
    }

    /** Stops climate preconditioning. */
    async auto_conditioning_stop(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ hvacAutoAction: HvacAutoAction.create({ powerOn: false }) }));
    }

    /** Cancels the countdown to install the vehicle software update. */
    async cancel_software_update(): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ vehicleControlCancelSoftwareUpdateAction: VehicleControlCancelSoftwareUpdateAction.create({}) }),
        );
    }

    /** Charges in max range mode -- we recommend limiting the use of this mode to long trips. */
    async charge_max_range(): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ chargingStartStopAction: ChargingStartStopAction.create({ startMaxRange: VOID }) }),
        );
    }

    /** Closes the charge port door. */
    async charge_port_door_close(): Promise<CommandResponse> {
        return this.sendVehicleSecurity(
            UnsignedMessage.create({
                closureMoveRequest: ClosureMoveRequest.create({ chargePort: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_CLOSE }),
            }),
        );
    }

    /** Opens the charge port door. */
    async charge_port_door_open(): Promise<CommandResponse> {
        return this.sendVehicleSecurity(
            UnsignedMessage.create({
                closureMoveRequest: ClosureMoveRequest.create({ chargePort: ClosureMoveTypeE.CLOSURE_MOVE_TYPE_OPEN }),
            }),
        );
    }

    /** Charges in Standard mode. */
    async charge_standard(): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ chargingStartStopAction: ChargingStartStopAction.create({ startStandard: VOID }) }),
        );
    }

    /** Starts charging the vehicle. */
    async charge_start(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ chargingStartStopAction: ChargingStartStopAction.create({ start: VOID }) }));
    }

    /** Stops charging the vehicle. */
    async charge_stop(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ chargingStartStopAction: ChargingStartStopAction.create({ stop: VOID }) }));
    }

    /**
     * Deactivates PIN to Drive and resets the associated PIN for vehicles running firmware versions 2023.44+. This command is only accessible to fleet managers or owners.
     * @param _pin Accepted for parity with the REST command; the signed action carries no PIN.
     */
    async clear_pin_to_drive_admin(_pin?: string | number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ vehicleControlResetPinToDriveAdminAction: VehicleControlResetPinToDriveAdminAction.create({}) }),
        );
    }

    /** Locks the vehicle. */
    async door_lock(): Promise<CommandResponse> {
        return this.sendVehicleSecurity(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_LOCK }));
    }

    /** Unlocks the vehicle. */
    async door_unlock(): Promise<CommandResponse> {
        return this.sendVehicleSecurity(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_UNLOCK }));
    }

    /** Erases user's data from the user interface. Requires the vehicle to be in park. */
    async erase_user_data(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ eraseUserDataAction: EraseUserDataAction.create({}) }));
    }

    /** Briefly flashes the vehicle headlights. Requires the vehicle to be in park. */
    async flash_lights(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ vehicleControlFlashLightsAction: VehicleControlFlashLightsAction.create({}) }));
    }

    /**
     * Restricts certain vehicle UI functionality from guest users
     * @param enable `true` or `false`
     */
    async guest_mode(enable: boolean): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ guestModeAction: VehicleState_GuestMode.create({ GuestModeActive: enable }) }),
        );
    }

    /** Honks the vehicle horn. Requires the vehicle to be in park. */
    async honk_horn(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ vehicleControlHonkHornAction: VehicleControlHonkHornAction.create({}) }));
    }

    /** Advances media player to next favorite track. */
    async media_next_fav(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ mediaNextFavorite: {} }));
    }

    /** Advances media player to next track. */
    async media_next_track(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ mediaNextTrack: {} }));
    }

    /** Advances media player to previous favorite track. */
    async media_prev_fav(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ mediaPreviousFavorite: {} }));
    }

    /** Advances media player to previous track. */
    async media_prev_track(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ mediaPreviousTrack: {} }));
    }

    /** Toggles current play/pause state. */
    async media_toggle_playback(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ mediaPlayAction: {} }));
    }

    /** Turns the volume down by one. */
    async media_volume_down(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ mediaUpdateVolume: MediaUpdateVolume.create({ volumeDelta: -1 }) }));
    }

    /**
     * Start navigation to given coordinates.
     * @param lat Latitude
     * @param lon Longitude
     * @param order Trip order: `0` replaces the current trip (default), `1` prepends it as the next stop, `2` appends it as the last stop
     */
    async navigation_gps_request(lat: number, lon: number, order: number = 0): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ navigationGpsRequest: NavigationGpsRequest.create({ lat, lon, order }) }),
        );
    }

    /**
     * Sends a location to the in-vehicle navigation system.
     *
     * `locale` and `type` are REST-only fields with no equivalent in the
     * signed-command protocol (which only carries a destination string and a
     * multi-stop order), so they are accepted for cross-transport signature
     * parity but not sent.
     * @param value Destination text
     */
    async navigation_request(value: string, _locale?: string, _type?: string): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ navigationRequest: NavigationRequest.create({ destination: value }) }));
    }

    /**
     * Start navigation to a supercharger.
     * @param id Supercharger ID
     * @param order Trip order: `0` replaces the current trip (default), `1` prepends it as the next stop, `2` appends it as the last stop
     */
    async navigation_sc_request(id: number, order?: number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({
                navigationSuperchargerRequest: NavigationSuperchargerRequest.create({ id, remoteNavTripOrder: order ?? 0 }),
            }),
        );
    }

    /**
     * Sets automatic seat heating and cooling. Only the front seats support this action.
     * @param auto_seat_position `AutoSeat` position (1-indexed: front left is 1, front right is 2)
     * @param auto_climate_on `true` or `false`
     */
    async remote_auto_seat_climate_request(auto_seat_position: keyof typeof AutoSeat | number, auto_climate_on: boolean): Promise<CommandResponse> {
        const position = AutoSeatPositions[typeof auto_seat_position === "string" ? AutoSeat[auto_seat_position] : auto_seat_position];
        if (position === undefined) {
            throw new Error(`Invalid seat position for auto seat climate: ${auto_seat_position}`);
        }
        return this.vehicleAction(
            VehicleAction.create({
                autoSeatClimateAction: AutoSeatClimateAction.create({
                    carseat: [AutoSeatClimateAction_CarSeat.create({ on: auto_climate_on, seatPosition: position })],
                }),
            }),
        );
    }

    /**
     * Sets automatic steering wheel heating on/off.
     * @param on `true` or `false`
     */
    async remote_auto_steering_wheel_heat_climate_request(on: boolean): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ autoStwHeatAction: AutoStwHeatAction.create({ on }) }));
    }

    /**
     * Plays a sound through the vehicle external speaker.
     * @param sound Fart is `0`, Locate ping is `2000`
     */
    async remote_boombox(sound: number = 0): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ boomboxAction: BoomboxAction.create({ sound }) }));
    }

    /**
     * Sets seat cooling. Only the front seats support this action.
     * @param seat_position Seat position
     * @param seat_cooler_level Cooling level
     */
    async remote_seat_cooler_request(seat_position: Seat | number, seat_cooler_level: Level): Promise<CommandResponse> {
        const position = SeatCoolerPositions[this.resolveSeat(seat_position)];
        if (position === undefined) {
            throw new Error(`Invalid seat position for seat cooling: ${seat_position}`);
        }
        const level = SeatCoolerLevels[seat_cooler_level];
        if (level === undefined) {
            throw new Error(`Invalid seat cooler level: ${seat_cooler_level}`);
        }
        return this.vehicleAction(
            VehicleAction.create({
                hvacSeatCoolerActions: HvacSeatCoolerActions.create({
                    hvacSeatCoolerAction: [
                        HvacSeatCoolerActions_HvacSeatCoolerAction.create({ seatCoolerLevel: level, seatPosition: position }),
                    ],
                }),
            }),
        );
    }

    /**
     * Sets seat heating.
     * @param seat_position Seat position
     * @param seat_heater_level Heating level
     */
    async remote_seat_heater_request(seat_position: Seat | number, seat_heater_level: Level): Promise<CommandResponse> {
        const field = SeatHeaterFields[this.resolveSeat(seat_position)];
        if (!field) {
            throw new Error(`Invalid seat position: ${seat_position}`);
        }
        const levelField = SeatHeaterLevels[seat_heater_level];
        if (!levelField) {
            throw new Error(`Invalid seat heater level: ${seat_heater_level}`);
        }
        const heaterAction: Partial<HvacSeatHeaterActions_HvacSeatHeaterAction> = {};
        heaterAction[field] = VOID;
        heaterAction[levelField] = VOID;
        return this.vehicleAction(
            VehicleAction.create({
                hvacSeatHeaterActions: HvacSeatHeaterActions.create({
                    hvacSeatHeaterAction: [HvacSeatHeaterActions_HvacSeatHeaterAction.create(heaterAction)],
                }),
            }),
        );
    }

    /** Starts the vehicle remotely. Requires keyless driving to be enabled. */
    async remote_start_drive(): Promise<CommandResponse> {
        return this.sendVehicleSecurity(UnsignedMessage.create({ RKEAction: RKEActionE.RKE_ACTION_REMOTE_DRIVE }));
    }

    /**
     * Sets steering wheel heat level.
     * @param level Heating level (0=Off, 1=Low, 2=High)
     */
    async remote_steering_wheel_heat_level_request(level: Level): Promise<CommandResponse> {
        const stwLevel = StwHeatLevels[level];
        if (stwLevel === undefined) {
            throw new Error(`Invalid steering wheel heat level: ${level}`);
        }
        return this.vehicleAction(VehicleAction.create({ stwHeatLevelAction: StwHeatLevelAction.create({ stwHeatLevel: stwLevel }) }));
    }

    /**
     * Sets steering wheel heating on/off. For vehicles that do not support auto steering wheel heat.
     * @param on `true` or `false`
     */
    async remote_steering_wheel_heater_request(on: boolean): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ hvacSteeringWheelHeaterAction: HvacSteeringWheelHeaterAction.create({ powerOn: on }) }));
    }

    /** Removes PIN to Drive. Requires the car to be in Pin to Drive mode and not in Valet mode. */
    async reset_pin_to_drive_pin(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ vehicleControlResetPinToDriveAction: VehicleControlResetPinToDriveAction.create({}) }));
    }

    /** Removes PIN for Valet Mode. */
    async reset_valet_pin(): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ vehicleControlResetValetPinAction: VehicleControlResetValetPinAction.create({}) }));
    }

    /**
     * Schedules a vehicle software update (over the air "OTA") to be installed in the future.
     * @param offset_sec Offset in seconds
     */
    async schedule_software_update(offset_sec: number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({
                vehicleControlScheduleSoftwareUpdateAction: VehicleControlScheduleSoftwareUpdateAction.create({ offsetSec: offset_sec }),
            }),
        );
    }

    /**
     * Turns Bioweapon Defense Mode on and off.
     * @param on `true` or `false`
     * @param manual_override `true` or `false`
     */
    async set_bioweapon_mode(on: boolean, manual_override: boolean): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ hvacBioweaponModeAction: HvacBioweaponModeAction.create({ on, manualOverride: manual_override }) }),
        );
    }

    /**
     * Sets the vehicle overheat protection.
     * @param on `true` or `false`
     * @param fan_only `true` or `false`
     */
    async set_cabin_overheat_protection(on: boolean, fan_only: boolean): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ setCabinOverheatProtectionAction: SetCabinOverheatProtectionAction.create({ on, fanOnly: fan_only }) }),
        );
    }

    /**
     * Sets the vehicle's charge limit to a custom percentage.
     * @param percent Charge limit percentage typically between 50-100
     */
    async set_charge_limit(percent: number): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ chargingSetLimitAction: ChargingSetLimitAction.create({ percent }) }));
    }

    /**
     * Sets the charging amps.
     * @param charging_amps Current limit in Amps typically between 5-32
     */
    async set_charging_amps(charging_amps: number): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ setChargingAmpsAction: SetChargingAmpsAction.create({ chargingAmps: charging_amps }) }));
    }

    /**
     * Enables climate keeper mode.
     * @param climate_keeper_mode `0` is Off, `1` is Keep, `2` is Dog, `3` is Camp
     */
    async set_climate_keeper_mode(climate_keeper_mode: number | ClimateMode): Promise<CommandResponse> {
        const mode = typeof climate_keeper_mode === "string" ? ClimateModes[climate_keeper_mode] : climate_keeper_mode;
        const action = ClimateKeeperActions[mode];
        if (action === undefined) {
            throw new Error(`Invalid climate keeper mode: ${climate_keeper_mode}`);
        }
        return this.vehicleAction(
            VehicleAction.create({ hvacClimateKeeperAction: { ClimateKeeperAction: action, manualOverride: false, manualOverrideMode: [] } }),
        );
    }

    /**
     * Adjusts the Cabin Overheat Protection temperature (COP).
     * @param cop_temp Integer representing Low (0/30C/90F), Medium (1/35C/95F), or High (2/40C/100F)
     */
    async set_cop_temp(cop_temp: 0 | 1 | 2 | 30 | 35 | 40 | 90 | 95 | 100): Promise<CommandResponse> {
        const copActivationTemp = CopActivationTemps[cop_temp];
        if (copActivationTemp === undefined) {
            throw new Error(`Invalid cop_temp: ${cop_temp}`);
        }
        return this.vehicleAction(VehicleAction.create({ setCopTempAction: SetCopTempAction.create({ copActivationTemp }) }));
    }

    /**
     * Sets a four-digit passcode for PIN to Drive.
     * @param on `true` or `false`
     * @param password Four-digit passcode
     */
    async set_pin_to_drive(on: boolean, password: string | number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ vehicleControlSetPinToDriveAction: VehicleControlSetPinToDriveAction.create({ on, password: String(password) }) }),
        );
    }

    /**
     * Sets an override for preconditioning — it should default to empty if no override is used.
     * @param on `true` or `false`
     * @param manual_override `true` or `false`
     */
    async set_preconditioning_max(on: boolean, manual_override: boolean): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({
                hvacSetPreconditioningMaxAction: HvacSetPreconditioningMaxAction.create({ on, manualOverride: manual_override }),
            }),
        );
    }

    /**
     * Sets a time at which charging should be completed.
     * @param enable `true` or `false`
     * @param time Minutes after midnight
     */
    async set_scheduled_charging(enable: boolean, time: number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ scheduledChargingAction: ScheduledChargingAction.create({ enabled: enable, chargingTime: time }) }),
        );
    }

    /**
     * Sets a time at which departure should be completed.
     *
     * `preconditioning_enabled` and `off_peak_charging_enabled` are accepted
     * for cross-transport signature parity but have no field in the signed
     * command protobuf, so they are not sent.
     * @param enable `true` or `false`
     * @param preconditioning_enabled not representable in a signed command
     * @param preconditioning_weekdays_only `true` or `false`
     * @param departure_time Minutes after midnight
     * @param off_peak_charging_enabled not representable in a signed command
     * @param off_peak_charging_weekdays_only `true` or `false`
     * @param end_off_peak_time Minutes after midnight
     */
    async set_scheduled_departure(
        enable: boolean = true,
        _preconditioning_enabled: boolean = false,
        preconditioning_weekdays_only: boolean = false,
        departure_time: number = 0,
        _off_peak_charging_enabled: boolean = false,
        off_peak_charging_weekdays_only: boolean = false,
        end_off_peak_time: number = 0,
    ): Promise<CommandResponse> {
        const preconditioningTimes = preconditioning_weekdays_only
            ? PreconditioningTimes.create({ weekdays: VOID })
            : PreconditioningTimes.create({ allWeek: VOID });
        const offPeakChargingTimes = off_peak_charging_weekdays_only
            ? OffPeakChargingTimes.create({ weekdays: VOID })
            : OffPeakChargingTimes.create({ allWeek: VOID });

        return this.vehicleAction(
            VehicleAction.create({
                scheduledDepartureAction: ScheduledDepartureAction.create({
                    enabled: enable,
                    departureTime: departure_time,
                    preconditioningTimes,
                    offPeakChargingTimes,
                    offPeakHoursEndTime: end_off_peak_time,
                }),
            }),
        );
    }

    /**
     * Enables and disables Sentry Mode.
     * @param on `true` or `false`
     */
    async set_sentry_mode(on: boolean): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ vehicleControlSetSentryModeAction: VehicleControlSetSentryModeAction.create({ on }) }));
    }

    /**
     * Sets the driver and/or passenger-side cabin temperature (and other zones if sync is enabled).
     * @param driver_temp Driver temperature
     * @param passenger_temp Passenger temperature
     */
    async set_temps(driver_temp: number, passenger_temp: number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({
                hvacTemperatureAdjustmentAction: HvacTemperatureAdjustmentAction.create({
                    driverTempCelsius: driver_temp,
                    passengerTempCelsius: passenger_temp,
                }),
            }),
        );
    }

    /**
     * Turns on Valet Mode and sets a four-digit passcode.
     * @param on `true` or `false`
     * @param password Four-digit passcode
     */
    async set_valet_mode(on: boolean, password: string | number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ vehicleControlSetValetModeAction: VehicleControlSetValetModeAction.create({ on, password: String(password) }) }),
        );
    }

    /**
     * Changes the name of a vehicle.
     * @param vehicle_name New name
     */
    async set_vehicle_name(vehicle_name: string): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ setVehicleNameAction: SetVehicleNameAction.create({ vehicleName: vehicle_name }) }));
    }

    /**
     * Activates Speed Limit Mode with a four-digit PIN.
     * @param pin Four-digit PIN
     */
    async speed_limit_activate(pin: string | number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ drivingSpeedLimitAction: DrivingSpeedLimitAction.create({ activate: true, pin: String(pin) }) }),
        );
    }

    /**
     * Deactivates Speed Limit Mode and resets the associated PIN.
     * @param pin Four-digit PIN
     */
    async speed_limit_clear_pin(pin: string | number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ drivingClearSpeedLimitPinAction: DrivingClearSpeedLimitPinAction.create({ pin: String(pin) }) }),
        );
    }

    /** Deactivates Speed Limit Mode and resets the associated PIN, for fleet managers or owners. */
    async speed_limit_clear_pin_admin(): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ drivingClearSpeedLimitPinAdminAction: DrivingClearSpeedLimitPinAdminAction.create({}) }),
        );
    }

    /**
     * Deactivates Speed Limit Mode.
     * @param pin Four-digit PIN
     */
    async speed_limit_deactivate(pin: string | number): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ drivingSpeedLimitAction: DrivingSpeedLimitAction.create({ activate: false, pin: String(pin) }) }),
        );
    }

    /**
     * Sets the maximum speed allowed when Speed Limit Mode is active.
     * @param limit_mph Maximum speed in MPH
     */
    async speed_limit_set_limit(limit_mph: number): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ drivingSetSpeedLimitAction: DrivingSetSpeedLimitAction.create({ limitMph: limit_mph }) }));
    }

    /**
     * Controls the panoramic sunroof on the Model S.
     *
     * "stop" has no corresponding field in the signed-command protobuf (only
     * vent/close/open), so it is rejected rather than guessed at.
     * @param state "close" or "vent"
     */
    async sun_roof_control(state: "stop" | "close" | "vent"): Promise<CommandResponse> {
        let action: VehicleControlSunroofOpenCloseAction;
        if (state === "vent") {
            action = VehicleControlSunroofOpenCloseAction.create({ vent: VOID });
        } else if (state === "close") {
            action = VehicleControlSunroofOpenCloseAction.create({ close: VOID });
        } else {
            throw new Error('sun_roof_control: "stop" is not representable in a signed command.');
        }
        return this.vehicleAction(VehicleAction.create({ vehicleControlSunroofOpenCloseAction: action }));
    }

    /**
     * Records a drive note. Overrides the inherited plaintext command so it is
     * signed and dispatched over the vehicle-command protocol rather than
     * silently falling through to the unsigned REST endpoint on vehicles that
     * require signing.
     * @param note Drive note
     */
    async take_drivenote(note: string): Promise<CommandResponse> {
        return this.vehicleAction(VehicleAction.create({ takeDrivenoteAction: TakeDrivenoteAction.create({ note }) }));
    }

    /**
     * Turns on HomeLink (used to open and close garage doors).
     * @param lat Latitude
     * @param lon Longitude
     * @param token
     */
    async trigger_homelink(lat: number, lon: number, token: string = ""): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({
                vehicleControlTriggerHomelinkAction: VehicleControlTriggerHomelinkAction.create({
                    location: LatLong.create({ latitude: lat, longitude: lon }),
                    token,
                }),
            }),
        );
    }

    /**
     * Sends upcoming calendar entries to the vehicle. Overrides the inherited
     * plaintext command so it is signed and dispatched over the vehicle-command
     * protocol rather than silently falling through to the unsigned REST
     * endpoint on vehicles that require signing.
     * @param calendar_data Calendar data
     */
    async upcoming_calendar_entries(calendar_data: string): Promise<CommandResponse> {
        return this.vehicleAction(
            VehicleAction.create({ uiSetUpcomingCalendarEntries: UiSetUpcomingCalendarEntries.create({ calendarData: calendar_data }) }),
        );
    }

    /**
     * Control the windows of a parked vehicle. Supported commands: vent and close.
     * @param command "vent" or "close"
     * @param lat Latitude
     * @param lon Longitude
     */
    async window_control(command: "vent" | "close", _lat?: number, _lon?: number): Promise<CommandResponse> {
        const action =
            command === "vent"
                ? VehicleControlWindowAction.create({ vent: VOID })
                : VehicleControlWindowAction.create({ close: VOID });
        return this.vehicleAction(VehicleAction.create({ vehicleControlWindowAction: action }));
    }
}
