// What more than one adapter needs. It stays free of any backend.

/**
 * How long before `timeoutMs` a timed scan ends. The library gives up at
 * `timeoutMs` itself, so a scan that ran the whole window would lose what it saw.
 */
export const SCAN_END_MARGIN_MS = 250;

/** Lower case with no dashes, and short for a Bluetooth SIG UUID: the form Homey and noble use. */
export function compactUuid(uuid: string): string {
    const compact = uuid.toLowerCase().replace(/-/g, "");
    return /^0000([0-9a-f]{4})00001000800000805f9b34fb$/.exec(compact)?.[1] ?? compact;
}

/**
 * Which connect attempt owns each device's radio link. The library abandons a
 * hung attempt and closes it if it lands later, but both attempts reach the same
 * link: Homey's `connect()` returns the existing one, noble reuses the peripheral,
 * and a proxy keys links by address. So a superseded attempt must leave the link
 * alone, or its close would kill the attempt that replaced it.
 */
export class LinkClaims<Attempt> {
    private readonly owners = new Map<string, Attempt>();

    /** This attempt now owns the link. */
    claim(id: string, attempt: Attempt): void {
        this.owners.set(id, attempt);
    }

    /** Whether a newer attempt owns the link. */
    superseded(id: string, attempt: Attempt): boolean {
        const owner = this.owners.get(id);
        return owner !== undefined && owner !== attempt;
    }

    /** The attempt is done. If it owned the link, no one does until the next claim. */
    release(id: string, attempt: Attempt): void {
        if (this.owners.get(id) === attempt) {
            this.owners.delete(id);
        }
    }
}

/** Run a cleanup whose failure must not hide the failure behind it. */
export async function quietly(cleanup: () => unknown): Promise<void> {
    try {
        await cleanup();
    } catch {
        // The link is going away either way.
    }
}
