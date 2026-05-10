"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vertical slider/bar that animates from top → bottom on mount, then
 * loops with a brief pause. Mirrors the Figma hero's "premium" feel —
 * a slow, deliberate sweep that draws the eye downwards toward the
 * portrait/CTA without distracting from the rest of the layout.
 *
 * Implementation:
 *  - 6s cycle: 2.6s ease-in-out sweep, 0.6s pause at bottom, 0.2s fade
 *    out, 0.4s reset to top, 0.2s fade in, 2s hold at top before the
 *    next sweep. The fade prevents a jarring snap-back when looping.
 *  - Pauses when the user prefers reduced motion.
 *  - Pure CSS animation — no scroll listeners; no work after mount.
 */

interface HeroProgressIndicatorProps {
  /** Visual placement: 'desktop' uses thicker bar; 'mobile' is thinner. */
  size?: "desktop" | "mobile";
  className?: string;
}

export default function HeroProgressIndicator({
  size = "desktop",
  className = "",
}: HeroProgressIndicatorProps) {
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const isDesktop = size === "desktop";
  const trackWidth = isDesktop ? 3 : 2;
  const knobSize = isDesktop ? 12 : 9;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={`pointer-events-none absolute z-10 ${className}`}
    >
      <div
        className="relative h-full"
        style={{ width: `${Math.max(trackWidth, knobSize)}px` }}
      >
        {/* Track */}
        <div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2 rounded-full bg-white/15"
          style={{ width: `${trackWidth}px` }}
        />
        {/* Animated fill — height grows top→bottom */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-gradient-to-b from-[#dff49f] via-[#dff49f] to-[#87af73]"
          style={{
            width: `${trackWidth}px`,
            animation: reduced ? "none" : "hero-progress-fill 6s ease-in-out infinite",
            height: reduced ? "100%" : "0%",
            boxShadow: "0 0 14px rgba(223, 244, 159, 0.55)",
          }}
        />
        {/* Knob — leads the fill */}
        <div
          className="absolute left-1/2 rounded-full bg-[#dff49f]"
          style={{
            width: `${knobSize}px`,
            height: `${knobSize}px`,
            transform: "translate(-50%, -50%)",
            top: 0,
            boxShadow:
              "0 0 0 4px rgba(223, 244, 159, 0.22), 0 0 14px rgba(223, 244, 159, 0.65)",
            animation: reduced
              ? "none"
              : "hero-progress-knob 6s ease-in-out infinite",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes hero-progress-fill {
          0% {
            height: 0%;
            opacity: 1;
          }
          43% {
            height: 100%;
            opacity: 1;
          }
          53% {
            height: 100%;
            opacity: 0;
          }
          60% {
            height: 0%;
            opacity: 0;
          }
          66% {
            height: 0%;
            opacity: 1;
          }
          100% {
            height: 0%;
            opacity: 1;
          }
        }
        @keyframes hero-progress-knob {
          0% {
            top: 0%;
            opacity: 1;
          }
          43% {
            top: 100%;
            opacity: 1;
          }
          53% {
            top: 100%;
            opacity: 0;
          }
          60% {
            top: 0%;
            opacity: 0;
          }
          66% {
            top: 0%;
            opacity: 1;
          }
          100% {
            top: 0%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
