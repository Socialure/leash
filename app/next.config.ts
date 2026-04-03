import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@open-wallet-standard/core"],
  output: "standalone",
};

export default nextConfig;
