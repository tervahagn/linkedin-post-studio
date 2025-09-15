import type { NextConfig } from "next";

const isGH = process.env.GITHUB_ACTIONS === "true";
const repo = "linkedin-post-studio"; // <-- your repo name

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // required if served from https://<user>.github.io/<repo>
  basePath: isGH ? `/${repo}` : undefined,
  assetPrefix: isGH ? `/${repo}/` : undefined,
};

export default nextConfig;
