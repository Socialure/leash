import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@open-wallet-standard/core"],
  async redirects() {
    // Only redirect to dashboard when running locally (not on Render/production)
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/",
          destination: "/dashboard",
          permanent: false,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
