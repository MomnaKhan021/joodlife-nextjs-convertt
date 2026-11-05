"use client";

import { useState } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  Stripe,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementOptions,
} from "@stripe/stripe-js";

/** What the wallet tells us about the customer. */
export type WalletDetails = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
};

/** An order created on our side, ready for the wallet to pay. */
export type WalletOrder = {
  orderNumber: string;
  clientSecret: string;
  amount: number;
};

const ELEMENT_OPTIONS: StripeExpressCheckoutElementOptions = {
  emailRequired: true,
  phoneNumberRequired: true,
  shippingAddressRequired: true,
  allowedShippingCountries: ["GB"],
  shippingRates: [{ id: "free-delivery", displayName: "Free delivery", amount: 0 }],
  // Apple Pay and Google Pay only, on every device that supports them.
  paymentMethods: {
    applePay: "always",
    googlePay: "always",
    link: "never",
    paypal: "never",
    amazonPay: "never",
    klarna: "never",
  },
  buttonHeight: 52,
  layout: { maxColumns: 2, maxRows: 1, overflow: "never" },
};

type ButtonsProps = {
  error: string | null;
  /** Creates the order. Reports its own errors and returns null on failure. */
  prepareOrder: (details: WalletDetails) => Promise<WalletOrder | null>;
  onPaid: (order: WalletOrder, details: WalletDetails) => void;
  onError: (message: string) => void;
};

function readDetails(event: StripeExpressCheckoutElementConfirmEvent): WalletDetails {
  const billing = event.billingDetails;
  const shipping = event.shippingAddress;
  return {
    name: (shipping?.name || billing?.name || "").trim(),
    email: (billing?.email || "").trim(),
    phone: (billing?.phone || "").trim(),
    line1: (shipping?.address?.line1 || "").trim(),
    line2: (shipping?.address?.line2 || "").trim(),
    city: (shipping?.address?.city || "").trim(),
    postcode: (shipping?.address?.postal_code || "").trim().toUpperCase(),
  };
}

function ExpressButtons({ error, prepareOrder, onPaid, onError }: ButtonsProps) {
  const stripe = useStripe();
  const elements = useElements();
  // Stays hidden unless this device can actually show a wallet button.
  const [available, setAvailable] = useState(false);

  async function handleConfirm(event: StripeExpressCheckoutElementConfirmEvent) {
    if (!stripe || !elements) {
      event.paymentFailed({ reason: "fail" });
      return;
    }
    const { error: submitError } = await elements.submit();
    if (submitError) {
      onError(submitError.message ?? "Your payment could not be completed.");
      event.paymentFailed({ reason: "fail" });
      return;
    }

    const details = readDetails(event);
    const order = await prepareOrder(details);
    if (!order) {
      event.paymentFailed({ reason: "fail" });
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: order.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`,
      },
      redirect: "if_required",
    });
    if (
      confirmError ||
      !paymentIntent ||
      (paymentIntent.status !== "succeeded" && paymentIntent.status !== "processing")
    ) {
      onError(confirmError?.message ?? "Your payment could not be completed.");
      event.paymentFailed({ reason: "fail" });
      return;
    }
    onPaid(order, details);
  }

  return (
    <div className={available ? "mb-8" : "invisible h-0 overflow-hidden"}>
      <p className="mb-3 text-center font-ui text-[13px] font-semibold text-[#142e2a]">
        Express checkout
      </p>
      <ExpressCheckoutElement
        options={ELEMENT_OPTIONS}
        onReady={(e) => setAvailable(Boolean(e.availablePaymentMethods))}
        onConfirm={handleConfirm}
      />
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-4 py-3 font-ui text-[13px] text-red-700"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e7e8e3]" />
        <span className="font-ui text-[12px] text-[#142e2a]/55">
          Or enter your details below
        </span>
        <span className="h-px flex-1 bg-[#e7e8e3]" />
      </div>
    </div>
  );
}

/**
 * Apple Pay / Google Pay buttons for the top of the checkout. They have their
 * own Stripe provider (Express Checkout needs the amount up front), which keeps
 * them separate from the card fields further down the page.
 */
export default function ExpressCheckout({
  stripe,
  total,
  ...buttons
}: ButtonsProps & { stripe: Promise<Stripe | null>; total: number }) {
  return (
    <Elements
      stripe={stripe}
      options={{
        mode: "payment",
        amount: Math.round(total * 100),
        currency: "gbp",
        appearance: { variables: { borderRadius: "8px" } },
      }}
    >
      <ExpressButtons {...buttons} />
    </Elements>
  );
}
