import { BluetoothCloudUnavailableError } from "../exceptions.js";
import { Logger } from "../log.js";
import TeslaFleetApi from "../teslafleetapi.js";
import Vehicle from "../vehicle.js";
import { get_name, name_matches_vin, valid_name } from "./names.js";
import VehicleBluetooth, { VehicleBluetoothOptions } from "./vehiclebluetooth.js";

/**
 * The vehicles of a `TeslaBluetooth`. `createBluetooth` lives here, not on the
 * root `Vehicle`, so the root entry never loads Bluetooth code.
 */
export class VehiclesBluetooth extends Vehicle {
    /** Class `createBluetooth` instantiates; a subclass overrides it to supply its own vehicle type. */
    static Bluetooth: new (parent: Vehicle, vin: string, options: VehicleBluetoothOptions) => VehicleBluetooth = VehicleBluetooth;

    /** Creates a vehicle reached over Bluetooth through `options.transport`. */
    createBluetooth(vin: string, options: VehicleBluetoothOptions): VehicleBluetooth {
        const vehicle = new (this.constructor as typeof VehiclesBluetooth).Bluetooth(this, vin, options);
        this.byVin.set(vin, vehicle);
        return vehicle;
    }
}

/**
 * A client with no cloud behind it, for vehicles reached only over Bluetooth.
 * Every REST path raises `BluetoothCloudUnavailableError` before any I/O, so a
 * REST method a vehicle inherits fails clearly, sends nothing, and is safe for
 * a router to fail over on. A cloud client that wants the same key on both
 * paths uses `new VehicleBluetooth(client.vehicles, vin, options)` instead.
 */
export default class TeslaBluetooth extends TeslaFleetApi {
    static override Vehicles: new (parent: TeslaFleetApi) => Vehicle = VehiclesBluetooth;

    declare vehicles: VehiclesBluetooth;
    override readonly _transport_name: string = "bluetooth";

    constructor(options: { privateKey?: Buffer; debug?: boolean; logger?: Logger } = {}) {
        super({
            // Never contacted, and required by the base class.
            server: "bluetooth://local",
            chargingScope: false,
            energyScope: false,
            partnerScope: false,
            userScope: false,
            debug: options.debug,
            logger: options.logger,
        });
        this.private_key = options.privateKey ?? null;
    }

    override async _request(): Promise<never> {
        throw new BluetoothCloudUnavailableError();
    }

    protected override async _fetch(): Promise<never> {
        throw new BluetoothCloudUnavailableError();
    }

    /** Whether a BLE device name is a valid Tesla vehicle's. */
    valid_name(name: string): boolean {
        return valid_name(name);
    }

    /** The BLE device name of a vehicle. */
    get_name(vin: string): string {
        return get_name(vin);
    }

    /** Whether an advertised name belongs to this VIN, with any valid suffix. */
    name_matches_vin(advertised: string, vin: string): boolean {
        return name_matches_vin(advertised, vin);
    }
}
