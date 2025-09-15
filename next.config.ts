import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Custom domain setup - no basePath/assetPrefix needed
  trailingSlash: true,
};

export default nextConfig;
