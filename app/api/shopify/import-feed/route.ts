/**
 * POST /api/shopify/import-feed
 * Admin-only. Imports a single page of a Shopify blog Atom feed
 * (no Shopify auth needed — the feed is public). Idempotent: keys
 * on shopify_article_id derived from the feed entry's atom <id>.
 *
 *   Body: { feedUrl: string, status?: "draft" | "published" }
 *   Returns: { ok, fetched, inserted, updated, skipped, errors,
 *             nextFeedUrl, feedTitle }
 *
 * Re-call with the returned `nextFeedUrl` to fetch the next page.
 *
 * Mapping (mirrors /api/shopify/import-posts):
 *   feed.title              → posts.title
 *   feed.slug (from URL)    → posts.slug
 *   feed.excerpt            → posts.excerpt
 *   feed.contentHtml        → posts.body_html (sanitised)
 *   feed.heroImageUrl       → posts.hero_image_url
 *   feed.tags               → posts_tags rows
 *   feed.publishedAt        → posts.published_at
 *   feed.shopifyArticleId   → posts.shopify_article_id (idempotency key)
 */
import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import {
  fetchFeedPage,
  sanitiseImportedHtml,
  type FeedEntry,
} from "@/lib/shopifyFeed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle;
  if (!drizzle?.execute) {
    throw new Error("payload.db.drizzle.execute unavailable");
  }
  const { sql: drizzleSql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql: drizzleSql };
}

function esc(s: string | null | undefined) {
  return s === null || s === undefined
    ? "NULL"
    : "'" + String(s).replace(/'/g, "''") + "'";
}

function escTs(iso: string | null | undefined) {
  if (!iso) return "NULL";
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

export async function POST(req: NextRequest) {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  let body: { feedUrl?: string; status?: "draft" | "published" };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const feedUrl = (body.feedUrl ?? "").trim();
  if (!feedUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing feedUrl" },
      { status: 400 }
    );
  }

  const overrideStatus =
    body.status === "draft" || body.status === "published"
      ? body.status
      : null;

  const fetched = await fetchFeedPage(feedUrl);
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

  for (const entry of fetched.data.entries) {
    try {
      const result = await upsertEntry(drizzle, sql, entry, overrideStatus);
      if (result === "inserted") inserted++;
      else if (result === "updated") updated++;
      else skipped++;
    } catch (err) {
      errors.push(
        `${entry.slug || entry.title}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    feedTitle: fetched.data.feedTitle,
    fetched: fetched.data.entries.length,
    inserted,
    updated,
    skipped,
    errors: errors.slice(0, 20),
    nextFeedUrl: fetched.data.nextPageUrl,
  });
}

async function upsertEntry(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  entry: FeedEntry,
  overrideStatus: "draft" | "published" | null
): Promise<"inserted" | "updated" | "skipped"> {
  if (!entry.title || !entry.slug) return "skipped";

  const cleanHtml = entry.contentHtml
    ? sanitiseImportedHtml(entry.contentHtml)
    : null;
  const status =
    overrideStatus ?? (entry.publishedAt ? "published" : "draft");
  const publishedAt = entry.publishedAt ?? null;

  // 1) Try UPDATE by shopify_article_id (covers re-imports + cross-import
  //    compatibility with the Admin-API path which uses the same column).
  if (entry.shopifyArticleId) {
    const updateStmt = `
      UPDATE "posts"
      SET title          = ${esc(entry.title)},
          slug           = ${esc(entry.slug)},
          excerpt        = ${esc(entry.excerpt)},
          body_html      = ${esc(cleanHtml)},
          hero_image_url = ${esc(entry.heroImageUrl)},
          category       = COALESCE(category, 'weight-loss'),
          status         = ${esc(status)},
          published_at   = ${escTs(publishedAt)},
          updated_at     = now()
      WHERE shopify_article_id = ${esc(entry.shopifyArticleId)}
      RETURNING id;
    `;
    const updateRes = await drizzle.execute(sql.raw(updateStmt));
    const rows = readRows(updateRes);
    if (rows.length > 0) {
      await replaceTags(drizzle, sql, rows[0].id, entry.tags);
      return "updated";
    }
  }

  // 2) Insert a new row. ON CONFLICT(slug) DO NOTHING avoids clobbering
  //    a manually-created post with the same slug.
  const insertStmt = `
    INSERT INTO "posts"
      (title, slug, excerpt, body_html, hero_image_url, category, status,
       published_at, shopify_article_id, updated_at, created_at)
    VALUES
      (${esc(entry.title)}, ${esc(entry.slug)}, ${esc(entry.excerpt)},
       ${esc(cleanHtml)}, ${esc(entry.heroImageUrl)}, 'weight-loss',
       ${esc(status)}, ${escTs(publishedAt)},
       ${esc(entry.shopifyArticleId)}, now(), now())
    ON CONFLICT (slug) DO NOTHING
    RETURNING id;
  `;
  const insertRes = await drizzle.execute(sql.raw(insertStmt));
  const insRows = readRows(insertRes);
  if (insRows.length > 0) {
    await replaceTags(drizzle, sql, insRows[0].id, entry.tags);
    return "inserted";
  }

  return "skipped";
}

async function replaceTags(
  drizzle: DrizzleLike,
  sql: SqlRaw,
  postId: number,
  tags: string[]
) {
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
    /* tag table may not exist on a very fresh deploy — non-fatal */
  }
}
