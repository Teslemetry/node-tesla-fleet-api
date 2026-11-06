# tesla-fleet-api

## 0.9.0

### Minor Changes

- 2122ecd: A new `client` option names your application, and is sent as the `X-Client` header on every request. `X-Library` is unchanged.

## 0.8.0

### Minor Changes

- b5d35a9: Bluetooth readers of infotainment, such as `charge_state`, now wake a sleeping car and read again when `wake_if_asleep` is on, as commands already did, instead of raising `BluetoothTimeout`. `vehicle_state` reads VCSEC and still never wakes the car. Python's readers do not wake the car.

## 0.7.0

### Minor Changes

- b78bd8a: `VehicleBluetooth` takes `idle_disconnect_ms`, which closes the link once no command, read or connect has been in progress for that long, so an app that connects per command does not hold one of the vehicle's Bluetooth slots. The next command reconnects. It is off by default, and `HOMEY_VEHICLE_OPTIONS` sets it to 30 s.

## 0.6.1

### Patch Changes

- 580adbc: `HOMEY_VEHICLE_OPTIONS.connect_timeout_ms` is now 15 s instead of 4 s. On a real Homey, a connect made more than 30 s after a scan takes about 12 s, because `ble.find` runs its own 10 s discovery, so the 4 s bound failed every such connect.

## 0.6.0

### Minor Changes

- 9aebb62: Apply the BLE-00 (HW-0) measurements from a real Homey to the Homey Bluetooth adapter. `HOMEY_MAX_WRITE_SIZE` is now `null`, so a frame goes in one write (only a 114-byte frame was measured; pass `maxWriteSize: 20` to chunk again). The adapter sets a 15 s scan bound, `HOMEY_SCAN_TIMEOUT_MS`, because a fresh `discover()` takes about 10 s. `BleTransport` gains an optional `scanTimeoutMs`, which `scan_timeout_ms` overrides.
- c231394: Remove the `./bluetooth/esphome` export (`EsphomeBleTransport`) and the optional `@2colors/esphome-native-api` peer dependency. Use `./bluetooth/noble` or `./bluetooth/homey` instead.

## 0.5.0

### Minor Changes

- b0a6ce9: Add AES-GCM personalized signing and response decryption to `Commands`, for transports that set `authMethod = "aes"`. `Session` gains `aesGcmPersonalized()` and `record_response_counter`, a 256-entry replay cache cleared on a new epoch, and a repeated `(requestHash, counter)` raises `SignedCommandResponseReplayed`. Any encrypted reply is now opened, by either auth method. `VehicleSigned` keeps sending HMAC-signed plaintext.
- 208b368: Add Bluetooth broadcast listeners to `VehicleBluetooth`: a typed `listen_*` for each `VehicleStatus` field, and `listen_broadcast` for raw broadcasts on a domain.
- ef997df: `VehicleBluetooth.charge_port_door_open` under `confirmation: "verify"` readies the charging subsystem, writes one opening, and succeeds only on physical state: the cable latch released, or the flap open with no cable. An unresolved opening always raises `BluetoothUnconfirmedCommand`, even with `raise_unconfirmed: false`, and is never sent again. Other confirmation modes are unchanged.
- 208b368: Add the Bluetooth confirmation ladder to `VehicleBluetooth`: `confirmation` (`"optimistic"`, `"ack"`, `"verify"`) and `raise_unconfirmed`, with broadcast confirmation of lock and unlock, and verify reads for the seven commands whose result can be read back.
- 5f5f571: Add `tesla-fleet-api/bluetooth/esphome`: `EsphomeBleTransport`, a Bluetooth backend through an ESPHome Bluetooth proxy over `@2colors/esphome-native-api`, which is an optional peer dependency and loads only when used.
- 208b368: Add the Bluetooth framing module: length-prefixed frames, write chunking and notification reassembly, with the GATT UUIDs and timing constants.
- 5f5f571: Add `tesla-fleet-api/bluetooth/homey`: `HomeyBleTransport`, a Bluetooth backend for a Homey app's `this.homey.ble`, built on structural types with no `homey` dependency. Its defaults are conservative until the BLE-00 hardware probe has run.
- 208b368: Add the idle Bluetooth keepalive and `listen_connection_status` to `VehicleBluetooth`.
- 5f5f571: Add `tesla-fleet-api/bluetooth/noble`: `NobleBleTransport`, a Bluetooth backend over `@stoprocent/noble`, which is an optional peer dependency and loads only when used.
- ef997df: Add `VehicleBluetooth.pair({ role, form, timeoutMs, pollIntervalMs, signal })`. It writes the whitelist operation exactly once and confirms by the reply or by polling a VCSEC handshake, so the wait survives a dropped link. An `AbortSignal` ends the wait with no further write.
- ef997df: Add the Bluetooth readers to `VehicleBluetooth`: all 24 vehicle-data sub-states, an explicit-list `vehicle_data(endpoints)`, and `query_display_name`, `query_appearance` and `query_version`, which return `null` when a characteristic is out of reach. Add the Bluetooth-only closure commands, `open_`/`close_` for each door and the rear trunk. `vehicle_data` with no list or REST endpoint names raises `BluetoothCloudUnavailableError`, sending nothing.
- ef997df: Add `BleBroadcastStreamGlue` and `BleBroadcastPublisher` to `tesla-fleet-api/bluetooth`. The glue feeds a `VehicleBluetooth`'s broadcasts into any object with `ingest(data, metadata)`, and the publisher feeds them into an `ObservationFunnel`. Neither imports a stream package or touches the link.
- 208b368: Add the `tesla-fleet-api/bluetooth` entry with the `BleTransport` contract an adapter implements. It needs no GATT library or native module, and the root entry does not load it.
- 208b368: Add `VehicleBluetooth` and `TeslaBluetooth` to `tesla-fleet-api/bluetooth`: connect with retries, reply routing, and signed commands over any `BleTransport`. A REST method on a Bluetooth-only vehicle raises `BluetoothCloudUnavailableError` and sends nothing.
- ef997df: `VehicleBluetooth` now wakes a sleeping car. `wake_up({ wait, timeoutMs })` resends the RKE wake every 3 s until a fresh infotainment handshake answers, an infotainment command on a sleeping car wakes it and sends once more, and an awake car whose infotainment is still booting gets up to 20 s of handshake retries. The new `wake_probe_timeout_ms` option sets the reply wait of one readiness probe, for a link with slow replies.
- 24ddc2d: **Breaking changes in this release, in one place.** Each has its own entry below with the detail.

  Renames, with no aliases:

  - `api.vehicle` is `api.vehicles`, `api.energy` is `api.energySites`, `vehicle.signed()` is `createSigned()`, `energy.specific()` is `create()`, and `Tessie.vehicles()` is `list_vehicles()`.
  - `actuate_truck` is `actuate_trunk`, `fleet_telemetry_config` is `fleet_telemetry_config_create`, and `validateAndUpdateSession` is `validate_msg`.
  - `loadPrivateKey` is gone. Use `get_private_key`.
  - `Teslemetry` and `Tessie` vehicles come from `vehicles.create(vin)`. `createFleet`, `createSigned`, `specific` and `specificSigned` are gone from both.

  Reply shapes:

  - `products`, `vehicle`, `vehicle_data`, `drivers`, `live_status` and `site_info` return the `{ response }` envelope. `Teslemetry.test()` does too, and `Tessie.list_vehicles()` returns `{ results }`.
  - `LiveStatusResponse` values may be `null`.
  - Signed `nearby_charging_sites` returns its sites under `response.getNearbyChargingSites`.
  - Signed replies carry their payloads, so a read no longer resolves as a bare success.

  Arguments:

  - `trigger_homelink` takes `(token?, lat?, lon?)`, after `vehicle_tag` on `Vehicle`.
  - `navigation_request` takes `(value, type?, locale?, timestamp_ms?)`, after `vehicle_tag` on `Vehicle`. `locale` was second and required.
  - `remote_seat_cooler_request` takes `AutoSeat` positions on both paths.
  - Signed `remote_steering_wheel_heat_level_request` takes `Level` 0, 1 and 3, where 3 is high.
  - `backup_history` and `energy_history` take `(period, start_date?, end_date?, time_zone?)`, and `charge_history` takes `(start_date, end_date, time_zone?)`.
  - `wake_up` takes `{ wait?, timeoutMs? }`.

  Subclasses of `Commands`:

  - `_send` is `_send(msg, requires, options?)`, and `validate_msg` needs the request's domain as a third argument.
  - A session pins the vehicle's public key at first contact, so a vehicle that really was re-keyed needs a new instance.

- b0a6ce9: Prepare `Commands` for transports other than the cloud. `_send` is now `_send(msg, requires, options?)` with `expectsData`, `timeoutMs`, `optimistic` and `confirmBroadcast`; `VehicleSigned` ignores them. `Commands` gains protected `fromDestination`, `publicKey`, `sessionFor`, `ensureHandshake`, `handshake`, `sessionInfoRequest`, `buildMessage`, `dispatch`, `sendVehicleSecurity`, `sendInfotainment` (with a `mutating` flag, false only for `ping`) and `authMethod`. A handshake now discards a reply that fails authentication and tries again, three attempts one second apart. `privateKey: false` disables signing, so any handshake raises `SigningDisabled`; `undefined` still falls back to the parent's key. `Vehicle.private_key` and the derived `Session` keys are now accessors over native private fields, so they stay out of `JSON.stringify` and structured logs.
- 76d1c7c: Bring the REST and signed paths of `VehicleSpecific` and `Commands` to the same instruction from the same arguments, matching `python-tesla-fleet-api`:

  - Breaking: `remote_seat_cooler_request` takes `AutoSeat` positions (1 front left, 2 front right) on both paths, as Tesla's proxy reads them. It no longer takes `Seats` names other than the two fronts, and signed `0` and `1` no longer mean the front seats.
  - Breaking: signed `remote_steering_wheel_heat_level_request` takes `Level` 0, 1 and 3, as REST does. `2` is refused, since there is no medium level, and `3` is now high.
  - Breaking: `trigger_homelink` takes `(token?, lat?, lon?)` on `Vehicle` (after `vehicle_tag`), `VehicleSpecific` and `Commands`, as in Python, in place of `(lat, lon, token)`. The request for the same values does not change.
  - Signed `adjust_volume` rejects a volume outside 0 to 11, and signed `window_control` rejects an unknown command rather than closing the windows.
  - Signed `sun_roof_control` accepts `"open"`.
  - `set_valet_mode` password, `trigger_homelink` coordinates and token, and `window_control` coordinates are optional. `trigger_homelink` sends a location only when it has both coordinates, and `0` is a coordinate.
  - REST `navigation_gps_request` sends `order: 0` when omitted, like the signed path.

- 8622e55: Add energy device commands to `EnergySpecific`: `get_system_info`, `raw_networking_status`, `get_networking_status`, `wifi_scan`, `get_device_cert`, `get_cellular_info`, `check_for_update`, `check_for_update_urgency`, `check_internet`, `set_local_site_config`, `list_authorized_clients`, `add_authorized_client`, `remove_authorized_client`, `get_signed_commands_public_key`, `get_backup_events`, `schedule_backup_event`, `cancel_backup_event` and `get_teg_config`.
- 8622e55: Add `EnergyDeviceSigner` and the signed energy device transport. A site created with an RSA key and the gateway DIN signs device commands and posts them to `device_command`, except the four pre-pairing reads in `UNSIGNED_DEVICE_COMMANDS`. A device error inside an HTTP 200 reply raises `InvalidCommand` (code 12) or `DeviceUnexpectedResponse`, and a signed send is never retried. A site created without a key is unsigned: unlike vehicles, it does not fall back to the parent's key.
- 8622e55: Add `dispatch_battery_power`, `resume_battery_operation`, `set_island_mode`, `go_off_grid` and `reconnect_grid` to `EnergySpecific`, with `validate_dispatch_battery_power` and `MAX_DISPATCH_DURATION_SECONDS`. Island commands are signed only and raise `SignedCommandRequired` without a key, because gateways acknowledge the unsigned `grpc_command` without operating the contactor.
- 1e92de1: `set_island_mode` now accepts only `EnergyIslandMode.ON_GRID` (1) and `OFF_GRID` (6), and throws `TypeError` before signing on anything else. It does not coerce `"6"`, and a missing mode has no default. `force` must be a boolean when given.
- 1e92de1: `set_island_mode`, `go_off_grid` and `reconnect_grid` now raise `DeviceUnexpectedResponse` when the gateway refuses, for example `REJECTED_LOW_ENERGY`, instead of returning the refusal as a normal reply. `data` holds `{code, message}`, with `message` the result's name.
- 8622e55: Bring energy site REST methods in line with `python-tesla-fleet-api`. `backup_history` and `energy_history` now take `(period, start_date?, end_date?, time_zone?)` and `charge_history` takes `(start_date, end_date, time_zone?)`, each setting `kind` itself. `live_status` and `site_info` now return the `{ response }` envelope instead of the unwrapped payload. `EnergySpecific` gains `time_of_use_settings(settings)`.
- a8b9352: `tesla-fleet-api/router` adds `EnergySiteRouter` and the merge helpers `merge_local_into_cloud`, `merge_live_status` and `merge_site_info`, with `LOCAL_LIVE_STATUS_KEYS` and `LOCAL_SITE_INFO_KEYS` (RTR-2). A key overlays only when it is owned and not null, so a zero reading wins and a key local cannot serve keeps its cloud value. The helpers take unwrapped documents, the value under `response`.
- 310bdfd: Key handling, compatible with python-tesla-fleet-api's key files:

  - **Breaking:** `loadPrivateKey` is removed. It wrote no file and replaced `accessToken` with the PEM.
  - New on every client: `get_private_key`, `get_rsa_private_key`, `private_key`, `rsa_private_key`, `has_private_key`, `has_rsa_private_key`, `public_pem`, `public_uncompressed_point`, `ec_public_der_spki`, `ec_public_der_spki_b64`, `rsa_public_der_pkcs1`, `rsa_public_der_pkcs1_b64` and `rsa_public_pem`. `get_private_key` returns the raw 32-byte `Buffer` that `Commands` takes, and `get_rsa_private_key` an RSA `KeyObject`.
  - New files are created at mode 0600 with no world-readable window; a process that loses the create race reads the winner's file. An unusable existing key raises `PrivateKeyError` with reason `unreadable`, `encrypted`, `malformed` or `wrong_type`.
  - `createSigned` falls back to the client's `private_key`.
  - New in-memory helpers for keys kept outside files: `generate_ec_private_key_pem`, `generate_rsa_private_key_pem`, `ec_private_key_from_pem` and `rsa_public_der_pkcs1`.

- 115dde8: Allow `null` in `LiveStatusResponse`, and make `timestamp` optional. A reader of `live_status` must now handle a key being `null`.
- c1e10e6: Keep more secrets out of debug logs. Redaction now covers `password` (the PIN in `set_pin_to_drive` and `set_valet_mode`), `token`, `tokens` and `private_key`, in any case or separator style. A failed request logs a message only for a `TeslaFleetError`; any other error logs its class name alone, because its message may hold a secret from a token function or transport.
- 24ddc2d: **Breaking:** `navigation_request` now matches Python: `(value, type?, locale?, timestamp_ms?)`, after `vehicle_tag` on `Vehicle`. `locale` was second and required, so `navigation_request(value, "en-AU")` now sends `"en-AU"` as the `type`. `locale` defaults to the new exported `DEFAULT_LOCALE`, this process's locale, and `timestamp_ms` to now. `timestamp_ms` is sent as an integer rather than a string, and the body's keys follow Python's order. The signed path keeps the same positions and sends only the destination, as Python's does.
- a8b9352: Add the observation funnel, ported from python-tesla-fleet-api (FNL-1): `ObservationFunnel`, `FieldPath`, `VehicleDataResultPublisher`, `TeslemetryStreamPublisher`, `LOCK_STATES` and `CLOSURE_STATES`, with the `Observation`, `ObservationSink` and `Publisher` types. Many push sources feed one listener per field, so a field survives the loss of any one source. It is a funnel, not a selector: entirely synchronous, with no request path, source selection, health or priority. Older observations drop, unchanged values skip, and an unmapped value emits nothing.
- 24ddc2d: Fill the small gaps a fresh comparison with python-tesla-fleet-api found. Export `Charging`, `Partner` and `User` from the root, and `BroadcastListeners` and the `VerifyPlan` type from `tesla-fleet-api/bluetooth`. Add `jws.public_key_bytes` and `VehiclesBluetooth.create`, Python's other name for `createBluetooth`.
- 2cec6c8: Publish the local Powerwall client as `tesla-fleet-api/powerwall` (PW-17): `PowerwallClient`, the gateway merge classes and the `Powerwall*` errors. The read-only check ran on a real Powerwall 3 gateway. No write has run from Node on real hardware, so treat each write as not yet verified.
- 036d760: Rename the product factories to their `python-tesla-fleet-api` names, with no aliases: `api.vehicle` is now `api.vehicles` and `api.energy` is now `api.energySites`. `api.vehicles` gains `createFleet(vin)` (returns `VehicleSpecific`), `createSigned(vin, private_key?, public_key?)` (returns `VehicleSigned`) and the legacy `specificSigned`, replacing `signed()`. `api.energySites.specific(id)` is now `create(id, private_key?, din?)`. Each factory keeps a `Map` of what it created (`byVin`, `byId`). The instantiated classes are static fields (`TeslaFleetApi.Vehicles`/`EnergySites`, `Vehicle.Fleet`/`Signed`, `Energy.Site`) that subclasses override. `Tessie.vehicles()` is now `list_vehicles()`, matching Python and freeing the `vehicles` field.
- f247145: `_request` parity with python-tesla-fleet-api (COR-2):

  - `accessToken` may be a function returning `Promise<string | null>`, called on every request; `access_token()` raises `MissingToken` for a null token.
  - New `fetch` option (used in place of the global `fetch`) and `logger` option (`{ debug(message) }`, silent by default; `debug: true` still logs to `console.debug`). Log lines use Python's `command= transport= result=` fields, for REST and signed commands alike, and never contain the token.
  - `X-Library: node tesla_fleet_api <version>`. No `?` on an empty query, booleans lower-cased in the query, `Content-Type` only with a body, and a GET body is dropped instead of throwing.
  - New `find_server()` (walks `SERVERS`, skipping `InvalidRegion`; Teslemetry uses `metadata()`), `status()`, `partner_login()`, `region`, and the `vcsec_command_name` / `infotainment_command_name` helpers.
  - `Teslemetry` and `Tessie` accept the token function and an options object (`fetch`, `logger`, `debug`, `timeout`).

- 9c91c69: Add the REST vehicle methods `navigation_waypoints_request`, `fleet_telemetry_config_jws`, `add_charge_schedule`, `add_precondition_schedule`, `remove_charge_schedule`, `remove_precondition_schedule`, `batch_remove_charge_schedules` and `batch_remove_precondition_schedules` to `VehicleSpecific`, and export `days_of_week_mask` and `DAY_OF_WEEK_BITS`, matching `python-tesla-fleet-api`.
- 861ee5b: REST vehicle fixes (breaking):

  - Rename `actuate_truck` to `actuate_trunk` and `fleet_telemetry_config` to `fleet_telemetry_config_create`, with no aliases.
  - `clear_pin_to_drive_admin` takes an optional `pin`, sent in the request body.
  - `wake_up` takes `{ wait?, timeoutMs? }`. With `wait: true` it polls `vehicle()` until the vehicle is `online` and throws `VehicleOffline` at the deadline (default 60s).
  - `products`, `vehicle`, `vehicle_data` and `drivers` return the full `{ response }` envelope instead of unwrapping it.
  - `remote_seat_heater_request` sends `heater` and `level`, which is what the REST endpoint expects.

- b0a6ce9: Pin the vehicle's public key at first contact, as Tesla's Go SDK does. An established session now verifies every `SessionInfo` with its stored keys and refuses a different public key with `SessionInfoAuthenticationFault`, changing nothing, so a forged reply can no longer replace the session key. A vehicle that really was re-keyed needs a new instance. `Session.publicKey` is read-only, and `Session.trustedKeys` is new. A clock or counter too near the `uint32` limit to sign with now raises `SessionInfoAuthenticationFault` instead of a bare `invalid uint32`.
- 76d1c7c: Sign the charging and schedule commands on `Commands`: `add_charge_schedule`, `remove_charge_schedule`, `add_precondition_schedule`, `remove_precondition_schedule`, `batch_remove_charge_schedules` and `batch_remove_precondition_schedules`, which were plaintext REST on `VehicleSigned`, plus `update_charge_on_solar`, `get_charge_on_solar`, `set_rate_tariff`, `get_rate_tariff`, `add_managed_charging_site`, `remove_managed_charging_site`, `get_managed_charging_sites` and `set_discharge_limit`. Schedule methods take a trailing `name`, which only the signed path sends.

  Fix signed `set_scheduled_departure`: it always sent both recurrence blocks, and a present block switches its feature on, so preconditioning and off-peak charging could not be left off. It now reads `preconditioning_enabled` and `off_peak_charging_enabled`.

- 76d1c7c: Sign the closure and navigation commands on `Commands`: `media_volume_up`, `navigation_waypoints_request`, `navigation_gps_destination_request`, `navigation_route`, `open_tonneau`, `close_tonneau`, `stop_tonneau`, `auto_secure_vehicle` and `reset_pin_to_drive_admin`. `navigation_waypoints_request` no longer falls through to the plaintext REST route on `VehicleSigned`.
- 76d1c7c: Sign the comfort, media and misc commands on `Commands`: `set_keep_accessory_power_mode`, `set_low_power_mode`, `set_recirculation`, `set_suspension_level`, `set_tent_mode`, `start_light_show`, `stop_light_show`, `dashcam_save_clip`, `cancel_soh_test`, `video_request` and `get_messages`. `nearby_charging_sites` is now signed on `VehicleSigned`, and its sites arrive under `response.getNearbyChargingSites` rather than the REST shape.
- b0a6ce9: Signed commands now handle a session info reply with no public key: `KEY_NOT_ON_WHITELIST` raises `NotOnWhitelistFault` and any other status raises `SessionInfoAuthenticationFault`, instead of a crypto error. Undecodable session info and an invalid public key also raise `SessionInfoAuthenticationFault`. VCSEC `commandStatus` is interpreted as in Python: a rejected whitelist operation raises the matching `WhitelistOperation*` class, and `OPERATIONSTATUS_ERROR` never reports success.
- 76d1c7c: Sign the Cybertruck and power commands on `Commands`: `set_powershare_feature`, `set_powershare_request`, `set_powershare_discharge_limit`, `set_outlets`, `set_outlet_timer`, `set_outlet_soc_limit`, `set_power_feed`, `set_power_feed_timer`, `set_power_feed_soc_limit`, `set_lightbar_brightness`, `set_lightbar_middle`, `set_lightbar_ditch`, `set_front_zone_lights`, `set_rear_zone_lights`, `set_trailer_light_test`, `set_truck_bed_light_auto` and `set_truck_bed_light_brightness`.
- 76d1c7c: Add the signed commands `format_usb` and `delete_dashcam_clips` to `Commands`. Both are irreversible and take no confirmation parameter, as with `erase_user_data`.
- 76d1c7c: Sign the niche commands on `Commands`: `pii_key_request`, `pseudonym_sync_request`, `tesla_auth_response`, `setup_cloud_profile_with_local_profile_uuid`, `get_local_profiles_for_vault_uuid`, `bluetooth_classic_pairing_request`, `bandwidth_test` and `fetch_keys_info`.
- 76d1c7c: Sign the parental control and display unit commands on `Commands`: `parental_controls`, `parental_controls_clear_pin`, `parental_controls_clear_pin_admin`, `parental_controls_enable_setting`, `parental_controls_set_speed_limit`, `set_temperature_unit`, `set_distance_unit`, `set_time_display_format`, `set_tire_pressure_unit`, `set_energy_display_format` and `set_phone_setting_preferences`.
- b0a6ce9: Signed replies now carry their payloads as in Python. An Infotainment reply returns `vehicleData`, and any other `Response` payload under its field name alongside `result` and `reason`. `vehicleStatus` is success for an actuation and the data for a read. New on `Commands`: `ping` (`reason` is the vehicle's timestamp in ISO 8601), `handshakeVehicleSecurity`, `handshakeInfotainment`, `shared_key`, and the protected reads `_getVehicleSecurity` and `_getInfotainment`, which raise `InvalidResponse` for a reply with no data. `validateAndUpdateSession` is renamed `validate_msg`, with no alias.
- 3605b2f: Add `unwrapTariffV2` (also on `tesla-fleet-api/tariff`), which extracts `tariff_content_v2` from a `site_info` response, a `time_of_use_settings` body, or a bare tariff, and throws `InvalidResponse` on a null or malformed body. Add `firmwareCompare` and `firmwareAtLeast`, which compare dotted firmware versions numerically, so `"2025.10"` is ahead of `"2025.9"` and `"Unknown"` sorts behind any version.
- b0a6ce9: Add Tesla.SS256, exported as `jws` with `sign`, `verify`, `sign_jws` and `sign_fleet_telemetry_config`. `VehicleSigned.fleet_telemetry_config_create` now signs the config with the vehicle's command key and posts `{ vins, token }` to `fleet_telemetry_config_jws`, taking either the config alone or Python's `{ vins, config }`.
- 310bdfd: Add `TeslaFleetOAuth`, a port of python-tesla-fleet-api's OAuth client: `get_login_url`, `get_refresh_token`, `access_token`, `check_access_token` and `refresh_access_token`, with the token host following the region and an expired token refreshed before each request. `expires` is in epoch seconds, as in Python. Concurrent requests share one refresh, because Tesla's refresh tokens are single use. A refused code exchange or refresh rejects with the matching `TeslaFleetError`, e.g. `LoginRequired`.
- c1e10e6: Add the Teslemetry account routes: `ping`, `userdata`, `scopes`, `server_side_polling`, `vehicle_data_refresh`, `migrate_to_oauth`, `fields`, `vehicle_config`, `streaming_config`, `stop_streaming`, `modify_streaming_config` and `create_streaming_config`, plus the `register_client` function with `REGISTER_URL` and the `TeslemetryClientRegistration` type. `Teslemetry.test()` now returns the `{ response }` envelope, matching Python, and `Teslemetry` gains the `user` client. Debug logs no longer contain tokens or PINs, and the status line no longer repeats the query string.
- 8622e55: Add `TeslemetryEnergySite` and `TeslemetryEnergySites`, which back `Teslemetry.energySites`. A site with a signing key sends the flat `device_command` body, and a site without one uses Teslemetry's own routes. Add `find_authorized_clients`, `find_gateway_address` and the free functions `parse_authorized_clients` and `parse_gateway_address`, which raise `InvalidResponse` on a null body rather than reading it as "no clients" or "no address".
- c1e10e6: Add `TeslemetryVehicle.telemetry(topics?, cursor?)` and `create_telemetry_tracker(topics?)`, whose `TeslemetryVehicleTelemetry.update()` advances a cursor and merges each change into `snapshot`. Add the `SnapshotTopic` and `WaitTopic` constants.
- c1e10e6: Add `TeslemetryVehicle`, with Teslemetry's `custom_command` routes (`closure`, `seat_heater`, `charge_on_solar`, the lightbar, outlet, power feed, Powershare and parental control commands, `trigger_rate_tariff_update` and others), `data_refresh` and the deprecated `server_side_polling`. `Teslemetry.vehicles` is now a `TeslemetryVehicles`: `vehicles.create(vin)` returns a `TeslemetryVehicle`, and `createFleet`, `createSigned`, `specific` and `specificSigned` are gone, because Teslemetry cannot use the Fleet API directly.
- c1e10e6: Add `TessieVehicle`'s data reads and management routes: `state`, `battery`, `battery_health`, `states`, `location`, `map`, `drives`, `path`, `charges`, `idles`, `drivers`, `invitations`, `get_fleet_telemetry_config`, `tire_pressure`, `plate` and others, plus `Tessie.all_battery_health` and `Tessie.charging_invoices`. Time ranges are given as `start` and `end` and sent as `from` and `to`.
- c1e10e6: Add `TessieVehicle` with Tessie's commands, all sent as `POST {vin}/command/<name>` with `wait_for_completion` and `max_attempts` in the query string. `Tessie` takes both as constructor options, defaulting to `true` and 3, and gains `scopes()` and the `user` client. `Tessie.vehicles` is now a `TessieVehicles`: `vehicles.create(vin)` returns a `TessieVehicle`, and `createFleet`, `createSigned`, `specific` and `specificSigned` are gone. `Tessie.list_vehicles()` now returns Tessie's `{ results }` reply, matching Python, instead of the bare list.
- a8b9352: `tesla-fleet-api/router` adds `VehicleRouter`, a typed facade with per-command failover across an ordered list of backends, ported from python-tesla-fleet-api (RTR-1):

  - `new VehicleRouter([primary, secondary, ...more], { health, on_result, logger })`. Methods are derived from the backends at construction, with no `Proxy` and no method list, and are typed from them: a misspelt method, a wrong argument, and a method whose backends disagree on arguments are compile errors. Use `router.primary` where backends legitimately differ.
  - `is_failover_safe` and `FAILOVER_SAFE_ERRORS` decide failover. A boolean `failover_safe` on any thrown value decides for itself, which lets a backend the router cannot import mark its own errors.
  - `BluetoothUnconfirmedCommand` is rethrown at once, is never replayed and never reaches `on_result`, on any backend in the chain. It is recognised by its `unconfirmed` field as well as `instanceof`, so it holds when the package is loaded through both `import` and `require`.
  - A failed call is replayed on the next backend, so a non-idempotent command that fails mid-flight can run twice. Callers that need exactly-once gate with a health check or call a backend directly.

- b0a6ce9: `validate_msg` now takes the request's domain as a third argument and refuses a `SessionInfo` from any other domain, since a reply's `fromDestination` is unauthenticated. A `Commands` subclass passes `msg.toDestination?.domain` from `_send`.
- 76d1c7c: Add `Commands.vehicle_image_state(image_type, chunk_size?)`, which reads a rendered vehicle image in chunks over the signed channel and returns its bytes.
- 8622e55: Add `TeslemetryEnergySite.wait_until_paired(public_key, { verify_by_use, timeout_ms, poll_interval_ms, signal })`, with `DEFAULT_PAIRING_TIMEOUT` and `DEFAULT_PAIRING_POLL_INTERVAL` in milliseconds. It raises `AuthorizedClientPairingTimedOut` at once when the presence-proof window expires, and `AuthorizedClientWaitExpired` when its own deadline passes.

### Patch Changes

- 5f5f571: Document Bluetooth vehicles in `docs/bluetooth_vehicles.md`, with each adapter's limits and what has run on hardware.
- ef997df: `VehicleBluetooth` now ignores a reply that names another request, before anything acts on it. A reply with no `request_uuid` is still heard, because real VCSEC leaves it empty, but it can no longer trigger a resend or a fault, and a status no longer stands in for an actuation's ack.
- ef997df: A Bluetooth connect attempt that lands after it was abandoned now closes before the next attempt starts, for a bounded time, so on a backend with one peripheral its late close no longer ends the new link.
- ef997df: Aborting `VehicleBluetooth.pair` now stops the write itself. An abort during the connect, or while another call held the GATT queue, used to end the wait and still send the whitelist operation, which prompts at the car.
- ef997df: `VehicleBluetooth.pair` now needs positive evidence: an explicit success reply, or an authenticated handshake with this key. A WAIT, a bare ack or an unrecognised reply keeps it waiting, and an ERROR or a `nominalError` raises `WhitelistOperationStatus`. Each of these used to report success with the key not enrolled.
- ef997df: A rejected Bluetooth read now marks the link lost even if the backend still reports it connected, so a dead link on Homey is found before the next command writes to it. `BleNotSubmittedError` leaves the link up, because no radio I/O happened, and an adapter should reject a characteristic it never resolved that way. This now applies to a not-submitted write too, unless the frame stopped part way.
- ef997df: Once a Bluetooth write may have reached the car, every failure except the car's own refusal now resolves as unconfirmed, for every command. A stale or unauthenticated reply, an undecodable one, a response-size fault or a failed resend used to escape as a failover-safe error, so a router could run a command the car had already run. A failure before any write keeps its own error.
- ef997df: A Bluetooth status can no longer confirm `door_unlock`, or fail `door_lock`, through `UNLOCKED`. It is the proto3 zero value, so any status with no lock field decodes to it, and a sleep-only broadcast could report an unlock that never happened. `door_unlock` now needs its ack. A status received before the write finished no longer counts either.
- 24ddc2d: `drivers_remove` now sends `share_user_id` in the query string, as Python does, instead of in a `DELETE` body, and accepts a string or a number.
- 1e92de1: Debug logs now redact `routable_message`, a signed command that would execute again if replayed within 30 seconds.
- 8622e55: Pin `@teslemetry/tesla-protocol` to `~6.1.0`, whose `uint64` energy fields decode as strings, so a backup event with `priority = 2^64 - 1` no longer throws.

## 0.4.0

### Minor Changes

- a15ec11: Add `src/const.ts`, a port of `python-tesla-fleet-api`'s `const.py`, exporting every enum (with the same member names and values) plus `Region`, `SERVERS`, `TOKEN_URLS` and `is_valid_region` from the package root.

  - **Breaking:** the third-row `Seats` are now `7` and `8` (they were `6` and `7`, which selected the wrong seat). `THIRD_LEFT`/`THIRD_RIGHT` are added, `THIRD_ROW_LEFT`/`THIRD_ROW_RIGHT` stay as aliases, and `REAR_LEFT_BACK` (3) and `REAR_RIGHT_BACK` (6) now work for signed seat heating.
  - **Breaking:** `remote_auto_seat_climate_request` takes the new 1-indexed `AutoSeat` (front left is `1`, front right is `2`), matching Tesla's REST wire values and the proto enum, on both the REST and the signed path.
  - `Scope` gains `email`, `profile`, `metadata` and `vehicle_location`. `VehicleDataEndpoint` gains `charge_schedule_data` and `preconditioning_schedule_data`. `Models` gains Roadster (`R`). The HTTP `Method` type gains `PATCH` and drops the unused `PUT`.

- 4b44a96: Ship a dual ESM and CommonJS build (via `tsdown`) with an `exports` map: `tesla-fleet-api`, `tesla-fleet-api/tariff`, `tesla-fleet-api/const`, `tesla-fleet-api/router` and `tesla-fleet-api/types`. **Breaking:** deep imports such as `tesla-fleet-api/dist/tariff.js` or `dist/types/site_info.js` no longer resolve; import from the subpaths instead. The package no longer ships `src`, and is marked `"sideEffects": false`.
- 04ba9df: Throw real `Error` subclasses everywhere, ported class-for-class from `python-tesla-fleet-api`'s `exceptions.py` (all 155 classes, the fault lookup tables, `is_key_rejected` and `raise_for_status`). `_request` now rejects with the matching `TeslaFleetError` subclass instead of a bare `{ status, data }` or `{ error }` object; a `fetch` rejection or timeout (new `timeout` option, in ms) becomes `TeslaFleetConnectionError` with the original error as `cause`, and a non-JSON success body becomes `ResponseError`. Adds `BluetoothCloudUnavailableError`.

  **Breaking:** `SignedCommandError`, `NotOnVehicleWhitelistError`, `SignedCommandFaultError` and `RetryableSignedCommandFaultError` are removed, with no aliases. Use `SessionInfoAuthenticationFault`, `NotOnWhitelistFault`, the `TeslaFleetMessageFault*` classes and the `SignedMessageInformationFault*` classes instead. Detail that used to be in the message is now in `data`.

- f6d8e64: Compile with TypeScript `strict` mode targeting ES2022, and require Node.js 22 or newer (`engines.node: ">=22"`). An omitted `accessToken` is now stored as `null` rather than `undefined`, matching its declared type.
- 391ac07: Move to `@teslemetry/tesla-protocol` 6.0 (pinned `~6.0.0`). Signed `navigation_sc_request(id, order?)` now sends the supercharger `id` and the trip order (`0` replace, the default; `1` prepend; `2` append) instead of putting the id in the old `order` field, and no longer throws when `order` is given.

### Patch Changes

- 6b9d973: Send `backup_history`, `charge_history` and `energy_history` arguments as query parameters instead of a GET body, which previously made every call reject.
- cde6455: Fix every authenticated `Teslemetry` call failing: the region-following response handler lost `this`. Also drop the leading slash that produced `//` in the `test()`, `metadata()` and vehicle subscription/upgrade eligibility URLs, type `test()` as `Promise<boolean>` to match the value it actually returns, and rename the default classes in `teslemetry.ts` and `tessie.ts` from `Telemetry` to `Teslemetry` and `Tessie`.
