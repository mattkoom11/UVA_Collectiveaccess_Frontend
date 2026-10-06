import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// This config is ESM (`.mts`), so `__dirname` is not defined — derive the
// project root from the module URL instead.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
