import Image from "next/image";
import Link from "next/link";

import { PDP_PRODUCTS, type PDPProduct } from "@/lib/pdp-products";
import { getStorefrontProduct, listStorefrontProducts } from "@/lib/products";
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
  "wegovy-pill": 1003,
};

/** Short selector-row descriptions + recommended flag + thumbnail for
 * weight-loss. Images are NOT hard-coded here — they come from the
 * dashboard product (hero image, then gallery). */
const WL_META: Record<
  string,
  { blurb: string; recommended?: boolean }
> = {
  mounjaro: {
    blurb: "Advanced dual-action treatment for appetite control.",
  },
  wegovy: {
    blurb: "Once-weekly injection to support long-term weight management.",
  },
  "wegovy-pill": {
    blurb: "Once-daily oral tablet — the same active ingredient, no needles.",
    recommended: true,
  },
};

/** "£90.00" → 90 */
function parsePrice(formatted: string): number {
  const m = formatted.match(/(\d[\d,]*\.?\d*)/);
  return m ? Number.parseFloat(m[1].replace(/,/g, "")) || 0 : 0;
}

/** Dashboard variant labels are often bare numbers ("2.5") — the dose
 * buttons must read "2.5mg" (Figma), so append the unit when missing. */
function mgLabel(label: string): string {
  const l = label.trim();
  return /^\d+(?:\.\d+)?$/.test(l) ? `${l}mg` : l;
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
  // Per-slug editorial content (What is / comparison / FAQ) for the detail
  // section that follows the selected product. Weight-loss only.
  let editorialBySlug: Record<string, PDPProduct> | undefined;

  if (category === "weight-loss") {
    // DB-first: show whatever weight-loss products the dashboard holds, with
    // their real variants / prices / images / titles. Fall back to the
    // editorial trio only if the dashboard has no weight-loss products yet.
    const dbWl = (await listStorefrontProducts().catch(() => [])).filter(
      (p) => (p.treatment ?? "") === "weight-loss",
    );

    if (dbWl.length > 0) {
      editorialBySlug = Object.fromEntries(
        dbWl
          .map((p) => [p.slug, PDP_PRODUCTS[p.slug]] as const)
          .filter(([, v]) => Boolean(v)),
      ) as Record<string, PDPProduct>;

      products = dbWl.map((db) => {
        const editorial = PDP_PRODUCTS[db.slug];
        // The oral tablet (Wegovy Pills) is a single-option product — show one
        // price, not a multi-dose grid like the injections.
        const isPillProduct = /pill/i.test(db.slug) || /pill/i.test(db.title);
        const doses = isPillProduct
          ? [
              {
                label: "",
                price: db.fromPrice ?? db.variants[0]?.price ?? db.subscriptionPrice ?? 0,
              },
            ]
          : db.variants.length > 0
            ? db.variants.map((v) => ({ label: mgLabel(v.label), price: v.price }))
            : [{ label: "", price: db.fromPrice ?? db.subscriptionPrice ?? 0 }];
        return {
          slug: db.slug,
          productId: db.id,
          title: db.title,
          italicWord: editorial?.italicWord ?? "",
          image:
            db.heroImageUrl ??
            db.galleryImageUrls?.[0] ??
            editorial?.gallery?.[0]?.src ??
            "",
          lede: db.tagline ?? editorial?.lede ?? "",
          blurb: WL_META[db.slug]?.blurb ?? db.tagline ?? editorial?.lede?.slice(0, 90) ?? "",
          recommended:
            (db.badge ?? "").toLowerCase().includes("recommend") ||
            WL_META[db.slug]?.recommended === true,
          doses,
        };
      });
      // Wegovy Pills (the oral tablet) goes on top and is the recommended pick.
      // Detect it by slug/title so spelling ("wegovy-pill" vs "wegovy-pills")
      // doesn't matter; the rest keep their dashboard display order.
      const isPill = (p: FlowProduct) =>
        /pill/i.test(p.slug) || /pill/i.test(p.title);
      products.sort((a, b) => (isPill(b) ? 1 : 0) - (isPill(a) ? 1 : 0));
      // Exactly one expanded/recommended card — the top one (the pill).
      products.forEach((p, i) => {
        p.recommended = i === 0;
      });
    } else {
      // ── Fallback: editorial trio (no dashboard weight-loss products yet) ──
      const slugs = ["wegovy-pill", "mounjaro", "wegovy"] as const;
      editorialBySlug = Object.fromEntries(
        slugs.map((s) => [s, PDP_PRODUCTS[s]] as const).filter(([, v]) => Boolean(v)),
      ) as Record<string, PDPProduct>;
      const dbProducts = await Promise.all(
        slugs.map((s) => getStorefrontProduct(s).catch(() => null)),
      );
      products = slugs.map((slug, i) => {
        const editorial = PDP_PRODUCTS[slug];
        const db = dbProducts[i];
        let doses: { label: string; price: number }[];
        if (db && db.variants.length > 0) {
          doses = db.variants.map((v) => ({ label: mgLabel(v.label), price: v.price }));
        } else if (db && (db.fromPrice != null || db.subscriptionPrice != null)) {
          doses = [{ label: "", price: db.fromPrice ?? db.subscriptionPrice ?? 0 }];
        } else {
          doses = editorial.dosages.map((d) => ({
            label: mgLabel(d.label),
            price: parsePrice(d.perPack),
          }));
        }
        return {
          slug,
          productId: db?.id ?? FALLBACK_ID[slug] ?? 0,
          title: editorial.title,
          italicWord: editorial.italicWord,
          image:
            db?.heroImageUrl ??
            db?.galleryImageUrls?.[0] ??
            editorial.gallery[0]?.src ??
            "",
          lede: editorial.lede,
          blurb: WL_META[slug]?.blurb ?? editorial.lede.slice(0, 90),
          recommended: WL_META[slug]?.recommended,
          doses,
        };
      });
    }
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
          ? db.variants.map((v) => ({ label: mgLabel(v.label), price: v.price }))
          : c.doses.map((d) => ({ ...d, label: mgLabel(d.label) }));
      return {
        slug: c.slug,
        productId: db?.id ?? c.productId,
        title: db?.title ?? c.title,
        italicWord: c.italicWord,
        // Dashboard image wins (hero, else gallery); catalog art is fallback.
        image: db?.heroImageUrl ?? db?.galleryImageUrls?.[0] ?? c.image ?? "",
        lede: db?.tagline ?? c.lede,
        blurb: c.blurb,
        recommended: c.recommended,
        doses,
      };
    });
  }

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

      {/* Interactive selector + per-product detail (What is / comparison /
          FAQ) that follows the selected product */}
      <FinalProductClient products={products} editorial={editorialBySlug} />

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
          <a
            href="https://wa.me/447756099075"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-cta mt-4 inline-flex h-12 items-center justify-center rounded-xl border border-[#142e2a]/25 bg-white px-8 font-ui text-[14px] font-semibold text-[#142e2a] hover:bg-white/60"
          >
            Get started
          </a>
        </div>
      </section>
    </main>
  );
}
