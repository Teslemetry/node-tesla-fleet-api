// The `tesla-fleet-api/bluetooth` entry. The root entry never loads this code,
// and it imports no GATT library or native module: a backend comes in through
// the `BleTransport` a caller passes.
export type { Unsubscribe } from "./broadcast.js";
export * from "./constants.js";
export { ReassemblingBuffer, parseFrame, prependLength, splitFrame } from "./framing.js";
export { get_name, name_matches_vin, valid_name } from "./names.js";
export { default as TeslaBluetooth, VehiclesBluetooth } from "./teslabluetooth.js";
export { BleBroadcastPublisher, BleBroadcastStreamGlue, GEAR_STATES, TONNEAU_POSITION_STATES } from "./streamglue.js";
export type { StreamSink } from "./streamglue.js";
export { BleNotSubmittedError } from "./transport.js";
export type { BluetoothConfirmation } from "./verify.js";
export { default as VehicleBluetooth } from "./vehiclebluetooth.js";
export type { FindVehicleOptions, PairOptions, VehicleBluetoothOptions } from "./vehiclebluetooth.js";
export type {
    BleCharacteristic,
    BleConnection,
    BleDeviceRef,
    BleLinkHandlers,
    BleScanOptions,
    BleTransport,
} from "./transport.js";
