import "server-only";

import { getPayloadInstance } from "@/lib/payload";

export type ProductVariant = {
  label: string;
  size?: string | null;
  color?: string | null;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  stock?: number | null;
};

export type StorefrontProduct = {
  id: number;
  title: string;
  slug: string;
  tagline: string | null;
  cardCopy: string | null;
  description: string;
  category: string;
  fromPrice: number | null;
  comparePrice: number | null;
  subscriptionPrice: number | null;
  displayOrder: number | null;
  footerColor: string | null;
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
  card_copy: string | null;
  description: string;
  category: string;
  from_price: string | null;
  compare_price: string | null;
  subscription_price: string | null;
  display_order: number | null;
  footer_color: string | null;
  hero_image_url: string | null;
  gallery_image_urls: unknown;
  variants_json: unknown;
  rating_value: string | null;
  rating_count: number | null;
  badge: string | null;
  is_active: boolean;
};

type VariantRow = {
  _parent_id: number;
  label: string | null;
  size: string | null;
  color: string | null;
  price: string | null;
  compare_price: string | null;
  sku: string | null;
  stock: string | null;
};

type ImageRow = {
  _parent_id: number;
  image_url: string | null;
  alt: string | null;
};

async function rawQuery<T>(sql: string): Promise<T[]> {
  const payload = await getPayloadInstance();
  const drizzle = (payload.db as unknown as {
    drizzle?: { execute?: (q: unknown) => Promise<unknown> };
  }).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute is unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  const result = (await drizzle.execute(drizzleSql.raw(sql))) as
    | { rows?: T[] }
    | T[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

const SELECT_COLUMNS = `id, title, slug, tagline, card_copy, description, category,
       from_price, compare_price, subscription_price, display_order, footer_color,
       hero_image_url, gallery_image_urls, variants_json,
       rating_value, rating_count, badge, is_active`;

/**
 * Pull CMS-managed variants from products_variants for the given
 * product IDs. Returns an empty map when the table doesn't exist yet
 * (older deployments) so the URL-based variants_json fallback wins.
 */
async function fetchVariantsByProduct(
  productIds: number[]
): Promise<Map<number, ProductVariant[]>> {
  if (productIds.length === 0) return new Map();
  try {
    const rows = await rawQuery<VariantRow>(
      `SELECT _parent_id, label, size, color, price, compare_price, sku, stock
       FROM products_variants
       WHERE _parent_id IN (${productIds.join(",")})
       ORDER BY _parent_id ASC, _order ASC`
    );
    const map = new Map<number, ProductVariant[]>();
    for (const r of rows) {
      const list = map.get(r._parent_id) ?? [];
      list.push({
        label: r.label ?? "",
        size: r.size,
        color: r.color,
        price: r.price !== null ? Number(r.price) : 0,
        comparePrice:
          r.compare_price !== null ? Number(r.compare_price) : null,
        sku: r.sku,
        stock: r.stock !== null ? Number(r.stock) : null,
      });
      map.set(r._parent_id, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Pull CMS-uploaded images (joined to media) for the given product IDs.
 * Returns an empty map when the join table doesn't exist yet.
 *
 * NOTE on URL: the `media` table stores the public URL Payload generated
 * at upload time. With Vercel Blob enabled, that's a long Blob URL.
 * Without it, it's a /api/media/file/<filename> path served by Payload.
 */
async function fetchImagesByProduct(
  productIds: number[]
): Promise<Map<number, { url: string; alt: string | null }[]>> {
  if (productIds.length === 0) return new Map();
  try {
    const rows = await rawQuery<ImageRow>(
      `SELECT pi._parent_id, m.url AS image_url, COALESCE(pi.alt, m.alt) AS alt
       FROM products_images pi
       LEFT JOIN media m ON m.id = pi.image_id
       WHERE pi._parent_id IN (${productIds.join(",")})
       ORDER BY pi._parent_id ASC, pi._order ASC`
    );
    const map = new Map<number, { url: string; alt: string | null }[]>();
    for (const r of rows) {
      if (!r.image_url) continue;
      const list = map.get(r._parent_id) ?? [];
      list.push({ url: r.image_url, alt: r.alt });
      map.set(r._parent_id, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

function rowToProduct(
  row: Row,
  cmsVariants: ProductVariant[] | undefined,
  cmsImages: { url: string; alt: string | null }[] | undefined
): StorefrontProduct {
  // Prefer CMS-uploaded images; fall back to URL-based fields used by
  // the joodlife.com seed.
  const uploadedHero = cmsImages?.[0]?.url ?? null;
  const uploadedGallery = cmsImages?.map((i) => i.url) ?? [];
  const galleryFromUrls = Array.isArray(row.gallery_image_urls)
    ? (row.gallery_image_urls as string[])
    : [];

  // Prefer CMS-managed variants array; fall back to legacy variants_json.
  const variants =
    cmsVariants && cmsVariants.length > 0
      ? cmsVariants
      : Array.isArray(row.variants_json)
        ? (row.variants_json as ProductVariant[])
        : [];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    tagline: row.tagline,
    cardCopy: row.card_copy,
    description: row.description,
    category: row.category,
    fromPrice: row.from_price !== null ? Number(row.from_price) : null,
    comparePrice:
      row.compare_price !== null ? Number(row.compare_price) : null,
    subscriptionPrice:
      row.subscription_price !== null ? Number(row.subscription_price) : null,
    displayOrder: row.display_order,
    footerColor: row.footer_color,
    heroImageUrl: uploadedHero ?? row.hero_image_url,
    galleryImageUrls:
      uploadedGallery.length > 0 ? uploadedGallery : galleryFromUrls,
    variants,
    ratingValue: row.rating_value !== null ? Number(row.rating_value) : null,
    ratingCount: row.rating_count,
    badge: row.badge,
    isActive: row.is_active,
  };
}

export async function listStorefrontProducts(): Promise<StorefrontProduct[]> {
  try {
    const rows = await rawQuery<Row>(
      `SELECT ${SELECT_COLUMNS}
       FROM products
       WHERE is_active = true
       ORDER BY display_order ASC NULLS LAST, from_price ASC NULLS LAST, id ASC`
    );
    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const [variantsByProduct, imagesByProduct] = await Promise.all([
      fetchVariantsByProduct(ids),
      fetchImagesByProduct(ids),
    ]);

    return rows.map((r) =>
      rowToProduct(r, variantsByProduct.get(r.id), imagesByProduct.get(r.id))
    );
  } catch (err) {
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
      `SELECT ${SELECT_COLUMNS}
       FROM products
       WHERE slug = '${safeSlug}' AND is_active = true
       LIMIT 1`
    );
    if (!rows[0]) return null;

    const [variantsByProduct, imagesByProduct] = await Promise.all([
      fetchVariantsByProduct([rows[0].id]),
      fetchImagesByProduct([rows[0].id]),
    ]);

    return rowToProduct(
      rows[0],
      variantsByProduct.get(rows[0].id),
      imagesByProduct.get(rows[0].id)
    );
  } catch (err) {
    console.warn("[products] getStorefrontProduct failed:", err);
    return null;
  }
}
