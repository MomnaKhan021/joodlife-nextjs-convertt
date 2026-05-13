"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/thumbs";

/**
 * Product image gallery — matches Figma 3:1664.
 *
 * Desktop: a 50-50 split with the main image filling the left half
 * and four thumbnails arranged 2×2 underneath. Clicking any thumbnail
 * switches the main image and the main swiper slides to it; swiping
 * the main image syncs the active thumbnail back.
 *
 * Mobile: the main swiper renders pagination dots over the photo;
 * the thumbnail strip becomes a horizontal scroll.
 */

interface GalleryImage {
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  /** Optional discount badge — e.g. "26%" — overlaid top-right */
  discountBadge?: string;
}

export default function ProductGallery({
  images,
  discountBadge,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const mainSwiperRef = useRef<SwiperType | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* MAIN image swiper */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-[#e5d3e5] md:rounded-[24px]">
        {discountBadge ? (
          <span className="absolute right-4 top-4 z-10 inline-flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white font-display text-[14px] font-bold tracking-tight text-[#142e2a] shadow-lg md:right-6 md:top-6 md:h-[72px] md:w-[72px] md:text-[16px]">
            <span className="absolute h-full w-full animate-pulse rounded-full bg-white/60" />
            <span className="relative">{discountBadge}</span>
          </span>
        ) : null}

        <Swiper
          modules={[Pagination, A11y, Thumbs]}
          onSwiper={(s) => (mainSwiperRef.current = s)}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          pagination={{
            el: ".gallery-dots",
            clickable: true,
            bulletClass: "gallery-bullet",
            bulletActiveClass: "gallery-bullet-active",
          }}
          spaceBetween={0}
          slidesPerView={1}
          speed={500}
          a11y={{ enabled: true }}
          className="h-full w-full"
          aria-label="Product images"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i} className="!flex !items-center !justify-center">
              <div className="relative h-full w-full">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 92vw, 640px"
                  quality={95}
                  className="object-cover"
                  priority={i === 0}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination dots (mobile only) */}
        <div
          className="gallery-dots absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:hidden"
          aria-hidden
        />
      </div>

      {/* THUMBNAIL strip — bound to the main swiper via Thumbs */}
      <Swiper
        modules={[Thumbs, A11y]}
        onSwiper={setThumbsSwiper}
        watchSlidesProgress
        slidesPerView={4}
        spaceBetween={12}
        breakpoints={{
          640: { slidesPerView: 4, spaceBetween: 12 },
        }}
        a11y={{ enabled: true }}
        className="!w-full"
      >
        {images.map((img, i) => (
          <SwiperSlide key={i}>
            <button
              type="button"
              onClick={() => mainSwiperRef.current?.slideTo(i)}
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              aria-current={activeIndex === i ? "true" : undefined}
              className={[
                "relative block aspect-square w-full overflow-hidden rounded-[14px] bg-[#e5d3e5]",
                "transition-[box-shadow,opacity,outline] duration-200 ease-out",
                "outline outline-2 outline-offset-2",
                activeIndex === i
                  ? "outline-[#142e2a] opacity-100"
                  : "outline-transparent opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(max-width: 768px) 22vw, 140px"
                quality={90}
                className="object-cover"
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .gallery-bullet {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.55);
          cursor: pointer;
          transition: width 250ms ease, background-color 250ms ease;
          display: inline-block;
        }
        .gallery-bullet-active {
          width: 22px;
          background-color: rgb(255, 255, 255);
        }
        /* Thumbnail strip — no scroll bars */
        .swiper-wrapper {
          align-items: stretch;
        }
      `}</style>
    </div>
  );
}
