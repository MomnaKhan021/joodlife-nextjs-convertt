import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";

import { Users } from "./src/payload/collections/Users";
import { Products } from "./src/payload/collections/Products";
import { Orders } from "./src/payload/collections/Orders";
import { Discounts } from "./src/payload/collections/Discounts";
import { Media } from "./src/payload/collections/Media";
import { Consultations } from "./src/payload/collections/Consultations";
import { Posts } from "./src/payload/collections/Posts";
import { WeightLogs } from "./src/payload/collections/WeightLogs";
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
 * Resolve the canonical public URL for this deployment. Payload uses
 * `serverURL` to build absolute links in account emails (verify-email /
 * reset-password) and elsewhere, so it must point at the real site — not a
 * per-deploy Vercel preview host. Order of preference:
 *   1. NEXT_PUBLIC_SERVER_URL / PAYLOAD_PUBLIC_SERVER_URL (explicit, stable)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (stable production host on Vercel)
 *   3. VERCEL_URL (per-deploy host — last resort)
 *   4. localhost for dev
 */
function resolveServerURL(): string {
  if (process.env.NEXT_PUBLIC_SERVER_URL) return process.env.NEXT_PUBLIC_SERVER_URL;
  if (process.env.PAYLOAD_PUBLIC_SERVER_URL)
    return process.env.PAYLOAD_PUBLIC_SERVER_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Configure how Payload sends transactional email (welcome / account-creation,
 * password reset, etc).
 *
 * IMPORTANT: when no email adapter is configured, Payload silently falls back
 * to a "console" adapter that only logs "Email attempted without being
 * configured" and sends nothing — which is why account-creation emails were
 * never actually arriving. We wire up nodemailer/SMTP here so mail really goes
 * out once SMTP credentials are present.
 *
 * Gated on SMTP_HOST so local/dev/test boots stay offline-safe: without SMTP
 * env vars we return `undefined`, leaving Payload's console adapter in place
 * (mail is logged, never sent) instead of forcing a network connection at boot.
 *
 * Required env to actually send:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME   (sender identity)
 *   SMTP_SECURE=true                      (optional; for port 465 / TLS-on-connect)
 */
// Only call this when SMTP_HOST is set (see the guarded `email:` below). It
// always resolves to an adapter — never `undefined` — so the resolved type
// stays assignable to Payload's `Promise<EmailAdapter>`.
async function resolveEmailAdapter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const base = await nodemailerAdapter({
    defaultFromAddress:
      process.env.EMAIL_FROM_ADDRESS || "no-reply@joodlife.com",
    defaultFromName: process.env.EMAIL_FROM_NAME || "JoodLife",
    // Don't verify the transport at boot — on serverless a verify against an
    // unreachable SMTP host hangs the cold start.
    skipVerify: true,
    transportOptions: {
      host,
      port,
      // 465 uses implicit TLS; 587/25 upgrade via STARTTLS.
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      // Fail fast instead of hanging the (time-limited) serverless function
      // when SMTP is misconfigured or unreachable. Kept well under Vercel's
      // default 10s function limit.
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    },
  });

  // Make sending fault-tolerant. Payload's forgot-password operation `await`s
  // `sendEmail` inline with NO try/catch, so a slow or failing SMTP would
  // otherwise time out / 500 the whole request (this is exactly the
  // "Something went wrong" on the forgot-password page). We bound it with a
  // hard timeout and swallow errors: the reset token is already generated and
  // stored, so the flow should succeed regardless of email delivery, and we
  // never reveal whether an address is registered. Delivery failures are
  // logged for diagnostics.
  const wrapped: typeof base = (deps) => {
    const instance = base(deps);
    return {
      ...instance,
      sendEmail: async (message) => {
        try {
          await Promise.race([
            instance.sendEmail(message),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("sendEmail timed out")), 7000)
            ),
          ]);
        } catch (err) {
          deps?.payload?.logger?.error?.({
            msg: "Email send failed (non-fatal)",
            err,
          });
        }
      },
    };
  };
  return wrapped;
}

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
  serverURL: resolveServerURL(),
  // Only pass a (Promise) adapter when SMTP is configured. Payload calls the
  // awaited value as a function, so resolving to `undefined` would crash init;
  // passing literal `undefined` correctly falls back to the console adapter.
  email: process.env.SMTP_HOST ? resolveEmailAdapter() : undefined,
  // On boot, make sure the products table/columns match the collection.
  // Production never auto-pushes schema (push is dev-only) and there are no
  // migrations, so new fields would otherwise be missing in prod and break
  // the products admin. Additive + idempotent; failures are logged, never throw.
  onInit: async (payload) => {
    try {
      const { ensureProductsSchema } = await import("@/lib/ensureSchema");
      await ensureProductsSchema(payload);
    } catch (err) {
      payload.logger?.error?.({ msg: "ensureProductsSchema (onInit) failed", err });
    }
    try {
      // Ensure the weight_logs table exists too, so the admin (Payload REST)
      // can list/manage the WeightLogs collection in production.
      const { ensureWeightLogsTable } = await import("@/lib/weightLogs");
      await ensureWeightLogsTable(payload);
    } catch (err) {
      payload.logger?.error?.({ msg: "ensureWeightLogsTable (onInit) failed", err });
    }
  },
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
  collections: [Users, Products, Orders, Discounts, Media, Consultations, Posts, WeightLogs],
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
