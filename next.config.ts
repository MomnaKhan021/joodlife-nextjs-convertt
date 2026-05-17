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
  /**
   * Security headers applied site-wide.
   *
   * - HSTS keeps every future request on HTTPS (production only)
   * - X-Frame-Options DENY blocks clickjacking via iframes
   * - X-Content-Type-Options nosniff blocks MIME confusion
   * - Referrer-Policy strict-origin-when-cross-origin avoids leaking
   *   full URLs to third-party sites
   * - Permissions-Policy denies sensors/camera/mic/payment APIs that
   *   we don't use, so a compromised third-party script can't pop them
   * - CSP is enforced everywhere. Stripe and Trustpilot are the only
   *   third-parties allowed. `script-src` allows 'unsafe-inline' for
   *   Next.js's hydration tags; 'strict-dynamic' would be cleaner but
   *   requires a nonce middleware refactor. Frame-src for Stripe is
   *   needed for 3D-Secure challenge iframes.
   */
  async headers() {
    const stripeOrigins = [
      "https://api.stripe.com",
      "https://js.stripe.com",
      "https://m.stripe.network",
      "https://q.stripe.com",
    ];
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network`,
      `connect-src 'self' ${stripeOrigins.join(" ")} https://*.public.blob.vercel-storage.com`,
      `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
      `img-src 'self' data: blob: https://cdn.shopify.com https://joodlife.com https://*.public.blob.vercel-storage.com https://*.picsum.photos https://figma-alpha-api.s3.us-west-2.amazonaws.com https://s3-alpha-sig.figma.com https://*.stripe.com`,
      `style-src 'self' 'unsafe-inline'`,
      `font-src 'self' data: https://fonts.gstatic.com`,
      `form-action 'self'`,
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self \"https://js.stripe.com\"), usb=()",
      },
      // HSTS only in production where the site is served over HTTPS
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
      { key: "Content-Security-Policy", value: csp },
    ];

    return [
      {
        // Apply to every public route. Payload admin is exempt because
        // its bundled UI needs broader script/style rules.
        source: "/((?!admin|api/admin|_next/static).*)",
        headers: securityHeaders,
      },
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
