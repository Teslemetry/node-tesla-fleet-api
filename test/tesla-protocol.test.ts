import {
    BackupEvent,
    ManualBackupEvent,
    TEGAPIGetBackupEventsResponse,
} from "@teslemetry/tesla-protocol/energy_device/teg_api";
import { MessageEnvelope } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it } from "vitest";

const MAX_PRIORITY = "18446744073709551615"; // 2^64 - 1, what a manual backup event carries.
const MAX_UINT64_VARINT = "ffffffffffffffffff01";

describe("tesla-protocol uint64 priority", () => {
    it("decodes an envelope carrying priority 2^64 - 1 without loss", () => {
        const schedulingInfo = { durationSeconds: 7200, priority: MAX_PRIORITY };
        const getBackupEventsResponse = TEGAPIGetBackupEventsResponse.create({
            manualBackupEvent: ManualBackupEvent.create({ schedulingInfo }),
            backupEvents: [BackupEvent.create({ id: "event", name: "event", schedulingInfo })],
        });

        const bytes = MessageEnvelope.encode(
            MessageEnvelope.create({ teg: { getBackupEventsResponse } }),
        ).finish();
        expect(Buffer.from(bytes).toString("hex")).toContain(MAX_UINT64_VARINT);

        const reply = MessageEnvelope.decode(bytes).teg?.getBackupEventsResponse;
        expect(reply?.manualBackupEvent?.schedulingInfo?.priority).toBe(MAX_PRIORITY);
        expect(reply?.backupEvents[0].schedulingInfo?.priority).toBe(MAX_PRIORITY);
    });
});
