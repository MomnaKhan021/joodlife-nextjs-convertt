/**
 * GET /api/admin-tools/health
 *
 * Live self-check for the admin dashboard: pings each external integration
 * and reports ok/❌ with a short detail, plus a read-only breakdown of the
 * pending clinical-review consultations (so you can see how much of the
 * backlog is old/synced vs. recent). Admin only.
 *
 * Checks: Database, HubSpot, DPD, Stripe, Vercel Blob, Email (SMTP/Brevo).
 */
import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";

import { getPayloadInstance } from "@/lib/payload";
import { getHubSpotTokenInfo } from "@/lib/hubspot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DrizzleLike = { execute: (q: unknown) => Promise<unknown> };
type SqlRaw = { raw: (s: string) => unknown };

async function getDrizzle(): Promise<{ drizzle: DrizzleLike; sql: SqlRaw }> {
  const payload = await getPayloadInstance();
  const drizzle = (
    payload.db as unknown as { drizzle?: { execute?: (q: unknown) => Promise<unknown> } }
  ).drizzle;
  if (!drizzle?.execute) throw new Error("payload.db.drizzle.execute unavailable");
  const { sql } = (await import("drizzle-orm")) as { sql: SqlRaw };
  return { drizzle: drizzle as DrizzleLike, sql };
}

function rowsOf<T>(r: unknown): T[] {
  if (Array.isArray(r)) return r as T[];
  if (r && typeof r === "object" && "rows" in r) {
    const x = (r as { rows?: T[] }).rows;
    return Array.isArray(x) ? x : [];
  }
  return [];
}

type Check = { name: string; ok: boolean; detail: string; configured: boolean };

/** Race a promise against a timeout so a hung integration can't stall the page. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

async function checkDatabase(): Promise<Check> {
  try {
    const { drizzle, sql } = await getDrizzle();
    const res = await withTimeout(drizzle.execute(sql.raw("SELECT 1 AS n")), 8000, "DB");
    const ok = rowsOf<{ n: number }>(res)[0]?.n === 1;
    return { name: "Database", configured: true, ok, detail: ok ? "Connected" : "Unexpected response" };
  } catch (err) {
    return { name: "Database", configured: true, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkHubSpot(): Promise<Check> {
  const configured = Boolean(process.env.HUBSPOT_ACCESS_TOKEN);
  if (!configured) return { name: "HubSpot", configured, ok: false, detail: "HUBSPOT_ACCESS_TOKEN not set" };
  try {
    const info = await withTimeout(getHubSpotTokenInfo(), 8000, "HubSpot");
    if (info.ok) {
      return { name: "HubSpot", configured, ok: true, detail: `Token valid${info.data.hubId ? ` · hub ${info.data.hubId}` : ""}` };
    }
    return { name: "HubSpot", configured, ok: false, detail: info.error ?? `HTTP ${info.status}` };
  } catch (err) {
    return { name: "HubSpot", configured, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkDpd(): Promise<Check> {
  const user = process.env.DPD_API_USER ?? "";
  const pass = process.env.DPD_API_PASS ?? "";
  const configured = Boolean(user && pass);
  if (!configured) {
    const missing = [!user && "DPD_API_USER", !pass && "DPD_API_PASS"].filter(Boolean).join(", ");
    return { name: "DPD", configured, ok: false, detail: `Not set: ${missing}` };
  }
  try {
    const base = process.env.DPD_API_BASE ?? "https://api.dpdlocal.co.uk";
    const credentials = Buffer.from(`${user}:${pass}`).toString("base64");
    const res = await withTimeout(
      fetch(`${base}/user/?action=login`, {
        method: "POST",
        headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json", Accept: "application/json" },
      }),
      9000,
      "DPD",
    );
    if (!res.ok) return { name: "DPD", configured, ok: false, detail: `Auth HTTP ${res.status}` };
    const json = (await res.json()) as { data?: { geoSession?: string }; error?: { errorMessage?: string } };
    const ok = Boolean(json?.data?.geoSession);
    return { name: "DPD", configured, ok, detail: ok ? "Auth OK — labels can be created" : json?.error?.errorMessage ?? "No session returned" };
  } catch (err) {
    return { name: "DPD", configured, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkStripe(): Promise<Check> {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const configured = Boolean(key);
  if (!configured) return { name: "Stripe", configured, ok: false, detail: "STRIPE_SECRET_KEY not set" };
  try {
    const res = await withTimeout(
      fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${key}` } }),
      8000,
      "Stripe",
    );
    const live = key.startsWith("sk_live");
    return {
      name: "Stripe",
      configured,
      ok: res.ok,
      detail: res.ok ? `Key valid (${live ? "live" : "test"} mode)` : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { name: "Stripe", configured, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

function checkBlob(): Check {
  const ok = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return {
    name: "Vercel Blob (uploads)",
    configured: ok,
    ok,
    detail: ok ? "Token present — image uploads enabled" : "BLOB_READ_WRITE_TOKEN not set",
  };
}

function checkEmail(): Check {
  const smtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  const brevo = Boolean(process.env.BREVO_API_KEY);
  const ok = smtp || brevo;
  return {
    name: "Email (order/consult mail)",
    configured: ok,
    ok,
    detail: smtp ? "SMTP configured" : brevo ? "Brevo API configured" : "No SMTP_* or BREVO_API_KEY set",
  };
}

async function pendingBreakdown() {
  try {
    const { drizzle, sql } = await getDrizzle();
    const res = await drizzle.execute(
      sql.raw(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE product_slug = 'reorder')::int AS reorder,
          COUNT(*) FILTER (
            WHERE COALESCE(product_slug, '') <> 'reorder'
              AND COALESCE(answers->>'video_consultation_preference', '') NOT IN ('', 'false')
          )::int AS booked,
          COUNT(*) FILTER (
            WHERE COALESCE(product_slug, '') <> 'reorder'
              AND COALESCE(answers->>'video_consultation_preference', '') IN ('', 'false')
          )::int AS notbooked,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::int  AS last7,
          COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS last30,
          COUNT(*) FILTER (WHERE created_at <  now() - interval '30 days')::int AS older30
        FROM "consultations"
        WHERE status IN ('submitted', 'reviewed')
          AND (answers->>'_review_decision') IS NULL
      `),
    );
    const r = rowsOf<Record<string, number>>(res)[0] ?? {};
    return {
      ok: true,
      total: Number(r.total ?? 0),
      byCategory: { booked: Number(r.booked ?? 0), notbooked: Number(r.notbooked ?? 0), reorder: Number(r.reorder ?? 0) },
      byAge: {
        last7Days: Number(r.last7 ?? 0),
        last30Days: Number(r.last30 ?? 0),
        olderThan30Days: Number(r.older30 ?? 0),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  // Auth
  try {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: await nextHeaders() });
    if (!user || (user as unknown as { role?: string }).role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Auth failed" }, { status: 403 });
  }

  const [db, hubspot, dpd, stripe, pending] = await Promise.all([
    checkDatabase(),
    checkHubSpot(),
    checkDpd(),
    checkStripe(),
    pendingBreakdown(),
  ]);

  const checks: Check[] = [db, hubspot, dpd, stripe, checkBlob(), checkEmail()];

  return NextResponse.json({ ok: true, checks, pending });
}
