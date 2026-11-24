import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // Image uploads go through a Server Action, which allows 1 MB by default.
      // Matches MAX_UPLOAD_BYTES in src/lib/image-storage.ts, plus form overhead.
      bodySizeLimit: "11mb",
    },
  },
  images: {
    // Next.js resizes uploaded images for display; nothing else local.
    localPatterns: [{ pathname: "/uploads/**", search: "" }],
  },
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
