// The `tesla-fleet-api/bluetooth` entry. The root entry never loads this code,
// and it imports no GATT library or native module: a backend comes in through
// the `BleTransport` a caller passes.
export * from "./constants.js";
export { ReassemblingBuffer, parseFrame, prependLength, splitFrame } from "./framing.js";
export { BleNotSubmittedError } from "./transport.js";
export type {
    BleCharacteristic,
    BleConnection,
    BleDeviceRef,
    BleLinkHandlers,
    BleScanOptions,
    BleTransport,
} from "./transport.js";
