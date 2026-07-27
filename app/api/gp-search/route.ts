/**
 * GET /api/gp-search?q=<name> — GP practice autocomplete for the consultation.
 *
 * Same-origin proxy: the browser used to call jood-proxy.vercel.app directly,
 * which the site's CSP (connect-src) blocks — so the suggestions never
 * appeared. The server fetches instead (CSP doesn't apply server-side), and
 * falls back to the official NHS ODS directory if the proxy is down.
 *
 * Response: [{ name, address, city, postcode }]
 */
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Gp = { name: string; address: string; city: string; postcode: string };

const PROXY = "https://jood-proxy.vercel.app/api/gp-search";
const NHS_ODS = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations";

async function fetchJson(url: string, ms: number): Promise<unknown> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  // 1) The existing Jood proxy (same data source the Shopify flow used).
  try {
    const data = await fetchJson(`${PROXY}?q=${encodeURIComponent(q)}`, 8000);
    if (Array.isArray(data)) {
      const out: Gp[] = data
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
        .slice(0, 12)
        .map((r) => ({
          name: String(r.name ?? ""),
          address: String(r.address ?? ""),
          city: String(r.city ?? ""),
          postcode: String(r.postcode ?? ""),
        }))
        .filter((r) => r.name);
      return NextResponse.json(out, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
      });
    }
  } catch {
    /* fall through to NHS ODS */
  }

  // 2) Fallback: official NHS ODS directory (GP practices = RO177).
  try {
    const data = (await fetchJson(
      `${NHS_ODS}?Name=${encodeURIComponent(q)}&PrimaryRoleId=RO177&Status=Active&Limit=12&_format=json`,
      8000,
    )) as { Organisations?: Array<{ Name?: string; PostCode?: string }> };
    const out: Gp[] = (data.Organisations ?? [])
      .map((o) => ({
        name: String(o.Name ?? ""),
        address: "",
        city: "",
        postcode: String(o.PostCode ?? ""),
      }))
      .filter((r) => r.name);
    return NextResponse.json(out, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
