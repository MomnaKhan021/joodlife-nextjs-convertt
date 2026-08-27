import "server-only";

/**
 * Server-side UK address verification for checkout.
 *
 * The postcode field already proves the POSTCODE is real (postcodes.io), but
 * the street line was only format-checked — so a junk street with a real
 * postcode ("Ut recusandae Repud", "Mostyn CH8 9HE") sailed through and
 * produced an undeliverable order.
 *
 * Here we additionally confirm the STREET actually exists at that postcode,
 * using OpenStreetMap's Nominatim structured search (free, GB-restricted).
 *
 * Verdicts:
 *   "verified"  — postcode is real AND the street was found there.
 *   "not_found" — the lookup answered definitively and found nothing → block.
 *   "unknown"   — a lookup was unavailable (timeout/rate-limit/outage). We
 *                 FAIL OPEN here: an upstream outage must never stop a real
 *                 customer from ordering.
 */

export type AddressVerdict = "verified" | "not_found" | "unknown";

export type AddressCheck = {
  verdict: AddressVerdict;
  /** Which part failed, when verdict is "not_found". */
  reason?: "postcode" | "street";
  /** Town resolved from the postcode, when we got one. */
  town?: string | null;
  /** Customer-facing explanation for a "not_found". */
  message?: string;
};

const UA = "JoodLife-Checkout/1.0 (https://joodlife.shop)";
const TIMEOUT_MS = 3_500;

async function getJson(url: string): Promise<unknown | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-GB" },
      signal: ctl.signal,
      // Cache identical lookups — keeps us well inside Nominatim's fair use.
      next: { revalidate: 600 },
    });
    if (res.status === 404) return { __notFound: true };
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // timeout / network → inconclusive
  } finally {
    clearTimeout(timer);
  }
}

/** postcodes.io lookup. Returns the town, "invalid", or null when unavailable. */
async function lookupPostcode(
  postcode: string,
): Promise<{ town: string | null } | "invalid" | null> {
  const data = await getJson(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
  );
  if (data === null) return null;
  if ((data as { __notFound?: boolean }).__notFound) return "invalid";
  const r = (data as { result?: Record<string, unknown> }).result;
  if (!r) return "invalid";
  const town =
    (r.post_town as string) ||
    (r.admin_district as string) ||
    (r.parish as string) ||
    null;
  return { town };
}

/** Nominatim structured search. true = found, false = definitively empty, null = unavailable. */
async function streetExists(
  params: Record<string, string>,
): Promise<boolean | null> {
  const qs = new URLSearchParams({
    format: "jsonv2",
    countrycodes: "gb",
    limit: "1",
    ...params,
  });
  const data = await getJson(
    `https://nominatim.openstreetmap.org/search?${qs.toString()}`,
  );
  if (data === null) return null;
  if ((data as { __notFound?: boolean }).__notFound) return false;
  return Array.isArray(data) && data.length > 0;
}

/** Strip a leading house number/flat so "12 High Street" → "High Street". */
function withoutHouseNumber(street: string): string {
  return street.replace(/^\s*[\w-]*\d+[\w-]*[\s,]+/, "").trim();
}

/**
 * Verify a UK delivery address. Only ever returns "not_found" when an upstream
 * lookup answered and found nothing — never on an outage.
 */
export async function verifyUkAddress(input: {
  street: string;
  city?: string;
  postcode: string;
}): Promise<AddressCheck> {
  const street = (input.street ?? "").trim();
  const postcode = (input.postcode ?? "").trim().toUpperCase();
  const city = (input.city ?? "").trim();
  if (!street || !postcode) return { verdict: "unknown" };

  // 1. The postcode itself must be a real UK postcode.
  const pc = await lookupPostcode(postcode);
  if (pc === null) return { verdict: "unknown" };
  if (pc === "invalid") {
    return {
      verdict: "not_found",
      reason: "postcode",
      message: "That postcode doesn’t exist. Please check and try again.",
    };
  }

  // 2. The street must exist at that postcode. Two attempts max (fair use):
  //    exactly as typed, then with any leading house number removed.
  const attempts: Record<string, string>[] = [
    { street, postalcode: postcode },
  ];
  const bare = withoutHouseNumber(street);
  if (bare && bare.toLowerCase() !== street.toLowerCase()) {
    attempts.push({ street: bare, postalcode: postcode });
  }

  let gotDefinitiveAnswer = false;
  for (const params of attempts) {
    const found = await streetExists(params);
    if (found === null) continue; // inconclusive — don't judge on this one
    gotDefinitiveAnswer = true;
    if (found) return { verdict: "verified", town: pc.town };
  }

  if (!gotDefinitiveAnswer) return { verdict: "unknown", town: pc.town };

  return {
    verdict: "not_found",
    reason: "street",
    town: pc.town,
    message:
      "We couldn’t find that street at this postcode. Please start typing your address and pick it from the suggestions.",
  };
}
