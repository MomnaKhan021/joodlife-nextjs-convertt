"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/CartContext";

function fmtGBP(n: number) {
  return `£${n.toFixed(2)}`;
}

const CONTROL_POINTS = [
  {
    icon: "clock",
    title: "Cancel anytime",
    body: "No long-term commitments.",
  },
  {
    icon: "box",
    title: "Never think about reordering",
    body: "Discreet deliveries keep you topped up.",
  },
  {
    icon: "mail",
    title: "Email reminders",
    body: "Get emails before each shipment is due.",
  },
  {
    icon: "edit",
    title: "Edit your subscription anytime",
    body: "You can pause, adjust, or skip your delivery at any time with no additional fees.",
  },
] as const;

const CONTROL_ICON_PATHS: Record<string, string> = {
  clock: "M10 5v5l3 2M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z",
  box: "M3 6l7-3 7 3v8l-7 3-7-3V6Zm0 0l7 3 7-3M10 9v9",
  mail: "M3 5h14v10H3V5Zm0 1l7 5 7-5",
  edit: "M4 13.5V16h2.5l7-7-2.5-2.5-7 7ZM12.5 4.5L15.5 7.5",
};

function ControlIcon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 shrink-0 text-[#142e2a]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={CONTROL_ICON_PATHS[name] ?? CONTROL_ICON_PATHS.clock} />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 shrink-0 text-[#142e2a]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5l3.5 3.5L16 6" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#142e2a]">
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-white" fill="none">
        <path
          d="M5 10.5l3.2 3.2L15 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/**
 * "Choose your frequency" — the step after picking a treatment/dose.
 *
 * Reads the selected product/dose/price from the query string (set by the
 * Final Product page), shows a one-time purchase plan, and on Checkout adds
 * the item to the cart and routes to /checkout.
 */
export default function PlanClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);

  const item = useMemo(() => {
    const slug = params.get("product") ?? "";
    const title = params.get("title") ?? "Your treatment";
    const dose = params.get("dose") || null;
    const price = Number(params.get("price") ?? 0) || 0;
    const productId = Number(params.get("pid") ?? 0) || 0;
    const image = params.get("img") || null;
    return { slug, title, dose, price, productId, image };
  }, [params]);

  const valid = item.productId > 0 && item.price > 0;

  function checkout() {
    if (busy || !valid) return;
    setBusy(true);
    addItem({
      productId: item.productId,
      slug: item.slug,
      title: item.title,
      dose: item.dose,
      price: item.price,
      imageUrl: item.image,
    });
    router.push("/checkout");
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 pb-28 pt-8 md:px-8 md:pb-16 md:pt-12">
      <header className="mb-8 text-center">
        <h1 className="font-display text-[30px] font-bold leading-[36px] tracking-[-0.02em] text-[#142e2a] md:text-[46px] md:leading-[52px]">
          Choose your
          <br />
          <em className="font-serif font-normal italic">frequency</em>
        </h1>
      </header>

      {!valid ? (
        <div className="rounded-[16px] border border-[#142e2a]/12 bg-[#f7f9f2] p-6 text-center">
          <p className="font-ui text-[14px] text-[#142e2a]/80">
            We couldn&rsquo;t find your selected treatment. Please choose a
            treatment and dose first.
          </p>
          <button
            type="button"
            onClick={() => router.push("/final-product-page")}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-bold uppercase tracking-[0.04em] text-white hover:bg-[#0c2421]"
          >
            Choose treatment
          </button>
        </div>
      ) : (
        <>
          {/* Plan card */}
          <div className="rounded-[20px] border border-[#142e2a]/12 bg-white p-4 shadow-[0_8px_30px_-16px_rgba(20,46,42,0.25)] md:p-6">
            {/* Selected option */}
            <div className="relative rounded-[16px] border border-[#142e2a] p-5 md:p-6">
              <span className="absolute -top-3 right-4">
                <CheckCircle />
              </span>
              <div className="flex items-start justify-between gap-4">
                <p className="font-display text-[18px] font-bold text-[#142e2a] md:text-[20px]">
                  One-time Purchase
                </p>
                <span className="font-display text-[18px] font-bold text-[#142e2a] md:text-[20px]">
                  {fmtGBP(item.price)}
                </span>
              </div>

              <ul className="mt-4 flex flex-col gap-3 border-t border-[#142e2a]/10 pt-4">
                {[
                  "Pay for this treatment today",
                  "No subscription",
                  "No ongoing commitment",
                ].map((t) => (
                  <li
                    key={t}
                    className="flex items-center gap-2.5 font-ui text-[14px] text-[#142e2a]"
                  >
                    <CheckMark />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={checkout}
              disabled={busy}
              className="btn-cta mx-auto mt-5 flex h-[52px] w-full max-w-[360px] items-center justify-center rounded-xl bg-[#142e2a] px-8 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
            >
              {busy ? "Loading…" : "Checkout"}
            </button>
          </div>

          {/* Commitment */}
          <div className="mt-8 flex items-center justify-between gap-6 rounded-[20px] border border-[#142e2a]/12 bg-white p-5 md:p-6">
            <div className="min-w-0">
              <h2 className="font-display text-[20px] font-bold text-[#142e2a] md:text-[24px]">
                Our commitment to your journey
              </h2>
              <p className="mt-2 font-ui text-[13px] leading-[20px] text-[#142e2a]/75">
                We&rsquo;re committed to supporting you with safe, evidence-based
                treatment and ongoing clinical care, tailored to your individual
                needs.
              </p>
            </div>
            <Image
              src="/assets/checkout/money-back-badge.png"
              alt="Money back promise"
              width={80}
              height={80}
              className="hidden h-16 w-16 shrink-0 object-contain sm:block md:h-20 md:w-20"
            />
          </div>

          {/* You're in control */}
          <div className="mt-8">
            <h2 className="font-display text-[24px] font-bold text-[#142e2a] md:text-[28px]">
              You&rsquo;re in{" "}
              <em className="font-serif font-normal italic">control</em>
            </h2>
            <ul className="mt-5 flex flex-col gap-5">
              {CONTROL_POINTS.map((c) => (
                <li key={c.title} className="flex items-start gap-3">
                  <ControlIcon name={c.icon} />
                  <div>
                    <p className="font-ui text-[14px] font-semibold text-[#142e2a]">
                      {c.title}
                    </p>
                    <p className="font-ui text-[13px] leading-[20px] text-[#142e2a]/70">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Sticky checkout bar */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#142e2a]/10 bg-white/95 px-5 py-3 shadow-[0_-6px_24px_-12px_rgba(20,46,42,0.25)] backdrop-blur">
            <div className="mx-auto flex w-full max-w-[720px] justify-center">
              <button
                type="button"
                onClick={checkout}
                disabled={busy}
                className="btn-cta inline-flex h-[50px] w-full max-w-[360px] shrink-0 items-center justify-center rounded-xl bg-[#142e2a] px-6 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
              >
                {busy ? "Loading…" : "Checkout"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
