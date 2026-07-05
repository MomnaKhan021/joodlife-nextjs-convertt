"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  doses: FlowDose[];
};

function fmtGBP(n: number) {
  return `£${n.toFixed(2)}`;
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
  const [activeSlug, setActiveSlug] = useState(products[0]?.slug ?? "");
  const active = useMemo(
    () => products.find((p) => p.slug === activeSlug) ?? products[0],
    [products, activeSlug],
  );
  const [doseIdx, setDoseIdx] = useState(0);

  if (!active) return null;
  const dose = active.doses[doseIdx] ?? active.doses[0];

  const continueHref =
    `/final-product-page/plan?` +
    new URLSearchParams({
      product: active.slug,
      pid: String(active.productId),
      title: active.title,
      dose: dose?.label ?? "",
      price: String(dose?.price ?? 0),
      img: active.image,
    }).toString();

  return (
    <>
      <section
        aria-label="Choose your treatment"
        className="bg-white px-5 pb-28 pt-8 md:px-10 md:pb-16 md:pt-12 lg:px-[60px]"
      >
        <div className="mx-auto w-full max-w-[880px]">
          {/* Treatment switcher */}
          {products.length > 1 ? (
            <div
              role="tablist"
              aria-label="Available treatments"
              className="mb-6 flex flex-wrap gap-2"
            >
              {products.map((p) => {
                const on = p.slug === active.slug;
                return (
                  <button
                    key={p.slug}
                    role="tab"
                    aria-selected={on}
                    type="button"
                    onClick={() => {
                      setActiveSlug(p.slug);
                      setDoseIdx(0);
                    }}
                    className={`rounded-full px-4 py-2 font-ui text-[13px] font-semibold transition-colors ${
                      on
                        ? "bg-[#142e2a] text-white"
                        : "bg-[#f7f9f2] text-[#142e2a] hover:bg-[#e7ecd7]"
                    }`}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Product card */}
          <div className="rounded-[20px] border border-[#142e2a]/12 bg-white p-4 shadow-[0_8px_30px_-16px_rgba(20,46,42,0.25)] md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[16px] bg-[#f2ecf2] md:h-[168px] md:w-[168px]">
                {active.image ? (
                  <Image
                    src={active.image}
                    alt={active.title}
                    fill
                    sizes="(max-width:768px) 90vw, 168px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center rounded-full bg-[#dff49f] px-2.5 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-[#142e2a]">
                  Clinically recommended
                </span>
                <h2 className="mt-2 font-display text-[24px] font-bold leading-[28px] tracking-[-0.01em] text-[#142e2a] md:text-[28px] md:leading-[32px]">
                  {active.title}{" "}
                  <em className="font-serif font-normal italic">
                    {active.italicWord}
                  </em>
                </h2>
                <p className="mt-2 font-ui text-[13px] leading-[20px] text-[#142e2a]/70">
                  {active.lede.slice(0, 120)}
                  {active.lede.length > 120 ? "…" : ""}
                </p>
              </div>
            </div>

            {/* Dose selector */}
            <div className="mt-5">
              <p className="mb-2 font-ui text-[13px] font-semibold text-[#142e2a]">
                Select your dose
              </p>
              <div className="flex flex-wrap gap-2">
                {active.doses.map((d, i) => {
                  const on = i === doseIdx;
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setDoseIdx(i)}
                      aria-pressed={on}
                      className={`rounded-lg border px-3 py-2 font-ui text-[13px] font-medium transition-colors ${
                        on
                          ? "border-[#142e2a] bg-[#142e2a] text-white"
                          : "border-[#142e2a]/20 bg-white text-[#142e2a] hover:border-[#142e2a]"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price + inline continue (desktop) */}
            <div className="mt-6 flex flex-col gap-3 border-t border-[#142e2a]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[26px] font-bold tracking-[-0.01em] text-[#142e2a]">
                  {fmtGBP(dose?.price ?? 0)}
                </span>
                <span className="font-ui text-[13px] text-[#142e2a]/60">
                  per pack · {dose?.label}
                </span>
              </div>
              <Link
                href={continueHref}
                className="hidden h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421] sm:inline-flex"
              >
                Continue
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#142e2a]/10 bg-white/95 px-5 py-3 shadow-[0_-6px_24px_-12px_rgba(20,46,42,0.25)] backdrop-blur md:px-10 lg:px-[60px]">
        <div className="mx-auto flex w-full max-w-[880px] items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-ui text-[13px] font-semibold text-[#142e2a]">
              {active.title} · {dose?.label}
            </p>
            <p className="font-ui text-[12px] text-[#142e2a]/60">
              {fmtGBP(dose?.price ?? 0)} per pack
            </p>
          </div>
          <Link
            href={continueHref}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Continue
          </Link>
        </div>
      </div>
    </>
  );
}
