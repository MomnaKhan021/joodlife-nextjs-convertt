"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

/**
 * Embedded Stripe Payment Element + the real "Place Order" button.
 *
 * The button stays DISABLED until the card details entered in the
 * Payment Element are complete and valid (`onChange.complete`). On
 * submit we confirm the PaymentIntent; card data is tokenised in the
 * browser by Stripe.js and never reaches our server. The webhook
 * (payment_intent.succeeded) is the source of truth for the order.
 */
export default function EmbeddedPayment({
  total,
  returnUrl,
  onPaid,
}: {
  total: number;
  returnUrl: string;
  /** Called when payment succeeds without a redirect (e.g. non-3DS). */
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLabel = total.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  });

  const canPay = Boolean(stripe && elements && cardComplete && !busy);

  async function handlePlaceOrder() {
    if (!stripe || !elements || !cardComplete || busy) return;
    setBusy(true);
    setError(null);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message ?? "Payment could not be completed.");
      setBusy(false);
      return;
    }
    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing")
    ) {
      onPaid();
      return; // keep busy=true while we navigate away
    }
    // requires_action that didn't redirect, or unexpected state
    setError("Payment was not completed. Please try again.");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement
        onChange={(e) => setCardComplete(e.complete)}
        options={{ layout: "tabs" }}
      />

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={!canPay}
        className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-lg bg-[#142e2a] px-6 font-ui text-[14px] font-semibold text-white transition-all hover:bg-[#0c2421] hover:shadow-[0_8px_18px_rgba(20,46,42,0.16)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#142e2a]"
      >
        {busy ? (
          <>
            <span
              aria-hidden
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Processing payment…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            Place order · Pay {totalLabel}
          </>
        )}
      </button>

      {!cardComplete ? (
        <p className="text-center font-ui text-[12px] text-[#142e2a]/55">
          Enter your card details above to enable “Place order”.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
