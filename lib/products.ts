import "server-only";

import { getPayloadInstance } from "@/lib/payload";

export type ProductVariant = {
  label: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock?: number;
};

export type StorefrontProduct = {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  category: string;
  fromPrice: number | null;
  subscriptionPrice: number | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  variants: ProductVariant[];
  ratingValue: number | null;
  ratingCount: number | null;
  badge: string | null;
  isActive: boolean;
};

type Row = {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  description: string;
  category: string;
  from_price: string | null;
  subscription_price: string | null;
  hero_image_url: string | null;
  gallery_image_urls: unknown;
  variants_json: unknown;
  rating_value: string | null;
  rating_count: number | null;
  badge: string | null;
  is_active: boolean;
};

function rowToProduct(row: Row): StorefrontProduct {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    category: row.category,
    fromPrice: row.from_price !== null ? Number(row.from_price) : null,
    subscriptionPrice:
      row.subscription_price !== null ? Number(row.subscription_price) : null,
    heroImageUrl: row.hero_image_url,
    galleryImageUrls: Array.isArray(row.gallery_image_urls)
      ? (row.gallery_image_urls as string[])
      : [],
    variants: Array.isArray(row.variants_json)
      ? (row.variants_json as ProductVariant[])
      : [],
    ratingValue: row.rating_value !== null ? Number(row.rating_value) : null,
    ratingCount: row.rating_count,
    badge: row.badge,
    isActive: row.is_active,
  };
}

/**
 * Reads products straight from Postgres via Drizzle's raw SQL escape
 * hatch. We avoid Payload's `find()` because the products schema is
 * the lightweight stub we created via /api/diag — it doesn't carry
 * all of the relationship tables Payload's Local API expects.
 */
async function rawQuery<T>(sql: string): Promise<T[]> {
  const payload = await getPayloadInstance();
  const drizzle = (payload.db as unknown as {
    drizzle?: { execute?: (q: unknown) => Promise<unknown> };
  }).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute is unavailable");
  }
  // Drizzle's pg execute accepts the `sql` template tag from drizzle-orm
  // — we side-step that by using the package's `sql.raw` factory below.
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  const result = (await drizzle.execute(drizzleSql.raw(sql))) as
    | { rows?: T[] }
    | T[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

export async function listStorefrontProducts(): Promise<StorefrontProduct[]> {
  try {
    const rows = await rawQuery<Row>(
      `SELECT id, title, slug, tagline, description, category,
              from_price, subscription_price, hero_image_url,
              gallery_image_urls, variants_json,
              rating_value, rating_count, badge, is_active
       FROM products
       WHERE is_active = true
       ORDER BY from_price ASC NULLS LAST, id ASC`
    );
    return rows.map(rowToProduct);
  } catch (err) {
    // Don't blow up the page if the products table isn't seeded yet
    // — the empty-state guidance in /shop kicks in.
    console.warn("[products] listStorefrontProducts failed:", err);
    return [];
  }
}

export async function getStorefrontProduct(
  slug: string
): Promise<StorefrontProduct | null> {
  try {
    const safeSlug = slug.replace(/'/g, "''");
    const rows = await rawQuery<Row>(
      `SELECT id, title, slug, tagline, description, category,
              from_price, subscription_price, hero_image_url,
              gallery_image_urls, variants_json,
              rating_value, rating_count, badge, is_active
       FROM products
       WHERE slug = '${safeSlug}' AND is_active = true
       LIMIT 1`
    );
    return rows[0] ? rowToProduct(rows[0]) : null;
  } catch (err) {
    console.warn("[products] getStorefrontProduct failed:", err);
    return null;
  }
}
