import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx,mts}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@heroui/react",
              message:
                "Importe componentes do HeroUI apenas via camada /app/ui (wrappers do app).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/ui/**/*.{ts,tsx}", "hero.mjs"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
