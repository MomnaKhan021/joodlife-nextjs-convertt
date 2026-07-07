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

  const key = process.env.BREVO_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, connected: false });
  }

  const url = new URL(req.url);
  const daysRaw = Number(url.searchParams.get("days") ?? 7);
  const days = [1, 7, 30, 90].includes(daysRaw) ? daysRaw : 7;

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const qs = `?startDate=${ymd(start)}&endDate=${ymd(end)}`;

  try {
    const [emailRes, smsRes] = await Promise.allSettled([
      brevoGet(`/smtp/statistics/aggregatedReport${qs}`, key),
      brevoGet(`/transactionalSMS/statistics/aggregatedReport${qs}`, key),
    ]);

    let emailOpenRate: number | null = null;
    let emailClickRate: number | null = null;
    let emailsDelivered: number | null = null;
    if (emailRes.status === "fulfilled") {
      const e = emailRes.value as {
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
    if (smsRes.status === "fulfilled") {
      const s = smsRes.value as { delivered?: number; requests?: number; sent?: number };
      const delivered = Number(s.delivered ?? 0);
      const requests = Number(s.requests ?? s.sent ?? 0);
      smsDelivered = delivered;
      smsDeliveryRate = rate(delivered, requests);
    }

    const connected =
      emailRes.status === "fulfilled" || smsRes.status === "fulfilled";

    return NextResponse.json({
      ok: true,
      connected,
      days,
      brevo: {
        emailOpenRate,
        emailClickRate,
        emailsDelivered,
        smsDelivered,
        smsDeliveryRate,
      },
    });
  } catch (err) {
    return NextResponse.json({
      ok: true,
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
