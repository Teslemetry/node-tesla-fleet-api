import { readFileSync } from "node:fs";
import { defineConfig } from "tsdown";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
    entry: {
        index: "src/index.ts",
        tariff: "src/tariff.ts",
        const: "src/const.ts",
        router: "src/router/index.ts",
        types: "src/types/index.ts",
        bluetooth: "src/bluetooth/index.ts",
        "bluetooth/noble": "src/bluetooth/adapters/noble.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    unbundle: true,
    sourcemap: false,
    // Sent as `X-Library: node tesla_fleet_api <version>` (src/teslafleetapi.ts).
    define: { __VERSION__: JSON.stringify(version) },
});
