"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface HeroCarouselProps {
  cards: string[];
  variant: "desktop" | "mobile";
}

/**
 * 2.4 slides visible on desktop (card 550 + gap 20 inside 1400px container
 * with symmetric 60px padding). Mobile keeps 300px card to mirror the Figma
 * mobile frame.
 *
 * Slow, continuous auto-scroll using requestAnimationFrame at ~18px/second
 * for a smooth cinematic drift. Pauses on hover/touch; wraps back to the
 * start once the end is reached.
 */
export default function HeroCarousel({ cards, variant }: HeroCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // Pixels per second. Lower = slower / smoother.
    const SPEED = variant === "desktop" ? 24 : 18;
    const STARTUP_DELAY = 3000; // show clean initial frame before drift kicks in
    const startAt = performance.now() + STARTUP_DELAY;
    let last = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && el && now >= startAt) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        const next = el.scrollLeft + SPEED * dt;
        if (next >= maxScroll - 1) {
          // Jump back to start seamlessly (duplicated list hides the jump)
          el.scrollLeft = 0;
        } else {
          el.scrollLeft = next;
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const pause = () => (pausedRef.current = true);
    const resume = () => {
      last = performance.now();
      pausedRef.current = false;
    };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
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
          className="no-scrollbar flex gap-5 overflow-x-auto pb-20 px-[40px]"
        >
          {list.map((src, i) => (
            <div
              key={i}
              className="relative h-[400px] w-[550px] shrink-0 overflow-hidden rounded-[20px]"
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
        className="no-scrollbar flex gap-[14px] overflow-x-auto pb-5 px-4"
      >
        {list.map((src, i) => (
          <div
            key={i}
            className="relative h-[259px] w-[300px] shrink-0 overflow-hidden rounded-[16px]"
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
