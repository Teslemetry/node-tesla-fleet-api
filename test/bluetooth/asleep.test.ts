// Behaviour specs ported from Python's `tests/test_ble_infotainment_asleep.py`,
// plus the wake cases of `test_ble_connect_failover.py`. The car is a
// `FakeVehicle` on a `FakeBleLink` whose infotainment is deaf while it sleeps.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Response } from "@teslemetry/tesla-protocol/command/car_server";
import { RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import { RKEActionE, VehicleSleepStatusE, VehicleStatus } from "@teslemetry/tesla-protocol/command/vcsec";
import { VehicleRouter } from "../../src/router/index.js";
import TeslaBluetooth from "../../src/bluetooth/teslabluetooth.js";
import { BluetoothCommandFailed, BluetoothTimeout, BluetoothUnconfirmedCommand, SigningDisabled } from "../../src/exceptions.js";
import { BleHarnessOptions, INFOTAINMENT, OUR_PRIVATE_KEY, VCSEC, VIN, bleHarness, finish, sleepingCar, timed } from "../helpers/blevehicle.js";

const OK = { response: { result: true, reason: "" } };
const AWAKE = VehicleStatus.create({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_AWAKE });

async function ready(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(Promise.all([harness.vehicle.handshakeVehicleSecurity(), harness.vehicle.handshakeInfotainment()]));
    return harness;
}

/** A link that holds an authenticated VCSEC session, and no infotainment session. */
async function sessionless(options: BleHarnessOptions = {}) {
    const harness = bleHarness(options);
    await finish(harness.vehicle.handshakeVehicleSecurity());
    return harness;
}

/** What crossed the link, as a compact trace. */
function trace(frames: RoutableMessage[]): string[] {
    return frames.map((frame) => {
        const domain = frame.toDestination?.domain === VCSEC ? "vcsec" : "info";
        return frame.sessionInfoRequest ? `${domain}-handshake` : domain;
    });
}

function cloud() {
    return {
        vin: VIN,
        calls: 0,
        async set_charge_limit(_percent: number) {
            this.calls++;
            return { response: { result: true, reason: "cloud" } };
        },
    };
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("an unresolved command on a sleeping car", () => {
    it("wakes the car over Bluetooth and sends it again", async () => {
        const harness = await ready();
        const { vehicle, link, fakeVehicle } = harness;
        const car = sleepingCar(harness);
        const before = link.frames.length;

        await expect(finish(vehicle.set_charge_limit(80))).resolves.toMatchObject({ response: { result: true } });

        expect(car.wakes).toBeGreaterThanOrEqual(1);
        expect(trace(link.frames.slice(before, before + 3))).toEqual(["info", "vcsec", "vcsec"]);
        expect(fakeVehicle.vcsecCommands.map((command) => command.RKEAction).filter((action) => action === RKEActionE.RKE_ACTION_WAKE_VEHICLE)).toHaveLength(car.wakes);
        // Sent twice, heard once: a deaf computer cannot have run the first.
        expect(link.commands(INFOTAINMENT)).toHaveLength(2);
        expect(fakeVehicle.infotainmentActions).toHaveLength(1);
        expect(link.frames.at(-2)?.sessionInfoRequest).toBeDefined();
    });

    it("sends again once only, so a car that stays asleep reaches the cloud", async () => {
        const { vehicle, link, fakeVehicle } = await ready();
        // Infotainment answers a probe, so the wake seems to work, then ignores the resend.
        fakeVehicle.vehicleStatus = VehicleStatus.create({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP });
        link.deafTo = (request) => request.toDestination?.domain === INFOTAINMENT && !request.sessionInfoRequest;

        const { error } = await timed(() => vehicle.set_charge_limit(80));

        expect(error).toBeInstanceOf(BluetoothCommandFailed);
        expect(link.commands(INFOTAINMENT)).toHaveLength(2);
    });

    it("falls back to the cloud when the car will not wake", async () => {
        const harness = await ready();
        const { vehicle, link } = harness;
        vehicle.tune({ wakeTimeoutMs: 2000 });
        sleepingCar(harness, -1);
        const fallback = cloud();

        const result = await finish(new VehicleRouter([vehicle, fallback]).set_charge_limit(80));

        expect(result.response.reason).toBe("cloud");
        expect(fallback.calls).toBe(1);
        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("stays exempt for ping, which has no outcome to protect", async () => {
        const harness = await ready();
        const { vehicle, link } = harness;
        const car = sleepingCar(harness);

        const { error } = await timed(() => vehicle.ping());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect(car.wakes).toBe(0);
        expect(link.commands(VCSEC)).toEqual([]);
    });
});

describe("wake_if_asleep off", () => {
    it("raises BluetoothCommandFailed", async () => {
        const harness = await ready({ wake_if_asleep: false });
        const car = sleepingCar(harness);

        const { error } = await timed(() => harness.vehicle.set_charge_limit(80));

        expect(error).toBeInstanceOf(BluetoothCommandFailed);
        expect(car.wakes).toBe(0);
    });

    it("falls back to the cloud", async () => {
        const harness = await ready({ wake_if_asleep: false });
        sleepingCar(harness);
        const fallback = cloud();

        const result = await finish(new VehicleRouter([harness.vehicle, fallback]).set_charge_limit(80));

        expect(result.response.reason).toBe("cloud");
        expect(fallback.calls).toBe(1);
    });

    it("reaches the option through the factory", () => {
        const tesla = new TeslaBluetooth({ privateKey: OUR_PRIVATE_KEY });
        const transport = bleHarness().link;
        expect(tesla.vehicles.createBluetooth(VIN, { transport }).wake_if_asleep).toBe(true);
        expect(tesla.vehicles.createBluetooth(VIN, { transport, wake_if_asleep: false }).wake_if_asleep).toBe(false);
    });
});

describe("a car that is not asleep", () => {
    it("stays best effort when awake", async () => {
        const { vehicle, link, fakeVehicle } = await ready();
        fakeVehicle.vehicleStatus = AWAKE;
        link.dropNextReply();

        await expect(finish(vehicle.set_charge_limit(80))).resolves.toEqual(OK);

        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("stays best effort when the sleep status is unreadable", async () => {
        const { vehicle, link } = await ready();
        link.dropNextReply();
        link.dropNextReply();

        await expect(finish(vehicle.set_charge_limit(80))).resolves.toEqual(OK);

        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });
});

describe("no infotainment session on a sleeping car", () => {
    it("wakes it, then sends once infotainment answers", async () => {
        const harness = await sessionless();
        const { vehicle, link, fakeVehicle } = harness;
        sleepingCar(harness);
        const before = link.frames.length;

        await expect(finish(vehicle.set_charge_limit(80))).resolves.toMatchObject({ response: { result: true } });

        const seen = trace(link.frames.slice(before));
        expect(seen.slice(0, 3)).toEqual(["info-handshake", "vcsec", "vcsec"]);
        expect(seen.at(-2)).toBe("info-handshake");
        expect(seen.at(-1)).toBe("info");
        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
        expect(fakeVehicle.infotainmentActions).toHaveLength(1);
    });

    it("keeps the link and wakes nothing with wake off", async () => {
        const harness = await sessionless({ wake_if_asleep: false });
        const { vehicle, link } = harness;
        const car = sleepingCar(harness);

        const { error } = await timed(() => vehicle.set_charge_limit(80));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(car.wakes).toBe(0);
        expect(link.openConnections).toBe(1);
        expect(link.commands(INFOTAINMENT)).toEqual([]);
    });

    it("raises and drops the link when the sleep status is unreadable", async () => {
        const harness = await sessionless();
        const { vehicle, link } = harness;
        sleepingCar(harness);
        link.dropNextReply();

        const { error } = await timed(() => vehicle.set_charge_limit(80));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(error).not.toBeInstanceOf(BluetoothUnconfirmedCommand);
        expect(link.openConnections).toBe(0);
        expect(link.commands(INFOTAINMENT)).toEqual([]);
    });
});

describe("an awake car with infotainment still booting", () => {
    function booting(harness: ReturnType<typeof bleHarness>, bootMs: number | null) {
        harness.fakeVehicle.vehicleStatus = AWAKE;
        let up = false;
        harness.link.deafTo = (request) => request.toDestination?.domain === INFOTAINMENT && !up;
        if (bootMs !== null) {
            setTimeout(() => {
                up = true;
            }, bootMs);
        }
    }

    it("retries the handshake until infotainment answers, without waking", async () => {
        const harness = await sessionless();
        const { vehicle, link, fakeVehicle } = harness;
        booting(harness, 8000);
        fakeVehicle.onVcsecCommand = (command) => {
            expect(command.RKEAction).toBeUndefined();
        };

        await expect(finish(vehicle.set_charge_limit(80))).resolves.toMatchObject({ response: { result: true } });

        expect(link.handshakes(INFOTAINMENT).length).toBeGreaterThan(2);
        expect(link.commands(INFOTAINMENT)).toHaveLength(1);
    });

    it("retries with wake off, as that wakes nothing", async () => {
        const harness = await sessionless({ wake_if_asleep: false });
        booting(harness, 7000);

        await expect(finish(harness.vehicle.set_charge_limit(80))).resolves.toMatchObject({ response: { result: true } });
    });

    it("raises the handshake's timeout and drops the link after the boot timeout", async () => {
        const harness = await sessionless();
        const { vehicle, link, fakeVehicle } = harness;
        booting(harness, null);

        const { error, elapsedMs } = await timed(() => vehicle.set_charge_limit(80));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(elapsedMs).toBeGreaterThanOrEqual(20_000);
        expect(elapsedMs).toBeLessThan(30_000);
        expect(link.openConnections).toBe(0);
        expect(link.commands(INFOTAINMENT)).toEqual([]);
        expect(fakeVehicle.vcsecCommands.filter((command) => command.RKEAction !== undefined)).toEqual([]);
    });
});

describe("wake_up with wait", () => {
    it("resolves once infotainment completes a handshake", async () => {
        const harness = bleHarness();
        const { vehicle, link } = harness;
        sleepingCar(harness);

        await expect(finish(vehicle.wake_up({ wait: true }))).resolves.toEqual(OK);

        expect(vehicle.session(INFOTAINMENT).ready).toBe(true);
        expect(link.openConnections).toBe(1);
    });

    it("sends a fresh probe even with a session cached", async () => {
        const { vehicle, link } = await ready();
        const before = link.handshakes(INFOTAINMENT).length;

        await finish(vehicle.wake_up({ wait: true }));

        expect(link.handshakes(INFOTAINMENT)).toHaveLength(before + 1);
    });

    it("resends the wake every 3 s while infotainment stays silent", async () => {
        const harness = bleHarness();
        const car = sleepingCar(harness, -1);

        const { error, elapsedMs } = await timed(() => harness.vehicle.wake_up({ wait: true, timeoutMs: 10_000 }));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(elapsedMs).toBeLessThan(13_000);
        expect(car.wakes).toBeGreaterThanOrEqual(3);
        expect(car.wakes).toBeLessThanOrEqual(5);
    });

    it("ignores a lost wake ack, as the probe decides", async () => {
        const harness = bleHarness({ raise_unconfirmed: true });
        sleepingCar(harness);
        harness.link.dropNextReply();

        await expect(finish(harness.vehicle.wake_up({ wait: true }))).resolves.toEqual(OK);
    });

    it("drops the link when the car never answers", async () => {
        const harness = bleHarness();
        sleepingCar(harness, -1);

        const { error } = await timed(() => harness.vehicle.wake_up({ wait: true, timeoutMs: 2000 }));

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(harness.link.openConnections).toBe(0);
    });

    it("keeps a passive listener's link", async () => {
        const { vehicle, link } = bleHarness({ privateKey: false });
        await finish(vehicle.connect());

        await expect(finish(vehicle.wake_up({ wait: true }))).rejects.toBeInstanceOf(SigningDisabled);

        expect(link.openConnections).toBe(1);
        expect(link.writes).toEqual([]);
    });

    it("keeps the pinned vehicle key across a reconnect", async () => {
        const { vehicle, link, fakeVehicle } = await ready();
        const pinned = vehicle.session(INFOTAINMENT).publicKey;
        link.dropLink();

        await finish(vehicle.wake_up({ wait: true }));

        expect(link.connections).toHaveLength(2);
        expect(vehicle.session(INFOTAINMENT).publicKey).toEqual(pinned);
        expect(pinned).toEqual(fakeVehicle.publicKey);
    });
});

describe("the probe window", () => {
    it("is not spent writing, so a 20-byte link can take longer than a probe to send", async () => {
        const harness = bleHarness({ maxWriteSize: "unreported" });
        const { vehicle, link } = harness;
        await finish(vehicle.handshakeVehicleSecurity());
        sleepingCar(harness, 0);
        // A session-info request takes 6 writes at 20 bytes: 1.5 s here.
        link.writeDelayMs = 250;

        await expect(finish(vehicle.wake_up({ wait: true }))).resolves.toEqual(OK);

        expect(link.handshakes(INFOTAINMENT)).toHaveLength(1);
    });

    it("can be raised for a link with slow replies", async () => {
        const harness = bleHarness({ wake_probe_timeout_ms: 3000 });
        const { vehicle, link } = harness;
        await finish(vehicle.handshakeVehicleSecurity());
        link.delayNextReply(2000, "session_info");

        await expect(finish(vehicle.wake_up({ wait: true }))).resolves.toEqual(OK);

        expect(link.handshakes(INFOTAINMENT)).toHaveLength(1);
    });

    it("refuses a window that could never hold a reply", () => {
        expect(() => bleHarness({ wake_probe_timeout_ms: 0 })).toThrow(RangeError);
    });

    it("discards a reply to an earlier probe, and asks again", async () => {
        const { vehicle, link } = await ready();
        link.delayNextReply(1200, "session_info");

        await expect(finish(vehicle.wake_up({ wait: true }))).resolves.toEqual(OK);

        expect(link.handshakes(INFOTAINMENT).length).toBeGreaterThanOrEqual(3);
    });
});

describe("a read from infotainment on a sleeping car", () => {
    it("wakes the car and reads again, with a session cached", async () => {
        const harness = await ready();
        const { vehicle, fakeVehicle } = harness;
        const car = sleepingCar(harness);
        fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ vehicleData: { chargeState: { chargeLimitSoc: 80 } } }));

        await expect(finish(vehicle.charge_state())).resolves.toMatchObject({ chargeLimitSoc: 80 });

        expect(car.wakes).toBeGreaterThanOrEqual(1);
        expect(fakeVehicle.vcsecCommands.some((command) => command.RKEAction === RKEActionE.RKE_ACTION_WAKE_VEHICLE)).toBe(true);
    });

    it("wakes the car when the handshake goes unanswered", async () => {
        const harness = await sessionless();
        const { vehicle, fakeVehicle } = harness;
        const car = sleepingCar(harness);
        fakeVehicle.replyToNextInfotainmentCommandWith(Response.create({ vehicleData: { chargeState: { chargeLimitSoc: 80 } } }));

        await expect(finish(vehicle.charge_state())).resolves.toMatchObject({ chargeLimitSoc: 80 });

        expect(car.wakes).toBeGreaterThanOrEqual(1);
    });

    it("raises and wakes nothing with wake off", async () => {
        const harness = await ready({ wake_if_asleep: false });
        const { vehicle, fakeVehicle } = harness;
        sleepingCar(harness);

        const { error } = await timed(() => vehicle.charge_state());

        expect(error).toBeInstanceOf(BluetoothTimeout);
        expect(fakeVehicle.vcsecCommands.some((command) => command.RKEAction === RKEActionE.RKE_ACTION_WAKE_VEHICLE)).toBe(false);
    });

    it("leaves VCSEC reads alone: vehicle_state never wakes the car", async () => {
        const harness = await ready();
        const { vehicle, fakeVehicle } = harness;
        sleepingCar(harness);

        await expect(finish(vehicle.vehicle_state())).resolves.toMatchObject({ vehicleSleepStatus: VehicleSleepStatusE.VEHICLE_SLEEP_STATUS_ASLEEP });

        expect(fakeVehicle.vcsecCommands.some((command) => command.RKEAction === RKEActionE.RKE_ACTION_WAKE_VEHICLE)).toBe(false);
    });

    it("raises BluetoothCommandFailed when the car will not wake, having sent the read twice at most", async () => {
        const harness = await ready();
        const { vehicle, link } = harness;
        sleepingCar(harness, -1);

        const { error } = await timed(() => vehicle.charge_state());

        expect(error).toBeInstanceOf(BluetoothCommandFailed);
        expect(link.commands(INFOTAINMENT).length).toBeLessThanOrEqual(2);
    });
});
