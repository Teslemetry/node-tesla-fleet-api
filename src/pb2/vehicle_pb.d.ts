// package: CarServer
// file: vehicle.proto

import * as jspb from "google-protobuf";

export class VehicleState extends jspb.Message {
  hasGuestmode(): boolean;
  clearGuestmode(): void;
  getGuestmode(): VehicleState.GuestMode | undefined;
  setGuestmode(value?: VehicleState.GuestMode): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleState.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleState): VehicleState.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleState, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleState;
  static deserializeBinaryFromReader(message: VehicleState, reader: jspb.BinaryReader): VehicleState;
}

export namespace VehicleState {
  export type AsObject = {
    guestmode?: VehicleState.GuestMode.AsObject,
  }

  export class GuestMode extends jspb.Message {
    getGuestmodeactive(): boolean;
    setGuestmodeactive(value: boolean): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GuestMode.AsObject;
    static toObject(includeInstance: boolean, msg: GuestMode): GuestMode.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GuestMode, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GuestMode;
    static deserializeBinaryFromReader(message: GuestMode, reader: jspb.BinaryReader): GuestMode;
  }

  export namespace GuestMode {
    export type AsObject = {
      guestmodeactive: boolean,
    }
  }
}

export class ClimateState extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClimateState.AsObject;
  static toObject(includeInstance: boolean, msg: ClimateState): ClimateState.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ClimateState, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClimateState;
  static deserializeBinaryFromReader(message: ClimateState, reader: jspb.BinaryReader): ClimateState;
}

export namespace ClimateState {
  export type AsObject = {
  }

  export interface CopActivationTempMap {
    COPACTIVATIONTEMPUNSPECIFIED: 0;
    COPACTIVATIONTEMPLOW: 1;
    COPACTIVATIONTEMPMEDIUM: 2;
    COPACTIVATIONTEMPHIGH: 3;
  }

  export const CopActivationTemp: CopActivationTempMap;
}

