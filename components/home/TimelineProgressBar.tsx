"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vertical progress bar that animates from top → bottom as the user
 * scrolls through the timeline section. The bar lives in the section's
 * background and visually communicates progression along the journey.
 *
 * Implementation notes:
 *  - Uses scroll-linked progress (the section's bounding rect vs the
 *    viewport) so it tracks the user's reading position rather than
 *    snapping in once. This yields the "smooth top-to-bottom" feel
 *    described in the spec.
 *  - Falls back to a one-shot intersection animation for users with
 *    prefers-reduced-motion enabled.
 */

interface TimelineProgressBarProps {
  /** Ref to the section whose vertical reading progress we track. */
  sectionRef: React.RefObject<HTMLElement | null>;
  /** Optional className for the outer absolute-positioned wrapper. */
  className?: string;
}

export default function TimelineProgressBar({
  sectionRef,
  className = "",
}: TimelineProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // Reduced motion: simple intersection observer one-shot reveal
      const el = sectionRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setProgress(1);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }

    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Distance scrolled into the section, clamped to [0, total].
      // The bar starts filling when the section's top hits the bottom
      // of the viewport, and finishes when its bottom hits the top.
      const total = rect.height + vh;
      const scrolled = Math.max(0, Math.min(total, vh - rect.top));
      setProgress(Math.max(0, Math.min(1, scrolled / total)));
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [sectionRef]);

  const fillPct = Math.round(progress * 100);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 ${className}`}
    >
      <div className="relative h-full w-[3px] rounded-full bg-white/10">
        <div
          className="absolute left-0 top-0 w-full rounded-full bg-gradient-to-b from-[#dff49f] via-[#dff49f] to-[#87af73]"
          style={{
            height: `${fillPct}%`,
            transition: "height 120ms linear",
            boxShadow: "0 0 24px rgba(223, 244, 159, 0.45)",
          }}
        />
        {/* Glowing dot at the leading edge of the progress fill */}
        <div
          className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dff49f]"
          style={{
            top: `${fillPct}%`,
            opacity: progress > 0.01 && progress < 0.99 ? 1 : 0,
            boxShadow:
              "0 0 0 4px rgba(223, 244, 159, 0.25), 0 0 18px rgba(223, 244, 159, 0.7)",
            transition: "top 120ms linear, opacity 240ms ease-out",
          }}
        />
      </div>
    </div>
  );
}
