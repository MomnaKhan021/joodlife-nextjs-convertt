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
    // Allow our own SVG icon assets (chip + feature icons) through the image
    // optimizer. Without this Next returns 400 for SVG sources and the icons
    // don't render. Locked down with an attachment disposition + sandbox CSP
    // since we only serve first-party SVGs.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
      // The CRM lives in the custom Shopify-style admin tools, not Payload's
      // built-in /admin chrome. Landing on /admin sends staff to the new
      // dashboard. (Deep Payload links like /admin/collections/* still work.)
      { source: "/admin", destination: "/admin-tools", permanent: false },
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
   * - CSP is enforced everywhere. Allowed third-parties: Stripe,
   *   Trustpilot, Meta Pixel, Google Tag Manager/GA4 and the marketing team's
   *   GTM server container (sst.momenta.rocks). `script-src` allows 'unsafe-inline' for
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
    // Trustpilot TrustBox widget (admin analytics). The bootstrap script
    // loads from widget.trustpilot.com, renders its rating in an iframe
    // served from *.trustpilot.com, and fetches its data over the same
    // origins. This is the only free, sanctioned way to show a live
    // review count — the review page and API both 403 server requests.
    const trustpilotOrigins = [
      "https://widget.trustpilot.com",
      "https://*.trustpilot.com",
    ];
    // Meta (Facebook) Pixel: the tag loads fbevents.js from
    // connect.facebook.net and beacons events to www.facebook.com. It is
    // write-only (sends conversions to Meta); reading spend/ROAS uses the
    // Marketing API server-side, which needs no browser origins.
    // capi-automation… is Meta's Conversions API parameter builder, pulled in
    // by the Pixel to enrich event matching (Event Match Quality). Without it
    // the browser blocks the script and match quality suffers.
    const metaPixelOrigins = [
      "https://connect.facebook.net",
      "https://capi-automation.s3.us-east-2.amazonaws.com",
    ];
    // Google Tag Manager + GA4. The container script loads from
    // googletagmanager.com; GA4 then beacons hits to google-analytics.com
    // (and the regional endpoints), and tags may drop tracking pixels from
    // google-analytics.com / doubleclick. Without these the container is
    // blocked outright by this CSP — which is exactly why the marketing
    // team could not see GTM on the site.
    const gtmScriptOrigins = [
      "https://www.googletagmanager.com",
      "https://tagmanager.google.com",
    ];
    const gtmConnectOrigins = [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://stats.g.doubleclick.net",
    ];
    // GTM SERVER-SIDE container (marketing team's first-party tagging host).
    // The web container forwards GA4/Meta hits to it instead of straight to
    // Google/Meta, and loads gtag.js from it. Allow-list only — the browser
    // has no other way to send events there, and this was the reason the
    // marketing team saw "blocked by CSP" for add-to-cart / checkout data.
    const gtmServerOrigins = ["https://sst.momenta.rocks"];
    const gtmImgOrigins = [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://stats.g.doubleclick.net",
      "https://www.google.com",
      "https://ssl.gstatic.com",
      "https://www.gstatic.com",
    ];
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://widget.trustpilot.com ${metaPixelOrigins.join(" ")} ${gtmScriptOrigins.join(" ")} ${gtmServerOrigins.join(" ")}`,
      // blob.vercel-storage.com (no subdomain) is the client-direct UPLOAD
      // API host — without it the consultation evidence upload is blocked by
      // the browser ("Failed to fetch"); *.public… only covers file READS.
      `connect-src 'self' ${stripeOrigins.join(" ")} ${trustpilotOrigins.join(" ")} ${metaPixelOrigins.join(" ")} https://www.facebook.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com ${gtmConnectOrigins.join(" ")} ${gtmServerOrigins.join(" ")}`,
      `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.trustpilot.com https://www.googletagmanager.com https://tagmanager.google.com ${gtmServerOrigins.join(" ")}`,
      `img-src 'self' data: blob: https://cdn.shopify.com https://joodlife.com https://*.public.blob.vercel-storage.com https://*.picsum.photos https://figma-alpha-api.s3.us-west-2.amazonaws.com https://s3-alpha-sig.figma.com https://*.stripe.com https://*.trustpilot.com https://www.facebook.com ${gtmImgOrigins.join(" ")} ${gtmServerOrigins.join(" ")}`,
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
