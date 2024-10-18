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

export class ChargeSchedule extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getName(): string;
  setName(value: string): void;

  getDaysOfWeek(): number;
  setDaysOfWeek(value: number): void;

  getStartEnabled(): boolean;
  setStartEnabled(value: boolean): void;

  getStartTime(): number;
  setStartTime(value: number): void;

  getEndEnabled(): boolean;
  setEndEnabled(value: boolean): void;

  getEndTime(): number;
  setEndTime(value: number): void;

  getOneTime(): boolean;
  setOneTime(value: boolean): void;

  getEnabled(): boolean;
  setEnabled(value: boolean): void;

  getLatitude(): number;
  setLatitude(value: number): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChargeSchedule.AsObject;
  static toObject(includeInstance: boolean, msg: ChargeSchedule): ChargeSchedule.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChargeSchedule, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChargeSchedule;
  static deserializeBinaryFromReader(message: ChargeSchedule, reader: jspb.BinaryReader): ChargeSchedule;
}

export namespace ChargeSchedule {
  export type AsObject = {
    id: number,
    name: string,
    daysOfWeek: number,
    startEnabled: boolean,
    startTime: number,
    endEnabled: boolean,
    endTime: number,
    oneTime: boolean,
    enabled: boolean,
    latitude: number,
    longitude: number,
  }
}

export class PreconditionSchedule extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getName(): string;
  setName(value: string): void;

  getDaysOfWeek(): number;
  setDaysOfWeek(value: number): void;

  getPreconditionTime(): number;
  setPreconditionTime(value: number): void;

  getOneTime(): boolean;
  setOneTime(value: boolean): void;

  getEnabled(): boolean;
  setEnabled(value: boolean): void;

  getLatitude(): number;
  setLatitude(value: number): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PreconditionSchedule.AsObject;
  static toObject(includeInstance: boolean, msg: PreconditionSchedule): PreconditionSchedule.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PreconditionSchedule, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PreconditionSchedule;
  static deserializeBinaryFromReader(message: PreconditionSchedule, reader: jspb.BinaryReader): PreconditionSchedule;
}

export namespace PreconditionSchedule {
  export type AsObject = {
    id: number,
    name: string,
    daysOfWeek: number,
    preconditionTime: number,
    oneTime: boolean,
    enabled: boolean,
    latitude: number,
    longitude: number,
  }
}

export interface InvalidMap {
  INVALID: 0;
}

export const Invalid: InvalidMap;

