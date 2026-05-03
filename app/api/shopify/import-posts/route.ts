/**
 * POST /api/shopify/import-posts
 * Admin-only. Pulls a page of articles from a Shopify blog and upserts
 * them into our `posts` table. Idempotent — keyed on shopify_article_id.
 *
 *   Body: { blogId: number, pageInfo?: string, limit?: number, status?: "draft" | "published" }
 *   Returns: { ok, fetched, inserted, updated, skipped, errors, nextPageInfo }
 *
 * Re-call with the returned `nextPageInfo` to fetch the next page.
 *
 * Mapping:
 *   shopify.title         → posts.title
 *   shopify.handle        → posts.slug (lowercased, hyphenated)
 *   shopify.summary_html  → posts.excerpt (HTML stripped)
 *   shopify.body_html     → posts.body_html (sanitised)
 *   shopify.image.src     → posts.hero_image_url
 *   shopify.author        → posts.metaTitle? — no, kept on author_id when matchable
 *   shopify.tags          → posts.tags (comma split)
 *   shopify.published_at  → posts.published_at
 *   shopify.id            → posts.shopify_article_id (idempotency key)
 *
 * Status default: "published" if the article had a published_at on Shopify,
 * else "draft". Override per-call via body.status.
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import {
  htmlToText,
  isShopifyEnabled,
  listArticles,
  sanitiseShopifyHtml,
  type ShopifyArticle,
} from "@/lib/shopify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{
  drizzle: DrizzleLike;
  sql: SqlRaw;
}> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as {
    sql: SqlRaw;
  };
  return { drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined
    ? "NULL"
    : "'" + String(s).replace(/'/g, "''") + "'";
}

function escTs(iso: string | null | undefined) {
  if (!iso) return "NULL";
  // Pass through as ISO; postgres parses both ISO 8601 timestamps cleanly.
  return "'" + iso.replace(/'/g, "''") + "'";
}

function readRows(result: unknown): Array<{ id: number }> {
  if (Array.isArray(result)) return result as Array<{ id: number }>;
  if (result && typeof result === "object" && "rows" in result) {
    const r = (result as { rows?: Array<{ id: number }> }).rows;
    return Array.isArray(r) ? r : [];
  }
  return [];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }
  if (!isShopifyEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN not set in env",
      },
      { status: 400 }
    );
  }

  let body: {
    blogId?: number;
    pageInfo?: string;
    limit?: number;
    status?: "draft" | "published";
  };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const blogId = Number(body.blogId);
  if (!Number.isInteger(blogId) || blogId <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Provide blogId (number). Find it via GET /api/shopify/test.",
      },
      { status: 400 }
    );
  }
  const limit = Math.min(Math.max(Number(body.limit ?? 50), 1), 250);
  const overrideStatus =
    body.status === "draft" || body.status === "published"
      ? body.status
      : null;

  const fetched = await listArticles(blogId, {
    pageInfo: body.pageInfo,
    limit,
  });
  if (!fetched.ok) {
    return NextResponse.json(
      { ok: false, status: fetched.status, error: fetched.error },
      { status: 502 }
    );
  }

  let drizzle: DrizzleLike;
  let sql: SqlRaw;
  try {
    const d = await getDrizzle();
    drizzle = d.drizzle;
    sql = d.sql;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "DB init failed", detail: String(err) },
      { status: 500 }
    );
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const a of fetched.data.articles) {
    try {
      const result = await upsertArticleCounted(
        drizzle,
        sql,
        a,
        overrideStatus
      );
      if (result === "inserted") inserted++;
      else if (result === "updated") updated++;
      else skipped++;
    } catch (err) {
      errors.push(
        `${a.handle}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: fetched.data.articles.length,
    inserted,
    updated,
    skipped,
    errors: errors.slice(0, 20),
    nextPageInfo: fetched.data.nextPageInfo,
  });
}

/**
 * Upsert one article. Matches existing rows by shopify_article_id.
 * Returns "inserted" | "updated" | "skipped".
 */
async function upsertArticleCounted(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  a: ShopifyArticle,
  overrideStatus: "draft" | "published" | null
): Promise<"inserted" | "updated" | "skipped"> {
  if (!a.title || !a.handle) return "skipped";

  const slug = slugify(a.handle);
  const excerpt = htmlToText(a.summary_html).slice(0, 600) || null;
  const cleanHtml = a.body_html ? sanitiseShopifyHtml(a.body_html) : null;
  const heroUrl = a.image?.src ?? null;
  const status =
    overrideStatus ?? (a.published_at ? "published" : "draft");
  const publishedAt = a.published_at ?? null;
  const shopifyId = String(a.id);
  const tags = splitTags(a.tags);

  // 1) Try UPDATE by shopify_article_id. If matched, also reset tags.
  const updateStmt = `
    UPDATE "posts"
    SET title          = ${esc(a.title)},
        slug           = ${esc(slug)},
        excerpt        = ${esc(excerpt)},
        body_html      = ${esc(cleanHtml)},
        hero_image_url = ${esc(heroUrl)},
        category       = COALESCE(category, 'weight-loss'),
        status         = ${esc(status)},
        published_at   = ${escTs(publishedAt)},
        updated_at     = now()
    WHERE shopify_article_id = ${esc(shopifyId)}
    RETURNING id;
  `;
  const updateRes = await drizzle.execute(sql.raw(updateStmt));
  const updRows = readRows(updateRes);
  if (updRows.length > 0) {
    await replaceTags(drizzle, sql, updRows[0].id, tags);
    return "updated";
  }

  // 2) Insert a new row. Use ON CONFLICT(slug) DO NOTHING to handle the
  //    rare case where an admin manually created a post with the same
  //    slug — in that case we skip rather than overwriting their work.
  const insertStmt = `
    INSERT INTO "posts"
      (title, slug, excerpt, body_html, hero_image_url, category, status,
       published_at, shopify_article_id, updated_at, created_at)
    VALUES
      (${esc(a.title)}, ${esc(slug)}, ${esc(excerpt)}, ${esc(cleanHtml)},
       ${esc(heroUrl)}, 'weight-loss', ${esc(status)}, ${escTs(publishedAt)},
       ${esc(shopifyId)}, now(), now())
    ON CONFLICT (slug) DO NOTHING
    RETURNING id;
  `;
  const insertRes = await drizzle.execute(sql.raw(insertStmt));
  const insRows = readRows(insertRes);
  if (insRows.length > 0) {
    await replaceTags(drizzle, sql, insRows[0].id, tags);
    return "inserted";
  }

  return "skipped";
}

/**
 * Replace the `posts_tags` rows for a post with the given tags.
 * Tags table created by Payload: posts_tags(_parent_id, _order, tag, id).
 */
async function replaceTags(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  postId: number,
  tags: string[]
) {
  // Wipe existing.
  await drizzle.execute(
    sql.raw(`DELETE FROM "posts_tags" WHERE _parent_id = ${postId}`)
  );
  if (tags.length === 0) return;
  const values = tags
    .map((t, i) => `(${postId}, ${i}, ${esc(t)})`)
    .join(", ");
  try {
    await drizzle.execute(
      sql.raw(
        `INSERT INTO "posts_tags" (_parent_id, _order, tag) VALUES ${values}`
      )
    );
  } catch {
    // Older deploys may not have the table yet — non-fatal.
  }
}
