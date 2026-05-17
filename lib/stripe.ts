import "server-only";

/**
 * Lazy Stripe client. We import the SDK on-demand so the rest of the
 * codebase doesn't blow up if the stripe package isn't installed yet
 * (it will be installed by `npm install stripe` once you provide
 * keys). All env-var validation happens in one place here.
 */

import type Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function getStripe(): Promise<Stripe> {
  if (stripeClient) return stripeClient;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — cannot create Stripe client."
    );
  }
  // Dynamic import so the bundler doesn't pull stripe into client code
  const StripeModule = (await import("stripe")).default;
  stripeClient = new StripeModule(secret, {
    apiVersion: "2025-09-30.clover" as never, // newest available; pin explicitly
    typescript: true,
    appInfo: {
      name: "JoodLife — Next.js storefront",
      version: "1.0.0",
    },
  });
  return stripeClient;
}

/**
 * Stripe expects amounts in the smallest currency unit (pence for GBP).
 * We round to avoid floating-point cruft from price * quantity sums.
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
