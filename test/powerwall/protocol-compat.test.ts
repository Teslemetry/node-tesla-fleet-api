// Canary for `@teslemetry/tesla-protocol`. `src/powerwall/client.ts` and
// `transport.ts` read every field by its generated name with no `any`, so
// `tsc --noEmit` breaks on a renamed field. These pin what a type cannot: the
// numbers on the wire.
import {
    AuthorizationRole,
    AuthorizedClientType,
    AuthorizedState,
} from "@teslemetry/tesla-protocol/energy_device/authorization_types";
import { FileStoreAPIDomain } from "@teslemetry/tesla-protocol/energy_device/filestore_api";
import { GraphQLQueryFormat } from "@teslemetry/tesla-protocol/energy_device/graphql_api";
import { LocalParticipant } from "@teslemetry/tesla-protocol/energy_device/local_auth_api";
import {
    Domain,
    MessageFaultE,
    SignatureType,
    Tag,
    messageFaultEToJSON,
} from "@teslemetry/tesla-protocol/energy_device/signed_message";
import {
    ControllableDeviceProgramKey_Priority,
    TEGIslandMode,
    TEGMessages,
    TEGSetIslandModeResult,
    tEGSetIslandModeResultToJSON,
} from "@teslemetry/tesla-protocol/energy_device/teg_api";
import { DeliveryChannel } from "@teslemetry/tesla-protocol/energy_device/transport";
import { describe, expect, it } from "vitest";

describe("tesla-protocol wire values", () => {
    it("keeps the signing tags", () => {
        expect([Tag.TAG_SIGNATURE_TYPE, Tag.TAG_DOMAIN, Tag.TAG_PERSONALIZATION, Tag.TAG_EXPIRES_AT, Tag.TAG_END]).toEqual([
            0, 1, 2, 4, 255,
        ]);
        expect(SignatureType.SIGNATURE_TYPE_RSA).toBe(7);
        expect(Domain.DOMAIN_ENERGY_DEVICE).toBe(7);
    });

    it("keeps the header values", () => {
        expect(DeliveryChannel.DELIVERY_CHANNEL_LOCAL_HTTPS).toBe(1);
        expect(DeliveryChannel.DELIVERY_CHANNEL_HERMES_COMMAND).toBe(2);
        expect(LocalParticipant.LOCAL_PARTICIPANT_INSTALLER).toBe(1);
        expect(AuthorizedClientType.AUTHORIZED_CLIENT_TYPE_CUSTOMER_MOBILE_APP).toBe(1);
    });

    it("keeps the request values", () => {
        expect(GraphQLQueryFormat.GRAPH_QL_QUERY_FORMAT_SIGNED_SHA256_ECDSA_ASN1).toBe(2);
        expect(FileStoreAPIDomain.FILE_STORE_API_DOMAIN_CONFIG_JSON).toBe(1);
        expect(MessageFaultE.MESSAGEFAULT_ERROR_UNKNOWN_KEY_ID).toBe(3);
        expect(AuthorizedState.AUTHORIZED_STATE_VERIFIED).toBe(3);
        expect(AuthorizationRole.AUTHORIZATION_ROLE_CUSTOMER).toBe(1);
        expect(ControllableDeviceProgramKey_Priority.PRIORITY_CUSTOMER_DEFAULT).toBe(5000);
    });

    it("keeps the island values", () => {
        expect(TEGIslandMode.TEG_ISLAND_MODE_AUTO_ACTIVE).toBe(1);
        expect(TEGIslandMode.TEG_ISLAND_MODE_INTENTIONAL_WITH_RECONNECT_FAILSAFE).toBe(6);
        expect(TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_ACCEPTED).toBe(1);
        expect(TEGSetIslandModeResult.TEG_SET_ISLAND_MODE_RESULT_REJECTED_EXCESSIVE_SOLAR).toBe(5);
    });

    it("keeps the dispatch command number", () => {
        const bytes = TEGMessages.encode(TEGMessages.create({ dispatchBatteryPowerRequest: {} })).finish();
        // Field 37, length-delimited.
        expect(Buffer.from(bytes).toString("hex")).toBe("aa0200");
    });

    it("names an unknown enum UNRECOGNIZED rather than throwing", () => {
        expect(messageFaultEToJSON(999 as MessageFaultE)).toBe("UNRECOGNIZED");
        expect(tEGSetIslandModeResultToJSON(999 as TEGSetIslandModeResult)).toBe("UNRECOGNIZED");
    });

    it("types priority as a string that carries 2^64 - 1", () => {
        const priority = "18446744073709551615";
        const message = TEGMessages.create({
            scheduleManualBackupEventRequest: { schedulingInfo: { priority } },
        });
        const decoded = TEGMessages.decode(TEGMessages.encode(message).finish());
        expect(decoded.scheduleManualBackupEventRequest?.schedulingInfo?.priority).toBe(priority);
    });
});
