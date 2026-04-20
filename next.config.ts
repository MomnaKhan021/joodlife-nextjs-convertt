import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/api/mcp/asset/**",
      },
      {
        protocol: "https",
        hostname: "s3-alpha-sig.figma.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
