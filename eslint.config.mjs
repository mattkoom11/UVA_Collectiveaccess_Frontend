import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  ...next,
  {
    rules: {
      // `images.unoptimized` is on in next.config.ts because CA media can
      // require the authenticated session cookie that next/image's optimizer
      // cannot carry, so <Image /> and <img> are byte-for-byte equivalent here
      // and the LCP/bandwidth warning never applies. Re-enable this rule if
      // image optimization is ever turned back on.
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);
