/** Parse a dotted numeric firmware string, or `null` if it doesn't parse. */
function parseFirmware(version: string): number[] | null {
    const parts = version.split(".");
    return parts.every((part) => /^\d+$/.test(part)) ? parts.map(Number) : null;
}

/**
 * Compare two Tesla firmware versions.
 *
 * Tesla firmware versions are dotted, numeric, and week-based (e.g. `2025.14.3`), so comparing
 * them as plain strings misorders them: `"2025.10" < "2025.9"` as strings, even though `2025.10`
 * is the newer release. This compares the dotted numeric components pairwise instead.
 *
 * Returns `1` if `a` is ahead of `b`, `-1` if behind, and `0` if equal. Missing trailing
 * components count as zero, so `"2024.26"` equals `"2024.26.0"` and is behind `"2024.26.25"`. A
 * string that doesn't parse as dotted integers (e.g. `"Unknown"`) sorts behind any parseable
 * version, and equal to another unparseable string.
 */
export function firmwareCompare(a: string, b: string): -1 | 0 | 1 {
    const aParts = parseFirmware(a);
    const bParts = parseFirmware(b);
    if (aParts === null || bParts === null) {
        if (aParts === bParts) return 0;
        return aParts === null ? -1 : 1;
    }
    const length = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < length; i++) {
        const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
        if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
}

/**
 * Whether a Tesla firmware version is at least `minimum`. See {@link firmwareCompare} for the
 * comparison semantics, including partial versions and unparseable strings such as `"Unknown"`.
 */
export function firmwareAtLeast(firmware: string, minimum: string): boolean {
    return firmwareCompare(firmware, minimum) >= 0;
}
