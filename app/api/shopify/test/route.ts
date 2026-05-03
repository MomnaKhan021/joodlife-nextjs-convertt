/**
 * GET /api/shopify/test
 * Admin-only sanity-check that SHOPIFY_STORE_DOMAIN and
 * SHOPIFY_ADMIN_ACCESS_TOKEN work. Lists blogs (typically just one)
 * with their article counts so the operator can pick the right ID
 * before running the importer.
 *
 *   { ok, hasConfig, blogs: [...], status, error? }
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { isShopifyEnabled, listBlogs, listArticles } from "@/lib/shopify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = await getPayloadInstance();
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user || (user as unknown as { role?: string }).role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Admin role required" },
      { status: 403 }
    );
  }

  if (!isShopifyEnabled()) {
    return NextResponse.json({
      ok: false,
      hasConfig: false,
      error:
        "SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN not set — add both in Vercel project env vars + redeploy.",
    });
  }

  const blogs = await listBlogs();
  if (!blogs.ok) {
    return NextResponse.json({
      ok: false,
      hasConfig: true,
      status: blogs.status,
      error: blogs.error,
    });
  }

  // Sample-count articles per blog (1 article each — just to confirm
  // the article endpoint works, not to actually fetch them all).
  const counts: Array<{
    id: number;
    title: string;
    handle: string;
    sampleArticleTitle: string | null;
  }> = [];
  for (const b of blogs.data) {
    const peek = await listArticles(b.id, { limit: 1 });
    counts.push({
      id: b.id,
      title: b.title,
      handle: b.handle,
      sampleArticleTitle: peek.ok ? (peek.data.articles[0]?.title ?? null) : null,
    });
  }

  return NextResponse.json({
    ok: true,
    hasConfig: true,
    blogs: counts,
  });
}
