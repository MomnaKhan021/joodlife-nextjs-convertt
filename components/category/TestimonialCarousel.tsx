"use client";

import { useEffect, useState } from "react";

export type Testimonial = {
  quote: string;
  name: string;
  meta: string;
};

/**
 * Patient-testimonial carousel for the category panels — prev/next arrows
 * + clickable dots, matching the Figma right-hand card. Client component so
 * the arrows/dots cycle through the quotes.
 *
 * Seamless infinite loop: the track holds a clone of the last slide before
 * the first and a clone of the first after the last. `pos` walks over that
 * padded track, so advancing past either end always slides one card in the
 * same direction (never a full-width rewind). Once the slide onto a clone
 * finishes, we snap — with the transition disabled for one frame — to the
 * matching real slide, so the loop is invisible.
 */
export default function TestimonialCarousel({
  items,
  className = "",
}: {
  items: Testimonial[];
  className?: string;
}) {
  const n = items.length;
  const loop = n > 1;

  // Padded track: [clone(last), ...items, clone(first)].
  const slides = loop ? [items[n - 1], ...items, items[0]] : items;

  // Position within `slides`. Start on the first real slide (index 1).
  const [pos, setPos] = useState(loop ? 1 : 0);
  // When false, the track jumps instantly (used to hide the clone→real snap).
  const [animate, setAnimate] = useState(true);

  // Real slide the viewer is looking at (drives the active dot).
  const active = loop ? (pos - 1 + n) % n : 0;

  const next = () => loop && setPos((p) => p + 1);
  const prev = () => loop && setPos((p) => p - 1);
  const goTo = (d: number) => setPos(loop ? d + 1 : d);

  // After a slide lands on a clone, disable the transition and snap to the
  // real counterpart so the next move continues smoothly from there.
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (!loop || e.propertyName !== "transform" || e.target !== e.currentTarget) {
      return;
    }
    if (pos === slides.length - 1) {
      setAnimate(false);
      setPos(1);
    } else if (pos === 0) {
      setAnimate(false);
      setPos(n);
    }
  };

  // Re-enable the transition on the frame after an instant snap, so the
  // reposition itself doesn't animate but the next user move does.
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimate(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [animate]);

  return (
    <div
      className={`relative flex min-h-[320px] flex-col rounded-[24px] bg-black/12 p-6 text-center backdrop-blur-[20px] md:min-h-[400px] md:p-8 ${className}`}
    >
      {/* arrows */}
      <button
        type="button"
        aria-label="Previous testimonial"
        onClick={prev}
        className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 md:left-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next testimonial"
        onClick={next}
        className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10 md:right-4"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sliding track — one slide per testimonial, translated smoothly.
          The clip container is full-width so each slide (also full-width)
          translates exactly one viewport with no neighbour peeking through;
          px-10 lives on each slide to keep the copy clear of the arrows. */}
      <div className="flex flex-1 items-center overflow-hidden">
        <div
          className={`flex w-full ${
            animate
              ? "transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
              : ""
          }`}
          style={{ transform: `translateX(-${pos * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((t, d) => (
            <div key={d} className="flex w-full min-w-full shrink-0 basis-full flex-col justify-center px-10 md:px-12">
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
            onClick={() => goTo(d)}
            className={`h-2 rounded-full transition-all ${d === active ? "w-5 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
}
