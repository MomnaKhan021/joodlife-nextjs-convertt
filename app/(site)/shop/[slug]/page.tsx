import { notFound } from "next/navigation";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import UspStrip from "@/components/home/UspStrip";
import HowItWorks from "@/sections/home/HowItWorks";
import Reviews from "@/sections/home/Reviews";
import Faq from "@/sections/home/Faq";
import CtaBanner from "@/sections/home/CtaBanner";

import ProductGallery from "@/components/pdp/ProductGallery";
import ProductInfo from "@/components/pdp/ProductInfo";
import WhatIsSection from "@/components/pdp/WhatIsSection";
import ComparisonTable from "@/components/pdp/ComparisonTable";
import SafetyFaq from "@/components/pdp/SafetyFaq";

import { getStorefrontProduct, type StorefrontProduct } from "@/lib/products";
import { PDP_PRODUCTS, type PDPProduct } from "@/lib/pdp-products";

// Render on demand: the product's images, variants, and prices come from the
// dashboard (DB), so edits appear immediately and the build never needs a DB.
// Same approach as the shop listing page.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const formatGBP = (n: number) =>
  n.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Merge the dashboard-managed product (images, variants/prices, title,
 * description, rating, discount badge) over the editorial PDP content
 * (how-it-works, comparison table, safety copy, graph) that isn't modelled
 * in the CMS. The DB is the source of truth for everything it provides.
 */
function mergePdp(db: StorefrontProduct, content: PDPProduct): PDPProduct {
  // Images → from the dashboard gallery (fall back to editorial images).
  const gallery =
    db.galleryImageUrls.length > 0
      ? db.galleryImageUrls.map((src, i) => ({
          src,
          alt: content.gallery[i]?.alt ?? `${db.title} — image ${i + 1}`,
        }))
      : content.gallery;

  // Dosages + prices → from the dashboard variants (fall back to editorial).
  const dosages =
    db.variants.length > 0
      ? db.variants.map((v) => ({ label: v.label, perPack: formatGBP(v.price) }))
      : content.dosages;

  const lowestVariant = db.variants.length
    ? Math.min(...db.variants.map((v) => v.price))
    : null;
  const fromValue = db.fromPrice ?? lowestVariant;
  const fromPrice = fromValue != null ? formatGBP(fromValue) : content.fromPrice;

  // Discount badge → explicit DB badge, else computed from compare price.
  let discountBadge = db.badge ?? content.discountBadge;
  if (
    !db.badge &&
    db.comparePrice != null &&
    fromValue != null &&
    db.comparePrice > fromValue
  ) {
    discountBadge = `${Math.round((1 - fromValue / db.comparePrice) * 100)}%`;
  }

  const ratingLabel =
    db.ratingValue != null
      ? `${db.ratingValue} Rated Excellence`
      : content.ratingLabel;

  return {
    ...content,
    slug: db.slug as PDPProduct["slug"],
    title: db.title || content.title,
    lede: db.description || db.tagline || content.lede,
    gallery,
    dosages,
    fromPrice,
    discountBadge,
    ratingLabel,
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;

  const dbProduct = await getStorefrontProduct(slug);
  const content = PDP_PRODUCTS[slug];

  // Neither in the DB nor in editorial content → genuine 404.
  if (!dbProduct && !content) notFound();

  // Editorial template for the non-CMS sections: the slug's own content, or
  // a known one so a dashboard-added product still renders a complete page.
  const editorial = content ?? PDP_PRODUCTS.mounjaro;
  const product = dbProduct ? mergePdp(dbProduct, editorial) : editorial;
  const productId = dbProduct?.id;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* ──────────────  HERO: Gallery + Info  ────────────── */}
      <section
        aria-label={`${product.title} — product overview`}
        className="w-full bg-white py-[30px] md:py-10"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
            <ProductGallery
              images={product.gallery}
              discountBadge={product.discountBadge}
            />
            <ProductInfo product={product} productId={productId} />
          </div>
        </div>
      </section>

      {/* ──────────────  USP marquee  ────────────── */}
      <UspStrip />

      {/* ──────────────  What is X? + animated graph  ────────────── */}
      <section
        aria-label={`What is ${product.title}?`}
        className="w-full bg-white py-[30px] md:py-10"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <WhatIsSection product={product} />
        </div>
      </section>

      {/* ──────────────  Evidence-based comparison  ────────────── */}
      <section
        aria-label="Comparison of GLP-1 treatments"
        className="w-full bg-white py-[30px] md:py-10"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <ComparisonTable active={product.comparisonActive} />
        </div>
      </section>

      {/* ──────────────  Is X safe? + FAQ  ────────────── */}
      <section
        aria-label={`Is ${product.title} safe?`}
        className="w-full bg-white py-[30px] md:py-10"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <SafetyFaq product={product} />
        </div>
      </section>

      {/* ──────────────  Shared sections (reuse home blocks)  ────────────── */}
      <Reviews />
      <HowItWorks />
      <Faq />
      <CtaBanner />

      <Footer />
    </main>
  );
}
