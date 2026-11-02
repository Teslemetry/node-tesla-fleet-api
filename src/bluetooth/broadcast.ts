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
