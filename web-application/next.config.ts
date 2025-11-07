import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  productionBrowserSourceMaps: false,
  webpack(config, { dev }) {
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
  images: {
    domains: ["img.freepik.com", "dailynuoc.com", "minio.caulong365.store"],
  },
};

export default nextConfig;
