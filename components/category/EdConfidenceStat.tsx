"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated "89%" stat overlay for the Confidence section. Starts at 0 and
 * counts up / fills the bar to 89% the first time it scrolls into view.
 */
const TARGET = 89;

export default function EdConfidenceStat() {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        if (prefersReduced) {
          setValue(TARGET);
          return;
        }
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // easeOutCubic
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(eased * TARGET));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d1f2a] via-[#0d1f2a]/70 to-transparent p-5 pt-12"
    >
      <div className="mb-2 flex items-center justify-between font-ui text-[10px] text-white/70">
        <span>0%</span>
        <span>100%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-[#3fa7d6] to-[#6fd0e6] transition-[width] duration-700 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-3 font-display text-[30px] font-bold leading-none text-white md:text-[34px]">
        {value}%
      </p>
      <p className="mt-1 max-w-[24ch] font-ui text-[12px] leading-[17px] text-white/80">
        Members reported improved confidence in intimacy
      </p>
    </div>
  );
}
