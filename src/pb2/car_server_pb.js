// source: car_server.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

var vehicle_pb = require('./vehicle_pb.js');
goog.object.extend(proto, vehicle_pb);
var signatures_pb = require('./signatures_pb.js');
goog.object.extend(proto, signatures_pb);
var common_pb = require('./common_pb.js');
goog.object.extend(proto, common_pb);
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');
goog.object.extend(proto, google_protobuf_timestamp_pb);
goog.exportSymbol('proto.CarServer.Action', null, global);
goog.exportSymbol('proto.CarServer.Action.ActionMsgCase', null, global);
goog.exportSymbol('proto.CarServer.ActionStatus', null, global);
goog.exportSymbol('proto.CarServer.AutoSeatClimateAction', null, global);
goog.exportSymbol('proto.CarServer.AutoSeatClimateAction.AutoSeatPosition_E', null, global);
goog.exportSymbol('proto.CarServer.AutoSeatClimateAction.CarSeat', null, global);
goog.exportSymbol('proto.CarServer.ChargePortDoorClose', null, global);
goog.exportSymbol('proto.CarServer.ChargePortDoorOpen', null, global);
goog.exportSymbol('proto.CarServer.ChargingSetLimitAction', null, global);
goog.exportSymbol('proto.CarServer.ChargingStartStopAction', null, global);
goog.exportSymbol('proto.CarServer.ChargingStartStopAction.ChargingActionCase', null, global);
goog.exportSymbol('proto.CarServer.DrivingClearSpeedLimitPinAction', null, global);
goog.exportSymbol('proto.CarServer.DrivingSetSpeedLimitAction', null, global);
goog.exportSymbol('proto.CarServer.DrivingSpeedLimitAction', null, global);
goog.exportSymbol('proto.CarServer.EncryptedData', null, global);
goog.exportSymbol('proto.CarServer.EraseUserDataAction', null, global);
goog.exportSymbol('proto.CarServer.GetNearbyChargingSites', null, global);
goog.exportSymbol('proto.CarServer.HvacAutoAction', null, global);
goog.exportSymbol('proto.CarServer.HvacBioweaponModeAction', null, global);
goog.exportSymbol('proto.CarServer.HvacClimateKeeperAction', null, global);
goog.exportSymbol('proto.CarServer.HvacClimateKeeperAction.ClimateKeeperAction_E', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatCoolerActions', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerLevel_E', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerPosition_E', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatHeaterActions', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatHeaterLevelCase', null, global);
goog.exportSymbol('proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatPositionCase', null, global);
goog.exportSymbol('proto.CarServer.HvacSetPreconditioningMaxAction', null, global);
goog.exportSymbol('proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E', null, global);
goog.exportSymbol('proto.CarServer.HvacSteeringWheelHeaterAction', null, global);
goog.exportSymbol('proto.CarServer.HvacTemperatureAdjustmentAction', null, global);
goog.exportSymbol('proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone', null, global);
goog.exportSymbol('proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.TypeCase', null, global);
goog.exportSymbol('proto.CarServer.HvacTemperatureAdjustmentAction.Temperature', null, global);
goog.exportSymbol('proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.TypeCase', null, global);
goog.exportSymbol('proto.CarServer.MediaNextFavorite', null, global);
goog.exportSymbol('proto.CarServer.MediaNextTrack', null, global);
goog.exportSymbol('proto.CarServer.MediaPreviousFavorite', null, global);
goog.exportSymbol('proto.CarServer.MediaPreviousTrack', null, global);
goog.exportSymbol('proto.CarServer.MediaUpdateVolume', null, global);
goog.exportSymbol('proto.CarServer.MediaUpdateVolume.MediaVolumeCase', null, global);
goog.exportSymbol('proto.CarServer.NearbyChargingSites', null, global);
goog.exportSymbol('proto.CarServer.OperationStatus_E', null, global);
goog.exportSymbol('proto.CarServer.Ping', null, global);
goog.exportSymbol('proto.CarServer.Response', null, global);
goog.exportSymbol('proto.CarServer.Response.ResponseMsgCase', null, global);
goog.exportSymbol('proto.CarServer.ResultReason', null, global);
goog.exportSymbol('proto.CarServer.ResultReason.ReasonCase', null, global);
goog.exportSymbol('proto.CarServer.ScheduledChargingAction', null, global);
goog.exportSymbol('proto.CarServer.ScheduledDepartureAction', null, global);
goog.exportSymbol('proto.CarServer.SetCabinOverheatProtectionAction', null, global);
goog.exportSymbol('proto.CarServer.SetChargingAmpsAction', null, global);
goog.exportSymbol('proto.CarServer.SetCopTempAction', null, global);
goog.exportSymbol('proto.CarServer.SetVehicleNameAction', null, global);
goog.exportSymbol('proto.CarServer.Superchargers', null, global);
goog.exportSymbol('proto.CarServer.VehicleAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleAction.VehicleActionMsgCase', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlCancelSoftwareUpdateAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlFlashLightsAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlHonkHornAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlResetPinToDriveAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlResetValetPinAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlScheduleSoftwareUpdateAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlSetPinToDriveAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlSetSentryModeAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlSetValetModeAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlSunroofOpenCloseAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlSunroofOpenCloseAction.ActionCase', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlSunroofOpenCloseAction.SunroofLevelCase', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlTriggerHomelinkAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlWindowAction', null, global);
goog.exportSymbol('proto.CarServer.VehicleControlWindowAction.ActionCase', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.Action = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.Action.oneofGroups_);
};
goog.inherits(proto.CarServer.Action, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.Action.displayName = 'proto.CarServer.Action';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.VehicleAction.oneofGroups_);
};
goog.inherits(proto.CarServer.VehicleAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleAction.displayName = 'proto.CarServer.VehicleAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.EraseUserDataAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.EraseUserDataAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.EraseUserDataAction.displayName = 'proto.CarServer.EraseUserDataAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.Response = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.Response.oneofGroups_);
};
goog.inherits(proto.CarServer.Response, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.Response.displayName = 'proto.CarServer.Response';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ActionStatus = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.ActionStatus, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ActionStatus.displayName = 'proto.CarServer.ActionStatus';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ResultReason = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.ResultReason.oneofGroups_);
};
goog.inherits(proto.CarServer.ResultReason, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ResultReason.displayName = 'proto.CarServer.ResultReason';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.EncryptedData = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.EncryptedData, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.EncryptedData.displayName = 'proto.CarServer.EncryptedData';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ChargingSetLimitAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.ChargingSetLimitAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ChargingSetLimitAction.displayName = 'proto.CarServer.ChargingSetLimitAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ChargingStartStopAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.ChargingStartStopAction.oneofGroups_);
};
goog.inherits(proto.CarServer.ChargingStartStopAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ChargingStartStopAction.displayName = 'proto.CarServer.ChargingStartStopAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.DrivingClearSpeedLimitPinAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.DrivingClearSpeedLimitPinAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.DrivingClearSpeedLimitPinAction.displayName = 'proto.CarServer.DrivingClearSpeedLimitPinAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.DrivingSetSpeedLimitAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.DrivingSetSpeedLimitAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.DrivingSetSpeedLimitAction.displayName = 'proto.CarServer.DrivingSetSpeedLimitAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.DrivingSpeedLimitAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.DrivingSpeedLimitAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.DrivingSpeedLimitAction.displayName = 'proto.CarServer.DrivingSpeedLimitAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacAutoAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.HvacAutoAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacAutoAction.displayName = 'proto.CarServer.HvacAutoAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacSeatHeaterActions = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.CarServer.HvacSeatHeaterActions.repeatedFields_, null);
};
goog.inherits(proto.CarServer.HvacSeatHeaterActions, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacSeatHeaterActions.displayName = 'proto.CarServer.HvacSeatHeaterActions';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_);
};
goog.inherits(proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.displayName = 'proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacSeatCoolerActions = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.CarServer.HvacSeatCoolerActions.repeatedFields_, null);
};
goog.inherits(proto.CarServer.HvacSeatCoolerActions, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacSeatCoolerActions.displayName = 'proto.CarServer.HvacSeatCoolerActions';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.displayName = 'proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacSetPreconditioningMaxAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.CarServer.HvacSetPreconditioningMaxAction.repeatedFields_, null);
};
goog.inherits(proto.CarServer.HvacSetPreconditioningMaxAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacSetPreconditioningMaxAction.displayName = 'proto.CarServer.HvacSetPreconditioningMaxAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacSteeringWheelHeaterAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.HvacSteeringWheelHeaterAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacSteeringWheelHeaterAction.displayName = 'proto.CarServer.HvacSteeringWheelHeaterAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacTemperatureAdjustmentAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.CarServer.HvacTemperatureAdjustmentAction.repeatedFields_, null);
};
goog.inherits(proto.CarServer.HvacTemperatureAdjustmentAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacTemperatureAdjustmentAction.displayName = 'proto.CarServer.HvacTemperatureAdjustmentAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.oneofGroups_);
};
goog.inherits(proto.CarServer.HvacTemperatureAdjustmentAction.Temperature, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.displayName = 'proto.CarServer.HvacTemperatureAdjustmentAction.Temperature';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_);
};
goog.inherits(proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.displayName = 'proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.GetNearbyChargingSites = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.GetNearbyChargingSites, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.GetNearbyChargingSites.displayName = 'proto.CarServer.GetNearbyChargingSites';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.NearbyChargingSites = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.CarServer.NearbyChargingSites.repeatedFields_, null);
};
goog.inherits(proto.CarServer.NearbyChargingSites, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.NearbyChargingSites.displayName = 'proto.CarServer.NearbyChargingSites';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.Superchargers = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.Superchargers, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.Superchargers.displayName = 'proto.CarServer.Superchargers';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.MediaUpdateVolume = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.MediaUpdateVolume.oneofGroups_);
};
goog.inherits(proto.CarServer.MediaUpdateVolume, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.MediaUpdateVolume.displayName = 'proto.CarServer.MediaUpdateVolume';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.MediaNextFavorite = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.MediaNextFavorite, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.MediaNextFavorite.displayName = 'proto.CarServer.MediaNextFavorite';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.MediaPreviousFavorite = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.MediaPreviousFavorite, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.MediaPreviousFavorite.displayName = 'proto.CarServer.MediaPreviousFavorite';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.MediaNextTrack = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.MediaNextTrack, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.MediaNextTrack.displayName = 'proto.CarServer.MediaNextTrack';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.MediaPreviousTrack = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.MediaPreviousTrack, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.MediaPreviousTrack.displayName = 'proto.CarServer.MediaPreviousTrack';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlCancelSoftwareUpdateAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlCancelSoftwareUpdateAction.displayName = 'proto.CarServer.VehicleControlCancelSoftwareUpdateAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlFlashLightsAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlFlashLightsAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlFlashLightsAction.displayName = 'proto.CarServer.VehicleControlFlashLightsAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlHonkHornAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlHonkHornAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlHonkHornAction.displayName = 'proto.CarServer.VehicleControlHonkHornAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlResetValetPinAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlResetValetPinAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlResetValetPinAction.displayName = 'proto.CarServer.VehicleControlResetValetPinAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlScheduleSoftwareUpdateAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.displayName = 'proto.CarServer.VehicleControlScheduleSoftwareUpdateAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlSetSentryModeAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlSetSentryModeAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlSetSentryModeAction.displayName = 'proto.CarServer.VehicleControlSetSentryModeAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlSetValetModeAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlSetValetModeAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlSetValetModeAction.displayName = 'proto.CarServer.VehicleControlSetValetModeAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_);
};
goog.inherits(proto.CarServer.VehicleControlSunroofOpenCloseAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlSunroofOpenCloseAction.displayName = 'proto.CarServer.VehicleControlSunroofOpenCloseAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlTriggerHomelinkAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlTriggerHomelinkAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlTriggerHomelinkAction.displayName = 'proto.CarServer.VehicleControlTriggerHomelinkAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlWindowAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.CarServer.VehicleControlWindowAction.oneofGroups_);
};
goog.inherits(proto.CarServer.VehicleControlWindowAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlWindowAction.displayName = 'proto.CarServer.VehicleControlWindowAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacBioweaponModeAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.HvacBioweaponModeAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacBioweaponModeAction.displayName = 'proto.CarServer.HvacBioweaponModeAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.AutoSeatClimateAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.CarServer.AutoSeatClimateAction.repeatedFields_, null);
};
goog.inherits(proto.CarServer.AutoSeatClimateAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.AutoSeatClimateAction.displayName = 'proto.CarServer.AutoSeatClimateAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.AutoSeatClimateAction.CarSeat = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.AutoSeatClimateAction.CarSeat, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.AutoSeatClimateAction.CarSeat.displayName = 'proto.CarServer.AutoSeatClimateAction.CarSeat';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.Ping = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.Ping, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.Ping.displayName = 'proto.CarServer.Ping';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ScheduledChargingAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.ScheduledChargingAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ScheduledChargingAction.displayName = 'proto.CarServer.ScheduledChargingAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ScheduledDepartureAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.ScheduledDepartureAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ScheduledDepartureAction.displayName = 'proto.CarServer.ScheduledDepartureAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.HvacClimateKeeperAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.HvacClimateKeeperAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.HvacClimateKeeperAction.displayName = 'proto.CarServer.HvacClimateKeeperAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.SetChargingAmpsAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.SetChargingAmpsAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.SetChargingAmpsAction.displayName = 'proto.CarServer.SetChargingAmpsAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.SetCabinOverheatProtectionAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.SetCabinOverheatProtectionAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.SetCabinOverheatProtectionAction.displayName = 'proto.CarServer.SetCabinOverheatProtectionAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.SetVehicleNameAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.SetVehicleNameAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.SetVehicleNameAction.displayName = 'proto.CarServer.SetVehicleNameAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ChargePortDoorClose = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.ChargePortDoorClose, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ChargePortDoorClose.displayName = 'proto.CarServer.ChargePortDoorClose';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.ChargePortDoorOpen = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.ChargePortDoorOpen, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.ChargePortDoorOpen.displayName = 'proto.CarServer.ChargePortDoorOpen';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.SetCopTempAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.SetCopTempAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.SetCopTempAction.displayName = 'proto.CarServer.SetCopTempAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlSetPinToDriveAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlSetPinToDriveAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlSetPinToDriveAction.displayName = 'proto.CarServer.VehicleControlSetPinToDriveAction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.CarServer.VehicleControlResetPinToDriveAction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.CarServer.VehicleControlResetPinToDriveAction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.CarServer.VehicleControlResetPinToDriveAction.displayName = 'proto.CarServer.VehicleControlResetPinToDriveAction';
}

/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.Action.oneofGroups_ = [[2]];

/**
 * @enum {number}
 */
proto.CarServer.Action.ActionMsgCase = {
  ACTION_MSG_NOT_SET: 0,
  VEHICLEACTION: 2
};

/**
 * @return {proto.CarServer.Action.ActionMsgCase}
 */
proto.CarServer.Action.prototype.getActionMsgCase = function() {
  return /** @type {proto.CarServer.Action.ActionMsgCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.Action.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.Action.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.Action.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.Action} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Action.toObject = function(includeInstance, msg) {
  var f, obj = {
    vehicleaction: (f = msg.getVehicleaction()) && proto.CarServer.VehicleAction.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.Action}
 */
proto.CarServer.Action.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.Action;
  return proto.CarServer.Action.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.Action} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.Action}
 */
proto.CarServer.Action.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 2:
      var value = new proto.CarServer.VehicleAction;
      reader.readMessage(value,proto.CarServer.VehicleAction.deserializeBinaryFromReader);
      msg.setVehicleaction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.Action.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.Action.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.Action} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Action.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVehicleaction();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.CarServer.VehicleAction.serializeBinaryToWriter
    );
  }
};


/**
 * optional VehicleAction vehicleAction = 2;
 * @return {?proto.CarServer.VehicleAction}
 */
proto.CarServer.Action.prototype.getVehicleaction = function() {
  return /** @type{?proto.CarServer.VehicleAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleAction, 2));
};


/**
 * @param {?proto.CarServer.VehicleAction|undefined} value
 * @return {!proto.CarServer.Action} returns this
*/
proto.CarServer.Action.prototype.setVehicleaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.CarServer.Action.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Action} returns this
 */
proto.CarServer.Action.prototype.clearVehicleaction = function() {
  return this.setVehicleaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Action.prototype.hasVehicleaction = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.VehicleAction.oneofGroups_ = [[5,6,7,8,9,10,12,13,14,16,17,18,19,20,23,25,26,27,28,29,30,31,32,33,34,35,36,41,42,43,44,46,48,49,50,54,61,62,65,66,72,77,78]];

/**
 * @enum {number}
 */
proto.CarServer.VehicleAction.VehicleActionMsgCase = {
  VEHICLE_ACTION_MSG_NOT_SET: 0,
  CHARGINGSETLIMITACTION: 5,
  CHARGINGSTARTSTOPACTION: 6,
  DRIVINGCLEARSPEEDLIMITPINACTION: 7,
  DRIVINGSETSPEEDLIMITACTION: 8,
  DRIVINGSPEEDLIMITACTION: 9,
  HVACAUTOACTION: 10,
  HVACSETPRECONDITIONINGMAXACTION: 12,
  HVACSTEERINGWHEELHEATERACTION: 13,
  HVACTEMPERATUREADJUSTMENTACTION: 14,
  MEDIAUPDATEVOLUME: 16,
  MEDIANEXTFAVORITE: 17,
  MEDIAPREVIOUSFAVORITE: 18,
  MEDIANEXTTRACK: 19,
  MEDIAPREVIOUSTRACK: 20,
  GETNEARBYCHARGINGSITES: 23,
  VEHICLECONTROLCANCELSOFTWAREUPDATEACTION: 25,
  VEHICLECONTROLFLASHLIGHTSACTION: 26,
  VEHICLECONTROLHONKHORNACTION: 27,
  VEHICLECONTROLRESETVALETPINACTION: 28,
  VEHICLECONTROLSCHEDULESOFTWAREUPDATEACTION: 29,
  VEHICLECONTROLSETSENTRYMODEACTION: 30,
  VEHICLECONTROLSETVALETMODEACTION: 31,
  VEHICLECONTROLSUNROOFOPENCLOSEACTION: 32,
  VEHICLECONTROLTRIGGERHOMELINKACTION: 33,
  VEHICLECONTROLWINDOWACTION: 34,
  HVACBIOWEAPONMODEACTION: 35,
  HVACSEATHEATERACTIONS: 36,
  SCHEDULEDCHARGINGACTION: 41,
  SCHEDULEDDEPARTUREACTION: 42,
  SETCHARGINGAMPSACTION: 43,
  HVACCLIMATEKEEPERACTION: 44,
  PING: 46,
  AUTOSEATCLIMATEACTION: 48,
  HVACSEATCOOLERACTIONS: 49,
  SETCABINOVERHEATPROTECTIONACTION: 50,
  SETVEHICLENAMEACTION: 54,
  CHARGEPORTDOORCLOSE: 61,
  CHARGEPORTDOOROPEN: 62,
  GUESTMODEACTION: 65,
  SETCOPTEMPACTION: 66,
  ERASEUSERDATAACTION: 72,
  VEHICLECONTROLSETPINTODRIVEACTION: 77,
  VEHICLECONTROLRESETPINTODRIVEACTION: 78
};

/**
 * @return {proto.CarServer.VehicleAction.VehicleActionMsgCase}
 */
proto.CarServer.VehicleAction.prototype.getVehicleActionMsgCase = function() {
  return /** @type {proto.CarServer.VehicleAction.VehicleActionMsgCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.VehicleAction.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    chargingsetlimitaction: (f = msg.getChargingsetlimitaction()) && proto.CarServer.ChargingSetLimitAction.toObject(includeInstance, f),
    chargingstartstopaction: (f = msg.getChargingstartstopaction()) && proto.CarServer.ChargingStartStopAction.toObject(includeInstance, f),
    drivingclearspeedlimitpinaction: (f = msg.getDrivingclearspeedlimitpinaction()) && proto.CarServer.DrivingClearSpeedLimitPinAction.toObject(includeInstance, f),
    drivingsetspeedlimitaction: (f = msg.getDrivingsetspeedlimitaction()) && proto.CarServer.DrivingSetSpeedLimitAction.toObject(includeInstance, f),
    drivingspeedlimitaction: (f = msg.getDrivingspeedlimitaction()) && proto.CarServer.DrivingSpeedLimitAction.toObject(includeInstance, f),
    hvacautoaction: (f = msg.getHvacautoaction()) && proto.CarServer.HvacAutoAction.toObject(includeInstance, f),
    hvacsetpreconditioningmaxaction: (f = msg.getHvacsetpreconditioningmaxaction()) && proto.CarServer.HvacSetPreconditioningMaxAction.toObject(includeInstance, f),
    hvacsteeringwheelheateraction: (f = msg.getHvacsteeringwheelheateraction()) && proto.CarServer.HvacSteeringWheelHeaterAction.toObject(includeInstance, f),
    hvactemperatureadjustmentaction: (f = msg.getHvactemperatureadjustmentaction()) && proto.CarServer.HvacTemperatureAdjustmentAction.toObject(includeInstance, f),
    mediaupdatevolume: (f = msg.getMediaupdatevolume()) && proto.CarServer.MediaUpdateVolume.toObject(includeInstance, f),
    medianextfavorite: (f = msg.getMedianextfavorite()) && proto.CarServer.MediaNextFavorite.toObject(includeInstance, f),
    mediapreviousfavorite: (f = msg.getMediapreviousfavorite()) && proto.CarServer.MediaPreviousFavorite.toObject(includeInstance, f),
    medianexttrack: (f = msg.getMedianexttrack()) && proto.CarServer.MediaNextTrack.toObject(includeInstance, f),
    mediaprevioustrack: (f = msg.getMediaprevioustrack()) && proto.CarServer.MediaPreviousTrack.toObject(includeInstance, f),
    getnearbychargingsites: (f = msg.getGetnearbychargingsites()) && proto.CarServer.GetNearbyChargingSites.toObject(includeInstance, f),
    vehiclecontrolcancelsoftwareupdateaction: (f = msg.getVehiclecontrolcancelsoftwareupdateaction()) && proto.CarServer.VehicleControlCancelSoftwareUpdateAction.toObject(includeInstance, f),
    vehiclecontrolflashlightsaction: (f = msg.getVehiclecontrolflashlightsaction()) && proto.CarServer.VehicleControlFlashLightsAction.toObject(includeInstance, f),
    vehiclecontrolhonkhornaction: (f = msg.getVehiclecontrolhonkhornaction()) && proto.CarServer.VehicleControlHonkHornAction.toObject(includeInstance, f),
    vehiclecontrolresetvaletpinaction: (f = msg.getVehiclecontrolresetvaletpinaction()) && proto.CarServer.VehicleControlResetValetPinAction.toObject(includeInstance, f),
    vehiclecontrolschedulesoftwareupdateaction: (f = msg.getVehiclecontrolschedulesoftwareupdateaction()) && proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.toObject(includeInstance, f),
    vehiclecontrolsetsentrymodeaction: (f = msg.getVehiclecontrolsetsentrymodeaction()) && proto.CarServer.VehicleControlSetSentryModeAction.toObject(includeInstance, f),
    vehiclecontrolsetvaletmodeaction: (f = msg.getVehiclecontrolsetvaletmodeaction()) && proto.CarServer.VehicleControlSetValetModeAction.toObject(includeInstance, f),
    vehiclecontrolsunroofopencloseaction: (f = msg.getVehiclecontrolsunroofopencloseaction()) && proto.CarServer.VehicleControlSunroofOpenCloseAction.toObject(includeInstance, f),
    vehiclecontroltriggerhomelinkaction: (f = msg.getVehiclecontroltriggerhomelinkaction()) && proto.CarServer.VehicleControlTriggerHomelinkAction.toObject(includeInstance, f),
    vehiclecontrolwindowaction: (f = msg.getVehiclecontrolwindowaction()) && proto.CarServer.VehicleControlWindowAction.toObject(includeInstance, f),
    hvacbioweaponmodeaction: (f = msg.getHvacbioweaponmodeaction()) && proto.CarServer.HvacBioweaponModeAction.toObject(includeInstance, f),
    hvacseatheateractions: (f = msg.getHvacseatheateractions()) && proto.CarServer.HvacSeatHeaterActions.toObject(includeInstance, f),
    scheduledchargingaction: (f = msg.getScheduledchargingaction()) && proto.CarServer.ScheduledChargingAction.toObject(includeInstance, f),
    scheduleddepartureaction: (f = msg.getScheduleddepartureaction()) && proto.CarServer.ScheduledDepartureAction.toObject(includeInstance, f),
    setchargingampsaction: (f = msg.getSetchargingampsaction()) && proto.CarServer.SetChargingAmpsAction.toObject(includeInstance, f),
    hvacclimatekeeperaction: (f = msg.getHvacclimatekeeperaction()) && proto.CarServer.HvacClimateKeeperAction.toObject(includeInstance, f),
    ping: (f = msg.getPing()) && proto.CarServer.Ping.toObject(includeInstance, f),
    autoseatclimateaction: (f = msg.getAutoseatclimateaction()) && proto.CarServer.AutoSeatClimateAction.toObject(includeInstance, f),
    hvacseatcooleractions: (f = msg.getHvacseatcooleractions()) && proto.CarServer.HvacSeatCoolerActions.toObject(includeInstance, f),
    setcabinoverheatprotectionaction: (f = msg.getSetcabinoverheatprotectionaction()) && proto.CarServer.SetCabinOverheatProtectionAction.toObject(includeInstance, f),
    setvehiclenameaction: (f = msg.getSetvehiclenameaction()) && proto.CarServer.SetVehicleNameAction.toObject(includeInstance, f),
    chargeportdoorclose: (f = msg.getChargeportdoorclose()) && proto.CarServer.ChargePortDoorClose.toObject(includeInstance, f),
    chargeportdooropen: (f = msg.getChargeportdooropen()) && proto.CarServer.ChargePortDoorOpen.toObject(includeInstance, f),
    guestmodeaction: (f = msg.getGuestmodeaction()) && vehicle_pb.VehicleState.GuestMode.toObject(includeInstance, f),
    setcoptempaction: (f = msg.getSetcoptempaction()) && proto.CarServer.SetCopTempAction.toObject(includeInstance, f),
    eraseuserdataaction: (f = msg.getEraseuserdataaction()) && proto.CarServer.EraseUserDataAction.toObject(includeInstance, f),
    vehiclecontrolsetpintodriveaction: (f = msg.getVehiclecontrolsetpintodriveaction()) && proto.CarServer.VehicleControlSetPinToDriveAction.toObject(includeInstance, f),
    vehiclecontrolresetpintodriveaction: (f = msg.getVehiclecontrolresetpintodriveaction()) && proto.CarServer.VehicleControlResetPinToDriveAction.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleAction}
 */
proto.CarServer.VehicleAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleAction;
  return proto.CarServer.VehicleAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleAction}
 */
proto.CarServer.VehicleAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 5:
      var value = new proto.CarServer.ChargingSetLimitAction;
      reader.readMessage(value,proto.CarServer.ChargingSetLimitAction.deserializeBinaryFromReader);
      msg.setChargingsetlimitaction(value);
      break;
    case 6:
      var value = new proto.CarServer.ChargingStartStopAction;
      reader.readMessage(value,proto.CarServer.ChargingStartStopAction.deserializeBinaryFromReader);
      msg.setChargingstartstopaction(value);
      break;
    case 7:
      var value = new proto.CarServer.DrivingClearSpeedLimitPinAction;
      reader.readMessage(value,proto.CarServer.DrivingClearSpeedLimitPinAction.deserializeBinaryFromReader);
      msg.setDrivingclearspeedlimitpinaction(value);
      break;
    case 8:
      var value = new proto.CarServer.DrivingSetSpeedLimitAction;
      reader.readMessage(value,proto.CarServer.DrivingSetSpeedLimitAction.deserializeBinaryFromReader);
      msg.setDrivingsetspeedlimitaction(value);
      break;
    case 9:
      var value = new proto.CarServer.DrivingSpeedLimitAction;
      reader.readMessage(value,proto.CarServer.DrivingSpeedLimitAction.deserializeBinaryFromReader);
      msg.setDrivingspeedlimitaction(value);
      break;
    case 10:
      var value = new proto.CarServer.HvacAutoAction;
      reader.readMessage(value,proto.CarServer.HvacAutoAction.deserializeBinaryFromReader);
      msg.setHvacautoaction(value);
      break;
    case 12:
      var value = new proto.CarServer.HvacSetPreconditioningMaxAction;
      reader.readMessage(value,proto.CarServer.HvacSetPreconditioningMaxAction.deserializeBinaryFromReader);
      msg.setHvacsetpreconditioningmaxaction(value);
      break;
    case 13:
      var value = new proto.CarServer.HvacSteeringWheelHeaterAction;
      reader.readMessage(value,proto.CarServer.HvacSteeringWheelHeaterAction.deserializeBinaryFromReader);
      msg.setHvacsteeringwheelheateraction(value);
      break;
    case 14:
      var value = new proto.CarServer.HvacTemperatureAdjustmentAction;
      reader.readMessage(value,proto.CarServer.HvacTemperatureAdjustmentAction.deserializeBinaryFromReader);
      msg.setHvactemperatureadjustmentaction(value);
      break;
    case 16:
      var value = new proto.CarServer.MediaUpdateVolume;
      reader.readMessage(value,proto.CarServer.MediaUpdateVolume.deserializeBinaryFromReader);
      msg.setMediaupdatevolume(value);
      break;
    case 17:
      var value = new proto.CarServer.MediaNextFavorite;
      reader.readMessage(value,proto.CarServer.MediaNextFavorite.deserializeBinaryFromReader);
      msg.setMedianextfavorite(value);
      break;
    case 18:
      var value = new proto.CarServer.MediaPreviousFavorite;
      reader.readMessage(value,proto.CarServer.MediaPreviousFavorite.deserializeBinaryFromReader);
      msg.setMediapreviousfavorite(value);
      break;
    case 19:
      var value = new proto.CarServer.MediaNextTrack;
      reader.readMessage(value,proto.CarServer.MediaNextTrack.deserializeBinaryFromReader);
      msg.setMedianexttrack(value);
      break;
    case 20:
      var value = new proto.CarServer.MediaPreviousTrack;
      reader.readMessage(value,proto.CarServer.MediaPreviousTrack.deserializeBinaryFromReader);
      msg.setMediaprevioustrack(value);
      break;
    case 23:
      var value = new proto.CarServer.GetNearbyChargingSites;
      reader.readMessage(value,proto.CarServer.GetNearbyChargingSites.deserializeBinaryFromReader);
      msg.setGetnearbychargingsites(value);
      break;
    case 25:
      var value = new proto.CarServer.VehicleControlCancelSoftwareUpdateAction;
      reader.readMessage(value,proto.CarServer.VehicleControlCancelSoftwareUpdateAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolcancelsoftwareupdateaction(value);
      break;
    case 26:
      var value = new proto.CarServer.VehicleControlFlashLightsAction;
      reader.readMessage(value,proto.CarServer.VehicleControlFlashLightsAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolflashlightsaction(value);
      break;
    case 27:
      var value = new proto.CarServer.VehicleControlHonkHornAction;
      reader.readMessage(value,proto.CarServer.VehicleControlHonkHornAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolhonkhornaction(value);
      break;
    case 28:
      var value = new proto.CarServer.VehicleControlResetValetPinAction;
      reader.readMessage(value,proto.CarServer.VehicleControlResetValetPinAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolresetvaletpinaction(value);
      break;
    case 29:
      var value = new proto.CarServer.VehicleControlScheduleSoftwareUpdateAction;
      reader.readMessage(value,proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolschedulesoftwareupdateaction(value);
      break;
    case 30:
      var value = new proto.CarServer.VehicleControlSetSentryModeAction;
      reader.readMessage(value,proto.CarServer.VehicleControlSetSentryModeAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolsetsentrymodeaction(value);
      break;
    case 31:
      var value = new proto.CarServer.VehicleControlSetValetModeAction;
      reader.readMessage(value,proto.CarServer.VehicleControlSetValetModeAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolsetvaletmodeaction(value);
      break;
    case 32:
      var value = new proto.CarServer.VehicleControlSunroofOpenCloseAction;
      reader.readMessage(value,proto.CarServer.VehicleControlSunroofOpenCloseAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolsunroofopencloseaction(value);
      break;
    case 33:
      var value = new proto.CarServer.VehicleControlTriggerHomelinkAction;
      reader.readMessage(value,proto.CarServer.VehicleControlTriggerHomelinkAction.deserializeBinaryFromReader);
      msg.setVehiclecontroltriggerhomelinkaction(value);
      break;
    case 34:
      var value = new proto.CarServer.VehicleControlWindowAction;
      reader.readMessage(value,proto.CarServer.VehicleControlWindowAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolwindowaction(value);
      break;
    case 35:
      var value = new proto.CarServer.HvacBioweaponModeAction;
      reader.readMessage(value,proto.CarServer.HvacBioweaponModeAction.deserializeBinaryFromReader);
      msg.setHvacbioweaponmodeaction(value);
      break;
    case 36:
      var value = new proto.CarServer.HvacSeatHeaterActions;
      reader.readMessage(value,proto.CarServer.HvacSeatHeaterActions.deserializeBinaryFromReader);
      msg.setHvacseatheateractions(value);
      break;
    case 41:
      var value = new proto.CarServer.ScheduledChargingAction;
      reader.readMessage(value,proto.CarServer.ScheduledChargingAction.deserializeBinaryFromReader);
      msg.setScheduledchargingaction(value);
      break;
    case 42:
      var value = new proto.CarServer.ScheduledDepartureAction;
      reader.readMessage(value,proto.CarServer.ScheduledDepartureAction.deserializeBinaryFromReader);
      msg.setScheduleddepartureaction(value);
      break;
    case 43:
      var value = new proto.CarServer.SetChargingAmpsAction;
      reader.readMessage(value,proto.CarServer.SetChargingAmpsAction.deserializeBinaryFromReader);
      msg.setSetchargingampsaction(value);
      break;
    case 44:
      var value = new proto.CarServer.HvacClimateKeeperAction;
      reader.readMessage(value,proto.CarServer.HvacClimateKeeperAction.deserializeBinaryFromReader);
      msg.setHvacclimatekeeperaction(value);
      break;
    case 46:
      var value = new proto.CarServer.Ping;
      reader.readMessage(value,proto.CarServer.Ping.deserializeBinaryFromReader);
      msg.setPing(value);
      break;
    case 48:
      var value = new proto.CarServer.AutoSeatClimateAction;
      reader.readMessage(value,proto.CarServer.AutoSeatClimateAction.deserializeBinaryFromReader);
      msg.setAutoseatclimateaction(value);
      break;
    case 49:
      var value = new proto.CarServer.HvacSeatCoolerActions;
      reader.readMessage(value,proto.CarServer.HvacSeatCoolerActions.deserializeBinaryFromReader);
      msg.setHvacseatcooleractions(value);
      break;
    case 50:
      var value = new proto.CarServer.SetCabinOverheatProtectionAction;
      reader.readMessage(value,proto.CarServer.SetCabinOverheatProtectionAction.deserializeBinaryFromReader);
      msg.setSetcabinoverheatprotectionaction(value);
      break;
    case 54:
      var value = new proto.CarServer.SetVehicleNameAction;
      reader.readMessage(value,proto.CarServer.SetVehicleNameAction.deserializeBinaryFromReader);
      msg.setSetvehiclenameaction(value);
      break;
    case 61:
      var value = new proto.CarServer.ChargePortDoorClose;
      reader.readMessage(value,proto.CarServer.ChargePortDoorClose.deserializeBinaryFromReader);
      msg.setChargeportdoorclose(value);
      break;
    case 62:
      var value = new proto.CarServer.ChargePortDoorOpen;
      reader.readMessage(value,proto.CarServer.ChargePortDoorOpen.deserializeBinaryFromReader);
      msg.setChargeportdooropen(value);
      break;
    case 65:
      var value = new vehicle_pb.VehicleState.GuestMode;
      reader.readMessage(value,vehicle_pb.VehicleState.GuestMode.deserializeBinaryFromReader);
      msg.setGuestmodeaction(value);
      break;
    case 66:
      var value = new proto.CarServer.SetCopTempAction;
      reader.readMessage(value,proto.CarServer.SetCopTempAction.deserializeBinaryFromReader);
      msg.setSetcoptempaction(value);
      break;
    case 72:
      var value = new proto.CarServer.EraseUserDataAction;
      reader.readMessage(value,proto.CarServer.EraseUserDataAction.deserializeBinaryFromReader);
      msg.setEraseuserdataaction(value);
      break;
    case 77:
      var value = new proto.CarServer.VehicleControlSetPinToDriveAction;
      reader.readMessage(value,proto.CarServer.VehicleControlSetPinToDriveAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolsetpintodriveaction(value);
      break;
    case 78:
      var value = new proto.CarServer.VehicleControlResetPinToDriveAction;
      reader.readMessage(value,proto.CarServer.VehicleControlResetPinToDriveAction.deserializeBinaryFromReader);
      msg.setVehiclecontrolresetpintodriveaction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getChargingsetlimitaction();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.CarServer.ChargingSetLimitAction.serializeBinaryToWriter
    );
  }
  f = message.getChargingstartstopaction();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      proto.CarServer.ChargingStartStopAction.serializeBinaryToWriter
    );
  }
  f = message.getDrivingclearspeedlimitpinaction();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      proto.CarServer.DrivingClearSpeedLimitPinAction.serializeBinaryToWriter
    );
  }
  f = message.getDrivingsetspeedlimitaction();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      proto.CarServer.DrivingSetSpeedLimitAction.serializeBinaryToWriter
    );
  }
  f = message.getDrivingspeedlimitaction();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.CarServer.DrivingSpeedLimitAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacautoaction();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      proto.CarServer.HvacAutoAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacsetpreconditioningmaxaction();
  if (f != null) {
    writer.writeMessage(
      12,
      f,
      proto.CarServer.HvacSetPreconditioningMaxAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacsteeringwheelheateraction();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      proto.CarServer.HvacSteeringWheelHeaterAction.serializeBinaryToWriter
    );
  }
  f = message.getHvactemperatureadjustmentaction();
  if (f != null) {
    writer.writeMessage(
      14,
      f,
      proto.CarServer.HvacTemperatureAdjustmentAction.serializeBinaryToWriter
    );
  }
  f = message.getMediaupdatevolume();
  if (f != null) {
    writer.writeMessage(
      16,
      f,
      proto.CarServer.MediaUpdateVolume.serializeBinaryToWriter
    );
  }
  f = message.getMedianextfavorite();
  if (f != null) {
    writer.writeMessage(
      17,
      f,
      proto.CarServer.MediaNextFavorite.serializeBinaryToWriter
    );
  }
  f = message.getMediapreviousfavorite();
  if (f != null) {
    writer.writeMessage(
      18,
      f,
      proto.CarServer.MediaPreviousFavorite.serializeBinaryToWriter
    );
  }
  f = message.getMedianexttrack();
  if (f != null) {
    writer.writeMessage(
      19,
      f,
      proto.CarServer.MediaNextTrack.serializeBinaryToWriter
    );
  }
  f = message.getMediaprevioustrack();
  if (f != null) {
    writer.writeMessage(
      20,
      f,
      proto.CarServer.MediaPreviousTrack.serializeBinaryToWriter
    );
  }
  f = message.getGetnearbychargingsites();
  if (f != null) {
    writer.writeMessage(
      23,
      f,
      proto.CarServer.GetNearbyChargingSites.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolcancelsoftwareupdateaction();
  if (f != null) {
    writer.writeMessage(
      25,
      f,
      proto.CarServer.VehicleControlCancelSoftwareUpdateAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolflashlightsaction();
  if (f != null) {
    writer.writeMessage(
      26,
      f,
      proto.CarServer.VehicleControlFlashLightsAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolhonkhornaction();
  if (f != null) {
    writer.writeMessage(
      27,
      f,
      proto.CarServer.VehicleControlHonkHornAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolresetvaletpinaction();
  if (f != null) {
    writer.writeMessage(
      28,
      f,
      proto.CarServer.VehicleControlResetValetPinAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolschedulesoftwareupdateaction();
  if (f != null) {
    writer.writeMessage(
      29,
      f,
      proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolsetsentrymodeaction();
  if (f != null) {
    writer.writeMessage(
      30,
      f,
      proto.CarServer.VehicleControlSetSentryModeAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolsetvaletmodeaction();
  if (f != null) {
    writer.writeMessage(
      31,
      f,
      proto.CarServer.VehicleControlSetValetModeAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolsunroofopencloseaction();
  if (f != null) {
    writer.writeMessage(
      32,
      f,
      proto.CarServer.VehicleControlSunroofOpenCloseAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontroltriggerhomelinkaction();
  if (f != null) {
    writer.writeMessage(
      33,
      f,
      proto.CarServer.VehicleControlTriggerHomelinkAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolwindowaction();
  if (f != null) {
    writer.writeMessage(
      34,
      f,
      proto.CarServer.VehicleControlWindowAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacbioweaponmodeaction();
  if (f != null) {
    writer.writeMessage(
      35,
      f,
      proto.CarServer.HvacBioweaponModeAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacseatheateractions();
  if (f != null) {
    writer.writeMessage(
      36,
      f,
      proto.CarServer.HvacSeatHeaterActions.serializeBinaryToWriter
    );
  }
  f = message.getScheduledchargingaction();
  if (f != null) {
    writer.writeMessage(
      41,
      f,
      proto.CarServer.ScheduledChargingAction.serializeBinaryToWriter
    );
  }
  f = message.getScheduleddepartureaction();
  if (f != null) {
    writer.writeMessage(
      42,
      f,
      proto.CarServer.ScheduledDepartureAction.serializeBinaryToWriter
    );
  }
  f = message.getSetchargingampsaction();
  if (f != null) {
    writer.writeMessage(
      43,
      f,
      proto.CarServer.SetChargingAmpsAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacclimatekeeperaction();
  if (f != null) {
    writer.writeMessage(
      44,
      f,
      proto.CarServer.HvacClimateKeeperAction.serializeBinaryToWriter
    );
  }
  f = message.getPing();
  if (f != null) {
    writer.writeMessage(
      46,
      f,
      proto.CarServer.Ping.serializeBinaryToWriter
    );
  }
  f = message.getAutoseatclimateaction();
  if (f != null) {
    writer.writeMessage(
      48,
      f,
      proto.CarServer.AutoSeatClimateAction.serializeBinaryToWriter
    );
  }
  f = message.getHvacseatcooleractions();
  if (f != null) {
    writer.writeMessage(
      49,
      f,
      proto.CarServer.HvacSeatCoolerActions.serializeBinaryToWriter
    );
  }
  f = message.getSetcabinoverheatprotectionaction();
  if (f != null) {
    writer.writeMessage(
      50,
      f,
      proto.CarServer.SetCabinOverheatProtectionAction.serializeBinaryToWriter
    );
  }
  f = message.getSetvehiclenameaction();
  if (f != null) {
    writer.writeMessage(
      54,
      f,
      proto.CarServer.SetVehicleNameAction.serializeBinaryToWriter
    );
  }
  f = message.getChargeportdoorclose();
  if (f != null) {
    writer.writeMessage(
      61,
      f,
      proto.CarServer.ChargePortDoorClose.serializeBinaryToWriter
    );
  }
  f = message.getChargeportdooropen();
  if (f != null) {
    writer.writeMessage(
      62,
      f,
      proto.CarServer.ChargePortDoorOpen.serializeBinaryToWriter
    );
  }
  f = message.getGuestmodeaction();
  if (f != null) {
    writer.writeMessage(
      65,
      f,
      vehicle_pb.VehicleState.GuestMode.serializeBinaryToWriter
    );
  }
  f = message.getSetcoptempaction();
  if (f != null) {
    writer.writeMessage(
      66,
      f,
      proto.CarServer.SetCopTempAction.serializeBinaryToWriter
    );
  }
  f = message.getEraseuserdataaction();
  if (f != null) {
    writer.writeMessage(
      72,
      f,
      proto.CarServer.EraseUserDataAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolsetpintodriveaction();
  if (f != null) {
    writer.writeMessage(
      77,
      f,
      proto.CarServer.VehicleControlSetPinToDriveAction.serializeBinaryToWriter
    );
  }
  f = message.getVehiclecontrolresetpintodriveaction();
  if (f != null) {
    writer.writeMessage(
      78,
      f,
      proto.CarServer.VehicleControlResetPinToDriveAction.serializeBinaryToWriter
    );
  }
};


/**
 * optional ChargingSetLimitAction chargingSetLimitAction = 5;
 * @return {?proto.CarServer.ChargingSetLimitAction}
 */
proto.CarServer.VehicleAction.prototype.getChargingsetlimitaction = function() {
  return /** @type{?proto.CarServer.ChargingSetLimitAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ChargingSetLimitAction, 5));
};


/**
 * @param {?proto.CarServer.ChargingSetLimitAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setChargingsetlimitaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearChargingsetlimitaction = function() {
  return this.setChargingsetlimitaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasChargingsetlimitaction = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional ChargingStartStopAction chargingStartStopAction = 6;
 * @return {?proto.CarServer.ChargingStartStopAction}
 */
proto.CarServer.VehicleAction.prototype.getChargingstartstopaction = function() {
  return /** @type{?proto.CarServer.ChargingStartStopAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ChargingStartStopAction, 6));
};


/**
 * @param {?proto.CarServer.ChargingStartStopAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setChargingstartstopaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearChargingstartstopaction = function() {
  return this.setChargingstartstopaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasChargingstartstopaction = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional DrivingClearSpeedLimitPinAction drivingClearSpeedLimitPinAction = 7;
 * @return {?proto.CarServer.DrivingClearSpeedLimitPinAction}
 */
proto.CarServer.VehicleAction.prototype.getDrivingclearspeedlimitpinaction = function() {
  return /** @type{?proto.CarServer.DrivingClearSpeedLimitPinAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.DrivingClearSpeedLimitPinAction, 7));
};


/**
 * @param {?proto.CarServer.DrivingClearSpeedLimitPinAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setDrivingclearspeedlimitpinaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearDrivingclearspeedlimitpinaction = function() {
  return this.setDrivingclearspeedlimitpinaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasDrivingclearspeedlimitpinaction = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional DrivingSetSpeedLimitAction drivingSetSpeedLimitAction = 8;
 * @return {?proto.CarServer.DrivingSetSpeedLimitAction}
 */
proto.CarServer.VehicleAction.prototype.getDrivingsetspeedlimitaction = function() {
  return /** @type{?proto.CarServer.DrivingSetSpeedLimitAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.DrivingSetSpeedLimitAction, 8));
};


/**
 * @param {?proto.CarServer.DrivingSetSpeedLimitAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setDrivingsetspeedlimitaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearDrivingsetspeedlimitaction = function() {
  return this.setDrivingsetspeedlimitaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasDrivingsetspeedlimitaction = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional DrivingSpeedLimitAction drivingSpeedLimitAction = 9;
 * @return {?proto.CarServer.DrivingSpeedLimitAction}
 */
proto.CarServer.VehicleAction.prototype.getDrivingspeedlimitaction = function() {
  return /** @type{?proto.CarServer.DrivingSpeedLimitAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.DrivingSpeedLimitAction, 9));
};


/**
 * @param {?proto.CarServer.DrivingSpeedLimitAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setDrivingspeedlimitaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearDrivingspeedlimitaction = function() {
  return this.setDrivingspeedlimitaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasDrivingspeedlimitaction = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional HvacAutoAction hvacAutoAction = 10;
 * @return {?proto.CarServer.HvacAutoAction}
 */
proto.CarServer.VehicleAction.prototype.getHvacautoaction = function() {
  return /** @type{?proto.CarServer.HvacAutoAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacAutoAction, 10));
};


/**
 * @param {?proto.CarServer.HvacAutoAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacautoaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacautoaction = function() {
  return this.setHvacautoaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacautoaction = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional HvacSetPreconditioningMaxAction hvacSetPreconditioningMaxAction = 12;
 * @return {?proto.CarServer.HvacSetPreconditioningMaxAction}
 */
proto.CarServer.VehicleAction.prototype.getHvacsetpreconditioningmaxaction = function() {
  return /** @type{?proto.CarServer.HvacSetPreconditioningMaxAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacSetPreconditioningMaxAction, 12));
};


/**
 * @param {?proto.CarServer.HvacSetPreconditioningMaxAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacsetpreconditioningmaxaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 12, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacsetpreconditioningmaxaction = function() {
  return this.setHvacsetpreconditioningmaxaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacsetpreconditioningmaxaction = function() {
  return jspb.Message.getField(this, 12) != null;
};


/**
 * optional HvacSteeringWheelHeaterAction hvacSteeringWheelHeaterAction = 13;
 * @return {?proto.CarServer.HvacSteeringWheelHeaterAction}
 */
proto.CarServer.VehicleAction.prototype.getHvacsteeringwheelheateraction = function() {
  return /** @type{?proto.CarServer.HvacSteeringWheelHeaterAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacSteeringWheelHeaterAction, 13));
};


/**
 * @param {?proto.CarServer.HvacSteeringWheelHeaterAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacsteeringwheelheateraction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 13, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacsteeringwheelheateraction = function() {
  return this.setHvacsteeringwheelheateraction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacsteeringwheelheateraction = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional HvacTemperatureAdjustmentAction hvacTemperatureAdjustmentAction = 14;
 * @return {?proto.CarServer.HvacTemperatureAdjustmentAction}
 */
proto.CarServer.VehicleAction.prototype.getHvactemperatureadjustmentaction = function() {
  return /** @type{?proto.CarServer.HvacTemperatureAdjustmentAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacTemperatureAdjustmentAction, 14));
};


/**
 * @param {?proto.CarServer.HvacTemperatureAdjustmentAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvactemperatureadjustmentaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 14, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvactemperatureadjustmentaction = function() {
  return this.setHvactemperatureadjustmentaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvactemperatureadjustmentaction = function() {
  return jspb.Message.getField(this, 14) != null;
};


/**
 * optional MediaUpdateVolume mediaUpdateVolume = 16;
 * @return {?proto.CarServer.MediaUpdateVolume}
 */
proto.CarServer.VehicleAction.prototype.getMediaupdatevolume = function() {
  return /** @type{?proto.CarServer.MediaUpdateVolume} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.MediaUpdateVolume, 16));
};


/**
 * @param {?proto.CarServer.MediaUpdateVolume|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setMediaupdatevolume = function(value) {
  return jspb.Message.setOneofWrapperField(this, 16, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearMediaupdatevolume = function() {
  return this.setMediaupdatevolume(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasMediaupdatevolume = function() {
  return jspb.Message.getField(this, 16) != null;
};


/**
 * optional MediaNextFavorite mediaNextFavorite = 17;
 * @return {?proto.CarServer.MediaNextFavorite}
 */
proto.CarServer.VehicleAction.prototype.getMedianextfavorite = function() {
  return /** @type{?proto.CarServer.MediaNextFavorite} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.MediaNextFavorite, 17));
};


/**
 * @param {?proto.CarServer.MediaNextFavorite|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setMedianextfavorite = function(value) {
  return jspb.Message.setOneofWrapperField(this, 17, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearMedianextfavorite = function() {
  return this.setMedianextfavorite(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasMedianextfavorite = function() {
  return jspb.Message.getField(this, 17) != null;
};


/**
 * optional MediaPreviousFavorite mediaPreviousFavorite = 18;
 * @return {?proto.CarServer.MediaPreviousFavorite}
 */
proto.CarServer.VehicleAction.prototype.getMediapreviousfavorite = function() {
  return /** @type{?proto.CarServer.MediaPreviousFavorite} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.MediaPreviousFavorite, 18));
};


/**
 * @param {?proto.CarServer.MediaPreviousFavorite|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setMediapreviousfavorite = function(value) {
  return jspb.Message.setOneofWrapperField(this, 18, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearMediapreviousfavorite = function() {
  return this.setMediapreviousfavorite(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasMediapreviousfavorite = function() {
  return jspb.Message.getField(this, 18) != null;
};


/**
 * optional MediaNextTrack mediaNextTrack = 19;
 * @return {?proto.CarServer.MediaNextTrack}
 */
proto.CarServer.VehicleAction.prototype.getMedianexttrack = function() {
  return /** @type{?proto.CarServer.MediaNextTrack} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.MediaNextTrack, 19));
};


/**
 * @param {?proto.CarServer.MediaNextTrack|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setMedianexttrack = function(value) {
  return jspb.Message.setOneofWrapperField(this, 19, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearMedianexttrack = function() {
  return this.setMedianexttrack(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasMedianexttrack = function() {
  return jspb.Message.getField(this, 19) != null;
};


/**
 * optional MediaPreviousTrack mediaPreviousTrack = 20;
 * @return {?proto.CarServer.MediaPreviousTrack}
 */
proto.CarServer.VehicleAction.prototype.getMediaprevioustrack = function() {
  return /** @type{?proto.CarServer.MediaPreviousTrack} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.MediaPreviousTrack, 20));
};


/**
 * @param {?proto.CarServer.MediaPreviousTrack|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setMediaprevioustrack = function(value) {
  return jspb.Message.setOneofWrapperField(this, 20, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearMediaprevioustrack = function() {
  return this.setMediaprevioustrack(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasMediaprevioustrack = function() {
  return jspb.Message.getField(this, 20) != null;
};


/**
 * optional GetNearbyChargingSites getNearbyChargingSites = 23;
 * @return {?proto.CarServer.GetNearbyChargingSites}
 */
proto.CarServer.VehicleAction.prototype.getGetnearbychargingsites = function() {
  return /** @type{?proto.CarServer.GetNearbyChargingSites} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.GetNearbyChargingSites, 23));
};


/**
 * @param {?proto.CarServer.GetNearbyChargingSites|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setGetnearbychargingsites = function(value) {
  return jspb.Message.setOneofWrapperField(this, 23, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearGetnearbychargingsites = function() {
  return this.setGetnearbychargingsites(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasGetnearbychargingsites = function() {
  return jspb.Message.getField(this, 23) != null;
};


/**
 * optional VehicleControlCancelSoftwareUpdateAction vehicleControlCancelSoftwareUpdateAction = 25;
 * @return {?proto.CarServer.VehicleControlCancelSoftwareUpdateAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolcancelsoftwareupdateaction = function() {
  return /** @type{?proto.CarServer.VehicleControlCancelSoftwareUpdateAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlCancelSoftwareUpdateAction, 25));
};


/**
 * @param {?proto.CarServer.VehicleControlCancelSoftwareUpdateAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolcancelsoftwareupdateaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 25, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolcancelsoftwareupdateaction = function() {
  return this.setVehiclecontrolcancelsoftwareupdateaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolcancelsoftwareupdateaction = function() {
  return jspb.Message.getField(this, 25) != null;
};


/**
 * optional VehicleControlFlashLightsAction vehicleControlFlashLightsAction = 26;
 * @return {?proto.CarServer.VehicleControlFlashLightsAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolflashlightsaction = function() {
  return /** @type{?proto.CarServer.VehicleControlFlashLightsAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlFlashLightsAction, 26));
};


/**
 * @param {?proto.CarServer.VehicleControlFlashLightsAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolflashlightsaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 26, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolflashlightsaction = function() {
  return this.setVehiclecontrolflashlightsaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolflashlightsaction = function() {
  return jspb.Message.getField(this, 26) != null;
};


/**
 * optional VehicleControlHonkHornAction vehicleControlHonkHornAction = 27;
 * @return {?proto.CarServer.VehicleControlHonkHornAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolhonkhornaction = function() {
  return /** @type{?proto.CarServer.VehicleControlHonkHornAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlHonkHornAction, 27));
};


/**
 * @param {?proto.CarServer.VehicleControlHonkHornAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolhonkhornaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 27, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolhonkhornaction = function() {
  return this.setVehiclecontrolhonkhornaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolhonkhornaction = function() {
  return jspb.Message.getField(this, 27) != null;
};


/**
 * optional VehicleControlResetValetPinAction vehicleControlResetValetPinAction = 28;
 * @return {?proto.CarServer.VehicleControlResetValetPinAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolresetvaletpinaction = function() {
  return /** @type{?proto.CarServer.VehicleControlResetValetPinAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlResetValetPinAction, 28));
};


/**
 * @param {?proto.CarServer.VehicleControlResetValetPinAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolresetvaletpinaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 28, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolresetvaletpinaction = function() {
  return this.setVehiclecontrolresetvaletpinaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolresetvaletpinaction = function() {
  return jspb.Message.getField(this, 28) != null;
};


/**
 * optional VehicleControlScheduleSoftwareUpdateAction vehicleControlScheduleSoftwareUpdateAction = 29;
 * @return {?proto.CarServer.VehicleControlScheduleSoftwareUpdateAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolschedulesoftwareupdateaction = function() {
  return /** @type{?proto.CarServer.VehicleControlScheduleSoftwareUpdateAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlScheduleSoftwareUpdateAction, 29));
};


/**
 * @param {?proto.CarServer.VehicleControlScheduleSoftwareUpdateAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolschedulesoftwareupdateaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 29, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolschedulesoftwareupdateaction = function() {
  return this.setVehiclecontrolschedulesoftwareupdateaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolschedulesoftwareupdateaction = function() {
  return jspb.Message.getField(this, 29) != null;
};


/**
 * optional VehicleControlSetSentryModeAction vehicleControlSetSentryModeAction = 30;
 * @return {?proto.CarServer.VehicleControlSetSentryModeAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolsetsentrymodeaction = function() {
  return /** @type{?proto.CarServer.VehicleControlSetSentryModeAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlSetSentryModeAction, 30));
};


/**
 * @param {?proto.CarServer.VehicleControlSetSentryModeAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolsetsentrymodeaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 30, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolsetsentrymodeaction = function() {
  return this.setVehiclecontrolsetsentrymodeaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolsetsentrymodeaction = function() {
  return jspb.Message.getField(this, 30) != null;
};


/**
 * optional VehicleControlSetValetModeAction vehicleControlSetValetModeAction = 31;
 * @return {?proto.CarServer.VehicleControlSetValetModeAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolsetvaletmodeaction = function() {
  return /** @type{?proto.CarServer.VehicleControlSetValetModeAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlSetValetModeAction, 31));
};


/**
 * @param {?proto.CarServer.VehicleControlSetValetModeAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolsetvaletmodeaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 31, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolsetvaletmodeaction = function() {
  return this.setVehiclecontrolsetvaletmodeaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolsetvaletmodeaction = function() {
  return jspb.Message.getField(this, 31) != null;
};


/**
 * optional VehicleControlSunroofOpenCloseAction vehicleControlSunroofOpenCloseAction = 32;
 * @return {?proto.CarServer.VehicleControlSunroofOpenCloseAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolsunroofopencloseaction = function() {
  return /** @type{?proto.CarServer.VehicleControlSunroofOpenCloseAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlSunroofOpenCloseAction, 32));
};


/**
 * @param {?proto.CarServer.VehicleControlSunroofOpenCloseAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolsunroofopencloseaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 32, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolsunroofopencloseaction = function() {
  return this.setVehiclecontrolsunroofopencloseaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolsunroofopencloseaction = function() {
  return jspb.Message.getField(this, 32) != null;
};


/**
 * optional VehicleControlTriggerHomelinkAction vehicleControlTriggerHomelinkAction = 33;
 * @return {?proto.CarServer.VehicleControlTriggerHomelinkAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontroltriggerhomelinkaction = function() {
  return /** @type{?proto.CarServer.VehicleControlTriggerHomelinkAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlTriggerHomelinkAction, 33));
};


/**
 * @param {?proto.CarServer.VehicleControlTriggerHomelinkAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontroltriggerhomelinkaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 33, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontroltriggerhomelinkaction = function() {
  return this.setVehiclecontroltriggerhomelinkaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontroltriggerhomelinkaction = function() {
  return jspb.Message.getField(this, 33) != null;
};


/**
 * optional VehicleControlWindowAction vehicleControlWindowAction = 34;
 * @return {?proto.CarServer.VehicleControlWindowAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolwindowaction = function() {
  return /** @type{?proto.CarServer.VehicleControlWindowAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlWindowAction, 34));
};


/**
 * @param {?proto.CarServer.VehicleControlWindowAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolwindowaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 34, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolwindowaction = function() {
  return this.setVehiclecontrolwindowaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolwindowaction = function() {
  return jspb.Message.getField(this, 34) != null;
};


/**
 * optional HvacBioweaponModeAction hvacBioweaponModeAction = 35;
 * @return {?proto.CarServer.HvacBioweaponModeAction}
 */
proto.CarServer.VehicleAction.prototype.getHvacbioweaponmodeaction = function() {
  return /** @type{?proto.CarServer.HvacBioweaponModeAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacBioweaponModeAction, 35));
};


/**
 * @param {?proto.CarServer.HvacBioweaponModeAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacbioweaponmodeaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 35, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacbioweaponmodeaction = function() {
  return this.setHvacbioweaponmodeaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacbioweaponmodeaction = function() {
  return jspb.Message.getField(this, 35) != null;
};


/**
 * optional HvacSeatHeaterActions hvacSeatHeaterActions = 36;
 * @return {?proto.CarServer.HvacSeatHeaterActions}
 */
proto.CarServer.VehicleAction.prototype.getHvacseatheateractions = function() {
  return /** @type{?proto.CarServer.HvacSeatHeaterActions} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacSeatHeaterActions, 36));
};


/**
 * @param {?proto.CarServer.HvacSeatHeaterActions|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacseatheateractions = function(value) {
  return jspb.Message.setOneofWrapperField(this, 36, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacseatheateractions = function() {
  return this.setHvacseatheateractions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacseatheateractions = function() {
  return jspb.Message.getField(this, 36) != null;
};


/**
 * optional ScheduledChargingAction scheduledChargingAction = 41;
 * @return {?proto.CarServer.ScheduledChargingAction}
 */
proto.CarServer.VehicleAction.prototype.getScheduledchargingaction = function() {
  return /** @type{?proto.CarServer.ScheduledChargingAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ScheduledChargingAction, 41));
};


/**
 * @param {?proto.CarServer.ScheduledChargingAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setScheduledchargingaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 41, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearScheduledchargingaction = function() {
  return this.setScheduledchargingaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasScheduledchargingaction = function() {
  return jspb.Message.getField(this, 41) != null;
};


/**
 * optional ScheduledDepartureAction scheduledDepartureAction = 42;
 * @return {?proto.CarServer.ScheduledDepartureAction}
 */
proto.CarServer.VehicleAction.prototype.getScheduleddepartureaction = function() {
  return /** @type{?proto.CarServer.ScheduledDepartureAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ScheduledDepartureAction, 42));
};


/**
 * @param {?proto.CarServer.ScheduledDepartureAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setScheduleddepartureaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 42, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearScheduleddepartureaction = function() {
  return this.setScheduleddepartureaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasScheduleddepartureaction = function() {
  return jspb.Message.getField(this, 42) != null;
};


/**
 * optional SetChargingAmpsAction setChargingAmpsAction = 43;
 * @return {?proto.CarServer.SetChargingAmpsAction}
 */
proto.CarServer.VehicleAction.prototype.getSetchargingampsaction = function() {
  return /** @type{?proto.CarServer.SetChargingAmpsAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.SetChargingAmpsAction, 43));
};


/**
 * @param {?proto.CarServer.SetChargingAmpsAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setSetchargingampsaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 43, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearSetchargingampsaction = function() {
  return this.setSetchargingampsaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasSetchargingampsaction = function() {
  return jspb.Message.getField(this, 43) != null;
};


/**
 * optional HvacClimateKeeperAction hvacClimateKeeperAction = 44;
 * @return {?proto.CarServer.HvacClimateKeeperAction}
 */
proto.CarServer.VehicleAction.prototype.getHvacclimatekeeperaction = function() {
  return /** @type{?proto.CarServer.HvacClimateKeeperAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacClimateKeeperAction, 44));
};


/**
 * @param {?proto.CarServer.HvacClimateKeeperAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacclimatekeeperaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 44, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacclimatekeeperaction = function() {
  return this.setHvacclimatekeeperaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacclimatekeeperaction = function() {
  return jspb.Message.getField(this, 44) != null;
};


/**
 * optional Ping ping = 46;
 * @return {?proto.CarServer.Ping}
 */
proto.CarServer.VehicleAction.prototype.getPing = function() {
  return /** @type{?proto.CarServer.Ping} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.Ping, 46));
};


/**
 * @param {?proto.CarServer.Ping|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setPing = function(value) {
  return jspb.Message.setOneofWrapperField(this, 46, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearPing = function() {
  return this.setPing(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasPing = function() {
  return jspb.Message.getField(this, 46) != null;
};


/**
 * optional AutoSeatClimateAction autoSeatClimateAction = 48;
 * @return {?proto.CarServer.AutoSeatClimateAction}
 */
proto.CarServer.VehicleAction.prototype.getAutoseatclimateaction = function() {
  return /** @type{?proto.CarServer.AutoSeatClimateAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.AutoSeatClimateAction, 48));
};


/**
 * @param {?proto.CarServer.AutoSeatClimateAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setAutoseatclimateaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 48, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearAutoseatclimateaction = function() {
  return this.setAutoseatclimateaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasAutoseatclimateaction = function() {
  return jspb.Message.getField(this, 48) != null;
};


/**
 * optional HvacSeatCoolerActions hvacSeatCoolerActions = 49;
 * @return {?proto.CarServer.HvacSeatCoolerActions}
 */
proto.CarServer.VehicleAction.prototype.getHvacseatcooleractions = function() {
  return /** @type{?proto.CarServer.HvacSeatCoolerActions} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacSeatCoolerActions, 49));
};


/**
 * @param {?proto.CarServer.HvacSeatCoolerActions|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setHvacseatcooleractions = function(value) {
  return jspb.Message.setOneofWrapperField(this, 49, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearHvacseatcooleractions = function() {
  return this.setHvacseatcooleractions(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasHvacseatcooleractions = function() {
  return jspb.Message.getField(this, 49) != null;
};


/**
 * optional SetCabinOverheatProtectionAction setCabinOverheatProtectionAction = 50;
 * @return {?proto.CarServer.SetCabinOverheatProtectionAction}
 */
proto.CarServer.VehicleAction.prototype.getSetcabinoverheatprotectionaction = function() {
  return /** @type{?proto.CarServer.SetCabinOverheatProtectionAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.SetCabinOverheatProtectionAction, 50));
};


/**
 * @param {?proto.CarServer.SetCabinOverheatProtectionAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setSetcabinoverheatprotectionaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 50, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearSetcabinoverheatprotectionaction = function() {
  return this.setSetcabinoverheatprotectionaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasSetcabinoverheatprotectionaction = function() {
  return jspb.Message.getField(this, 50) != null;
};


/**
 * optional SetVehicleNameAction setVehicleNameAction = 54;
 * @return {?proto.CarServer.SetVehicleNameAction}
 */
proto.CarServer.VehicleAction.prototype.getSetvehiclenameaction = function() {
  return /** @type{?proto.CarServer.SetVehicleNameAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.SetVehicleNameAction, 54));
};


/**
 * @param {?proto.CarServer.SetVehicleNameAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setSetvehiclenameaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 54, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearSetvehiclenameaction = function() {
  return this.setSetvehiclenameaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasSetvehiclenameaction = function() {
  return jspb.Message.getField(this, 54) != null;
};


/**
 * optional ChargePortDoorClose chargePortDoorClose = 61;
 * @return {?proto.CarServer.ChargePortDoorClose}
 */
proto.CarServer.VehicleAction.prototype.getChargeportdoorclose = function() {
  return /** @type{?proto.CarServer.ChargePortDoorClose} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ChargePortDoorClose, 61));
};


/**
 * @param {?proto.CarServer.ChargePortDoorClose|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setChargeportdoorclose = function(value) {
  return jspb.Message.setOneofWrapperField(this, 61, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearChargeportdoorclose = function() {
  return this.setChargeportdoorclose(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasChargeportdoorclose = function() {
  return jspb.Message.getField(this, 61) != null;
};


/**
 * optional ChargePortDoorOpen chargePortDoorOpen = 62;
 * @return {?proto.CarServer.ChargePortDoorOpen}
 */
proto.CarServer.VehicleAction.prototype.getChargeportdooropen = function() {
  return /** @type{?proto.CarServer.ChargePortDoorOpen} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ChargePortDoorOpen, 62));
};


/**
 * @param {?proto.CarServer.ChargePortDoorOpen|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setChargeportdooropen = function(value) {
  return jspb.Message.setOneofWrapperField(this, 62, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearChargeportdooropen = function() {
  return this.setChargeportdooropen(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasChargeportdooropen = function() {
  return jspb.Message.getField(this, 62) != null;
};


/**
 * optional VehicleState.GuestMode guestModeAction = 65;
 * @return {?proto.CarServer.VehicleState.GuestMode}
 */
proto.CarServer.VehicleAction.prototype.getGuestmodeaction = function() {
  return /** @type{?proto.CarServer.VehicleState.GuestMode} */ (
    jspb.Message.getWrapperField(this, vehicle_pb.VehicleState.GuestMode, 65));
};


/**
 * @param {?proto.CarServer.VehicleState.GuestMode|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setGuestmodeaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 65, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearGuestmodeaction = function() {
  return this.setGuestmodeaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasGuestmodeaction = function() {
  return jspb.Message.getField(this, 65) != null;
};


/**
 * optional SetCopTempAction setCopTempAction = 66;
 * @return {?proto.CarServer.SetCopTempAction}
 */
proto.CarServer.VehicleAction.prototype.getSetcoptempaction = function() {
  return /** @type{?proto.CarServer.SetCopTempAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.SetCopTempAction, 66));
};


/**
 * @param {?proto.CarServer.SetCopTempAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setSetcoptempaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 66, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearSetcoptempaction = function() {
  return this.setSetcoptempaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasSetcoptempaction = function() {
  return jspb.Message.getField(this, 66) != null;
};


/**
 * optional EraseUserDataAction eraseUserDataAction = 72;
 * @return {?proto.CarServer.EraseUserDataAction}
 */
proto.CarServer.VehicleAction.prototype.getEraseuserdataaction = function() {
  return /** @type{?proto.CarServer.EraseUserDataAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.EraseUserDataAction, 72));
};


/**
 * @param {?proto.CarServer.EraseUserDataAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setEraseuserdataaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 72, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearEraseuserdataaction = function() {
  return this.setEraseuserdataaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasEraseuserdataaction = function() {
  return jspb.Message.getField(this, 72) != null;
};


/**
 * optional VehicleControlSetPinToDriveAction vehicleControlSetPinToDriveAction = 77;
 * @return {?proto.CarServer.VehicleControlSetPinToDriveAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolsetpintodriveaction = function() {
  return /** @type{?proto.CarServer.VehicleControlSetPinToDriveAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlSetPinToDriveAction, 77));
};


/**
 * @param {?proto.CarServer.VehicleControlSetPinToDriveAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolsetpintodriveaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 77, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolsetpintodriveaction = function() {
  return this.setVehiclecontrolsetpintodriveaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolsetpintodriveaction = function() {
  return jspb.Message.getField(this, 77) != null;
};


/**
 * optional VehicleControlResetPinToDriveAction vehicleControlResetPinToDriveAction = 78;
 * @return {?proto.CarServer.VehicleControlResetPinToDriveAction}
 */
proto.CarServer.VehicleAction.prototype.getVehiclecontrolresetpintodriveaction = function() {
  return /** @type{?proto.CarServer.VehicleControlResetPinToDriveAction} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.VehicleControlResetPinToDriveAction, 78));
};


/**
 * @param {?proto.CarServer.VehicleControlResetPinToDriveAction|undefined} value
 * @return {!proto.CarServer.VehicleAction} returns this
*/
proto.CarServer.VehicleAction.prototype.setVehiclecontrolresetpintodriveaction = function(value) {
  return jspb.Message.setOneofWrapperField(this, 78, proto.CarServer.VehicleAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleAction} returns this
 */
proto.CarServer.VehicleAction.prototype.clearVehiclecontrolresetpintodriveaction = function() {
  return this.setVehiclecontrolresetpintodriveaction(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleAction.prototype.hasVehiclecontrolresetpintodriveaction = function() {
  return jspb.Message.getField(this, 78) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.EraseUserDataAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.EraseUserDataAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.EraseUserDataAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.EraseUserDataAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    reason: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.EraseUserDataAction}
 */
proto.CarServer.EraseUserDataAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.EraseUserDataAction;
  return proto.CarServer.EraseUserDataAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.EraseUserDataAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.EraseUserDataAction}
 */
proto.CarServer.EraseUserDataAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setReason(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.EraseUserDataAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.EraseUserDataAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.EraseUserDataAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.EraseUserDataAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReason();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string reason = 1;
 * @return {string}
 */
proto.CarServer.EraseUserDataAction.prototype.getReason = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.EraseUserDataAction} returns this
 */
proto.CarServer.EraseUserDataAction.prototype.setReason = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.Response.oneofGroups_ = [[3,5,9]];

/**
 * @enum {number}
 */
proto.CarServer.Response.ResponseMsgCase = {
  RESPONSE_MSG_NOT_SET: 0,
  GETSESSIONINFORESPONSE: 3,
  GETNEARBYCHARGINGSITES: 5,
  PING: 9
};

/**
 * @return {proto.CarServer.Response.ResponseMsgCase}
 */
proto.CarServer.Response.prototype.getResponseMsgCase = function() {
  return /** @type {proto.CarServer.Response.ResponseMsgCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.Response.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.Response.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.Response.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.Response} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Response.toObject = function(includeInstance, msg) {
  var f, obj = {
    actionstatus: (f = msg.getActionstatus()) && proto.CarServer.ActionStatus.toObject(includeInstance, f),
    getsessioninforesponse: (f = msg.getGetsessioninforesponse()) && signatures_pb.SessionInfo.toObject(includeInstance, f),
    getnearbychargingsites: (f = msg.getGetnearbychargingsites()) && proto.CarServer.NearbyChargingSites.toObject(includeInstance, f),
    ping: (f = msg.getPing()) && proto.CarServer.Ping.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.Response}
 */
proto.CarServer.Response.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.Response;
  return proto.CarServer.Response.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.Response} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.Response}
 */
proto.CarServer.Response.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.CarServer.ActionStatus;
      reader.readMessage(value,proto.CarServer.ActionStatus.deserializeBinaryFromReader);
      msg.setActionstatus(value);
      break;
    case 3:
      var value = new signatures_pb.SessionInfo;
      reader.readMessage(value,signatures_pb.SessionInfo.deserializeBinaryFromReader);
      msg.setGetsessioninforesponse(value);
      break;
    case 5:
      var value = new proto.CarServer.NearbyChargingSites;
      reader.readMessage(value,proto.CarServer.NearbyChargingSites.deserializeBinaryFromReader);
      msg.setGetnearbychargingsites(value);
      break;
    case 9:
      var value = new proto.CarServer.Ping;
      reader.readMessage(value,proto.CarServer.Ping.deserializeBinaryFromReader);
      msg.setPing(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.Response.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.Response.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.Response} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Response.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActionstatus();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.CarServer.ActionStatus.serializeBinaryToWriter
    );
  }
  f = message.getGetsessioninforesponse();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      signatures_pb.SessionInfo.serializeBinaryToWriter
    );
  }
  f = message.getGetnearbychargingsites();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.CarServer.NearbyChargingSites.serializeBinaryToWriter
    );
  }
  f = message.getPing();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      proto.CarServer.Ping.serializeBinaryToWriter
    );
  }
};


/**
 * optional ActionStatus actionStatus = 1;
 * @return {?proto.CarServer.ActionStatus}
 */
proto.CarServer.Response.prototype.getActionstatus = function() {
  return /** @type{?proto.CarServer.ActionStatus} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ActionStatus, 1));
};


/**
 * @param {?proto.CarServer.ActionStatus|undefined} value
 * @return {!proto.CarServer.Response} returns this
*/
proto.CarServer.Response.prototype.setActionstatus = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Response} returns this
 */
proto.CarServer.Response.prototype.clearActionstatus = function() {
  return this.setActionstatus(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Response.prototype.hasActionstatus = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Signatures.SessionInfo getSessionInfoResponse = 3;
 * @return {?proto.Signatures.SessionInfo}
 */
proto.CarServer.Response.prototype.getGetsessioninforesponse = function() {
  return /** @type{?proto.Signatures.SessionInfo} */ (
    jspb.Message.getWrapperField(this, signatures_pb.SessionInfo, 3));
};


/**
 * @param {?proto.Signatures.SessionInfo|undefined} value
 * @return {!proto.CarServer.Response} returns this
*/
proto.CarServer.Response.prototype.setGetsessioninforesponse = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.Response.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Response} returns this
 */
proto.CarServer.Response.prototype.clearGetsessioninforesponse = function() {
  return this.setGetsessioninforesponse(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Response.prototype.hasGetsessioninforesponse = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional NearbyChargingSites getNearbyChargingSites = 5;
 * @return {?proto.CarServer.NearbyChargingSites}
 */
proto.CarServer.Response.prototype.getGetnearbychargingsites = function() {
  return /** @type{?proto.CarServer.NearbyChargingSites} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.NearbyChargingSites, 5));
};


/**
 * @param {?proto.CarServer.NearbyChargingSites|undefined} value
 * @return {!proto.CarServer.Response} returns this
*/
proto.CarServer.Response.prototype.setGetnearbychargingsites = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.CarServer.Response.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Response} returns this
 */
proto.CarServer.Response.prototype.clearGetnearbychargingsites = function() {
  return this.setGetnearbychargingsites(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Response.prototype.hasGetnearbychargingsites = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Ping ping = 9;
 * @return {?proto.CarServer.Ping}
 */
proto.CarServer.Response.prototype.getPing = function() {
  return /** @type{?proto.CarServer.Ping} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.Ping, 9));
};


/**
 * @param {?proto.CarServer.Ping|undefined} value
 * @return {!proto.CarServer.Response} returns this
*/
proto.CarServer.Response.prototype.setPing = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.CarServer.Response.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Response} returns this
 */
proto.CarServer.Response.prototype.clearPing = function() {
  return this.setPing(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Response.prototype.hasPing = function() {
  return jspb.Message.getField(this, 9) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ActionStatus.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ActionStatus.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ActionStatus} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ActionStatus.toObject = function(includeInstance, msg) {
  var f, obj = {
    result: jspb.Message.getFieldWithDefault(msg, 1, 0),
    resultReason: (f = msg.getResultReason()) && proto.CarServer.ResultReason.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ActionStatus}
 */
proto.CarServer.ActionStatus.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ActionStatus;
  return proto.CarServer.ActionStatus.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ActionStatus} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ActionStatus}
 */
proto.CarServer.ActionStatus.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.CarServer.OperationStatus_E} */ (reader.readEnum());
      msg.setResult(value);
      break;
    case 2:
      var value = new proto.CarServer.ResultReason;
      reader.readMessage(value,proto.CarServer.ResultReason.deserializeBinaryFromReader);
      msg.setResultReason(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ActionStatus.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ActionStatus.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ActionStatus} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ActionStatus.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResult();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getResultReason();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.CarServer.ResultReason.serializeBinaryToWriter
    );
  }
};


/**
 * optional OperationStatus_E result = 1;
 * @return {!proto.CarServer.OperationStatus_E}
 */
proto.CarServer.ActionStatus.prototype.getResult = function() {
  return /** @type {!proto.CarServer.OperationStatus_E} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.CarServer.OperationStatus_E} value
 * @return {!proto.CarServer.ActionStatus} returns this
 */
proto.CarServer.ActionStatus.prototype.setResult = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional ResultReason result_reason = 2;
 * @return {?proto.CarServer.ResultReason}
 */
proto.CarServer.ActionStatus.prototype.getResultReason = function() {
  return /** @type{?proto.CarServer.ResultReason} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.ResultReason, 2));
};


/**
 * @param {?proto.CarServer.ResultReason|undefined} value
 * @return {!proto.CarServer.ActionStatus} returns this
*/
proto.CarServer.ActionStatus.prototype.setResultReason = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ActionStatus} returns this
 */
proto.CarServer.ActionStatus.prototype.clearResultReason = function() {
  return this.setResultReason(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ActionStatus.prototype.hasResultReason = function() {
  return jspb.Message.getField(this, 2) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.ResultReason.oneofGroups_ = [[1]];

/**
 * @enum {number}
 */
proto.CarServer.ResultReason.ReasonCase = {
  REASON_NOT_SET: 0,
  PLAIN_TEXT: 1
};

/**
 * @return {proto.CarServer.ResultReason.ReasonCase}
 */
proto.CarServer.ResultReason.prototype.getReasonCase = function() {
  return /** @type {proto.CarServer.ResultReason.ReasonCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.ResultReason.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ResultReason.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ResultReason.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ResultReason} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ResultReason.toObject = function(includeInstance, msg) {
  var f, obj = {
    plainText: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ResultReason}
 */
proto.CarServer.ResultReason.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ResultReason;
  return proto.CarServer.ResultReason.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ResultReason} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ResultReason}
 */
proto.CarServer.ResultReason.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPlainText(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ResultReason.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ResultReason.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ResultReason} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ResultReason.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {string} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string plain_text = 1;
 * @return {string}
 */
proto.CarServer.ResultReason.prototype.getPlainText = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.ResultReason} returns this
 */
proto.CarServer.ResultReason.prototype.setPlainText = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.CarServer.ResultReason.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.CarServer.ResultReason} returns this
 */
proto.CarServer.ResultReason.prototype.clearPlainText = function() {
  return jspb.Message.setOneofField(this, 1, proto.CarServer.ResultReason.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ResultReason.prototype.hasPlainText = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.EncryptedData.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.EncryptedData.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.EncryptedData} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.EncryptedData.toObject = function(includeInstance, msg) {
  var f, obj = {
    fieldNumber: jspb.Message.getFieldWithDefault(msg, 1, 0),
    ciphertext: msg.getCiphertext_asB64(),
    tag: msg.getTag_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.EncryptedData}
 */
proto.CarServer.EncryptedData.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.EncryptedData;
  return proto.CarServer.EncryptedData.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.EncryptedData} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.EncryptedData}
 */
proto.CarServer.EncryptedData.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setFieldNumber(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setCiphertext(value);
      break;
    case 3:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setTag(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.EncryptedData.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.EncryptedData.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.EncryptedData} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.EncryptedData.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFieldNumber();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getCiphertext_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
  f = message.getTag_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      3,
      f
    );
  }
};


/**
 * optional int32 field_number = 1;
 * @return {number}
 */
proto.CarServer.EncryptedData.prototype.getFieldNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.EncryptedData} returns this
 */
proto.CarServer.EncryptedData.prototype.setFieldNumber = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional bytes ciphertext = 2;
 * @return {!(string|Uint8Array)}
 */
proto.CarServer.EncryptedData.prototype.getCiphertext = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes ciphertext = 2;
 * This is a type-conversion wrapper around `getCiphertext()`
 * @return {string}
 */
proto.CarServer.EncryptedData.prototype.getCiphertext_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getCiphertext()));
};


/**
 * optional bytes ciphertext = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getCiphertext()`
 * @return {!Uint8Array}
 */
proto.CarServer.EncryptedData.prototype.getCiphertext_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getCiphertext()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.CarServer.EncryptedData} returns this
 */
proto.CarServer.EncryptedData.prototype.setCiphertext = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};


/**
 * optional bytes tag = 3;
 * @return {!(string|Uint8Array)}
 */
proto.CarServer.EncryptedData.prototype.getTag = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * optional bytes tag = 3;
 * This is a type-conversion wrapper around `getTag()`
 * @return {string}
 */
proto.CarServer.EncryptedData.prototype.getTag_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getTag()));
};


/**
 * optional bytes tag = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTag()`
 * @return {!Uint8Array}
 */
proto.CarServer.EncryptedData.prototype.getTag_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getTag()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.CarServer.EncryptedData} returns this
 */
proto.CarServer.EncryptedData.prototype.setTag = function(value) {
  return jspb.Message.setProto3BytesField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ChargingSetLimitAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ChargingSetLimitAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ChargingSetLimitAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargingSetLimitAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    percent: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ChargingSetLimitAction}
 */
proto.CarServer.ChargingSetLimitAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ChargingSetLimitAction;
  return proto.CarServer.ChargingSetLimitAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ChargingSetLimitAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ChargingSetLimitAction}
 */
proto.CarServer.ChargingSetLimitAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPercent(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ChargingSetLimitAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ChargingSetLimitAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ChargingSetLimitAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargingSetLimitAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPercent();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
};


/**
 * optional int32 percent = 1;
 * @return {number}
 */
proto.CarServer.ChargingSetLimitAction.prototype.getPercent = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.ChargingSetLimitAction} returns this
 */
proto.CarServer.ChargingSetLimitAction.prototype.setPercent = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.ChargingStartStopAction.oneofGroups_ = [[1,2,3,4,5]];

/**
 * @enum {number}
 */
proto.CarServer.ChargingStartStopAction.ChargingActionCase = {
  CHARGING_ACTION_NOT_SET: 0,
  UNKNOWN: 1,
  START: 2,
  START_STANDARD: 3,
  START_MAX_RANGE: 4,
  STOP: 5
};

/**
 * @return {proto.CarServer.ChargingStartStopAction.ChargingActionCase}
 */
proto.CarServer.ChargingStartStopAction.prototype.getChargingActionCase = function() {
  return /** @type {proto.CarServer.ChargingStartStopAction.ChargingActionCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.ChargingStartStopAction.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ChargingStartStopAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ChargingStartStopAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ChargingStartStopAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargingStartStopAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    unknown: (f = msg.getUnknown()) && common_pb.Void.toObject(includeInstance, f),
    start: (f = msg.getStart()) && common_pb.Void.toObject(includeInstance, f),
    startStandard: (f = msg.getStartStandard()) && common_pb.Void.toObject(includeInstance, f),
    startMaxRange: (f = msg.getStartMaxRange()) && common_pb.Void.toObject(includeInstance, f),
    stop: (f = msg.getStop()) && common_pb.Void.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ChargingStartStopAction}
 */
proto.CarServer.ChargingStartStopAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ChargingStartStopAction;
  return proto.CarServer.ChargingStartStopAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ChargingStartStopAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ChargingStartStopAction}
 */
proto.CarServer.ChargingStartStopAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setUnknown(value);
      break;
    case 2:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setStart(value);
      break;
    case 3:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setStartStandard(value);
      break;
    case 4:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setStartMaxRange(value);
      break;
    case 5:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setStop(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ChargingStartStopAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ChargingStartStopAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ChargingStartStopAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargingStartStopAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUnknown();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getStart();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getStartStandard();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getStartMaxRange();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getStop();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
};


/**
 * optional Void unknown = 1;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.ChargingStartStopAction.prototype.getUnknown = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 1));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
*/
proto.CarServer.ChargingStartStopAction.prototype.setUnknown = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.CarServer.ChargingStartStopAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
 */
proto.CarServer.ChargingStartStopAction.prototype.clearUnknown = function() {
  return this.setUnknown(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ChargingStartStopAction.prototype.hasUnknown = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Void start = 2;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.ChargingStartStopAction.prototype.getStart = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 2));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
*/
proto.CarServer.ChargingStartStopAction.prototype.setStart = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.CarServer.ChargingStartStopAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
 */
proto.CarServer.ChargingStartStopAction.prototype.clearStart = function() {
  return this.setStart(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ChargingStartStopAction.prototype.hasStart = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Void start_standard = 3;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.ChargingStartStopAction.prototype.getStartStandard = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 3));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
*/
proto.CarServer.ChargingStartStopAction.prototype.setStartStandard = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.ChargingStartStopAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
 */
proto.CarServer.ChargingStartStopAction.prototype.clearStartStandard = function() {
  return this.setStartStandard(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ChargingStartStopAction.prototype.hasStartStandard = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Void start_max_range = 4;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.ChargingStartStopAction.prototype.getStartMaxRange = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 4));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
*/
proto.CarServer.ChargingStartStopAction.prototype.setStartMaxRange = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.CarServer.ChargingStartStopAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
 */
proto.CarServer.ChargingStartStopAction.prototype.clearStartMaxRange = function() {
  return this.setStartMaxRange(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ChargingStartStopAction.prototype.hasStartMaxRange = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Void stop = 5;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.ChargingStartStopAction.prototype.getStop = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 5));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
*/
proto.CarServer.ChargingStartStopAction.prototype.setStop = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.CarServer.ChargingStartStopAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ChargingStartStopAction} returns this
 */
proto.CarServer.ChargingStartStopAction.prototype.clearStop = function() {
  return this.setStop(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ChargingStartStopAction.prototype.hasStop = function() {
  return jspb.Message.getField(this, 5) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.DrivingClearSpeedLimitPinAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.DrivingClearSpeedLimitPinAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    pin: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.DrivingClearSpeedLimitPinAction}
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.DrivingClearSpeedLimitPinAction;
  return proto.CarServer.DrivingClearSpeedLimitPinAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.DrivingClearSpeedLimitPinAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.DrivingClearSpeedLimitPinAction}
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPin(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.DrivingClearSpeedLimitPinAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.DrivingClearSpeedLimitPinAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPin();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string pin = 1;
 * @return {string}
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.prototype.getPin = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.DrivingClearSpeedLimitPinAction} returns this
 */
proto.CarServer.DrivingClearSpeedLimitPinAction.prototype.setPin = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.DrivingSetSpeedLimitAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.DrivingSetSpeedLimitAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.DrivingSetSpeedLimitAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.DrivingSetSpeedLimitAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    limitMph: jspb.Message.getFloatingPointFieldWithDefault(msg, 1, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.DrivingSetSpeedLimitAction}
 */
proto.CarServer.DrivingSetSpeedLimitAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.DrivingSetSpeedLimitAction;
  return proto.CarServer.DrivingSetSpeedLimitAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.DrivingSetSpeedLimitAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.DrivingSetSpeedLimitAction}
 */
proto.CarServer.DrivingSetSpeedLimitAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setLimitMph(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.DrivingSetSpeedLimitAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.DrivingSetSpeedLimitAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.DrivingSetSpeedLimitAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.DrivingSetSpeedLimitAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLimitMph();
  if (f !== 0.0) {
    writer.writeDouble(
      1,
      f
    );
  }
};


/**
 * optional double limit_mph = 1;
 * @return {number}
 */
proto.CarServer.DrivingSetSpeedLimitAction.prototype.getLimitMph = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 1, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.DrivingSetSpeedLimitAction} returns this
 */
proto.CarServer.DrivingSetSpeedLimitAction.prototype.setLimitMph = function(value) {
  return jspb.Message.setProto3FloatField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.DrivingSpeedLimitAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.DrivingSpeedLimitAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.DrivingSpeedLimitAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.DrivingSpeedLimitAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    activate: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    pin: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.DrivingSpeedLimitAction}
 */
proto.CarServer.DrivingSpeedLimitAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.DrivingSpeedLimitAction;
  return proto.CarServer.DrivingSpeedLimitAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.DrivingSpeedLimitAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.DrivingSpeedLimitAction}
 */
proto.CarServer.DrivingSpeedLimitAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setActivate(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPin(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.DrivingSpeedLimitAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.DrivingSpeedLimitAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.DrivingSpeedLimitAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.DrivingSpeedLimitAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getActivate();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getPin();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional bool activate = 1;
 * @return {boolean}
 */
proto.CarServer.DrivingSpeedLimitAction.prototype.getActivate = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.DrivingSpeedLimitAction} returns this
 */
proto.CarServer.DrivingSpeedLimitAction.prototype.setActivate = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional string pin = 2;
 * @return {string}
 */
proto.CarServer.DrivingSpeedLimitAction.prototype.getPin = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.DrivingSpeedLimitAction} returns this
 */
proto.CarServer.DrivingSpeedLimitAction.prototype.setPin = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacAutoAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacAutoAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacAutoAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacAutoAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    powerOn: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    manualOverride: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacAutoAction}
 */
proto.CarServer.HvacAutoAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacAutoAction;
  return proto.CarServer.HvacAutoAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacAutoAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacAutoAction}
 */
proto.CarServer.HvacAutoAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setPowerOn(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setManualOverride(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacAutoAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacAutoAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacAutoAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacAutoAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPowerOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getManualOverride();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional bool power_on = 1;
 * @return {boolean}
 */
proto.CarServer.HvacAutoAction.prototype.getPowerOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacAutoAction} returns this
 */
proto.CarServer.HvacAutoAction.prototype.setPowerOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool manual_override = 2;
 * @return {boolean}
 */
proto.CarServer.HvacAutoAction.prototype.getManualOverride = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacAutoAction} returns this
 */
proto.CarServer.HvacAutoAction.prototype.setManualOverride = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.CarServer.HvacSeatHeaterActions.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacSeatHeaterActions.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacSeatHeaterActions.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacSeatHeaterActions} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatHeaterActions.toObject = function(includeInstance, msg) {
  var f, obj = {
    hvacseatheateractionList: jspb.Message.toObjectList(msg.getHvacseatheateractionList(),
    proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacSeatHeaterActions}
 */
proto.CarServer.HvacSeatHeaterActions.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacSeatHeaterActions;
  return proto.CarServer.HvacSeatHeaterActions.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacSeatHeaterActions} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacSeatHeaterActions}
 */
proto.CarServer.HvacSeatHeaterActions.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction;
      reader.readMessage(value,proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.deserializeBinaryFromReader);
      msg.addHvacseatheateraction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacSeatHeaterActions.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacSeatHeaterActions.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacSeatHeaterActions} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatHeaterActions.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHvacseatheateractionList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.serializeBinaryToWriter
    );
  }
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_ = [[1,2,3,4,5],[6,7,8,9,10,11,12,13,14,15]];

/**
 * @enum {number}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatHeaterLevelCase = {
  SEAT_HEATER_LEVEL_NOT_SET: 0,
  SEAT_HEATER_UNKNOWN: 1,
  SEAT_HEATER_OFF: 2,
  SEAT_HEATER_LOW: 3,
  SEAT_HEATER_MED: 4,
  SEAT_HEATER_HIGH: 5
};

/**
 * @return {proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatHeaterLevelCase}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatHeaterLevelCase = function() {
  return /** @type {proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatHeaterLevelCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[0]));
};

/**
 * @enum {number}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatPositionCase = {
  SEAT_POSITION_NOT_SET: 0,
  CAR_SEAT_UNKNOWN: 6,
  CAR_SEAT_FRONT_LEFT: 7,
  CAR_SEAT_FRONT_RIGHT: 8,
  CAR_SEAT_REAR_LEFT: 9,
  CAR_SEAT_REAR_LEFT_BACK: 10,
  CAR_SEAT_REAR_CENTER: 11,
  CAR_SEAT_REAR_RIGHT: 12,
  CAR_SEAT_REAR_RIGHT_BACK: 13,
  CAR_SEAT_THIRD_ROW_LEFT: 14,
  CAR_SEAT_THIRD_ROW_RIGHT: 15
};

/**
 * @return {proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatPositionCase}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatPositionCase = function() {
  return /** @type {proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.SeatPositionCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    seatHeaterUnknown: (f = msg.getSeatHeaterUnknown()) && common_pb.Void.toObject(includeInstance, f),
    seatHeaterOff: (f = msg.getSeatHeaterOff()) && common_pb.Void.toObject(includeInstance, f),
    seatHeaterLow: (f = msg.getSeatHeaterLow()) && common_pb.Void.toObject(includeInstance, f),
    seatHeaterMed: (f = msg.getSeatHeaterMed()) && common_pb.Void.toObject(includeInstance, f),
    seatHeaterHigh: (f = msg.getSeatHeaterHigh()) && common_pb.Void.toObject(includeInstance, f),
    carSeatUnknown: (f = msg.getCarSeatUnknown()) && common_pb.Void.toObject(includeInstance, f),
    carSeatFrontLeft: (f = msg.getCarSeatFrontLeft()) && common_pb.Void.toObject(includeInstance, f),
    carSeatFrontRight: (f = msg.getCarSeatFrontRight()) && common_pb.Void.toObject(includeInstance, f),
    carSeatRearLeft: (f = msg.getCarSeatRearLeft()) && common_pb.Void.toObject(includeInstance, f),
    carSeatRearLeftBack: (f = msg.getCarSeatRearLeftBack()) && common_pb.Void.toObject(includeInstance, f),
    carSeatRearCenter: (f = msg.getCarSeatRearCenter()) && common_pb.Void.toObject(includeInstance, f),
    carSeatRearRight: (f = msg.getCarSeatRearRight()) && common_pb.Void.toObject(includeInstance, f),
    carSeatRearRightBack: (f = msg.getCarSeatRearRightBack()) && common_pb.Void.toObject(includeInstance, f),
    carSeatThirdRowLeft: (f = msg.getCarSeatThirdRowLeft()) && common_pb.Void.toObject(includeInstance, f),
    carSeatThirdRowRight: (f = msg.getCarSeatThirdRowRight()) && common_pb.Void.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction;
  return proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setSeatHeaterUnknown(value);
      break;
    case 2:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setSeatHeaterOff(value);
      break;
    case 3:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setSeatHeaterLow(value);
      break;
    case 4:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setSeatHeaterMed(value);
      break;
    case 5:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setSeatHeaterHigh(value);
      break;
    case 6:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatUnknown(value);
      break;
    case 7:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatFrontLeft(value);
      break;
    case 8:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatFrontRight(value);
      break;
    case 9:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatRearLeft(value);
      break;
    case 10:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatRearLeftBack(value);
      break;
    case 11:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatRearCenter(value);
      break;
    case 12:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatRearRight(value);
      break;
    case 13:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatRearRightBack(value);
      break;
    case 14:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatThirdRowLeft(value);
      break;
    case 15:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setCarSeatThirdRowRight(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSeatHeaterUnknown();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getSeatHeaterOff();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getSeatHeaterLow();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getSeatHeaterMed();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getSeatHeaterHigh();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatUnknown();
  if (f != null) {
    writer.writeMessage(
      6,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatFrontLeft();
  if (f != null) {
    writer.writeMessage(
      7,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatFrontRight();
  if (f != null) {
    writer.writeMessage(
      8,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatRearLeft();
  if (f != null) {
    writer.writeMessage(
      9,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatRearLeftBack();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatRearCenter();
  if (f != null) {
    writer.writeMessage(
      11,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatRearRight();
  if (f != null) {
    writer.writeMessage(
      12,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatRearRightBack();
  if (f != null) {
    writer.writeMessage(
      13,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatThirdRowLeft();
  if (f != null) {
    writer.writeMessage(
      14,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getCarSeatThirdRowRight();
  if (f != null) {
    writer.writeMessage(
      15,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
};


/**
 * optional Void SEAT_HEATER_UNKNOWN = 1;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatHeaterUnknown = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 1));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setSeatHeaterUnknown = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearSeatHeaterUnknown = function() {
  return this.setSeatHeaterUnknown(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasSeatHeaterUnknown = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Void SEAT_HEATER_OFF = 2;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatHeaterOff = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 2));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setSeatHeaterOff = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearSeatHeaterOff = function() {
  return this.setSeatHeaterOff(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasSeatHeaterOff = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Void SEAT_HEATER_LOW = 3;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatHeaterLow = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 3));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setSeatHeaterLow = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearSeatHeaterLow = function() {
  return this.setSeatHeaterLow(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasSeatHeaterLow = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Void SEAT_HEATER_MED = 4;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatHeaterMed = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 4));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setSeatHeaterMed = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearSeatHeaterMed = function() {
  return this.setSeatHeaterMed(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasSeatHeaterMed = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Void SEAT_HEATER_HIGH = 5;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getSeatHeaterHigh = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 5));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setSeatHeaterHigh = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearSeatHeaterHigh = function() {
  return this.setSeatHeaterHigh(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasSeatHeaterHigh = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * optional Void CAR_SEAT_UNKNOWN = 6;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatUnknown = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 6));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatUnknown = function(value) {
  return jspb.Message.setOneofWrapperField(this, 6, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatUnknown = function() {
  return this.setCarSeatUnknown(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatUnknown = function() {
  return jspb.Message.getField(this, 6) != null;
};


/**
 * optional Void CAR_SEAT_FRONT_LEFT = 7;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatFrontLeft = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 7));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatFrontLeft = function(value) {
  return jspb.Message.setOneofWrapperField(this, 7, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatFrontLeft = function() {
  return this.setCarSeatFrontLeft(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatFrontLeft = function() {
  return jspb.Message.getField(this, 7) != null;
};


/**
 * optional Void CAR_SEAT_FRONT_RIGHT = 8;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatFrontRight = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 8));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatFrontRight = function(value) {
  return jspb.Message.setOneofWrapperField(this, 8, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatFrontRight = function() {
  return this.setCarSeatFrontRight(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatFrontRight = function() {
  return jspb.Message.getField(this, 8) != null;
};


/**
 * optional Void CAR_SEAT_REAR_LEFT = 9;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatRearLeft = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 9));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatRearLeft = function(value) {
  return jspb.Message.setOneofWrapperField(this, 9, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatRearLeft = function() {
  return this.setCarSeatRearLeft(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatRearLeft = function() {
  return jspb.Message.getField(this, 9) != null;
};


/**
 * optional Void CAR_SEAT_REAR_LEFT_BACK = 10;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatRearLeftBack = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 10));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatRearLeftBack = function(value) {
  return jspb.Message.setOneofWrapperField(this, 10, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatRearLeftBack = function() {
  return this.setCarSeatRearLeftBack(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatRearLeftBack = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional Void CAR_SEAT_REAR_CENTER = 11;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatRearCenter = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 11));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatRearCenter = function(value) {
  return jspb.Message.setOneofWrapperField(this, 11, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatRearCenter = function() {
  return this.setCarSeatRearCenter(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatRearCenter = function() {
  return jspb.Message.getField(this, 11) != null;
};


/**
 * optional Void CAR_SEAT_REAR_RIGHT = 12;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatRearRight = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 12));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatRearRight = function(value) {
  return jspb.Message.setOneofWrapperField(this, 12, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatRearRight = function() {
  return this.setCarSeatRearRight(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatRearRight = function() {
  return jspb.Message.getField(this, 12) != null;
};


/**
 * optional Void CAR_SEAT_REAR_RIGHT_BACK = 13;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatRearRightBack = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 13));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatRearRightBack = function(value) {
  return jspb.Message.setOneofWrapperField(this, 13, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatRearRightBack = function() {
  return this.setCarSeatRearRightBack(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatRearRightBack = function() {
  return jspb.Message.getField(this, 13) != null;
};


/**
 * optional Void CAR_SEAT_THIRD_ROW_LEFT = 14;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatThirdRowLeft = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 14));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatThirdRowLeft = function(value) {
  return jspb.Message.setOneofWrapperField(this, 14, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatThirdRowLeft = function() {
  return this.setCarSeatThirdRowLeft(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatThirdRowLeft = function() {
  return jspb.Message.getField(this, 14) != null;
};


/**
 * optional Void CAR_SEAT_THIRD_ROW_RIGHT = 15;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.getCarSeatThirdRowRight = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 15));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
*/
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.setCarSeatThirdRowRight = function(value) {
  return jspb.Message.setOneofWrapperField(this, 15, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction} returns this
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.clearCarSeatThirdRowRight = function() {
  return this.setCarSeatThirdRowRight(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction.prototype.hasCarSeatThirdRowRight = function() {
  return jspb.Message.getField(this, 15) != null;
};


/**
 * repeated HvacSeatHeaterAction hvacSeatHeaterAction = 1;
 * @return {!Array<!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction>}
 */
proto.CarServer.HvacSeatHeaterActions.prototype.getHvacseatheateractionList = function() {
  return /** @type{!Array<!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction, 1));
};


/**
 * @param {!Array<!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction>} value
 * @return {!proto.CarServer.HvacSeatHeaterActions} returns this
*/
proto.CarServer.HvacSeatHeaterActions.prototype.setHvacseatheateractionList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction}
 */
proto.CarServer.HvacSeatHeaterActions.prototype.addHvacseatheateraction = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.CarServer.HvacSeatHeaterActions.HvacSeatHeaterAction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.CarServer.HvacSeatHeaterActions} returns this
 */
proto.CarServer.HvacSeatHeaterActions.prototype.clearHvacseatheateractionList = function() {
  return this.setHvacseatheateractionList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.CarServer.HvacSeatCoolerActions.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacSeatCoolerActions.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacSeatCoolerActions.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacSeatCoolerActions} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatCoolerActions.toObject = function(includeInstance, msg) {
  var f, obj = {
    hvacseatcooleractionList: jspb.Message.toObjectList(msg.getHvacseatcooleractionList(),
    proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacSeatCoolerActions}
 */
proto.CarServer.HvacSeatCoolerActions.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacSeatCoolerActions;
  return proto.CarServer.HvacSeatCoolerActions.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacSeatCoolerActions} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacSeatCoolerActions}
 */
proto.CarServer.HvacSeatCoolerActions.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction;
      reader.readMessage(value,proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.deserializeBinaryFromReader);
      msg.addHvacseatcooleraction(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacSeatCoolerActions.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacSeatCoolerActions.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacSeatCoolerActions} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatCoolerActions.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getHvacseatcooleractionList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerLevel_E = {
  HVACSEATCOOLERLEVEL_UNKNOWN: 0,
  HVACSEATCOOLERLEVEL_OFF: 1,
  HVACSEATCOOLERLEVEL_LOW: 2,
  HVACSEATCOOLERLEVEL_MED: 3,
  HVACSEATCOOLERLEVEL_HIGH: 4
};

/**
 * @enum {number}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerPosition_E = {
  HVACSEATCOOLERPOSITION_UNKNOWN: 0,
  HVACSEATCOOLERPOSITION_FRONTLEFT: 1,
  HVACSEATCOOLERPOSITION_FRONTRIGHT: 2
};




if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    seatCoolerLevel: jspb.Message.getFieldWithDefault(msg, 1, 0),
    seatPosition: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction;
  return proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerLevel_E} */ (reader.readEnum());
      msg.setSeatCoolerLevel(value);
      break;
    case 2:
      var value = /** @type {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerPosition_E} */ (reader.readEnum());
      msg.setSeatPosition(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSeatCoolerLevel();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getSeatPosition();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional HvacSeatCoolerLevel_E seat_cooler_level = 1;
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerLevel_E}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.prototype.getSeatCoolerLevel = function() {
  return /** @type {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerLevel_E} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerLevel_E} value
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction} returns this
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.prototype.setSeatCoolerLevel = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional HvacSeatCoolerPosition_E seat_position = 2;
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerPosition_E}
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.prototype.getSeatPosition = function() {
  return /** @type {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerPosition_E} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerPosition_E} value
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction} returns this
 */
proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction.prototype.setSeatPosition = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * repeated HvacSeatCoolerAction hvacSeatCoolerAction = 1;
 * @return {!Array<!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction>}
 */
proto.CarServer.HvacSeatCoolerActions.prototype.getHvacseatcooleractionList = function() {
  return /** @type{!Array<!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction, 1));
};


/**
 * @param {!Array<!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction>} value
 * @return {!proto.CarServer.HvacSeatCoolerActions} returns this
*/
proto.CarServer.HvacSeatCoolerActions.prototype.setHvacseatcooleractionList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction}
 */
proto.CarServer.HvacSeatCoolerActions.prototype.addHvacseatcooleraction = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.CarServer.HvacSeatCoolerActions.HvacSeatCoolerAction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.CarServer.HvacSeatCoolerActions} returns this
 */
proto.CarServer.HvacSeatCoolerActions.prototype.clearHvacseatcooleractionList = function() {
  return this.setHvacseatcooleractionList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.CarServer.HvacSetPreconditioningMaxAction.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacSetPreconditioningMaxAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacSetPreconditioningMaxAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSetPreconditioningMaxAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    manualOverride: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
    manualOverrideModeList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacSetPreconditioningMaxAction;
  return proto.CarServer.HvacSetPreconditioningMaxAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacSetPreconditioningMaxAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setManualOverride(value);
      break;
    case 3:
      var values = /** @type {!Array<!proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E>} */ (reader.isDelimited() ? reader.readPackedEnum() : [reader.readEnum()]);
      for (var i = 0; i < values.length; i++) {
        msg.addManualOverrideMode(values[i]);
      }
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacSetPreconditioningMaxAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacSetPreconditioningMaxAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSetPreconditioningMaxAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getManualOverride();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getManualOverrideModeList();
  if (f.length > 0) {
    writer.writePackedEnum(
      3,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E = {
  DOGMODE: 0,
  SOC: 1,
  DOORS: 2
};

/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction} returns this
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool manual_override = 2;
 * @return {boolean}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.getManualOverride = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction} returns this
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.setManualOverride = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * repeated ManualOverrideMode_E manual_override_mode = 3;
 * @return {!Array<!proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E>}
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.getManualOverrideModeList = function() {
  return /** @type {!Array<!proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<!proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E>} value
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction} returns this
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.setManualOverrideModeList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {!proto.CarServer.HvacSetPreconditioningMaxAction.ManualOverrideMode_E} value
 * @param {number=} opt_index
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction} returns this
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.addManualOverrideMode = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.CarServer.HvacSetPreconditioningMaxAction} returns this
 */
proto.CarServer.HvacSetPreconditioningMaxAction.prototype.clearManualOverrideModeList = function() {
  return this.setManualOverrideModeList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacSteeringWheelHeaterAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacSteeringWheelHeaterAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacSteeringWheelHeaterAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSteeringWheelHeaterAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    powerOn: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacSteeringWheelHeaterAction}
 */
proto.CarServer.HvacSteeringWheelHeaterAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacSteeringWheelHeaterAction;
  return proto.CarServer.HvacSteeringWheelHeaterAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacSteeringWheelHeaterAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacSteeringWheelHeaterAction}
 */
proto.CarServer.HvacSteeringWheelHeaterAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setPowerOn(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacSteeringWheelHeaterAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacSteeringWheelHeaterAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacSteeringWheelHeaterAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacSteeringWheelHeaterAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPowerOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool power_on = 1;
 * @return {boolean}
 */
proto.CarServer.HvacSteeringWheelHeaterAction.prototype.getPowerOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacSteeringWheelHeaterAction} returns this
 */
proto.CarServer.HvacSteeringWheelHeaterAction.prototype.setPowerOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.CarServer.HvacTemperatureAdjustmentAction.repeatedFields_ = [4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacTemperatureAdjustmentAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacTemperatureAdjustmentAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    deltaCelsius: jspb.Message.getFloatingPointFieldWithDefault(msg, 1, 0.0),
    deltaPercent: jspb.Message.getFieldWithDefault(msg, 2, 0),
    absoluteCelsius: jspb.Message.getFloatingPointFieldWithDefault(msg, 3, 0.0),
    level: (f = msg.getLevel()) && proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.toObject(includeInstance, f),
    hvacTemperatureZoneList: jspb.Message.toObjectList(msg.getHvacTemperatureZoneList(),
    proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.toObject, includeInstance),
    driverTempCelsius: jspb.Message.getFloatingPointFieldWithDefault(msg, 6, 0.0),
    passengerTempCelsius: jspb.Message.getFloatingPointFieldWithDefault(msg, 7, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacTemperatureAdjustmentAction;
  return proto.CarServer.HvacTemperatureAdjustmentAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setDeltaCelsius(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readSint32());
      msg.setDeltaPercent(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setAbsoluteCelsius(value);
      break;
    case 5:
      var value = new proto.CarServer.HvacTemperatureAdjustmentAction.Temperature;
      reader.readMessage(value,proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.deserializeBinaryFromReader);
      msg.setLevel(value);
      break;
    case 4:
      var value = new proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone;
      reader.readMessage(value,proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.deserializeBinaryFromReader);
      msg.addHvacTemperatureZone(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setDriverTempCelsius(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setPassengerTempCelsius(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacTemperatureAdjustmentAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacTemperatureAdjustmentAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDeltaCelsius();
  if (f !== 0.0) {
    writer.writeFloat(
      1,
      f
    );
  }
  f = message.getDeltaPercent();
  if (f !== 0) {
    writer.writeSint32(
      2,
      f
    );
  }
  f = message.getAbsoluteCelsius();
  if (f !== 0.0) {
    writer.writeFloat(
      3,
      f
    );
  }
  f = message.getLevel();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.serializeBinaryToWriter
    );
  }
  f = message.getHvacTemperatureZoneList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.serializeBinaryToWriter
    );
  }
  f = message.getDriverTempCelsius();
  if (f !== 0.0) {
    writer.writeFloat(
      6,
      f
    );
  }
  f = message.getPassengerTempCelsius();
  if (f !== 0.0) {
    writer.writeFloat(
      7,
      f
    );
  }
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.oneofGroups_ = [[1,2,3]];

/**
 * @enum {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.TypeCase = {
  TYPE_NOT_SET: 0,
  TEMP_UNKNOWN: 1,
  TEMP_MIN: 2,
  TEMP_MAX: 3
};

/**
 * @return {proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.TypeCase}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.getTypeCase = function() {
  return /** @type {proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.TypeCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.toObject = function(includeInstance, msg) {
  var f, obj = {
    tempUnknown: (f = msg.getTempUnknown()) && common_pb.Void.toObject(includeInstance, f),
    tempMin: (f = msg.getTempMin()) && common_pb.Void.toObject(includeInstance, f),
    tempMax: (f = msg.getTempMax()) && common_pb.Void.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacTemperatureAdjustmentAction.Temperature;
  return proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempUnknown(value);
      break;
    case 2:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempMin(value);
      break;
    case 3:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempMax(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTempUnknown();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getTempMin();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getTempMax();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
};


/**
 * optional Void TEMP_UNKNOWN = 1;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.getTempUnknown = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 1));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.setTempUnknown = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.clearTempUnknown = function() {
  return this.setTempUnknown(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.hasTempUnknown = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Void TEMP_MIN = 2;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.getTempMin = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 2));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.setTempMin = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.clearTempMin = function() {
  return this.setTempMin(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.hasTempMin = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Void TEMP_MAX = 3;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.getTempMax = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 3));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.setTempMax = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.clearTempMax = function() {
  return this.setTempMax(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.Temperature.prototype.hasTempMax = function() {
  return jspb.Message.getField(this, 3) != null;
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_ = [[1,2,3,4]];

/**
 * @enum {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.TypeCase = {
  TYPE_NOT_SET: 0,
  TEMP_ZONE_UNKNOWN: 1,
  TEMP_ZONE_FRONT_LEFT: 2,
  TEMP_ZONE_FRONT_RIGHT: 3,
  TEMP_ZONE_REAR: 4
};

/**
 * @return {proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.TypeCase}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.getTypeCase = function() {
  return /** @type {proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.TypeCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.toObject = function(includeInstance, msg) {
  var f, obj = {
    tempZoneUnknown: (f = msg.getTempZoneUnknown()) && common_pb.Void.toObject(includeInstance, f),
    tempZoneFrontLeft: (f = msg.getTempZoneFrontLeft()) && common_pb.Void.toObject(includeInstance, f),
    tempZoneFrontRight: (f = msg.getTempZoneFrontRight()) && common_pb.Void.toObject(includeInstance, f),
    tempZoneRear: (f = msg.getTempZoneRear()) && common_pb.Void.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone;
  return proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempZoneUnknown(value);
      break;
    case 2:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempZoneFrontLeft(value);
      break;
    case 3:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempZoneFrontRight(value);
      break;
    case 4:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setTempZoneRear(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTempZoneUnknown();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getTempZoneFrontLeft();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getTempZoneFrontRight();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getTempZoneRear();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
};


/**
 * optional Void TEMP_ZONE_UNKNOWN = 1;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.getTempZoneUnknown = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 1));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.setTempZoneUnknown = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.clearTempZoneUnknown = function() {
  return this.setTempZoneUnknown(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.hasTempZoneUnknown = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Void TEMP_ZONE_FRONT_LEFT = 2;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.getTempZoneFrontLeft = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 2));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.setTempZoneFrontLeft = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.clearTempZoneFrontLeft = function() {
  return this.setTempZoneFrontLeft(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.hasTempZoneFrontLeft = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Void TEMP_ZONE_FRONT_RIGHT = 3;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.getTempZoneFrontRight = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 3));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.setTempZoneFrontRight = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.clearTempZoneFrontRight = function() {
  return this.setTempZoneFrontRight(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.hasTempZoneFrontRight = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Void TEMP_ZONE_REAR = 4;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.getTempZoneRear = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 4));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.setTempZoneRear = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.clearTempZoneRear = function() {
  return this.setTempZoneRear(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone.prototype.hasTempZoneRear = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional float delta_celsius = 1;
 * @return {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getDeltaCelsius = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 1, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setDeltaCelsius = function(value) {
  return jspb.Message.setProto3FloatField(this, 1, value);
};


/**
 * optional sint32 delta_percent = 2;
 * @return {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getDeltaPercent = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setDeltaPercent = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional float absolute_celsius = 3;
 * @return {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getAbsoluteCelsius = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 3, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setAbsoluteCelsius = function(value) {
  return jspb.Message.setProto3FloatField(this, 3, value);
};


/**
 * optional Temperature level = 5;
 * @return {?proto.CarServer.HvacTemperatureAdjustmentAction.Temperature}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getLevel = function() {
  return /** @type{?proto.CarServer.HvacTemperatureAdjustmentAction.Temperature} */ (
    jspb.Message.getWrapperField(this, proto.CarServer.HvacTemperatureAdjustmentAction.Temperature, 5));
};


/**
 * @param {?proto.CarServer.HvacTemperatureAdjustmentAction.Temperature|undefined} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setLevel = function(value) {
  return jspb.Message.setWrapperField(this, 5, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.clearLevel = function() {
  return this.setLevel(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.hasLevel = function() {
  return jspb.Message.getField(this, 5) != null;
};


/**
 * repeated HvacTemperatureZone hvac_temperature_zone = 4;
 * @return {!Array<!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone>}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getHvacTemperatureZoneList = function() {
  return /** @type{!Array<!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone, 4));
};


/**
 * @param {!Array<!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone>} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
*/
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setHvacTemperatureZoneList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone=} opt_value
 * @param {number=} opt_index
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.addHvacTemperatureZone = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.CarServer.HvacTemperatureAdjustmentAction.HvacTemperatureZone, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.clearHvacTemperatureZoneList = function() {
  return this.setHvacTemperatureZoneList([]);
};


/**
 * optional float driver_temp_celsius = 6;
 * @return {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getDriverTempCelsius = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 6, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setDriverTempCelsius = function(value) {
  return jspb.Message.setProto3FloatField(this, 6, value);
};


/**
 * optional float passenger_temp_celsius = 7;
 * @return {number}
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.getPassengerTempCelsius = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 7, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.HvacTemperatureAdjustmentAction} returns this
 */
proto.CarServer.HvacTemperatureAdjustmentAction.prototype.setPassengerTempCelsius = function(value) {
  return jspb.Message.setProto3FloatField(this, 7, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.GetNearbyChargingSites.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.GetNearbyChargingSites.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.GetNearbyChargingSites} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.GetNearbyChargingSites.toObject = function(includeInstance, msg) {
  var f, obj = {
    includeMetaData: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    radius: jspb.Message.getFieldWithDefault(msg, 2, 0),
    count: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.GetNearbyChargingSites}
 */
proto.CarServer.GetNearbyChargingSites.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.GetNearbyChargingSites;
  return proto.CarServer.GetNearbyChargingSites.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.GetNearbyChargingSites} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.GetNearbyChargingSites}
 */
proto.CarServer.GetNearbyChargingSites.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeMetaData(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setRadius(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCount(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.GetNearbyChargingSites.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.GetNearbyChargingSites.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.GetNearbyChargingSites} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.GetNearbyChargingSites.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIncludeMetaData();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getRadius();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getCount();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
};


/**
 * optional bool include_meta_data = 1;
 * @return {boolean}
 */
proto.CarServer.GetNearbyChargingSites.prototype.getIncludeMetaData = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.GetNearbyChargingSites} returns this
 */
proto.CarServer.GetNearbyChargingSites.prototype.setIncludeMetaData = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional int32 radius = 2;
 * @return {number}
 */
proto.CarServer.GetNearbyChargingSites.prototype.getRadius = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.GetNearbyChargingSites} returns this
 */
proto.CarServer.GetNearbyChargingSites.prototype.setRadius = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int32 count = 3;
 * @return {number}
 */
proto.CarServer.GetNearbyChargingSites.prototype.getCount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.GetNearbyChargingSites} returns this
 */
proto.CarServer.GetNearbyChargingSites.prototype.setCount = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.CarServer.NearbyChargingSites.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.NearbyChargingSites.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.NearbyChargingSites.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.NearbyChargingSites} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.NearbyChargingSites.toObject = function(includeInstance, msg) {
  var f, obj = {
    timestamp: (f = msg.getTimestamp()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
    superchargersList: jspb.Message.toObjectList(msg.getSuperchargersList(),
    proto.CarServer.Superchargers.toObject, includeInstance),
    congestionSyncTimeUtcSecs: jspb.Message.getFieldWithDefault(msg, 4, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.NearbyChargingSites}
 */
proto.CarServer.NearbyChargingSites.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.NearbyChargingSites;
  return proto.CarServer.NearbyChargingSites.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.NearbyChargingSites} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.NearbyChargingSites}
 */
proto.CarServer.NearbyChargingSites.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setTimestamp(value);
      break;
    case 3:
      var value = new proto.CarServer.Superchargers;
      reader.readMessage(value,proto.CarServer.Superchargers.deserializeBinaryFromReader);
      msg.addSuperchargers(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setCongestionSyncTimeUtcSecs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.NearbyChargingSites.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.NearbyChargingSites.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.NearbyChargingSites} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.NearbyChargingSites.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTimestamp();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getSuperchargersList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.CarServer.Superchargers.serializeBinaryToWriter
    );
  }
  f = message.getCongestionSyncTimeUtcSecs();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
};


/**
 * optional google.protobuf.Timestamp timestamp = 1;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.CarServer.NearbyChargingSites.prototype.getTimestamp = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 1));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.CarServer.NearbyChargingSites} returns this
*/
proto.CarServer.NearbyChargingSites.prototype.setTimestamp = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.NearbyChargingSites} returns this
 */
proto.CarServer.NearbyChargingSites.prototype.clearTimestamp = function() {
  return this.setTimestamp(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.NearbyChargingSites.prototype.hasTimestamp = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * repeated Superchargers superchargers = 3;
 * @return {!Array<!proto.CarServer.Superchargers>}
 */
proto.CarServer.NearbyChargingSites.prototype.getSuperchargersList = function() {
  return /** @type{!Array<!proto.CarServer.Superchargers>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.CarServer.Superchargers, 3));
};


/**
 * @param {!Array<!proto.CarServer.Superchargers>} value
 * @return {!proto.CarServer.NearbyChargingSites} returns this
*/
proto.CarServer.NearbyChargingSites.prototype.setSuperchargersList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.CarServer.Superchargers=} opt_value
 * @param {number=} opt_index
 * @return {!proto.CarServer.Superchargers}
 */
proto.CarServer.NearbyChargingSites.prototype.addSuperchargers = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.CarServer.Superchargers, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.CarServer.NearbyChargingSites} returns this
 */
proto.CarServer.NearbyChargingSites.prototype.clearSuperchargersList = function() {
  return this.setSuperchargersList([]);
};


/**
 * optional int64 congestion_sync_time_utc_secs = 4;
 * @return {number}
 */
proto.CarServer.NearbyChargingSites.prototype.getCongestionSyncTimeUtcSecs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.NearbyChargingSites} returns this
 */
proto.CarServer.NearbyChargingSites.prototype.setCongestionSyncTimeUtcSecs = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.Superchargers.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.Superchargers.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.Superchargers} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Superchargers.toObject = function(includeInstance, msg) {
  var f, obj = {
    id: jspb.Message.getFieldWithDefault(msg, 1, 0),
    amenities: jspb.Message.getFieldWithDefault(msg, 2, ""),
    availableStalls: jspb.Message.getFieldWithDefault(msg, 3, 0),
    billingInfo: jspb.Message.getFieldWithDefault(msg, 4, ""),
    billingTime: jspb.Message.getFieldWithDefault(msg, 5, ""),
    city: jspb.Message.getFieldWithDefault(msg, 6, ""),
    country: jspb.Message.getFieldWithDefault(msg, 7, ""),
    distanceMiles: jspb.Message.getFloatingPointFieldWithDefault(msg, 8, 0.0),
    district: jspb.Message.getFieldWithDefault(msg, 9, ""),
    location: (f = msg.getLocation()) && common_pb.LatLong.toObject(includeInstance, f),
    name: jspb.Message.getFieldWithDefault(msg, 11, ""),
    postalCode: jspb.Message.getFieldWithDefault(msg, 12, ""),
    siteClosed: jspb.Message.getBooleanFieldWithDefault(msg, 13, false),
    state: jspb.Message.getFieldWithDefault(msg, 14, ""),
    streetAddress: jspb.Message.getFieldWithDefault(msg, 15, ""),
    totalStalls: jspb.Message.getFieldWithDefault(msg, 16, 0),
    withinRange: jspb.Message.getBooleanFieldWithDefault(msg, 17, false),
    maxPowerKw: jspb.Message.getFieldWithDefault(msg, 18, 0),
    outOfOrderStallsNumber: jspb.Message.getFieldWithDefault(msg, 19, 0),
    outOfOrderStallsNames: jspb.Message.getFieldWithDefault(msg, 20, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.Superchargers}
 */
proto.CarServer.Superchargers.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.Superchargers;
  return proto.CarServer.Superchargers.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.Superchargers} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.Superchargers}
 */
proto.CarServer.Superchargers.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAmenities(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setAvailableStalls(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setBillingInfo(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setBillingTime(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setCity(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setCountry(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setDistanceMiles(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setDistrict(value);
      break;
    case 10:
      var value = new common_pb.LatLong;
      reader.readMessage(value,common_pb.LatLong.deserializeBinaryFromReader);
      msg.setLocation(value);
      break;
    case 11:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 12:
      var value = /** @type {string} */ (reader.readString());
      msg.setPostalCode(value);
      break;
    case 13:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setSiteClosed(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
      msg.setState(value);
      break;
    case 15:
      var value = /** @type {string} */ (reader.readString());
      msg.setStreetAddress(value);
      break;
    case 16:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setTotalStalls(value);
      break;
    case 17:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setWithinRange(value);
      break;
    case 18:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setMaxPowerKw(value);
      break;
    case 19:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setOutOfOrderStallsNumber(value);
      break;
    case 20:
      var value = /** @type {string} */ (reader.readString());
      msg.setOutOfOrderStallsNames(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.Superchargers.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.Superchargers.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.Superchargers} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Superchargers.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getId();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getAmenities();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getAvailableStalls();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getBillingInfo();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getBillingTime();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getCity();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getCountry();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getDistanceMiles();
  if (f !== 0.0) {
    writer.writeFloat(
      8,
      f
    );
  }
  f = message.getDistrict();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getLocation();
  if (f != null) {
    writer.writeMessage(
      10,
      f,
      common_pb.LatLong.serializeBinaryToWriter
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      11,
      f
    );
  }
  f = message.getPostalCode();
  if (f.length > 0) {
    writer.writeString(
      12,
      f
    );
  }
  f = message.getSiteClosed();
  if (f) {
    writer.writeBool(
      13,
      f
    );
  }
  f = message.getState();
  if (f.length > 0) {
    writer.writeString(
      14,
      f
    );
  }
  f = message.getStreetAddress();
  if (f.length > 0) {
    writer.writeString(
      15,
      f
    );
  }
  f = message.getTotalStalls();
  if (f !== 0) {
    writer.writeInt32(
      16,
      f
    );
  }
  f = message.getWithinRange();
  if (f) {
    writer.writeBool(
      17,
      f
    );
  }
  f = message.getMaxPowerKw();
  if (f !== 0) {
    writer.writeInt32(
      18,
      f
    );
  }
  f = message.getOutOfOrderStallsNumber();
  if (f !== 0) {
    writer.writeInt32(
      19,
      f
    );
  }
  f = message.getOutOfOrderStallsNames();
  if (f.length > 0) {
    writer.writeString(
      20,
      f
    );
  }
};


/**
 * optional int64 id = 1;
 * @return {number}
 */
proto.CarServer.Superchargers.prototype.getId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string amenities = 2;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getAmenities = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setAmenities = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 available_stalls = 3;
 * @return {number}
 */
proto.CarServer.Superchargers.prototype.getAvailableStalls = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setAvailableStalls = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string billing_info = 4;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getBillingInfo = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setBillingInfo = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string billing_time = 5;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getBillingTime = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setBillingTime = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string city = 6;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getCity = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setCity = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional string country = 7;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getCountry = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setCountry = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional float distance_miles = 8;
 * @return {number}
 */
proto.CarServer.Superchargers.prototype.getDistanceMiles = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 8, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setDistanceMiles = function(value) {
  return jspb.Message.setProto3FloatField(this, 8, value);
};


/**
 * optional string district = 9;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getDistrict = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setDistrict = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional LatLong location = 10;
 * @return {?proto.CarServer.LatLong}
 */
proto.CarServer.Superchargers.prototype.getLocation = function() {
  return /** @type{?proto.CarServer.LatLong} */ (
    jspb.Message.getWrapperField(this, common_pb.LatLong, 10));
};


/**
 * @param {?proto.CarServer.LatLong|undefined} value
 * @return {!proto.CarServer.Superchargers} returns this
*/
proto.CarServer.Superchargers.prototype.setLocation = function(value) {
  return jspb.Message.setWrapperField(this, 10, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.clearLocation = function() {
  return this.setLocation(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Superchargers.prototype.hasLocation = function() {
  return jspb.Message.getField(this, 10) != null;
};


/**
 * optional string name = 11;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 11, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 11, value);
};


/**
 * optional string postal_code = 12;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getPostalCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 12, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setPostalCode = function(value) {
  return jspb.Message.setProto3StringField(this, 12, value);
};


/**
 * optional bool site_closed = 13;
 * @return {boolean}
 */
proto.CarServer.Superchargers.prototype.getSiteClosed = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 13, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setSiteClosed = function(value) {
  return jspb.Message.setProto3BooleanField(this, 13, value);
};


/**
 * optional string state = 14;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getState = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setState = function(value) {
  return jspb.Message.setProto3StringField(this, 14, value);
};


/**
 * optional string street_address = 15;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getStreetAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 15, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setStreetAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 15, value);
};


/**
 * optional int32 total_stalls = 16;
 * @return {number}
 */
proto.CarServer.Superchargers.prototype.getTotalStalls = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 16, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setTotalStalls = function(value) {
  return jspb.Message.setProto3IntField(this, 16, value);
};


/**
 * optional bool within_range = 17;
 * @return {boolean}
 */
proto.CarServer.Superchargers.prototype.getWithinRange = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 17, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setWithinRange = function(value) {
  return jspb.Message.setProto3BooleanField(this, 17, value);
};


/**
 * optional int32 max_power_kw = 18;
 * @return {number}
 */
proto.CarServer.Superchargers.prototype.getMaxPowerKw = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 18, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setMaxPowerKw = function(value) {
  return jspb.Message.setProto3IntField(this, 18, value);
};


/**
 * optional int32 out_of_order_stalls_number = 19;
 * @return {number}
 */
proto.CarServer.Superchargers.prototype.getOutOfOrderStallsNumber = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 19, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setOutOfOrderStallsNumber = function(value) {
  return jspb.Message.setProto3IntField(this, 19, value);
};


/**
 * optional string out_of_order_stalls_names = 20;
 * @return {string}
 */
proto.CarServer.Superchargers.prototype.getOutOfOrderStallsNames = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 20, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.Superchargers} returns this
 */
proto.CarServer.Superchargers.prototype.setOutOfOrderStallsNames = function(value) {
  return jspb.Message.setProto3StringField(this, 20, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.MediaUpdateVolume.oneofGroups_ = [[1,3]];

/**
 * @enum {number}
 */
proto.CarServer.MediaUpdateVolume.MediaVolumeCase = {
  MEDIA_VOLUME_NOT_SET: 0,
  VOLUME_DELTA: 1,
  VOLUME_ABSOLUTE_FLOAT: 3
};

/**
 * @return {proto.CarServer.MediaUpdateVolume.MediaVolumeCase}
 */
proto.CarServer.MediaUpdateVolume.prototype.getMediaVolumeCase = function() {
  return /** @type {proto.CarServer.MediaUpdateVolume.MediaVolumeCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.MediaUpdateVolume.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.MediaUpdateVolume.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.MediaUpdateVolume.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.MediaUpdateVolume} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaUpdateVolume.toObject = function(includeInstance, msg) {
  var f, obj = {
    volumeDelta: jspb.Message.getFieldWithDefault(msg, 1, 0),
    volumeAbsoluteFloat: jspb.Message.getFloatingPointFieldWithDefault(msg, 3, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.MediaUpdateVolume}
 */
proto.CarServer.MediaUpdateVolume.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.MediaUpdateVolume;
  return proto.CarServer.MediaUpdateVolume.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.MediaUpdateVolume} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.MediaUpdateVolume}
 */
proto.CarServer.MediaUpdateVolume.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readSint32());
      msg.setVolumeDelta(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readFloat());
      msg.setVolumeAbsoluteFloat(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.MediaUpdateVolume.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.MediaUpdateVolume.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.MediaUpdateVolume} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaUpdateVolume.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {number} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeSint32(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeFloat(
      3,
      f
    );
  }
};


/**
 * optional sint32 volume_delta = 1;
 * @return {number}
 */
proto.CarServer.MediaUpdateVolume.prototype.getVolumeDelta = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.MediaUpdateVolume} returns this
 */
proto.CarServer.MediaUpdateVolume.prototype.setVolumeDelta = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.CarServer.MediaUpdateVolume.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.CarServer.MediaUpdateVolume} returns this
 */
proto.CarServer.MediaUpdateVolume.prototype.clearVolumeDelta = function() {
  return jspb.Message.setOneofField(this, 1, proto.CarServer.MediaUpdateVolume.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.MediaUpdateVolume.prototype.hasVolumeDelta = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional float volume_absolute_float = 3;
 * @return {number}
 */
proto.CarServer.MediaUpdateVolume.prototype.getVolumeAbsoluteFloat = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 3, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.MediaUpdateVolume} returns this
 */
proto.CarServer.MediaUpdateVolume.prototype.setVolumeAbsoluteFloat = function(value) {
  return jspb.Message.setOneofField(this, 3, proto.CarServer.MediaUpdateVolume.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.CarServer.MediaUpdateVolume} returns this
 */
proto.CarServer.MediaUpdateVolume.prototype.clearVolumeAbsoluteFloat = function() {
  return jspb.Message.setOneofField(this, 3, proto.CarServer.MediaUpdateVolume.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.MediaUpdateVolume.prototype.hasVolumeAbsoluteFloat = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.MediaNextFavorite.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.MediaNextFavorite.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.MediaNextFavorite} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaNextFavorite.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.MediaNextFavorite}
 */
proto.CarServer.MediaNextFavorite.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.MediaNextFavorite;
  return proto.CarServer.MediaNextFavorite.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.MediaNextFavorite} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.MediaNextFavorite}
 */
proto.CarServer.MediaNextFavorite.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.MediaNextFavorite.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.MediaNextFavorite.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.MediaNextFavorite} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaNextFavorite.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.MediaPreviousFavorite.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.MediaPreviousFavorite.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.MediaPreviousFavorite} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaPreviousFavorite.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.MediaPreviousFavorite}
 */
proto.CarServer.MediaPreviousFavorite.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.MediaPreviousFavorite;
  return proto.CarServer.MediaPreviousFavorite.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.MediaPreviousFavorite} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.MediaPreviousFavorite}
 */
proto.CarServer.MediaPreviousFavorite.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.MediaPreviousFavorite.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.MediaPreviousFavorite.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.MediaPreviousFavorite} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaPreviousFavorite.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.MediaNextTrack.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.MediaNextTrack.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.MediaNextTrack} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaNextTrack.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.MediaNextTrack}
 */
proto.CarServer.MediaNextTrack.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.MediaNextTrack;
  return proto.CarServer.MediaNextTrack.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.MediaNextTrack} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.MediaNextTrack}
 */
proto.CarServer.MediaNextTrack.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.MediaNextTrack.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.MediaNextTrack.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.MediaNextTrack} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaNextTrack.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.MediaPreviousTrack.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.MediaPreviousTrack.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.MediaPreviousTrack} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaPreviousTrack.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.MediaPreviousTrack}
 */
proto.CarServer.MediaPreviousTrack.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.MediaPreviousTrack;
  return proto.CarServer.MediaPreviousTrack.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.MediaPreviousTrack} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.MediaPreviousTrack}
 */
proto.CarServer.MediaPreviousTrack.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.MediaPreviousTrack.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.MediaPreviousTrack.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.MediaPreviousTrack} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.MediaPreviousTrack.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlCancelSoftwareUpdateAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlCancelSoftwareUpdateAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlCancelSoftwareUpdateAction}
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlCancelSoftwareUpdateAction;
  return proto.CarServer.VehicleControlCancelSoftwareUpdateAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlCancelSoftwareUpdateAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlCancelSoftwareUpdateAction}
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlCancelSoftwareUpdateAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlCancelSoftwareUpdateAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlCancelSoftwareUpdateAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlFlashLightsAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlFlashLightsAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlFlashLightsAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlFlashLightsAction.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlFlashLightsAction}
 */
proto.CarServer.VehicleControlFlashLightsAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlFlashLightsAction;
  return proto.CarServer.VehicleControlFlashLightsAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlFlashLightsAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlFlashLightsAction}
 */
proto.CarServer.VehicleControlFlashLightsAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlFlashLightsAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlFlashLightsAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlFlashLightsAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlFlashLightsAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlHonkHornAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlHonkHornAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlHonkHornAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlHonkHornAction.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlHonkHornAction}
 */
proto.CarServer.VehicleControlHonkHornAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlHonkHornAction;
  return proto.CarServer.VehicleControlHonkHornAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlHonkHornAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlHonkHornAction}
 */
proto.CarServer.VehicleControlHonkHornAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlHonkHornAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlHonkHornAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlHonkHornAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlHonkHornAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlResetValetPinAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlResetValetPinAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlResetValetPinAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlResetValetPinAction.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlResetValetPinAction}
 */
proto.CarServer.VehicleControlResetValetPinAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlResetValetPinAction;
  return proto.CarServer.VehicleControlResetValetPinAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlResetValetPinAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlResetValetPinAction}
 */
proto.CarServer.VehicleControlResetValetPinAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlResetValetPinAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlResetValetPinAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlResetValetPinAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlResetValetPinAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlScheduleSoftwareUpdateAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    offsetSec: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlScheduleSoftwareUpdateAction}
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlScheduleSoftwareUpdateAction;
  return proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlScheduleSoftwareUpdateAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlScheduleSoftwareUpdateAction}
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setOffsetSec(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlScheduleSoftwareUpdateAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOffsetSec();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
};


/**
 * optional int32 offset_sec = 1;
 * @return {number}
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.prototype.getOffsetSec = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.VehicleControlScheduleSoftwareUpdateAction} returns this
 */
proto.CarServer.VehicleControlScheduleSoftwareUpdateAction.prototype.setOffsetSec = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlSetSentryModeAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlSetSentryModeAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlSetSentryModeAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSetSentryModeAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlSetSentryModeAction}
 */
proto.CarServer.VehicleControlSetSentryModeAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlSetSentryModeAction;
  return proto.CarServer.VehicleControlSetSentryModeAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlSetSentryModeAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlSetSentryModeAction}
 */
proto.CarServer.VehicleControlSetSentryModeAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlSetSentryModeAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlSetSentryModeAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlSetSentryModeAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSetSentryModeAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.VehicleControlSetSentryModeAction.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.VehicleControlSetSentryModeAction} returns this
 */
proto.CarServer.VehicleControlSetSentryModeAction.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlSetValetModeAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlSetValetModeAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlSetValetModeAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSetValetModeAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    password: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlSetValetModeAction}
 */
proto.CarServer.VehicleControlSetValetModeAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlSetValetModeAction;
  return proto.CarServer.VehicleControlSetValetModeAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlSetValetModeAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlSetValetModeAction}
 */
proto.CarServer.VehicleControlSetValetModeAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlSetValetModeAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlSetValetModeAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlSetValetModeAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSetValetModeAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.VehicleControlSetValetModeAction.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.VehicleControlSetValetModeAction} returns this
 */
proto.CarServer.VehicleControlSetValetModeAction.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.CarServer.VehicleControlSetValetModeAction.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.VehicleControlSetValetModeAction} returns this
 */
proto.CarServer.VehicleControlSetValetModeAction.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_ = [[1,2],[3,4,5]];

/**
 * @enum {number}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.SunroofLevelCase = {
  SUNROOF_LEVEL_NOT_SET: 0,
  ABSOLUTE_LEVEL: 1,
  DELTA_LEVEL: 2
};

/**
 * @return {proto.CarServer.VehicleControlSunroofOpenCloseAction.SunroofLevelCase}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getSunroofLevelCase = function() {
  return /** @type {proto.CarServer.VehicleControlSunroofOpenCloseAction.SunroofLevelCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[0]));
};

/**
 * @enum {number}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.ActionCase = {
  ACTION_NOT_SET: 0,
  VENT: 3,
  CLOSE: 4,
  OPEN: 5
};

/**
 * @return {proto.CarServer.VehicleControlSunroofOpenCloseAction.ActionCase}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getActionCase = function() {
  return /** @type {proto.CarServer.VehicleControlSunroofOpenCloseAction.ActionCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[1]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlSunroofOpenCloseAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlSunroofOpenCloseAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    absoluteLevel: jspb.Message.getFieldWithDefault(msg, 1, 0),
    deltaLevel: jspb.Message.getFieldWithDefault(msg, 2, 0),
    vent: (f = msg.getVent()) && common_pb.Void.toObject(includeInstance, f),
    close: (f = msg.getClose()) && common_pb.Void.toObject(includeInstance, f),
    open: (f = msg.getOpen()) && common_pb.Void.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlSunroofOpenCloseAction;
  return proto.CarServer.VehicleControlSunroofOpenCloseAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlSunroofOpenCloseAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setAbsoluteLevel(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readSint32());
      msg.setDeltaLevel(value);
      break;
    case 3:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setVent(value);
      break;
    case 4:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setClose(value);
      break;
    case 5:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setOpen(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlSunroofOpenCloseAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlSunroofOpenCloseAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = /** @type {number} */ (jspb.Message.getField(message, 1));
  if (f != null) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeSint32(
      2,
      f
    );
  }
  f = message.getVent();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getClose();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getOpen();
  if (f != null) {
    writer.writeMessage(
      5,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
};


/**
 * optional int32 absolute_level = 1;
 * @return {number}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getAbsoluteLevel = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.setAbsoluteLevel = function(value) {
  return jspb.Message.setOneofField(this, 1, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.clearAbsoluteLevel = function() {
  return jspb.Message.setOneofField(this, 1, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.hasAbsoluteLevel = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional sint32 delta_level = 2;
 * @return {number}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getDeltaLevel = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.setDeltaLevel = function(value) {
  return jspb.Message.setOneofField(this, 2, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[0], value);
};


/**
 * Clears the field making it undefined.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.clearDeltaLevel = function() {
  return jspb.Message.setOneofField(this, 2, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[0], undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.hasDeltaLevel = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Void vent = 3;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getVent = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 3));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
*/
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.setVent = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.clearVent = function() {
  return this.setVent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.hasVent = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Void close = 4;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getClose = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 4));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
*/
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.setClose = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.clearClose = function() {
  return this.setClose(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.hasClose = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional Void open = 5;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.getOpen = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 5));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
*/
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.setOpen = function(value) {
  return jspb.Message.setOneofWrapperField(this, 5, proto.CarServer.VehicleControlSunroofOpenCloseAction.oneofGroups_[1], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlSunroofOpenCloseAction} returns this
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.clearOpen = function() {
  return this.setOpen(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlSunroofOpenCloseAction.prototype.hasOpen = function() {
  return jspb.Message.getField(this, 5) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlTriggerHomelinkAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlTriggerHomelinkAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    location: (f = msg.getLocation()) && common_pb.LatLong.toObject(includeInstance, f),
    token: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlTriggerHomelinkAction}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlTriggerHomelinkAction;
  return proto.CarServer.VehicleControlTriggerHomelinkAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlTriggerHomelinkAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlTriggerHomelinkAction}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_pb.LatLong;
      reader.readMessage(value,common_pb.LatLong.deserializeBinaryFromReader);
      msg.setLocation(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlTriggerHomelinkAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlTriggerHomelinkAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLocation();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_pb.LatLong.serializeBinaryToWriter
    );
  }
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional LatLong location = 1;
 * @return {?proto.CarServer.LatLong}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.getLocation = function() {
  return /** @type{?proto.CarServer.LatLong} */ (
    jspb.Message.getWrapperField(this, common_pb.LatLong, 1));
};


/**
 * @param {?proto.CarServer.LatLong|undefined} value
 * @return {!proto.CarServer.VehicleControlTriggerHomelinkAction} returns this
*/
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.setLocation = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlTriggerHomelinkAction} returns this
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.clearLocation = function() {
  return this.setLocation(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.hasLocation = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string token = 2;
 * @return {string}
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.VehicleControlTriggerHomelinkAction} returns this
 */
proto.CarServer.VehicleControlTriggerHomelinkAction.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.CarServer.VehicleControlWindowAction.oneofGroups_ = [[2,3,4]];

/**
 * @enum {number}
 */
proto.CarServer.VehicleControlWindowAction.ActionCase = {
  ACTION_NOT_SET: 0,
  UNKNOWN: 2,
  VENT: 3,
  CLOSE: 4
};

/**
 * @return {proto.CarServer.VehicleControlWindowAction.ActionCase}
 */
proto.CarServer.VehicleControlWindowAction.prototype.getActionCase = function() {
  return /** @type {proto.CarServer.VehicleControlWindowAction.ActionCase} */(jspb.Message.computeOneofCase(this, proto.CarServer.VehicleControlWindowAction.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlWindowAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlWindowAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlWindowAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlWindowAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    location: (f = msg.getLocation()) && common_pb.LatLong.toObject(includeInstance, f),
    unknown: (f = msg.getUnknown()) && common_pb.Void.toObject(includeInstance, f),
    vent: (f = msg.getVent()) && common_pb.Void.toObject(includeInstance, f),
    close: (f = msg.getClose()) && common_pb.Void.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlWindowAction}
 */
proto.CarServer.VehicleControlWindowAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlWindowAction;
  return proto.CarServer.VehicleControlWindowAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlWindowAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlWindowAction}
 */
proto.CarServer.VehicleControlWindowAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new common_pb.LatLong;
      reader.readMessage(value,common_pb.LatLong.deserializeBinaryFromReader);
      msg.setLocation(value);
      break;
    case 2:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setUnknown(value);
      break;
    case 3:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setVent(value);
      break;
    case 4:
      var value = new common_pb.Void;
      reader.readMessage(value,common_pb.Void.deserializeBinaryFromReader);
      msg.setClose(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlWindowAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlWindowAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlWindowAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlWindowAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLocation();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      common_pb.LatLong.serializeBinaryToWriter
    );
  }
  f = message.getUnknown();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getVent();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
  f = message.getClose();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_pb.Void.serializeBinaryToWriter
    );
  }
};


/**
 * optional LatLong location = 1;
 * @return {?proto.CarServer.LatLong}
 */
proto.CarServer.VehicleControlWindowAction.prototype.getLocation = function() {
  return /** @type{?proto.CarServer.LatLong} */ (
    jspb.Message.getWrapperField(this, common_pb.LatLong, 1));
};


/**
 * @param {?proto.CarServer.LatLong|undefined} value
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
*/
proto.CarServer.VehicleControlWindowAction.prototype.setLocation = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
 */
proto.CarServer.VehicleControlWindowAction.prototype.clearLocation = function() {
  return this.setLocation(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlWindowAction.prototype.hasLocation = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Void unknown = 2;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.VehicleControlWindowAction.prototype.getUnknown = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 2));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
*/
proto.CarServer.VehicleControlWindowAction.prototype.setUnknown = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.CarServer.VehicleControlWindowAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
 */
proto.CarServer.VehicleControlWindowAction.prototype.clearUnknown = function() {
  return this.setUnknown(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlWindowAction.prototype.hasUnknown = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Void vent = 3;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.VehicleControlWindowAction.prototype.getVent = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 3));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
*/
proto.CarServer.VehicleControlWindowAction.prototype.setVent = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.CarServer.VehicleControlWindowAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
 */
proto.CarServer.VehicleControlWindowAction.prototype.clearVent = function() {
  return this.setVent(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlWindowAction.prototype.hasVent = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional Void close = 4;
 * @return {?proto.CarServer.Void}
 */
proto.CarServer.VehicleControlWindowAction.prototype.getClose = function() {
  return /** @type{?proto.CarServer.Void} */ (
    jspb.Message.getWrapperField(this, common_pb.Void, 4));
};


/**
 * @param {?proto.CarServer.Void|undefined} value
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
*/
proto.CarServer.VehicleControlWindowAction.prototype.setClose = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.CarServer.VehicleControlWindowAction.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.VehicleControlWindowAction} returns this
 */
proto.CarServer.VehicleControlWindowAction.prototype.clearClose = function() {
  return this.setClose(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.VehicleControlWindowAction.prototype.hasClose = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacBioweaponModeAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacBioweaponModeAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacBioweaponModeAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacBioweaponModeAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    manualOverride: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacBioweaponModeAction}
 */
proto.CarServer.HvacBioweaponModeAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacBioweaponModeAction;
  return proto.CarServer.HvacBioweaponModeAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacBioweaponModeAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacBioweaponModeAction}
 */
proto.CarServer.HvacBioweaponModeAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setManualOverride(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacBioweaponModeAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacBioweaponModeAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacBioweaponModeAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacBioweaponModeAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getManualOverride();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.HvacBioweaponModeAction.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacBioweaponModeAction} returns this
 */
proto.CarServer.HvacBioweaponModeAction.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool manual_override = 2;
 * @return {boolean}
 */
proto.CarServer.HvacBioweaponModeAction.prototype.getManualOverride = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacBioweaponModeAction} returns this
 */
proto.CarServer.HvacBioweaponModeAction.prototype.setManualOverride = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.CarServer.AutoSeatClimateAction.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.AutoSeatClimateAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.AutoSeatClimateAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.AutoSeatClimateAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.AutoSeatClimateAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    carseatList: jspb.Message.toObjectList(msg.getCarseatList(),
    proto.CarServer.AutoSeatClimateAction.CarSeat.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.AutoSeatClimateAction}
 */
proto.CarServer.AutoSeatClimateAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.AutoSeatClimateAction;
  return proto.CarServer.AutoSeatClimateAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.AutoSeatClimateAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.AutoSeatClimateAction}
 */
proto.CarServer.AutoSeatClimateAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.CarServer.AutoSeatClimateAction.CarSeat;
      reader.readMessage(value,proto.CarServer.AutoSeatClimateAction.CarSeat.deserializeBinaryFromReader);
      msg.addCarseat(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.AutoSeatClimateAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.AutoSeatClimateAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.AutoSeatClimateAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.AutoSeatClimateAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCarseatList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.CarServer.AutoSeatClimateAction.CarSeat.serializeBinaryToWriter
    );
  }
};


/**
 * @enum {number}
 */
proto.CarServer.AutoSeatClimateAction.AutoSeatPosition_E = {
  AUTOSEATPOSITION_UNKNOWN: 0,
  AUTOSEATPOSITION_FRONTLEFT: 1,
  AUTOSEATPOSITION_FRONTRIGHT: 2
};




if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.AutoSeatClimateAction.CarSeat.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.AutoSeatClimateAction.CarSeat} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    seatPosition: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.AutoSeatClimateAction.CarSeat}
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.AutoSeatClimateAction.CarSeat;
  return proto.CarServer.AutoSeatClimateAction.CarSeat.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.AutoSeatClimateAction.CarSeat} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.AutoSeatClimateAction.CarSeat}
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    case 2:
      var value = /** @type {!proto.CarServer.AutoSeatClimateAction.AutoSeatPosition_E} */ (reader.readEnum());
      msg.setSeatPosition(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.AutoSeatClimateAction.CarSeat.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.AutoSeatClimateAction.CarSeat} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getSeatPosition();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.AutoSeatClimateAction.CarSeat} returns this
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional AutoSeatPosition_E seat_position = 2;
 * @return {!proto.CarServer.AutoSeatClimateAction.AutoSeatPosition_E}
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.prototype.getSeatPosition = function() {
  return /** @type {!proto.CarServer.AutoSeatClimateAction.AutoSeatPosition_E} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.CarServer.AutoSeatClimateAction.AutoSeatPosition_E} value
 * @return {!proto.CarServer.AutoSeatClimateAction.CarSeat} returns this
 */
proto.CarServer.AutoSeatClimateAction.CarSeat.prototype.setSeatPosition = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * repeated CarSeat carseat = 1;
 * @return {!Array<!proto.CarServer.AutoSeatClimateAction.CarSeat>}
 */
proto.CarServer.AutoSeatClimateAction.prototype.getCarseatList = function() {
  return /** @type{!Array<!proto.CarServer.AutoSeatClimateAction.CarSeat>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.CarServer.AutoSeatClimateAction.CarSeat, 1));
};


/**
 * @param {!Array<!proto.CarServer.AutoSeatClimateAction.CarSeat>} value
 * @return {!proto.CarServer.AutoSeatClimateAction} returns this
*/
proto.CarServer.AutoSeatClimateAction.prototype.setCarseatList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.CarServer.AutoSeatClimateAction.CarSeat=} opt_value
 * @param {number=} opt_index
 * @return {!proto.CarServer.AutoSeatClimateAction.CarSeat}
 */
proto.CarServer.AutoSeatClimateAction.prototype.addCarseat = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.CarServer.AutoSeatClimateAction.CarSeat, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.CarServer.AutoSeatClimateAction} returns this
 */
proto.CarServer.AutoSeatClimateAction.prototype.clearCarseatList = function() {
  return this.setCarseatList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.Ping.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.Ping.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.Ping} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Ping.toObject = function(includeInstance, msg) {
  var f, obj = {
    pingId: jspb.Message.getFieldWithDefault(msg, 1, 0),
    localTimestamp: (f = msg.getLocalTimestamp()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f),
    lastRemoteTimestamp: (f = msg.getLastRemoteTimestamp()) && google_protobuf_timestamp_pb.Timestamp.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.Ping}
 */
proto.CarServer.Ping.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.Ping;
  return proto.CarServer.Ping.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.Ping} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.Ping}
 */
proto.CarServer.Ping.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPingId(value);
      break;
    case 2:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setLocalTimestamp(value);
      break;
    case 3:
      var value = new google_protobuf_timestamp_pb.Timestamp;
      reader.readMessage(value,google_protobuf_timestamp_pb.Timestamp.deserializeBinaryFromReader);
      msg.setLastRemoteTimestamp(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.Ping.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.Ping.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.Ping} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.Ping.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPingId();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getLocalTimestamp();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
  f = message.getLastRemoteTimestamp();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      google_protobuf_timestamp_pb.Timestamp.serializeBinaryToWriter
    );
  }
};


/**
 * optional int32 ping_id = 1;
 * @return {number}
 */
proto.CarServer.Ping.prototype.getPingId = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.Ping} returns this
 */
proto.CarServer.Ping.prototype.setPingId = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional google.protobuf.Timestamp local_timestamp = 2;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.CarServer.Ping.prototype.getLocalTimestamp = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 2));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.CarServer.Ping} returns this
*/
proto.CarServer.Ping.prototype.setLocalTimestamp = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Ping} returns this
 */
proto.CarServer.Ping.prototype.clearLocalTimestamp = function() {
  return this.setLocalTimestamp(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Ping.prototype.hasLocalTimestamp = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional google.protobuf.Timestamp last_remote_timestamp = 3;
 * @return {?proto.google.protobuf.Timestamp}
 */
proto.CarServer.Ping.prototype.getLastRemoteTimestamp = function() {
  return /** @type{?proto.google.protobuf.Timestamp} */ (
    jspb.Message.getWrapperField(this, google_protobuf_timestamp_pb.Timestamp, 3));
};


/**
 * @param {?proto.google.protobuf.Timestamp|undefined} value
 * @return {!proto.CarServer.Ping} returns this
*/
proto.CarServer.Ping.prototype.setLastRemoteTimestamp = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.Ping} returns this
 */
proto.CarServer.Ping.prototype.clearLastRemoteTimestamp = function() {
  return this.setLastRemoteTimestamp(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.Ping.prototype.hasLastRemoteTimestamp = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ScheduledChargingAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ScheduledChargingAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ScheduledChargingAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ScheduledChargingAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    enabled: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    chargingTime: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ScheduledChargingAction}
 */
proto.CarServer.ScheduledChargingAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ScheduledChargingAction;
  return proto.CarServer.ScheduledChargingAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ScheduledChargingAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ScheduledChargingAction}
 */
proto.CarServer.ScheduledChargingAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEnabled(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setChargingTime(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ScheduledChargingAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ScheduledChargingAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ScheduledChargingAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ScheduledChargingAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEnabled();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getChargingTime();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional bool enabled = 1;
 * @return {boolean}
 */
proto.CarServer.ScheduledChargingAction.prototype.getEnabled = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.ScheduledChargingAction} returns this
 */
proto.CarServer.ScheduledChargingAction.prototype.setEnabled = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional int32 charging_time = 2;
 * @return {number}
 */
proto.CarServer.ScheduledChargingAction.prototype.getChargingTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.ScheduledChargingAction} returns this
 */
proto.CarServer.ScheduledChargingAction.prototype.setChargingTime = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ScheduledDepartureAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ScheduledDepartureAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ScheduledDepartureAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ScheduledDepartureAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    enabled: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    departureTime: jspb.Message.getFieldWithDefault(msg, 2, 0),
    preconditioningTimes: (f = msg.getPreconditioningTimes()) && common_pb.PreconditioningTimes.toObject(includeInstance, f),
    offPeakChargingTimes: (f = msg.getOffPeakChargingTimes()) && common_pb.OffPeakChargingTimes.toObject(includeInstance, f),
    offPeakHoursEndTime: jspb.Message.getFieldWithDefault(msg, 5, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ScheduledDepartureAction}
 */
proto.CarServer.ScheduledDepartureAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ScheduledDepartureAction;
  return proto.CarServer.ScheduledDepartureAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ScheduledDepartureAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ScheduledDepartureAction}
 */
proto.CarServer.ScheduledDepartureAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setEnabled(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDepartureTime(value);
      break;
    case 3:
      var value = new common_pb.PreconditioningTimes;
      reader.readMessage(value,common_pb.PreconditioningTimes.deserializeBinaryFromReader);
      msg.setPreconditioningTimes(value);
      break;
    case 4:
      var value = new common_pb.OffPeakChargingTimes;
      reader.readMessage(value,common_pb.OffPeakChargingTimes.deserializeBinaryFromReader);
      msg.setOffPeakChargingTimes(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setOffPeakHoursEndTime(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ScheduledDepartureAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ScheduledDepartureAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ScheduledDepartureAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ScheduledDepartureAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEnabled();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getDepartureTime();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getPreconditioningTimes();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      common_pb.PreconditioningTimes.serializeBinaryToWriter
    );
  }
  f = message.getOffPeakChargingTimes();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      common_pb.OffPeakChargingTimes.serializeBinaryToWriter
    );
  }
  f = message.getOffPeakHoursEndTime();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
};


/**
 * optional bool enabled = 1;
 * @return {boolean}
 */
proto.CarServer.ScheduledDepartureAction.prototype.getEnabled = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
 */
proto.CarServer.ScheduledDepartureAction.prototype.setEnabled = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional int32 departure_time = 2;
 * @return {number}
 */
proto.CarServer.ScheduledDepartureAction.prototype.getDepartureTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
 */
proto.CarServer.ScheduledDepartureAction.prototype.setDepartureTime = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional PreconditioningTimes preconditioning_times = 3;
 * @return {?proto.CarServer.PreconditioningTimes}
 */
proto.CarServer.ScheduledDepartureAction.prototype.getPreconditioningTimes = function() {
  return /** @type{?proto.CarServer.PreconditioningTimes} */ (
    jspb.Message.getWrapperField(this, common_pb.PreconditioningTimes, 3));
};


/**
 * @param {?proto.CarServer.PreconditioningTimes|undefined} value
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
*/
proto.CarServer.ScheduledDepartureAction.prototype.setPreconditioningTimes = function(value) {
  return jspb.Message.setWrapperField(this, 3, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
 */
proto.CarServer.ScheduledDepartureAction.prototype.clearPreconditioningTimes = function() {
  return this.setPreconditioningTimes(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ScheduledDepartureAction.prototype.hasPreconditioningTimes = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional OffPeakChargingTimes off_peak_charging_times = 4;
 * @return {?proto.CarServer.OffPeakChargingTimes}
 */
proto.CarServer.ScheduledDepartureAction.prototype.getOffPeakChargingTimes = function() {
  return /** @type{?proto.CarServer.OffPeakChargingTimes} */ (
    jspb.Message.getWrapperField(this, common_pb.OffPeakChargingTimes, 4));
};


/**
 * @param {?proto.CarServer.OffPeakChargingTimes|undefined} value
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
*/
proto.CarServer.ScheduledDepartureAction.prototype.setOffPeakChargingTimes = function(value) {
  return jspb.Message.setWrapperField(this, 4, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
 */
proto.CarServer.ScheduledDepartureAction.prototype.clearOffPeakChargingTimes = function() {
  return this.setOffPeakChargingTimes(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.CarServer.ScheduledDepartureAction.prototype.hasOffPeakChargingTimes = function() {
  return jspb.Message.getField(this, 4) != null;
};


/**
 * optional int32 off_peak_hours_end_time = 5;
 * @return {number}
 */
proto.CarServer.ScheduledDepartureAction.prototype.getOffPeakHoursEndTime = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.ScheduledDepartureAction} returns this
 */
proto.CarServer.ScheduledDepartureAction.prototype.setOffPeakHoursEndTime = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.HvacClimateKeeperAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.HvacClimateKeeperAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.HvacClimateKeeperAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacClimateKeeperAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    climatekeeperaction: jspb.Message.getFieldWithDefault(msg, 1, 0),
    manualOverride: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.HvacClimateKeeperAction}
 */
proto.CarServer.HvacClimateKeeperAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.HvacClimateKeeperAction;
  return proto.CarServer.HvacClimateKeeperAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.HvacClimateKeeperAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.HvacClimateKeeperAction}
 */
proto.CarServer.HvacClimateKeeperAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.CarServer.HvacClimateKeeperAction.ClimateKeeperAction_E} */ (reader.readEnum());
      msg.setClimatekeeperaction(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setManualOverride(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.HvacClimateKeeperAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.HvacClimateKeeperAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.HvacClimateKeeperAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.HvacClimateKeeperAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getClimatekeeperaction();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getManualOverride();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.CarServer.HvacClimateKeeperAction.ClimateKeeperAction_E = {
  CLIMATEKEEPERACTION_OFF: 0,
  CLIMATEKEEPERACTION_ON: 1,
  CLIMATEKEEPERACTION_DOG: 2,
  CLIMATEKEEPERACTION_CAMP: 3
};

/**
 * optional ClimateKeeperAction_E ClimateKeeperAction = 1;
 * @return {!proto.CarServer.HvacClimateKeeperAction.ClimateKeeperAction_E}
 */
proto.CarServer.HvacClimateKeeperAction.prototype.getClimatekeeperaction = function() {
  return /** @type {!proto.CarServer.HvacClimateKeeperAction.ClimateKeeperAction_E} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.CarServer.HvacClimateKeeperAction.ClimateKeeperAction_E} value
 * @return {!proto.CarServer.HvacClimateKeeperAction} returns this
 */
proto.CarServer.HvacClimateKeeperAction.prototype.setClimatekeeperaction = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional bool manual_override = 2;
 * @return {boolean}
 */
proto.CarServer.HvacClimateKeeperAction.prototype.getManualOverride = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.HvacClimateKeeperAction} returns this
 */
proto.CarServer.HvacClimateKeeperAction.prototype.setManualOverride = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.SetChargingAmpsAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.SetChargingAmpsAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.SetChargingAmpsAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetChargingAmpsAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    chargingAmps: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.SetChargingAmpsAction}
 */
proto.CarServer.SetChargingAmpsAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.SetChargingAmpsAction;
  return proto.CarServer.SetChargingAmpsAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.SetChargingAmpsAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.SetChargingAmpsAction}
 */
proto.CarServer.SetChargingAmpsAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setChargingAmps(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.SetChargingAmpsAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.SetChargingAmpsAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.SetChargingAmpsAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetChargingAmpsAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getChargingAmps();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
};


/**
 * optional int32 charging_amps = 1;
 * @return {number}
 */
proto.CarServer.SetChargingAmpsAction.prototype.getChargingAmps = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.CarServer.SetChargingAmpsAction} returns this
 */
proto.CarServer.SetChargingAmpsAction.prototype.setChargingAmps = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.SetCabinOverheatProtectionAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.SetCabinOverheatProtectionAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.SetCabinOverheatProtectionAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetCabinOverheatProtectionAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    fanOnly: jspb.Message.getBooleanFieldWithDefault(msg, 2, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.SetCabinOverheatProtectionAction}
 */
proto.CarServer.SetCabinOverheatProtectionAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.SetCabinOverheatProtectionAction;
  return proto.CarServer.SetCabinOverheatProtectionAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.SetCabinOverheatProtectionAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.SetCabinOverheatProtectionAction}
 */
proto.CarServer.SetCabinOverheatProtectionAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setFanOnly(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.SetCabinOverheatProtectionAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.SetCabinOverheatProtectionAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.SetCabinOverheatProtectionAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetCabinOverheatProtectionAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getFanOnly();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
};


/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.SetCabinOverheatProtectionAction.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.SetCabinOverheatProtectionAction} returns this
 */
proto.CarServer.SetCabinOverheatProtectionAction.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional bool fan_only = 2;
 * @return {boolean}
 */
proto.CarServer.SetCabinOverheatProtectionAction.prototype.getFanOnly = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.SetCabinOverheatProtectionAction} returns this
 */
proto.CarServer.SetCabinOverheatProtectionAction.prototype.setFanOnly = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.SetVehicleNameAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.SetVehicleNameAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.SetVehicleNameAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetVehicleNameAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    vehiclename: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.SetVehicleNameAction}
 */
proto.CarServer.SetVehicleNameAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.SetVehicleNameAction;
  return proto.CarServer.SetVehicleNameAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.SetVehicleNameAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.SetVehicleNameAction}
 */
proto.CarServer.SetVehicleNameAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVehiclename(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.SetVehicleNameAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.SetVehicleNameAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.SetVehicleNameAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetVehicleNameAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVehiclename();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string vehicleName = 1;
 * @return {string}
 */
proto.CarServer.SetVehicleNameAction.prototype.getVehiclename = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.SetVehicleNameAction} returns this
 */
proto.CarServer.SetVehicleNameAction.prototype.setVehiclename = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ChargePortDoorClose.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ChargePortDoorClose.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ChargePortDoorClose} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargePortDoorClose.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ChargePortDoorClose}
 */
proto.CarServer.ChargePortDoorClose.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ChargePortDoorClose;
  return proto.CarServer.ChargePortDoorClose.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ChargePortDoorClose} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ChargePortDoorClose}
 */
proto.CarServer.ChargePortDoorClose.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ChargePortDoorClose.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ChargePortDoorClose.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ChargePortDoorClose} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargePortDoorClose.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.ChargePortDoorOpen.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.ChargePortDoorOpen.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.ChargePortDoorOpen} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargePortDoorOpen.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.ChargePortDoorOpen}
 */
proto.CarServer.ChargePortDoorOpen.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.ChargePortDoorOpen;
  return proto.CarServer.ChargePortDoorOpen.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.ChargePortDoorOpen} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.ChargePortDoorOpen}
 */
proto.CarServer.ChargePortDoorOpen.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.ChargePortDoorOpen.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.ChargePortDoorOpen.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.ChargePortDoorOpen} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.ChargePortDoorOpen.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.SetCopTempAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.SetCopTempAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.SetCopTempAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetCopTempAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    copactivationtemp: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.SetCopTempAction}
 */
proto.CarServer.SetCopTempAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.SetCopTempAction;
  return proto.CarServer.SetCopTempAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.SetCopTempAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.SetCopTempAction}
 */
proto.CarServer.SetCopTempAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.CarServer.ClimateState.CopActivationTemp} */ (reader.readEnum());
      msg.setCopactivationtemp(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.SetCopTempAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.SetCopTempAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.SetCopTempAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.SetCopTempAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCopactivationtemp();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
};


/**
 * optional ClimateState.CopActivationTemp copActivationTemp = 1;
 * @return {!proto.CarServer.ClimateState.CopActivationTemp}
 */
proto.CarServer.SetCopTempAction.prototype.getCopactivationtemp = function() {
  return /** @type {!proto.CarServer.ClimateState.CopActivationTemp} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.CarServer.ClimateState.CopActivationTemp} value
 * @return {!proto.CarServer.SetCopTempAction} returns this
 */
proto.CarServer.SetCopTempAction.prototype.setCopactivationtemp = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlSetPinToDriveAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlSetPinToDriveAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlSetPinToDriveAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSetPinToDriveAction.toObject = function(includeInstance, msg) {
  var f, obj = {
    on: jspb.Message.getBooleanFieldWithDefault(msg, 1, false),
    password: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlSetPinToDriveAction}
 */
proto.CarServer.VehicleControlSetPinToDriveAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlSetPinToDriveAction;
  return proto.CarServer.VehicleControlSetPinToDriveAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlSetPinToDriveAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlSetPinToDriveAction}
 */
proto.CarServer.VehicleControlSetPinToDriveAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOn(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlSetPinToDriveAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlSetPinToDriveAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlSetPinToDriveAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlSetPinToDriveAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOn();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional bool on = 1;
 * @return {boolean}
 */
proto.CarServer.VehicleControlSetPinToDriveAction.prototype.getOn = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.CarServer.VehicleControlSetPinToDriveAction} returns this
 */
proto.CarServer.VehicleControlSetPinToDriveAction.prototype.setOn = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.CarServer.VehicleControlSetPinToDriveAction.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.CarServer.VehicleControlSetPinToDriveAction} returns this
 */
proto.CarServer.VehicleControlSetPinToDriveAction.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.CarServer.VehicleControlResetPinToDriveAction.prototype.toObject = function(opt_includeInstance) {
  return proto.CarServer.VehicleControlResetPinToDriveAction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.CarServer.VehicleControlResetPinToDriveAction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlResetPinToDriveAction.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.CarServer.VehicleControlResetPinToDriveAction}
 */
proto.CarServer.VehicleControlResetPinToDriveAction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.CarServer.VehicleControlResetPinToDriveAction;
  return proto.CarServer.VehicleControlResetPinToDriveAction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.CarServer.VehicleControlResetPinToDriveAction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.CarServer.VehicleControlResetPinToDriveAction}
 */
proto.CarServer.VehicleControlResetPinToDriveAction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.CarServer.VehicleControlResetPinToDriveAction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.CarServer.VehicleControlResetPinToDriveAction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.CarServer.VehicleControlResetPinToDriveAction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.CarServer.VehicleControlResetPinToDriveAction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};


/**
 * @enum {number}
 */
proto.CarServer.OperationStatus_E = {
  OPERATIONSTATUS_OK: 0,
  OPERATIONSTATUS_ERROR: 1
};

goog.object.extend(exports, proto.CarServer);
