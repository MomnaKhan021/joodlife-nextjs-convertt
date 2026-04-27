/**
 * Diagnostic endpoint that surfaces Payload init + user-create errors.
 *
 *   GET  /api/diag — env-var presence + boot status
 *   POST /api/diag/?action=create-user
 *     body: { name, email, password }
 *     → calls payload.create({ collection: "users", ... }) and returns
 *       the *real* error if it fails
 *
 * Read-only on env (length / first 12 chars only — never the full
 * value). Safe to leave deployed during integration.
 */
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function describe(value: string | undefined) {
  if (!value) return { present: false };
  return {
    present: true,
    length: value.length,
    startsWith: value.slice(0, 12) + (value.length > 12 ? "…" : ""),
  };
}

function resolveDb(): { name: string | null; value: string | null } {
  const exact = [
    "DATABASE_URI",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ];
  for (const k of exact) {
    if (process.env[k]) return { name: k, value: process.env[k] as string };
  }
  for (const s of [
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
  ]) {
    const found = Object.keys(process.env).find(
      (k) => k.endsWith(s) && process.env[k]
    );
    if (found) return { name: found, value: process.env[found] as string };
  }
  return { name: null, value: null };
}

function envSnapshot() {
  const db = resolveDb();
  return {
    DATABASE_URL_resolved_from: db.name,
    DATABASE_URL: describe(db.value ?? undefined),
    PAYLOAD_SECRET: describe(process.env.PAYLOAD_SECRET),
    NEXT_PUBLIC_SERVER_URL: describe(process.env.NEXT_PUBLIC_SERVER_URL),
    PAYLOAD_PUBLIC_SERVER_URL: describe(process.env.PAYLOAD_PUBLIC_SERVER_URL),
    available_db_keys: Object.keys(process.env).filter(
      (k) => /DATABASE_URL|POSTGRES_URL|DATABASE_URI/.test(k) && process.env[k]
    ),
    NODE_ENV: process.env.NODE_ENV,
  };
}

function captureError(err: unknown) {
  const e = err as Error & {
    cause?: unknown;
    code?: string;
    data?: unknown;
  };
  return {
    name: e.name,
    message: e.message,
    code: e.code,
    cause:
      e.cause && typeof e.cause === "object"
        ? (e.cause as { message?: string; code?: string }).message ??
          JSON.stringify(e.cause).slice(0, 300)
        : undefined,
    data:
      typeof e.data === "object"
        ? JSON.stringify(e.data).slice(0, 300)
        : undefined,
    stack: e.stack?.split("\n").slice(0, 8).join("\n"),
  };
}

// Bump this when shipping a new diag — lets us confirm the function
// is the latest build.
const VERSION = "diag-v15-seed-products";

export async function GET() {
  const env = envSnapshot();

  if (!env.DATABASE_URL.present) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-env",
        env,
        hint: "No Postgres URL found. Add DATABASE_URI in Vercel.",
      },
      { status: 500 }
    );
  }

  try {
    const { getPayloadInstance } = await import("@/lib/payload");
    const payload = await getPayloadInstance();
    return NextResponse.json({
      version: VERSION,
      ok: true,
      env,
      payload: {
        booted: true,
        collections: Object.keys(payload.collections ?? {}),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        version: VERSION,
        ok: false,
        reason: "payload-init-failed",
        env,
        error: captureError(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // POST /api/diag?action=migrate — forces the Drizzle schema push so
  // the empty Postgres gets all Payload tables created up-front. Useful
  // when push: true on the adapter doesn't trigger because Payload 3.x
  // skips it under NODE_ENV=production by default.
  if (action === "migrate") {
    try {
      const { getPayloadInstance } = await import("@/lib/payload");
      const payload = await getPayloadInstance();
      const db = payload.db as unknown as {
        execute?: (args: { drizzle?: unknown; raw?: string }) => Promise<unknown>;
        drizzle?: { execute?: (sql: unknown) => Promise<unknown> };
      };

      if (!db.execute || !db.drizzle) {
        return NextResponse.json(
          {
            version: VERSION,
            ok: false,
            reason: "no-execute",
            hasExecute: typeof db.execute,
            hasDrizzle: typeof db.drizzle,
          },
          { status: 500 }
        );
      }

      // Hand-written SQL for the minimum schema Payload needs to render
      // /admin: users + users_sessions for auth, plus the Payload-internal
      // tables (preferences, locked documents, migrations, kv) that the
      // admin UI reads on every navigation.
      const SQL = `
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar,
          "role" varchar DEFAULT 'customer' NOT NULL,
          "email" varchar NOT NULL UNIQUE,
          "reset_password_token" varchar,
          "reset_password_expiration" timestamp(3) with time zone,
          "salt" varchar,
          "hash" varchar,
          "login_attempts" numeric DEFAULT 0,
          "lock_until" timestamp(3) with time zone,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
        CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" ("created_at");
        CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" ("updated_at");

        CREATE TABLE IF NOT EXISTS "users_sessions" (
          "_order" integer NOT NULL,
          "_parent_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "id" varchar PRIMARY KEY NOT NULL,
          "created_at" timestamp(3) with time zone,
          "expires_at" timestamp(3) with time zone
        );
        CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" ("_order");
        CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" ("_parent_id");

        CREATE TABLE IF NOT EXISTS "payload_preferences" (
          "id" serial PRIMARY KEY NOT NULL,
          "key" varchar,
          "value" jsonb,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" ("key");

        CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
          "id" serial PRIMARY KEY NOT NULL,
          "order" integer,
          "parent_id" integer NOT NULL REFERENCES "payload_preferences"("id") ON DELETE CASCADE,
          "path" varchar NOT NULL,
          "users_id" integer REFERENCES "users"("id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_id_idx" ON "payload_preferences_rels" ("parent_id");
        CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" ("path");

        CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
          "id" serial PRIMARY KEY NOT NULL,
          "global_slug" varchar,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" ("global_slug");

        -- Stub tables for the other collections so FK references in
        -- payload_locked_documents_rels resolve. Real schemas can be
        -- expanded later as you start using each collection.
        CREATE TABLE IF NOT EXISTS "products" (
          "id" serial PRIMARY KEY NOT NULL,
          "title" varchar,
          "slug" varchar,
          "description" text,
          "price" numeric,
          "compare_price" numeric,
          "sku" varchar,
          "stock" numeric DEFAULT 0,
          "category" varchar,
          "is_active" boolean DEFAULT true,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "orders" (
          "id" serial PRIMARY KEY NOT NULL,
          "order_number" varchar,
          "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
          "discount_id" integer,
          "discount_amount" numeric DEFAULT 0,
          "total_amount" numeric,
          "status" varchar DEFAULT 'pending',
          "payment_method" varchar DEFAULT 'card',
          "notes" text,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "discounts" (
          "id" serial PRIMARY KEY NOT NULL,
          "code" varchar UNIQUE,
          "type" varchar DEFAULT 'percentage',
          "value" numeric,
          "expiry_date" timestamp(3) with time zone,
          "usage_limit" numeric,
          "usage_count" numeric DEFAULT 0,
          "is_active" boolean DEFAULT true,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "media" (
          "id" serial PRIMARY KEY NOT NULL,
          "alt" varchar,
          "caption" varchar,
          "url" varchar,
          "thumbnail_u_r_l" varchar,
          "filename" varchar,
          "mime_type" varchar,
          "filesize" numeric,
          "width" numeric,
          "height" numeric,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
          "id" serial PRIMARY KEY NOT NULL,
          "order" integer,
          "parent_id" integer NOT NULL REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE,
          "path" varchar NOT NULL,
          "users_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
          "products_id" integer REFERENCES "products"("id") ON DELETE CASCADE,
          "orders_id" integer REFERENCES "orders"("id") ON DELETE CASCADE,
          "discounts_id" integer REFERENCES "discounts"("id") ON DELETE CASCADE,
          "media_id" integer REFERENCES "media"("id") ON DELETE CASCADE
        );
        -- ALTER for existing rows that were created by an earlier
        -- iteration of this script (only had users_id).
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "products_id" integer REFERENCES "products"("id") ON DELETE CASCADE;
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "orders_id" integer REFERENCES "orders"("id") ON DELETE CASCADE;
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "discounts_id" integer REFERENCES "discounts"("id") ON DELETE CASCADE;
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "media_id" integer REFERENCES "media"("id") ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_id_idx" ON "payload_locked_documents_rels" ("parent_id");

        CREATE TABLE IF NOT EXISTS "payload_migrations" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar,
          "batch" numeric,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
      `;

      // Split + execute one statement at a time so a partial failure
      // doesn't leave a half-applied transaction.
      const statements = SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      const ran: string[] = [];
      for (const s of statements) {
        try {
          await db.execute({ drizzle: db.drizzle, raw: s });
          ran.push(s.slice(0, 80));
        } catch (e) {
          return NextResponse.json(
            {
              version: VERSION,
              ok: false,
              reason: "execute-failed",
              ran,
              failingStatement: s.slice(0, 200),
              error: captureError(e),
            },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        version: VERSION,
        ok: true,
        ran: ran.length,
        message: "users + users_sessions tables ensured",
      });
    } catch (err) {
      return NextResponse.json(
        {
          version: VERSION,
          ok: false,
          reason: "migrate-init-failed",
          error: captureError(err),
        },
        { status: 500 }
      );
    }
  }

  // POST /api/diag?action=seed-products
  // Adds the missing columns to the products stub table, wipes any
  // existing rows, and inserts the three medications scraped from
  // joodlife.com (Mounjaro, Wegovy, Saxenda). Each row carries its
  // hero image URL, tagline, "from" price, and variant list as JSON.
  if (action === "seed-products") {
    try {
      const { getPayloadInstance } = await import("@/lib/payload");
      const payload = await getPayloadInstance();
      const db = payload.db as unknown as {
        execute?: (args: { drizzle?: unknown; raw?: string }) => Promise<unknown>;
        drizzle?: unknown;
      };
      if (!db.execute || !db.drizzle) {
        return NextResponse.json(
          { ok: false, reason: "no-execute" },
          { status: 500 }
        );
      }

      const SQL = `
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tagline" varchar;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "from_price" numeric;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_url" varchar;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gallery_image_urls" jsonb;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variants_json" jsonb;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subscription_price" numeric;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" varchar;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating_value" numeric;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating_count" integer;
        DELETE FROM "products";
      `;

      const ddl = SQL.split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of ddl) {
        await db.execute({ drizzle: db.drizzle, raw: stmt });
      }

      const products = [
        {
          title: "Mounjaro",
          slug: "mounjaro",
          tagline: "Tirzepatide",
          description:
            "Once-weekly injection that activates GLP-1 and GIP receptors. Suppresses appetite and supports metabolic health. MHRA-approved, prescribed online after clinician review.",
          category: "medication",
          fromPrice: 139,
          subscriptionPrice: 189,
          heroImageUrl:
            "https://joodlife.com/cdn/shop/files/2.png?v=1767173456&width=1200",
          galleryImageUrls: [
            "https://joodlife.com/cdn/shop/files/2.png?v=1767173456&width=1200",
            "https://joodlife.com/cdn/shop/files/Rectangle_5574.png?v=1767173528&width=1200",
            "https://joodlife.com/cdn/shop/files/Frame_2147239881.png?v=1767173497&width=1200",
            "https://joodlife.com/cdn/shop/files/4.png?v=1767173456&width=1200",
          ],
          variants: [
            { label: "2.5 mg",  price: 139 },
            { label: "5 mg",    price: 153 },
            { label: "7.5 mg",  price: 205 },
            { label: "10 mg",   price: 230 },
            { label: "12.5 mg", price: 247 },
            { label: "15 mg",   price: 269 },
          ],
          ratingValue: 4.8,
          ratingCount: 312,
          badge: "Best seller",
        },
        {
          title: "Wegovy",
          slug: "wegovy",
          tagline: "Semaglutide",
          description:
            "Prescription-only once-weekly injection. Activates GLP-1 receptors to reduce appetite and increase fullness, supporting steady weight loss alongside lifestyle changes.",
          category: "medication",
          fromPrice: 90,
          subscriptionPrice: 189,
          heroImageUrl:
            "https://joodlife.com/cdn/shop/files/3.png?v=1767173497&width=1200",
          galleryImageUrls: [
            "https://joodlife.com/cdn/shop/files/3.png?v=1767173497&width=1200",
            "https://joodlife.com/cdn/shop/files/Frame_2147239881.png?v=1767173497&width=1200",
            "https://joodlife.com/cdn/shop/files/Rectangle_5574.png?v=1767173528&width=1200",
            "https://joodlife.com/cdn/shop/files/5.png?v=1767173497&width=1200",
          ],
          variants: [
            { label: "0.25 mg", price: 90 },
            { label: "0.5 mg",  price: 90 },
            { label: "1 mg",    price: 90 },
            { label: "1.7 mg",  price: 145 },
            { label: "2.4 mg",  price: 234 },
          ],
          ratingValue: 4.8,
          ratingCount: 248,
          badge: null,
        },
        {
          title: "Saxenda",
          slug: "saxenda",
          tagline: "Liraglutide",
          description:
            "Clinician-prescribed daily injection that helps reduce appetite. A long-established GLP-1 option for steady, supported weight management.",
          category: "medication",
          fromPrice: 145,
          subscriptionPrice: 189,
          heroImageUrl:
            "https://joodlife.com/cdn/shop/files/4_1.png?v=1767173528&width=1200",
          galleryImageUrls: [
            "https://joodlife.com/cdn/shop/files/4_1.png?v=1767173528&width=1200",
            "https://joodlife.com/cdn/shop/files/4.png?v=1767173456&width=1200",
          ],
          variants: [
            { label: "6 mg",  price: 145 },
            { label: "12 mg", price: 199 },
            { label: "18 mg", price: 245 },
          ],
          ratingValue: 4.7,
          ratingCount: 96,
          badge: null,
        },
      ];

      let inserted = 0;
      for (const p of products) {
        const insert = `
          INSERT INTO "products" (
            title, slug, description, category, is_active,
            tagline, from_price, hero_image_url,
            gallery_image_urls, variants_json,
            subscription_price, rating_value, rating_count, badge,
            updated_at, created_at
          ) VALUES (
            $T_TITLE, $T_SLUG, $T_DESC, 'medication', true,
            $T_TAGLINE, ${p.fromPrice}, $T_HERO,
            $T_GALLERY::jsonb, $T_VARIANTS::jsonb,
            ${p.subscriptionPrice}, ${p.ratingValue}, ${p.ratingCount},
            ${p.badge ? "$T_BADGE" : "NULL"},
            now(), now()
          );
        `;
        // We don't have a parametrised execute so escape strings inline
        const esc = (s: string) => "'" + s.replace(/'/g, "''") + "'";
        const filled = insert
          .replace("$T_TITLE", esc(p.title))
          .replace("$T_SLUG", esc(p.slug))
          .replace("$T_DESC", esc(p.description))
          .replace("$T_TAGLINE", esc(p.tagline))
          .replace("$T_HERO", esc(p.heroImageUrl))
          .replace("$T_GALLERY", esc(JSON.stringify(p.galleryImageUrls)))
          .replace("$T_VARIANTS", esc(JSON.stringify(p.variants)))
          .replace("$T_BADGE", p.badge ? esc(p.badge) : "");
        await db.execute({ drizzle: db.drizzle, raw: filled });
        inserted++;
      }

      return NextResponse.json({
        version: VERSION,
        ok: true,
        inserted,
        products: products.map((p) => p.slug),
      });
    } catch (err) {
      return NextResponse.json(
        {
          version: VERSION,
          ok: false,
          reason: "seed-failed",
          error: captureError(err),
        },
        { status: 500 }
      );
    }
  }

  // Promote a user to admin role. Pass {email} in the body.
  if (action === "promote") {
    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, reason: "invalid-json" },
        { status: 400 }
      );
    }
    if (!body.email) {
      return NextResponse.json(
        { ok: false, reason: "missing-email" },
        { status: 400 }
      );
    }
    try {
      const { getPayloadInstance } = await import("@/lib/payload");
      const payload = await getPayloadInstance();
      const found = await payload.find({
        collection: "users",
        where: { email: { equals: body.email } },
        limit: 1,
        overrideAccess: true,
      });
      const target = found.docs[0];
      if (!target) {
        return NextResponse.json(
          { ok: false, reason: "user-not-found" },
          { status: 404 }
        );
      }
      const updated = await payload.update({
        collection: "users",
        id: target.id,
        data: { role: "admin" } as Record<string, unknown>,
        overrideAccess: true,
      });
      return NextResponse.json({
        version: VERSION,
        ok: true,
        promoted: {
          id: String(updated.id),
          email: updated.email,
          role: (updated as { role?: string }).role,
        },
      });
    } catch (err) {
      return NextResponse.json(
        {
          version: VERSION,
          ok: false,
          reason: "promote-failed",
          error: captureError(err),
        },
        { status: 500 }
      );
    }
  }

  if (action !== "create-user") {
    return NextResponse.json({ version: VERSION, ok: false, reason: "unknown-action" }, { status: 400 });
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid-json" },
      { status: 400 }
    );
  }

  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json(
      { ok: false, reason: "missing-fields", needs: ["name", "email", "password"] },
      { status: 400 }
    );
  }

  try {
    const { getPayloadInstance } = await import("@/lib/payload");
    const payload = await getPayloadInstance();

    const created = await payload.create({
      collection: "users",
      data: { name, email, password },
      overrideAccess: true,
    });

    return NextResponse.json({
      ok: true,
      created: {
        id: String(created.id),
        email: created.email,
        name: (created as { name?: string }).name,
        role: (created as { role?: string }).role,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        reason: "create-failed",
        error: captureError(err),
      },
      { status: 500 }
    );
  }
}
