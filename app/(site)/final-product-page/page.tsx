import Image from "next/image";
import Link from "next/link";

import WhatIsSection from "@/components/pdp/WhatIsSection";
import SafetyFaq from "@/components/pdp/SafetyFaq";
import ComparisonTable from "@/components/pdp/ComparisonTable";

import { PDP_PRODUCTS } from "@/lib/pdp-products";
import { getStorefrontProduct } from "@/lib/products";
import {
  CATEGORY_HEADING,
  getCatalogProducts,
  resolveCategory,
} from "@/lib/flow-catalog";
import FinalProductClient, { type FlowProduct } from "./FinalProductClient";
import NextSteps from "./NextSteps";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Choose your treatment — JoodLife",
  description:
    "You're a candidate for treatment. Pick the medication and dose that best fits your goals.",
};

type Props = {
  searchParams: Promise<{ category?: string | string[] }>;
};

/** Fallback numeric IDs if the DB product can't be resolved (matches PDP). */
const FALLBACK_ID: Record<string, number> = {
  mounjaro: 1001,
  wegovy: 1002,
  saxenda: 1003,
};

/** Short selector-row descriptions + recommended flag + thumbnail for
 * weight-loss. `image` is the local fallback used when the dashboard
 * product image (heroImageUrl) isn't available. */
const WL_META: Record<
  string,
  { blurb: string; recommended?: boolean; image: string }
> = {
  mounjaro: {
    blurb: "Advanced dual-action treatment for appetite control.",
    recommended: true,
    image: "/assets/figma/pdp/mounjaro-1.png",
  },
  wegovy: {
    blurb: "Once-weekly injection to support long-term weight management.",
    image: "/assets/category/wl-wegovy.png",
  },
  saxenda: {
    blurb: "Daily injection that helps manage appetite and cravings.",
    image: "/assets/figma/mounjaro-hero.png",
  },
};

/** "£90.00" → 90 */
function parsePrice(formatted: string): number {
  const m = formatted.match(/(\d[\d,]*\.?\d*)/);
  return m ? Number.parseFloat(m[1].replace(/,/g, "")) || 0 : 0;
}

/**
 * Post-consultation "Choose your treatment" page (Figma "Final Product
 * Page"). Minimal checkout chrome (back + centred logo), a product
 * selector where the recommended option expands with a dose grid, and —
 * for weight-loss — the editorial "What is…", graph, comparison and
 * safety sections. Flow: this page → /final-product-page/plan → /checkout.
 */
export default async function FinalProductPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawCategory = Array.isArray(sp.category) ? sp.category[0] : sp.category;
  const category = resolveCategory(rawCategory);
  const heading = CATEGORY_HEADING[category];

  let products: FlowProduct[];

  if (category === "weight-loss") {
    const slugs = ["mounjaro", "wegovy", "saxenda"] as const;

    const dbProducts = await Promise.all(
      slugs.map((s) => getStorefrontProduct(s).catch(() => null)),
    );

    products = slugs.map((slug, i) => {
      const editorial = PDP_PRODUCTS[slug];
      const db = dbProducts[i];
      const doses =
        db && db.variants.length > 0
          ? db.variants.map((v) => ({ label: v.label, price: v.price }))
          : editorial.dosages.map((d) => ({
              label: d.label,
              price: parsePrice(d.perPack),
            }));
      return {
        slug,
        productId: db?.id ?? FALLBACK_ID[slug] ?? 0,
        title: editorial.title.replace(/®/g, ""),
        italicWord: editorial.italicWord,
        image: db?.heroImageUrl ?? WL_META[slug]?.image ?? editorial.gallery[0]?.src ?? "",
        lede: editorial.lede,
        blurb: WL_META[slug]?.blurb ?? editorial.lede.slice(0, 90),
        recommended: WL_META[slug]?.recommended,
        doses,
      };
    });
  } else {
    // ED / PD: layer any matching CMS product on top of the editorial
    // catalogue so dashboard-managed prices/variants win when present.
    const catalog = getCatalogProducts(category);
    const dbProducts = await Promise.all(
      catalog.map((c) => getStorefrontProduct(c.slug).catch(() => null)),
    );
    products = catalog.map((c, i) => {
      const db = dbProducts[i];
      const doses =
        db && db.variants.length > 0
          ? db.variants.map((v) => ({ label: v.label, price: v.price }))
          : c.doses;
      return {
        slug: c.slug,
        productId: db?.id ?? c.productId,
        title: db?.title ?? c.title,
        italicWord: c.italicWord,
        image: c.image || db?.heroImageUrl || "",
        lede: db?.tagline ?? c.lede,
        blurb: c.blurb,
        recommended: c.recommended,
        doses,
      };
    });
  }

  // The editorial (What is / graph / safety) sections only exist for the
  // weight-loss catalogue — render them for the recommended product.
  const recommendedSlug =
    products.find((p) => p.recommended)?.slug ?? products[0]?.slug;
  const editorial =
    category === "weight-loss" && recommendedSlug
      ? PDP_PRODUCTS[recommendedSlug]
      : null;

  return (
    <main className="flex min-h-screen flex-col bg-white font-ui text-[#142e2a]">
      {/* Minimal checkout chrome: back + centred logo */}
      <header className="relative flex h-[72px] shrink-0 items-center justify-center border-b border-[#142e2a]/10 bg-white">
        <Link
          href="/"
          aria-label="Go back"
          className="btn-cta absolute left-4 grid h-10 w-10 place-items-center rounded-full bg-[#142e2a] text-white md:left-8"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path
              d="M12 4l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <Link href="/" aria-label="JoodLife home">
          <Image
            src="/assets/icons/logo-wesmount.svg"
            alt="JOOD"
            width={95}
            height={30}
            priority
          />
        </Link>
      </header>

      {/* Hero */}
      <section
        aria-label="You are eligible"
        className="bg-[#f7f9f2] px-6 pb-6 pt-10 text-center md:px-10 md:pb-8 md:pt-14 lg:px-[60px]"
      >
        <div className="mx-auto w-full max-w-[880px]">
          <h1 className="font-display text-[30px] font-bold leading-[36px] tracking-[-0.02em] text-[#142e2a] md:text-[46px] md:leading-[52px]">
            {heading.lead}
            <br />
            <em className="font-serif font-normal italic">{heading.italic}</em>
          </h1>
        </div>
      </section>

      {/* Interactive selector + sticky bar */}
      <FinalProductClient products={products} />

      {/* Editorial sections (weight-loss only) */}
      {editorial ? (
        <>
          <WhatIsSection product={editorial} />

          <section
            aria-label="Evidence-based comparison"
            className="w-full bg-white py-[30px] md:py-10"
          >
            <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
              <div className="mb-8 text-center md:mb-12">
                <h2 className="font-display text-[26px] font-bold leading-[1.1] tracking-[-0.01em] text-[#142e2a] md:text-[36px]">
                  Evidence-based{" "}
                  <em className="font-serif font-normal italic">comparison</em>
                </h2>
                <p className="mx-auto mt-2 max-w-[520px] font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15px]">
                  Review clinical insights on each treatment&rsquo;s
                  effectiveness, typical weight-loss outcomes and safety profile,
                  all to help you make an informed choice.
                </p>
              </div>
              <ComparisonTable active={editorial.comparisonActive} />
            </div>
          </section>

          <SafetyFaq product={editorial} />
        </>
      ) : null}

      {/* Your next steps */}
      <NextSteps />

      {/* Our commitment to your journey */}
      <section className="w-full bg-[#f7f9f2] px-6 py-[30px] md:px-10 md:py-10 lg:px-[60px]">
        <div className="mx-auto flex w-full max-w-[880px] items-center justify-between gap-6 rounded-[20px] border border-[#142e2a]/10 bg-white p-6 md:p-8">
          <div className="min-w-0">
            <h2 className="font-display text-[22px] font-bold leading-[1.15] text-[#142e2a] md:text-[28px]">
              Our commitment to your journey
            </h2>
            <p className="mt-2 max-w-[52ch] font-ui text-[14px] leading-[22px] text-[#142e2a]/75">
              We&rsquo;re committed to supporting you with safe, evidence-based
              treatment and ongoing clinical care, tailored to your individual
              needs.
            </p>
          </div>
          <Image
            src="/assets/checkout/money-back-badge.png"
            alt="Money back promise"
            width={96}
            height={96}
            className="hidden h-20 w-20 shrink-0 object-contain md:block md:h-24 md:w-24"
          />
        </div>
      </section>

      {/* Want to speak to someone? */}
      <section className="w-full bg-white px-6 pb-24 pt-2 text-center md:px-10 md:pb-16 lg:px-[60px]">
        <div className="mx-auto w-full max-w-[880px] rounded-[20px] border border-[#142e2a]/10 bg-[#f7f9f2] p-8">
          <p className="font-ui text-[15px] font-semibold text-[#142e2a]">
            Want to speak to someone?
          </p>
          <p className="mx-auto mt-2 max-w-[420px] font-ui text-[13px] leading-[20px] text-[#142e2a]/70">
            Get more information on the medication, the programme and your
            results.
          </p>
          <Link
            href="/consultation"
            className="btn-cta mt-4 inline-flex h-12 items-center justify-center rounded-xl border border-[#142e2a]/25 bg-white px-8 font-ui text-[14px] font-semibold text-[#142e2a] hover:bg-white/60"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}
