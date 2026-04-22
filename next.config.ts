import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Payload uses sharp for image transforms; keep it external to Next.js
  // so its native binaries aren't bundled.
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [
      // Allow media served from Payload's local uploads folder
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default withPayload(nextConfig);
