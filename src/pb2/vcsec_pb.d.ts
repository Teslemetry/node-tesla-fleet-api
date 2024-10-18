// package: VCSEC
// file: vcsec.proto

import * as jspb from "google-protobuf";
import * as keys_pb from "./keys_pb";
import * as errors_pb from "./errors_pb";

export class SignedMessage extends jspb.Message {
  getProtobufmessageasbytes(): Uint8Array | string;
  getProtobufmessageasbytes_asU8(): Uint8Array;
  getProtobufmessageasbytes_asB64(): string;
  setProtobufmessageasbytes(value: Uint8Array | string): void;

  getSignaturetype(): SignatureTypeMap[keyof SignatureTypeMap];
  setSignaturetype(value: SignatureTypeMap[keyof SignatureTypeMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedMessage.AsObject;
  static toObject(includeInstance: boolean, msg: SignedMessage): SignedMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignedMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignedMessage;
  static deserializeBinaryFromReader(message: SignedMessage, reader: jspb.BinaryReader): SignedMessage;
}

export namespace SignedMessage {
  export type AsObject = {
    protobufmessageasbytes: Uint8Array | string,
    signaturetype: SignatureTypeMap[keyof SignatureTypeMap],
  }
}

export class ToVCSECMessage extends jspb.Message {
  hasSignedmessage(): boolean;
  clearSignedmessage(): void;
  getSignedmessage(): SignedMessage | undefined;
  setSignedmessage(value?: SignedMessage): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ToVCSECMessage.AsObject;
  static toObject(includeInstance: boolean, msg: ToVCSECMessage): ToVCSECMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ToVCSECMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ToVCSECMessage;
  static deserializeBinaryFromReader(message: ToVCSECMessage, reader: jspb.BinaryReader): ToVCSECMessage;
}

export namespace ToVCSECMessage {
  export type AsObject = {
    signedmessage?: SignedMessage.AsObject,
  }
}

export class KeyIdentifier extends jspb.Message {
  getPublickeysha1(): Uint8Array | string;
  getPublickeysha1_asU8(): Uint8Array;
  getPublickeysha1_asB64(): string;
  setPublickeysha1(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KeyIdentifier.AsObject;
  static toObject(includeInstance: boolean, msg: KeyIdentifier): KeyIdentifier.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KeyIdentifier, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KeyIdentifier;
  static deserializeBinaryFromReader(message: KeyIdentifier, reader: jspb.BinaryReader): KeyIdentifier;
}

export namespace KeyIdentifier {
  export type AsObject = {
    publickeysha1: Uint8Array | string,
  }
}

export class KeyMetadata extends jspb.Message {
  getKeyformfactor(): KeyFormFactorMap[keyof KeyFormFactorMap];
  setKeyformfactor(value: KeyFormFactorMap[keyof KeyFormFactorMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KeyMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: KeyMetadata): KeyMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KeyMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KeyMetadata;
  static deserializeBinaryFromReader(message: KeyMetadata, reader: jspb.BinaryReader): KeyMetadata;
}

export namespace KeyMetadata {
  export type AsObject = {
    keyformfactor: KeyFormFactorMap[keyof KeyFormFactorMap],
  }
}

export class PublicKey extends jspb.Message {
  getPublickeyraw(): Uint8Array | string;
  getPublickeyraw_asU8(): Uint8Array;
  getPublickeyraw_asB64(): string;
  setPublickeyraw(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PublicKey.AsObject;
  static toObject(includeInstance: boolean, msg: PublicKey): PublicKey.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PublicKey, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PublicKey;
  static deserializeBinaryFromReader(message: PublicKey, reader: jspb.BinaryReader): PublicKey;
}

export namespace PublicKey {
  export type AsObject = {
    publickeyraw: Uint8Array | string,
  }
}

export class WhitelistInfo extends jspb.Message {
  getNumberofentries(): number;
  setNumberofentries(value: number): void;

  clearWhitelistentriesList(): void;
  getWhitelistentriesList(): Array<KeyIdentifier>;
  setWhitelistentriesList(value: Array<KeyIdentifier>): void;
  addWhitelistentries(value?: KeyIdentifier, index?: number): KeyIdentifier;

  getSlotmask(): number;
  setSlotmask(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WhitelistInfo.AsObject;
  static toObject(includeInstance: boolean, msg: WhitelistInfo): WhitelistInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WhitelistInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WhitelistInfo;
  static deserializeBinaryFromReader(message: WhitelistInfo, reader: jspb.BinaryReader): WhitelistInfo;
}

export namespace WhitelistInfo {
  export type AsObject = {
    numberofentries: number,
    whitelistentriesList: Array<KeyIdentifier.AsObject>,
    slotmask: number,
  }
}

export class WhitelistEntryInfo extends jspb.Message {
  hasKeyid(): boolean;
  clearKeyid(): void;
  getKeyid(): KeyIdentifier | undefined;
  setKeyid(value?: KeyIdentifier): void;

  hasPublickey(): boolean;
  clearPublickey(): void;
  getPublickey(): PublicKey | undefined;
  setPublickey(value?: PublicKey): void;

  hasMetadataforkey(): boolean;
  clearMetadataforkey(): void;
  getMetadataforkey(): KeyMetadata | undefined;
  setMetadataforkey(value?: KeyMetadata): void;

  getSlot(): number;
  setSlot(value: number): void;

  getKeyrole(): keys_pb.RoleMap[keyof keys_pb.RoleMap];
  setKeyrole(value: keys_pb.RoleMap[keyof keys_pb.RoleMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WhitelistEntryInfo.AsObject;
  static toObject(includeInstance: boolean, msg: WhitelistEntryInfo): WhitelistEntryInfo.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WhitelistEntryInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WhitelistEntryInfo;
  static deserializeBinaryFromReader(message: WhitelistEntryInfo, reader: jspb.BinaryReader): WhitelistEntryInfo;
}

export namespace WhitelistEntryInfo {
  export type AsObject = {
    keyid?: KeyIdentifier.AsObject,
    publickey?: PublicKey.AsObject,
    metadataforkey?: KeyMetadata.AsObject,
    slot: number,
    keyrole: keys_pb.RoleMap[keyof keys_pb.RoleMap],
  }
}

export class InformationRequest extends jspb.Message {
  getInformationrequesttype(): InformationRequestTypeMap[keyof InformationRequestTypeMap];
  setInformationrequesttype(value: InformationRequestTypeMap[keyof InformationRequestTypeMap]): void;

  hasKeyid(): boolean;
  clearKeyid(): void;
  getKeyid(): KeyIdentifier | undefined;
  setKeyid(value?: KeyIdentifier): void;

  hasPublickey(): boolean;
  clearPublickey(): void;
  getPublickey(): Uint8Array | string;
  getPublickey_asU8(): Uint8Array;
  getPublickey_asB64(): string;
  setPublickey(value: Uint8Array | string): void;

  hasSlot(): boolean;
  clearSlot(): void;
  getSlot(): number;
  setSlot(value: number): void;

  getKeyCase(): InformationRequest.KeyCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): InformationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: InformationRequest): InformationRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: InformationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): InformationRequest;
  static deserializeBinaryFromReader(message: InformationRequest, reader: jspb.BinaryReader): InformationRequest;
}

export namespace InformationRequest {
  export type AsObject = {
    informationrequesttype: InformationRequestTypeMap[keyof InformationRequestTypeMap],
    keyid?: KeyIdentifier.AsObject,
    publickey: Uint8Array | string,
    slot: number,
  }

  export enum KeyCase {
    KEY_NOT_SET = 0,
    KEYID = 2,
    PUBLICKEY = 3,
    SLOT = 4,
  }
}

export class ClosureMoveRequest extends jspb.Message {
  getFrontdriverdoor(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setFrontdriverdoor(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  getFrontpassengerdoor(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setFrontpassengerdoor(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  getReardriverdoor(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setReardriverdoor(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  getRearpassengerdoor(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setRearpassengerdoor(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  getReartrunk(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setReartrunk(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  getFronttrunk(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setFronttrunk(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  getChargeport(): ClosureMoveType_EMap[keyof ClosureMoveType_EMap];
  setChargeport(value: ClosureMoveType_EMap[keyof ClosureMoveType_EMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClosureMoveRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ClosureMoveRequest): ClosureMoveRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ClosureMoveRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClosureMoveRequest;
  static deserializeBinaryFromReader(message: ClosureMoveRequest, reader: jspb.BinaryReader): ClosureMoveRequest;
}

export namespace ClosureMoveRequest {
  export type AsObject = {
    frontdriverdoor: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
    frontpassengerdoor: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
    reardriverdoor: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
    rearpassengerdoor: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
    reartrunk: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
    fronttrunk: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
    chargeport: ClosureMoveType_EMap[keyof ClosureMoveType_EMap],
  }
}

export class PermissionChange extends jspb.Message {
  hasKey(): boolean;
  clearKey(): void;
  getKey(): PublicKey | undefined;
  setKey(value?: PublicKey): void;

  getSecondstobeactive(): number;
  setSecondstobeactive(value: number): void;

  getKeyrole(): keys_pb.RoleMap[keyof keys_pb.RoleMap];
  setKeyrole(value: keys_pb.RoleMap[keyof keys_pb.RoleMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PermissionChange.AsObject;
  static toObject(includeInstance: boolean, msg: PermissionChange): PermissionChange.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PermissionChange, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PermissionChange;
  static deserializeBinaryFromReader(message: PermissionChange, reader: jspb.BinaryReader): PermissionChange;
}

export namespace PermissionChange {
  export type AsObject = {
    key?: PublicKey.AsObject,
    secondstobeactive: number,
    keyrole: keys_pb.RoleMap[keyof keys_pb.RoleMap],
  }
}

export class ReplaceKey extends jspb.Message {
  hasPublickeytoreplace(): boolean;
  clearPublickeytoreplace(): void;
  getPublickeytoreplace(): PublicKey | undefined;
  setPublickeytoreplace(value?: PublicKey): void;

  hasSlottoreplace(): boolean;
  clearSlottoreplace(): void;
  getSlottoreplace(): number;
  setSlottoreplace(value: number): void;

  hasKeytoadd(): boolean;
  clearKeytoadd(): void;
  getKeytoadd(): PublicKey | undefined;
  setKeytoadd(value?: PublicKey): void;

  getKeyrole(): keys_pb.RoleMap[keyof keys_pb.RoleMap];
  setKeyrole(value: keys_pb.RoleMap[keyof keys_pb.RoleMap]): void;

  getImpermanent(): boolean;
  setImpermanent(value: boolean): void;

  getKeytoreplaceCase(): ReplaceKey.KeytoreplaceCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReplaceKey.AsObject;
  static toObject(includeInstance: boolean, msg: ReplaceKey): ReplaceKey.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ReplaceKey, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReplaceKey;
  static deserializeBinaryFromReader(message: ReplaceKey, reader: jspb.BinaryReader): ReplaceKey;
}

export namespace ReplaceKey {
  export type AsObject = {
    publickeytoreplace?: PublicKey.AsObject,
    slottoreplace: number,
    keytoadd?: PublicKey.AsObject,
    keyrole: keys_pb.RoleMap[keyof keys_pb.RoleMap],
    impermanent: boolean,
  }

  export enum KeytoreplaceCase {
    KEYTOREPLACE_NOT_SET = 0,
    PUBLICKEYTOREPLACE = 1,
    SLOTTOREPLACE = 2,
  }
}

export class WhitelistOperation extends jspb.Message {
  hasAddpublickeytowhitelist(): boolean;
  clearAddpublickeytowhitelist(): void;
  getAddpublickeytowhitelist(): PublicKey | undefined;
  setAddpublickeytowhitelist(value?: PublicKey): void;

  hasRemovepublickeyfromwhitelist(): boolean;
  clearRemovepublickeyfromwhitelist(): void;
  getRemovepublickeyfromwhitelist(): PublicKey | undefined;
  setRemovepublickeyfromwhitelist(value?: PublicKey): void;

  hasAddpermissionstopublickey(): boolean;
  clearAddpermissionstopublickey(): void;
  getAddpermissionstopublickey(): PermissionChange | undefined;
  setAddpermissionstopublickey(value?: PermissionChange): void;

  hasRemovepermissionsfrompublickey(): boolean;
  clearRemovepermissionsfrompublickey(): void;
  getRemovepermissionsfrompublickey(): PermissionChange | undefined;
  setRemovepermissionsfrompublickey(value?: PermissionChange): void;

  hasAddkeytowhitelistandaddpermissions(): boolean;
  clearAddkeytowhitelistandaddpermissions(): void;
  getAddkeytowhitelistandaddpermissions(): PermissionChange | undefined;
  setAddkeytowhitelistandaddpermissions(value?: PermissionChange): void;

  hasUpdatekeyandpermissions(): boolean;
  clearUpdatekeyandpermissions(): void;
  getUpdatekeyandpermissions(): PermissionChange | undefined;
  setUpdatekeyandpermissions(value?: PermissionChange): void;

  hasAddimpermanentkey(): boolean;
  clearAddimpermanentkey(): void;
  getAddimpermanentkey(): PermissionChange | undefined;
  setAddimpermanentkey(value?: PermissionChange): void;

  hasAddimpermanentkeyandremoveexisting(): boolean;
  clearAddimpermanentkeyandremoveexisting(): void;
  getAddimpermanentkeyandremoveexisting(): PermissionChange | undefined;
  setAddimpermanentkeyandremoveexisting(value?: PermissionChange): void;

  hasRemoveallimpermanentkeys(): boolean;
  clearRemoveallimpermanentkeys(): void;
  getRemoveallimpermanentkeys(): boolean;
  setRemoveallimpermanentkeys(value: boolean): void;

  hasReplacekey(): boolean;
  clearReplacekey(): void;
  getReplacekey(): ReplaceKey | undefined;
  setReplacekey(value?: ReplaceKey): void;

  hasMetadataforkey(): boolean;
  clearMetadataforkey(): void;
  getMetadataforkey(): KeyMetadata | undefined;
  setMetadataforkey(value?: KeyMetadata): void;

  getSubMessageCase(): WhitelistOperation.SubMessageCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WhitelistOperation.AsObject;
  static toObject(includeInstance: boolean, msg: WhitelistOperation): WhitelistOperation.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WhitelistOperation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WhitelistOperation;
  static deserializeBinaryFromReader(message: WhitelistOperation, reader: jspb.BinaryReader): WhitelistOperation;
}

export namespace WhitelistOperation {
  export type AsObject = {
    addpublickeytowhitelist?: PublicKey.AsObject,
    removepublickeyfromwhitelist?: PublicKey.AsObject,
    addpermissionstopublickey?: PermissionChange.AsObject,
    removepermissionsfrompublickey?: PermissionChange.AsObject,
    addkeytowhitelistandaddpermissions?: PermissionChange.AsObject,
    updatekeyandpermissions?: PermissionChange.AsObject,
    addimpermanentkey?: PermissionChange.AsObject,
    addimpermanentkeyandremoveexisting?: PermissionChange.AsObject,
    removeallimpermanentkeys: boolean,
    replacekey?: ReplaceKey.AsObject,
    metadataforkey?: KeyMetadata.AsObject,
  }

  export enum SubMessageCase {
    SUB_MESSAGE_NOT_SET = 0,
    ADDPUBLICKEYTOWHITELIST = 1,
    REMOVEPUBLICKEYFROMWHITELIST = 2,
    ADDPERMISSIONSTOPUBLICKEY = 3,
    REMOVEPERMISSIONSFROMPUBLICKEY = 4,
    ADDKEYTOWHITELISTANDADDPERMISSIONS = 5,
    UPDATEKEYANDPERMISSIONS = 7,
    ADDIMPERMANENTKEY = 8,
    ADDIMPERMANENTKEYANDREMOVEEXISTING = 9,
    REMOVEALLIMPERMANENTKEYS = 16,
    REPLACEKEY = 17,
  }
}

export class WhitelistOperation_status extends jspb.Message {
  getWhitelistoperationinformation(): WhitelistOperation_information_EMap[keyof WhitelistOperation_information_EMap];
  setWhitelistoperationinformation(value: WhitelistOperation_information_EMap[keyof WhitelistOperation_information_EMap]): void;

  hasSignerofoperation(): boolean;
  clearSignerofoperation(): void;
  getSignerofoperation(): KeyIdentifier | undefined;
  setSignerofoperation(value?: KeyIdentifier): void;

  getOperationstatus(): OperationStatus_EMap[keyof OperationStatus_EMap];
  setOperationstatus(value: OperationStatus_EMap[keyof OperationStatus_EMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WhitelistOperation_status.AsObject;
  static toObject(includeInstance: boolean, msg: WhitelistOperation_status): WhitelistOperation_status.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WhitelistOperation_status, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WhitelistOperation_status;
  static deserializeBinaryFromReader(message: WhitelistOperation_status, reader: jspb.BinaryReader): WhitelistOperation_status;
}

export namespace WhitelistOperation_status {
  export type AsObject = {
    whitelistoperationinformation: WhitelistOperation_information_EMap[keyof WhitelistOperation_information_EMap],
    signerofoperation?: KeyIdentifier.AsObject,
    operationstatus: OperationStatus_EMap[keyof OperationStatus_EMap],
  }
}

export class SignedMessage_status extends jspb.Message {
  getCounter(): number;
  setCounter(value: number): void;

  getSignedmessageinformation(): SignedMessage_information_EMap[keyof SignedMessage_information_EMap];
  setSignedmessageinformation(value: SignedMessage_information_EMap[keyof SignedMessage_information_EMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SignedMessage_status.AsObject;
  static toObject(includeInstance: boolean, msg: SignedMessage_status): SignedMessage_status.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SignedMessage_status, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SignedMessage_status;
  static deserializeBinaryFromReader(message: SignedMessage_status, reader: jspb.BinaryReader): SignedMessage_status;
}

export namespace SignedMessage_status {
  export type AsObject = {
    counter: number,
    signedmessageinformation: SignedMessage_information_EMap[keyof SignedMessage_information_EMap],
  }
}

export class CommandStatus extends jspb.Message {
  getOperationstatus(): OperationStatus_EMap[keyof OperationStatus_EMap];
  setOperationstatus(value: OperationStatus_EMap[keyof OperationStatus_EMap]): void;

  hasSignedmessagestatus(): boolean;
  clearSignedmessagestatus(): void;
  getSignedmessagestatus(): SignedMessage_status | undefined;
  setSignedmessagestatus(value?: SignedMessage_status): void;

  hasWhitelistoperationstatus(): boolean;
  clearWhitelistoperationstatus(): void;
  getWhitelistoperationstatus(): WhitelistOperation_status | undefined;
  setWhitelistoperationstatus(value?: WhitelistOperation_status): void;

  getSubMessageCase(): CommandStatus.SubMessageCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CommandStatus.AsObject;
  static toObject(includeInstance: boolean, msg: CommandStatus): CommandStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CommandStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CommandStatus;
  static deserializeBinaryFromReader(message: CommandStatus, reader: jspb.BinaryReader): CommandStatus;
}

export namespace CommandStatus {
  export type AsObject = {
    operationstatus: OperationStatus_EMap[keyof OperationStatus_EMap],
    signedmessagestatus?: SignedMessage_status.AsObject,
    whitelistoperationstatus?: WhitelistOperation_status.AsObject,
  }

  export enum SubMessageCase {
    SUB_MESSAGE_NOT_SET = 0,
    SIGNEDMESSAGESTATUS = 2,
    WHITELISTOPERATIONSTATUS = 3,
  }
}

export class UnsignedMessage extends jspb.Message {
  hasInformationrequest(): boolean;
  clearInformationrequest(): void;
  getInformationrequest(): InformationRequest | undefined;
  setInformationrequest(value?: InformationRequest): void;

  hasRkeaction(): boolean;
  clearRkeaction(): void;
  getRkeaction(): RKEAction_EMap[keyof RKEAction_EMap];
  setRkeaction(value: RKEAction_EMap[keyof RKEAction_EMap]): void;

  hasClosuremoverequest(): boolean;
  clearClosuremoverequest(): void;
  getClosuremoverequest(): ClosureMoveRequest | undefined;
  setClosuremoverequest(value?: ClosureMoveRequest): void;

  hasWhitelistoperation(): boolean;
  clearWhitelistoperation(): void;
  getWhitelistoperation(): WhitelistOperation | undefined;
  setWhitelistoperation(value?: WhitelistOperation): void;

  getSubMessageCase(): UnsignedMessage.SubMessageCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnsignedMessage.AsObject;
  static toObject(includeInstance: boolean, msg: UnsignedMessage): UnsignedMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UnsignedMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnsignedMessage;
  static deserializeBinaryFromReader(message: UnsignedMessage, reader: jspb.BinaryReader): UnsignedMessage;
}

export namespace UnsignedMessage {
  export type AsObject = {
    informationrequest?: InformationRequest.AsObject,
    rkeaction: RKEAction_EMap[keyof RKEAction_EMap],
    closuremoverequest?: ClosureMoveRequest.AsObject,
    whitelistoperation?: WhitelistOperation.AsObject,
  }

  export enum SubMessageCase {
    SUB_MESSAGE_NOT_SET = 0,
    INFORMATIONREQUEST = 1,
    RKEACTION = 2,
    CLOSUREMOVEREQUEST = 4,
    WHITELISTOPERATION = 16,
  }
}

export class FromVCSECMessage extends jspb.Message {
  hasCommandstatus(): boolean;
  clearCommandstatus(): void;
  getCommandstatus(): CommandStatus | undefined;
  setCommandstatus(value?: CommandStatus): void;

  hasWhitelistinfo(): boolean;
  clearWhitelistinfo(): void;
  getWhitelistinfo(): WhitelistInfo | undefined;
  setWhitelistinfo(value?: WhitelistInfo): void;

  hasWhitelistentryinfo(): boolean;
  clearWhitelistentryinfo(): void;
  getWhitelistentryinfo(): WhitelistEntryInfo | undefined;
  setWhitelistentryinfo(value?: WhitelistEntryInfo): void;

  hasNominalerror(): boolean;
  clearNominalerror(): void;
  getNominalerror(): errors_pb.NominalError | undefined;
  setNominalerror(value?: errors_pb.NominalError): void;

  getSubMessageCase(): FromVCSECMessage.SubMessageCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FromVCSECMessage.AsObject;
  static toObject(includeInstance: boolean, msg: FromVCSECMessage): FromVCSECMessage.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FromVCSECMessage, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FromVCSECMessage;
  static deserializeBinaryFromReader(message: FromVCSECMessage, reader: jspb.BinaryReader): FromVCSECMessage;
}

export namespace FromVCSECMessage {
  export type AsObject = {
    commandstatus?: CommandStatus.AsObject,
    whitelistinfo?: WhitelistInfo.AsObject,
    whitelistentryinfo?: WhitelistEntryInfo.AsObject,
    nominalerror?: errors_pb.NominalError.AsObject,
  }

  export enum SubMessageCase {
    SUB_MESSAGE_NOT_SET = 0,
    COMMANDSTATUS = 4,
    WHITELISTINFO = 16,
    WHITELISTENTRYINFO = 17,
    NOMINALERROR = 46,
  }
}

export interface SignatureTypeMap {
  SIGNATURE_TYPE_NONE: 0;
  SIGNATURE_TYPE_PRESENT_KEY: 2;
}

export const SignatureType: SignatureTypeMap;

export interface KeyFormFactorMap {
  KEY_FORM_FACTOR_UNKNOWN: 0;
  KEY_FORM_FACTOR_NFC_CARD: 1;
  KEY_FORM_FACTOR_IOS_DEVICE: 6;
  KEY_FORM_FACTOR_ANDROID_DEVICE: 7;
  KEY_FORM_FACTOR_CLOUD_KEY: 9;
}

export const KeyFormFactor: KeyFormFactorMap;

export interface InformationRequestTypeMap {
  INFORMATION_REQUEST_TYPE_GET_STATUS: 0;
  INFORMATION_REQUEST_TYPE_GET_WHITELIST_INFO: 5;
  INFORMATION_REQUEST_TYPE_GET_WHITELIST_ENTRY_INFO: 6;
}

export const InformationRequestType: InformationRequestTypeMap;

export interface RKEAction_EMap {
  RKE_ACTION_UNLOCK: 0;
  RKE_ACTION_LOCK: 1;
  RKE_ACTION_REMOTE_DRIVE: 20;
  RKE_ACTION_AUTO_SECURE_VEHICLE: 29;
  RKE_ACTION_WAKE_VEHICLE: 30;
}

export const RKEAction_E: RKEAction_EMap;

export interface ClosureMoveType_EMap {
  CLOSURE_MOVE_TYPE_NONE: 0;
  CLOSURE_MOVE_TYPE_MOVE: 1;
  CLOSURE_MOVE_TYPE_STOP: 2;
  CLOSURE_MOVE_TYPE_OPEN: 3;
  CLOSURE_MOVE_TYPE_CLOSE: 4;
}

export const ClosureMoveType_E: ClosureMoveType_EMap;

export interface OperationStatus_EMap {
  OPERATIONSTATUS_OK: 0;
  OPERATIONSTATUS_WAIT: 1;
  OPERATIONSTATUS_ERROR: 2;
}

export const OperationStatus_E: OperationStatus_EMap;

export interface SignedMessage_information_EMap {
  SIGNEDMESSAGE_INFORMATION_NONE: 0;
  SIGNEDMESSAGE_INFORMATION_FAULT_UNKNOWN: 1;
  SIGNEDMESSAGE_INFORMATION_FAULT_NOT_ON_WHITELIST: 2;
  SIGNEDMESSAGE_INFORMATION_FAULT_IV_SMALLER_THAN_EXPECTED: 3;
  SIGNEDMESSAGE_INFORMATION_FAULT_INVALID_TOKEN: 4;
  SIGNEDMESSAGE_INFORMATION_FAULT_TOKEN_AND_COUNTER_INVALID: 5;
  SIGNEDMESSAGE_INFORMATION_FAULT_AES_DECRYPT_AUTH: 6;
  SIGNEDMESSAGE_INFORMATION_FAULT_ECDSA_INPUT: 7;
  SIGNEDMESSAGE_INFORMATION_FAULT_ECDSA_SIGNATURE: 8;
  SIGNEDMESSAGE_INFORMATION_FAULT_LOCAL_ENTITY_START: 9;
  SIGNEDMESSAGE_INFORMATION_FAULT_LOCAL_ENTITY_RESULT: 10;
  SIGNEDMESSAGE_INFORMATION_FAULT_COULD_NOT_RETRIEVE_KEY: 11;
  SIGNEDMESSAGE_INFORMATION_FAULT_COULD_NOT_RETRIEVE_TOKEN: 12;
  SIGNEDMESSAGE_INFORMATION_FAULT_SIGNATURE_TOO_SHORT: 13;
  SIGNEDMESSAGE_INFORMATION_FAULT_TOKEN_IS_INCORRECT_LENGTH: 14;
  SIGNEDMESSAGE_INFORMATION_FAULT_INCORRECT_EPOCH: 15;
  SIGNEDMESSAGE_INFORMATION_FAULT_IV_INCORRECT_LENGTH: 16;
  SIGNEDMESSAGE_INFORMATION_FAULT_TIME_EXPIRED: 17;
  SIGNEDMESSAGE_INFORMATION_FAULT_NOT_PROVISIONED_WITH_IDENTITY: 18;
  SIGNEDMESSAGE_INFORMATION_FAULT_COULD_NOT_HASH_METADATA: 19;
}

export const SignedMessage_information_E: SignedMessage_information_EMap;

export interface WhitelistOperation_information_EMap {
  WHITELISTOPERATION_INFORMATION_NONE: 0;
  WHITELISTOPERATION_INFORMATION_UNDOCUMENTED_ERROR: 1;
  WHITELISTOPERATION_INFORMATION_NO_PERMISSION_TO_REMOVE_ONESELF: 2;
  WHITELISTOPERATION_INFORMATION_KEYFOB_SLOTS_FULL: 3;
  WHITELISTOPERATION_INFORMATION_WHITELIST_FULL: 4;
  WHITELISTOPERATION_INFORMATION_NO_PERMISSION_TO_ADD: 5;
  WHITELISTOPERATION_INFORMATION_INVALID_PUBLIC_KEY: 6;
  WHITELISTOPERATION_INFORMATION_NO_PERMISSION_TO_REMOVE: 7;
  WHITELISTOPERATION_INFORMATION_NO_PERMISSION_TO_CHANGE_PERMISSIONS: 8;
  WHITELISTOPERATION_INFORMATION_ATTEMPTING_TO_ELEVATE_OTHER_ABOVE_ONESELF: 9;
  WHITELISTOPERATION_INFORMATION_ATTEMPTING_TO_DEMOTE_SUPERIOR_TO_ONESELF: 10;
  WHITELISTOPERATION_INFORMATION_ATTEMPTING_TO_REMOVE_OWN_PERMISSIONS: 11;
  WHITELISTOPERATION_INFORMATION_PUBLIC_KEY_NOT_ON_WHITELIST: 12;
  WHITELISTOPERATION_INFORMATION_ATTEMPTING_TO_ADD_KEY_THAT_IS_ALREADY_ON_THE_WHITELIST: 13;
  WHITELISTOPERATION_INFORMATION_NOT_ALLOWED_TO_ADD_UNLESS_ON_READER: 14;
  WHITELISTOPERATION_INFORMATION_FM_MODIFYING_OUTSIDE_OF_F_MODE: 15;
  WHITELISTOPERATION_INFORMATION_FM_ATTEMPTING_TO_ADD_PERMANENT_KEY: 16;
  WHITELISTOPERATION_INFORMATION_FM_ATTEMPTING_TO_REMOVE_PERMANENT_KEY: 17;
  WHITELISTOPERATION_INFORMATION_KEYCHAIN_WHILE_FS_FULL: 18;
  WHITELISTOPERATION_INFORMATION_ATTEMPTING_TO_ADD_KEY_WITHOUT_ROLE: 19;
  WHITELISTOPERATION_INFORMATION_ATTEMPTING_TO_ADD_KEY_WITH_SERVICE_ROLE: 20;
  WHITELISTOPERATION_INFORMATION_NON_SERVICE_KEY_ATTEMPTING_TO_ADD_SERVICE_TECH: 21;
  WHITELISTOPERATION_INFORMATION_SERVICE_KEY_ATTEMPTING_TO_ADD_SERVICE_TECH_OUTSIDE_SERVICE_MODE: 22;
}

export const WhitelistOperation_information_E: WhitelistOperation_information_EMap;

