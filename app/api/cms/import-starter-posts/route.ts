import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { canAccessCms } from "@/lib/cmsSections";
import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";

/**
 * Copy the curated starter articles (lib/journalSeed) into the posts
 * collection so they become real, editable rows.
 *
 * /blogs falls back to that starter content whenever the database has no
 * published posts, which is why the Library can look full while the CMS list
 * is empty. Importing turns the same twelve articles into rows the editor can
 * open — the page keeps rendering exactly what it renders today, because the
 * content is identical; only its source changes.
 *
 * Imported as PUBLISHED on purpose. Importing them as drafts would leave the
 * fallback in charge until the first one was published, at which point the
 * other eleven would vanish from /blogs.
 *
 * Idempotent: a slug that already exists is skipped, never overwritten, so
 * running this twice — or running it where real posts already exist — cannot
 * duplicate or clobber anything.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  // Same gate as the CMS itself, plus admin-only: this writes content.
  if (user.role !== "admin" || !canAccessCms(user.role, user.permissions)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  try {
    const payload = await getPayloadInstance();
    const { journalSeedPosts } = await import("@/lib/journalSeed");

    const created: string[] = [];
    const skipped: string[] = [];

    for (const seed of journalSeedPosts) {
      const existing = await payload.find({
        collection: "posts",
        where: { slug: { equals: seed.slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      if (existing.totalDocs > 0) {
        skipped.push(seed.slug);
        continue;
      }

      await payload.create({
        collection: "posts",
        overrideAccess: true,
        data: {
          title: seed.title,
          slug: seed.slug,
          excerpt: seed.excerpt ?? null,
          bodyHtml: seed.bodyHtml ?? null,
          category: seed.category ?? "other",
          tags: (seed.tags ?? []).map((tag) => ({ tag })),
          authorName: seed.authorName ?? null,
          status: "published",
          publishedAt: seed.publishedAt ?? new Date().toISOString(),
          // The starter articles reference images by path rather than by a
          // media record, so keep the path and leave the relationship empty.
          heroImageUrl: seed.heroImageUrl ?? null,
        } as never,
      });
      created.push(seed.slug);
    }

    return NextResponse.json({ created: created.length, skipped: skipped.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 },
    );
  }
}
