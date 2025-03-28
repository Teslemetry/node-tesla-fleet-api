// source: keys.proto
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

goog.exportSymbol('proto.Keys.Role', null, global);
/**
 * @enum {number}
 */
proto.Keys.Role = {
  ROLE_NONE: 0,
  ROLE_SERVICE: 1,
  ROLE_OWNER: 2,
  ROLE_DRIVER: 3,
  ROLE_FM: 4,
  ROLE_VEHICLE_MONITOR: 5,
  ROLE_CHARGING_MANAGER: 6
};

goog.object.extend(exports, proto.Keys);
