"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface HeroCarouselProps {
  cards: string[];
  variant: "desktop" | "mobile";
}

/**
 * 2.4 slides visible on desktop (card 550 + gap 20 inside 1400px container
 * with 60px left padding → 2 full cards + 36% of third).
 * Mobile keeps 300px card to mirror the Figma mobile frame.
 *
 * Auto-advances one card every 1500ms with CSS smooth scrolling. Pauses
 * on hover/touch; wraps back to start when it reaches the end.
 */
export default function HeroCarousel({ cards, variant }: HeroCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const unit = variant === "desktop" ? 550 + 20 : 300 + 14;

    const tick = () => {
      if (pausedRef.current) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: unit, behavior: "smooth" });
      }
    };

    const id = window.setInterval(tick, 1500);

    const pause = () => (pausedRef.current = true);
    const resume = () => (pausedRef.current = false);
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });

    return () => {
      window.clearInterval(id);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [variant]);

  // Duplicate cards so looping appears continuous
  const list = [...cards, ...cards];

  if (variant === "desktop") {
    return (
      <div className="relative w-full overflow-hidden">
        <div
          ref={scrollerRef}
          className="no-scrollbar flex gap-5 overflow-x-auto pb-20 pl-[60px] pr-0"
          style={{
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
          }}
        >
          {list.map((src, i) => (
            <div
              key={i}
              className="relative h-[400px] w-[550px] shrink-0 overflow-hidden rounded-[24px] shadow-[0_36px_60px_-18px_rgba(0,0,0,0.55),0_12px_28px_-6px_rgba(0,0,0,0.35)] ring-1 ring-white/5"
              style={{ scrollSnapAlign: "start" }}
            >
              <Image
                src={src}
                alt=""
                width={1100}
                height={800}
                priority={i < 2}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={scrollerRef}
        className="no-scrollbar flex gap-[14px] overflow-x-auto pb-5 pl-6 pr-0"
        style={{
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {list.map((src, i) => (
          <div
            key={i}
            className="relative h-[259px] w-[300px] shrink-0 overflow-hidden rounded-2xl shadow-[0_22px_36px_-14px_rgba(0,0,0,0.55),0_8px_18px_-4px_rgba(0,0,0,0.3)] ring-1 ring-white/5"
            style={{ scrollSnapAlign: "start" }}
          >
            <Image
              src={src}
              alt=""
              width={600}
              height={518}
              priority={i < 2}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
