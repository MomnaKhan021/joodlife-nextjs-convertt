"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import type { StorefrontProduct } from "@/lib/products";

type Props = { products: StorefrontProduct[] };

/**
 * Renders the shop card grid on desktop (md+) and a horizontal
 * Swiper with pagination dots on mobile. Cards fade-in one-by-one
 * once they enter the viewport, with a 140ms stagger between each.
 *
 * All visual config (footer-strip colour, short card copy, etc.)
 * comes from the StorefrontProduct row, so adding a new product
 * via /admin is enough to make it appear here without a code change.
 */
export default function ShopGrid({ products }: Props) {
  return (
    <>
      {/* Desktop / tablet — 3-up grid */}
      <ul className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 md:gap-7 lg:grid-cols-3">
        {products.map((p, i) => (
          <li key={p.id}>
            <ShopCard product={p} index={i} />
          </li>
        ))}
      </ul>

      {/* Mobile — Swiper carousel with pagination dots */}
      <div className="block sm:hidden">
        <Swiper
          modules={[Pagination, A11y]}
          spaceBetween={16}
          slidesPerView={1.05}
          centeredSlides={false}
          speed={500}
          pagination={{
            el: ".shop-pagination",
            clickable: true,
            bulletClass: "shop-bullet",
            bulletActiveClass: "shop-bullet-active",
          }}
          a11y={{ enabled: true }}
          className="shop-swiper !overflow-visible !pr-6"
        >
          {products.map((p, i) => (
            <SwiperSlide key={p.id} className="!h-auto">
              <ShopCard product={p} index={i} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="shop-pagination mt-6 flex items-center justify-center gap-2" />
      </div>

      <style jsx global>{`
        .shop-bullet {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background-color: rgba(20, 46, 42, 0.22);
          cursor: pointer;
          transition:
            width 300ms ease,
            background-color 300ms ease;
        }
        .shop-bullet-active {
          width: 26px;
          background-color: #142e2a;
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Single product card                                                 */
/* ------------------------------------------------------------------ */

function ShopCard({
  product: p,
  index,
}: {
  product: StorefrontProduct;
  index: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  // IntersectionObserver-driven one-by-one fade. Stagger = 140ms × index
  // so each card lands a beat after the previous one.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const footerBg = p.footerColor || "#142e2a";
  const cardCopy = p.cardCopy || p.description;
  const fromPriceLabel =
    p.fromPrice !== null
      ? `Starting from £${p.fromPrice.toFixed(0)}/month*`
      : "Starting from /month*";

  return (
    <article
      ref={ref as never}
      className="group relative flex aspect-[4/5] w-full overflow-hidden rounded-3xl transition-[transform,box-shadow,opacity] ease-out hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(20,46,42,0.16)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate3d(0,0,0)"
          : "translate3d(0, 28px, 0)",
        transition: `opacity 700ms ease-out ${index * 140}ms, transform 700ms ease-out ${index * 140}ms, box-shadow 300ms ease-out`,
        willChange: "opacity, transform",
      }}
    >
      {/* Full-bleed product image — its baked-in colour is the card backdrop */}
      {p.heroImageUrl ? (
        <Image
          src={p.heroImageUrl}
          alt={p.title}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
          className="object-cover object-right transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          priority={index === 0}
        />
      ) : null}

      {/* Top-left content stack */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-5 pr-2 md:p-6 md:pr-3">
        {p.tagline ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-ui text-[12px] font-medium text-[#142e2a] shadow-[0_2px_6px_rgba(20,46,42,0.06)] backdrop-blur-sm">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[#3aa55a]"
            />
            {p.tagline}
          </span>
        ) : null}

        <h2 className="font-display text-[22px] font-bold leading-[26px] tracking-[-0.01em] text-[#142e2a] md:text-[24px] md:leading-[28px]">
          {p.title}
        </h2>

        <p className="max-w-[60%] font-ui text-[13px] leading-[19px] text-[#142e2a]/85 md:text-[14px] md:leading-[20px]">
          {cardCopy}
        </p>
      </div>

      {/* Optional badge top-right */}
      {p.badge ? (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-[#142e2a] px-3 py-1.5 font-ui text-[11px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_4px_12px_rgba(20,46,42,0.18)]">
          {p.badge}
        </span>
      ) : null}

      {/* Bottom strip: price (left) + Get Started (right) */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 px-5 py-3.5 md:px-6 md:py-4"
        style={{ backgroundColor: footerBg }}
      >
        <span className="font-ui text-[13px] font-semibold text-white md:text-[14px]">
          {fromPriceLabel}
        </span>
        <Link
          href={`/shop/${p.slug}`}
          className="inline-flex h-[34px] items-center justify-center rounded-full bg-white px-4 font-ui text-[12px] font-semibold text-[#142e2a] transition-colors duration-200 hover:bg-[#f7f9f2] md:h-[38px] md:px-5 md:text-[13px]"
        >
          Get Started
        </Link>
      </div>

      {/* Whole-card click target — sits behind the CTA */}
      <Link
        href={`/shop/${p.slug}`}
        aria-label={`Open ${p.title}`}
        className="absolute inset-0 z-0"
      />
    </article>
  );
}
