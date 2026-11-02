// Ported from python-tesla-fleet-api's tests/test_firmware_at_least.py.
import { describe, expect, it } from "vitest";
import { firmwareAtLeast, firmwareCompare } from "../src/util.js";

describe("firmwareCompare", () => {
    it("orders week-based versions numerically, not lexicographically", () => {
        expect(firmwareCompare("2025.10", "2025.9")).toBe(1);
        expect(firmwareCompare("2025.9", "2025.10")).toBe(-1);
    });

    it("treats equal versions as equal", () => {
        expect(firmwareCompare("2024.8", "2024.8")).toBe(0);
        expect(firmwareCompare("2024.44.25", "2024.44.25")).toBe(0);
    });

    it("compares versions with differing component counts", () => {
        expect(firmwareCompare("2025.14", "2025.2.6")).toBe(1);
        expect(firmwareCompare("2025.2.6", "2025.14")).toBe(-1);
        expect(firmwareCompare("2024.44.25", "2024.8")).toBe(1);
        expect(firmwareCompare("2024.8", "2024.44.25")).toBe(-1);
    });

    it("treats missing trailing components as zero", () => {
        expect(firmwareCompare("2024.26", "2024.26")).toBe(0);
        expect(firmwareCompare("2024.26.0", "2024.26")).toBe(0);
        expect(firmwareCompare("2024.26", "2024.26.25")).toBe(-1);
        expect(firmwareCompare("2024.26.25", "2024.26")).toBe(1);
    });

    it("sorts unparseable firmware behind any parseable version", () => {
        expect(firmwareCompare("Unknown", "2024.8")).toBe(-1);
        expect(firmwareCompare("2024.8", "Unknown")).toBe(1);
        expect(firmwareCompare("Unknown", "Unknown")).toBe(0);
        expect(firmwareCompare("", "2024.8")).toBe(-1);
        expect(firmwareCompare("2024..8", "2024.8")).toBe(-1);
    });
});

describe("firmwareAtLeast", () => {
    it("orders week-based versions numerically, not lexicographically", () => {
        expect(firmwareAtLeast("2025.10", "2025.9")).toBe(true);
        expect(firmwareAtLeast("2025.9", "2025.10")).toBe(false);
    });

    it("accepts equal versions", () => {
        expect(firmwareAtLeast("2024.8", "2024.8")).toBe(true);
        expect(firmwareAtLeast("2024.44.25", "2024.44.25")).toBe(true);
    });

    it("compares versions with differing component counts", () => {
        expect(firmwareAtLeast("2025.14", "2025.2.6")).toBe(true);
        expect(firmwareAtLeast("2025.2.6", "2025.14")).toBe(false);
        expect(firmwareAtLeast("2024.44.25", "2024.8")).toBe(true);
        expect(firmwareAtLeast("2024.8", "2024.44.25")).toBe(false);
    });

    it("treats missing trailing components as zero", () => {
        expect(firmwareAtLeast("2024.26", "2024.26")).toBe(true);
        expect(firmwareAtLeast("2024.26.0", "2024.26")).toBe(true);
        expect(firmwareAtLeast("2024.26", "2024.26.25")).toBe(false);
        expect(firmwareAtLeast("2024.26.25", "2024.26")).toBe(true);
    });

    it("matches the Teslemetry Home Assistant streaming thresholds", () => {
        expect(firmwareAtLeast("2024.44.25", "2024.44.25")).toBe(true);
        expect(firmwareAtLeast("2024.44.24", "2024.44.25")).toBe(false);
        expect(firmwareAtLeast("2024.26", "2024.26")).toBe(true);
        expect(firmwareAtLeast("2024.25.99", "2024.26")).toBe(false);
    });

    it("never lets unparseable firmware meet a minimum", () => {
        expect(firmwareAtLeast("Unknown", "2024.8")).toBe(false);
        expect(firmwareAtLeast("Unknown", "2025.14")).toBe(false);
        expect(firmwareAtLeast("", "2024.8")).toBe(false);
    });
});
