import "server-only";

/**
 * Shopify Admin API client (REST 2024-10).
 *
 * Used to import blog articles from a merchant's existing Shopify
 * store into our Payload `posts` collection. Read-only — we never
 * write back to Shopify.
 *
 * Required env:
 *   SHOPIFY_STORE_DOMAIN          e.g. "joodlife.myshopify.com"
 *                                  (no protocol, no trailing slash)
 *   SHOPIFY_ADMIN_ACCESS_TOKEN    Custom App admin token, prefixed `shpat_`
 *
 * Required Shopify scope: `read_content` (covers blogs, articles,
 * pages, comments). Set this in the custom app's Admin API integration
 * configuration in the Shopify admin.
 *
 * - All calls are gated on both env vars; missing → no-op `ok: false`.
 * - Errors are returned as `{ ok: false, status, error }` — never thrown.
 * - Pagination uses Shopify's cursor-based Link header (page_info).
 */

const API_VERSION = "2024-10";

export type ShopifyResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export type ShopifyBlog = {
  id: number;
  handle: string;
  title: string;
  commentable: string;
  feedburner: string | null;
  feedburner_location: string | null;
  created_at: string;
  updated_at: string;
  template_suffix: string | null;
  tags: string;
};

export type ShopifyArticle = {
  id: number;
  blog_id: number;
  title: string;
  handle: string;
  body_html: string | null;
  summary_html: string | null;
  author: string | null;
  user_id: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: string; // comma-separated
  template_suffix: string | null;
  image: { src: string; alt: string | null; created_at: string } | null;
};

function storeDomain(): string | null {
  const raw = process.env.SHOPIFY_STORE_DOMAIN;
  if (!raw) return null;
  // Normalise: strip protocol + trailing slash
  return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function token(): string | null {
  return process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? null;
}

export function isShopifyEnabled(): boolean {
  return !!storeDomain() && !!token();
}

async function shopifyFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<ShopifyResult<T> & { linkHeader?: string | null }> {
  const dom = storeDomain();
  const t = token();
  if (!dom || !t) {
    return {
      ok: false,
      status: 0,
      error:
        "SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN is not set in env",
    };
  }
  const url = `https://${dom}/admin/api/${API_VERSION}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "X-Shopify-Access-Token": t,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const linkHeader = res.headers.get("link");

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const errMsg =
      (json as { errors?: unknown })?.errors !== undefined
        ? typeof (json as { errors: unknown }).errors === "string"
          ? (json as { errors: string }).errors
          : JSON.stringify((json as { errors: unknown }).errors)
        : `HTTP ${res.status}`;
    return { ok: false, status: res.status, error: errMsg, linkHeader };
  }

  return { ok: true, data: json as T, linkHeader };
}

/**
 * Parse Shopify's REST `Link` header to extract the next-page cursor.
 *
 * Format: `<https://...?page_info=abc&limit=50>; rel="next"`
 * (a previous-page link may also be present with rel="previous").
 */
export function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",").map((s) => s.trim());
  for (const p of parts) {
    const m = p.match(/<([^>]+)>;\s*rel="next"/i);
    if (m) {
      try {
        const u = new URL(m[1]);
        return u.searchParams.get("page_info");
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * List all blogs in the store. Most stores have one blog called
 * "News" / "Blog" — but some have multiple (e.g. "News" + "Recipes").
 */
export async function listBlogs(): Promise<ShopifyResult<ShopifyBlog[]>> {
  const res = await shopifyFetch<{ blogs: ShopifyBlog[] }>(
    "/blogs.json?limit=250"
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data.blogs };
}

/**
 * Page through articles for a single blog. Pass the previous call's
 * `nextPageInfo` to fetch the next page; the final page returns
 * `nextPageInfo: null`.
 */
export async function listArticles(
  blogId: number,
  opts: { pageInfo?: string; limit?: number } = {}
): Promise<
  ShopifyResult<{ articles: ShopifyArticle[]; nextPageInfo: string | null }>
> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 250);
  // Shopify forbids passing other filters together with page_info, so
  // when paginating we send ONLY page_info + limit.
  const qs = opts.pageInfo
    ? `?limit=${limit}&page_info=${encodeURIComponent(opts.pageInfo)}`
    : `?limit=${limit}`;
  const res = await shopifyFetch<{ articles: ShopifyArticle[] }>(
    `/blogs/${blogId}/articles.json${qs}`
  );
  if (!res.ok) return res;
  const next = parseNextPageInfo(res.linkHeader ?? null);
  return {
    ok: true,
    data: { articles: res.data.articles, nextPageInfo: next },
  };
}

/**
 * Strip script/style/event-handler attributes from imported HTML.
 * Shopify's article body is normally clean, but we don't want to
 * trust it blindly — defence in depth.
 */
export function sanitiseShopifyHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

/**
 * Strip all HTML tags (used to derive a plain-text excerpt from
 * Shopify's `summary_html`).
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
