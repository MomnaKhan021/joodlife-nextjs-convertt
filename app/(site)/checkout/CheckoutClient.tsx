"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeCardNumberElement } from "@stripe/stripe-js";

import { useCart } from "@/components/cart/CartContext";
import { getStripeClient } from "@/lib/stripeClient";

const stripePromise = getStripeClient();

const formatPrice = (n: number) =>
  n.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Turn the /api/checkout error JSON into an actionable message. The API
 *  returns {error:"Validation failed", issues:[…]} on a bad body; map the
 *  failing field paths to friendly names rather than show "Validation failed". */
function describeCheckoutError(
  json: { error?: string; issues?: Array<{ path?: Array<string | number> }> },
  status: number,
): string {
  if (Array.isArray(json?.issues) && json.issues.length) {
    const labels = json.issues.map((i) => {
      const p = Array.isArray(i?.path) ? i.path.join(".") : "";
      if (/address/.test(p)) return "delivery address";
      if (/email/.test(p)) return "email address";
      if (/name/.test(p)) return "name";
      if (/phone/.test(p)) return "phone number";
      if (/items/.test(p)) return "one of your cart items";
      return p || "a field";
    });
    return `Please check: ${[...new Set(labels)].join(", ")}.`;
  }
  return json?.error ?? `Order failed (HTTP ${status})`;
}

/* Shared styling for the Stripe card <input> iframes so they read as the
   same fields as our native inputs. */
const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: "var(--font-saans), Inter, system-ui, sans-serif",
      fontSize: "16px",
      fontWeight: "400",
      color: "#142e2a",
      letterSpacing: "-0.32px",
      "::placeholder": { color: "#142e2a", opacity: "0.4" },
    },
    invalid: { color: "#f93232" },
  },
} as const;

/* ================================================================== */
/*  Provider wrapper                                                   */
/* ================================================================== */
export default function CheckoutClient() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

/* ================================================================== */
/*  Checkout form + summary                                            */
/* ================================================================== */
function CheckoutForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { items, subtotal, clear } = useCart();

  // Shipping fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("GB");
  const [saveInfo, setSaveInfo] = useState(true);

  // Card field state
  const [focusField, setFocusField] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);

  // Discount code: typed code + the applied result (validated server-side).
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountMsg, setDiscountMsg] = useState<string | null>(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  // Restore previously-saved contact details (client-only; the form isn't
  // rendered until the cart hydrates, so this can't cause a hydration
  // mismatch). The setState calls are intentional one-shot restores.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("jood:checkout:contact");
      if (!raw) return;
      const c = JSON.parse(raw);
      /* eslint-disable react-hooks/set-state-in-effect */
      setFirstName(c.firstName ?? "");
      setLastName(c.lastName ?? "");
      setEmail(c.email ?? "");
      setAddress(c.address ?? "");
      setApartment(c.apartment ?? "");
      setCity(c.city ?? "");
      setPostcode(c.postcode ?? "");
      setPhone(c.phone ?? "");
      setCountry(c.country ?? "GB");
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* ignore */
    }
  }, []);

  // Applied discount, clamped to the current subtotal (so a stale fixed-£
  // code can never make the total negative).
  const discount = appliedDiscount
    ? Math.min(appliedDiscount.amount, subtotal)
    : 0;
  const total = Math.round(Math.max(0, subtotal - discount) * 100) / 100;

  async function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!code || discountBusy) return;
    setDiscountBusy(true);
    setDiscountMsg(null);
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, subtotal }),
      });
      const json = await res.json();
      if (res.ok && json.valid) {
        setAppliedDiscount({ code: json.code ?? code, amount: json.amount });
        setDiscountMsg(null);
      } else {
        setAppliedDiscount(null);
        setDiscountMsg(json?.reason ?? "This code isn’t valid.");
      }
    } catch {
      setAppliedDiscount(null);
      setDiscountMsg("Couldn’t check that code. Please try again.");
    } finally {
      setDiscountBusy(false);
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountMsg(null);
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canPay =
    items.length > 0 &&
    firstName.trim() &&
    lastName.trim() &&
    emailValid &&
    address.trim() &&
    city.trim() &&
    postcode.trim() &&
    phone.trim() &&
    cardComplete &&
    expiryComplete &&
    cvcComplete &&
    Boolean(stripe && elements) &&
    !busy;

  async function handlePay() {
    if (!canPay || !stripe || !elements) return;
    setBusy(true);
    setError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const composedAddress = [
        address.trim(),
        apartment.trim(),
        `${city.trim()} ${postcode.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      // Persist contact for next time (or clear it)
      if (saveInfo) {
        window.localStorage.setItem(
          "jood:checkout:contact",
          JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            address: address.trim(),
            apartment: apartment.trim(),
            city: city.trim(),
            postcode: postcode.trim(),
            phone: phone.trim(),
            country,
          }),
        );
      } else {
        window.localStorage.removeItem("jood:checkout:contact");
      }

      // 1) Create the order (idempotent on retry)
      const idempotencyKey =
        idempotencyKeyRef.current ??
        (idempotencyKeyRef.current = `co_${
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Date.now() + "_" + Math.random().toString(36).slice(2)
        }`);

      // Sanitise cart items to the exact shape the API expects. A stale or
      // malformed item left in localStorage (missing productId/title/etc.)
      // would otherwise fail server validation with an opaque error.
      const cleanItems = items
        .filter(
          (i) =>
            i &&
            typeof i.productId === "number" &&
            i.productId > 0 &&
            typeof i.slug === "string" &&
            i.slug.length > 0 &&
            typeof i.title === "string" &&
            i.title.length > 0 &&
            typeof i.quantity === "number" &&
            i.quantity >= 1,
        )
        .map((i) => ({
          productId: i.productId,
          slug: i.slug,
          title: i.title,
          dose: i.dose ?? null,
          price: typeof i.price === "number" ? i.price : undefined,
          quantity: Math.min(99, Math.max(1, Math.round(i.quantity))),
          imageUrl: i.imageUrl ?? null,
        }));

      if (cleanItems.length === 0) {
        throw new Error(
          "Your cart has an invalid item. Please clear your cart and add the product again.",
        );
      }

      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        credentials: "include",
        body: JSON.stringify({
          items: cleanItems,
          customer: {
            name: fullName,
            email: email.trim(),
            phone: phone.trim(),
            address: composedAddress,
            notes: "",
          },
          discountCode: appliedDiscount?.code,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.ok) {
        throw new Error(describeCheckoutError(orderJson, orderRes.status));
      }

      // 2) Create / reuse the PaymentIntent for the trusted total
      const piRes = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderNumber: orderJson.orderNumber }),
      });
      const piJson = await piRes.json();
      if (!piRes.ok || !piJson.ok || !piJson.clientSecret) {
        throw new Error(
          piJson?.error ?? `Payment setup failed (HTTP ${piRes.status})`,
        );
      }

      // 3) Confirm the card payment on Stripe (card data never touches us)
      const cardNumber = elements.getElement(
        CardNumberElement,
      ) as StripeCardNumberElement | null;
      if (!cardNumber) throw new Error("Card field not ready. Please retry.");

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(piJson.clientSecret, {
          payment_method: {
            card: cardNumber,
            billing_details: {
              name: fullName,
              email: email.trim(),
              phone: phone.trim(),
              address: {
                line1: address.trim(),
                line2: apartment.trim() || undefined,
                city: city.trim(),
                postal_code: postcode.trim(),
                country,
              },
            },
          },
        });

      if (stripeError) {
        throw new Error(stripeError.message ?? "Your card could not be charged.");
      }

      if (
        paymentIntent &&
        (paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing")
      ) {
        clear();
        router.replace(
          `/checkout/success?order=${encodeURIComponent(orderJson.orderNumber)}`,
        );
        return;
      }

      throw new Error(
        `Payment status: ${paymentIntent?.status ?? "unknown"}. Please try again.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  /* ---------------- Empty cart ---------------- */
  if (items.length === 0) {
    return (
      <section className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center px-6 py-20 text-center">
        <h1 className="font-ui text-[24px] font-bold tracking-[-0.01em] text-[#142e2a]">
          Your cart is empty
        </h1>
        <p className="mt-3 font-ui text-[15px] text-[#142e2a]/70">
          Add a treatment to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
        >
          Browse shop
        </Link>
      </section>
    );
  }

  /* ---------------- Main ---------------- */
  return (
    <section className="mx-auto w-full max-w-[1327px] flex-1 px-5 py-10 md:px-8 lg:py-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-[24px]">
        {/* ════════ LEFT: form card ════════ */}
        <div className="rounded-[24px] border border-[#142e2a]/10 bg-white px-6 py-8 md:px-8 md:py-10">
          {/* 1. Shipping Details */}
          <h2 className="font-ui text-[20px] font-semibold leading-[24px] tracking-[-0.2px] text-[#142e2a]">
            <span className="mr-2 text-[#142e2a]">1.</span>Shipping Details
          </h2>

          <div className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name" required>
                <TextInput
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last Name" required>
                <TextInput
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                />
              </Field>
            </div>

            <Field label="Email" required>
              <TextInput
                value={email}
                onChange={setEmail}
                type="email"
                autoComplete="email"
                placeholder="info@gmail.com"
              />
            </Field>

            <Field label="Address" required>
              <TextInput
                value={address}
                onChange={setAddress}
                autoComplete="address-line1"
              />
            </Field>

            <Field label="Apartment, suit, etc. (optional)">
              <TextInput
                value={apartment}
                onChange={setApartment}
                autoComplete="address-line2"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City" required>
                <TextInput
                  value={city}
                  onChange={setCity}
                  autoComplete="address-level2"
                  placeholder="London"
                />
              </Field>
              <Field label="Postcode" required>
                <TextInput
                  value={postcode}
                  onChange={setPostcode}
                  autoComplete="postal-code"
                />
              </Field>
            </div>

            <Field label="Phone" required>
              <TextInput
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
                placeholder="+91 -0000-00000"
              />
            </Field>

            <label className="mt-1 flex cursor-pointer items-center gap-2.5 select-none">
              <input
                type="checkbox"
                checked={saveInfo}
                onChange={(e) => setSaveInfo(e.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border-[#142e2a]/30 accent-[#142e2a]"
              />
              <span className="font-ui text-[15px] text-[#545454]">
                Save this information for next time
              </span>
            </label>
          </div>

          {/* 2. Payment */}
          <h2 className="mt-10 font-ui text-[20px] font-semibold leading-[24px] tracking-[-0.2px] text-[#142e2a]">
            <span className="mr-2 text-[#142e2a]">2.</span>Payment
          </h2>

          {/* Payment method tabs */}
          <div className="mt-5 grid grid-cols-4 gap-2.5">
            <MethodTab active>
              <CardGlyph />
              <span>Card</span>
            </MethodTab>
            <MethodTab>
              <RevolutGlyph />
              <span>Revolut Pay</span>
            </MethodTab>
            <MethodTab>
              <BillieGlyph />
              <span>Billie</span>
            </MethodTab>
            <MethodTab dropdown>
              <span className="italic">pay</span>
            </MethodTab>
          </div>

          {/* Card number */}
          <div className="mt-5">
            <FieldLabel>Card Number</FieldLabel>
            <ElementBox focused={focusField === "number"}>
              <div className="flex-1">
                <CardNumberElement
                  options={{
                    ...STRIPE_ELEMENT_OPTIONS,
                    showIcon: false,
                    placeholder: "1234 1234 1234 1234",
                  }}
                  onFocus={() => setFocusField("number")}
                  onBlur={() => setFocusField(null)}
                  onChange={(e) => setCardComplete(e.complete)}
                />
              </div>
              <div className="flex shrink-0 items-center gap-1.5 pl-2">
                <MastercardMark />
                <VisaMark />
                <AmexMark />
              </div>
            </ElementBox>
          </div>

          {/* Expiry + CVC */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Expiration date</FieldLabel>
              <ElementBox focused={focusField === "expiry"}>
                <div className="flex-1">
                  <CardExpiryElement
                    options={{ ...STRIPE_ELEMENT_OPTIONS, placeholder: "MM/YY" }}
                    onFocus={() => setFocusField("expiry")}
                    onBlur={() => setFocusField(null)}
                    onChange={(e) => setExpiryComplete(e.complete)}
                  />
                </div>
              </ElementBox>
            </div>
            <div>
              <FieldLabel>Security code</FieldLabel>
              <ElementBox focused={focusField === "cvc"}>
                <div className="flex-1">
                  <CardCvcElement
                    options={{ ...STRIPE_ELEMENT_OPTIONS, placeholder: "CVC" }}
                    onFocus={() => setFocusField("cvc")}
                    onBlur={() => setFocusField(null)}
                    onChange={(e) => setCvcComplete(e.complete)}
                  />
                </div>
                <LockGlyph />
              </ElementBox>
            </div>
          </div>

          {/* Country */}
          <div className="mt-4">
            <FieldLabel>Country</FieldLabel>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-[52px] w-full appearance-none rounded-[8px] border border-[#e7e8e3] bg-white px-4 pr-10 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/20"
              >
                <option value="GB">United Kingdom</option>
                <option value="IE">Ireland</option>
                <option value="US">United States</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
              </select>
              <ChevronGlyph className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Pay button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay}
            className="mt-6 inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#142e2a] px-6 font-ui text-[16px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.18)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#142e2a] disabled:hover:shadow-none"
          >
            {busy ? (
              <>
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Processing…
              </>
            ) : (
              `Pay ${formatPrice(total)}`
            )}
          </button>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
            >
              {error}
            </p>
          ) : null}

          {/* Transaction secured */}
          <div className="mt-4 flex items-center justify-between">
            <span className="flex items-center gap-2 font-ui text-[14px] font-semibold text-[#142e2a]">
              <LockGlyph />
              Transaction secured
            </span>
            <span className="flex items-center gap-1 font-ui text-[13px] text-[#142e2a]/60">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#142e2a] text-[9px] font-bold text-white">
                C
              </span>
              Checkify
            </span>
          </div>
        </div>

        {/* ════════ RIGHT: order summary ════════ */}
        <aside className="lg:pt-2">
          <h2 className="font-ui text-[25px] font-semibold leading-[26px] tracking-[-0.49px] text-[#142e2a]">
            Order Summary
          </h2>

          {/* Product card(s) */}
          <div className="mt-5 flex flex-col gap-3 rounded-[16px] bg-[#f7f9f2] p-4">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.dose ?? "default"}`}
                className="flex items-center gap-4"
              >
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-white">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="72px"
                      className="object-contain p-1"
                    />
                  ) : null}
                  {item.quantity > 1 ? (
                    <span className="absolute right-1 top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#142e2a] px-1 font-ui text-[10px] font-semibold leading-none text-white">
                      {item.quantity}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-ui text-[16px] font-bold text-[#142e2a]">
                    {item.title}
                  </p>
                  {item.dose ? (
                    <p className="mt-0.5 font-ui text-[14px] text-[#142e2a]/80">
                      {item.dose}
                    </p>
                  ) : null}
                </div>
                <span className="font-ui text-[16px] font-semibold text-[#142e2a]">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="mt-5 flex flex-col gap-3">
            <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />

            {appliedDiscount && discount > 0 ? (
              <div className="flex items-center justify-between gap-2 font-ui text-[16px]">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-[#142e2a]">
                  Discount
                  <span className="rounded-full bg-[#142e2a]/10 px-2 py-0.5 text-[12px] font-semibold uppercase tracking-[0.02em] text-[#142e2a]">
                    {appliedDiscount.code}
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-[12px] font-medium text-[#142e2a]/55 underline underline-offset-2 hover:text-[#142e2a]"
                  >
                    Remove
                  </button>
                </span>
                <span className="shrink-0 font-semibold text-[#142e2a]">
                  -{formatPrice(discount)}
                </span>
              </div>
            ) : null}

            {/* Add discount code */}
            {!appliedDiscount ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDiscount((v) => !v)}
                  className="flex items-center gap-1 font-ui text-[16px] text-[#142e2a] underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                  Add discount code
                  <ChevronGlyph
                    className={showDiscount ? "rotate-90 transition-transform" : "transition-transform"}
                  />
                </button>
                {showDiscount ? (
                  <div className="mt-2.5 flex gap-2">
                    <input
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value);
                        setDiscountMsg(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyDiscount();
                        }
                      }}
                      placeholder="Enter code"
                      className="h-11 flex-1 rounded-[8px] border border-[#e7e8e3] bg-white px-3 font-ui text-[14px] uppercase text-[#142e2a] outline-none placeholder:normal-case focus:border-[#142e2a]"
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountBusy || !discountCode.trim()}
                      className="h-11 rounded-[8px] border border-[#142e2a] px-4 font-ui text-[14px] font-semibold text-[#142e2a] transition-colors hover:bg-[#142e2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {discountBusy ? "…" : "Apply"}
                    </button>
                  </div>
                ) : null}
                {discountMsg ? (
                  <p className="mt-1.5 font-ui text-[12px] text-red-600">
                    {discountMsg}
                  </p>
                ) : null}
              </div>
            ) : null}

            <SummaryRow label="Shipping" value="Free" muted />
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between border-t border-[#142e2a]/10 pt-4">
            <span className="font-ui text-[16px] font-semibold text-[#142e2a]">
              Today’s total
            </span>
            <span className="font-ui text-[25px] font-bold tracking-[-0.49px] text-[#142e2a]">
              {formatPrice(total)}
            </span>
          </div>

          {/* Delivery-thereafter note */}
          <div className="mt-3 flex items-start gap-2 font-ui text-[14px] leading-[19px] text-[#545454]">
            <TruckGlyph />
            <span>
              {formatPrice(197)} per delivery thereafter
              <br />
              Cancel or switch after 1 month
            </span>
          </div>

          {/* Money back promise */}
          <div className="mt-5 flex items-center gap-4 rounded-[16px] bg-[#f7f9f2] p-5">
            <div className="flex-1">
              <h3 className="font-ui text-[18px] font-bold leading-[22px] text-[#0c2421]">
                Money back promise
              </h3>
              <p className="mt-1.5 font-ui text-[14px] leading-[19px] text-[#0c2421]/90">
                Lose at least 10% of your body weight in 6 months with our
                programme. If you don’t, we’ll refund you.
              </p>
            </div>
            <Image
              src="/assets/checkout/money-back-badge.png"
              alt="Money back promise"
              width={96}
              height={96}
              className="h-[96px] w-[96px] shrink-0"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  Subcomponents                                                      */
/* ================================================================== */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </label>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block font-ui text-[16px] font-semibold leading-[19px] tracking-[-0.32px] text-[#0a0a0a]">
      {children}
      {required ? <span className="text-[#f93232]">*</span> : null}
    </span>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="h-[52px] w-full rounded-[8px] border border-[#e7e8e3] bg-white px-4 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow placeholder:text-[#142e2a]/40 focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/20"
    />
  );
}

function ElementBox({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "flex h-[52px] items-center rounded-[8px] border bg-white px-4 transition-shadow",
        focused
          ? "border-[#142e2a] ring-2 ring-[#142e2a]/20"
          : "border-[#e7e8e3]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between font-ui text-[16px]">
      <span className="font-semibold text-[#142e2a]">{label}</span>
      <span className={muted ? "font-semibold text-[#767676]" : "font-semibold text-[#142e2a]"}>
        {value}
      </span>
    </div>
  );
}

function MethodTab({
  active,
  dropdown,
  children,
}: {
  active?: boolean;
  dropdown?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "flex h-[44px] items-center justify-center gap-1.5 rounded-[8px] border font-ui text-[12px] font-bold transition-colors",
        active
          ? "border-[#142e2a] bg-[#142e2a] text-white"
          : "border-[#e7e8e3] bg-white text-[#666565]",
      ].join(" ")}
    >
      {children}
      {dropdown ? <ChevronGlyph className="opacity-60" /> : null}
    </div>
  );
}

/* ---------------- Glyphs ---------------- */
function CardGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 9.5h20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function RevolutGlyph() {
  return (
    <span className="font-display text-[13px] font-extrabold leading-none">R</span>
  );
}
function BillieGlyph() {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#0a0a0a] text-[9px] font-bold leading-none text-white">
      B
    </span>
  );
}
function ChevronGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function LockGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#142e2a]">
      <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function TruckGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0 text-[#545454]">
      <path d="M2 6h11v9H2zM13 9h5l3 3v3h-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/* ---------------- Card brand marks ---------------- */
function MastercardMark() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden>
      <rect width="26" height="18" rx="3" fill="#16366b" />
      <circle cx="10.5" cy="9" r="5" fill="#EB001B" />
      <circle cx="15.5" cy="9" r="5" fill="#F79E1B" fillOpacity="0.9" />
    </svg>
  );
}
function VisaMark() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden>
      <rect width="26" height="18" rx="3" fill="#fff" stroke="#e7e8e3" />
      <text
        x="13"
        y="12.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fontStyle="italic"
        fill="#1A1F71"
        fontFamily="Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}
function AmexMark() {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden>
      <rect width="26" height="18" rx="3" fill="#2E77BB" />
      <text
        x="13"
        y="12"
        textAnchor="middle"
        fontSize="6"
        fontWeight="700"
        fill="#fff"
        fontFamily="Arial, sans-serif"
      >
        AMEX
      </text>
    </svg>
  );
}
