import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import * as queries from "../../src/powerwall/queries.js";

// Document 09, section 2. A code is Tesla's signature over one exact query text.
const DIGESTS: [keyof typeof queries, number, string][] = [
    ["STATUS_QUERY", 6959, "c15389e90c791eb4432247eca2e91a047fac65bee337306adc3bfee44569d1c9"],
    ["STATUS_CODE", 137, "1242d62ec061ec0d781f8fc7bc5308cf109e68984f5723254534d5a6cb9865f4"],
    ["CONTROLLER_QUERY", 4591, "41ce45103a1e877f492fd76d2dd31573e862e68d3c3d7c0fa90bd407adca7c25"],
    ["CONTROLLER_CODE", 138, "9e27325da97e0f3a4ab25e3e62533c0752629ce8570de8b261aa09e3abce2bef"],
    ["CONTROLLER_VARIABLES", 706, "7919bdc8b46cb7ed81c5b81e40162c316b9d56e6ca971d705d852342586652e2"],
    ["COMPONENTS_QUERY", 1846, "c5af5b305598141debeef8bfc7d69163a457d7be662dc46f5b9f3f33b9c5640a"],
    ["COMPONENTS_CODE", 139, "6ad9648046218a3e717e2cd7e2b14c860986336b6ddc9479df1a1040e28d8ecf"],
    ["COMPONENTS_VARIABLES", 1494, "fb6bd8e187f78f37d0be130762c6c9925b273985bf345b400cced5ed789c3bb5"],
];

describe("GraphQL constants", () => {
    it.each(DIGESTS)("%s is byte for byte", (name, size, digest) => {
        const value = queries[name];
        const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : value;
        expect(bytes.length).toBe(size);
        expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(digest);
    });
});
