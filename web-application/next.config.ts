import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  images: {
    domains: ["img.freepik.com", "dailynuoc.com", "minio.caulong365.store"],
  },
};

export default nextConfig;
