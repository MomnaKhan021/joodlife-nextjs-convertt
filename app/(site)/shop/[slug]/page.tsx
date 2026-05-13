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

import { PDP_PRODUCTS } from "@/lib/pdp-products";

export const dynamic = "force-static";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(PDP_PRODUCTS).map((slug) => ({ slug }));
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = PDP_PRODUCTS[slug];
  if (!product) notFound();

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* ──────────────  HERO: Gallery + Info  ────────────── */}
      <section
        aria-label={`${product.title} — product overview`}
        className="w-full bg-white py-8 md:py-12 lg:py-16"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
            <ProductGallery
              images={product.gallery}
              discountBadge={product.discountBadge}
            />
            <ProductInfo product={product} />
          </div>
        </div>
      </section>

      {/* ──────────────  USP marquee  ────────────── */}
      <UspStrip />

      {/* ──────────────  What is X? + animated graph  ────────────── */}
      <section
        aria-label={`What is ${product.title}?`}
        className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <WhatIsSection product={product} />
        </div>
      </section>

      {/* ──────────────  Evidence-based comparison  ────────────── */}
      <section
        aria-label="Comparison of GLP-1 treatments"
        className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
      >
        <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
          <ComparisonTable active={product.comparisonActive} />
        </div>
      </section>

      {/* ──────────────  Is X safe? + FAQ  ────────────── */}
      <section
        aria-label={`Is ${product.title} safe?`}
        className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
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
