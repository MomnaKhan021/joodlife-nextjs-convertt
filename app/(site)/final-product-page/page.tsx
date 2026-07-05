import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import UspStrip from "@/components/home/UspStrip";
import HowItWorks from "@/sections/home/HowItWorks";
import Reviews from "@/sections/home/Reviews";
import CtaBanner from "@/sections/home/CtaBanner";
import ComparisonTable from "@/components/pdp/ComparisonTable";

import { PDP_PRODUCTS } from "@/lib/pdp-products";
import { getStorefrontProduct } from "@/lib/products";
import FinalProductClient, { type FlowProduct } from "./FinalProductClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Choose your treatment — JoodLife",
  description:
    "You're a candidate for weight-loss treatment. Pick the medication and dose that best fits your goals.",
};

/** Fallback numeric IDs if the DB product can't be resolved (matches PDP). */
const FALLBACK_ID: Record<string, number> = {
  mounjaro: 1001,
  wegovy: 1002,
  saxenda: 1003,
};

/** "£90.00" → 90 */
function parsePrice(formatted: string): number {
  const m = formatted.match(/(\d[\d,]*\.?\d*)/);
  return m ? Number.parseFloat(m[1].replace(/,/g, "")) || 0 : 0;
}

/**
 * Post-consultation "Choose your treatment" page.
 *
 * Flow: consultation → (this page: pick treatment + dose) → Continue →
 * /final-product-page/plan (choose frequency) → Checkout → /checkout.
 *
 * Doses + prices come from the dashboard-managed product variants where
 * available, falling back to the editorial PDP data so the page always
 * renders.
 */
export default async function FinalProductPage() {
  const slugs = ["mounjaro", "wegovy", "saxenda"] as const;

  const dbProducts = await Promise.all(
    slugs.map((s) => getStorefrontProduct(s).catch(() => null)),
  );

  const products: FlowProduct[] = slugs.map((slug, i) => {
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
      title: editorial.title,
      italicWord: editorial.italicWord,
      image: editorial.gallery[0]?.src ?? db?.heroImageUrl ?? "",
      lede: editorial.lede,
      doses,
    };
  });

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* ─────────  Hero  ───────── */}
      <section
        aria-label="You are eligible"
        className="bg-[#f7f9f2] px-6 pb-8 pt-10 text-center md:px-10 md:pb-12 md:pt-14 lg:px-[60px]"
      >
        <div className="mx-auto w-full max-w-[880px]">
          <span className="inline-flex items-center rounded-full bg-[#dff49f] px-3 py-1 font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]">
            Eligible
          </span>
          <h1 className="mt-4 font-display text-[30px] font-bold leading-[36px] tracking-[-0.02em] text-[#142e2a] md:text-[44px] md:leading-[52px]">
            Choose your{" "}
            <em className="font-serif font-normal italic">
              weight loss treatment
            </em>
          </h1>
          <p className="mx-auto mt-3 max-w-[560px] font-ui text-[14px] leading-[22px] text-[#142e2a]/75 md:text-[16px] md:leading-[26px]">
            Based on your consultation, you can start any of the treatments
            below. A UK-licensed clinician reviews every order before dispatch.
          </p>
        </div>
      </section>

      {/* ─────────  Interactive selector + sticky bar  ───────── */}
      <FinalProductClient products={products} />

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

      {/* Spacer so the sticky bar never covers the footer's last row */}
      <div aria-hidden className="h-20 bg-white md:h-0" />
      <Footer />
    </main>
  );
}
