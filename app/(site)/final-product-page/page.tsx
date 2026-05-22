import Image from "next/image";
import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import UspStrip from "@/components/home/UspStrip";
import HowItWorks from "@/sections/home/HowItWorks";
import Reviews from "@/sections/home/Reviews";
import CtaBanner from "@/sections/home/CtaBanner";
import ComparisonTable from "@/components/pdp/ComparisonTable";

import { PDP_PRODUCTS } from "@/lib/pdp-products";

export const metadata = {
  title: "Choose your treatment — JoodLife",
  description:
    "You're a candidate for weight-loss treatment. Pick the medication that best fits your goals.",
};

/**
 * Post-consultation landing — mirrors the shape of
 * joodlife.com/pages/final-product-page: an "eligible, now choose" banner
 * followed by a treatment selection grid (Mounjaro / Wegovy / Saxenda),
 * an evidence-based comparison table, a how-it-works strip, social
 * proof, and the standard footer CTA.
 *
 * Each product card surfaces the lowest dose, the lowest "from"
 * monthly price, and a single CTA that deep-links to the PDP for that
 * product so the user can pick a dose and add to cart.
 */
export default function FinalProductPage() {
  const products = ["mounjaro", "wegovy", "saxenda"] as const;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* ─────────  Eligibility hero  ───────── */}
      <section
        aria-label="You are eligible"
        className="bg-[#f7f9f2] px-6 pb-10 pt-12 md:px-10 md:pt-16 md:pb-14 lg:px-[60px]"
      >
        <div className="mx-auto w-full max-w-[1400px] text-center">
          <span className="inline-flex items-center rounded-full bg-[#dff49f] px-3 py-1 font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]">
            Eligible
          </span>
          <h1 className="mt-4 font-display text-[32px] font-bold leading-[38px] tracking-[-0.02em] text-[#142e2a] md:text-[44px] md:leading-[52px]">
            Choose your treatment
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] font-ui text-[15px] leading-[24px] text-[#142e2a]/75 md:text-[16px] md:leading-[26px]">
            Based on your consultation, you can start any of the treatments
            below. A UK-licensed clinician reviews every order before
            dispatch.
          </p>
        </div>
      </section>

      {/* ─────────  Treatment cards  ───────── */}
      <section
        aria-label="Treatment options"
        className="bg-white px-6 py-12 md:px-10 md:py-16 lg:px-[60px]"
      >
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {products.map((slug) => {
            const product = PDP_PRODUCTS[slug];
            if (!product) return null;
            const primary = product.gallery[0];
            return (
              <article
                key={slug}
                className="flex flex-col gap-5 rounded-[24px] border border-[#142e2a]/10 bg-white p-5 transition-shadow duration-200 hover:shadow-[0_8px_28px_-12px_rgba(20,46,42,0.18)] md:p-6"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-[#e5d3e5]">
                  {primary ? (
                    <Image
                      src={primary.src}
                      alt={primary.alt}
                      fill
                      sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 28vw"
                      quality={90}
                      className="object-cover"
                    />
                  ) : null}
                  {product.discountBadge ? (
                    <span className="absolute right-4 top-4 inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white font-display text-[13px] font-bold text-[#142e2a] shadow-md">
                      {product.discountBadge}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="inline-flex w-fit items-center rounded-full bg-[#f7f9f2] px-2.5 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.05em] text-[#142e2a]/70">
                    Clinically Recommended
                  </span>
                  <h2 className="font-display text-[26px] font-bold leading-[30px] tracking-[-0.01em] text-[#142e2a] md:text-[28px] md:leading-[34px]">
                    {product.title}{" "}
                    <em className="font-serif italic font-normal">
                      {product.italicWord}
                    </em>
                  </h2>
                  <p className="font-ui text-[13px] leading-[20px] text-[#142e2a]/70">
                    {product.lede.slice(0, 140)}
                    {product.lede.length > 140 ? "…" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-ui text-[13px] text-[#142e2a]/70">
                    From
                  </span>
                  <span className="font-display text-[24px] font-bold tracking-[-0.01em] text-[#142e2a]">
                    {product.fromPrice}
                  </span>
                  <span className="font-ui text-[13px] text-[#142e2a]/70">
                    /month
                  </span>
                </div>

                {/* Quick-glance dosages */}
                <div className="flex flex-wrap gap-1.5">
                  {product.dosages.slice(0, 6).map((d) => (
                    <span
                      key={d.label}
                      className="inline-flex items-center rounded-md bg-[#f7f9f2] px-2 py-1 font-ui text-[11px] font-medium text-[#142e2a]/80"
                    >
                      {d.label}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/shop/${slug}`}
                  className="mt-auto inline-flex h-[48px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-5 font-ui text-[13px] font-bold uppercase tracking-[0.06em] text-white transition-colors duration-200 hover:bg-[#0c2421] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142e2a]"
                >
                  Continue with {product.title}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* ─────────  USP marquee  ───────── */}
      <UspStrip />

      {/* ─────────  Comparison table  ───────── */}
      <section
        aria-label="Comparison of GLP-1 treatments"
        className="w-full bg-white py-12 md:py-16 lg:py-[80px]"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <ComparisonTable active="mounjaro" />
        </div>
      </section>

      {/* ─────────  Social proof + how-it-works  ───────── */}
      <Reviews />
      <HowItWorks />
      <CtaBanner />

      <Footer />
    </main>
  );
}
