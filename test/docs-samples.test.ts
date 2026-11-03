import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Compiles every ```ts sample in the README and docs against `src`, through the
// same names a reader imports. So a sample that drifts from the API fails CI.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES_DIR = join(REPO, "test/__samples__");

/** Fragments, or a subpath that is not exported, so these cannot compile here. */
const UNCOMPILED = new Set(["bluetooth_vehicles.md", "powerwall.md"]);

const PATHS: Record<string, string[]> = {
    "tesla-fleet-api": ["src/index.ts"],
    "tesla-fleet-api/tariff": ["src/tariff.ts"],
    "tesla-fleet-api/const": ["src/const.ts"],
    "tesla-fleet-api/router": ["src/router/index.ts"],
    "tesla-fleet-api/types": ["src/types/index.ts"],
    "tesla-fleet-api/bluetooth": ["src/bluetooth/index.ts"],
    "tesla-fleet-api/bluetooth/homey": ["src/bluetooth/adapters/homey.ts"],
    "tesla-fleet-api/bluetooth/noble": ["src/bluetooth/adapters/noble.ts"],
    "tesla-fleet-api/bluetooth/esphome": ["src/bluetooth/adapters/esphome.ts"],
};

/** What samples take as given, so that each stays about the library. */
const GLOBALS = `
declare const accessToken: string;
declare const vin: string;
declare const energySiteId: number;
declare const din: string;
declare const privateKey: Buffer;
declare const proxyHost: string;
declare const encryptionKey: string;
declare const client_id: string;
declare const client_secret: string;
declare const redirect_uri: string;
declare const code: string;
declare module "homey" {
    import type { HomeyBleManagerLike } from "tesla-fleet-api/bluetooth/homey";
    const Homey: { App: new () => { homey: { ble: HomeyBleManagerLike } } };
    export default Homey;
}
`;

function samplesIn(file: string): { name: string; text: string }[] {
    const base = file.split("/").pop()!;
    const fences = readFileSync(join(REPO, file), "utf8").matchAll(/^```ts\n([\s\S]*?)^```$/gm);
    return [...fences].map((fence, i) => ({ name: `${base.replace(".md", "")}-${i}.mts`, text: `${fence[1]}\nexport {};\n` }));
}

/** Diagnostics for virtual modules that see the real repository. */
function compile(samples: { name: string; text: string }[]): string[] {
    const virtual = new Map<string, string>(samples.map((s) => [join(SAMPLES_DIR, s.name), s.text]));
    const globals = join(SAMPLES_DIR, "globals.d.ts");
    virtual.set(globals, GLOBALS);
    const config = ts.getParsedCommandLineOfConfigFile(join(REPO, "tsconfig.json"), {}, {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (d) => {
            throw new Error(String(d.messageText));
        },
    });
    const options: ts.CompilerOptions = { ...config!.options, noEmit: true, skipLibCheck: true, baseUrl: REPO, paths: PATHS, sourceMap: false, declaration: false };
    const host = ts.createCompilerHost(options);
    const { fileExists, readFile, getSourceFile } = host;
    host.fileExists = (f) => virtual.has(f) || fileExists(f);
    host.readFile = (f) => virtual.get(f) ?? readFile(f);
    host.getSourceFile = (f, version, ...rest) => {
        const text = virtual.get(f);
        return text === undefined ? getSourceFile(f, version, ...rest) : ts.createSourceFile(f, text, version);
    };
    const program = ts.createProgram([...virtual.keys()], options, host);
    return ts
        .getPreEmitDiagnostics(program)
        .filter((d) => d.file === undefined || virtual.has(d.file.fileName))
        .map((d) => `${d.file?.fileName.split("/").pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
}

describe("documentation samples", () => {
    const pages = ["README.md", ...readdirSync(join(REPO, "docs")).filter((f) => f.endsWith(".md") && !UNCOMPILED.has(f)).map((f) => `docs/${f}`)];
    const samples = pages.flatMap(samplesIn);

    it("covers the README", () => {
        expect(samplesIn("README.md").length).toBeGreaterThanOrEqual(12);
    });

    it("all compile", { timeout: 120_000 }, () => {
        expect(compile(samples)).toEqual([]);
    });

    it("would notice a wrong method and an unexported entry", { timeout: 120_000 }, () => {
        const failures = compile([
            { name: "wrong.mts", text: 'import { TeslaFleetApi } from "tesla-fleet-api";\nnew TeslaFleetApi({ accessToken, region: "na" }).no_such_method();\n' },
            { name: "gated.mts", text: 'import { nothing } from "tesla-fleet-api/not-exported";\nconsole.log(nothing);\n' },
        ]);
        expect(failures).toHaveLength(2);
    });
});
