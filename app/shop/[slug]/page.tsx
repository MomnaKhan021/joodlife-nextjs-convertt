import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <main className="bg-[#f7f9f2]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-[60px] md:py-16">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 font-ui text-[13px] font-semibold text-[#142e2a]/70 transition-colors hover:text-[#142e2a]"
        >
          ← Back to shop
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-10 md:mt-10 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-white">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 90vw, 50vw"
                  className="object-contain p-8"
                  priority
                />
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl bg-white"
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

          <div className="flex flex-col gap-6">
            <div>
              {product.tagline ? (
                <p className="font-ui text-[12px] font-semibold uppercase tracking-[0.18em] text-[#142e2a]/55">
                  {product.tagline}
                </p>
              ) : null}
              <h1 className="mt-2 font-display text-[36px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px]">
                {product.title}
              </h1>
              {product.ratingValue !== null ? (
                <p className="mt-2 font-ui text-[14px] text-[#142e2a]/65">
                  ★ {product.ratingValue.toFixed(1)}
                  {product.ratingCount
                    ? ` · ${product.ratingCount} reviews`
                    : ""}
                </p>
              ) : null}
            </div>

            <p className="font-ui text-[15px] leading-[24px] text-[#142e2a]/80 md:text-[16px]">
              {product.description}
            </p>

            <VariantSelector
              productId={product.id}
              variants={product.variants}
              fallbackPrice={product.fromPrice}
            />

            <ul className="grid grid-cols-2 gap-3 border-t border-[#142e2a]/10 pt-5 font-ui text-[13px] text-[#142e2a]/75">
              <li className="flex items-center gap-2">
                <span aria-hidden>✓</span> UK-licensed medication
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>✓</span> Clinician-reviewed online
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>✓</span> Next-day delivery
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>✓</span> Cancel anytime
              </li>
            </ul>

            {product.subscriptionPrice ? (
              <p className="rounded-xl bg-white px-4 py-3 font-ui text-[13px] text-[#142e2a]/70">
                <span className="font-semibold text-[#142e2a]">
                  Subscription from £{product.subscriptionPrice.toFixed(2)}/month
                </span>{" "}
                — includes ongoing clinical support and next-day delivery.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
