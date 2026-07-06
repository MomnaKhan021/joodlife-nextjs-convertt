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

  return (
    <div
      className={`relative flex min-h-[320px] flex-col rounded-[24px] bg-black/12 p-6 text-center backdrop-blur-[20px] md:min-h-[400px] md:p-8 ${className}`}
    >
      {/* arrows */}
      <button
        type="button"
        aria-label="Previous testimonial"
        onClick={() => go(i - 1)}
        className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 md:left-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next testimonial"
        onClick={() => go(i + 1)}
        className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 md:right-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sliding track — one slide per testimonial, translated smoothly.
          px-10 keeps the copy clear of the absolute arrows on mobile. */}
      <div className="flex flex-1 items-center overflow-hidden px-10 md:px-12">
        <div
          className="flex w-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {items.map((t, d) => (
            <div key={d} className="flex w-full min-w-full shrink-0 basis-full flex-col justify-center">
              <p className="mx-auto max-w-[30ch] font-serif text-[15px] font-normal italic leading-snug text-white md:max-w-[34ch] md:text-[22px]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-4 flex flex-col gap-0.5">
                <span className="font-ui text-[14px] font-semibold text-white md:text-[16px]">{t.name}</span>
                <span className="font-ui text-[12px] text-white/70 md:text-[14px]">{t.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
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
