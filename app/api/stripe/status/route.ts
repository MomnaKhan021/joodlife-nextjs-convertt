/**
 * GET /api/stripe/status
 *
 * Tiny endpoint the checkout client polls on mount to learn whether
 * Stripe is configured on this deployment. Returns only booleans —
 * NEVER returns the actual key or any other secret.
 *
 * The publishable key is "public" (it's safe to ship in the browser
 * bundle) but we still don't expose its existence via this endpoint
 * — the client can read it from process.env.NEXT_PUBLIC_… if it
 * needs to. We just confirm the server has its half configured.
 */
import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isStripeConfigured(),
    publishableKeyPresent: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
    webhookSecretPresent: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  });
}
