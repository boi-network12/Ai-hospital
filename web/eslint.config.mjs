// eslint.config.js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import a11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Add jsx-a11y plugin
  a11y.flatConfigs.recommended,

  // Optional: Strict mode (recommended for production)
  // a11y.flatConfigs.strict,

  // Override ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // Optional: Custom rules (add any you want)
  {
    rules: {
      // Catch invalid ARIA values like aria-expanded="{expression}"
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-unsupported-elements": "error",

      // Optional: Enforce alt text, labels, etc.
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
    },
  },
]);

export default eslintConfig;