"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/CartContext";

/** A single selectable dose (label + numeric pack price). */
export type FlowDose = { label: string; price: number };

/** A treatment the patient can choose after their consultation. */
export type FlowProduct = {
  slug: string;
  productId: number;
  title: string;
  italicWord: string;
  image: string;
  lede: string;
  /** Short one-line description shown on the selector row. */
  blurb: string;
  /** Marks the clinically recommended option (expanded by default). */
  recommended?: boolean;
  doses: FlowDose[];
};

function fmtGBP(n: number) {
  return `£${n.toFixed(2)}`;
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
 * Post-consultation treatment picker (Figma "Choose your treatment").
 *
 * The patient chooses a treatment and a dose; a sticky bottom bar mirrors
 * the selection and its price. "Continue" carries the choice to the
 * "Choose your frequency" page (final-product-page/plan), which in turn
 * hands the item to /checkout.
 */
export default function FinalProductClient({
  products,
}: {
  products: FlowProduct[];
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);

  // Default to the recommended product (or the first one).
  const defaultSlug =
    products.find((p) => p.recommended)?.slug ?? products[0]?.slug ?? "";
  const [activeSlug, setActiveSlug] = useState(defaultSlug);
  const [doseIdx, setDoseIdx] = useState(0);

  const active = useMemo(
    () => products.find((p) => p.slug === activeSlug) ?? products[0],
    [products, activeSlug],
  );

  if (!active) return null;
  const dose = active.doses[doseIdx] ?? active.doses[0];

  // Continue goes STRAIGHT to checkout carrying the selected product +
  // variant (no intermediate "choose your frequency" step).
  function goToCheckout() {
    if (busy || !active || !dose) return;
    setBusy(true);
    addItem({
      productId: active.productId,
      slug: active.slug,
      title: active.title,
      dose: dose.label,
      price: dose.price,
      imageUrl: active.image || null,
    });
    router.push("/checkout");
  }

  const fromPrice = (p: FlowProduct) =>
    Math.min(...p.doses.map((d) => d.price));

  return (
    <>
      <section
        aria-label="Choose your treatment"
        className="bg-[#f7f9f2] px-4 pb-24 pt-2 md:px-10 md:pb-16 lg:px-[60px]"
      >
        <div className="mx-auto w-full max-w-[880px] rounded-[24px] border border-[#142e2a]/10 bg-white p-4 shadow-[0_10px_40px_-24px_rgba(20,46,42,0.25)] md:p-6">
          <ul className="flex flex-col gap-4">
            {products.map((p) => {
              const on = p.slug === active.slug;
              return (
                <li key={p.slug} className="relative">
                  {/* Selectable product row */}
                  <div
                    className={`rounded-[16px] border transition-colors ${
                      on
                        ? "border-[#142e2a]"
                        : "border-[#142e2a]/15 hover:border-[#142e2a]/40"
                    }`}
                  >
                    {/* Recommended badge */}
                    {p.recommended ? (
                      <span className="absolute -top-3 left-4 z-10 inline-flex items-center rounded-md bg-[#142e2a] px-3 py-1 font-ui text-[12px] font-semibold text-white">
                        Recommended
                      </span>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveSlug(p.slug);
                        setDoseIdx(0);
                      }}
                      aria-pressed={on}
                      className="flex w-full items-center gap-4 p-4 text-left md:p-5"
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[#f2ecf2] md:h-[84px] md:w-[84px]">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.title}
                            fill
                            sizes="84px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[17px] font-bold leading-[22px] text-[#142e2a] md:text-[19px]">
                          {p.title}
                        </span>
                        <span className="mt-0.5 block font-ui text-[13px] leading-[18px] text-[#142e2a]/70 md:text-[14px]">
                          {p.blurb}
                        </span>
                        <span className="mt-1 block font-ui text-[13px] font-medium text-[#142e2a] md:text-[14px]">
                          From{" "}
                          <span className="font-bold">
                            {fmtGBP(fromPrice(p))}
                          </span>
                        </span>
                      </span>
                      {on ? <CheckCircle /> : null}
                    </button>

                    {/* Expanded dose selector for the active product */}
                    {on ? (
                      <div className="border-t border-[#142e2a]/10 px-4 pb-4 pt-4 md:px-5 md:pb-5">
                        {/* Dose grid only when the product has real dose
                            options — a single-price product (e.g. the pill)
                            shows just its price, no fabricated dose grid. */}
                        {active.doses.length > 1 ? (
                          <>
                            <p className="font-ui text-[14px] font-semibold text-[#142e2a]">
                              Select your preferred dose
                            </p>
                            <p className="mt-0.5 font-ui text-[13px] text-[#142e2a]/60">
                              The final dosage is determined at your
                              clinician&rsquo;s discretion.
                            </p>

                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                              {active.doses.map((d, i) => {
                                const sel = i === doseIdx;
                                return (
                                  <button
                                    key={d.label || i}
                                    type="button"
                                    onClick={() => setDoseIdx(i)}
                                    aria-pressed={sel}
                                    className={`flex flex-col items-center rounded-[10px] border px-2 py-2 transition-colors ${
                                      sel
                                        ? "border-[#142e2a] bg-[#142e2a] text-white"
                                        : "border-[#142e2a]/20 bg-white text-[#142e2a] hover:border-[#142e2a]"
                                    }`}
                                  >
                                    <span className="font-ui text-[14px] font-bold leading-[18px]">
                                      {d.label}
                                    </span>
                                    <span
                                      className={`font-ui text-[12px] leading-[16px] ${
                                        sel ? "text-white/80" : "text-[#142e2a]/60"
                                      }`}
                                    >
                                      {fmtGBP(d.price)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : null}

                        <div
                          className={`flex items-center justify-between ${
                            active.doses.length > 1
                              ? "mt-4 border-t border-[#142e2a]/10 pt-4"
                              : ""
                          }`}
                        >
                          <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
                            {dose?.label ? `${dose.label} ` : ""}
                            {active.title}
                          </span>
                          <span className="font-display text-[16px] font-bold text-[#142e2a]">
                            {fmtGBP(dose?.price ?? 0)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={goToCheckout}
                          disabled={busy}
                          className="btn-cta mt-4 inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-[#142e2a] px-8 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
                        >
                          {busy ? "Loading…" : `Continue With ${active.title}`}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#142e2a]/10 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_-12px_rgba(20,46,42,0.25)] backdrop-blur md:px-10 lg:px-[60px]">
        <div className="mx-auto flex w-full max-w-[880px] flex-col items-center gap-1">
          <button
            type="button"
            onClick={goToCheckout}
            disabled={busy}
            className="btn-cta inline-flex h-[50px] w-full max-w-[420px] items-center justify-center rounded-xl bg-[#142e2a] px-6 font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421] disabled:opacity-60"
          >
            {busy ? "Loading…" : `Continue With ${active.title}`}
          </button>
        </div>
      </div>
    </>
  );
}
