/** A bound on a backend call ran out. The call itself may still finish, or never. */
export class BleCallTimeout extends Error {
    override readonly name = "BleCallTimeout";
}

/** A first-come, first-served mutex. Not reentrant. */
export class AsyncLock {
    private tail: Promise<void> = Promise.resolve();

    async run<T>(fn: () => T | Promise<T>): Promise<T> {
        const previous = this.tail;
        let release!: () => void;
        this.tail = new Promise<void>((resolve) => {
            release = resolve;
        });
        await previous;
        try {
            return await fn();
        } finally {
            release();
        }
    }
}

/**
 * Settle with `operation`, or reject with `BleCallTimeout` after `timeoutMs`.
 * Backends may hang, so nothing here waits on them for longer than that.
 * @param signal Rejects early with the signal's reason, and leaves no timer behind.
 */
export function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const stop = () => {
            clearTimeout(timer);
            signal?.removeEventListener("abort", onAbort);
        };
        const onAbort = () => {
            stop();
            reject(signal?.reason);
        };
        const timer = setTimeout(() => {
            stop();
            reject(new BleCallTimeout(`Bluetooth call timed out after ${timeoutMs} ms.`));
        }, timeoutMs);
        signal?.addEventListener("abort", onAbort, { once: true });

        // Inside an async function, so a backend that throws synchronously rejects.
        (async () => operation())().then(
            (value) => {
                stop();
                resolve(value);
            },
            (error: unknown) => {
                stop();
                reject(error);
            },
        );
    });
}

/** Resolve after `ms`, or as soon as `signal` aborts. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        if (signal?.aborted) {
            resolve();
            return;
        }
        const finish = () => {
            clearTimeout(timer);
            signal?.removeEventListener("abort", finish);
            resolve();
        };
        const timer = setTimeout(finish, ms);
        signal?.addEventListener("abort", finish, { once: true });
    });
}

/** A queue with one consumer at a time. */
export class ReplyQueue<T> {
    private items: T[] = [];
    private waiter: ((item: T) => void) | null = null;

    push(item: T): void {
        if (this.waiter) {
            this.waiter(item);
        } else {
            this.items.push(item);
        }
    }

    /** Empty the queue and return what was in it. */
    drain(): T[] {
        return this.items.splice(0);
    }

    /** The next item, or `null` once `timeoutMs` passes or `signal` aborts. */
    get(timeoutMs: number, signal: AbortSignal): Promise<T | null> {
        const queued = this.items.shift();
        if (queued !== undefined) {
            return Promise.resolve(queued);
        }
        if (timeoutMs <= 0 || signal.aborted) {
            return Promise.resolve(null);
        }
        return new Promise<T | null>((resolve) => {
            const finish = (item: T | null) => {
                clearTimeout(timer);
                signal.removeEventListener("abort", onAbort);
                this.waiter = null;
                resolve(item);
            };
            const onAbort = () => finish(null);
            const timer = setTimeout(onAbort, timeoutMs);
            signal.addEventListener("abort", onAbort, { once: true });
            this.waiter = finish;
        });
    }
}
