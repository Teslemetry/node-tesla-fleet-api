// package: CarServer
// file: common.proto

import * as jspb from "google-protobuf";

export class Void extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Void.AsObject;
  static toObject(includeInstance: boolean, msg: Void): Void.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Void, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Void;
  static deserializeBinaryFromReader(message: Void, reader: jspb.BinaryReader): Void;
}

export namespace Void {
  export type AsObject = {
  }
}

export class LatLong extends jspb.Message {
  getLatitude(): number;
  setLatitude(value: number): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LatLong.AsObject;
  static toObject(includeInstance: boolean, msg: LatLong): LatLong.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LatLong, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LatLong;
  static deserializeBinaryFromReader(message: LatLong, reader: jspb.BinaryReader): LatLong;
}

export namespace LatLong {
  export type AsObject = {
    latitude: number,
    longitude: number,
  }
}

export class PreconditioningTimes extends jspb.Message {
  hasAllWeek(): boolean;
  clearAllWeek(): void;
  getAllWeek(): Void | undefined;
  setAllWeek(value?: Void): void;

  hasWeekdays(): boolean;
  clearWeekdays(): void;
  getWeekdays(): Void | undefined;
  setWeekdays(value?: Void): void;

  getTimesCase(): PreconditioningTimes.TimesCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PreconditioningTimes.AsObject;
  static toObject(includeInstance: boolean, msg: PreconditioningTimes): PreconditioningTimes.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PreconditioningTimes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PreconditioningTimes;
  static deserializeBinaryFromReader(message: PreconditioningTimes, reader: jspb.BinaryReader): PreconditioningTimes;
}

export namespace PreconditioningTimes {
  export type AsObject = {
    allWeek?: Void.AsObject,
    weekdays?: Void.AsObject,
  }

  export enum TimesCase {
    TIMES_NOT_SET = 0,
    ALL_WEEK = 1,
    WEEKDAYS = 2,
  }
}

export class OffPeakChargingTimes extends jspb.Message {
  hasAllWeek(): boolean;
  clearAllWeek(): void;
  getAllWeek(): Void | undefined;
  setAllWeek(value?: Void): void;

  hasWeekdays(): boolean;
  clearWeekdays(): void;
  getWeekdays(): Void | undefined;
  setWeekdays(value?: Void): void;

  getTimesCase(): OffPeakChargingTimes.TimesCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): OffPeakChargingTimes.AsObject;
  static toObject(includeInstance: boolean, msg: OffPeakChargingTimes): OffPeakChargingTimes.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: OffPeakChargingTimes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): OffPeakChargingTimes;
  static deserializeBinaryFromReader(message: OffPeakChargingTimes, reader: jspb.BinaryReader): OffPeakChargingTimes;
}

export namespace OffPeakChargingTimes {
  export type AsObject = {
    allWeek?: Void.AsObject,
    weekdays?: Void.AsObject,
  }

  export enum TimesCase {
    TIMES_NOT_SET = 0,
    ALL_WEEK = 1,
    WEEKDAYS = 2,
  }
}

export interface InvalidMap {
  INVALID: 0;
}

export const Invalid: InvalidMap;

