"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

/**
 * Product image gallery — matches Figma 3:1664.
 *
 * Uses native CSS `scroll-snap` instead of a JS carousel library, so
 * there's nothing to hydrate and no third-party CSS/JS to fail at
 * runtime (Swiper was non-deterministically breaking on Vercel).
 *
 * Desktop: a static main image with a row of clickable thumbnails
 * below — clicking a thumbnail swaps the main image.
 *
 * Mobile: the main image becomes a horizontal scroll-snap container
 * carrying every photo. The thumbnail row stays below and stays in
 * sync with the scroll position (and clicking a thumb scrolls to its
 * image). Dots over the photo show the current slide.
 */

interface GalleryImage {
  src: string;
  alt: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  /** Optional discount badge — e.g. "26%" — overlaid top-right of the first image */
  discountBadge?: string;
}

export default function ProductGallery({
  images,
  discountBadge,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // Distinguishes user-driven scrolls (which should update activeIndex)
  // from programmatic scrolls triggered by activeIndex changes (which
  // would otherwise feedback-loop).
  const isProgrammaticScroll = useRef(false);

  // When activeIndex changes (e.g. thumbnail click), scroll the mobile
  // carousel to the matching slide. The flag suppresses the scroll
  // listener while the smooth-scroll animation runs.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.children[activeIndex] as HTMLElement | undefined;
    if (!slide) return;
    if (Math.abs(el.scrollLeft - slide.offsetLeft) < 4) return;
    isProgrammaticScroll.current = true;
    el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
    // Smooth-scroll finishes within ~400ms; release after a beat.
    const t = window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
    return () => window.clearTimeout(t);
  }, [activeIndex]);

  // Update activeIndex as the user swipes the mobile carousel.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slideW = el.clientWidth;
        if (slideW === 0) return;
        const idx = Math.round(el.scrollLeft / slideW);
        if (idx !== activeIndex && idx >= 0 && idx < images.length) {
          setActiveIndex(idx);
        }
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  const badge = discountBadge ? (
    <span className="absolute right-4 top-4 z-10 inline-flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white font-display text-[14px] font-bold tracking-tight text-[#142e2a] shadow-lg md:right-6 md:top-6 md:h-[72px] md:w-[72px] md:text-[16px]">
      <span className="absolute h-full w-full animate-pulse rounded-full bg-white/60" />
      <span className="relative">{discountBadge}</span>
    </span>
  ) : null;

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* ── MOBILE: scroll-snap carousel of all images ── */}
      <div className="relative md:hidden">
        <div
          ref={scrollerRef}
          className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-[20px] bg-[#e5d3e5] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Product images"
          role="region"
          aria-roledescription="carousel"
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="relative flex aspect-square w-full shrink-0 snap-start snap-always items-center justify-center"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
            >
              {i === 0 ? badge : null}
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="100vw"
                quality={95}
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Mobile dots */}
        <div
          className="pointer-events-auto absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
          aria-hidden
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-200 ${
                activeIndex === i ? "w-[22px] bg-white" : "w-2 bg-white/55"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── DESKTOP: static main image, thumbnail-driven ── */}
      <div className="relative hidden aspect-square w-full overflow-hidden rounded-[24px] bg-[#e5d3e5] md:block">
        {badge}
        {/* Crossfade between images by rendering all and toggling opacity. */}
        {images.map((img, i) => (
          <Image
            key={i}
            src={img.src}
            alt={img.alt}
            fill
            sizes="640px"
            quality={95}
            className={`object-cover transition-opacity duration-300 ease-out ${
              i === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
            aria-hidden={i !== activeIndex}
          />
        ))}
      </div>

      {/* ── THUMBNAILS: row, scrollable on mobile, equal-width on desktop ── */}
      <div
        className="flex w-full gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] md:gap-3 md:overflow-visible [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Product image thumbnails"
      >
        {images.map((img, i) => {
          const selected = activeIndex === i;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-current={selected ? "true" : undefined}
              aria-label={`Show image ${i + 1}: ${img.alt}`}
              onClick={() => setActiveIndex(i)}
              className={[
                "relative block aspect-square w-[80px] shrink-0 overflow-hidden rounded-[14px] bg-[#e5d3e5]",
                "outline outline-2 outline-offset-2 transition-[outline-color,opacity] duration-200 ease-out",
                "md:w-auto md:flex-1",
                selected
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
          );
        })}
      </div>
    </div>
  );
}
