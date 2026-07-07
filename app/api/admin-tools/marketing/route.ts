import { NextResponse, type NextRequest } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin-tools/marketing?days=<1|7|30|90>
 *
 * Marketing metrics pulled live from Brevo's REST API (v3) when a
 * BREVO_API_KEY is configured:
 *   - Email open rate + click rate (transactional aggregated report)
 *   - Emails delivered
 *   - SMS delivered / delivery rate (transactional SMS aggregated report)
 *
 * Degrades gracefully: if the key is missing or Brevo errors, returns
 * { connected: false } so the dashboard shows "Connect Brevo" tiles.
 *
 * Accessible to role "admin" AND "staff".
 */

async function authorize() {
  try {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: await nextHeaders() });
    const role = (user as unknown as { role?: string } | null)?.role;
    if (!user || (role !== "admin" && role !== "staff")) return null;
    return user;
  } catch {
    return null;
  }
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const rate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : null);

/**
 * Resolve the Brevo REST API v3 key. Prefer the dedicated BREVO_API_KEY,
 * but fall back to SMTP_PASS when that value is itself a v3 key
 * (`xkeysib-…`) — some setups paste the API key as the SMTP password.
 * The SMTP *key* (`xsmtpsib-…`) can send mail but CANNOT read stats.
 */
function resolveBrevoKey(): { key: string | null; reason?: string } {
  const explicit = process.env.BREVO_API_KEY?.trim();
  if (explicit) return { key: explicit };
  const smtp = process.env.SMTP_PASS?.trim();
  if (smtp && smtp.startsWith("xkeysib-")) return { key: smtp };
  if (smtp && smtp.startsWith("xsmtpsib-")) {
    return {
      key: null,
      reason:
        "SMTP_PASS is a Brevo SMTP key (xsmtpsib-…), which can send mail but not read stats. Add a REST API v3 key (xkeysib-…) as BREVO_API_KEY.",
    };
  }
  return {
    key: null,
    reason: "No Brevo REST API key. Add a v3 API key (xkeysib-…) as BREVO_API_KEY.",
  };
}

/** Trustpilot rating + review count via the official public Business Unit
 *  API. Trustpilot blocks scraping its site (403), so this needs a
 *  TRUSTPILOT_API_KEY (free public API key from the Trustpilot Business
 *  account). Returns null (tile stays "Connect Trustpilot") without it. */
async function fetchTrustpilot(): Promise<{ rating: number | null; reviews: number | null } | null> {
  const apiKey = process.env.TRUSTPILOT_API_KEY?.trim();
  const domain = process.env.TRUSTPILOT_DOMAIN?.trim() || "joodlife.com";
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.trustpilot.com/v1/business-units/find?name=${encodeURIComponent(domain)}`,
      { headers: { apikey: apiKey, accept: "application/json" }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as {
      score?: { trustScore?: number; stars?: number };
      numberOfReviews?: { total?: number } | number;
    };
    const rating = j?.score?.trustScore ?? j?.score?.stars ?? null;
    const reviews =
      typeof j?.numberOfReviews === "number"
        ? j.numberOfReviews
        : (j?.numberOfReviews?.total ?? null);
    if (rating === null && reviews === null) return null;
    return { rating, reviews };
  } catch {
    return null;
  }
}

async function brevoGet(path: string, key: string) {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    headers: { "api-key": key, accept: "application/json" },
    // never cache — these are live daily numbers
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Brevo ${res.status} ${await res.text().catch(() => "")}`.slice(0, 200));
  }
  return res.json();
}

export async function GET(req: NextRequest) {
  const user = await authorize();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Admin or staff role required" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const daysRaw = Number(url.searchParams.get("days") ?? 7);
  const days = [1, 7, 30, 90].includes(daysRaw) ? daysRaw : 7;

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const qs = `?startDate=${ymd(start)}&endDate=${ymd(end)}`;

  const { key, reason } = resolveBrevoKey();

  // Trustpilot needs no key, so fetch it regardless of Brevo status.
  const [emailRes, smsRes, trustpilot] = await Promise.all([
    key ? brevoGet(`/smtp/statistics/aggregatedReport${qs}`, key).then((v) => ({ ok: true as const, v })).catch((e) => ({ ok: false as const, e })) : Promise.resolve(null),
    key ? brevoGet(`/transactionalSMS/statistics/aggregatedReport${qs}`, key).then((v) => ({ ok: true as const, v })).catch(() => ({ ok: false as const })) : Promise.resolve(null),
    fetchTrustpilot(),
  ]);

  let emailOpenRate: number | null = null;
  let emailClickRate: number | null = null;
  let emailsDelivered: number | null = null;
  if (emailRes?.ok) {
    const e = emailRes.v as {
      delivered?: number;
      uniqueOpens?: number;
      opens?: number;
      uniqueClicks?: number;
      clicks?: number;
    };
    const delivered = Number(e.delivered ?? 0);
    emailsDelivered = delivered;
    emailOpenRate = rate(Number(e.uniqueOpens ?? e.opens ?? 0), delivered);
    emailClickRate = rate(Number(e.uniqueClicks ?? e.clicks ?? 0), delivered);
  }

  let smsDelivered: number | null = null;
  let smsDeliveryRate: number | null = null;
  if (smsRes?.ok) {
    const s = smsRes.v as { delivered?: number; requests?: number; sent?: number };
    const delivered = Number(s.delivered ?? 0);
    const requests = Number(s.requests ?? s.sent ?? 0);
    smsDelivered = delivered;
    smsDeliveryRate = rate(delivered, requests);
  }

  const brevoConnected = Boolean(emailRes?.ok || smsRes?.ok);
  // Surface a Brevo error (bad key / wrong key type) so it's diagnosable.
  const brevoError = !brevoConnected
    ? (emailRes && !emailRes.ok && "e" in emailRes ? String(emailRes.e) : undefined) ?? reason
    : undefined;

  return NextResponse.json({
    ok: true,
    connected: brevoConnected || Boolean(trustpilot),
    brevoConnected,
    brevoError,
    days,
    brevo: {
      emailOpenRate,
      emailClickRate,
      emailsDelivered,
      smsDelivered,
      smsDeliveryRate,
    },
    trustpilot,
  });
}
