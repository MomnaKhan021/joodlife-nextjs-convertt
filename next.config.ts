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
    // We use quality={95} on hero/portrait imagery for sharpness; the
    // default 75 stays available for everything else.
    qualities: [75, 90, 95],
    remotePatterns: [
      // Allow media served from Payload's local uploads folder
      { protocol: "http", hostname: "localhost" },
      // Allow Shopify CDN (for imported Shopify product + article images)
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Allow joodlife.com's CDN proxy (where the live store hosts product imagery)
      { protocol: "https", hostname: "joodlife.com" },
      // Allow Vercel Blob — where Payload's Media collection persists uploads
      // when BLOB_READ_WRITE_TOKEN is set.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Picsum (lorem-ipsum images) — used by the sample-post seeder
      // and any other test/preview content. Redirects to fastly.picsum.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  async redirects() {
    return [
      // Old URL pattern (singular) → new pattern (plural).
      // 308 = permanent + preserves method.
      { source: "/blog", destination: "/blogs", permanent: true },
      { source: "/blog/:slug", destination: "/blogs/:slug", permanent: true },
    ];
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
