import "server-only";

import type { Payload } from "payload";

/**
 * Bring the `products` schema in line with the Products collection.
 *
 * Payload's Postgres adapter only auto-pushes schema when
 * NODE_ENV !== "production", and this project has no migrations — so on the
 * live (Vercel) database, any field added to the Products collection after
 * the table was first created never gets its column. Payload then SELECTs a
 * column that doesn't exist and every products query throws ("Something went
 * wrong"), which is why the admin can't list or open products.
 *
 * We can't use Payload's own push at runtime (drizzle-kit push trips over
 * "column id is in a primary key" on this Postgres). Instead we apply the
 * exact, purely-additive DDL ourselves — idempotent (IF NOT EXISTS), so it's
 * safe to run on every boot. Verified against a dev-push-created schema.
 */
let ensured = false;

export async function ensureProductsSchema(payload: Payload): Promise<void> {
  if (ensured) return;
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle as { execute: (q: unknown) => Promise<unknown> } | undefined;
  if (!drizzle?.execute) return;
  const { sql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };

  const statements: string[] = [
    // Enum types backing the `category` and `treatment` select fields.
    `DO $$ BEGIN CREATE TYPE "enum_products_category" AS ENUM ('medication','supplement','accessory','other'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE "enum_products_treatment" AS ENUM ('weight-loss','erectile-dysfunction','period-delay'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // Base table (no-op if it already exists).
    `CREATE TABLE IF NOT EXISTS "products" (
       "id" serial PRIMARY KEY NOT NULL,
       "title" varchar NOT NULL,
       "slug" varchar NOT NULL,
       "description" varchar NOT NULL DEFAULT '',
       "category" "enum_products_category" NOT NULL DEFAULT 'medication',
       "updated_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
       "created_at" timestamp(3) with time zone NOT NULL DEFAULT now()
     )`,

    // Every optional/added column — additive, nullable, safe on existing rows.
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tagline" varchar`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "card_copy" varchar`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "from_price" numeric`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compare_price" numeric`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subscription_price" numeric`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "display_order" numeric DEFAULT 100`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" varchar`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "footer_color" varchar DEFAULT '#142e2a'`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating_value" numeric`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating_count" numeric`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hero_image_url" varchar`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gallery_image_urls" jsonb`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variants_json" jsonb`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`,
    // The new treatment-differentiation fields.
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "treatment" "enum_products_treatment"`,
    `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tag" varchar`,

    // Array sub-tables (images / variants).
    `CREATE TABLE IF NOT EXISTS "products_images" (
       "_order" integer NOT NULL,
       "_parent_id" integer NOT NULL,
       "id" varchar PRIMARY KEY NOT NULL,
       "image_id" integer,
       "alt" varchar
     )`,
    `CREATE TABLE IF NOT EXISTS "products_variants" (
       "_order" integer NOT NULL,
       "_parent_id" integer NOT NULL,
       "id" varchar PRIMARY KEY NOT NULL,
       "label" varchar NOT NULL,
       "size" varchar,
       "color" varchar,
       "price" numeric NOT NULL,
       "compare_price" numeric,
       "sku" varchar,
       "stock" numeric DEFAULT 0
     )`,

    // FKs + indexes for the sub-tables (best-effort).
    `DO $$ BEGIN ALTER TABLE "products_images" ADD CONSTRAINT "products_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "products"("id") ON DELETE CASCADE; EXCEPTION WHEN others THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "products_images" ADD CONSTRAINT "products_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL; EXCEPTION WHEN others THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "products_variants" ADD CONSTRAINT "products_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "products"("id") ON DELETE CASCADE; EXCEPTION WHEN others THEN null; END $$`,
    `CREATE INDEX IF NOT EXISTS "products_images_order_idx" ON "products_images" ("_order")`,
    `CREATE INDEX IF NOT EXISTS "products_images_parent_id_idx" ON "products_images" ("_parent_id")`,
    `CREATE INDEX IF NOT EXISTS "products_images_image_idx" ON "products_images" ("image_id")`,
    `CREATE INDEX IF NOT EXISTS "products_variants_order_idx" ON "products_variants" ("_order")`,
    `CREATE INDEX IF NOT EXISTS "products_variants_parent_id_idx" ON "products_variants" ("_parent_id")`,
  ];

  for (const stmt of statements) {
    try {
      await drizzle.execute(sql.raw(stmt));
    } catch (err) {
      payload.logger?.error?.({ msg: "ensureProductsSchema statement failed", err, stmt });
    }
  }
  ensured = true;
}
