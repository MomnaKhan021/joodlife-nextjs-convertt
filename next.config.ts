import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Postgres / Payload native deps external so Next.js doesn't try
  // to bundle their optional binaries. drizzle-kit MUST stay external
  // because Payload's postgres adapter does a dynamic `require('drizzle-
  // kit/api')` at runtime to push schemas — Turbopack rewrites the
  // module specifier when it bundles, breaking the import.
  serverExternalPackages: [
    "pg",
    "pg-native",
    "drizzle-orm",
    "drizzle-kit",
  ],
  images: {
    remotePatterns: [
      // Allow media served from Payload's local uploads folder
      { protocol: "http", hostname: "localhost" },
      // Allow Shopify CDN (for imported Shopify product images)
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Allow joodlife.com's CDN proxy (where the live store hosts product imagery)
      { protocol: "https", hostname: "joodlife.com" },
    ],
  },
};

// Apply Payload's Next.js wrapper when the package is installed.
// The worktree may not have it installed locally even though Vercel
// installs it fresh on every deploy — this keeps `next dev` working
// on machines where `npm install` hasn't pulled the Payload stack yet.
let finalConfig: NextConfig = nextConfig;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withPayload } = require("@payloadcms/next/withPayload");
  finalConfig = withPayload(nextConfig);
} catch {
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.warn(
      "[next.config] @payloadcms/next not installed — running without Payload integration."
    );
  }
}

export default finalConfig;
