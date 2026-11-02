import { Domain, RoutableMessage } from "@teslemetry/tesla-protocol/command/universal_message";
import {
    ClosureStateE,
    ClosureStatuses,
    FromVCSECMessage,
    GearE,
    UIDesireE,
    UserPresenceE,
    VehicleLockStateE,
    VehicleSleepStatusE,
    VehicleStatus,
} from "@teslemetry/tesla-protocol/command/vcsec";
import Commands from "../commands.js";

/** Removes a listener. Safe to call twice. */
export type Unsubscribe = () => void;

/**
 * Local callbacks, not tied to a connection, so they live as long as the
 * vehicle and survive reconnects. A callback that throws is logged, and neither
 * later callbacks nor message routing see it.
 */
export class ListenerRegistry<T> {
    private entries: Array<{ callback: (value: T) => void }> = [];

    constructor(private readonly log: (message: string) => void) {}

    get size(): number {
        return this.entries.length;
    }

    add(callback: (value: T) => void): Unsubscribe {
        const entry = { callback };
        this.entries.push(entry);
        return () => {
            this.entries = this.entries.filter((other) => other !== entry);
        };
    }

    emit(value: T): void {
        for (const { callback } of this.entries) {
            try {
                callback(value);
            } catch (error) {
                this.log(`BLE listener failed: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
            }
        }
    }
}

/**
 * A broadcast's VCSEC status, if it carries one. Broadcasts are unsigned, so
 * they need no session and prove nothing about who sent them.
 */
export function decodeVcsecStatus(message: RoutableMessage): VehicleStatus | null {
    if (message.protobufMessageAsBytes === undefined) {
        return null;
    }
    try {
        return FromVCSECMessage.decode(message.protobufMessageAsBytes).vehicleStatus ?? null;
    } catch {
        return null;
    }
}

/**
 * Persistent listeners for unsolicited broadcasts, which arrive on the same
 * notifications as command replies. Each `VehicleStatus` leaf has a typed
 * `listen_*`, and `listen_broadcast` takes every raw broadcast on a domain,
 * including payloads with no typed listener.
 *
 * The scalar listeners fire on every status broadcast with whatever value it
 * holds, because proto3 has no presence on them, so a lock-only broadcast also
 * reports `GEAR_UNKNOWN`. The closure listeners fire only when the broadcast
 * carries the block they read.
 */
export abstract class BroadcastListeners extends Commands {
    private readonly statusListeners = new ListenerRegistry<VehicleStatus>((message) => this.log(message));
    private readonly domainListeners = new Map<Domain, ListenerRegistry<RoutableMessage>>();

    protected log(message: string): void {
        this.parent.parent._log(message);
    }

    /** Hand one unaddressed message to everything listening. */
    protected dispatchBroadcast(domain: Domain, message: RoutableMessage): void {
        this.domainListeners.get(domain)?.emit(message);
        if (domain === Domain.DOMAIN_VEHICLE_SECURITY && this.statusListeners.size > 0) {
            const status = decodeVcsecStatus(message);
            if (status) {
                this.statusListeners.emit(status);
            }
        }
    }

    private listenClosure(callback: (closures: ClosureStatuses) => void): Unsubscribe {
        return this.statusListeners.add((status) => {
            if (status.closureStatuses) {
                callback(status.closureStatuses);
            }
        });
    }

    /** Listen for every unsolicited broadcast on `domain`, including `VehicleStatus`. */
    listen_broadcast(domain: Domain, callback: (message: RoutableMessage) => void): Unsubscribe {
        let registry = this.domainListeners.get(domain);
        if (!registry) {
            registry = new ListenerRegistry((message) => this.log(message));
            this.domainListeners.set(domain, registry);
        }
        return registry.add(callback);
    }

    /** Listen for the vehicle's overall lock state. */
    listen_vehicle_lock_state(callback: (state: VehicleLockStateE) => void): Unsubscribe {
        return this.statusListeners.add((status) => callback(status.vehicleLockState));
    }

    /** Listen for the vehicle's sleep status. */
    listen_vehicle_sleep_status(callback: (status: VehicleSleepStatusE) => void): Unsubscribe {
        return this.statusListeners.add((status) => callback(status.vehicleSleepStatus));
    }

    /** Listen for driver presence. */
    listen_user_presence(callback: (presence: UserPresenceE) => void): Unsubscribe {
        return this.statusListeners.add((status) => callback(status.userPresence));
    }

    /** Listen for the gear selection. */
    listen_gear(callback: (gear: GearE) => void): Unsubscribe {
        return this.statusListeners.add((status) => callback(status.gear));
    }

    /** Listen for the UI desire state. */
    listen_ui_desire(callback: (desire: UIDesireE) => void): Unsubscribe {
        return this.statusListeners.add((status) => callback(status.UIDesire));
    }

    /** Listen for the tonneau's open percentage, on broadcasts that carry it. */
    listen_tonneau_percent_open(callback: (percent: number) => void): Unsubscribe {
        return this.statusListeners.add((status) => {
            if (status.detailedClosureStatus) {
                callback(status.detailedClosureStatus.tonneauPercentOpen);
            }
        });
    }

    /**
     * Listen for a broadcast's whole closure block in one call. The listeners
     * below each fire separately for the same broadcast.
     */
    listen_closure_statuses(callback: (closures: ClosureStatuses) => void): Unsubscribe {
        return this.listenClosure(callback);
    }

    /** Listen for the front driver door. */
    listen_front_driver_door(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.frontDriverDoor));
    }

    /** Listen for the front passenger door. */
    listen_front_passenger_door(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.frontPassengerDoor));
    }

    /** Listen for the rear driver door. */
    listen_rear_driver_door(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.rearDriverDoor));
    }

    /** Listen for the rear passenger door. */
    listen_rear_passenger_door(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.rearPassengerDoor));
    }

    /** Listen for the front trunk. */
    listen_front_trunk(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.frontTrunk));
    }

    /** Listen for the rear trunk. */
    listen_rear_trunk(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.rearTrunk));
    }

    /** Listen for the charge port. */
    listen_charge_port(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.chargePort));
    }

    /** Listen for the tonneau. */
    listen_tonneau(callback: (state: ClosureStateE) => void): Unsubscribe {
        return this.listenClosure((closures) => callback(closures.tonneau));
    }
}
