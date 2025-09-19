import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import query from "@tanstack/eslint-plugin-query";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // cấu hình tương thích với các preset cũ
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    rules: {
      semi: ["error"], // quy tắc tự custom
    },
  }),

  // plugin cho TanStack Query
  {
    plugins: {
      "@tanstack/query": query,
    },
    rules: {
      ...query.configs.recommended.rules, // bật rule recommended
    },
  },

  // ignore paths
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "src/types-openapi/**"],
  },
];

export default eslintConfig;
