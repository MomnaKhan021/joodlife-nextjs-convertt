"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two-tone background for the Journey section with the Figma curve
 * drawn between the shades and 11 circles that light up sequentially
 * on scroll-into-view.
 *
 * Structure:
 *  - Full section base: #142e2a (dark green)
 *  - A light-green wash (#87AF73 at 70% opacity) masked to the lower
 *    half via the Figma SVG path
 *  - A dashed #DFF49F stroke overlay = the divider curve
 *  - 11 circles positioned on the curve that animate 0 → 11 with a
 *    180ms stagger (~2s total) on scroll
 *
 * The curve path + dot coordinates come directly from Figma's
 * Component 94 / Vector 3 + Group 1000004229.
 */

// Dot positions from Figma (each transform translate x, y). Centre = x+5.
const DOTS: Array<[number, number]> = [
  [64.22, 19.6],
  [198.25, 60.61],
  [331.29, 130.63],
  [466.32, 166.64],
  [589.35, 168.64],
  [732.39, 177.64],
  [867.42, 207.65],
  [998.46, 265.66],
  [1133.49, 310.68],
  [1266.53, 342.68],
  [1399.56, 356.69],
];

const CURVE_PATH =
  "M231.258 69.9654C162.548 22.6519 49.2585 4.46418 1.20246 1.28451V1210.8H1451.57V343.735C1272.85 361.668 1017.54 266.946 912.222 217.343C835.742 171.937 657.66 150.654 579.409 159.632C453.031 174.131 296.836 115.122 231.258 69.9654Z";

const STAGGER_MS = 180;

export default function JourneyBackground() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const start = performance.now();
            const tick = (now: number) => {
              const n = Math.min(
                DOTS.length,
                Math.floor((now - start) / STAGGER_MS) + 1
              );
              setLit(n);
              if (n < DOTS.length) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] md:rounded-3xl"
    >
      {/* Single SVG containing the filled curve (= the light-green
         lower area) + the dashed stroke (= the divider) + 11 dots.
         preserveAspectRatio=slice so it always covers the section. */}
      <svg
        viewBox="0 0 1453 1212"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="journey-wave"
            x1="774.585"
            y1="1.28451"
            x2="753.591"
            y2="1210.9"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#87AF73" />
            <stop offset="0.322115" stopColor="#87AF73" stopOpacity="0.7" />
            <stop offset="0.647397" stopColor="#87AF73" stopOpacity="0.7" />
            <stop offset="1" stopColor="#87AF73" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Wavy light-green shape (covers the lower area of the section) */}
        <path
          d={CURVE_PATH}
          fill="url(#journey-wave)"
          stroke="#DFF49F"
          strokeWidth="2.4"
        />

        {/* Dots — animated sequentially */}
        {DOTS.map(([x, y], i) => {
          const cx = x + 5;
          const cy = y + 5;
          const active = i < lit;
          return (
            <g key={i}>
              {/* Outer glow on the currently-advancing dot */}
              {active && i === lit - 1 && lit < DOTS.length ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="none"
                  stroke="#DFF49F"
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill="#DFF49F"
                style={{
                  opacity: active ? 1 : 0.2,
                  transform: `scale(${active ? 1 : 0.5})`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition:
                    "opacity 320ms ease-out, transform 320ms ease-out",
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
