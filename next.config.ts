import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Repora is fully personalized (auth-gated DB pages), so use classic
     dynamic rendering instead of Cache Components static prerendering. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
