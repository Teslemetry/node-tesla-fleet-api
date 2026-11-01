import { defineConfig } from "tsdown";

export default defineConfig({
    entry: {
        index: "src/index.ts",
        tariff: "src/tariff.ts",
        const: "src/const.ts",
        router: "src/router/index.ts",
        types: "src/types/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    unbundle: true,
    sourcemap: false,
});
