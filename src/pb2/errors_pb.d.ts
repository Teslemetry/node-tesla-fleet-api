// package: Errors
// file: errors.proto

import * as jspb from "google-protobuf";

export class NominalError extends jspb.Message {
  getGenericerror(): GenericError_EMap[keyof GenericError_EMap];
  setGenericerror(value: GenericError_EMap[keyof GenericError_EMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NominalError.AsObject;
  static toObject(includeInstance: boolean, msg: NominalError): NominalError.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NominalError, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NominalError;
  static deserializeBinaryFromReader(message: NominalError, reader: jspb.BinaryReader): NominalError;
}

export namespace NominalError {
  export type AsObject = {
    genericerror: GenericError_EMap[keyof GenericError_EMap],
  }
}

export interface GenericError_EMap {
  GENERICERROR_NONE: 0;
  GENERICERROR_UNKNOWN: 1;
  GENERICERROR_CLOSURES_OPEN: 2;
  GENERICERROR_ALREADY_ON: 3;
  GENERICERROR_DISABLED_FOR_USER_COMMAND: 4;
  GENERICERROR_VEHICLE_NOT_IN_PARK: 5;
  GENERICERROR_UNAUTHORIZED: 6;
  GENERICERROR_NOT_ALLOWED_OVER_TRANSPORT: 7;
}

export const GenericError_E: GenericError_EMap;

