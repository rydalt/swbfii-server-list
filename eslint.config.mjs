import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".wrangler/**", "dist/**", "node_modules/**", "scripts/**"],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // TypeScript handles no-undef far better than ESLint
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": "warn",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
    },
  },
  {
    files: ["src/frontend/client/**/*.ts"],
    rules: {
      // Control chars are intentional (stripping \x00-\x08 from server names)
      "no-control-regex": "off",
    },
  },
];
