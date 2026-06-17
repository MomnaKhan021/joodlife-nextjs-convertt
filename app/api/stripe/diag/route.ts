import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic — remove after launch.
 *
 * Isolates *why* PaymentIntent creation fails in production:
 *   1. rawFetch  — can this function reach api.stripe.com AT ALL (bypassing
 *      the Stripe SDK)? A connection error here means a network block.
 *   2. sdk       — does the Stripe SDK (now using the fetch HTTP client) work?
 *
 * Token-gated so it can't be abused. Returns NO secret material.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== "jood-stripe-diag-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const secret = process.env.STRIPE_SECRET_KEY ?? "";
  const out: Record<string, unknown> = {
    keyPresent: Boolean(secret),
    keyPrefix: secret ? secret.slice(0, 7) : null, // sk_live / sk_test / rk_…
    keyLength: secret.length,
    nodeVersion: process.version,
  };

  // 1) Raw fetch — pure network test, no SDK involved.
  try {
    const started = Date.now();
    const res = await fetch("https://api.stripe.com/v1/balance", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    out.rawFetch = {
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      bodySnippet: body.slice(0, 200),
    };
  } catch (err) {
    out.rawFetch = {
      ok: false,
      connectionError: err instanceof Error ? err.message : String(err),
      cause:
        err instanceof Error && err.cause
          ? String((err.cause as { message?: string })?.message ?? err.cause)
          : null,
    };
  }

  // 2) SDK test — uses the configured client (fetch HTTP client).
  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = await getStripe();
    const bal = await stripe.balance.retrieve();
    out.sdk = { ok: true, livemode: bal.livemode };
  } catch (err) {
    out.sdk = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      type: err instanceof Error ? err.name : typeof err,
    };
  }

  return NextResponse.json(out);
}
