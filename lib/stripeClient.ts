"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Browser-side Stripe.js singleton. The publishable key is safe to ship
 * in the client bundle (it's the "pk_" half). Returns null if the key is
 * not configured so the checkout can fall back gracefully.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}
