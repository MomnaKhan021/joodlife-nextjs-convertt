import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Keep Postgres / Payload native deps external so Next.js doesn't try
  // to bundle their optional binaries.
  serverExternalPackages: ["pg", "pg-native", "drizzle-orm"],
  images: {
    remotePatterns: [
      // Allow media served from Payload's local uploads folder
      { protocol: "http", hostname: "localhost" },
      // Allow Shopify CDN (for imported Shopify product images)
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default withPayload(nextConfig);
