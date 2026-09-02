/**
 * UK address autocomplete — GET /api/address-lookup?q=<text>
 *
 * Proxies OpenStreetMap's Nominatim search so the checkout Address field can
 * offer real address suggestions without a paid API key. Restricted to Great
 * Britain (countrycodes=gb) so only UK addresses are ever returned.
 *
 * We proxy server-side to set a proper User-Agent (Nominatim's usage policy
 * requires one) and to keep the request shape stable for the client.
 */
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  postcode?: string;
  country_code?: string;
};

type NominatimResult = {
  display_name: string;
  address?: NominatimAddress;
};

export type AddressSuggestion = {
  label: string; // full readable line for the dropdown
  line1: string; // house number + road
  city: string;
  postcode: string;
};

export async function GET(req: NextRequest) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 3) {
    return NextResponse.json({ ok: true, results: [] });
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2` +
      `&addressdetails=1&limit=6&countrycodes=gb&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "JoodLife-Checkout/1.0 (https://www.joodlife.com)",
        "Accept-Language": "en-GB",
      },
      // Nominatim is shared infra — cache identical queries briefly.
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ ok: true, results: [] });
    }
    const data = (await res.json()) as NominatimResult[];
    const results: AddressSuggestion[] = data
      .filter((r) => r.address?.country_code === "gb")
      .map((r) => {
        const a = r.address ?? {};
        const road = a.road || a.pedestrian || a.neighbourhood || "";
        const line1 = [a.house_number, road].filter(Boolean).join(" ").trim();
        const city =
          a.city ||
          a.town ||
          a.village ||
          a.suburb ||
          a.city_district ||
          a.county ||
          "";
        return {
          label: r.display_name,
          line1: line1 || road,
          city,
          postcode: a.postcode ?? "",
        };
      })
      // Keep only suggestions that have at least a street or city to fill.
      .filter((s) => s.line1 || s.city);

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: true, results: [] });
  }
}
