import "server-only";

/**
 * Shopify blog Atom-feed importer (no auth, no custom app required).
 *
 * Every Shopify storefront exposes a public Atom feed at
 *   /blogs/<handle>.atom
 * containing every published article: title, full HTML body, hero
 * image, tags, author, and published date. We use this as a
 * frictionless alternative to the Admin API — the merchant just
 * gives us a public URL.
 *
 * Pagination: Shopify's feed includes
 *   <link rel="next" href="...?page=2"/>
 * when more pages exist. We follow it until exhausted.
 *
 * What we DON'T get from the feed (vs the Admin API):
 *   - Drafts / unpublished articles
 *   - Internal Shopify article IDs (we derive a stable surrogate
 *     from the atom <id> when possible)
 *   - Per-article custom metafields
 *
 * For published-only blogs that's exactly what we want — the
 * trade-off is we don't need a token at all.
 */

export type FeedEntry = {
  /** Atom <id>, e.g. "tag:store.myshopify.com,2008-08-08:Article/12345" */
  atomId: string | null;
  /** Numeric Shopify article ID extracted from atomId, or fallback hash. */
  shopifyArticleId: string | null;
  title: string;
  /** Slug derived from the article URL's last path segment. */
  slug: string;
  url: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  author: string | null;
  tags: string[];
  /** Plain-text excerpt (from <summary> or first paragraph of content). */
  excerpt: string | null;
  /** Full HTML body. */
  contentHtml: string | null;
  /** First <img src> in the content, used as the article hero. */
  heroImageUrl: string | null;
};

export type FeedPage = {
  feedTitle: string | null;
  entries: FeedEntry[];
  nextPageUrl: string | null;
};

export type FeedResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Normalise a user-typed value into a candidate feed URL.
 * Accepts:
 *   "joodlife.com"
 *   "yourstore.myshopify.com"
 *   "https://yourstore.com/blogs/news"
 *   "https://yourstore.com/blogs/news.atom"
 *   "https://yourstore.com/blogs/news.atom?page=2"
 */
export function buildFeedUrl(input: string, blogHandle = "news"): string {
  let s = input.trim();
  if (!s) return "";
  // Bare domain → assume https + default blog handle
  if (!/^https?:\/\//i.test(s) && !s.includes("/")) {
    return `https://${s}/blogs/${blogHandle}.atom`;
  }
  // Add protocol if missing
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  // Strip trailing slash
  s = s.replace(/\/$/, "");
  // Ensure .atom suffix on /blogs/<handle> URLs (without one)
  const u = new URL(s);
  if (!u.pathname.endsWith(".atom")) {
    if (/\/blogs\/[^/]+$/.test(u.pathname)) {
      u.pathname = u.pathname + ".atom";
    } else if (u.pathname === "" || u.pathname === "/") {
      u.pathname = `/blogs/${blogHandle}.atom`;
    }
  }
  return u.toString();
}

/**
 * Fetch and parse a single page of a Shopify blog Atom feed.
 */
export async function fetchFeedPage(
  feedUrl: string
): Promise<FeedResult<FeedPage>> {
  let res: Response;
  try {
    res = await fetch(feedUrl, {
      headers: { Accept: "application/atom+xml, application/xml, text/xml" },
      cache: "no-store",
      redirect: "follow",
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: `HTTP ${res.status} ${res.statusText} from ${feedUrl}`,
    };
  }
  const xml = await res.text();
  // Shopify always returns an Atom feed for valid /blogs/<handle>.atom
  // URLs. If the user gave us an HTML page (wrong URL, store down, etc.)
  // we'll see <html> first — bail with a clear error.
  if (/^\s*<!doctype\s+html/i.test(xml) || /^\s*<html/i.test(xml)) {
    return {
      ok: false,
      status: 200,
      error:
        "URL returned HTML, not an Atom feed. Check the blog handle (try /blogs/news.atom or /blogs/blog.atom).",
    };
  }
  const parsed = parseAtomFeed(xml);
  return { ok: true, data: parsed };
}

/* ------------------------------------------------------------------ */
/* Atom-feed parser (purpose-built; no third-party XML dep)            */
/* ------------------------------------------------------------------ */

function parseAtomFeed(xml: string): FeedPage {
  // Strip the <feed> wrapper's text content from later element
  // matchers by working entry-by-entry.
  const feedTitle = unescapeXml(
    captureOne(stripEntries(xml), /<title[^>]*>([\s\S]*?)<\/title>/) ?? ""
  ).trim() || null;

  const nextPageUrl = extractAttr(
    matchOne(xml, /<link[^>]*\brel=["']next["'][^>]*\/?>/i) ?? "",
    "href"
  );

  const entries: FeedEntry[] = [];
  const entryRe = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    entries.push(parseEntry(m[1]));
  }
  return { feedTitle, entries, nextPageUrl };
}

function stripEntries(xml: string): string {
  return xml.replace(/<entry\b[\s\S]*?<\/entry>/gi, "");
}

function parseEntry(block: string): FeedEntry {
  const title = unescapeXml(
    (captureOne(block, /<title[^>]*>([\s\S]*?)<\/title>/) ?? "").trim()
  );
  const atomId =
    (captureOne(block, /<id[^>]*>([\s\S]*?)<\/id>/) ?? "").trim() || null;
  const publishedAt =
    (captureOne(block, /<published[^>]*>([\s\S]*?)<\/published>/) ?? "")
      .trim() || null;
  const updatedAt =
    (captureOne(block, /<updated[^>]*>([\s\S]*?)<\/updated>/) ?? "").trim() ||
    null;

  // Article URL — prefer rel="alternate", fall back to first <link>.
  const altLink =
    matchOne(block, /<link[^>]*\brel=["']alternate["'][^>]*\/?>/i) ??
    matchOne(block, /<link\b[^>]*\/?>/i);
  const url = altLink ? extractAttr(altLink, "href") : null;
  const slug = url ? deriveSlugFromUrl(url) : slugify(title);

  // Author — Atom puts it inside <author><name>...</name></author>.
  const author =
    unescapeXml(
      (captureOne(
        block,
        /<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>[\s\S]*?<\/author>/
      ) ?? "").trim()
    ) || null;

  // Tags — every <category term="..."/> on the entry.
  const tags: string[] = [];
  const tagRe = /<category\b[^>]*\bterm=["']([^"']+)["'][^>]*\/?>/gi;
  let t: RegExpExecArray | null;
  while ((t = tagRe.exec(block)) !== null) tags.push(unescapeXml(t[1]));

  // Body HTML — summary + content. Prefer content; fall back to summary.
  const summaryHtml = extractMarkupTag(block, "summary");
  const contentHtml = extractMarkupTag(block, "content") ?? summaryHtml;

  const excerpt = summaryHtml
    ? plainText(summaryHtml).slice(0, 500)
    : contentHtml
      ? plainText(contentHtml).slice(0, 280)
      : null;

  const heroImageUrl = contentHtml ? extractFirstImage(contentHtml) : null;

  // Stable surrogate ID — derive from atom <id> if possible.
  let shopifyArticleId: string | null = null;
  if (atomId) {
    const articleMatch = atomId.match(/Article\/(\d+)/);
    if (articleMatch) shopifyArticleId = articleMatch[1];
  }
  // Fallback: hash the URL so re-imports are still idempotent.
  if (!shopifyArticleId && url) {
    shopifyArticleId = `atom:${djb2Hash(url)}`;
  }

  return {
    atomId,
    shopifyArticleId,
    title,
    slug,
    url,
    publishedAt,
    updatedAt,
    author,
    tags,
    excerpt,
    contentHtml,
    heroImageUrl,
  };
}

/**
 * Pull markup out of a tag that may use either CDATA or escaped HTML.
 *   <content type="html"><![CDATA[<p>...</p>]]></content>
 *   <content type="html">&lt;p&gt;...&lt;/p&gt;</content>
 */
function extractMarkupTag(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  if (!m) return null;
  const inner = m[1];
  const cd = inner.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  if (cd) return cd[1];
  return unescapeXml(inner);
}

/**
 * Locate the first <img src="..."> in HTML. Used for hero image.
 */
function extractFirstImage(html: string): string | null {
  const m = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveSlugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    return slugify(decodeURIComponent(last));
  } catch {
    return "";
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function djb2Hash(s: string): string {
  // Tiny non-crypto hash so long URLs become a short stable surrogate.
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  // Convert signed 32-bit to unsigned hex
  return (h >>> 0).toString(16);
}

function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function captureOne(s: string, re: RegExp): string | null {
  const m = s.match(re);
  return m && m[1] !== undefined ? m[1] : null;
}

function matchOne(s: string, re: RegExp): string | null {
  const m = s.match(re);
  return m ? m[0] : null;
}

function extractAttr(tag: string, attr: string): string | null {
  if (!tag) return null;
  const re = new RegExp(`\\b${attr}=["']([^"']+)["']`, "i");
  const m = tag.match(re);
  return m ? m[1] : null;
}

/**
 * Strip dangerous tags / event handlers from imported HTML.
 * Same policy as lib/shopify.ts so both import paths render safely.
 */
export function sanitiseImportedHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}
