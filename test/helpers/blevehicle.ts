import { vi } from "vitest";
import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { RKEActionE, VehicleSleepStatusE, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import { SendOptions, SendRequires } from "../../src/commands.js";
import TeslaBluetooth from "../../src/bluetooth/teslabluetooth.js";
import type { BleTransport } from "../../src/bluetooth/transport.js";
import VehicleBluetooth, { VehicleBluetoothOptions } from "../../src/bluetooth/vehiclebluetooth.js";
import { FakeBleLink } from "./fakeblelink.js";
import { FakeVehicle } from "./fakevehicle.js";

export const VIN = "5YJXCAE43LF123456";
export const OUR_PRIVATE_KEY = Buffer.from("10181f262d343b424950575e656c737a81888f969da4abb2b9c0c7ced5dce3ea", "hex");
export const VCSEC = Domain.DOMAIN_VEHICLE_SECURITY;
export const INFOTAINMENT = Domain.DOMAIN_INFOTAINMENT;

/** A `VehicleBluetooth` with what a test needs to see, and no shortcut past `_send`. */
export class TestVehicle extends VehicleBluetooth {
    send(msg: RoutableMessage, requires: SendRequires, options?: SendOptions): Promise<RoutableMessage> {
        return this._send(msg, requires, options);
    }

    session(domain: Domain) {
        return this.sessionFor(domain);
    }

    get routingAddress(): Buffer {
        return this.fromDestination;
    }

    read(characteristic: "version" | "deviceName" | "appearance", timeoutMs?: number) {
        return this.gattRead(characteristic, timeoutMs);
    }

    /** Shorten one of the ladder's timings. */
    tune(timings: { wakeTimeoutMs?: number; infotainmentBootTimeoutMs?: number; wakeResendIntervalMs?: number }): void {
        Object.assign(this, timings);
    }
}

export interface BleHarnessOptions extends Partial<VehicleBluetoothOptions> {
    mtu?: number;
    maxWriteSize?: number | null | "unreported";
    logger?: { debug(message: string): void };
}

/** A vehicle on a `FakeBleLink`. Keepalive is off, so a test that wants it says so. */
export function bleHarness({ mtu, maxWriteSize, logger, ...options }: BleHarnessOptions = {}) {
    const fakeVehicle = new FakeVehicle();
    fakeVehicle.vehicleStatus = VehicleStatus.create();
    const link = new FakeBleLink(fakeVehicle, { mtu, maxWriteSize });
    const transport: BleTransport = options.transport ?? link;
    const tesla = new TeslaBluetooth({ privateKey: OUR_PRIVATE_KEY, logger });
    const vehicle = new TestVehicle(tesla.vehicles, VIN, { keepalive_interval_ms: null, ...options, transport });
    return { tesla, vehicle, link, fakeVehicle };
}

/**
 * Make the car behave as it does asleep: VCSEC answers and reports its state,
 * infotainment hears nothing. An RKE wake makes VCSEC report awake at once and
 * infotainment answer `bootMs` later, with `-1` for a car that never wakes.
 */
export function sleepingCar({ link, fakeVehicle }: Pick<ReturnType<typeof bleHarness>, "link" | "fakeVehicle">, bootMs: number = 6000) {
    const car = { infotainmentUp: false, wakes: 0 };
    const report = (vehicleSleepStatus: VehicleSleepStatusE) => {
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus });
    };
    report(VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP);
    link.deafTo = (request) => request.toDestination?.domain === INFOTAINMENT && !car.infotainmentUp;
    fakeVehicle.onVcsecCommand = (command) => {
        if (command.RKEAction !== RKEActionE.RKE_ACTION_WAKE_VEHICLE) {
            return;
        }
        car.wakes++;
        if (bootMs >= 0 && car.wakes === 1) {
            report(VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE);
            setTimeout(() => {
                car.infotainmentUp = true;
            }, bootMs);
        }
    };
    return car;
}

/**
 * Run `operation` under fake timers until it settles or `ms` pass, and return
 * or throw its outcome.
 */
export async function finish<T>(operation: Promise<T>, ms: number = 120_000): Promise<T> {
    const outcome = operation.then(
        (value) => ({ value }),
        (error: unknown) => ({ error }),
    );
    let settled = false;
    void outcome.then(() => {
        settled = true;
    });
    for (let advanced = 0; advanced < ms && !settled; advanced += 50) {
        await vi.advanceTimersByTimeAsync(50);
    }
    if (!settled) {
        throw new Error(`The operation did not settle within ${ms} ms.`);
    }
    const result = await outcome;
    if ("error" in result) {
        throw result.error;
    }
    return result.value;
}

/** How long an operation takes in fake time, and how it ended. */
export async function timed<T>(operation: () => Promise<T>): Promise<{ elapsedMs: number; value?: T; error?: unknown }> {
    const start = Date.now();
    try {
        const value = await finish(operation());
        return { elapsedMs: Date.now() - start, value };
    } catch (error) {
        return { elapsedMs: Date.now() - start, error };
    }
}

/** A link's reply with `fields` changed. */
export function withFields(reply: RoutableMessage, fields: Partial<RoutableMessage>): RoutableMessage {
    return { ...reply, ...fields };
}

/** The reply with its payload removed: a bare ack of the request. */
export function bareAck(reply: RoutableMessage, request: RoutableMessage): RoutableMessage {
    return withFields(reply, { protobufMessageAsBytes: undefined, signatureData: undefined, requestUuid: request.uuid });
}
