// The parity router over a real `VehicleBluetooth` on a `FakeBleLink` and a fake
// cloud. Behaviour specs from document 05 section 13, and from Python's
// `tests/test_ble_write_timeout_router.py`, the router cases of
// `test_ble_connect_retry_budget.py`, and the path cases of
// `test_ble_connect_failover.py`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageFaultE, OperationStatusE } from "@teslemetry/tesla-protocol/command/universal_message";
import { Response } from "@teslemetry/tesla-protocol/command/car_server";
import { VehicleData } from "@teslemetry/tesla-protocol/command/vehicle";
import { VehicleRouter, is_failover_safe } from "../../src/router/index.js";
import { DEFAULT_CONNECT_ATTEMPTS } from "../../src/bluetooth/constants.js";
import {
    BluetoothCloudUnavailableError,
    BluetoothCommandFailed,
    BluetoothTimeout,
    BluetoothTransportError,
    BluetoothUnconfirmedCommand,
    KEY_REJECTED_FAULTS,
    SessionInfoAuthenticationFault,
    SignedCommandRequired,
    SigningDisabled,
    TeslaFleetMessageFaultFieldExceedsMTU,
    TeslaFleetMessageFaultResponseSizeExceedsMTU,
} from "../../src/exceptions.js";
import { BleHarnessOptions, VCSEC, VIN, bareAck, bleHarness, finish, sleepingCar, timed } from "../helpers/blevehicle.js";

const CLOUD = { response: { result: true, reason: "cloud" } };

/** A cloud backend that counts every call. */
function fakeCloud() {
    const command = () => vi.fn(async () => CLOUD);
    return {
        vin: VIN,
        door_lock: command(),
        door_unlock: command(),
        charge_start: command(),
        set_charge_limit: command(),
        honk_horn: command(),
        fleet_status: command(),
        vehicle_data: command(),
        wake_up: command(),
        charge_port_door_open: command(),
    };
}

type Cloud = ReturnType<typeof fakeCloud>;

const calls = (cloud: Cloud) => Object.values(cloud).reduce((total, value) => total + (typeof value === "function" ? value.mock.calls.length : 0), 0);

async function ready(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return harness;
}

/** A reply carrying a signed-message fault in place of the next command's reply. */
function faultNextReply(link: ReturnType<typeof bleHarness>["link"], signedMessageFault: MessageFaultE) {
    link.rewriteNextReply((reply, request) => [
        { message: { ...bareAck(reply, request), signedMessageStatus: { operationStatus: OperationStatusE.OPERATIONSTATUS_OK, signedMessageFault } } },
    ]);
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("BluetoothUnconfirmedCommand", () => {
    it("stays out of the cloud after a lost ack", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(calls(cloud)).toBe(0);
        expect(link.commands(VCSEC)).toHaveLength(1);
    });

    it("never reaches on_result", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const cloud = fakeCloud();
        const on_result = vi.fn(() => true);

        await expect(finish(new VehicleRouter([vehicle, cloud], { on_result }).charge_start())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(on_result).not.toHaveBeenCalled();
        expect(calls(cloud)).toBe(0);
    });

    it("surfaces from a later backend in the chain", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.dropNextReply();
        const first = { vin: VIN, door_lock: vi.fn(async () => Promise.reject(new BluetoothTransportError())) };
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([first, vehicle, cloud]).door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(first.door_lock).toHaveBeenCalledOnce();
        expect(calls(cloud)).toBe(0);
    });

    it("stays out of the cloud after an optimistic write that may have landed", async () => {
        const { vehicle, link } = await ready({ confirmation: "optimistic", raise_unconfirmed: true });
        link.failNextWrite("after");
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(calls(cloud)).toBe(0);
    });

    it("stays out of the cloud for a charge port that never showed open, whatever raise_unconfirmed says", async () => {
        const { vehicle, fakeVehicle } = await ready({ confirmation: "verify", raise_unconfirmed: false });
        fakeVehicle.onInfotainmentAction = () =>
            Response.create({ vehicleData: VehicleData.fromPartial({ chargeState: { connChargeCable: { IEC: {} }, chargingState: { Stopped: {} }, chargePortLatch: { Engaged: {} } } }) });
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).charge_port_door_open())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(calls(cloud)).toBe(0);
    });
});

describe("a write that may have reached the car", () => {
    it("does not replay a write that hung after submission", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.hangNextWrite("after");
        link.dropNextReply();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(calls(cloud)).toBe(0);
    });

    it("does not replay a write the backend failed", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.failNextWrite("after");
        link.dropNextReply();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(calls(cloud)).toBe(0);
    });

    it("does not replay a mid-frame failure", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.failNextWrite("before");
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).rejects.toBeInstanceOf(BluetoothUnconfirmedCommand);

        expect(calls(cloud)).toBe(0);
    });

    it("still fails over on a failure that provably preceded submission", async () => {
        const { vehicle, link } = await ready({ raise_unconfirmed: true });
        link.rejectNextWriteAsNotSubmitted();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).resolves.toEqual(CLOUD);

        expect(cloud.door_lock).toHaveBeenCalledOnce();
    });

    it("resolves best effort with raise_unconfirmed off, with no failover", async () => {
        const { vehicle, link } = await ready();
        link.hangNextWrite("after");
        link.dropNextReply();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).resolves.toEqual({ response: { result: true, reason: "" } });

        expect(calls(cloud)).toBe(0);
    });
});

describe("failing over", () => {
    /** The command falls through to the cloud once, and the error that sent it there was `expected`. */
    async function expectFailover(router: { door_lock(): Promise<unknown> }, cloud: Cloud, primaryError: () => Promise<unknown>, expected: abstract new (...args: never[]) => unknown) {
        await expect(finish(router.door_lock())).resolves.toEqual(CLOUD);
        expect(cloud.door_lock).toHaveBeenCalledOnce();
        await expect(primaryError()).rejects.toBeInstanceOf(expected);
    }

    it("on BluetoothTransportError", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(DEFAULT_CONNECT_ATTEMPTS * 2);
        const cloud = fakeCloud();

        await expectFailover(new VehicleRouter([vehicle, cloud]), cloud, () => finish(vehicle.door_lock()), BluetoothTransportError);
    });

    it("on a plain BluetoothTimeout from a step before the write", async () => {
        const { vehicle, link } = bleHarness();
        link.dropNextReply("session_info");
        link.dropNextReply("session_info");
        const cloud = fakeCloud();

        await expectFailover(new VehicleRouter([vehicle, cloud]), cloud, () => finish(vehicle.door_lock()), BluetoothTimeout);

        expect(link.commands(VCSEC)).toEqual([]);
    });

    it("on BluetoothCommandFailed", async () => {
        const harness = await ready({ wake_if_asleep: false });
        const { vehicle } = harness;
        sleepingCar(harness);
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).set_charge_limit(80))).resolves.toEqual(CLOUD);

        await expect(timed(() => vehicle.set_charge_limit(80)).then(({ error }) => Promise.reject(error))).rejects.toBeInstanceOf(BluetoothCommandFailed);
        expect(cloud.set_charge_limit).toHaveBeenCalledOnce();
    });

    it("on a key the car rejected", async () => {
        const { vehicle, fakeVehicle } = bleHarness();
        fakeVehicle.keyEnrolled = false;
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).door_lock())).resolves.toEqual(CLOUD);
        expect(cloud.door_lock).toHaveBeenCalledOnce();

        const error = await finish(vehicle.door_lock()).catch((thrown: unknown) => thrown);
        expect(KEY_REJECTED_FAULTS.some((fault) => error instanceof fault)).toBe(true);
    });

    it("on SessionInfoAuthenticationFault", async () => {
        const { vehicle, fakeVehicle } = bleHarness();
        fakeVehicle.corruptNextSessionInfoTag(6);
        const cloud = fakeCloud();

        await expectFailover(new VehicleRouter([vehicle, cloud]), cloud, () => finish(vehicle.door_lock()), SessionInfoAuthenticationFault);
    });

    it("on SigningDisabled, with the link untouched", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });
        const cloud = fakeCloud();

        await expectFailover(new VehicleRouter([vehicle, cloud]), cloud, () => finish(vehicle.door_lock()), SigningDisabled);

        expect(link.calls).toEqual([]);
    });

    it("on the size faults", async () => {
        for (const [fault, expected] of [
            [MessageFaultE.MESSAGEFAULT_ERROR_RESPONSE_MTU_EXCEEDED, TeslaFleetMessageFaultResponseSizeExceedsMTU],
            [MessageFaultE.MESSAGEFAULT_ERROR_REQUEST_MTU_EXCEEDED, TeslaFleetMessageFaultFieldExceedsMTU],
        ] as const) {
            const { vehicle, link } = await ready();
            const cloud = fakeCloud();

            faultNextReply(link, fault);
            await expect(finish(new VehicleRouter([vehicle, cloud]).honk_horn())).resolves.toEqual(CLOUD);
            expect(cloud.honk_horn).toHaveBeenCalledOnce();

            faultNextReply(link, fault);
            await expect(finish(vehicle.honk_horn())).rejects.toBeInstanceOf(expected);
        }
    });

    it("on SignedCommandRequired, as an energy backend raises it", async () => {
        expect(is_failover_safe(new SignedCommandRequired())).toBe(true);
    });

    it("to the cloud for a method with no signed path", async () => {
        const { vehicle, link } = bleHarness();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).fleet_status())).resolves.toEqual(CLOUD);

        expect(cloud.fleet_status).toHaveBeenCalledOnce();
        expect(link.calls).toEqual([]);
        await expect(vehicle.fleet_status()).rejects.toBeInstanceOf(BluetoothCloudUnavailableError);
    });

    it("to the cloud for a vehicle_data call in the cloud's shape", async () => {
        const { vehicle, link } = bleHarness();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).vehicle_data())).resolves.toEqual(CLOUD);

        expect(cloud.vehicle_data).toHaveBeenCalledOnce();
        expect(link.calls).toEqual([]);
    });
});

describe("the failover_safe marker", () => {
    class Marked extends Error {
        constructor(readonly failover_safe: boolean) {
            super("marked");
        }
    }

    it.each([
        [true, 1],
        [false, 0],
    ])("decides for itself: %s", async (failover_safe, expected) => {
        const primary = { vin: VIN, door_lock: vi.fn(async () => Promise.reject(new Marked(failover_safe))) };
        const cloud = fakeCloud();
        const routed = finish(new VehicleRouter([primary, cloud]).door_lock());

        if (failover_safe) {
            await expect(routed).resolves.toEqual(CLOUD);
        } else {
            await expect(routed).rejects.toBeInstanceOf(Marked);
        }

        expect(calls(cloud)).toBe(expected);
    });
});

describe("the health check", () => {
    it("skips the primary when false, without touching the link", async () => {
        const { vehicle, link } = bleHarness();
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud], { health: false }).door_lock())).resolves.toEqual(CLOUD);

        expect(link.calls).toEqual([]);
    });

    it("gates only the primary", async () => {
        const { vehicle, link } = await ready();
        const primary = { vin: VIN, door_lock: vi.fn(async () => CLOUD) };
        const cloud = fakeCloud();

        await finish(new VehicleRouter([primary, vehicle, cloud], { health: false }).door_lock());

        expect(primary.door_lock).not.toHaveBeenCalled();
        expect(link.commands(VCSEC)).toHaveLength(1);
        expect(calls(cloud)).toBe(0);
    });

    it("still lets a healthy primary fail over", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(DEFAULT_CONNECT_ATTEMPTS);
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud], { health: async () => true }).door_lock())).resolves.toEqual(CLOUD);
    });
});

describe("the connect budget", () => {
    const connects = (link: ReturnType<typeof bleHarness>["link"]) => link.calls.filter((call) => call.kind === "connect").length;

    it("keeps enough attempts for three paths", () => {
        expect(DEFAULT_CONNECT_ATTEMPTS).toBe(3);
    });

    it("reaches a third attempt after two fail", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(2);

        await finish(vehicle.connect());

        expect(connects(link)).toBe(3);
        expect(link.openConnections).toBe(1);
    });

    it("gives up after a smaller budget, keeping the last cause", async () => {
        const { vehicle, link } = bleHarness();
        const last = new Error("no slot");
        link.failConnect(1);
        link.failConnect(2, last);

        const { error } = await timed(() => vehicle.connect(2));

        expect(error).toBeInstanceOf(BluetoothTransportError);
        expect((error as Error).cause).toBe(last);
        expect(connects(link)).toBe(2);
    });

    it("lets a caller ask for more", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(4);

        await finish(vehicle.connect(5));

        expect(connects(link)).toBe(5);
    });

    it("takes the option, as a Homey action window needs", async () => {
        const { vehicle, link } = bleHarness({ max_connect_attempts: 1 });
        link.failConnect(1);

        await expect(finish(vehicle.connect_if_needed())).rejects.toBeInstanceOf(BluetoothTransportError);

        expect(connects(link)).toBe(1);
    });

    it("fails a contended link over to the cloud once the budget is spent", async () => {
        const { vehicle, link } = bleHarness();
        link.failConnect(DEFAULT_CONNECT_ATTEMPTS);
        const cloud = fakeCloud();

        await expect(finish(new VehicleRouter([vehicle, cloud]).wake_up())).resolves.toEqual(CLOUD);

        expect(cloud.wake_up).toHaveBeenCalledOnce();
        expect(connects(link)).toBe(DEFAULT_CONNECT_ATTEMPTS);
    });
});

describe("a handshake that fails during a router call", () => {
    it("leaves no half-open link behind", async () => {
        const { vehicle, link } = bleHarness();
        link.dropNextReply("session_info");
        const cloud = fakeCloud();

        await finish(new VehicleRouter([vehicle, cloud]).door_lock());

        expect(link.openConnections).toBe(0);
        expect(cloud.door_lock).toHaveBeenCalledOnce();
    });

    it("fails a failed wake over, with the link dropped", async () => {
        const harness = bleHarness();
        const { vehicle, link } = harness;
        sleepingCar(harness, -1);
        const cloud = fakeCloud();
        const wake_up = vi.fn(async () => CLOUD);

        await expect(finish(new VehicleRouter([vehicle, { ...cloud, wake_up }]).wake_up({ wait: true, timeoutMs: 2000 }))).resolves.toEqual(CLOUD);

        expect(wake_up).toHaveBeenCalledWith({ wait: true, timeoutMs: 2000 });
        expect(link.openConnections).toBe(0);
    });
});
