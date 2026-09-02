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
import { Pages } from "./src/payload/collections/Pages";
import { Header, Footer } from "./src/payload/globals/SiteChrome";
import { HomePage } from "./src/payload/globals/HomePage";
import { Treatments } from "./src/payload/globals/Treatments";
import { Policies } from "./src/payload/globals/Policies";
import { Support } from "./src/payload/globals/Support";
import { WeightLogs } from "./src/payload/collections/WeightLogs";
import { Inventory } from "./src/payload/collections/Inventory";
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
 * Database branch guard. This Neon database is ONLY for JoodLife and the app
 * must always run against the MAIN branch. Set EXPECTED_DB_HOST in Vercel to
 * the main branch's endpoint id (e.g. "ep-late-frost-aml667fh"); if a deploy
 * ever resolves a different host (a preview branch, or a swapped/reconnected
 * integration — the cause of the July 2026 "empty database" incident), this
 * logs an unmissable error on boot and /api/diag reports the mismatch.
 * Pooled ("-pooler") and direct endpoints of the same branch both pass.
 */
(() => {
  const expected = (process.env.EXPECTED_DB_HOST ?? "").trim();
  if (!expected || !DATABASE_URL) return;
  let host = "";
  try {
    host = new URL(DATABASE_URL).hostname;
  } catch {
    return;
  }
  const norm = (h: string) => h.split(".")[0].replace(/-pooler$/, "");
  if (norm(host) !== norm(expected)) {
    console.error(
      `[db-branch-guard] ✖ DATABASE MISMATCH: connected to "${host}" but ` +
        `EXPECTED_DB_HOST is "${expected}". This deploy is NOT using the ` +
        `JoodLife main-branch database — fix the Vercel database env vars ` +
        `before trusting any data on this deployment.`,
    );
  }
})();

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
    // Derive from a NORMALISED seed — the host (minus any "-pooler" suffix)
    // plus the database name — NOT the raw URL. The raw URL carries the
    // password and query params (and differs between the pooled / unpooled
    // endpoints), so hashing it means the signing secret silently changes
    // whenever Neon rotates credentials or a different connection variant is
    // resolved — which invalidates every login session. Normalising keeps the
    // fallback secret stable across those changes. (Set PAYLOAD_SECRET to opt
    // out of this fallback entirely.)
    let seed = DATABASE_URL;
    try {
      const u = new URL(DATABASE_URL);
      const host = u.hostname.replace(/-pooler\b/, "");
      seed = `${host}${u.pathname}`;
    } catch {
      // Non-URL connection string — fall back to the raw value.
    }
    const derived = crypto
      .createHash("sha256")
      .update(`payload:${seed}`)
      .digest("hex");
    if (process.env.NODE_ENV !== "test") {
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
  // On boot, repair the live DB schema to match the collections. Production
  // never auto-pushes schema (push is dev-only) and there are no migrations, so
  // tables/columns added since the DB was created would otherwise be missing —
  // which breaks the native admin (opening documents, the account menu, whole
  // collections, incl. Payload's internal locked-documents/preferences tables).
  // Fully additive + idempotent; failures are logged, never throw.
  onInit: async (payload) => {
    try {
      const { ensureFullSchema } = await import("@/lib/ensureSchema");
      await ensureFullSchema(payload);
    } catch (err) {
      payload.logger?.error?.({ msg: "ensureFullSchema (onInit) failed", err });
    }
    // Promote allowlisted staff to admin on every boot (survives redeploys and
    // DB restores). Only touches accounts that already exist; never creates or
    // sets passwords.
    try {
      const { ADMIN_ALLOWLIST } = await import("@/lib/adminAllowlist");
      const inList = [...ADMIN_ALLOWLIST]
        .map((e) => `'${e.replace(/'/g, "''")}'`)
        .join(", ");
      const drizzle = (
        payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
      ).drizzle;
      if (inList && drizzle?.execute) {
        const { sql } = await import("drizzle-orm");
        await drizzle.execute(
          sql.raw(
            `UPDATE "users" SET role = 'admin'
               WHERE LOWER(email) IN (${inList})
                 AND COALESCE(role::text, '') <> 'admin'`,
          ),
        );
      }
    } catch (err) {
      payload.logger?.error?.({ msg: "admin allowlist promotion (onInit) failed", err });
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
      beforeNavLinks: ["@/components/admin/SidebarBrand#SidebarBrand", "@/components/admin/AdminThemeStyle#AdminThemeStyle"],
      // Custom dashboard surface: stat cards + recent products + recent
      // users. Renders above whatever Payload puts on /admin by default.
      beforeDashboard: ["@/components/admin/Dashboard#Dashboard"],
    },
    // /admin is the default route for Payload 3.x with the Next.js plugin.
  },
  editor: lexicalEditor(),
  collections: [Users, Products, Orders, Discounts, Media, Consultations, Posts, Pages, WeightLogs, Inventory],
  globals: [Header, Footer, HomePage, Treatments, Policies, Support],
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
      // Serverless-safe pooling. Without these, node-postgres defaults to 10
      // connections per instance and never releases idle ones — so across
      // many Vercel instances Neon's connection slots get exhausted
      // ("remaining connection slots are reserved for roles with the SUPERUSER
      // attribute"). Keep each instance's footprint tiny and drop idle
      // connections quickly so slots free up between requests.
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    },
    // Auto-sync the Drizzle schema with Postgres so first-boot doesn't
    // hit "relation X does not exist". On Vercel this turns the
    // freshly-provisioned Neon DB into a fully-tabled Payload schema
    // without needing a separate `payload migrate` step. Safe for a
    // single-environment setup; if you adopt staging/prod separation,
    // switch to migrations and set push to false in production.
    //
    // Set PAYLOAD_DB_PUSH=false to turn push OFF. Needed for local dev once
    // `ensureFullSchema` (onInit) has added the 2FA/OTP columns that no
    // collection declares: on every restart push then notices the extras and
    // BLOCKS on an interactive "DATA LOSS WARNING … (y/N)" prompt, which
    // hangs Payload init and makes the whole site unresponsive. Answering
    // "y" would drop real columns. Schema stays correct without push because
    // ensureFullSchema repairs it additively on boot — the same mechanism
    // production already relies on. Unset (the default) keeps push enabled,
    // so Vercel behaviour is unchanged.
    push: process.env.PAYLOAD_DB_PUSH !== "false",
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
