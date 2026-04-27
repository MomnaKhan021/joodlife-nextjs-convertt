import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import Reveal from "@/components/ui/Reveal";
import { getStorefrontProduct } from "@/lib/products";
import VariantSelector from "./VariantSelector";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);
  if (!product) notFound();

  const images =
    product.galleryImageUrls.length > 0
      ? product.galleryImageUrls
      : product.heroImageUrl
        ? [product.heroImageUrl]
        : [];
  const heroImage = images[0];

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[1440px] px-6 py-10 md:px-[60px] md:py-16">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-[#142e2a]/70 transition-colors hover:text-[#142e2a]"
        >
          ← Back to shop
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-10 md:mt-10 md:grid-cols-2 md:gap-14">
          {/* Gallery */}
          <Reveal direction="left">
            <div className="flex flex-col gap-3">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#f7f9f2]">
                {product.badge ? (
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_4px_12px_rgba(20,46,42,0.18)]">
                    {product.badge}
                  </span>
                ) : null}
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 50vw"
                    className="object-contain p-8 transition-transform duration-500 ease-out hover:scale-[1.02]"
                    priority
                  />
                ) : null}
              </div>
              {images.length > 1 ? (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(0, 4).map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f9f2] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(20,46,42,0.08)]"
                    >
                      <Image
                        src={src}
                        alt={`${product.title} thumbnail ${i + 1}`}
                        fill
                        sizes="120px"
                        className="object-contain p-2"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Reveal>

          {/* Info */}
          <Reveal direction="right" delay={120}>
            <div className="flex flex-col gap-6">
              <div>
                {product.tagline ? (
                  <span className="inline-flex w-fit items-center rounded-full border border-[#142e2a]/15 bg-[#f7f9f2] px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-[#142e2a]/70">
                    {product.tagline}
                  </span>
                ) : null}

                <h1 className="mt-3 font-display text-[36px] font-semibold leading-[42px] tracking-[-0.025em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
                  {product.title}
                </h1>

                {product.ratingValue !== null ? (
                  <p className="mt-3 flex items-center gap-2 font-ui text-[14px] text-[#142e2a]/65">
                    <span className="text-[#142e2a]">
                      ★ {product.ratingValue.toFixed(1)}
                    </span>
                    {product.ratingCount
                      ? `· ${product.ratingCount} reviews`
                      : null}
                  </p>
                ) : null}
              </div>

              <p className="font-ui text-[15px] leading-[24px] text-[#142e2a]/80 md:text-[16px] md:leading-[26px]">
                {product.description}
              </p>

              <VariantSelector
                productId={product.id}
                variants={product.variants}
                fallbackPrice={product.fromPrice}
              />

              <ul className="grid grid-cols-2 gap-3 border-t border-[#142e2a]/10 pt-5 font-ui text-[13px] text-[#142e2a]/75 md:text-[14px]">
                <li className="flex items-center gap-2">
                  <span aria-hidden className="text-[#142e2a]">✓</span>
                  UK-licensed medication
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="text-[#142e2a]">✓</span>
                  Clinician-reviewed online
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="text-[#142e2a]">✓</span>
                  Next-day delivery
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden className="text-[#142e2a]">✓</span>
                  Cancel anytime
                </li>
              </ul>

              {product.subscriptionPrice ? (
                <p className="rounded-xl bg-[#f7f9f2] px-4 py-3 font-ui text-[13px] leading-[20px] text-[#142e2a]/75 md:text-[14px]">
                  <span className="font-semibold text-[#142e2a]">
                    Subscription from £
                    {product.subscriptionPrice.toFixed(2)}/month
                  </span>{" "}
                  — includes ongoing clinical support and next-day delivery.
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
