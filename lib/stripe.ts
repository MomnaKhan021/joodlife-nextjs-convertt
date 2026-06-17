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
    // Use the runtime's global fetch instead of Stripe's default Node `https`
    // HTTP client. On Vercel serverless the default client intermittently fails
    // with "An error occurred with our connection to Stripe. Request was retried
    // N times." — the fetch-based client connects reliably there.
    httpClient: StripeModule.createFetchHttpClient(),
    maxNetworkRetries: 2,
    timeout: 20000,
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

/**
 * Call Stripe's REST API directly with the runtime's `fetch`.
 *
 * The Stripe Node SDK's HTTP client fails to connect on Vercel's serverless
 * Node 24 runtime ("An error occurred with our connection to Stripe…"), even
 * with createFetchHttpClient(), whereas a plain `fetch` to the same endpoint
 * succeeds in ~200ms. For the payment path we therefore bypass the SDK and
 * talk to the REST API ourselves.
 *
 * @param path   e.g. "payment_intents" or "payment_intents/pi_123"
 * @param params flat form fields; nested keys use Stripe's bracket syntax,
 *               e.g. { "metadata[orderId]": "5", "automatic_payment_methods[enabled]": "true" }
 */
export async function stripeRest<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set — cannot call Stripe.");
  }
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    form.append(key, String(value));
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2025-09-30.clover",
    },
    body: form.toString(),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string; type?: string };
  };
  if (!res.ok) {
    const msg =
      json?.error?.message || `Stripe API responded ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}
