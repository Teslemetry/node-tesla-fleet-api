// package: Signatures
// file: signatures.proto

import * as jspb from "google-protobuf";

export class KeyIdentity extends jspb.Message {
  hasPublicKey(): boolean;
  clearPublicKey(): void;
  getPublicKey(): Uint8Array | string;
  getPublicKey_asU8(): Uint8Array;
  getPublicKey_asB64(): string;
  setPublicKey(value: Uint8Array | string): void;

  getIdentityTypeCase(): KeyIdentity.IdentityTypeCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KeyIdentity.AsObject;
  static toObject(includeInstance: boolean, msg: KeyIdentity): KeyIdentity.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KeyIdentity, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KeyIdentity;
  static deserializeBinaryFromReader(message: KeyIdentity, reader: jspb.BinaryReader): KeyIdentity;
}

export namespace KeyIdentity {
  export type AsObject = {
    publicKey: Uint8Array | string,
  }

  export enum IdentityTypeCase {
    IDENTITY_TYPE_NOT_SET = 0,
    PUBLIC_KEY = 1,
  }
}

export class AES_GCM_Personalized_Signature_Data extends jspb.Message {
  getEpoch(): Uint8Array | string;
  getEpoch_asU8(): Uint8Array;
  getEpoch_asB64(): string;
  setEpoch(value: Uint8Array | string): void;

  getNonce(): Uint8Array | string;
  getNonce_asU8(): Uint8Array;
  getNonce_asB64(): string;
  setNonce(value: Uint8Array | string): void;

  getCounter(): number;
  setCounter(value: number): void;

  getExpiresAt(): number;
  setExpiresAt(value: number): void;

  getTag(): Uint8Array | string;
  getTag_asU8(): Uint8Array;
  getTag_asB64(): string;
  setTag(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AES_GCM_Personalized_Signature_Data.AsObject;
  static toObject(includeInstance: boolean, msg: AES_GCM_Personalized_Signature_Data): AES_GCM_Personalized_Signature_Data.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AES_GCM_Personalized_Signature_Data, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AES_GCM_Personalized_Signature_Data;
  static deserializeBinaryFromReader(message: AES_GCM_Personalized_Signature_Data, reader: jspb.BinaryReader): AES_GCM_Personalized_Signature_Data;
}

export namespace AES_GCM_Personalized_Signature_Data {
  export type AsObject = {
    epoch: Uint8Array | string,
    nonce: Uint8Array | string,
    counter: number,
    expiresAt: number,
    tag: Uint8Array | string,
  }
}

export class HMAC_Signature_Data extends jspb.Message {
  getTag(): Uint8Array | string;
  getTag_asU8(): Uint8Array;
  getTag_asB64(): string;
  setTag(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HMAC_Signature_Data.AsObject;
  static toObject(includeInstance: boolean, msg: HMAC_Signature_Data): HMAC_Signature_Data.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HMAC_Signature_Data, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HMAC_Signature_Data;
  static deserializeBinaryFromReader(message: HMAC_Signature_Data, reader: jspb.BinaryReader): HMAC_Signature_Data;
}

export namespace HMAC_Signature_Data {
  export type AsObject = {
    tag: Uint8Array | string,
  }
}

export class HMAC_Personalized_Signature_Data extends jspb.Message {
  getEpoch(): Uint8Array | string;
  getEpoch_asU8(): Uint8Array;
  getEpoch_asB64(): string;
  setEpoch(value: Uint8Array | string): void;

  getCounter(): number;
  setCounter(value: number): void;

  getExpiresAt(): number;
  setExpiresAt(value: number): void;

  getTag(): Uint8Array | string;
  getTag_asU8(): Uint8Array;
  getTag_asB64(): string;
  setTag(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HMAC_Personalized_Signature_Data.AsObject;
  static toObject(includeInstance: boolean, msg: HMAC_Personalized_Signature_Data): HMAC_Personalized_Signature_Data.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HMAC_Personalized_Signature_Data, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HMAC_Personalized_Signature_Data;
  static deserializeBinaryFromReader(message: HMAC_Personalized_Signature_Data, reader: jspb.BinaryReader): HMAC_Personalized_Signature_Data;
}

export namespace HMAC_Personalized_Signature_Data {
  export type AsObject = {
    epoch: Uint8Array | string,
    counter: number,
    expiresAt: number,
    tag: Uint8Array | string,
  }
}

export class SignatureData extends jspb.Message {
  hasSignerIdentity(): boolean;
  clearSignerIdentity(): void;
  getSignerIdentity(): KeyIdentity | undefined;
  setSignerIdentity(value?: KeyIdentity): void;

  hasAesGcmPersonalizedData(): boolean;
  clearAesGcmPersonalizedData(): void;
  getAesGcmPersonalizedData(): AES_GCM_Personalized_Signature_Data | undefined;
  setAesGcmPersonalizedData(value?: AES_GCM_Personalized_Signature_Data): void;

  hasSessionInfoTag(): boolean;
  clearSessionInfoTag(): void;
  getSessionInfoTag(): HMAC_Signature_Data | undefined;
  setSessionInfoTag(value?: HMAC_Signature_Data): void;

  hasHmacPersonalizedData(): boolean;
  clearHmacPersonalizedData(): void;
  getHmacPersonalizedData(): HMAC_Personalized_Signature_Data | undefined;
  setHmacPersonalizedData(value?: HMAC_Personalized_Signature_Data): void;

  getSigTypeCase(): SignatureData.SigTypeCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignatureData.AsObject;
  static toObject(includeInstance: boolean, msg: SignatureData): SignatureData.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignatureData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignatureData;
  static deserializeBinaryFromReader(message: SignatureData, reader: jspb.BinaryReader): SignatureData;
}

export namespace SignatureData {
  export type AsObject = {
    signerIdentity?: KeyIdentity.AsObject,
    aesGcmPersonalizedData?: AES_GCM_Personalized_Signature_Data.AsObject,
    sessionInfoTag?: HMAC_Signature_Data.AsObject,
    hmacPersonalizedData?: HMAC_Personalized_Signature_Data.AsObject,
  }

  export enum SigTypeCase {
    SIG_TYPE_NOT_SET = 0,
    AES_GCM_PERSONALIZED_DATA = 5,
    SESSION_INFO_TAG = 6,
    HMAC_PERSONALIZED_DATA = 8,
  }
}

export class GetSessionInfoRequest extends jspb.Message {
  hasKeyIdentity(): boolean;
  clearKeyIdentity(): void;
  getKeyIdentity(): KeyIdentity | undefined;
  setKeyIdentity(value?: KeyIdentity): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetSessionInfoRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetSessionInfoRequest): GetSessionInfoRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetSessionInfoRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetSessionInfoRequest;
  static deserializeBinaryFromReader(message: GetSessionInfoRequest, reader: jspb.BinaryReader): GetSessionInfoRequest;
}

export namespace GetSessionInfoRequest {
  export type AsObject = {
    keyIdentity?: KeyIdentity.AsObject,
  }
}

export class SessionInfo extends jspb.Message {
  getCounter(): number;
  setCounter(value: number): void;

  getPublickey(): Uint8Array | string;
  getPublickey_asU8(): Uint8Array;
  getPublickey_asB64(): string;
  setPublickey(value: Uint8Array | string): void;

  getEpoch(): Uint8Array | string;
  getEpoch_asU8(): Uint8Array;
  getEpoch_asB64(): string;
  setEpoch(value: Uint8Array | string): void;

  getClockTime(): number;
  setClockTime(value: number): void;

  getStatus(): Session_Info_StatusMap[keyof Session_Info_StatusMap];
  setStatus(value: Session_Info_StatusMap[keyof Session_Info_StatusMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SessionInfo.AsObject;
  static toObject(includeInstance: boolean, msg: SessionInfo): SessionInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SessionInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SessionInfo;
  static deserializeBinaryFromReader(message: SessionInfo, reader: jspb.BinaryReader): SessionInfo;
}

export namespace SessionInfo {
  export type AsObject = {
    counter: number,
    publickey: Uint8Array | string,
    epoch: Uint8Array | string,
    clockTime: number,
    status: Session_Info_StatusMap[keyof Session_Info_StatusMap],
  }
}

export interface TagMap {
  TAG_SIGNATURE_TYPE: 0;
  TAG_DOMAIN: 1;
  TAG_PERSONALIZATION: 2;
  TAG_EPOCH: 3;
  TAG_EXPIRES_AT: 4;
  TAG_COUNTER: 5;
  TAG_CHALLENGE: 6;
  TAG_FLAGS: 7;
  TAG_END: 255;
}

export const Tag: TagMap;

export interface SignatureTypeMap {
  SIGNATURE_TYPE_AES_GCM: 0;
  SIGNATURE_TYPE_AES_GCM_PERSONALIZED: 5;
  SIGNATURE_TYPE_HMAC: 6;
  SIGNATURE_TYPE_HMAC_PERSONALIZED: 8;
}

export const SignatureType: SignatureTypeMap;

export interface Session_Info_StatusMap {
  SESSION_INFO_STATUS_OK: 0;
  SESSION_INFO_STATUS_KEY_NOT_ON_WHITELIST: 1;
}

export const Session_Info_Status: Session_Info_StatusMap;

