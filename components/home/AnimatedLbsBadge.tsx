"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated "27 lbs" weight-loss badge from the Figma hero.
 *
 * Visual anatomy:
 *  - Semi-transparent dark-green pill (bg #142e2a/20) with blur
 *  - Label "WEIGHT LOSS" (uppercase)
 *  - Counter (0 → target, animates on scroll-into-view)
 *  - Downward arrow on the left
 *  - S-curve line drawing on from left to right, dot marker at the end
 *
 * Both the number and the line drawing are synchronised — progress
 * drives both.
 */

type Size = "desktop" | "mobile";

const TARGET = 27;
const DURATION_MS = 1800;

// Figma's S-curve path (from badge-desktop.svg, the 240×138 viewBox).
// We let this scale with the SVG so it works for both desktop and
// mobile renders.
const CURVE_PATH =
  "M-19 27.2077C-8.16667 26.3744 11 25.4999 34 39.2077C57 52.9156 56.6129 58.1937 89.5 81.7076C99 88.5 108.5 93.4902 112 94.7076C115.5 95.925 128.921 101.041 142 103.708C155.079 106.374 172.4 107.208 176 107.208C179.6 107.208 213.5 108.708 213.5 108.708";
// End-of-curve coordinates for the marker dot
const END_X = 214;
const END_Y = 109;
// Downward arrow path (from Figma, repositioned)
const ARROW_PATH =
  "M30.75 78.8301C30.75 77.8636 29.9665 77.0801 29 77.0801C28.0335 77.0801 27.25 77.8636 27.25 78.8301H29H30.75ZM27.7626 116.068C28.446 116.751 29.554 116.751 30.2374 116.068L41.3744 104.931C42.0578 104.247 42.0578 103.139 41.3744 102.456C40.691 101.772 39.5829 101.772 38.8995 102.456L29 112.355L19.1005 102.456C18.4171 101.772 17.309 101.772 16.6256 102.456C15.9422 103.139 15.9422 104.247 16.6256 104.931L27.7626 116.068ZM29 78.8301H27.25L27.25 114.83H29H30.75L30.75 78.8301H29Z";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedLbsBadge({ size = "desktop" }: { size?: Size }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [value, setValue] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1

  const isDesktop = size === "desktop";
  const widthPx = isDesktop ? 240 : 147;
  const heightPx = isDesktop ? 138 : 84;

  // Measure the path once it's mounted
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Start the animation when the badge scrolls into view
  useEffect(() => {
    if (!rootRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPlaying(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);

  // Run the tween
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      const eased = easeOutCubic(t);
      setProgress(eased);
      setValue(Math.round(eased * TARGET));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const dashOffset = pathLength ? pathLength * (1 - progress) : 0;
  // Dot fades in once the line is mostly drawn (>= 85%)
  const dotOpacity = progress < 0.85 ? 0 : (progress - 0.85) / 0.15;

  return (
    <div
      ref={rootRef}
      style={{ width: widthPx, height: heightPx }}
      className="relative"
    >
      <svg
        viewBox="0 0 240 138"
        width={widthPx}
        height={heightPx}
        className="absolute inset-0"
        aria-hidden
      >
        {/* Card background — semi-transparent dark green with soft blur effect */}
        <rect
          width={240}
          height={138}
          rx={12}
          fill="#142E2A"
          fillOpacity={0.25}
        />
        {/* Downward arrow (left side) */}
        <path d={ARROW_PATH} fill="#87AF73" />
        {/* The S-curve line — animated stroke */}
        <path
          ref={pathRef}
          d={CURVE_PATH}
          stroke="#87AF73"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          style={{ transition: "none" }}
        />
        {/* Dot marker at the end of the curve */}
        <g style={{ opacity: dotOpacity, transition: "opacity 180ms ease-out" }}>
          <circle cx={END_X} cy={END_Y} r={10} fill="#87AF73" />
          <circle cx={END_X} cy={END_Y} r={6} fill="#ffffff" />
        </g>
      </svg>

      {/* Text overlay (label + counter) */}
      <div
        className={`absolute right-0 top-0 flex flex-col items-end text-white ${
          isDesktop ? "px-5 py-3" : "px-3 py-2"
        }`}
      >
        <span
          className={`font-ui font-bold uppercase leading-none tracking-[0.05em] text-white/95 ${
            isDesktop ? "text-[12px]" : "text-[8px]"
          }`}
        >
          Weight loss
        </span>
        <span
          className={`font-display font-bold leading-none tabular-nums text-white ${
            isDesktop ? "mt-2 text-[44px]" : "mt-1 text-[26px]"
          }`}
        >
          {value}
          <span
            className={`ml-1 font-ui font-bold lowercase tracking-[0.02em] ${
              isDesktop ? "text-[28px]" : "text-[18px]"
            }`}
          >
            lbs
          </span>
        </span>
      </div>
    </div>
  );
}
