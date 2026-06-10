"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";

import { useCart } from "@/components/cart/CartContext";
import { getStripeClient } from "@/lib/stripeClient";
import EmbeddedPayment from "@/components/checkout/EmbeddedPayment";

const formatPrice = (n: number) =>
  n.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CheckoutClient() {
  const router = useRouter();
  const { items, subtotal, itemCount, clear } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  // Embedded Stripe Payment Element flow. `phase` is "form" until the
  // customer's details are valid and they continue to payment; then we
  // create the order + PaymentIntent and switch to "pay", rendering the
  // card form. The Place-Order button (inside EmbeddedPayment) stays
  // disabled until the card is valid.
  const [phase, setPhase] = useState<"form" | "pay">("form");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const orderNumberRef = useRef<string | null>(null);
  const stripePromise = useMemo(() => getStripeClient(), []);

  // Stripe configuration probe — flips the Payment section between
  // "Pay securely with card via Stripe" and "Test mode" depending on
  // whether the server has its keys set up. Polled once on mount.
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    // The embedded card form needs BOTH halves: the server secret key
    // (to create the PaymentIntent) and the browser publishable key (to
    // load Stripe.js). If the publishable key is missing we stay in
    // test mode rather than render a broken card form.
    const hasPublishableKey = Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
    (async () => {
      try {
        const res = await fetch("/api/stripe/status", {
          credentials: "include",
        });
        const json = await res.json();
        if (!cancelled)
          setStripeReady(Boolean(json?.configured) && hasPublishableKey);
      } catch {
        if (!cancelled) setStripeReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canPlaceOrder =
    items.length > 0 &&
    name.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    address.trim();

  // Empty-cart guard
  if (items.length === 0) {
    return (
      <section className="mx-auto w-full max-w-[1100px] px-6 py-16 text-center md:py-24">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#f7f9f2]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6h15l-1.5 9h-12L4 3H2"
              stroke="#142e2a"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="20" r="1.5" stroke="#142e2a" strokeWidth="1.7" />
            <circle cx="18" cy="20" r="1.5" stroke="#142e2a" strokeWidth="1.7" />
          </svg>
        </div>
        <h1 className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[32px] md:leading-[40px]">
          Your cart is empty
        </h1>
        <p className="mx-auto mt-3 max-w-[420px] font-ui text-[15px] leading-[24px] text-[#142e2a]/75">
          Add a treatment to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
        >
          Browse shop
        </Link>
      </section>
    );
  }

  async function handlePlaceOrder() {
    if (!canPlaceOrder || busy) return;
    setBusy(true);
    setError(null);
    try {
      // Idempotency-Key: same key on a retry returns the same order
      // instead of creating a duplicate. We mint one per attempt and
      // keep it on the component so React-strict-mode double-mounts +
      // network blips don't accidentally double-charge.
      const idempotencyKey =
        idempotencyKeyRef.current ??
        (idempotencyKeyRef.current = `co_${
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Date.now() + "_" + Math.random().toString(36).slice(2)
        }`);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        credentials: "include",
        body: JSON.stringify({
          items,
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }

      orderNumberRef.current = json.orderNumber;

      // Ask the server to create a PaymentIntent for this order (amount
      // re-read from the DB). We then render the embedded card form. If
      // Stripe is NOT configured (503) fall back to the test success.
      const piRes = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderNumber: json.orderNumber }),
      });

      if (piRes.status === 503) {
        // Stripe not configured — go straight to success (test mode)
        clear();
        router.replace(
          `/checkout/success?order=${encodeURIComponent(json.orderNumber)}`
        );
        return;
      }

      const piJson = await piRes.json();
      if (!piRes.ok || !piJson.ok || !piJson.clientSecret) {
        throw new Error(piJson?.error ?? `Stripe HTTP ${piRes.status}`);
      }

      // Reveal the embedded card form. Cart is cleared only after a
      // successful charge (in onPaid), so a failed/abandoned payment
      // keeps the line items for a retry.
      setClientSecret(piJson.clientSecret);
      setPhase("pay");
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  // Called by EmbeddedPayment when the charge succeeds without a
  // redirect. (3-D Secure flows redirect to the success page directly.)
  function handlePaid() {
    const orderNumber = orderNumberRef.current;
    clear();
    router.replace(
      `/checkout/success?order=${encodeURIComponent(orderNumber ?? "")}`
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1180px] px-5 py-10 md:px-10 md:py-14">
      <header className="mb-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 font-ui text-[13px] font-medium text-[#142e2a]/70 transition-colors hover:text-[#142e2a]"
        >
          ← Continue shopping
        </Link>
        <h1 className="mt-3 font-display text-[32px] font-bold leading-[38px] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[46px]">
          Checkout
        </h1>
        <p className="mt-2 font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15px]">
          {itemCount} item{itemCount === 1 ? "" : "s"} in your cart · Tax + delivery
          calculated at fulfilment.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_400px] md:gap-10">
        {/* ─────────── LEFT: form ─────────── */}
        <div className="flex flex-col gap-6">
          <FormSection
            title="Contact"
            subtitle="We'll send the order confirmation here."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name *">
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07700 900 000"
                  className="h-12 w-full rounded-lg bg-white px-4 font-ui text-[14px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="Delivery address"
            subtitle="Include house/flat number, street, town/city, and postcode."
          >
            <textarea
              rows={4}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={"12 Example Road\nLondon\nSW1A 1AA"}
              className="w-full rounded-lg bg-white px-4 py-3 font-ui text-[14px] leading-[22px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
            />
          </FormSection>

          <FormSection
            title="Order notes (optional)"
            subtitle="Anything our pharmacy team should know about delivery."
          >
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Leave with neighbour, gate code 1234, etc."
              className="w-full rounded-lg bg-white px-4 py-3 font-ui text-[14px] leading-[22px] text-[#142e2a] outline-none ring-1 ring-[#142e2a]/15 transition-shadow focus:ring-2 focus:ring-[#142e2a]/40"
            />
          </FormSection>

          <FormSection
            title="Payment method"
            subtitle={
              !stripeReady
                ? "Test mode is active. Real card processing is configured but waiting for Stripe credentials."
                : phase === "pay"
                  ? "Enter your card details below. We never store or see your full card number."
                  : "Secure card payment powered by Stripe — your card is entered on the next step."
            }
          >
            {phase === "pay" && clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#142e2a",
                      borderRadius: "10px",
                      fontFamily: "system-ui, sans-serif",
                    },
                  },
                }}
              >
                <EmbeddedPayment
                  total={subtotal}
                  returnUrl={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/checkout/success?order=${encodeURIComponent(
                          orderNumberRef.current ?? "",
                        )}`
                      : "/checkout/success"
                  }
                  onPaid={handlePaid}
                />
              </Elements>
            ) : (
              <StripePaymentCard ready={stripeReady} />
            )}
          </FormSection>

          {/* Mobile: continue button under the form (hidden once paying) */}
          {phase === "form" ? (
            <div className="md:hidden">
              <PlaceOrderButton
                busy={busy}
                canPlaceOrder={Boolean(canPlaceOrder)}
                onClick={handlePlaceOrder}
                stripeReady={stripeReady}
                total={subtotal}
              />
              {error ? <ErrorBox message={error} /> : null}
            </div>
          ) : null}
        </div>

        {/* ─────────── RIGHT: summary (sticky on desktop) ─────────── */}
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-[#142e2a]/10 bg-[#f7f9f2] p-5 md:p-6">
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[#142e2a]">
              Order summary
            </h2>

            <ul className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.dose ?? "default"}`}
                  className="flex items-start gap-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                    <span className="absolute right-1 top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#142e2a] px-1 font-ui text-[10px] font-semibold leading-none text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-ui text-[14px] font-semibold text-[#142e2a]">
                      {item.title}
                    </p>
                    {item.dose ? (
                      <p className="mt-0.5 font-ui text-[12px] text-[#142e2a]/65">
                        {item.dose}
                      </p>
                    ) : null}
                  </div>
                  <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2 border-t border-[#142e2a]/10 pt-4">
              <Row label="Subtotal" value={formatPrice(subtotal)} />
              <Row label="Delivery" value="At fulfilment" muted />
              <Row label="Tax" value="At fulfilment" muted />
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-[#142e2a]/10 pt-3">
              <span className="font-display text-[16px] font-semibold text-[#142e2a]">
                Total
              </span>
              <span className="font-display text-[22px] font-bold tracking-[-0.01em] text-[#142e2a]">
                {formatPrice(subtotal)}
              </span>
            </div>
          </div>

          {/* Desktop: continue button below the summary. Once we're in the
              pay phase the Place-Order button lives inside the card form. */}
          <div className="mt-5 hidden md:block">
            {phase === "form" ? (
              <>
                <PlaceOrderButton
                  busy={busy}
                  canPlaceOrder={Boolean(canPlaceOrder)}
                  onClick={handlePlaceOrder}
                  stripeReady={stripeReady}
                  total={subtotal}
                />
                {error ? <ErrorBox message={error} /> : null}
                <p className="mt-3 text-center font-ui text-[12px] text-[#142e2a]/55">
                  By continuing you agree to our Terms.
                </p>
              </>
            ) : (
              <p className="rounded-lg bg-[#f7f9f2] px-4 py-3 text-center font-ui text-[12px] text-[#142e2a]/65">
                Complete your card details in the Payment section to place your
                order.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#142e2a]/10 bg-white p-5 md:p-6">
      <header className="mb-4">
        <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[#142e2a]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 font-ui text-[13px] text-[#142e2a]/65">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between font-ui text-[14px]">
      <span className={muted ? "text-[#142e2a]/60" : "text-[#142e2a]/75"}>
        {label}
      </span>
      <span className={muted ? "text-[#142e2a]/55" : "font-semibold text-[#142e2a]"}>
        {value}
      </span>
    </div>
  );
}

function PlaceOrderButton({
  busy,
  canPlaceOrder,
  onClick,
  stripeReady,
  total,
}: {
  busy: boolean;
  canPlaceOrder: boolean;
  onClick: () => void;
  stripeReady?: boolean | null;
  total?: number;
}) {
  const totalLabel =
    typeof total === "number"
      ? total.toLocaleString("en-GB", {
          style: "currency",
          currency: "GBP",
          minimumFractionDigits: 2,
        })
      : null;
  const idleLabel = stripeReady
    ? "Continue to payment"
    : totalLabel
      ? `Place test order · ${totalLabel}`
      : "Place test order";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canPlaceOrder || busy}
      className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#142e2a]"
    >
      {busy ? (
        <>
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {stripeReady ? "Loading payment…" : "Placing order…"}
        </>
      ) : (
        <>
          {stripeReady ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          ) : null}
          {idleLabel}
        </>
      )}
    </button>
  );
}

/**
 * Visible payment-method card shown inside the "Payment method" form
 * section. Renders a brand-recognisable Stripe-card UI even before
 * the customer kicks off the Stripe redirect, so they know exactly
 * what to expect on submit.
 */
function StripePaymentCard({ ready }: { ready: boolean | null }) {
  return (
    <div className="flex flex-col gap-3">
      <label
        className={[
          "flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-4 transition-colors",
          ready
            ? "border-[#142e2a] bg-white"
            : "border-[#142e2a]/15 bg-[#f7f9f2]",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
            ready ? "border-[#142e2a]" : "border-[#142e2a]/30",
          ].join(" ")}
        >
          <span
            className={[
              "h-2.5 w-2.5 rounded-full",
              ready ? "bg-[#142e2a]" : "bg-transparent",
            ].join(" ")}
          />
        </span>

        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
              Credit or debit card
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[#635bff]/10 px-2 py-0.5 font-ui text-[11px] font-bold italic text-[#635bff]">
              stripe
            </span>
          </div>
          <p className="font-ui text-[12.5px] leading-[18px] text-[#142e2a]/70">
            {ready
              ? "You'll be redirected to Stripe's secure payment page to enter your card details. We never see or store your card."
              : "Stripe is wired up but the server is missing keys. Test orders will be saved without payment until the operator adds STRIPE_SECRET_KEY."}
          </p>

          {/* Card brand glyphs — Visa / Mastercard / Amex / Apple Pay /
              Google Pay — so customers know which methods Stripe will
              accept once they click through. */}
          <div className="mt-1 flex items-center gap-2">
            {[
              { label: "Visa",        bg: "#1A1F71" },
              { label: "MC",          bg: "#000000" },
              { label: "Amex",        bg: "#2E77BB" },
              { label: "Apple Pay",   bg: "#000000" },
              { label: "G Pay",       bg: "#FFFFFF", color: "#5f6368", border: true },
            ].map((b) => (
              <span
                key={b.label}
                className="inline-flex h-6 items-center rounded-[4px] px-1.5 font-ui text-[10px] font-bold"
                style={{
                  backgroundColor: b.bg,
                  color: b.color ?? "#ffffff",
                  border: b.border ? "1px solid #142e2a1f" : "none",
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </label>

      <p className="flex items-start gap-2 font-ui text-[12px] leading-[18px] text-[#142e2a]/55">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Encrypted in transit. PCI DSS Level 1 processor. 3-D Secure where required.
      </p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
    >
      {message}
    </p>
  );
}
