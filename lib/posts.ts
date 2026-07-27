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
       COALESCE(p.author_name, u.name) AS author_name`;

const LIST_FROM = `FROM posts p
       LEFT JOIN media m ON m.id = p.hero_image_id
       LEFT JOIN users u ON u.id = p.author_id`;

export type ListOptions = {
  limit?: number;
  offset?: number;
  category?: string | null;
  /** Exclude these post IDs (used by related-posts query). */
  excludeIds?: number[];
};

export type PaginatedPosts = {
  posts: StorefrontPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * List published posts in reverse chronological order.
 * Convenience wrapper for callers that don't need pagination metadata.
 */
export async function listPublishedPosts(
  opts: ListOptions = {}
): Promise<StorefrontPost[]> {
  const result = await listPublishedPostsPaginated({ ...opts, limit: opts.limit ?? 100 });
  return result.posts;
}

/**
 * Paginated, optionally category-filtered list of published posts.
 * Used by /blogs (list page) — returns posts + counts so the page can
 * render numbered pagination.
 */
export async function listPublishedPostsPaginated(
  opts: ListOptions = {}
): Promise<PaginatedPosts> {
  const pageSize = Math.min(Math.max(opts.limit ?? 12, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);
  const category = opts.category?.trim() || null;
  const excludeIds = (opts.excludeIds ?? []).filter((n) => Number.isInteger(n));

  const whereClauses: string[] = [`p.status = 'published'`];
  if (category) {
    whereClauses.push(`p.category = '${category.replace(/'/g, "''")}'`);
  }
  if (excludeIds.length > 0) {
    whereClauses.push(`p.id NOT IN (${excludeIds.join(",")})`);
  }
  const where = `WHERE ${whereClauses.join(" AND ")}`;

  let rows: ListRow[];
  let total = 0;
  try {
    rows = await rawQuery<ListRow>(
      `SELECT ${LIST_SELECT}
       ${LIST_FROM}
       ${where}
       ORDER BY COALESCE(p.published_at, p.created_at) DESC
       LIMIT ${pageSize} OFFSET ${offset}`
    );
    const totalRows = await rawQuery<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM posts p ${where}`
    );
    total = totalRows[0]?.count ? Number(totalRows[0].count) : 0;
  } catch {
    // Table might not exist yet on a fresh deploy.
    return { posts: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }

  const tags = await fetchTagsByPost(rows.map((r) => r.id));
  return {
    posts: rows.map((r) => rowToList(r, tags.get(r.id) ?? [])),
    total,
    page: Math.floor(offset / pageSize) + 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Counts of published posts grouped by category — used to render the
 * category-filter pill row at the top of /blogs.
 */
export async function getCategoryCounts(): Promise<
  Array<{ slug: string; label: string; count: number }>
> {
  let rows: Array<{ category: string | null; count: string }>;
  try {
    rows = await rawQuery<{ category: string | null; count: string }>(
      `SELECT category, COUNT(*)::text AS count
       FROM posts
       WHERE status = 'published' AND category IS NOT NULL
       GROUP BY category
       ORDER BY COUNT(*) DESC`
    );
  } catch {
    return [];
  }
  return rows.map((r) => ({
    slug: r.category ?? "other",
    label: categoryLabel(r.category ?? "other"),
    count: Number(r.count),
  }));
}

/**
 * Fetch up to N other published posts in the same category as `post`,
 * excluding `post` itself. Falls back to "any published post" if the
 * category-bound query returns fewer than `limit` rows.
 */
export async function getRelatedPosts(
  post: StorefrontPost,
  limit = 3
): Promise<StorefrontPost[]> {
  const sameCategory = await listPublishedPostsPaginated({
    limit,
    category: post.category,
    excludeIds: [post.id],
  });
  if (sameCategory.posts.length >= limit) return sameCategory.posts;
  // Top up from the global feed if the category is sparse.
  const filler = await listPublishedPostsPaginated({
    limit: limit - sameCategory.posts.length,
    excludeIds: [post.id, ...sameCategory.posts.map((p) => p.id)],
  });
  return [...sameCategory.posts, ...filler.posts];
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
