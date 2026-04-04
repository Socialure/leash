import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@open-wallet-standard/core"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
