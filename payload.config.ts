import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

import { Users } from "./src/payload/collections/Users";
import { Products } from "./src/payload/collections/Products";
import { Orders } from "./src/payload/collections/Orders";
import { Discounts } from "./src/payload/collections/Discounts";
import { Media } from "./src/payload/collections/Media";
import { Consultations } from "./src/payload/collections/Consultations";
import { applyDiscountEndpoint } from "./src/payload/endpoints/applyDiscount";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Resolve the Postgres connection string from a list of likely env
 * vars. Vercel's Neon integration auto-creates a pile of these (often
 * with a custom prefix like `Jood_database_*`), and we don't want to
 * force users to manually create a `DATABASE_URI` mirror.
 *
 * Order of preference: the canonical Payload var, then unpooled /
 * non-pooling variants (Drizzle prefers a direct connection because
 * PgBouncer breaks prepared statements), then any pooled fallback.
 */
function resolveDatabaseUrl(): string {
  const candidates = Object.keys(process.env).filter((k) => process.env[k]);

  const preferredOrder = [
    "DATABASE_URI",
    // Standard names
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];

  // Match exact preferred names first
  for (const name of preferredOrder) {
    if (process.env[name]) return process.env[name] as string;
  }

  // Fallback: any var ending in one of the preferred suffixes
  // (catches integration-prefixed names like `Jood_database_DATABASE_URL_UNPOOLED`)
  const suffixOrder = [
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];
  for (const suffix of suffixOrder) {
    const match = candidates.find((k) => k.endsWith(suffix));
    if (match) return process.env[match] as string;
  }

  return "";
}

const DATABASE_URL = resolveDatabaseUrl();

/**
 * Resolve a non-empty Payload secret. Order:
 *  1. PAYLOAD_SECRET (explicit, recommended)
 *  2. Any common alternative auth-secret name (NEXTAUTH_SECRET, JWT_SECRET, AUTH_SECRET)
 *  3. Deterministic SHA-256 of the database URL — only kicks in when no
 *     explicit secret is set. The DB URL is already scoped per-deployment
 *     and never sent to clients, so a hash of it makes a stable, unguessable
 *     secret that survives deployments. Sessions invalidate only if the DB
 *     password is rotated, which is the desired security property.
 *
 * Logged at boot (length only, never the value) so the operator can see
 * which path was taken.
 */
function resolveSecret(): string {
  const explicit =
    process.env.PAYLOAD_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET;
  if (explicit && explicit.length >= 16) return explicit;

  if (DATABASE_URL) {
    const derived = crypto
      .createHash("sha256")
      .update(`payload:${DATABASE_URL}`)
      .digest("hex");
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.warn(
        "[payload] PAYLOAD_SECRET not set — falling back to a deterministic " +
          "secret derived from DATABASE_URL. Set PAYLOAD_SECRET in Vercel env " +
          "vars when you can."
      );
    }
    return derived;
  }

  // Last-resort placeholder — Payload will refuse to boot, but the
  // empty-string error is more informative than crashing earlier.
  return "";
}

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: "light",
    meta: {
      titleSuffix: " · JoodLife CMS",
      icons: [
        {
          rel: "icon",
          type: "image/svg+xml",
          url: "/assets/icons/logo-wesmount.svg",
        },
      ],
      openGraph: {
        siteName: "JoodLife CMS",
      },
    },
    components: {
      graphics: {
        Logo: "@/components/admin/Logo#Logo",
        Icon: "@/components/admin/Icon#Icon",
      },
      // Renders inside the sidebar, above the nav groups. Replaces the
      // empty band Payload leaves at the top of the .nav surface.
      beforeNavLinks: ["@/components/admin/SidebarBrand#SidebarBrand"],
      // Custom dashboard surface: stat cards + recent products + recent
      // users. Renders above whatever Payload puts on /admin by default.
      beforeDashboard: ["@/components/admin/Dashboard#Dashboard"],
    },
    // /admin is the default route for Payload 3.x with the Next.js plugin.
  },
  editor: lexicalEditor(),
  collections: [Users, Products, Orders, Discounts, Media, Consultations],
  endpoints: [applyDiscountEndpoint],
  secret: resolveSecret(),
  typescript: {
    outputFile: path.resolve(dirname, "src/payload/payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, "src/payload/schema.graphql"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL,
    },
    // Auto-sync the Drizzle schema with Postgres so first-boot doesn't
    // hit "relation X does not exist". On Vercel this turns the
    // freshly-provisioned Neon DB into a fully-tabled Payload schema
    // without needing a separate `payload migrate` step. Safe for a
    // single-environment setup; if you adopt staging/prod separation,
    // switch to migrations and set push to false in production.
    push: true,
  }),
  // Allow same-origin and explicit configured URLs. Vercel
  // sets VERCEL_URL automatically (no protocol) for every deploy,
  // so we can derive the public URL even without explicit setup.
  cors: (() => {
    const out = new Set<string>();
    if (process.env.NEXT_PUBLIC_SERVER_URL)
      out.add(process.env.NEXT_PUBLIC_SERVER_URL);
    if (process.env.PAYLOAD_PUBLIC_SERVER_URL)
      out.add(process.env.PAYLOAD_PUBLIC_SERVER_URL);
    if (process.env.VERCEL_URL) out.add(`https://${process.env.VERCEL_URL}`);
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
      out.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
    out.add("http://localhost:3000");
    return Array.from(out);
  })(),
  csrf: (() => {
    const out = new Set<string>();
    if (process.env.NEXT_PUBLIC_SERVER_URL)
      out.add(process.env.NEXT_PUBLIC_SERVER_URL);
    if (process.env.PAYLOAD_PUBLIC_SERVER_URL)
      out.add(process.env.PAYLOAD_PUBLIC_SERVER_URL);
    if (process.env.VERCEL_URL) out.add(`https://${process.env.VERCEL_URL}`);
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
      out.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
    out.add("http://localhost:3000");
    return Array.from(out);
  })(),
  upload: {
    limits: {
      fileSize: 10_000_000, // 10 MB
    },
  },
  /**
   * Storage plugins. Vercel Blob persists uploaded files to Vercel's
   * managed object store so admin uploads survive serverless cold-starts
   * (the default disk-backed store doesn't on Vercel — every function
   * instance gets its own ephemeral filesystem).
   *
   * Auto-enabled when BLOB_READ_WRITE_TOKEN is set in env. To turn it on:
   *   1. In Vercel project: Storage → Connect Blob (gives a token)
   *   2. The token gets exposed as BLOB_READ_WRITE_TOKEN automatically
   *   3. Redeploy. Uploads from /admin will now go to Vercel Blob.
   *
   * Without the token the plugin is omitted and Payload falls back to
   * the local staticDir — fine for dev, ephemeral on Vercel.
   */
  // Vercel Blob plugin disabled. Two attempts to enable it broke the
  // Vercel build / admin hydration on this Next 16 / Payload 3.x stack.
  // Uploads are handled instead by a custom beforeChange hook on the
  // Media collection that calls @vercel/blob's put() directly — see
  // src/payload/hooks/uploadMediaToBlob.ts.
  plugins: [],
});
