/**
 * Apple Pay / Google Pay setup with Stripe  —  /api/admin-tools/stripe-wallets
 *
 * Admin-only. Uses the server's STRIPE_SECRET_KEY (never sent to the browser).
 *
 *   GET                                  → wallet status for the checkout domain:
 *                                          the Stripe payment-method domain
 *                                          (Apple Pay / Google Pay verified?) and
 *                                          the payment-method configurations
 *                                          (Apple Pay / Google Pay on or off).
 *   POST { action: "register-domain" }   → register www.joodlife.com with Stripe
 *                                          (or re-validate it if already there).
 *                                          Apple Pay verification uses the file at
 *                                          /.well-known/apple-developer-merchantid-domain-association.
 *   POST { action: "enable-google-pay" } → turn Google Pay on in the account's
 *                                          default payment-method configuration.
 */
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { stripeRest } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The domain customers pay on (the apex redirects here). */
const CHECKOUT_DOMAIN = "www.joodlife.com";

type WalletStatus = { status?: string; status_details?: { error_message?: string } };
type PaymentMethodDomain = {
  id: string;
  domain_name: string;
  enabled: boolean;
  apple_pay?: WalletStatus;
  google_pay?: WalletStatus;
  link?: WalletStatus;
};
type Pref = { display_preference?: { preference?: string; value?: string } };
type PaymentMethodConfiguration = {
  id: string;
  name?: string;
  active?: boolean;
  is_default?: boolean;
  parent?: string | null;
  apple_pay?: Pref;
  google_pay?: Pref;
  link?: Pref;
  card?: Pref;
};

async function stripeGet<T>(path: string): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set — cannot call Stripe.");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}`, "Stripe-Version": "2025-09-30.clover" },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!res.ok) throw new Error(json?.error?.message || `Stripe API responded ${res.status}`);
  return json as T;
}

function sameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const domainView = (d: PaymentMethodDomain | null) =>
  d
    ? {
        id: d.id,
        domain: d.domain_name,
        enabled: d.enabled,
        applePay: d.apple_pay?.status ?? "unknown",
        applePayError: d.apple_pay?.status_details?.error_message ?? null,
        googlePay: d.google_pay?.status ?? "unknown",
        googlePayError: d.google_pay?.status_details?.error_message ?? null,
      }
    : null;

const configView = (c: PaymentMethodConfiguration) => ({
  id: c.id,
  name: c.name ?? null,
  active: c.active ?? null,
  isDefault: c.is_default ?? null,
  applePay: c.apple_pay?.display_preference?.value ?? null,
  googlePay: c.google_pay?.display_preference?.value ?? null,
  link: c.link?.display_preference?.value ?? null,
});

async function findDomain(): Promise<PaymentMethodDomain | null> {
  const list = await stripeGet<{ data: PaymentMethodDomain[] }>(
    `payment_method_domains?domain_name=${encodeURIComponent(CHECKOUT_DOMAIN)}&limit=10`,
  );
  return list.data.find((d) => d.domain_name === CHECKOUT_DOMAIN) ?? null;
}

async function listConfigs(): Promise<PaymentMethodConfiguration[]> {
  const list = await stripeGet<{ data: PaymentMethodConfiguration[] }>(`payment_method_configurations?limit=20`);
  return list.data ?? [];
}

async function status() {
  const [domain, configs] = await Promise.all([findDomain(), listConfigs()]);
  return { checkoutDomain: CHECKOUT_DOMAIN, domain: domainView(domain), configurations: configs.map(configView) };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await status()) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Admin role required" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Cross-origin request rejected" }, { status: 403 });
  }
  let action = "";
  try {
    action = String(((await req.json()) as { action?: unknown })?.action ?? "");
  } catch {
    /* handled below */
  }

  try {
    if (action === "register-domain") {
      const existing = await findDomain();
      const result = existing
        ? await stripeRest<PaymentMethodDomain>(`payment_method_domains/${existing.id}/validate`, {})
        : await stripeRest<PaymentMethodDomain>("payment_method_domains", {
            domain_name: CHECKOUT_DOMAIN,
            enabled: true,
          });
      console.info(`[stripe-wallets] ${existing ? "re-validated" : "registered"} ${CHECKOUT_DOMAIN} by ${user.email}`);
      return NextResponse.json({ ok: true, did: existing ? "re-validated" : "registered", domain: domainView(result) });
    }

    if (action === "enable-google-pay") {
      const configs = await listConfigs();
      // The configuration checkout uses: the account's default, active one
      // (PaymentIntents here don't name a configuration).
      const target =
        configs.find((c) => c.is_default && c.active) ?? configs.find((c) => c.active && !c.parent) ?? null;
      if (!target) {
        return NextResponse.json({ ok: false, error: "No active payment-method configuration found" }, { status: 404 });
      }
      const updated = await stripeRest<PaymentMethodConfiguration>(`payment_method_configurations/${target.id}`, {
        "google_pay[display_preference][preference]": "on",
      });
      console.info(`[stripe-wallets] Google Pay turned on in ${target.id} by ${user.email}`);
      return NextResponse.json({ ok: true, did: "google-pay-on", configuration: configView(updated) });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-wallets]", action, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
