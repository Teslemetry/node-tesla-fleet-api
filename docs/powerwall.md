# Local Powerwall

Control a Powerwall gateway over your LAN, with the cloud as a fallback.

**Status: not published.** `tesla-fleet-api/powerwall` is not in the package's `exports` map yet, so it cannot be imported from npm. It ships after the read-only check below has passed on a real gateway. The examples show the import it will have.

**No write has run from Node on real hardware.** Each write below has only run against a fake gateway in this repository's tests. Python has run the same commands on a Powerwall 3, but that does not prove Node's bytes reach a gateway the same way. Treat every write as not yet verified, and read the state back after using one.

## Before you start

You need:

- The gateway's LAN address. A Teslemetry site can look it up with `find_gateway_address()`. `192.168.91.1` is the gateway's own Wi-Fi access point, and is only useful to a device joined to it.
- The gateway password. The client sends its last 5 characters. Pass the full password either way, because an early Gateway 1 unit needs all of it (use `PowerwallClient.legacy_gateway`).
- An RSA private key that is already paired with the gateway. Pairing goes through the cloud and needs a physical breaker toggle: see `add_authorized_client` and `wait_until_paired` on `TeslemetryEnergySite`.

The gateway's certificate is self-signed, so the client accepts any certificate, on its own connection only. Replies are not signed either. A device that can intercept your LAN traffic can read the last 5 password characters and forge readings. It cannot forge a signed command.

Keep the key and password out of anything readable. On Homey, do not store them in `/userdata`, which is publicly served.

## Reading

```ts
import { PowerwallClient, PowerwallEnergySite, verify_local_gateway } from "tesla-fleet-api/powerwall";

const client = new PowerwallClient({ host, gatewayPassword, rsaPrivateKeyPem });
await verify_local_gateway(client);

const site = new PowerwallEnergySite(client);
const { response } = await site.live_status();
```

`verify_local_gateway` proves the password and the key separately. A plain `PowerwallAuthenticationError` means the password is wrong. `PowerwallKeyRejectedError`, a subclass, means the password worked and the key did not.

`PowerwallEnergySite` has the cloud site's method names and reply shapes. Keys `live_status` has no local source for are `null`, never guessed. Methods with no local mapping, such as `site_info` and `storm_mode`, are absent.

## With the cloud as a fallback

```ts
import { connect_gateway } from "tesla-fleet-api/powerwall";
import { EnergySiteRouter } from "tesla-fleet-api/router";

const { client, host, outcome } = await connect_gateway({
    client: { host: storedHost, gatewayPassword, rsaPrivateKeyPem },
    cloud: teslemetrySite,
});
if (outcome === "moved") {
    await saveHost(host); // `connect_gateway` persists nothing.
}

const router = new EnergySiteRouter([new PowerwallEnergySite(client), teslemetrySite]);
await router.live_status();
```

The cloud's answer is not trusted. An address outside the private and link-local IPv4 ranges gets no request, so a bad reply cannot collect the password. When the DIN is known, from `expectedDin` or the cloud site's `din`, a gateway with another DIN is refused. It has seen the login by then, because reading the DIN needs a token.

Build the router whatever the outcome. A client that cannot connect fails over to the cloud on each call, so the site degrades to cloud control.

| Outcome | Meaning | What to do |
| -- | -- | -- |
| `connected` | Connected at the stored host | Nothing |
| `rate_limited` | The gateway answered 429 or 503 | Nothing: it is there |
| `moved` | Connected at a new host | Persist `host` |
| `refused` | The cloud confirms the address and the gateway refused. A wrong password lands here. | Ask for the password again |
| `not_found` | No usable address | Offer a repair |

Only some errors fail over:

| Local error | Fails over? |
| -- | -- |
| `PowerwallConnectionError`, `PowerwallRateLimitError`, `PowerwallAuthenticationError` | Yes |
| `PowerwallCommandError`, `PowerwallNotSupportedError`, `PowerwallProtocolError`, `PowerwallFaultError` | No. The gateway answered, and the cloud reaches the same gateway. |

- A method the local site lacks goes straight to the cloud.
- A failed-over write can run twice. To avoid that, call `router.primary.powerwall` directly.
- `operation`, `backup` and `grid_import_export` all write `config.json`. Do not split them across backends, or one write can stomp another.
- `add_authorized_client` and `find_gateway_address` are registration and discovery. Call them on `router.secondary`.

## Polling and merging

`LiveStatusMerge` and `SiteInfoMerge` keep the latest cloud document and local reading, and overlay the keys local owns. They own no timer: call `poll()` on your own schedule, and attach a rejection handler.

```ts
const live = new LiveStatusMerge(site, cloudLiveStatus);
setInterval(() => {
    live.poll().then(publish).catch(reportBug);
}, ENERGY_LIVE_INTERVAL_MS);

live.set_cloud(nextCloudLiveStatus);
live.healthy; // null before the first poll, then true or false.
live.last_error;
```

- `poll()` resolves to the merged view, or `null` for a skipped tick. It rejects only on a bug. A failed read resolves, and falls back to cloud values.
- `LiveStatusMerge` backs off after failures: it tries every 2, 4, 8, then 12 ticks, and resets on a success.
- A zero reading overlays. A `null` does not.
- Pass `owned_keys` to leave a key at its cloud value.
- After a successful command, call `SiteInfoMerge.hold_command_value(key, value)`. It keeps the value through a poll that started before the command, and through a failed poll, until its source next reports the key.

## Writes

**Every method in this table is not yet verified from Node on hardware.**

| `PowerwallEnergySite` | `PowerwallClient` | Notes |
| -- | -- | -- |
| `operation` | `set_operation_mode` | Writes `config.json` |
| `backup` | `set_backup_reserve`, `set_backup_reserve_raw` | Writes `config.json`. `backup` takes the app's scale. |
| `grid_import_export` | `set_grid_import_export`, `set_export_rule`, `set_grid_charging` | Writes `config.json`. Both settings in one call is one write. |
| `set_island_mode`, `go_off_grid`, `reconnect_grid` | `set_island_mode`, `go_off_grid`, `reconnect_grid` | Moves the grid contactor. A success-shaped reply does not prove it moved: read `control.islanding.contactorClosed` afterwards. |
| `schedule_backup_event`, `cancel_backup_event` | `schedule_max_backup`, `cancel_max_backup` | Always starts now at maximum priority |
| `dispatch_battery_power`, `resume_battery_operation` | `dispatch_battery_power`, `resume_battery_operation` | Use short durations and renew them. The gateway refuses above its limit. |
| `remove_authorized_client` | `remove_authorized_client` | Removing the signing key locks this client out |
| | `write_config` | Any `config.json` key, by dotted path |
| | `set_tou_mode` | The gateway does not validate this value |
| | `set_on_grid_solar_curtailment`, `set_import_limit`, `set_export_limit` | Writes `config.json` |
| | `curtail`, `restore_from_curtailment` | Takes about 90 seconds to apply. The saved state does not survive a restart. |
| | `delay_battery_calibration`, `configure_ocpp` | Firmware may answer `PowerwallNotSupportedError` |
| | `trigger_islanding` | Black start. No hardware result is recorded, even from Python. |

A signed request executes again if it is re-sent before it expires, so a write is sent once and never retried.

Storm mode and the tariff schedule are not local. Use the cloud for those.

## The read-only check

`scripts/powerwall-readonly-check.ts` runs steps R1 to R12 of the live plan against a real gateway. It imports from `src/`, so it runs from a checkout:

```sh
POWERWALL_HOST=<address> \
POWERWALL_PASSWORD_PATH=<file holding the password> \
POWERWALL_KEY_PATH=<file holding the RSA key PEM> \
pnpm powerwall:check
```

- It has no code path to a write. `test/powerwall/readonly-check.test.ts` enforces that on its source, at run time, and on the wire.
- It prints key names, types and pass or fail, never a value, so its output is safe to share.
- It waits 1 second between steps and stops at the first unexpected error.
- R12 reads `live_status` every 5 seconds for 10 minutes, and prints how many `ECONNRESET` and rate-limit errors it saw. Set `POWERWALL_SOAK_TICKS` to shorten it.
- It exits 0 on a pass, 1 on a failed step and 2 on bad setup.

R13 (the same reads from Python) and R14 (`connect_gateway` with a real cloud lookup) are not in the script. R14 needs cloud credentials, which this script does not take.
