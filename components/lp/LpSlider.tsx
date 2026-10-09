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
  bleedRight = false,
  className = "",
}: {
  children: React.ReactNode;
  /** Width (per breakpoint) of each slide, e.g. "w-[300px] lg:w-[calc((100%-32px)/3)]". */
  itemClassName: string;
  gap?: number;
  /** Run to the screen edges on phones (cards peek past the gutter). */
  bleed?: boolean;
  /** Desktop: span the whole screen, with the first card in line with the
   *  content and the next one peeking in from the right; cards slide off
   *  both screen edges. The section must clip horizontal overflow. */
  bleedRight?: boolean;
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
      // Full-bleed rows start their first card at the content edge via
      // padding; snapping must use the same inset (it can't be written in CSS:
      // scroll-padding percentages resolve against the row, not its parent).
      const padL = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      el.style.scrollPaddingLeft = `${padL}px`;
      const overflow = el.scrollWidth - el.clientWidth > 2;
      if (!overflow) {
        setPages(1);
        return;
      }
      // Only whole cards count as visible: with 2½ in view the last dot must
      // scroll on until the final card is fully shown.
      const visible = Math.max(1, Math.floor((el.clientWidth - padL + gap) / step() + 0.01));
      setPages(Math.max(1, slides.length - visible + 1));
    };
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      // At the very end, the last dot — the final slides can't scroll to the left edge.
      setActive(el.scrollLeft >= max - 2 ? Number.MAX_SAFE_INTEGER : Math.round(el.scrollLeft / step()));
    };
    // The desktop bleed runs to the screen's edge — 100vw minus the scrollbar.
    const sbw = () =>
      document.documentElement.style.setProperty("--sbw", `${window.innerWidth - document.documentElement.clientWidth}px`);
    // After a resize, wait a frame so the new padding (from --sbw) has applied.
    const onResize = () => {
      sbw();
      requestAnimationFrame(measure);
    };
    sbw();
    measure();
    // The row's own size (e.g. a font loading) and the window (rotation,
    // crossing the desktop breakpoint) can both change how many fit.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", onResize);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
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
          bleed ? "-mx-4 w-[calc(100%+2rem)] px-4 lg:mx-0" : "w-full"
        } ${
          // Desktop: the row spans the whole screen (100vw minus the scrollbar,
          // --sbw) so cards slide off both edges, and its left padding — the
          // gap between the screen and the content, (screen - 100%) / 2 —
          // starts the first card in line with the heading.
          bleedRight
            ? "lg:w-[calc(100vw-var(--sbw,0px))] lg:max-w-none lg:pl-[calc((100vw-var(--sbw,0px)-100%)/2)] lg:pr-0"
            : bleed
              ? "lg:w-full lg:px-0"
              : "lg:w-full"
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
