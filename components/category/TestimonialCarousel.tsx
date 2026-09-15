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
      className={`relative flex min-h-[339px] flex-col rounded-[16px] bg-black/12 px-[22px] pb-[43px] pt-[62px] text-center backdrop-blur-[20px] md:min-h-[407px] md:rounded-[24px] md:pb-[30px] ${className}`}
    >
      {/* arrows */}
      <button
        type="button"
        aria-label="Previous testimonial"
        onClick={prev}
        className="absolute left-[22px] top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-2 border-white/40 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next testimonial"
        onClick={next}
        className="absolute right-[22px] top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-2 border-white/40 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sliding track — one slide per testimonial, translated smoothly.
          The clip container is full-width so each slide (also full-width)
          translates exactly one viewport with no neighbour peeking through;
          px-10 lives on each slide to keep the copy clear of the arrows. */}
      <div className="flex flex-1 items-start overflow-hidden md:items-center">
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
            <div key={d} className="flex w-full min-w-full shrink-0 basis-full flex-col justify-center px-2 md:px-14">
              {/* Figma: Saans-Medium 25/26 (20/23 mobile), upright, 404 wide */}
              <p className="mx-auto max-w-[324px] font-ui text-[20px] font-medium leading-[23px] tracking-[-0.49px] text-white md:max-w-[404px] md:text-[25px] md:leading-[26px]">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-[59px] flex flex-col gap-[6px] md:mt-[55px] md:gap-2">
                <span className="font-display text-[14px] font-semibold leading-[14px] tracking-[-0.57px] text-white md:font-ui md:text-[16px] md:font-medium md:leading-5 md:tracking-[-0.32px]">{t.name}</span>
                <span className="font-display text-[14px] font-semibold leading-[14px] tracking-[-0.57px] text-white md:font-ui md:text-[16px] md:font-medium md:leading-5 md:tracking-[-0.32px]">{t.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots: 12px active, 10px 25%-black inactive, on 16px centres */}
      <div className="flex h-[26px] items-center justify-center gap-1">
        {items.map((_, d) => (
          <button
            key={d}
            type="button"
            aria-label={`Go to testimonial ${d + 1}`}
            onClick={() => goTo(d)}
            className={`rounded-full transition-all ${d === active ? "h-3 w-3 bg-white" : "h-2.5 w-2.5 bg-black/25 hover:bg-black/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
