import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
