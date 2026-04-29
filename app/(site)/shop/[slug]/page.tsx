import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import { getStorefrontProduct } from "@/lib/products";
import VariantSelector from "./VariantSelector";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const INCLUDED = [
  "Online clinical consultation",
  "Prescription and medication",
  "24/7 WhatsApp support",
  "Regular progress check-ins",
];

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarsRow({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg
            key={i}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            className={
              i < Math.round(rating) ? "text-[#00b67a]" : "text-[#142e2a]/15"
            }
          >
            <rect width="16" height="16" rx="2" fill="currentColor" />
            <path
              d="M8 3L9.4 6.2L13 6.5L10.3 8.8L11.1 12.3L8 10.6L4.9 12.3L5.7 8.8L3 6.5L6.6 6.2L8 3Z"
              fill="white"
            />
          </svg>
        ))}
      </div>
      <span className="font-ui text-[14px] font-semibold text-[#142e2a]">
        {rating.toFixed(1)}/5
      </span>
      <span className="font-ui text-[14px] font-medium text-[#142e2a]">
        Rated Excellence
      </span>
    </div>
  );
}

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
  const subtitle = `Sustainable weight loss with ${product.title}`;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[1280px] px-6 py-8 md:px-10 md:py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12">
          {/* ---------- Gallery (left) ---------- */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#f7f9f2]">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 92vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : null}
              {/* Pagination dots — only meaningful when there are multiple images */}
              {images.length > 1 ? (
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
                  {images.slice(0, 4).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === 0
                          ? "w-5 bg-white"
                          : "w-1.5 bg-white/55"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`relative aspect-square overflow-hidden rounded-lg bg-[#f7f9f2] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(20,46,42,0.08)] ${
                      i === 0 ? "ring-2 ring-[#142e2a]" : ""
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${product.title} thumbnail ${i + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* ---------- Info (right) ---------- */}
          <div className="flex flex-col gap-5">
            {/* Active-ingredient pill */}
            {product.tagline ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#dff49f]/40 px-3 py-1.5 font-ui text-[12px] font-semibold text-[#0c2421]">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#142e2a] text-white">
                  <CheckIcon size={10} />
                </span>
                {product.tagline}
              </span>
            ) : null}

            {/* Title */}
            <h1 className="font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-[#142e2a] md:text-[44px] md:leading-[48px]">
              {product.title}
            </h1>

            {/* Rating */}
            <StarsRow rating={product.ratingValue} />

            {/* Subtitle */}
            <p className="font-display text-[18px] font-semibold leading-[24px] text-[#142e2a] md:text-[19px]">
              {subtitle}
            </p>

            {/* Description */}
            <p className="font-ui text-[14px] leading-[22px] text-[#142e2a]/80 md:text-[15px] md:leading-[24px]">
              {product.description}
            </p>

            {/* What's included panel */}
            <section className="rounded-xl bg-[#f7f9f2] p-5 md:p-6">
              <h2 className="font-ui text-[14px] font-semibold text-[#142e2a]">
                What&apos;s Included In Your Treatment
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 font-ui text-[13px] leading-[18px] text-[#142e2a] md:text-[14px] md:leading-[20px]"
                  >
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#142e2a] text-[#dff49f]">
                      <CheckIcon size={9} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Variants + price + CTA */}
            <div className="flex flex-col gap-4">
              <h2 className="font-ui text-[14px] font-semibold text-[#142e2a]">
                Choose Your Dose
              </h2>
              <VariantSelector
                productId={product.id}
                variants={product.variants}
                fallbackPrice={product.fromPrice}
                productSlug={product.slug}
              />
            </div>

            {/* Disclaimer + delivery badge */}
            <div className="flex flex-col gap-2">
              <p className="font-ui text-[12px] text-[#142e2a]/65 md:text-[13px]">
                Medication is prescribed subject to clinical suitability.
              </p>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f7f9f2] px-3 py-1.5 font-ui text-[12px] font-medium text-[#142e2a] md:text-[13px]">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#142e2a] text-[#dff49f]">
                  <CheckIcon size={9} />
                </span>
                Next-Day Delivery
              </span>
            </div>

            <Link
              href="/shop"
              className="font-ui text-[13px] font-medium text-[#142e2a]/55 underline decoration-[1px] underline-offset-4 hover:text-[#142e2a]"
            >
              ← Back to shop
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
