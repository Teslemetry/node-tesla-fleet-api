import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
    // Mirrors tsdown.config.ts so tests see the same X-Library version as the build.
    define: { __VERSION__: JSON.stringify(version) },
});
