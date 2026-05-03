import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Server-side blog data layer. Mirrors the raw-SQL pattern used by
 * lib/products.ts so we sidestep Payload's join-table requirements
 * and keep the storefront fast (single query per page).
 *
 * Tables (created by Payload via `push: true` in payload.config.ts):
 *   posts                — main row
 *   posts_tags           — array field rows (label per row)
 */

export type StorefrontPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  category: string | null;
  publishedAt: string | null;
  authorName: string | null;
  tags: string[];
};

export type FullPost = StorefrontPost & {
  content: unknown; // Lexical JSON tree, rendered client-side
  bodyHtml: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

type ListRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  category: string | null;
  published_at: string | null;
  author_name: string | null;
};

type FullRow = ListRow & {
  content: unknown;
  body_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

type TagRow = { _parent_id: number; tag: string | null };

async function rawQuery<T>(sql: string): Promise<T[]> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
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

async function fetchTagsByPost(
  postIds: number[]
): Promise<Map<number, string[]>> {
  if (postIds.length === 0) return new Map();
  try {
    const rows = await rawQuery<TagRow>(
      `SELECT _parent_id, tag
       FROM posts_tags
       WHERE _parent_id IN (${postIds.join(",")})
       ORDER BY _parent_id ASC, _order ASC`
    );
    const map = new Map<number, string[]>();
    for (const r of rows) {
      if (!r.tag) continue;
      const list = map.get(r._parent_id) ?? [];
      list.push(r.tag);
      map.set(r._parent_id, list);
    }
    return map;
  } catch {
    return new Map();
  }
}

const LIST_SELECT = `p.id, p.title, p.slug, p.excerpt,
       COALESCE(m.url, p.hero_image_url) AS hero_image_url,
       COALESCE(m.alt, p.title)          AS hero_image_alt,
       p.category, p.published_at,
       u.name AS author_name`;

const LIST_FROM = `FROM posts p
       LEFT JOIN media m ON m.id = p.hero_image_id
       LEFT JOIN users u ON u.id = p.author_id`;

/**
 * List published posts in reverse chronological order. Used by /blog.
 */
export async function listPublishedPosts(
  opts: { limit?: number } = {}
): Promise<StorefrontPost[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 100);
  let rows: ListRow[];
  try {
    rows = await rawQuery<ListRow>(
      `SELECT ${LIST_SELECT}
       ${LIST_FROM}
       WHERE p.status = 'published'
       ORDER BY COALESCE(p.published_at, p.created_at) DESC
       LIMIT ${limit}`
    );
  } catch {
    // Table might not exist yet on a fresh deploy if `push: true` hasn't
    // had a chance to sync. Fall back to empty list rather than crashing.
    return [];
  }

  const tags = await fetchTagsByPost(rows.map((r) => r.id));
  return rows.map((r) => rowToList(r, tags.get(r.id) ?? []));
}

/**
 * Fetch a single published post by slug. Returns null if not found
 * or still in draft.
 */
export async function getPostBySlug(slug: string): Promise<FullPost | null> {
  if (!slug) return null;
  const safe = slug.replace(/'/g, "''");
  let rows: FullRow[];
  try {
    rows = await rawQuery<FullRow>(
      `SELECT ${LIST_SELECT}, p.content, p.body_html, p.meta_title, p.meta_description
       ${LIST_FROM}
       WHERE p.status = 'published' AND p.slug = '${safe}'
       LIMIT 1`
    );
  } catch {
    return null;
  }
  const row = rows[0];
  if (!row) return null;
  const tags = await fetchTagsByPost([row.id]);
  const list = rowToList(row, tags.get(row.id) ?? []);
  return {
    ...list,
    content: row.content,
    bodyHtml: row.body_html,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
  };
}

function rowToList(row: ListRow, tags: string[]): StorefrontPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    heroImageUrl: row.hero_image_url,
    heroImageAlt: row.hero_image_alt,
    category: row.category,
    publishedAt: row.published_at,
    authorName: row.author_name,
    tags,
  };
}

export function formatPublishedDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function categoryLabel(slug: string | null): string {
  if (!slug) return "";
  const map: Record<string, string> = {
    "weight-loss": "Weight loss",
    nutrition: "Nutrition",
    lifestyle: "Lifestyle",
    science: "Science",
    "company-news": "Company news",
    other: "Other",
  };
  return map[slug] ?? slug.replace(/-/g, " ");
}
