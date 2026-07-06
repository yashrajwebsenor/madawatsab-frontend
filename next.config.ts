import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  experimental: {
    // Machine is RAM-constrained; don't preload every page's JS into memory at
    // dev startup. Pages compile on demand instead, cutting the dev footprint.
    preloadEntriesOnStart: false,
  },
};

export default nextConfig;
