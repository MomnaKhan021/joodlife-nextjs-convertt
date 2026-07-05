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
    title: "Cancel anytime",
    body: "No long-term commitments — you're always in control.",
  },
  {
    title: "Never think about reordering",
    body: "Discreet deliveries keep you topped up, right on time.",
  },
  {
    title: "Email reminders",
    body: "Get details before each shipment is due, so nothing catches you out.",
  },
  {
    title: "Edit your plan anytime",
    body: "Pause, adjust or skip a delivery at any time with no extra fees.",
  },
];

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 shrink-0 text-[#142e2a]"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.58l-1.3-1.3a1 1 0 0 0-1.4 1.42l2 2a1 1 0 0 0 1.4 0l4-4Z"
        clipRule="evenodd"
      />
    </svg>
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
        <h1 className="font-display text-[30px] font-bold leading-[36px] tracking-[-0.02em] text-[#142e2a] md:text-[42px] md:leading-[48px]">
          Choose your{" "}
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
          <div className="rounded-[16px] border border-[#142e2a]/12 bg-white p-5 shadow-[0_8px_30px_-16px_rgba(20,46,42,0.25)] md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f2ecf2]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                <div>
                  <p className="font-ui text-[15px] font-semibold text-[#142e2a]">
                    One-time purchase
                  </p>
                  <p className="font-ui text-[13px] text-[#142e2a]/60">
                    {item.title} · {item.dose}
                  </p>
                </div>
              </div>
              <span className="font-display text-[20px] font-bold text-[#142e2a]">
                {fmtGBP(item.price)}
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-2 border-t border-[#142e2a]/10 pt-4">
              {[
                "Pay for this pack today",
                "No subscription",
                "No ongoing commitment",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 font-ui text-[13px] text-[#142e2a]/80"
                >
                  <Check />
                  {t}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={checkout}
              disabled={busy}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
            >
              {busy ? "Loading…" : "Checkout"}
            </button>
          </div>

          {/* Commitment */}
          <div className="mt-8 rounded-[16px] border border-[#142e2a]/12 bg-[#f7f9f2] p-5 md:p-6">
            <h2 className="font-display text-[20px] font-bold text-[#142e2a]">
              Our commitment to your journey
            </h2>
            <p className="mt-2 font-ui text-[13px] leading-[20px] text-[#142e2a]/75">
              We&rsquo;re committed to supporting you with safe, evidence-based
              treatment and ongoing clinical care, tailored to your individual
              needs.
            </p>
          </div>

          {/* You're in control */}
          <div className="mt-8">
            <h2 className="font-display text-[24px] font-bold text-[#142e2a]">
              You&rsquo;re in{" "}
              <em className="font-serif font-normal italic">control</em>
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {CONTROL_POINTS.map((c) => (
                <li key={c.title} className="flex items-start gap-3">
                  <Check />
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
            <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-ui text-[13px] font-semibold text-[#142e2a]">
                  {item.title} · {item.dose}
                </p>
                <p className="font-ui text-[12px] text-[#142e2a]/60">
                  {fmtGBP(item.price)} · one-time
                </p>
              </div>
              <button
                type="button"
                onClick={checkout}
                disabled={busy}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] disabled:opacity-60"
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
