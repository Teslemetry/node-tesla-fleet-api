// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,
    {
        ignores: ["dist/**"],
    },
    {
        rules: {
            // ts-proto message types and Fleet API JSON payloads are inherently untyped.
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {argsIgnorePattern: "^_", varsIgnorePattern: "^_"},
            ],
            // `this.debug && console.debug(...)` is this codebase's guard-log idiom.
            "@typescript-eslint/no-unused-expressions": [
                "error",
                {allowShortCircuit: true},
            ],
        },
    },
);
