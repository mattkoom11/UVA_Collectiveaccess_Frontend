import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  ...next,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);
