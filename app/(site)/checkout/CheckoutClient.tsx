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
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  StripeCardNumberElement,
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
} from "@stripe/stripe-js";

import { useCart } from "@/components/cart/CartContext";
import {
  NAME_PART_MAX,
  TEXT_MAX,
  ADDRESS_MAX,
  isValidNamePart,
  namePartError,
} from "@/lib/formValidation";
import { fbPurchaseOnce } from "@/lib/metaPixel";
import { dlBeginCheckout, toDlItem } from "@/lib/dataLayer";
import { getStripeClient } from "@/lib/stripeClient";
import UkPostcodeField from "@/components/checkout/UkPostcodeField";
import UkAddressField from "@/components/checkout/UkAddressField";

const stripePromise = getStripeClient();

const formatPrice = (n: number) =>
  n.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Normalise a UK phone number to its national 0… form, or null if it isn't
 *  a valid UK number. Accepts 07…, 01/02/03 landlines and the +44 / 0044
 *  international forms, with spaces, dashes or brackets anywhere. */
export function normaliseUkPhone(raw: string): string | null {
  const digits = (raw || "").replace(/[\s().-]/g, "");
  let n = digits;
  if (n.startsWith("+44")) n = "0" + n.slice(3);
  else if (n.startsWith("0044")) n = "0" + n.slice(4);
  else if (n.startsWith("44") && n.length >= 12) n = "0" + n.slice(2);
  if (!/^0(?:1\d{8,9}|2\d{9}|3\d{9}|7\d{9})$/.test(n)) return null;
  return n;
}

/** True when the value is a usable UK phone number. */
function isUkPhone(raw: string): boolean {
  return normaliseUkPhone(raw) !== null;
}

/** A string that looks like a raw JSON blob, object dump, or an internal
 *  server error — we never want to show any of these to a customer at the
 *  bottom of the checkout. */
function looksTechnical(s: string): boolean {
  const t = s.trim();
  if (t === "" || t === "[object Object]" || /^[[{]/.test(t) || t.length > 160) {
    return true;
  }
  // Internal/server phrases that shouldn't reach a customer.
  return /insert failed|init failed|unavailable|drizzle|payload|\bsql\b|stack|undefined|null|http \d|exception/i.test(
    t,
  );
}

/** Map a failing field path (e.g. "customer.address") to a friendly label. */
function fieldLabel(path: string): string {
  if (/postcode|postal|zip/i.test(path)) return "postcode";
  if (/address|line1|street/i.test(path)) return "delivery address";
  if (/city|town/i.test(path)) return "town or city";
  if (/email/i.test(path)) return "email address";
  if (/phone|mobile|tel/i.test(path)) return "phone number";
  if (/name/i.test(path)) return "full name";
  if (/items/i.test(path)) return "cart items";
  if (/discount/i.test(path)) return "discount code";
  if (/notes/i.test(path)) return "order notes";
  return "your details";
}

/** Turn the /api/checkout error JSON into a friendly, field-specific message.
 *  The API returns {error:"Validation failed", issues:[…]} on a bad body — we
 *  name the exact field(s) rather than show "Validation failed" or a raw JSON
 *  blob at the bottom of the page. */
function describeCheckoutError(
  json: { error?: unknown; issues?: Array<{ path?: Array<string | number> }> },
  status: number,
): string {
  // 1) Field-level validation issues → name the exact field(s).
  if (Array.isArray(json?.issues) && json.issues.length) {
    const labels = [
      ...new Set(
        json.issues.map((i) =>
          fieldLabel(Array.isArray(i?.path) ? i.path.join(".") : ""),
        ),
      ),
    ];
    return labels.length === 1
      ? `Please check your ${labels[0]} and try again.`
      : `Please check these details: ${labels.join(", ")}.`;
  }
  // 2) A plain, human-readable error string from the API (never a JSON dump).
  const raw = typeof json?.error === "string" ? json.error : "";
  if (raw && !looksTechnical(raw)) return raw;
  // 3) Sensible fallbacks by status.
  if (status === 429)
    return "Too many attempts — please wait a moment and try again.";
  if (status >= 500)
    return "Something went wrong on our end. Please try again in a moment.";
  return "We couldn’t process your order. Please check your details and try again.";
}

/** Normalise any thrown value into a friendly message — never "[object
 *  Object]" or a JSON string. */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return looksTechnical(msg)
    ? "Something went wrong. Please try again."
    : msg;
}

/* Shared styling for the Stripe card <input> iframes so they read as the
   same fields as our native inputs. */
const STRIPE_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: "Outfit, system-ui, sans-serif",
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
  // Verified against postcodes.io → guarantees a real UK postcode (UK-only store).
  const [postcodeValid, setPostcodeValid] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("GB");
  const [saveInfo, setSaveInfo] = useState(true);

  // Optional separate delivery address. When off, goods ship to the address
  // above. When on, the block below is where the order is delivered (the
  // address above is then treated as billing/contact and saved in notes).
  const [deliverElsewhere, setDeliverElsewhere] = useState(false);
  const [dAddress, setDAddress] = useState("");
  const [dApartment, setDApartment] = useState("");
  const [dCity, setDCity] = useState("");
  const [dPostcode, setDPostcode] = useState("");
  const [dPostcodeValid, setDPostcodeValid] = useState(false);

  // Card field state
  const [focusField, setFocusField] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);
  // Inline validation message from the Stripe card elements (e.g. "Your card
  // number is invalid"), shown under the card fields as the user types.
  const [cardError, setCardError] = useState<string | null>(null);

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
  // Only surface the "what's still needed" checklist AFTER the customer
  // tries to pay — not on an untouched form.
  const [attempted, setAttempted] = useState(false);
  // True while navigating to the success page. Prevents the empty-cart
  // screen flashing after we clear the cart (the "glitch" before thank-you).
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  // GA4 begin_checkout — fire once when the checkout loads with items.
  const beganCheckout = useRef(false);
  useEffect(() => {
    if (beganCheckout.current || items.length === 0) return;
    beganCheckout.current = true;
    dlBeginCheckout(
      items.map((i) =>
        toDlItem({
          slug: i.slug,
          productId: i.productId,
          title: i.title,
          dose: i.dose,
          price: i.price,
          quantity: i.quantity,
        }),
      ),
    );
  }, [items]);

  // Abandoned-cart capture: once we know the shopper's email and they still
  // have items, snapshot the cart server-side (debounced). If they complete
  // checkout, /api/checkout marks it recovered; if not, it surfaces in the
  // Abandoned Checkout queue and the daily reminder cron nudges them.
  useEffect(() => {
    if (redirecting) return;
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || items.length === 0) return;
    const t = setTimeout(() => {
      void fetch("/api/cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: em,
          name: `${firstName} ${lastName}`.trim(),
          phone: phone.trim(),
          total: subtotal,
          items: items.map((i) => ({
            slug: i.slug,
            title: i.title,
            dose: i.dose,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [email, firstName, lastName, phone, items, subtotal, redirecting]);

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

  // Auto-apply: validate the code shortly after the user stops typing, so the
  // discount lands without needing to press "Apply". Re-checks if the subtotal
  // changes (e.g. cart edits) so the amount stays correct.
  useEffect(() => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;
    if (appliedDiscount?.code === code) return; // already applied
    const t = setTimeout(() => {
      void applyDiscount();
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountCode, subtotal]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  // Gate payment on a valid UK postcode FORMAT (offline regex) — not on the
  // postcodes.io API call succeeding. The API is only used to autofill/verify;
  // if it's slow or down, a correctly-formatted UK postcode must still let the
  // customer pay. `postcodeValid` (the API tick) is treated as a bonus.
  const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  // UK-only phone numbers — this is a UK pharmacy and the courier only
  // delivers in the UK. Accepts 07…, 01/02/03 landlines, and the +44 / 0044
  // international forms of the same.
  const phoneValid = isUkPhone(phone);
  const postcodeOk = postcodeValid || UK_POSTCODE_RE.test(postcode.trim());
  // When delivering elsewhere, that block must also be a complete UK address.
  const deliveryOk =
    !deliverElsewhere ||
    (dAddress.trim() &&
      dCity.trim() &&
      (dPostcodeValid || UK_POSTCODE_RE.test(dPostcode.trim())));
  const firstNameValid = isValidNamePart(firstName);
  const lastNameValid = isValidNamePart(lastName);
  const canPay =
    items.length > 0 &&
    firstNameValid &&
    lastNameValid &&
    emailValid &&
    address.trim() &&
    city.trim() &&
    postcodeOk &&
    deliveryOk &&
    phoneValid &&
    // A payment card is ALWAYS required — including a £0 (fully discounted)
    // order, which is verified with Stripe rather than charged.
    cardComplete &&
    expiryComplete &&
    cvcComplete &&
    Boolean(stripe && elements) &&
    !busy;

  // Fire the Purchase pixel event (deduped per order) then navigate to the
  // thank-you page. Firing here — right after a confirmed payment, while the
  // pixel is already loaded — is more reliable than only firing on the
  // success page (which depends on an async order fetch).
  function finalizeAndRedirect(orderNumber: string, amount: number) {
    fbPurchaseOnce(orderNumber, amount, "GBP", { content_type: "product" });
    setRedirecting(true);
    clear();
    router.replace(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
  }

  async function handlePay() {
    if (!canPay) {
      setAttempted(true);
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const billingAddress = [
        address.trim(),
        apartment.trim(),
        `${city.trim()} ${postcode.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join("\n");
      const deliveryAddress = [
        dAddress.trim(),
        dApartment.trim(),
        `${dCity.trim()} ${dPostcode.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join("\n");
      // The order ships to the delivery address when one is given; otherwise to
      // the main address. The other address is kept in notes for the record.
      const composedAddress = deliverElsewhere ? deliveryAddress : billingAddress;
      const orderNotes = deliverElsewhere
        ? `Billing/contact address:\n${billingAddress}`
        : "";

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
            notes: orderNotes,
          },
          discountCode: appliedDiscount?.code,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.ok) {
        throw new Error(describeCheckoutError(orderJson, orderRes.status));
      }

      // Free order (£0 after a full discount): Stripe can't charge £0, but a
      // card is still required — so VERIFY it with a zero-amount SetupIntent.
      // If the card is missing or declined the order is not completed.
      if (orderJson.free || orderJson.totalAmount <= 0) {
        if (!stripe || !elements) {
          throw new Error("Payment form is still loading. Please retry.");
        }
        const cardEl = elements.getElement(
          CardNumberElement,
        ) as StripeCardNumberElement | null;
        if (!cardEl) throw new Error("Card field not ready. Please retry.");

        const siRes = await fetch("/api/stripe/setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderNumber: orderJson.orderNumber }),
        });
        const siJson = await siRes.json();
        if (!siRes.ok || !siJson.ok || !siJson.clientSecret) {
          throw new Error(
            typeof siJson?.error === "string" && !looksTechnical(siJson.error)
              ? siJson.error
              : "We couldn't verify your card. Please try again.",
          );
        }
        const { error: setupError } = await stripe.confirmCardSetup(
          siJson.clientSecret,
          {
            payment_method: {
              card: cardEl,
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
          },
        );
        if (setupError) {
          throw new Error(
            setupError.message ?? "Your card could not be verified.",
          );
        }
        finalizeAndRedirect(
          orderJson.orderNumber,
          Number(orderJson.totalAmount) || total,
        );
        return;
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
      if (!stripe || !elements) {
        throw new Error("Payment form is still loading. Please retry.");
      }
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
        finalizeAndRedirect(
          orderJson.orderNumber,
          Number(orderJson.totalAmount) || total,
        );
        return;
      }

      throw new Error(
        `Payment status: ${paymentIntent?.status ?? "unknown"}. Please try again.`,
      );
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  /* ---------------- Apple Pay / Google Pay (Payment Request) ---------- */
  // Delivery/contact details are still required (same as the card path);
  // the wallet only supplies the payment method. Card data and wallet
  // tokens are handled entirely by Stripe.
  const formReady = Boolean(
    items.length > 0 &&
      firstName.trim() &&
      lastName.trim() &&
      emailValid &&
      address.trim() &&
      city.trim() &&
      postcode.trim() &&
      phone.trim(),
  );

  // Keep the latest handler in a ref so the Stripe listener never goes stale.
  const walletPayRef = useRef<(ev: PaymentRequestPaymentMethodEvent) => void>(
    () => {},
  );
  walletPayRef.current = async (ev: PaymentRequestPaymentMethodEvent) => {
    try {
      if (!stripe) {
        ev.complete("fail");
        return;
      }
      if (!formReady) {
        ev.complete("fail");
        setError(
          "Please complete your contact and delivery details above, then use Apple Pay / Google Pay.",
        );
        return;
      }
      setBusy(true);
      setError(null);

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const billingAddress = [
        address.trim(),
        apartment.trim(),
        `${city.trim()} ${postcode.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join("\n");
      const deliveryAddress = [
        dAddress.trim(),
        dApartment.trim(),
        `${dCity.trim()} ${dPostcode.trim()}`.trim(),
      ]
        .filter(Boolean)
        .join("\n");
      const composedAddress = deliverElsewhere ? deliveryAddress : billingAddress;
      const orderNotes = deliverElsewhere
        ? `Billing/contact address:\n${billingAddress}`
        : "";

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
        ev.complete("fail");
        setError("Your cart has an invalid item. Please re-add the product.");
        setBusy(false);
        return;
      }

      const idemKey = `wco_${
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Date.now() + "_" + Math.random().toString(36).slice(2)
      }`;

      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idemKey,
        },
        credentials: "include",
        body: JSON.stringify({
          items: cleanItems,
          customer: {
            name: fullName,
            email: email.trim(),
            phone: phone.trim(),
            address: composedAddress,
            notes: orderNotes,
          },
          discountCode: appliedDiscount?.code,
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.ok) {
        ev.complete("fail");
        setError(describeCheckoutError(orderJson, orderRes.status));
        setBusy(false);
        return;
      }

      if (orderJson.free || orderJson.totalAmount <= 0) {
        ev.complete("success");
        finalizeAndRedirect(
          orderJson.orderNumber,
          Number(orderJson.totalAmount) || total,
        );
        return;
      }

      const piRes = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderNumber: orderJson.orderNumber }),
      });
      const piJson = await piRes.json();
      if (!piRes.ok || !piJson.ok || !piJson.clientSecret) {
        ev.complete("fail");
        setError(
          typeof piJson?.error === "string" && !looksTechnical(piJson.error)
            ? piJson.error
            : "We couldn’t start the payment. Please try again.",
        );
        setBusy(false);
        return;
      }

      // Confirm with the wallet's payment method. handleActions:false lets us
      // close the wallet sheet first, then run any 3DS step ourselves.
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(
          piJson.clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false },
        );
      if (confirmError) {
        ev.complete("fail");
        setError(confirmError.message ?? "Your payment could not be completed.");
        setBusy(false);
        return;
      }
      ev.complete("success");

      if (paymentIntent && paymentIntent.status === "requires_action") {
        const { error: actionError } = await stripe.confirmCardPayment(
          piJson.clientSecret,
        );
        if (actionError) {
          setError(actionError.message ?? "Authentication failed.");
          setBusy(false);
          return;
        }
      }

      finalizeAndRedirect(
        orderJson.orderNumber,
        Number(orderJson.totalAmount) || total,
      );
    } catch (err) {
      try {
        ev.complete("fail");
      } catch {
        /* event may already be completed */
      }
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );
  useEffect(() => {
    if (!stripe || total <= 0) {
      setPaymentRequest(null);
      return;
    }
    const pr = stripe.paymentRequest({
      country: "GB",
      currency: "gbp",
      total: { label: "JoodLife order", amount: Math.round(total * 100) },
      requestPayerName: false,
      requestPayerEmail: false,
    });
    let active = true;
    pr.canMakePayment().then((result) => {
      if (!active) return;
      setPaymentRequest(result ? pr : null);
    });
    const handler = (ev: PaymentRequestPaymentMethodEvent) =>
      walletPayRef.current(ev);
    pr.on("paymentmethod", handler);
    return () => {
      active = false;
      pr.off("paymentmethod", handler);
    };
  }, [stripe, total]);

  /* ---------------- Redirecting to confirmation ---------------- */
  // Shown after a successful payment while we navigate to the thank-you
  // page — avoids the empty-cart screen flashing once the cart is cleared.
  if (redirecting) {
    return (
      <section className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#142e2a]/20 border-t-[#142e2a]"
        />
        <p className="mt-5 font-ui text-[15px] font-semibold text-[#142e2a]">
          Payment confirmed — taking you to your order&hellip;
        </p>
      </section>
    );
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
        {/* On mobile the order summary sits on top (order-1) and the form
            below (order-2); on desktop the form returns to the left column. */}
        <div className="order-2 rounded-[24px] border border-[#142e2a]/10 bg-white px-6 py-8 md:px-8 md:py-10 lg:order-1">
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
                  maxLength={NAME_PART_MAX}
                  error={namePartError(firstName)}
                />
              </Field>
              <Field label="Last Name" required>
                <TextInput
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                  maxLength={NAME_PART_MAX}
                  error={namePartError(lastName)}
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
                maxLength={TEXT_MAX}
              />
            </Field>

            <Field label="Address" required>
              <UkAddressField
                value={address}
                setValue={setAddress}
                onPick={({ city: c, postcode: pc }) => {
                  if (c) setCity(c);
                  if (pc) {
                    setPostcode(pc);
                    setPostcodeValid(true); // OSM only returns real UK addresses
                  }
                }}
                inputClassName="h-[52px] w-full rounded-[8px] border border-[#e7e8e3] bg-white px-4 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow placeholder:text-[#142e2a]/40 focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/20"
              />
            </Field>

            <Field label="Apartment, suit, etc. (optional)">
              <TextInput
                value={apartment}
                onChange={setApartment}
                autoComplete="address-line2"
                maxLength={ADDRESS_MAX}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City" required>
                <TextInput
                  value={city}
                  onChange={setCity}
                  autoComplete="address-level2"
                  placeholder="London"
                  maxLength={TEXT_MAX}
                />
              </Field>
              <Field label="Postcode" required>
                <UkPostcodeField
                  postcode={postcode}
                  setPostcode={setPostcode}
                  onResolveCity={(c) => {
                    if (c) setCity(c);
                  }}
                  onValidityChange={setPostcodeValid}
                  inputClassName="h-[52px] w-full rounded-[8px] border border-[#e7e8e3] bg-white px-4 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow placeholder:text-[#142e2a]/40 focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/20"
                />
              </Field>
            </div>

            <Field label="Phone" required>
              <TextInput
                value={phone}
                onChange={setPhone}
                type="tel"
                autoComplete="tel"
                placeholder="+44 7700 900000"
              />
              {phone.trim() && !phoneValid ? (
                <p className="mt-1.5 font-ui text-[13px] text-[#c0392b]">
                  Please enter a UK phone number — we only deliver within the UK
                  (for example 07700 900000 or +44 7700 900000).
                </p>
              ) : null}
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

            {/* Deliver to a different address? */}
            <label className="mt-1 flex cursor-pointer items-center gap-2.5 select-none">
              <input
                type="checkbox"
                checked={deliverElsewhere}
                onChange={(e) => setDeliverElsewhere(e.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border-[#142e2a]/30 accent-[#142e2a]"
              />
              <span className="font-ui text-[15px] text-[#545454]">
                Deliver to a different address
              </span>
            </label>

            {deliverElsewhere ? (
              <div className="mt-2 flex flex-col gap-4 rounded-[12px] border border-[#142e2a]/10 bg-[#f7f9f2] p-4">
                <p className="font-ui text-[15px] font-semibold text-[#142e2a]">
                  Delivery address
                </p>
                <Field label="Address" required>
                  <UkAddressField
                    value={dAddress}
                    setValue={setDAddress}
                    onPick={({ city: c, postcode: pc }) => {
                      if (c) setDCity(c);
                      if (pc) {
                        setDPostcode(pc);
                        setDPostcodeValid(true);
                      }
                    }}
                    inputClassName="h-[52px] w-full rounded-[8px] border border-[#e7e8e3] bg-white px-4 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow placeholder:text-[#142e2a]/40 focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/20"
                  />
                </Field>
                <Field label="Apartment, suite, etc. (optional)">
                  <TextInput
                    value={dApartment}
                    onChange={setDApartment}
                    autoComplete="off"
                    maxLength={ADDRESS_MAX}
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="City" required>
                    <TextInput
                      value={dCity}
                      onChange={setDCity}
                      placeholder="London"
                      maxLength={TEXT_MAX}
                    />
                  </Field>
                  <Field label="Postcode" required>
                    <UkPostcodeField
                      postcode={dPostcode}
                      setPostcode={setDPostcode}
                      onResolveCity={(c) => {
                        if (c) setDCity(c);
                      }}
                      onValidityChange={setDPostcodeValid}
                      inputClassName="h-[52px] w-full rounded-[8px] border border-[#e7e8e3] bg-white px-4 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow placeholder:text-[#142e2a]/40 focus:border-[#142e2a] focus:ring-2 focus:ring-[#142e2a]/20"
                    />
                  </Field>
                </div>
              </div>
            ) : null}
          </div>

          {/* 2. Payment */}
          <h2 className="mt-10 font-ui text-[20px] font-semibold leading-[24px] tracking-[-0.2px] text-[#142e2a]">
            <span className="mr-2 text-[#142e2a]">2.</span>Payment
          </h2>

          {/* Express checkout — Apple Pay / Google Pay (shown only when the
              device/browser supports a wallet). Falls back to card below. */}
          {paymentRequest ? (
            <div className="mt-5">
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      type: "default",
                      theme: "dark",
                      height: "52px",
                    },
                  },
                }}
              />
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#e7e8e3]" />
                <span className="font-ui text-[12px] text-[#142e2a]/55">
                  Or pay with card
                </span>
                <span className="h-px flex-1 bg-[#e7e8e3]" />
              </div>
            </div>
          ) : null}

          {/* Card is the only on-page method (Apple Pay / Google Pay are the
              express button above); no extra provider tabs. */}
          <div className="mt-5 flex w-fit items-center gap-2 rounded-[8px] border border-[#142e2a] bg-white px-4 py-2.5 font-ui text-[14px] font-semibold text-[#142e2a]">
            <CardGlyph />
            <span>Card</span>
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
                  onChange={(e) => {
                    setCardComplete(e.complete);
                    setCardError(e.error?.message ?? null);
                  }}
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
                    onChange={(e) => {
                      setExpiryComplete(e.complete);
                      setCardError(e.error?.message ?? null);
                    }}
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
                    onChange={(e) => {
                      setCvcComplete(e.complete);
                      setCardError(e.error?.message ?? null);
                    }}
                  />
                </div>
                <LockGlyph />
              </ElementBox>
            </div>
          </div>

          {cardError ? (
            <p className="mt-2 font-ui text-[13px] text-[#c0392b]">{cardError}</p>
          ) : null}

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
              </select>
              <ChevronGlyph className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Pay button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={busy}
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

          {/* If the Pay button is disabled, list exactly what's still needed.
              Silent disabled states confuse customers (and just confused us in
              QA — a non-UK postcode looked like a bug when it was actually
              the UK-only gate working). */}
          {attempted && !canPay && !busy ? (
            <ul className="mt-3 space-y-1 font-ui text-[12px] text-[#c0392b]">
              {items.length === 0 ? <li>• Your cart is empty.</li> : null}
              {!firstName.trim() || !lastName.trim() ? (
                <li>• Enter your first and last name.</li>
              ) : null}
              {!emailValid ? <li>• Enter a valid email address.</li> : null}
              {!address.trim() ? <li>• Enter your address.</li> : null}
              {!city.trim() ? <li>• Enter your city.</li> : null}
              {!postcodeOk ? (
                <li>
                  • Enter a valid <strong>UK postcode</strong> (e.g. SW1A 1AA).
                  We currently ship to UK addresses only.
                </li>
              ) : null}
              {!deliveryOk ? (
                <li>• Complete the delivery address (UK postcode required).</li>
              ) : null}
              {!phone.trim() ? (
                <li>• Enter your phone number.</li>
              ) : !phoneValid ? (
                <li>• Enter a valid UK phone number.</li>
              ) : null}
              {(!cardComplete || !expiryComplete || !cvcComplete)
                ? <li>• Complete the card number, expiry and CVC.</li>
                : null}
            </ul>
          ) : null}

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
            <span className="flex items-center gap-1.5 font-ui text-[12px] text-[#142e2a]/55">
              Powered by
              <span className="font-semibold text-[#635bff]">Stripe</span>
            </span>
          </div>

          {/* Accepted payment methods — card brands + wallets */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#eef0ea] pt-4">
            <span className="font-ui text-[12px] text-[#142e2a]/55">
              We accept
            </span>
            <span className="flex items-center gap-1.5">
              <VisaMark />
              <MastercardMark />
              <AmexMark />
              <ApplePayBadge />
              <GooglePayBadge />
            </span>
          </div>
        </div>

        {/* ════════ RIGHT: order summary (top on mobile) ════════ */}
        <aside className="order-1 lg:order-2 lg:pt-2">
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
                      maxLength={40}
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
            <span className="font-ui text-[16.3px] font-semibold tracking-[-0.32px] text-[#142e2a]">
              Today’s total
            </span>
            <span className="font-ui text-[25px] font-extrabold leading-[25.6px] tracking-[-0.49px] text-[#142e2a]">
              {formatPrice(total)}
            </span>
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
    <span className="mb-1.5 block font-ui text-[16.3px] font-semibold leading-[19.5px] tracking-[-0.32px] text-[#0a0a0a]">
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
  maxLength,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  /** Inline validation message; also flips the border to red. */
  error?: string | null;
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`h-[52px] w-full rounded-[8px] border bg-white px-4 font-ui text-[16px] text-[#142e2a] outline-none transition-shadow placeholder:text-[#142e2a]/40 focus:ring-2 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
            : "border-[#e7e8e3] focus:border-[#142e2a] focus:ring-[#142e2a]/20"
        }`}
      />
      {error ? (
        <p className="mt-1.5 font-ui text-[13px] text-red-600">{error}</p>
      ) : null}
    </>
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
    <div className="flex items-center justify-between font-ui text-[16.3px] tracking-[-0.32px]">
      <span className="font-semibold text-[#142e2a]">{label}</span>
      <span className={muted ? "font-semibold text-[#767676]" : "font-semibold text-[#142e2a]"}>
        {value}
      </span>
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

/* ---------------- Card brand marks (also used inside the card field) --- */
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
        fontFamily="inherit"
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
        fontFamily="inherit"
      >
        AMEX
      </text>
    </svg>
  );
}

/* ---------------- Wallet badges (authentic Apple/Google Pay marks) ----- */
const WALLET_BADGE =
  "inline-flex h-[18px] items-center gap-[2px] rounded-[3px] px-1.5";

function ApplePayBadge() {
  return (
    <span className={`${WALLET_BADGE} bg-black`} aria-label="Apple Pay">
      <svg width="9" height="11" viewBox="0 0 384 512" aria-hidden fill="#fff">
        <path d="M318.7 268c-.3-36.7 16.4-64.4 50.1-84.8-18.9-27-47.5-41.9-85.1-44.8-35.8-2.8-74.9 21-89.3 21-15.2 0-49.8-20-77.1-20C61.2 140.3 0 184.8 0 275.8c0 27.7 5.1 56.3 15.2 85.8 13.6 38.8 62.8 134 114.2 132.4 26.9-.6 45.9-19.1 80.9-19.1 34 0 51.6 19.1 81.6 19.1 51.9-.7 96.4-87.2 109.3-126.1-69.6-32.8-69.6-96.2-69.6-98.2zM258.1 92.4c19.9-24.2 18.1-46.2 17.5-54.1-16.9 1-36.5 11.5-47.7 24.5-12.4 14-19.7 31.3-18.1 53.7 18.3 1.4 35-8 48.3-24.1z" />
      </svg>
      <span className="font-ui text-[11px] font-medium leading-none text-white">
        Pay
      </span>
    </span>
  );
}
function GooglePayBadge() {
  return (
    <span
      className={`${WALLET_BADGE} border border-[#e7e8e3] bg-white`}
      aria-label="Google Pay"
    >
      <span className="font-ui text-[11px] font-semibold leading-none">
        <span style={{ color: "#4285F4" }}>G</span>
        <span style={{ color: "#EA4335" }}>o</span>
        <span style={{ color: "#FBBC04" }}>o</span>
        <span style={{ color: "#4285F4" }}>g</span>
        <span style={{ color: "#34A853" }}>l</span>
        <span style={{ color: "#EA4335" }}>e</span>
      </span>
      <span className="font-ui text-[11px] font-semibold leading-none text-[#5f6368]">
        Pay
      </span>
    </span>
  );
}
