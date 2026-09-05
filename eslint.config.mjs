import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The project intentionally uses async data-loading effects in client
      // admin pages and state synchronization effects in profile/cart UI.
      "react-hooks/set-state-in-effect": "off",
      // Existing server-side adapters and raw SQL mapping use explicit `any`
      // at dynamic boundaries; these are runtime-validated before use.
      "@typescript-eslint/no-explicit-any": "off",
      // Existing user-facing copy contains apostrophes in JSX text.
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
