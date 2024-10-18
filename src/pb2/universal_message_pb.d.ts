// package: UniversalMessage
// file: universal_message.proto

import * as jspb from "google-protobuf";
import * as signatures_pb from "./signatures_pb";

export class Destination extends jspb.Message {
  hasDomain(): boolean;
  clearDomain(): void;
  getDomain(): DomainMap[keyof DomainMap];
  setDomain(value: DomainMap[keyof DomainMap]): void;

  hasRoutingAddress(): boolean;
  clearRoutingAddress(): void;
  getRoutingAddress(): Uint8Array | string;
  getRoutingAddress_asU8(): Uint8Array;
  getRoutingAddress_asB64(): string;
  setRoutingAddress(value: Uint8Array | string): void;

  getSubDestinationCase(): Destination.SubDestinationCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Destination.AsObject;
  static toObject(includeInstance: boolean, msg: Destination): Destination.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Destination, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Destination;
  static deserializeBinaryFromReader(message: Destination, reader: jspb.BinaryReader): Destination;
}

export namespace Destination {
  export type AsObject = {
    domain: DomainMap[keyof DomainMap],
    routingAddress: Uint8Array | string,
  }

  export enum SubDestinationCase {
    SUB_DESTINATION_NOT_SET = 0,
    DOMAIN = 1,
    ROUTING_ADDRESS = 2,
  }
}

export class MessageStatus extends jspb.Message {
  getOperationStatus(): OperationStatus_EMap[keyof OperationStatus_EMap];
  setOperationStatus(value: OperationStatus_EMap[keyof OperationStatus_EMap]): void;

  getSignedMessageFault(): MessageFault_EMap[keyof MessageFault_EMap];
  setSignedMessageFault(value: MessageFault_EMap[keyof MessageFault_EMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MessageStatus.AsObject;
  static toObject(includeInstance: boolean, msg: MessageStatus): MessageStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MessageStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MessageStatus;
  static deserializeBinaryFromReader(message: MessageStatus, reader: jspb.BinaryReader): MessageStatus;
}

export namespace MessageStatus {
  export type AsObject = {
    operationStatus: OperationStatus_EMap[keyof OperationStatus_EMap],
    signedMessageFault: MessageFault_EMap[keyof MessageFault_EMap],
  }
}

export class SessionInfoRequest extends jspb.Message {
  getPublicKey(): Uint8Array | string;
  getPublicKey_asU8(): Uint8Array;
  getPublicKey_asB64(): string;
  setPublicKey(value: Uint8Array | string): void;

  getChallenge(): Uint8Array | string;
  getChallenge_asU8(): Uint8Array;
  getChallenge_asB64(): string;
  setChallenge(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SessionInfoRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SessionInfoRequest): SessionInfoRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SessionInfoRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SessionInfoRequest;
  static deserializeBinaryFromReader(message: SessionInfoRequest, reader: jspb.BinaryReader): SessionInfoRequest;
}

export namespace SessionInfoRequest {
  export type AsObject = {
    publicKey: Uint8Array | string,
    challenge: Uint8Array | string,
  }
}

export class RoutableMessage extends jspb.Message {
  hasToDestination(): boolean;
  clearToDestination(): void;
  getToDestination(): Destination | undefined;
  setToDestination(value?: Destination): void;

  hasFromDestination(): boolean;
  clearFromDestination(): void;
  getFromDestination(): Destination | undefined;
  setFromDestination(value?: Destination): void;

  hasProtobufMessageAsBytes(): boolean;
  clearProtobufMessageAsBytes(): void;
  getProtobufMessageAsBytes(): Uint8Array | string;
  getProtobufMessageAsBytes_asU8(): Uint8Array;
  getProtobufMessageAsBytes_asB64(): string;
  setProtobufMessageAsBytes(value: Uint8Array | string): void;

  hasSessionInfoRequest(): boolean;
  clearSessionInfoRequest(): void;
  getSessionInfoRequest(): SessionInfoRequest | undefined;
  setSessionInfoRequest(value?: SessionInfoRequest): void;

  hasSessionInfo(): boolean;
  clearSessionInfo(): void;
  getSessionInfo(): Uint8Array | string;
  getSessionInfo_asU8(): Uint8Array;
  getSessionInfo_asB64(): string;
  setSessionInfo(value: Uint8Array | string): void;

  hasSignatureData(): boolean;
  clearSignatureData(): void;
  getSignatureData(): signatures_pb.SignatureData | undefined;
  setSignatureData(value?: signatures_pb.SignatureData): void;

  hasSignedmessagestatus(): boolean;
  clearSignedmessagestatus(): void;
  getSignedmessagestatus(): MessageStatus | undefined;
  setSignedmessagestatus(value?: MessageStatus): void;

  getRequestUuid(): Uint8Array | string;
  getRequestUuid_asU8(): Uint8Array;
  getRequestUuid_asB64(): string;
  setRequestUuid(value: Uint8Array | string): void;

  getUuid(): Uint8Array | string;
  getUuid_asU8(): Uint8Array;
  getUuid_asB64(): string;
  setUuid(value: Uint8Array | string): void;

  getFlags(): number;
  setFlags(value: number): void;

  getPayloadCase(): RoutableMessage.PayloadCase;
  getSubSigdataCase(): RoutableMessage.SubSigdataCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RoutableMessage.AsObject;
  static toObject(includeInstance: boolean, msg: RoutableMessage): RoutableMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RoutableMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RoutableMessage;
  static deserializeBinaryFromReader(message: RoutableMessage, reader: jspb.BinaryReader): RoutableMessage;
}

export namespace RoutableMessage {
  export type AsObject = {
    toDestination?: Destination.AsObject,
    fromDestination?: Destination.AsObject,
    protobufMessageAsBytes: Uint8Array | string,
    sessionInfoRequest?: SessionInfoRequest.AsObject,
    sessionInfo: Uint8Array | string,
    signatureData?: signatures_pb.SignatureData.AsObject,
    signedmessagestatus?: MessageStatus.AsObject,
    requestUuid: Uint8Array | string,
    uuid: Uint8Array | string,
    flags: number,
  }

  export enum PayloadCase {
    PAYLOAD_NOT_SET = 0,
    PROTOBUF_MESSAGE_AS_BYTES = 10,
    SESSION_INFO_REQUEST = 14,
    SESSION_INFO = 15,
  }

  export enum SubSigdataCase {
    SUB_SIGDATA_NOT_SET = 0,
    SIGNATURE_DATA = 13,
  }
}

export interface DomainMap {
  DOMAIN_BROADCAST: 0;
  DOMAIN_VEHICLE_SECURITY: 2;
  DOMAIN_INFOTAINMENT: 3;
}

export const Domain: DomainMap;

export interface OperationStatus_EMap {
  OPERATIONSTATUS_OK: 0;
  OPERATIONSTATUS_WAIT: 1;
  OPERATIONSTATUS_ERROR: 2;
}

export const OperationStatus_E: OperationStatus_EMap;

export interface MessageFault_EMap {
  MESSAGEFAULT_ERROR_NONE: 0;
  MESSAGEFAULT_ERROR_BUSY: 1;
  MESSAGEFAULT_ERROR_TIMEOUT: 2;
  MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID: 3;
  MESSAGEFAULT_ERROR_INACTIVE_KEY: 4;
  MESSAGEFAULT_ERROR_INVALID_SIGNATURE: 5;
  MESSAGEFAULT_ERROR_INVALID_TOKEN_OR_COUNTER: 6;
  MESSAGEFAULT_ERROR_INSUFFICIENT_PRIVILEGES: 7;
  MESSAGEFAULT_ERROR_INVALID_DOMAINS: 8;
  MESSAGEFAULT_ERROR_INVALID_COMMAND: 9;
  MESSAGEFAULT_ERROR_DECODING: 10;
  MESSAGEFAULT_ERROR_INTERNAL: 11;
  MESSAGEFAULT_ERROR_WRONG_PERSONALIZATION: 12;
  MESSAGEFAULT_ERROR_BAD_PARAMETER: 13;
  MESSAGEFAULT_ERROR_KEYCHAIN_IS_FULL: 14;
  MESSAGEFAULT_ERROR_INCORRECT_EPOCH: 15;
  MESSAGEFAULT_ERROR_IV_INCORRECT_LENGTH: 16;
  MESSAGEFAULT_ERROR_TIME_EXPIRED: 17;
  MESSAGEFAULT_ERROR_NOT_PROVISIONED_WITH_IDENTITY: 18;
  MESSAGEFAULT_ERROR_COULD_NOT_HASH_METADATA: 19;
  MESSAGEFAULT_ERROR_TIME_TO_LIVE_TOO_LONG: 20;
  MESSAGEFAULT_ERROR_REMOTE_ACCESS_DISABLED: 21;
  MESSAGEFAULT_ERROR_REMOTE_SERVICE_ACCESS_DISABLED: 22;
  MESSAGEFAULT_ERROR_COMMAND_REQUIRES_ACCOUNT_CREDENTIALS: 23;
}

export const MessageFault_E: MessageFault_EMap;

export interface FlagsMap {
  FLAG_USER_COMMAND: 0;
}

export const Flags: FlagsMap;

