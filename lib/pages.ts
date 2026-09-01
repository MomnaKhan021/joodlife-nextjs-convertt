import "server-only";

import { getPayloadInstance } from "@/lib/payload";

/**
 * Data access for the `pages` collection (editable site pages).
 *
 * Uses Payload's Local API rather than raw SQL: queries are parameterised
 * by Payload, so a slug from the URL can't be injected. Every lookup is
 * wrapped so a missing table (fresh database, before `ensureFullSchema`
 * has run) returns null instead of throwing a 500.
 */

export type SitePage = {
  id: string | number;
  title: string;
  slug: string;
  excerpt: string | null;
  /** Lexical rich-text JSON. */
  content: unknown;
  /** Raw HTML body — takes priority over `content` when present. */
  bodyHtml: string | null;
  heroImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  /** When set, the page redirects here instead of rendering. */
  redirectUrl: string | null;
  /** 308 instead of 307 — cached hard by browsers, so opt in deliberately. */
  redirectPermanent: boolean;
};

type RawPage = {
  id: string | number;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: unknown;
  bodyHtml?: string | null;
  heroImage?: { url?: string | null } | string | number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: string | null;
  redirectUrl?: string | null;
  redirectPermanent?: boolean | null;
};

function toSitePage(doc: RawPage): SitePage {
  const hero =
    doc.heroImage && typeof doc.heroImage === "object"
      ? (doc.heroImage.url ?? null)
      : null;
  return {
    id: doc.id,
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    excerpt: doc.excerpt ?? null,
    content: doc.content ?? null,
    bodyHtml: doc.bodyHtml ?? null,
    heroImageUrl: hero,
    metaTitle: doc.metaTitle ?? null,
    metaDescription: doc.metaDescription ?? null,
    publishedAt: doc.publishedAt ?? null,
    redirectUrl: doc.redirectUrl?.trim() ? doc.redirectUrl.trim() : null,
    redirectPermanent: Boolean(doc.redirectPermanent),
  };
}

/** A published page by slug, or null. Drafts are never returned. */
export async function getPageBySlug(slug: string): Promise<SitePage | null> {
  if (!slug) return null;
  try {
    const payload = await getPayloadInstance();
    const { docs } = await payload.find({
      collection: "pages",
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });
    const doc = docs?.[0] as RawPage | undefined;
    return doc ? toSitePage(doc) : null;
  } catch {
    // Table missing / DB unreachable — treat as "no such page".
    return null;
  }
}

/** Slugs of all published pages — used to pre-render known routes. */
export async function getPublishedPageSlugs(): Promise<string[]> {
  try {
    const payload = await getPayloadInstance();
    const { docs } = await payload.find({
      collection: "pages",
      where: { status: { equals: "published" } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    });
    return (docs as RawPage[])
      .map((d) => d.slug)
      .filter((s): s is string => Boolean(s));
  } catch {
    return [];
  }
}
