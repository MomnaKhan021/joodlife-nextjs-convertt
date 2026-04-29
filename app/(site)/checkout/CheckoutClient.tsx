"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/components/cart/CartContext";

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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      // Clear cart and redirect to success
      clear();
      router.replace(`/checkout/success?order=${encodeURIComponent(json.orderNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
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
            title="Payment"
            subtitle="Test mode — no card required. Your order will be placed for review."
          >
            <div className="flex items-start gap-3 rounded-xl border border-[#142e2a]/10 bg-[#f7f9f2] px-4 py-4">
              <span
                aria-hidden
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#142e2a] text-[#dff49f]"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8.5l3.2 3.2L13 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-ui text-[14px] font-semibold text-[#142e2a]">
                  Test checkout · no payment taken
                </p>
                <p className="font-ui text-[13px] leading-[20px] text-[#142e2a]/70">
                  Your order will be saved with a <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px]">test</code>{" "}
                  payment method and{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px]">pending</code>{" "}
                  status. Real card processing will be wired in later.
                </p>
              </div>
            </div>
          </FormSection>

          {/* Mobile: place button under the form */}
          <div className="md:hidden">
            <PlaceOrderButton
              busy={busy}
              canPlaceOrder={Boolean(canPlaceOrder)}
              onClick={handlePlaceOrder}
            />
            {error ? <ErrorBox message={error} /> : null}
          </div>
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

          {/* Desktop: place button below the summary */}
          <div className="mt-5 hidden md:block">
            <PlaceOrderButton
              busy={busy}
              canPlaceOrder={Boolean(canPlaceOrder)}
              onClick={handlePlaceOrder}
            />
            {error ? <ErrorBox message={error} /> : null}
            <p className="mt-3 text-center font-ui text-[12px] text-[#142e2a]/55">
              By placing this test order you agree to our Terms.
            </p>
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
}: {
  busy: boolean;
  canPlaceOrder: boolean;
  onClick: () => void;
}) {
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
          Placing order…
        </>
      ) : (
        "Place test order"
      )}
    </button>
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
