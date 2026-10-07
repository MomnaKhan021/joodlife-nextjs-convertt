"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontal scroll-snap slider shared by the lander's card rows.
 *
 * The dots only appear when there are more slides than fit — three story
 * cards on desktop sit in a plain row, a fourth turns the row into a slider
 * with pagination. One dot per scroll position (slides - visible + 1).
 */
export default function LpSlider({
  children,
  itemClassName,
  gap = 16,
  bleed = false,
  className = "",
}: {
  children: React.ReactNode;
  /** Width (per breakpoint) of each slide, e.g. "w-[300px] lg:w-[calc((100%-32px)/3)]". */
  itemClassName: string;
  gap?: number;
  /** Run to the screen edges on phones (cards peek past the gutter). */
  bleed?: boolean;
  className?: string;
}) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState(0);

  const step = useCallback(() => {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null;
    return first ? first.offsetWidth + gap : 1;
  }, [gap]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const overflow = el.scrollWidth - el.clientWidth > 2;
      if (!overflow) {
        setPages(1);
        return;
      }
      const visible = Math.max(1, Math.round((el.clientWidth + gap) / step()));
      setPages(Math.max(1, slides.length - visible + 1));
    };
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      // At the very end, the last dot — the final slides can't scroll to the left edge.
      setActive(el.scrollLeft >= max - 2 ? Number.MAX_SAFE_INTEGER : Math.round(el.scrollLeft / step()));
    };
    measure();
    // The row's own size (e.g. a font loading) and the window (rotation,
    // crossing the desktop breakpoint) can both change how many fit.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      el.removeEventListener("scroll", onScroll);
    };
  }, [gap, step, slides.length]);

  const current = Math.min(active, pages - 1);
  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * step(), behavior: "smooth" });
  };

  return (
    <div className={`flex w-full flex-col items-center gap-[24px] ${className}`}>
      <div
        ref={track}
        className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto ${
          bleed
            ? "-mx-4 w-[calc(100%+2rem)] scroll-px-4 px-4 lg:mx-0 lg:w-full lg:scroll-px-0 lg:px-0"
            : "w-full"
        }`}
        style={{ gap }}
      >
        {slides.map((s, i) => (
          <div key={i} className={`flex shrink-0 snap-start ${itemClassName}`}>
            {s}
          </div>
        ))}
      </div>

      {pages > 1 ? (
        <div className="flex items-center gap-[8px]">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={current === i}
              className={`h-[8px] cursor-pointer rounded-[4px] border border-[#142e2a] transition-all ${
                current === i ? "w-[26px] bg-[#142e2a]" : "w-[8px]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
