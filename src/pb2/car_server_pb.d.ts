// package: CarServer
// file: car_server.proto

import * as jspb from "google-protobuf";
import * as vehicle_pb from "./vehicle_pb";
import * as signatures_pb from "./signatures_pb";
import * as common_pb from "./common_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class Action extends jspb.Message {
  hasVehicleaction(): boolean;
  clearVehicleaction(): void;
  getVehicleaction(): VehicleAction | undefined;
  setVehicleaction(value?: VehicleAction): void;

  getActionMsgCase(): Action.ActionMsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Action.AsObject;
  static toObject(includeInstance: boolean, msg: Action): Action.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Action, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Action;
  static deserializeBinaryFromReader(message: Action, reader: jspb.BinaryReader): Action;
}

export namespace Action {
  export type AsObject = {
    vehicleaction?: VehicleAction.AsObject,
  }

  export enum ActionMsgCase {
    ACTION_MSG_NOT_SET = 0,
    VEHICLEACTION = 2,
  }
}

export class VehicleAction extends jspb.Message {
  hasChargingsetlimitaction(): boolean;
  clearChargingsetlimitaction(): void;
  getChargingsetlimitaction(): ChargingSetLimitAction | undefined;
  setChargingsetlimitaction(value?: ChargingSetLimitAction): void;

  hasChargingstartstopaction(): boolean;
  clearChargingstartstopaction(): void;
  getChargingstartstopaction(): ChargingStartStopAction | undefined;
  setChargingstartstopaction(value?: ChargingStartStopAction): void;

  hasDrivingclearspeedlimitpinaction(): boolean;
  clearDrivingclearspeedlimitpinaction(): void;
  getDrivingclearspeedlimitpinaction(): DrivingClearSpeedLimitPinAction | undefined;
  setDrivingclearspeedlimitpinaction(value?: DrivingClearSpeedLimitPinAction): void;

  hasDrivingsetspeedlimitaction(): boolean;
  clearDrivingsetspeedlimitaction(): void;
  getDrivingsetspeedlimitaction(): DrivingSetSpeedLimitAction | undefined;
  setDrivingsetspeedlimitaction(value?: DrivingSetSpeedLimitAction): void;

  hasDrivingspeedlimitaction(): boolean;
  clearDrivingspeedlimitaction(): void;
  getDrivingspeedlimitaction(): DrivingSpeedLimitAction | undefined;
  setDrivingspeedlimitaction(value?: DrivingSpeedLimitAction): void;

  hasHvacautoaction(): boolean;
  clearHvacautoaction(): void;
  getHvacautoaction(): HvacAutoAction | undefined;
  setHvacautoaction(value?: HvacAutoAction): void;

  hasHvacsetpreconditioningmaxaction(): boolean;
  clearHvacsetpreconditioningmaxaction(): void;
  getHvacsetpreconditioningmaxaction(): HvacSetPreconditioningMaxAction | undefined;
  setHvacsetpreconditioningmaxaction(value?: HvacSetPreconditioningMaxAction): void;

  hasHvacsteeringwheelheateraction(): boolean;
  clearHvacsteeringwheelheateraction(): void;
  getHvacsteeringwheelheateraction(): HvacSteeringWheelHeaterAction | undefined;
  setHvacsteeringwheelheateraction(value?: HvacSteeringWheelHeaterAction): void;

  hasHvactemperatureadjustmentaction(): boolean;
  clearHvactemperatureadjustmentaction(): void;
  getHvactemperatureadjustmentaction(): HvacTemperatureAdjustmentAction | undefined;
  setHvactemperatureadjustmentaction(value?: HvacTemperatureAdjustmentAction): void;

  hasMediaplayaction(): boolean;
  clearMediaplayaction(): void;
  getMediaplayaction(): MediaPlayAction | undefined;
  setMediaplayaction(value?: MediaPlayAction): void;

  hasMediaupdatevolume(): boolean;
  clearMediaupdatevolume(): void;
  getMediaupdatevolume(): MediaUpdateVolume | undefined;
  setMediaupdatevolume(value?: MediaUpdateVolume): void;

  hasMedianextfavorite(): boolean;
  clearMedianextfavorite(): void;
  getMedianextfavorite(): MediaNextFavorite | undefined;
  setMedianextfavorite(value?: MediaNextFavorite): void;

  hasMediapreviousfavorite(): boolean;
  clearMediapreviousfavorite(): void;
  getMediapreviousfavorite(): MediaPreviousFavorite | undefined;
  setMediapreviousfavorite(value?: MediaPreviousFavorite): void;

  hasMedianexttrack(): boolean;
  clearMedianexttrack(): void;
  getMedianexttrack(): MediaNextTrack | undefined;
  setMedianexttrack(value?: MediaNextTrack): void;

  hasMediaprevioustrack(): boolean;
  clearMediaprevioustrack(): void;
  getMediaprevioustrack(): MediaPreviousTrack | undefined;
  setMediaprevioustrack(value?: MediaPreviousTrack): void;

  hasGetnearbychargingsites(): boolean;
  clearGetnearbychargingsites(): void;
  getGetnearbychargingsites(): GetNearbyChargingSites | undefined;
  setGetnearbychargingsites(value?: GetNearbyChargingSites): void;

  hasVehiclecontrolcancelsoftwareupdateaction(): boolean;
  clearVehiclecontrolcancelsoftwareupdateaction(): void;
  getVehiclecontrolcancelsoftwareupdateaction(): VehicleControlCancelSoftwareUpdateAction | undefined;
  setVehiclecontrolcancelsoftwareupdateaction(value?: VehicleControlCancelSoftwareUpdateAction): void;

  hasVehiclecontrolflashlightsaction(): boolean;
  clearVehiclecontrolflashlightsaction(): void;
  getVehiclecontrolflashlightsaction(): VehicleControlFlashLightsAction | undefined;
  setVehiclecontrolflashlightsaction(value?: VehicleControlFlashLightsAction): void;

  hasVehiclecontrolhonkhornaction(): boolean;
  clearVehiclecontrolhonkhornaction(): void;
  getVehiclecontrolhonkhornaction(): VehicleControlHonkHornAction | undefined;
  setVehiclecontrolhonkhornaction(value?: VehicleControlHonkHornAction): void;

  hasVehiclecontrolresetvaletpinaction(): boolean;
  clearVehiclecontrolresetvaletpinaction(): void;
  getVehiclecontrolresetvaletpinaction(): VehicleControlResetValetPinAction | undefined;
  setVehiclecontrolresetvaletpinaction(value?: VehicleControlResetValetPinAction): void;

  hasVehiclecontrolschedulesoftwareupdateaction(): boolean;
  clearVehiclecontrolschedulesoftwareupdateaction(): void;
  getVehiclecontrolschedulesoftwareupdateaction(): VehicleControlScheduleSoftwareUpdateAction | undefined;
  setVehiclecontrolschedulesoftwareupdateaction(value?: VehicleControlScheduleSoftwareUpdateAction): void;

  hasVehiclecontrolsetsentrymodeaction(): boolean;
  clearVehiclecontrolsetsentrymodeaction(): void;
  getVehiclecontrolsetsentrymodeaction(): VehicleControlSetSentryModeAction | undefined;
  setVehiclecontrolsetsentrymodeaction(value?: VehicleControlSetSentryModeAction): void;

  hasVehiclecontrolsetvaletmodeaction(): boolean;
  clearVehiclecontrolsetvaletmodeaction(): void;
  getVehiclecontrolsetvaletmodeaction(): VehicleControlSetValetModeAction | undefined;
  setVehiclecontrolsetvaletmodeaction(value?: VehicleControlSetValetModeAction): void;

  hasVehiclecontrolsunroofopencloseaction(): boolean;
  clearVehiclecontrolsunroofopencloseaction(): void;
  getVehiclecontrolsunroofopencloseaction(): VehicleControlSunroofOpenCloseAction | undefined;
  setVehiclecontrolsunroofopencloseaction(value?: VehicleControlSunroofOpenCloseAction): void;

  hasVehiclecontroltriggerhomelinkaction(): boolean;
  clearVehiclecontroltriggerhomelinkaction(): void;
  getVehiclecontroltriggerhomelinkaction(): VehicleControlTriggerHomelinkAction | undefined;
  setVehiclecontroltriggerhomelinkaction(value?: VehicleControlTriggerHomelinkAction): void;

  hasVehiclecontrolwindowaction(): boolean;
  clearVehiclecontrolwindowaction(): void;
  getVehiclecontrolwindowaction(): VehicleControlWindowAction | undefined;
  setVehiclecontrolwindowaction(value?: VehicleControlWindowAction): void;

  hasHvacbioweaponmodeaction(): boolean;
  clearHvacbioweaponmodeaction(): void;
  getHvacbioweaponmodeaction(): HvacBioweaponModeAction | undefined;
  setHvacbioweaponmodeaction(value?: HvacBioweaponModeAction): void;

  hasHvacseatheateractions(): boolean;
  clearHvacseatheateractions(): void;
  getHvacseatheateractions(): HvacSeatHeaterActions | undefined;
  setHvacseatheateractions(value?: HvacSeatHeaterActions): void;

  hasScheduledchargingaction(): boolean;
  clearScheduledchargingaction(): void;
  getScheduledchargingaction(): ScheduledChargingAction | undefined;
  setScheduledchargingaction(value?: ScheduledChargingAction): void;

  hasScheduleddepartureaction(): boolean;
  clearScheduleddepartureaction(): void;
  getScheduleddepartureaction(): ScheduledDepartureAction | undefined;
  setScheduleddepartureaction(value?: ScheduledDepartureAction): void;

  hasSetchargingampsaction(): boolean;
  clearSetchargingampsaction(): void;
  getSetchargingampsaction(): SetChargingAmpsAction | undefined;
  setSetchargingampsaction(value?: SetChargingAmpsAction): void;

  hasHvacclimatekeeperaction(): boolean;
  clearHvacclimatekeeperaction(): void;
  getHvacclimatekeeperaction(): HvacClimateKeeperAction | undefined;
  setHvacclimatekeeperaction(value?: HvacClimateKeeperAction): void;

  hasPing(): boolean;
  clearPing(): void;
  getPing(): Ping | undefined;
  setPing(value?: Ping): void;

  hasAutoseatclimateaction(): boolean;
  clearAutoseatclimateaction(): void;
  getAutoseatclimateaction(): AutoSeatClimateAction | undefined;
  setAutoseatclimateaction(value?: AutoSeatClimateAction): void;

  hasHvacseatcooleractions(): boolean;
  clearHvacseatcooleractions(): void;
  getHvacseatcooleractions(): HvacSeatCoolerActions | undefined;
  setHvacseatcooleractions(value?: HvacSeatCoolerActions): void;

  hasSetcabinoverheatprotectionaction(): boolean;
  clearSetcabinoverheatprotectionaction(): void;
  getSetcabinoverheatprotectionaction(): SetCabinOverheatProtectionAction | undefined;
  setSetcabinoverheatprotectionaction(value?: SetCabinOverheatProtectionAction): void;

  hasSetvehiclenameaction(): boolean;
  clearSetvehiclenameaction(): void;
  getSetvehiclenameaction(): SetVehicleNameAction | undefined;
  setSetvehiclenameaction(value?: SetVehicleNameAction): void;

  hasChargeportdoorclose(): boolean;
  clearChargeportdoorclose(): void;
  getChargeportdoorclose(): ChargePortDoorClose | undefined;
  setChargeportdoorclose(value?: ChargePortDoorClose): void;

  hasChargeportdooropen(): boolean;
  clearChargeportdooropen(): void;
  getChargeportdooropen(): ChargePortDoorOpen | undefined;
  setChargeportdooropen(value?: ChargePortDoorOpen): void;

  hasGuestmodeaction(): boolean;
  clearGuestmodeaction(): void;
  getGuestmodeaction(): vehicle_pb.VehicleState.GuestMode | undefined;
  setGuestmodeaction(value?: vehicle_pb.VehicleState.GuestMode): void;

  hasSetcoptempaction(): boolean;
  clearSetcoptempaction(): void;
  getSetcoptempaction(): SetCopTempAction | undefined;
  setSetcoptempaction(value?: SetCopTempAction): void;

  hasEraseuserdataaction(): boolean;
  clearEraseuserdataaction(): void;
  getEraseuserdataaction(): EraseUserDataAction | undefined;
  setEraseuserdataaction(value?: EraseUserDataAction): void;

  hasVehiclecontrolsetpintodriveaction(): boolean;
  clearVehiclecontrolsetpintodriveaction(): void;
  getVehiclecontrolsetpintodriveaction(): VehicleControlSetPinToDriveAction | undefined;
  setVehiclecontrolsetpintodriveaction(value?: VehicleControlSetPinToDriveAction): void;

  hasVehiclecontrolresetpintodriveaction(): boolean;
  clearVehiclecontrolresetpintodriveaction(): void;
  getVehiclecontrolresetpintodriveaction(): VehicleControlResetPinToDriveAction | undefined;
  setVehiclecontrolresetpintodriveaction(value?: VehicleControlResetPinToDriveAction): void;

  hasAddchargescheduleaction(): boolean;
  clearAddchargescheduleaction(): void;
  getAddchargescheduleaction(): common_pb.ChargeSchedule | undefined;
  setAddchargescheduleaction(value?: common_pb.ChargeSchedule): void;

  hasRemovechargescheduleaction(): boolean;
  clearRemovechargescheduleaction(): void;
  getRemovechargescheduleaction(): RemoveChargeScheduleAction | undefined;
  setRemovechargescheduleaction(value?: RemoveChargeScheduleAction): void;

  hasAddpreconditionscheduleaction(): boolean;
  clearAddpreconditionscheduleaction(): void;
  getAddpreconditionscheduleaction(): common_pb.PreconditionSchedule | undefined;
  setAddpreconditionscheduleaction(value?: common_pb.PreconditionSchedule): void;

  hasRemovepreconditionscheduleaction(): boolean;
  clearRemovepreconditionscheduleaction(): void;
  getRemovepreconditionscheduleaction(): RemovePreconditionScheduleAction | undefined;
  setRemovepreconditionscheduleaction(value?: RemovePreconditionScheduleAction): void;

  hasBatchremovepreconditionschedulesaction(): boolean;
  clearBatchremovepreconditionschedulesaction(): void;
  getBatchremovepreconditionschedulesaction(): BatchRemovePreconditionSchedulesAction | undefined;
  setBatchremovepreconditionschedulesaction(value?: BatchRemovePreconditionSchedulesAction): void;

  hasBatchremovechargeschedulesaction(): boolean;
  clearBatchremovechargeschedulesaction(): void;
  getBatchremovechargeschedulesaction(): BatchRemoveChargeSchedulesAction | undefined;
  setBatchremovechargeschedulesaction(value?: BatchRemoveChargeSchedulesAction): void;

  getVehicleActionMsgCase(): VehicleAction.VehicleActionMsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleAction): VehicleAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleAction;
  static deserializeBinaryFromReader(message: VehicleAction, reader: jspb.BinaryReader): VehicleAction;
}

export namespace VehicleAction {
  export type AsObject = {
    chargingsetlimitaction?: ChargingSetLimitAction.AsObject,
    chargingstartstopaction?: ChargingStartStopAction.AsObject,
    drivingclearspeedlimitpinaction?: DrivingClearSpeedLimitPinAction.AsObject,
    drivingsetspeedlimitaction?: DrivingSetSpeedLimitAction.AsObject,
    drivingspeedlimitaction?: DrivingSpeedLimitAction.AsObject,
    hvacautoaction?: HvacAutoAction.AsObject,
    hvacsetpreconditioningmaxaction?: HvacSetPreconditioningMaxAction.AsObject,
    hvacsteeringwheelheateraction?: HvacSteeringWheelHeaterAction.AsObject,
    hvactemperatureadjustmentaction?: HvacTemperatureAdjustmentAction.AsObject,
    mediaplayaction?: MediaPlayAction.AsObject,
    mediaupdatevolume?: MediaUpdateVolume.AsObject,
    medianextfavorite?: MediaNextFavorite.AsObject,
    mediapreviousfavorite?: MediaPreviousFavorite.AsObject,
    medianexttrack?: MediaNextTrack.AsObject,
    mediaprevioustrack?: MediaPreviousTrack.AsObject,
    getnearbychargingsites?: GetNearbyChargingSites.AsObject,
    vehiclecontrolcancelsoftwareupdateaction?: VehicleControlCancelSoftwareUpdateAction.AsObject,
    vehiclecontrolflashlightsaction?: VehicleControlFlashLightsAction.AsObject,
    vehiclecontrolhonkhornaction?: VehicleControlHonkHornAction.AsObject,
    vehiclecontrolresetvaletpinaction?: VehicleControlResetValetPinAction.AsObject,
    vehiclecontrolschedulesoftwareupdateaction?: VehicleControlScheduleSoftwareUpdateAction.AsObject,
    vehiclecontrolsetsentrymodeaction?: VehicleControlSetSentryModeAction.AsObject,
    vehiclecontrolsetvaletmodeaction?: VehicleControlSetValetModeAction.AsObject,
    vehiclecontrolsunroofopencloseaction?: VehicleControlSunroofOpenCloseAction.AsObject,
    vehiclecontroltriggerhomelinkaction?: VehicleControlTriggerHomelinkAction.AsObject,
    vehiclecontrolwindowaction?: VehicleControlWindowAction.AsObject,
    hvacbioweaponmodeaction?: HvacBioweaponModeAction.AsObject,
    hvacseatheateractions?: HvacSeatHeaterActions.AsObject,
    scheduledchargingaction?: ScheduledChargingAction.AsObject,
    scheduleddepartureaction?: ScheduledDepartureAction.AsObject,
    setchargingampsaction?: SetChargingAmpsAction.AsObject,
    hvacclimatekeeperaction?: HvacClimateKeeperAction.AsObject,
    ping?: Ping.AsObject,
    autoseatclimateaction?: AutoSeatClimateAction.AsObject,
    hvacseatcooleractions?: HvacSeatCoolerActions.AsObject,
    setcabinoverheatprotectionaction?: SetCabinOverheatProtectionAction.AsObject,
    setvehiclenameaction?: SetVehicleNameAction.AsObject,
    chargeportdoorclose?: ChargePortDoorClose.AsObject,
    chargeportdooropen?: ChargePortDoorOpen.AsObject,
    guestmodeaction?: vehicle_pb.VehicleState.GuestMode.AsObject,
    setcoptempaction?: SetCopTempAction.AsObject,
    eraseuserdataaction?: EraseUserDataAction.AsObject,
    vehiclecontrolsetpintodriveaction?: VehicleControlSetPinToDriveAction.AsObject,
    vehiclecontrolresetpintodriveaction?: VehicleControlResetPinToDriveAction.AsObject,
    addchargescheduleaction?: common_pb.ChargeSchedule.AsObject,
    removechargescheduleaction?: RemoveChargeScheduleAction.AsObject,
    addpreconditionscheduleaction?: common_pb.PreconditionSchedule.AsObject,
    removepreconditionscheduleaction?: RemovePreconditionScheduleAction.AsObject,
    batchremovepreconditionschedulesaction?: BatchRemovePreconditionSchedulesAction.AsObject,
    batchremovechargeschedulesaction?: BatchRemoveChargeSchedulesAction.AsObject,
  }

  export enum VehicleActionMsgCase {
    VEHICLE_ACTION_MSG_NOT_SET = 0,
    CHARGINGSETLIMITACTION = 5,
    CHARGINGSTARTSTOPACTION = 6,
    DRIVINGCLEARSPEEDLIMITPINACTION = 7,
    DRIVINGSETSPEEDLIMITACTION = 8,
    DRIVINGSPEEDLIMITACTION = 9,
    HVACAUTOACTION = 10,
    HVACSETPRECONDITIONINGMAXACTION = 12,
    HVACSTEERINGWHEELHEATERACTION = 13,
    HVACTEMPERATUREADJUSTMENTACTION = 14,
    MEDIAPLAYACTION = 15,
    MEDIAUPDATEVOLUME = 16,
    MEDIANEXTFAVORITE = 17,
    MEDIAPREVIOUSFAVORITE = 18,
    MEDIANEXTTRACK = 19,
    MEDIAPREVIOUSTRACK = 20,
    GETNEARBYCHARGINGSITES = 23,
    VEHICLECONTROLCANCELSOFTWAREUPDATEACTION = 25,
    VEHICLECONTROLFLASHLIGHTSACTION = 26,
    VEHICLECONTROLHONKHORNACTION = 27,
    VEHICLECONTROLRESETVALETPINACTION = 28,
    VEHICLECONTROLSCHEDULESOFTWAREUPDATEACTION = 29,
    VEHICLECONTROLSETSENTRYMODEACTION = 30,
    VEHICLECONTROLSETVALETMODEACTION = 31,
    VEHICLECONTROLSUNROOFOPENCLOSEACTION = 32,
    VEHICLECONTROLTRIGGERHOMELINKACTION = 33,
    VEHICLECONTROLWINDOWACTION = 34,
    HVACBIOWEAPONMODEACTION = 35,
    HVACSEATHEATERACTIONS = 36,
    SCHEDULEDCHARGINGACTION = 41,
    SCHEDULEDDEPARTUREACTION = 42,
    SETCHARGINGAMPSACTION = 43,
    HVACCLIMATEKEEPERACTION = 44,
    PING = 46,
    AUTOSEATCLIMATEACTION = 48,
    HVACSEATCOOLERACTIONS = 49,
    SETCABINOVERHEATPROTECTIONACTION = 50,
    SETVEHICLENAMEACTION = 54,
    CHARGEPORTDOORCLOSE = 61,
    CHARGEPORTDOOROPEN = 62,
    GUESTMODEACTION = 65,
    SETCOPTEMPACTION = 66,
    ERASEUSERDATAACTION = 72,
    VEHICLECONTROLSETPINTODRIVEACTION = 77,
    VEHICLECONTROLRESETPINTODRIVEACTION = 78,
    ADDCHARGESCHEDULEACTION = 97,
    REMOVECHARGESCHEDULEACTION = 98,
    ADDPRECONDITIONSCHEDULEACTION = 99,
    REMOVEPRECONDITIONSCHEDULEACTION = 100,
    BATCHREMOVEPRECONDITIONSCHEDULESACTION = 107,
    BATCHREMOVECHARGESCHEDULESACTION = 108,
  }
}

export class EraseUserDataAction extends jspb.Message {
  getReason(): string;
  setReason(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EraseUserDataAction.AsObject;
  static toObject(includeInstance: boolean, msg: EraseUserDataAction): EraseUserDataAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EraseUserDataAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EraseUserDataAction;
  static deserializeBinaryFromReader(message: EraseUserDataAction, reader: jspb.BinaryReader): EraseUserDataAction;
}

export namespace EraseUserDataAction {
  export type AsObject = {
    reason: string,
  }
}

export class Response extends jspb.Message {
  hasActionstatus(): boolean;
  clearActionstatus(): void;
  getActionstatus(): ActionStatus | undefined;
  setActionstatus(value?: ActionStatus): void;

  hasGetsessioninforesponse(): boolean;
  clearGetsessioninforesponse(): void;
  getGetsessioninforesponse(): signatures_pb.SessionInfo | undefined;
  setGetsessioninforesponse(value?: signatures_pb.SessionInfo): void;

  hasGetnearbychargingsites(): boolean;
  clearGetnearbychargingsites(): void;
  getGetnearbychargingsites(): NearbyChargingSites | undefined;
  setGetnearbychargingsites(value?: NearbyChargingSites): void;

  hasPing(): boolean;
  clearPing(): void;
  getPing(): Ping | undefined;
  setPing(value?: Ping): void;

  getResponseMsgCase(): Response.ResponseMsgCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Response.AsObject;
  static toObject(includeInstance: boolean, msg: Response): Response.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Response, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Response;
  static deserializeBinaryFromReader(message: Response, reader: jspb.BinaryReader): Response;
}

export namespace Response {
  export type AsObject = {
    actionstatus?: ActionStatus.AsObject,
    getsessioninforesponse?: signatures_pb.SessionInfo.AsObject,
    getnearbychargingsites?: NearbyChargingSites.AsObject,
    ping?: Ping.AsObject,
  }

  export enum ResponseMsgCase {
    RESPONSE_MSG_NOT_SET = 0,
    GETSESSIONINFORESPONSE = 3,
    GETNEARBYCHARGINGSITES = 5,
    PING = 9,
  }
}

export class ActionStatus extends jspb.Message {
  getResult(): OperationStatus_EMap[keyof OperationStatus_EMap];
  setResult(value: OperationStatus_EMap[keyof OperationStatus_EMap]): void;

  hasResultReason(): boolean;
  clearResultReason(): void;
  getResultReason(): ResultReason | undefined;
  setResultReason(value?: ResultReason): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ActionStatus.AsObject;
  static toObject(includeInstance: boolean, msg: ActionStatus): ActionStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ActionStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ActionStatus;
  static deserializeBinaryFromReader(message: ActionStatus, reader: jspb.BinaryReader): ActionStatus;
}

export namespace ActionStatus {
  export type AsObject = {
    result: OperationStatus_EMap[keyof OperationStatus_EMap],
    resultReason?: ResultReason.AsObject,
  }
}

export class ResultReason extends jspb.Message {
  hasPlainText(): boolean;
  clearPlainText(): void;
  getPlainText(): string;
  setPlainText(value: string): void;

  getReasonCase(): ResultReason.ReasonCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ResultReason.AsObject;
  static toObject(includeInstance: boolean, msg: ResultReason): ResultReason.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ResultReason, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ResultReason;
  static deserializeBinaryFromReader(message: ResultReason, reader: jspb.BinaryReader): ResultReason;
}

export namespace ResultReason {
  export type AsObject = {
    plainText: string,
  }

  export enum ReasonCase {
    REASON_NOT_SET = 0,
    PLAIN_TEXT = 1,
  }
}

export class EncryptedData extends jspb.Message {
  getFieldNumber(): number;
  setFieldNumber(value: number): void;

  getCiphertext(): Uint8Array | string;
  getCiphertext_asU8(): Uint8Array;
  getCiphertext_asB64(): string;
  setCiphertext(value: Uint8Array | string): void;

  getTag(): Uint8Array | string;
  getTag_asU8(): Uint8Array;
  getTag_asB64(): string;
  setTag(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EncryptedData.AsObject;
  static toObject(includeInstance: boolean, msg: EncryptedData): EncryptedData.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EncryptedData, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EncryptedData;
  static deserializeBinaryFromReader(message: EncryptedData, reader: jspb.BinaryReader): EncryptedData;
}

export namespace EncryptedData {
  export type AsObject = {
    fieldNumber: number,
    ciphertext: Uint8Array | string,
    tag: Uint8Array | string,
  }
}

export class ChargingSetLimitAction extends jspb.Message {
  getPercent(): number;
  setPercent(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChargingSetLimitAction.AsObject;
  static toObject(includeInstance: boolean, msg: ChargingSetLimitAction): ChargingSetLimitAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChargingSetLimitAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChargingSetLimitAction;
  static deserializeBinaryFromReader(message: ChargingSetLimitAction, reader: jspb.BinaryReader): ChargingSetLimitAction;
}

export namespace ChargingSetLimitAction {
  export type AsObject = {
    percent: number,
  }
}

export class ChargingStartStopAction extends jspb.Message {
  hasUnknown(): boolean;
  clearUnknown(): void;
  getUnknown(): common_pb.Void | undefined;
  setUnknown(value?: common_pb.Void): void;

  hasStart(): boolean;
  clearStart(): void;
  getStart(): common_pb.Void | undefined;
  setStart(value?: common_pb.Void): void;

  hasStartStandard(): boolean;
  clearStartStandard(): void;
  getStartStandard(): common_pb.Void | undefined;
  setStartStandard(value?: common_pb.Void): void;

  hasStartMaxRange(): boolean;
  clearStartMaxRange(): void;
  getStartMaxRange(): common_pb.Void | undefined;
  setStartMaxRange(value?: common_pb.Void): void;

  hasStop(): boolean;
  clearStop(): void;
  getStop(): common_pb.Void | undefined;
  setStop(value?: common_pb.Void): void;

  getChargingActionCase(): ChargingStartStopAction.ChargingActionCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChargingStartStopAction.AsObject;
  static toObject(includeInstance: boolean, msg: ChargingStartStopAction): ChargingStartStopAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChargingStartStopAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChargingStartStopAction;
  static deserializeBinaryFromReader(message: ChargingStartStopAction, reader: jspb.BinaryReader): ChargingStartStopAction;
}

export namespace ChargingStartStopAction {
  export type AsObject = {
    unknown?: common_pb.Void.AsObject,
    start?: common_pb.Void.AsObject,
    startStandard?: common_pb.Void.AsObject,
    startMaxRange?: common_pb.Void.AsObject,
    stop?: common_pb.Void.AsObject,
  }

  export enum ChargingActionCase {
    CHARGING_ACTION_NOT_SET = 0,
    UNKNOWN = 1,
    START = 2,
    START_STANDARD = 3,
    START_MAX_RANGE = 4,
    STOP = 5,
  }
}

export class DrivingClearSpeedLimitPinAction extends jspb.Message {
  getPin(): string;
  setPin(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DrivingClearSpeedLimitPinAction.AsObject;
  static toObject(includeInstance: boolean, msg: DrivingClearSpeedLimitPinAction): DrivingClearSpeedLimitPinAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DrivingClearSpeedLimitPinAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DrivingClearSpeedLimitPinAction;
  static deserializeBinaryFromReader(message: DrivingClearSpeedLimitPinAction, reader: jspb.BinaryReader): DrivingClearSpeedLimitPinAction;
}

export namespace DrivingClearSpeedLimitPinAction {
  export type AsObject = {
    pin: string,
  }
}

export class DrivingSetSpeedLimitAction extends jspb.Message {
  getLimitMph(): number;
  setLimitMph(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DrivingSetSpeedLimitAction.AsObject;
  static toObject(includeInstance: boolean, msg: DrivingSetSpeedLimitAction): DrivingSetSpeedLimitAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DrivingSetSpeedLimitAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DrivingSetSpeedLimitAction;
  static deserializeBinaryFromReader(message: DrivingSetSpeedLimitAction, reader: jspb.BinaryReader): DrivingSetSpeedLimitAction;
}

export namespace DrivingSetSpeedLimitAction {
  export type AsObject = {
    limitMph: number,
  }
}

export class DrivingSpeedLimitAction extends jspb.Message {
  getActivate(): boolean;
  setActivate(value: boolean): void;

  getPin(): string;
  setPin(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DrivingSpeedLimitAction.AsObject;
  static toObject(includeInstance: boolean, msg: DrivingSpeedLimitAction): DrivingSpeedLimitAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DrivingSpeedLimitAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DrivingSpeedLimitAction;
  static deserializeBinaryFromReader(message: DrivingSpeedLimitAction, reader: jspb.BinaryReader): DrivingSpeedLimitAction;
}

export namespace DrivingSpeedLimitAction {
  export type AsObject = {
    activate: boolean,
    pin: string,
  }
}

export class HvacAutoAction extends jspb.Message {
  getPowerOn(): boolean;
  setPowerOn(value: boolean): void;

  getManualOverride(): boolean;
  setManualOverride(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacAutoAction.AsObject;
  static toObject(includeInstance: boolean, msg: HvacAutoAction): HvacAutoAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacAutoAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacAutoAction;
  static deserializeBinaryFromReader(message: HvacAutoAction, reader: jspb.BinaryReader): HvacAutoAction;
}

export namespace HvacAutoAction {
  export type AsObject = {
    powerOn: boolean,
    manualOverride: boolean,
  }
}

export class HvacSeatHeaterActions extends jspb.Message {
  clearHvacseatheateractionList(): void;
  getHvacseatheateractionList(): Array<HvacSeatHeaterActions.HvacSeatHeaterAction>;
  setHvacseatheateractionList(value: Array<HvacSeatHeaterActions.HvacSeatHeaterAction>): void;
  addHvacseatheateraction(value?: HvacSeatHeaterActions.HvacSeatHeaterAction, index?: number): HvacSeatHeaterActions.HvacSeatHeaterAction;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacSeatHeaterActions.AsObject;
  static toObject(includeInstance: boolean, msg: HvacSeatHeaterActions): HvacSeatHeaterActions.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacSeatHeaterActions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacSeatHeaterActions;
  static deserializeBinaryFromReader(message: HvacSeatHeaterActions, reader: jspb.BinaryReader): HvacSeatHeaterActions;
}

export namespace HvacSeatHeaterActions {
  export type AsObject = {
    hvacseatheateractionList: Array<HvacSeatHeaterActions.HvacSeatHeaterAction.AsObject>,
  }

  export class HvacSeatHeaterAction extends jspb.Message {
    hasSeatHeaterUnknown(): boolean;
    clearSeatHeaterUnknown(): void;
    getSeatHeaterUnknown(): common_pb.Void | undefined;
    setSeatHeaterUnknown(value?: common_pb.Void): void;

    hasSeatHeaterOff(): boolean;
    clearSeatHeaterOff(): void;
    getSeatHeaterOff(): common_pb.Void | undefined;
    setSeatHeaterOff(value?: common_pb.Void): void;

    hasSeatHeaterLow(): boolean;
    clearSeatHeaterLow(): void;
    getSeatHeaterLow(): common_pb.Void | undefined;
    setSeatHeaterLow(value?: common_pb.Void): void;

    hasSeatHeaterMed(): boolean;
    clearSeatHeaterMed(): void;
    getSeatHeaterMed(): common_pb.Void | undefined;
    setSeatHeaterMed(value?: common_pb.Void): void;

    hasSeatHeaterHigh(): boolean;
    clearSeatHeaterHigh(): void;
    getSeatHeaterHigh(): common_pb.Void | undefined;
    setSeatHeaterHigh(value?: common_pb.Void): void;

    hasCarSeatUnknown(): boolean;
    clearCarSeatUnknown(): void;
    getCarSeatUnknown(): common_pb.Void | undefined;
    setCarSeatUnknown(value?: common_pb.Void): void;

    hasCarSeatFrontLeft(): boolean;
    clearCarSeatFrontLeft(): void;
    getCarSeatFrontLeft(): common_pb.Void | undefined;
    setCarSeatFrontLeft(value?: common_pb.Void): void;

    hasCarSeatFrontRight(): boolean;
    clearCarSeatFrontRight(): void;
    getCarSeatFrontRight(): common_pb.Void | undefined;
    setCarSeatFrontRight(value?: common_pb.Void): void;

    hasCarSeatRearLeft(): boolean;
    clearCarSeatRearLeft(): void;
    getCarSeatRearLeft(): common_pb.Void | undefined;
    setCarSeatRearLeft(value?: common_pb.Void): void;

    hasCarSeatRearLeftBack(): boolean;
    clearCarSeatRearLeftBack(): void;
    getCarSeatRearLeftBack(): common_pb.Void | undefined;
    setCarSeatRearLeftBack(value?: common_pb.Void): void;

    hasCarSeatRearCenter(): boolean;
    clearCarSeatRearCenter(): void;
    getCarSeatRearCenter(): common_pb.Void | undefined;
    setCarSeatRearCenter(value?: common_pb.Void): void;

    hasCarSeatRearRight(): boolean;
    clearCarSeatRearRight(): void;
    getCarSeatRearRight(): common_pb.Void | undefined;
    setCarSeatRearRight(value?: common_pb.Void): void;

    hasCarSeatRearRightBack(): boolean;
    clearCarSeatRearRightBack(): void;
    getCarSeatRearRightBack(): common_pb.Void | undefined;
    setCarSeatRearRightBack(value?: common_pb.Void): void;

    hasCarSeatThirdRowLeft(): boolean;
    clearCarSeatThirdRowLeft(): void;
    getCarSeatThirdRowLeft(): common_pb.Void | undefined;
    setCarSeatThirdRowLeft(value?: common_pb.Void): void;

    hasCarSeatThirdRowRight(): boolean;
    clearCarSeatThirdRowRight(): void;
    getCarSeatThirdRowRight(): common_pb.Void | undefined;
    setCarSeatThirdRowRight(value?: common_pb.Void): void;

    getSeatHeaterLevelCase(): HvacSeatHeaterAction.SeatHeaterLevelCase;
    getSeatPositionCase(): HvacSeatHeaterAction.SeatPositionCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HvacSeatHeaterAction.AsObject;
    static toObject(includeInstance: boolean, msg: HvacSeatHeaterAction): HvacSeatHeaterAction.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HvacSeatHeaterAction, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HvacSeatHeaterAction;
    static deserializeBinaryFromReader(message: HvacSeatHeaterAction, reader: jspb.BinaryReader): HvacSeatHeaterAction;
  }

  export namespace HvacSeatHeaterAction {
    export type AsObject = {
      seatHeaterUnknown?: common_pb.Void.AsObject,
      seatHeaterOff?: common_pb.Void.AsObject,
      seatHeaterLow?: common_pb.Void.AsObject,
      seatHeaterMed?: common_pb.Void.AsObject,
      seatHeaterHigh?: common_pb.Void.AsObject,
      carSeatUnknown?: common_pb.Void.AsObject,
      carSeatFrontLeft?: common_pb.Void.AsObject,
      carSeatFrontRight?: common_pb.Void.AsObject,
      carSeatRearLeft?: common_pb.Void.AsObject,
      carSeatRearLeftBack?: common_pb.Void.AsObject,
      carSeatRearCenter?: common_pb.Void.AsObject,
      carSeatRearRight?: common_pb.Void.AsObject,
      carSeatRearRightBack?: common_pb.Void.AsObject,
      carSeatThirdRowLeft?: common_pb.Void.AsObject,
      carSeatThirdRowRight?: common_pb.Void.AsObject,
    }

    export enum SeatHeaterLevelCase {
      SEAT_HEATER_LEVEL_NOT_SET = 0,
      SEAT_HEATER_UNKNOWN = 1,
      SEAT_HEATER_OFF = 2,
      SEAT_HEATER_LOW = 3,
      SEAT_HEATER_MED = 4,
      SEAT_HEATER_HIGH = 5,
    }

    export enum SeatPositionCase {
      SEAT_POSITION_NOT_SET = 0,
      CAR_SEAT_UNKNOWN = 6,
      CAR_SEAT_FRONT_LEFT = 7,
      CAR_SEAT_FRONT_RIGHT = 8,
      CAR_SEAT_REAR_LEFT = 9,
      CAR_SEAT_REAR_LEFT_BACK = 10,
      CAR_SEAT_REAR_CENTER = 11,
      CAR_SEAT_REAR_RIGHT = 12,
      CAR_SEAT_REAR_RIGHT_BACK = 13,
      CAR_SEAT_THIRD_ROW_LEFT = 14,
      CAR_SEAT_THIRD_ROW_RIGHT = 15,
    }
  }
}

export class HvacSeatCoolerActions extends jspb.Message {
  clearHvacseatcooleractionList(): void;
  getHvacseatcooleractionList(): Array<HvacSeatCoolerActions.HvacSeatCoolerAction>;
  setHvacseatcooleractionList(value: Array<HvacSeatCoolerActions.HvacSeatCoolerAction>): void;
  addHvacseatcooleraction(value?: HvacSeatCoolerActions.HvacSeatCoolerAction, index?: number): HvacSeatCoolerActions.HvacSeatCoolerAction;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacSeatCoolerActions.AsObject;
  static toObject(includeInstance: boolean, msg: HvacSeatCoolerActions): HvacSeatCoolerActions.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacSeatCoolerActions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacSeatCoolerActions;
  static deserializeBinaryFromReader(message: HvacSeatCoolerActions, reader: jspb.BinaryReader): HvacSeatCoolerActions;
}

export namespace HvacSeatCoolerActions {
  export type AsObject = {
    hvacseatcooleractionList: Array<HvacSeatCoolerActions.HvacSeatCoolerAction.AsObject>,
  }

  export class HvacSeatCoolerAction extends jspb.Message {
    getSeatCoolerLevel(): HvacSeatCoolerActions.HvacSeatCoolerLevel_EMap[keyof HvacSeatCoolerActions.HvacSeatCoolerLevel_EMap];
    setSeatCoolerLevel(value: HvacSeatCoolerActions.HvacSeatCoolerLevel_EMap[keyof HvacSeatCoolerActions.HvacSeatCoolerLevel_EMap]): void;

    getSeatPosition(): HvacSeatCoolerActions.HvacSeatCoolerPosition_EMap[keyof HvacSeatCoolerActions.HvacSeatCoolerPosition_EMap];
    setSeatPosition(value: HvacSeatCoolerActions.HvacSeatCoolerPosition_EMap[keyof HvacSeatCoolerActions.HvacSeatCoolerPosition_EMap]): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HvacSeatCoolerAction.AsObject;
    static toObject(includeInstance: boolean, msg: HvacSeatCoolerAction): HvacSeatCoolerAction.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HvacSeatCoolerAction, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HvacSeatCoolerAction;
    static deserializeBinaryFromReader(message: HvacSeatCoolerAction, reader: jspb.BinaryReader): HvacSeatCoolerAction;
  }

  export namespace HvacSeatCoolerAction {
    export type AsObject = {
      seatCoolerLevel: HvacSeatCoolerActions.HvacSeatCoolerLevel_EMap[keyof HvacSeatCoolerActions.HvacSeatCoolerLevel_EMap],
      seatPosition: HvacSeatCoolerActions.HvacSeatCoolerPosition_EMap[keyof HvacSeatCoolerActions.HvacSeatCoolerPosition_EMap],
    }
  }

  export interface HvacSeatCoolerLevel_EMap {
    HVACSEATCOOLERLEVEL_UNKNOWN: 0;
    HVACSEATCOOLERLEVEL_OFF: 1;
    HVACSEATCOOLERLEVEL_LOW: 2;
    HVACSEATCOOLERLEVEL_MED: 3;
    HVACSEATCOOLERLEVEL_HIGH: 4;
  }

  export const HvacSeatCoolerLevel_E: HvacSeatCoolerLevel_EMap;

  export interface HvacSeatCoolerPosition_EMap {
    HVACSEATCOOLERPOSITION_UNKNOWN: 0;
    HVACSEATCOOLERPOSITION_FRONTLEFT: 1;
    HVACSEATCOOLERPOSITION_FRONTRIGHT: 2;
  }

  export const HvacSeatCoolerPosition_E: HvacSeatCoolerPosition_EMap;
}

export class HvacSetPreconditioningMaxAction extends jspb.Message {
  getOn(): boolean;
  setOn(value: boolean): void;

  getManualOverride(): boolean;
  setManualOverride(value: boolean): void;

  clearManualOverrideModeList(): void;
  getManualOverrideModeList(): Array<HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap[keyof HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap]>;
  setManualOverrideModeList(value: Array<HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap[keyof HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap]>): void;
  addManualOverrideMode(value: HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap[keyof HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap], index?: number): HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap[keyof HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap];

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacSetPreconditioningMaxAction.AsObject;
  static toObject(includeInstance: boolean, msg: HvacSetPreconditioningMaxAction): HvacSetPreconditioningMaxAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacSetPreconditioningMaxAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacSetPreconditioningMaxAction;
  static deserializeBinaryFromReader(message: HvacSetPreconditioningMaxAction, reader: jspb.BinaryReader): HvacSetPreconditioningMaxAction;
}

export namespace HvacSetPreconditioningMaxAction {
  export type AsObject = {
    on: boolean,
    manualOverride: boolean,
    manualOverrideModeList: Array<HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap[keyof HvacSetPreconditioningMaxAction.ManualOverrideMode_EMap]>,
  }

  export interface ManualOverrideMode_EMap {
    DOGMODE: 0;
    SOC: 1;
    DOORS: 2;
  }

  export const ManualOverrideMode_E: ManualOverrideMode_EMap;
}

export class HvacSteeringWheelHeaterAction extends jspb.Message {
  getPowerOn(): boolean;
  setPowerOn(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacSteeringWheelHeaterAction.AsObject;
  static toObject(includeInstance: boolean, msg: HvacSteeringWheelHeaterAction): HvacSteeringWheelHeaterAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacSteeringWheelHeaterAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacSteeringWheelHeaterAction;
  static deserializeBinaryFromReader(message: HvacSteeringWheelHeaterAction, reader: jspb.BinaryReader): HvacSteeringWheelHeaterAction;
}

export namespace HvacSteeringWheelHeaterAction {
  export type AsObject = {
    powerOn: boolean,
  }
}

export class HvacTemperatureAdjustmentAction extends jspb.Message {
  getDeltaCelsius(): number;
  setDeltaCelsius(value: number): void;

  getDeltaPercent(): number;
  setDeltaPercent(value: number): void;

  getAbsoluteCelsius(): number;
  setAbsoluteCelsius(value: number): void;

  hasLevel(): boolean;
  clearLevel(): void;
  getLevel(): HvacTemperatureAdjustmentAction.Temperature | undefined;
  setLevel(value?: HvacTemperatureAdjustmentAction.Temperature): void;

  clearHvacTemperatureZoneList(): void;
  getHvacTemperatureZoneList(): Array<HvacTemperatureAdjustmentAction.HvacTemperatureZone>;
  setHvacTemperatureZoneList(value: Array<HvacTemperatureAdjustmentAction.HvacTemperatureZone>): void;
  addHvacTemperatureZone(value?: HvacTemperatureAdjustmentAction.HvacTemperatureZone, index?: number): HvacTemperatureAdjustmentAction.HvacTemperatureZone;

  getDriverTempCelsius(): number;
  setDriverTempCelsius(value: number): void;

  getPassengerTempCelsius(): number;
  setPassengerTempCelsius(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacTemperatureAdjustmentAction.AsObject;
  static toObject(includeInstance: boolean, msg: HvacTemperatureAdjustmentAction): HvacTemperatureAdjustmentAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacTemperatureAdjustmentAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacTemperatureAdjustmentAction;
  static deserializeBinaryFromReader(message: HvacTemperatureAdjustmentAction, reader: jspb.BinaryReader): HvacTemperatureAdjustmentAction;
}

export namespace HvacTemperatureAdjustmentAction {
  export type AsObject = {
    deltaCelsius: number,
    deltaPercent: number,
    absoluteCelsius: number,
    level?: HvacTemperatureAdjustmentAction.Temperature.AsObject,
    hvacTemperatureZoneList: Array<HvacTemperatureAdjustmentAction.HvacTemperatureZone.AsObject>,
    driverTempCelsius: number,
    passengerTempCelsius: number,
  }

  export class Temperature extends jspb.Message {
    hasTempUnknown(): boolean;
    clearTempUnknown(): void;
    getTempUnknown(): common_pb.Void | undefined;
    setTempUnknown(value?: common_pb.Void): void;

    hasTempMin(): boolean;
    clearTempMin(): void;
    getTempMin(): common_pb.Void | undefined;
    setTempMin(value?: common_pb.Void): void;

    hasTempMax(): boolean;
    clearTempMax(): void;
    getTempMax(): common_pb.Void | undefined;
    setTempMax(value?: common_pb.Void): void;

    getTypeCase(): Temperature.TypeCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Temperature.AsObject;
    static toObject(includeInstance: boolean, msg: Temperature): Temperature.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Temperature, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Temperature;
    static deserializeBinaryFromReader(message: Temperature, reader: jspb.BinaryReader): Temperature;
  }

  export namespace Temperature {
    export type AsObject = {
      tempUnknown?: common_pb.Void.AsObject,
      tempMin?: common_pb.Void.AsObject,
      tempMax?: common_pb.Void.AsObject,
    }

    export enum TypeCase {
      TYPE_NOT_SET = 0,
      TEMP_UNKNOWN = 1,
      TEMP_MIN = 2,
      TEMP_MAX = 3,
    }
  }

  export class HvacTemperatureZone extends jspb.Message {
    hasTempZoneUnknown(): boolean;
    clearTempZoneUnknown(): void;
    getTempZoneUnknown(): common_pb.Void | undefined;
    setTempZoneUnknown(value?: common_pb.Void): void;

    hasTempZoneFrontLeft(): boolean;
    clearTempZoneFrontLeft(): void;
    getTempZoneFrontLeft(): common_pb.Void | undefined;
    setTempZoneFrontLeft(value?: common_pb.Void): void;

    hasTempZoneFrontRight(): boolean;
    clearTempZoneFrontRight(): void;
    getTempZoneFrontRight(): common_pb.Void | undefined;
    setTempZoneFrontRight(value?: common_pb.Void): void;

    hasTempZoneRear(): boolean;
    clearTempZoneRear(): void;
    getTempZoneRear(): common_pb.Void | undefined;
    setTempZoneRear(value?: common_pb.Void): void;

    getTypeCase(): HvacTemperatureZone.TypeCase;
    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): HvacTemperatureZone.AsObject;
    static toObject(includeInstance: boolean, msg: HvacTemperatureZone): HvacTemperatureZone.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: HvacTemperatureZone, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): HvacTemperatureZone;
    static deserializeBinaryFromReader(message: HvacTemperatureZone, reader: jspb.BinaryReader): HvacTemperatureZone;
  }

  export namespace HvacTemperatureZone {
    export type AsObject = {
      tempZoneUnknown?: common_pb.Void.AsObject,
      tempZoneFrontLeft?: common_pb.Void.AsObject,
      tempZoneFrontRight?: common_pb.Void.AsObject,
      tempZoneRear?: common_pb.Void.AsObject,
    }

    export enum TypeCase {
      TYPE_NOT_SET = 0,
      TEMP_ZONE_UNKNOWN = 1,
      TEMP_ZONE_FRONT_LEFT = 2,
      TEMP_ZONE_FRONT_RIGHT = 3,
      TEMP_ZONE_REAR = 4,
    }
  }
}

export class GetNearbyChargingSites extends jspb.Message {
  getIncludeMetaData(): boolean;
  setIncludeMetaData(value: boolean): void;

  getRadius(): number;
  setRadius(value: number): void;

  getCount(): number;
  setCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetNearbyChargingSites.AsObject;
  static toObject(includeInstance: boolean, msg: GetNearbyChargingSites): GetNearbyChargingSites.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetNearbyChargingSites, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetNearbyChargingSites;
  static deserializeBinaryFromReader(message: GetNearbyChargingSites, reader: jspb.BinaryReader): GetNearbyChargingSites;
}

export namespace GetNearbyChargingSites {
  export type AsObject = {
    includeMetaData: boolean,
    radius: number,
    count: number,
  }
}

export class NearbyChargingSites extends jspb.Message {
  hasTimestamp(): boolean;
  clearTimestamp(): void;
  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): void;

  clearSuperchargersList(): void;
  getSuperchargersList(): Array<Superchargers>;
  setSuperchargersList(value: Array<Superchargers>): void;
  addSuperchargers(value?: Superchargers, index?: number): Superchargers;

  getCongestionSyncTimeUtcSecs(): number;
  setCongestionSyncTimeUtcSecs(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NearbyChargingSites.AsObject;
  static toObject(includeInstance: boolean, msg: NearbyChargingSites): NearbyChargingSites.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NearbyChargingSites, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NearbyChargingSites;
  static deserializeBinaryFromReader(message: NearbyChargingSites, reader: jspb.BinaryReader): NearbyChargingSites;
}

export namespace NearbyChargingSites {
  export type AsObject = {
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    superchargersList: Array<Superchargers.AsObject>,
    congestionSyncTimeUtcSecs: number,
  }
}

export class Superchargers extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getAmenities(): string;
  setAmenities(value: string): void;

  getAvailableStalls(): number;
  setAvailableStalls(value: number): void;

  getBillingInfo(): string;
  setBillingInfo(value: string): void;

  getBillingTime(): string;
  setBillingTime(value: string): void;

  getCity(): string;
  setCity(value: string): void;

  getCountry(): string;
  setCountry(value: string): void;

  getDistanceMiles(): number;
  setDistanceMiles(value: number): void;

  getDistrict(): string;
  setDistrict(value: string): void;

  hasLocation(): boolean;
  clearLocation(): void;
  getLocation(): common_pb.LatLong | undefined;
  setLocation(value?: common_pb.LatLong): void;

  getName(): string;
  setName(value: string): void;

  getPostalCode(): string;
  setPostalCode(value: string): void;

  getSiteClosed(): boolean;
  setSiteClosed(value: boolean): void;

  getState(): string;
  setState(value: string): void;

  getStreetAddress(): string;
  setStreetAddress(value: string): void;

  getTotalStalls(): number;
  setTotalStalls(value: number): void;

  getWithinRange(): boolean;
  setWithinRange(value: boolean): void;

  getMaxPowerKw(): number;
  setMaxPowerKw(value: number): void;

  getOutOfOrderStallsNumber(): number;
  setOutOfOrderStallsNumber(value: number): void;

  getOutOfOrderStallsNames(): string;
  setOutOfOrderStallsNames(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Superchargers.AsObject;
  static toObject(includeInstance: boolean, msg: Superchargers): Superchargers.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Superchargers, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Superchargers;
  static deserializeBinaryFromReader(message: Superchargers, reader: jspb.BinaryReader): Superchargers;
}

export namespace Superchargers {
  export type AsObject = {
    id: number,
    amenities: string,
    availableStalls: number,
    billingInfo: string,
    billingTime: string,
    city: string,
    country: string,
    distanceMiles: number,
    district: string,
    location?: common_pb.LatLong.AsObject,
    name: string,
    postalCode: string,
    siteClosed: boolean,
    state: string,
    streetAddress: string,
    totalStalls: number,
    withinRange: boolean,
    maxPowerKw: number,
    outOfOrderStallsNumber: number,
    outOfOrderStallsNames: string,
  }
}

export class MediaPlayAction extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaPlayAction.AsObject;
  static toObject(includeInstance: boolean, msg: MediaPlayAction): MediaPlayAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaPlayAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaPlayAction;
  static deserializeBinaryFromReader(message: MediaPlayAction, reader: jspb.BinaryReader): MediaPlayAction;
}

export namespace MediaPlayAction {
  export type AsObject = {
  }
}

export class MediaUpdateVolume extends jspb.Message {
  hasVolumeDelta(): boolean;
  clearVolumeDelta(): void;
  getVolumeDelta(): number;
  setVolumeDelta(value: number): void;

  hasVolumeAbsoluteFloat(): boolean;
  clearVolumeAbsoluteFloat(): void;
  getVolumeAbsoluteFloat(): number;
  setVolumeAbsoluteFloat(value: number): void;

  getMediaVolumeCase(): MediaUpdateVolume.MediaVolumeCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaUpdateVolume.AsObject;
  static toObject(includeInstance: boolean, msg: MediaUpdateVolume): MediaUpdateVolume.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaUpdateVolume, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaUpdateVolume;
  static deserializeBinaryFromReader(message: MediaUpdateVolume, reader: jspb.BinaryReader): MediaUpdateVolume;
}

export namespace MediaUpdateVolume {
  export type AsObject = {
    volumeDelta: number,
    volumeAbsoluteFloat: number,
  }

  export enum MediaVolumeCase {
    MEDIA_VOLUME_NOT_SET = 0,
    VOLUME_DELTA = 1,
    VOLUME_ABSOLUTE_FLOAT = 3,
  }
}

export class MediaNextFavorite extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaNextFavorite.AsObject;
  static toObject(includeInstance: boolean, msg: MediaNextFavorite): MediaNextFavorite.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaNextFavorite, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaNextFavorite;
  static deserializeBinaryFromReader(message: MediaNextFavorite, reader: jspb.BinaryReader): MediaNextFavorite;
}

export namespace MediaNextFavorite {
  export type AsObject = {
  }
}

export class MediaPreviousFavorite extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaPreviousFavorite.AsObject;
  static toObject(includeInstance: boolean, msg: MediaPreviousFavorite): MediaPreviousFavorite.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaPreviousFavorite, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaPreviousFavorite;
  static deserializeBinaryFromReader(message: MediaPreviousFavorite, reader: jspb.BinaryReader): MediaPreviousFavorite;
}

export namespace MediaPreviousFavorite {
  export type AsObject = {
  }
}

export class MediaNextTrack extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaNextTrack.AsObject;
  static toObject(includeInstance: boolean, msg: MediaNextTrack): MediaNextTrack.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaNextTrack, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaNextTrack;
  static deserializeBinaryFromReader(message: MediaNextTrack, reader: jspb.BinaryReader): MediaNextTrack;
}

export namespace MediaNextTrack {
  export type AsObject = {
  }
}

export class MediaPreviousTrack extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MediaPreviousTrack.AsObject;
  static toObject(includeInstance: boolean, msg: MediaPreviousTrack): MediaPreviousTrack.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MediaPreviousTrack, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MediaPreviousTrack;
  static deserializeBinaryFromReader(message: MediaPreviousTrack, reader: jspb.BinaryReader): MediaPreviousTrack;
}

export namespace MediaPreviousTrack {
  export type AsObject = {
  }
}

export class VehicleControlCancelSoftwareUpdateAction extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlCancelSoftwareUpdateAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlCancelSoftwareUpdateAction): VehicleControlCancelSoftwareUpdateAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlCancelSoftwareUpdateAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlCancelSoftwareUpdateAction;
  static deserializeBinaryFromReader(message: VehicleControlCancelSoftwareUpdateAction, reader: jspb.BinaryReader): VehicleControlCancelSoftwareUpdateAction;
}

export namespace VehicleControlCancelSoftwareUpdateAction {
  export type AsObject = {
  }
}

export class VehicleControlFlashLightsAction extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlFlashLightsAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlFlashLightsAction): VehicleControlFlashLightsAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlFlashLightsAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlFlashLightsAction;
  static deserializeBinaryFromReader(message: VehicleControlFlashLightsAction, reader: jspb.BinaryReader): VehicleControlFlashLightsAction;
}

export namespace VehicleControlFlashLightsAction {
  export type AsObject = {
  }
}

export class VehicleControlHonkHornAction extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlHonkHornAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlHonkHornAction): VehicleControlHonkHornAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlHonkHornAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlHonkHornAction;
  static deserializeBinaryFromReader(message: VehicleControlHonkHornAction, reader: jspb.BinaryReader): VehicleControlHonkHornAction;
}

export namespace VehicleControlHonkHornAction {
  export type AsObject = {
  }
}

export class VehicleControlResetValetPinAction extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlResetValetPinAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlResetValetPinAction): VehicleControlResetValetPinAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlResetValetPinAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlResetValetPinAction;
  static deserializeBinaryFromReader(message: VehicleControlResetValetPinAction, reader: jspb.BinaryReader): VehicleControlResetValetPinAction;
}

export namespace VehicleControlResetValetPinAction {
  export type AsObject = {
  }
}

export class VehicleControlScheduleSoftwareUpdateAction extends jspb.Message {
  getOffsetSec(): number;
  setOffsetSec(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlScheduleSoftwareUpdateAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlScheduleSoftwareUpdateAction): VehicleControlScheduleSoftwareUpdateAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlScheduleSoftwareUpdateAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlScheduleSoftwareUpdateAction;
  static deserializeBinaryFromReader(message: VehicleControlScheduleSoftwareUpdateAction, reader: jspb.BinaryReader): VehicleControlScheduleSoftwareUpdateAction;
}

export namespace VehicleControlScheduleSoftwareUpdateAction {
  export type AsObject = {
    offsetSec: number,
  }
}

export class VehicleControlSetSentryModeAction extends jspb.Message {
  getOn(): boolean;
  setOn(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlSetSentryModeAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlSetSentryModeAction): VehicleControlSetSentryModeAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlSetSentryModeAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlSetSentryModeAction;
  static deserializeBinaryFromReader(message: VehicleControlSetSentryModeAction, reader: jspb.BinaryReader): VehicleControlSetSentryModeAction;
}

export namespace VehicleControlSetSentryModeAction {
  export type AsObject = {
    on: boolean,
  }
}

export class VehicleControlSetValetModeAction extends jspb.Message {
  getOn(): boolean;
  setOn(value: boolean): void;

  getPassword(): string;
  setPassword(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlSetValetModeAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlSetValetModeAction): VehicleControlSetValetModeAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlSetValetModeAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlSetValetModeAction;
  static deserializeBinaryFromReader(message: VehicleControlSetValetModeAction, reader: jspb.BinaryReader): VehicleControlSetValetModeAction;
}

export namespace VehicleControlSetValetModeAction {
  export type AsObject = {
    on: boolean,
    password: string,
  }
}

export class VehicleControlSunroofOpenCloseAction extends jspb.Message {
  hasAbsoluteLevel(): boolean;
  clearAbsoluteLevel(): void;
  getAbsoluteLevel(): number;
  setAbsoluteLevel(value: number): void;

  hasDeltaLevel(): boolean;
  clearDeltaLevel(): void;
  getDeltaLevel(): number;
  setDeltaLevel(value: number): void;

  hasVent(): boolean;
  clearVent(): void;
  getVent(): common_pb.Void | undefined;
  setVent(value?: common_pb.Void): void;

  hasClose(): boolean;
  clearClose(): void;
  getClose(): common_pb.Void | undefined;
  setClose(value?: common_pb.Void): void;

  hasOpen(): boolean;
  clearOpen(): void;
  getOpen(): common_pb.Void | undefined;
  setOpen(value?: common_pb.Void): void;

  getSunroofLevelCase(): VehicleControlSunroofOpenCloseAction.SunroofLevelCase;
  getActionCase(): VehicleControlSunroofOpenCloseAction.ActionCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlSunroofOpenCloseAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlSunroofOpenCloseAction): VehicleControlSunroofOpenCloseAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlSunroofOpenCloseAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlSunroofOpenCloseAction;
  static deserializeBinaryFromReader(message: VehicleControlSunroofOpenCloseAction, reader: jspb.BinaryReader): VehicleControlSunroofOpenCloseAction;
}

export namespace VehicleControlSunroofOpenCloseAction {
  export type AsObject = {
    absoluteLevel: number,
    deltaLevel: number,
    vent?: common_pb.Void.AsObject,
    close?: common_pb.Void.AsObject,
    open?: common_pb.Void.AsObject,
  }

  export enum SunroofLevelCase {
    SUNROOF_LEVEL_NOT_SET = 0,
    ABSOLUTE_LEVEL = 1,
    DELTA_LEVEL = 2,
  }

  export enum ActionCase {
    ACTION_NOT_SET = 0,
    VENT = 3,
    CLOSE = 4,
    OPEN = 5,
  }
}

export class VehicleControlTriggerHomelinkAction extends jspb.Message {
  hasLocation(): boolean;
  clearLocation(): void;
  getLocation(): common_pb.LatLong | undefined;
  setLocation(value?: common_pb.LatLong): void;

  getToken(): string;
  setToken(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlTriggerHomelinkAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlTriggerHomelinkAction): VehicleControlTriggerHomelinkAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlTriggerHomelinkAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlTriggerHomelinkAction;
  static deserializeBinaryFromReader(message: VehicleControlTriggerHomelinkAction, reader: jspb.BinaryReader): VehicleControlTriggerHomelinkAction;
}

export namespace VehicleControlTriggerHomelinkAction {
  export type AsObject = {
    location?: common_pb.LatLong.AsObject,
    token: string,
  }
}

export class VehicleControlWindowAction extends jspb.Message {
  hasUnknown(): boolean;
  clearUnknown(): void;
  getUnknown(): common_pb.Void | undefined;
  setUnknown(value?: common_pb.Void): void;

  hasVent(): boolean;
  clearVent(): void;
  getVent(): common_pb.Void | undefined;
  setVent(value?: common_pb.Void): void;

  hasClose(): boolean;
  clearClose(): void;
  getClose(): common_pb.Void | undefined;
  setClose(value?: common_pb.Void): void;

  getActionCase(): VehicleControlWindowAction.ActionCase;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlWindowAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlWindowAction): VehicleControlWindowAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlWindowAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlWindowAction;
  static deserializeBinaryFromReader(message: VehicleControlWindowAction, reader: jspb.BinaryReader): VehicleControlWindowAction;
}

export namespace VehicleControlWindowAction {
  export type AsObject = {
    unknown?: common_pb.Void.AsObject,
    vent?: common_pb.Void.AsObject,
    close?: common_pb.Void.AsObject,
  }

  export enum ActionCase {
    ACTION_NOT_SET = 0,
    UNKNOWN = 2,
    VENT = 3,
    CLOSE = 4,
  }
}

export class HvacBioweaponModeAction extends jspb.Message {
  getOn(): boolean;
  setOn(value: boolean): void;

  getManualOverride(): boolean;
  setManualOverride(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacBioweaponModeAction.AsObject;
  static toObject(includeInstance: boolean, msg: HvacBioweaponModeAction): HvacBioweaponModeAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacBioweaponModeAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacBioweaponModeAction;
  static deserializeBinaryFromReader(message: HvacBioweaponModeAction, reader: jspb.BinaryReader): HvacBioweaponModeAction;
}

export namespace HvacBioweaponModeAction {
  export type AsObject = {
    on: boolean,
    manualOverride: boolean,
  }
}

export class AutoSeatClimateAction extends jspb.Message {
  clearCarseatList(): void;
  getCarseatList(): Array<AutoSeatClimateAction.CarSeat>;
  setCarseatList(value: Array<AutoSeatClimateAction.CarSeat>): void;
  addCarseat(value?: AutoSeatClimateAction.CarSeat, index?: number): AutoSeatClimateAction.CarSeat;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AutoSeatClimateAction.AsObject;
  static toObject(includeInstance: boolean, msg: AutoSeatClimateAction): AutoSeatClimateAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AutoSeatClimateAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AutoSeatClimateAction;
  static deserializeBinaryFromReader(message: AutoSeatClimateAction, reader: jspb.BinaryReader): AutoSeatClimateAction;
}

export namespace AutoSeatClimateAction {
  export type AsObject = {
    carseatList: Array<AutoSeatClimateAction.CarSeat.AsObject>,
  }

  export class CarSeat extends jspb.Message {
    getOn(): boolean;
    setOn(value: boolean): void;

    getSeatPosition(): AutoSeatClimateAction.AutoSeatPosition_EMap[keyof AutoSeatClimateAction.AutoSeatPosition_EMap];
    setSeatPosition(value: AutoSeatClimateAction.AutoSeatPosition_EMap[keyof AutoSeatClimateAction.AutoSeatPosition_EMap]): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CarSeat.AsObject;
    static toObject(includeInstance: boolean, msg: CarSeat): CarSeat.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CarSeat, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CarSeat;
    static deserializeBinaryFromReader(message: CarSeat, reader: jspb.BinaryReader): CarSeat;
  }

  export namespace CarSeat {
    export type AsObject = {
      on: boolean,
      seatPosition: AutoSeatClimateAction.AutoSeatPosition_EMap[keyof AutoSeatClimateAction.AutoSeatPosition_EMap],
    }
  }

  export interface AutoSeatPosition_EMap {
    AUTOSEATPOSITION_UNKNOWN: 0;
    AUTOSEATPOSITION_FRONTLEFT: 1;
    AUTOSEATPOSITION_FRONTRIGHT: 2;
  }

  export const AutoSeatPosition_E: AutoSeatPosition_EMap;
}

export class Ping extends jspb.Message {
  getPingId(): number;
  setPingId(value: number): void;

  hasLocalTimestamp(): boolean;
  clearLocalTimestamp(): void;
  getLocalTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLocalTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): void;

  hasLastRemoteTimestamp(): boolean;
  clearLastRemoteTimestamp(): void;
  getLastRemoteTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastRemoteTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Ping.AsObject;
  static toObject(includeInstance: boolean, msg: Ping): Ping.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Ping, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Ping;
  static deserializeBinaryFromReader(message: Ping, reader: jspb.BinaryReader): Ping;
}

export namespace Ping {
  export type AsObject = {
    pingId: number,
    localTimestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    lastRemoteTimestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class ScheduledChargingAction extends jspb.Message {
  getEnabled(): boolean;
  setEnabled(value: boolean): void;

  getChargingTime(): number;
  setChargingTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScheduledChargingAction.AsObject;
  static toObject(includeInstance: boolean, msg: ScheduledChargingAction): ScheduledChargingAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ScheduledChargingAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScheduledChargingAction;
  static deserializeBinaryFromReader(message: ScheduledChargingAction, reader: jspb.BinaryReader): ScheduledChargingAction;
}

export namespace ScheduledChargingAction {
  export type AsObject = {
    enabled: boolean,
    chargingTime: number,
  }
}

export class ScheduledDepartureAction extends jspb.Message {
  getEnabled(): boolean;
  setEnabled(value: boolean): void;

  getDepartureTime(): number;
  setDepartureTime(value: number): void;

  hasPreconditioningTimes(): boolean;
  clearPreconditioningTimes(): void;
  getPreconditioningTimes(): common_pb.PreconditioningTimes | undefined;
  setPreconditioningTimes(value?: common_pb.PreconditioningTimes): void;

  hasOffPeakChargingTimes(): boolean;
  clearOffPeakChargingTimes(): void;
  getOffPeakChargingTimes(): common_pb.OffPeakChargingTimes | undefined;
  setOffPeakChargingTimes(value?: common_pb.OffPeakChargingTimes): void;

  getOffPeakHoursEndTime(): number;
  setOffPeakHoursEndTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ScheduledDepartureAction.AsObject;
  static toObject(includeInstance: boolean, msg: ScheduledDepartureAction): ScheduledDepartureAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ScheduledDepartureAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ScheduledDepartureAction;
  static deserializeBinaryFromReader(message: ScheduledDepartureAction, reader: jspb.BinaryReader): ScheduledDepartureAction;
}

export namespace ScheduledDepartureAction {
  export type AsObject = {
    enabled: boolean,
    departureTime: number,
    preconditioningTimes?: common_pb.PreconditioningTimes.AsObject,
    offPeakChargingTimes?: common_pb.OffPeakChargingTimes.AsObject,
    offPeakHoursEndTime: number,
  }
}

export class HvacClimateKeeperAction extends jspb.Message {
  getClimatekeeperaction(): HvacClimateKeeperAction.ClimateKeeperAction_EMap[keyof HvacClimateKeeperAction.ClimateKeeperAction_EMap];
  setClimatekeeperaction(value: HvacClimateKeeperAction.ClimateKeeperAction_EMap[keyof HvacClimateKeeperAction.ClimateKeeperAction_EMap]): void;

  getManualOverride(): boolean;
  setManualOverride(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HvacClimateKeeperAction.AsObject;
  static toObject(includeInstance: boolean, msg: HvacClimateKeeperAction): HvacClimateKeeperAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HvacClimateKeeperAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HvacClimateKeeperAction;
  static deserializeBinaryFromReader(message: HvacClimateKeeperAction, reader: jspb.BinaryReader): HvacClimateKeeperAction;
}

export namespace HvacClimateKeeperAction {
  export type AsObject = {
    climatekeeperaction: HvacClimateKeeperAction.ClimateKeeperAction_EMap[keyof HvacClimateKeeperAction.ClimateKeeperAction_EMap],
    manualOverride: boolean,
  }

  export interface ClimateKeeperAction_EMap {
    CLIMATEKEEPERACTION_OFF: 0;
    CLIMATEKEEPERACTION_ON: 1;
    CLIMATEKEEPERACTION_DOG: 2;
    CLIMATEKEEPERACTION_CAMP: 3;
  }

  export const ClimateKeeperAction_E: ClimateKeeperAction_EMap;
}

export class SetChargingAmpsAction extends jspb.Message {
  getChargingAmps(): number;
  setChargingAmps(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetChargingAmpsAction.AsObject;
  static toObject(includeInstance: boolean, msg: SetChargingAmpsAction): SetChargingAmpsAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetChargingAmpsAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetChargingAmpsAction;
  static deserializeBinaryFromReader(message: SetChargingAmpsAction, reader: jspb.BinaryReader): SetChargingAmpsAction;
}

export namespace SetChargingAmpsAction {
  export type AsObject = {
    chargingAmps: number,
  }
}

export class RemoveChargeScheduleAction extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveChargeScheduleAction.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveChargeScheduleAction): RemoveChargeScheduleAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemoveChargeScheduleAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveChargeScheduleAction;
  static deserializeBinaryFromReader(message: RemoveChargeScheduleAction, reader: jspb.BinaryReader): RemoveChargeScheduleAction;
}

export namespace RemoveChargeScheduleAction {
  export type AsObject = {
    id: number,
  }
}

export class BatchRemoveChargeSchedulesAction extends jspb.Message {
  getHome(): boolean;
  setHome(value: boolean): void;

  getWork(): boolean;
  setWork(value: boolean): void;

  getOther(): boolean;
  setOther(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BatchRemoveChargeSchedulesAction.AsObject;
  static toObject(includeInstance: boolean, msg: BatchRemoveChargeSchedulesAction): BatchRemoveChargeSchedulesAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BatchRemoveChargeSchedulesAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BatchRemoveChargeSchedulesAction;
  static deserializeBinaryFromReader(message: BatchRemoveChargeSchedulesAction, reader: jspb.BinaryReader): BatchRemoveChargeSchedulesAction;
}

export namespace BatchRemoveChargeSchedulesAction {
  export type AsObject = {
    home: boolean,
    work: boolean,
    other: boolean,
  }
}

export class BatchRemovePreconditionSchedulesAction extends jspb.Message {
  getHome(): boolean;
  setHome(value: boolean): void;

  getWork(): boolean;
  setWork(value: boolean): void;

  getOther(): boolean;
  setOther(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BatchRemovePreconditionSchedulesAction.AsObject;
  static toObject(includeInstance: boolean, msg: BatchRemovePreconditionSchedulesAction): BatchRemovePreconditionSchedulesAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BatchRemovePreconditionSchedulesAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BatchRemovePreconditionSchedulesAction;
  static deserializeBinaryFromReader(message: BatchRemovePreconditionSchedulesAction, reader: jspb.BinaryReader): BatchRemovePreconditionSchedulesAction;
}

export namespace BatchRemovePreconditionSchedulesAction {
  export type AsObject = {
    home: boolean,
    work: boolean,
    other: boolean,
  }
}

export class RemovePreconditionScheduleAction extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemovePreconditionScheduleAction.AsObject;
  static toObject(includeInstance: boolean, msg: RemovePreconditionScheduleAction): RemovePreconditionScheduleAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RemovePreconditionScheduleAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemovePreconditionScheduleAction;
  static deserializeBinaryFromReader(message: RemovePreconditionScheduleAction, reader: jspb.BinaryReader): RemovePreconditionScheduleAction;
}

export namespace RemovePreconditionScheduleAction {
  export type AsObject = {
    id: number,
  }
}

export class SetCabinOverheatProtectionAction extends jspb.Message {
  getOn(): boolean;
  setOn(value: boolean): void;

  getFanOnly(): boolean;
  setFanOnly(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetCabinOverheatProtectionAction.AsObject;
  static toObject(includeInstance: boolean, msg: SetCabinOverheatProtectionAction): SetCabinOverheatProtectionAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetCabinOverheatProtectionAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetCabinOverheatProtectionAction;
  static deserializeBinaryFromReader(message: SetCabinOverheatProtectionAction, reader: jspb.BinaryReader): SetCabinOverheatProtectionAction;
}

export namespace SetCabinOverheatProtectionAction {
  export type AsObject = {
    on: boolean,
    fanOnly: boolean,
  }
}

export class SetVehicleNameAction extends jspb.Message {
  getVehiclename(): string;
  setVehiclename(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetVehicleNameAction.AsObject;
  static toObject(includeInstance: boolean, msg: SetVehicleNameAction): SetVehicleNameAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetVehicleNameAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetVehicleNameAction;
  static deserializeBinaryFromReader(message: SetVehicleNameAction, reader: jspb.BinaryReader): SetVehicleNameAction;
}

export namespace SetVehicleNameAction {
  export type AsObject = {
    vehiclename: string,
  }
}

export class ChargePortDoorClose extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChargePortDoorClose.AsObject;
  static toObject(includeInstance: boolean, msg: ChargePortDoorClose): ChargePortDoorClose.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChargePortDoorClose, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChargePortDoorClose;
  static deserializeBinaryFromReader(message: ChargePortDoorClose, reader: jspb.BinaryReader): ChargePortDoorClose;
}

export namespace ChargePortDoorClose {
  export type AsObject = {
  }
}

export class ChargePortDoorOpen extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ChargePortDoorOpen.AsObject;
  static toObject(includeInstance: boolean, msg: ChargePortDoorOpen): ChargePortDoorOpen.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ChargePortDoorOpen, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ChargePortDoorOpen;
  static deserializeBinaryFromReader(message: ChargePortDoorOpen, reader: jspb.BinaryReader): ChargePortDoorOpen;
}

export namespace ChargePortDoorOpen {
  export type AsObject = {
  }
}

export class SetCopTempAction extends jspb.Message {
  getCopactivationtemp(): vehicle_pb.ClimateState.CopActivationTempMap[keyof vehicle_pb.ClimateState.CopActivationTempMap];
  setCopactivationtemp(value: vehicle_pb.ClimateState.CopActivationTempMap[keyof vehicle_pb.ClimateState.CopActivationTempMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetCopTempAction.AsObject;
  static toObject(includeInstance: boolean, msg: SetCopTempAction): SetCopTempAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetCopTempAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetCopTempAction;
  static deserializeBinaryFromReader(message: SetCopTempAction, reader: jspb.BinaryReader): SetCopTempAction;
}

export namespace SetCopTempAction {
  export type AsObject = {
    copactivationtemp: vehicle_pb.ClimateState.CopActivationTempMap[keyof vehicle_pb.ClimateState.CopActivationTempMap],
  }
}

export class VehicleControlSetPinToDriveAction extends jspb.Message {
  getOn(): boolean;
  setOn(value: boolean): void;

  getPassword(): string;
  setPassword(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlSetPinToDriveAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlSetPinToDriveAction): VehicleControlSetPinToDriveAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlSetPinToDriveAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlSetPinToDriveAction;
  static deserializeBinaryFromReader(message: VehicleControlSetPinToDriveAction, reader: jspb.BinaryReader): VehicleControlSetPinToDriveAction;
}

export namespace VehicleControlSetPinToDriveAction {
  export type AsObject = {
    on: boolean,
    password: string,
  }
}

export class VehicleControlResetPinToDriveAction extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VehicleControlResetPinToDriveAction.AsObject;
  static toObject(includeInstance: boolean, msg: VehicleControlResetPinToDriveAction): VehicleControlResetPinToDriveAction.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VehicleControlResetPinToDriveAction, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VehicleControlResetPinToDriveAction;
  static deserializeBinaryFromReader(message: VehicleControlResetPinToDriveAction, reader: jspb.BinaryReader): VehicleControlResetPinToDriveAction;
}

export namespace VehicleControlResetPinToDriveAction {
  export type AsObject = {
  }
}

export interface OperationStatus_EMap {
  OPERATIONSTATUS_OK: 0;
  OPERATIONSTATUS_ERROR: 1;
}

export const OperationStatus_E: OperationStatus_EMap;

