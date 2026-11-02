// `tsc -p tsconfig.test.json` proves the real Homey SDK classes satisfy the
// adapter's structural types, with no `homey` dependency in the library. The SDK
// types are a dev dependency only, the same package a Homey app knows as `@types/homey`.
import type BleAdvertisement from "homey-apps-sdk-v3-types/lib/BleAdvertisement.js";
import type BleCharacteristic from "homey-apps-sdk-v3-types/lib/BleCharacteristic.js";
import type BlePeripheral from "homey-apps-sdk-v3-types/lib/BlePeripheral.js";
import type BleService from "homey-apps-sdk-v3-types/lib/BleService.js";
import type ManagerBLE from "homey-apps-sdk-v3-types/manager/ble.js";
import {
    HomeyAdvertisementLike,
    HomeyBleManagerLike,
    HomeyBleTransport,
    HomeyCharacteristicLike,
    HomeyPeripheralLike,
    HomeyServiceLike,
} from "../src/bluetooth/adapters/homey.js";

export function realHomeyTypesFit(
    manager: ManagerBLE,
    advertisement: BleAdvertisement,
    peripheral: BlePeripheral,
    service: BleService,
    characteristic: BleCharacteristic,
) {
    const shapes: [HomeyBleManagerLike, HomeyAdvertisementLike, HomeyPeripheralLike, HomeyServiceLike, HomeyCharacteristicLike] = [
        manager,
        advertisement,
        peripheral,
        service,
        characteristic,
    ];
    return { shapes, transport: new HomeyBleTransport(manager) };
}
