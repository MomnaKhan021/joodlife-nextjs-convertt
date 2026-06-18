"use client";

import { useState } from "react";

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
};

/**
 * Patient-testimonial carousel for the category panels — prev/next arrows
 * + clickable dots, matching the Figma right-hand card. Client component so
 * the arrows/dots cycle through the quotes.
 */
export default function TestimonialCarousel({
  items,
  className = "",
}: {
  items: Testimonial[];
  className?: string;
}) {
  const [i, setI] = useState(0);
  const n = items.length;
  const go = (next: number) => setI((next + n) % n);
  const t = items[i];

  return (
    <div
      className={`relative flex min-h-[400px] flex-col items-center justify-center gap-5 rounded-[24px] bg-black/12 p-8 text-center backdrop-blur-[20px] ${className}`}
    >
      {/* arrows */}
      <button
        type="button"
        aria-label="Previous testimonial"
        onClick={() => go(i - 1)}
        className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 md:left-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next testimonial"
        onClick={() => go(i + 1)}
        className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 md:right-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="px-8">
        <p className="mx-auto max-w-[34ch] font-serif text-[20px] font-normal italic leading-snug text-white md:text-[22px]">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="mt-5 flex flex-col gap-0.5">
          <span className="font-ui text-[15px] font-semibold text-white">{t.name}</span>
          <span className="font-ui text-[13px] text-white/70">{t.meta}</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        {items.map((_, d) => (
          <button
            key={d}
            type="button"
            aria-label={`Go to testimonial ${d + 1}`}
            onClick={() => setI(d)}
            className={`h-2 rounded-full transition-all ${d === i ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
