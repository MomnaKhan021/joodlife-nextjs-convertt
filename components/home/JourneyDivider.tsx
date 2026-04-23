"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wavy divider between the Journey section's dark-green top and
 * light-green bottom, with the 11 Figma dots that light up one-by-one
 * on scroll-into-view.
 *
 * This is positioned between two explicit zones (see JourneyPlan.tsx),
 * so it only needs to render the curve + dot band itself — the
 * background colours come from the siblings above and below.
 */

const CURVE_PATH =
  "M231.258 69.9654C162.548 22.6519 49.2585 4.46418 1.20246 1.28451V1210.8H1451.57V343.735C1272.85 361.668 1017.54 266.946 912.222 217.343C835.742 171.937 657.66 150.654 579.409 159.632C453.031 174.131 296.836 115.122 231.258 69.9654Z";

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

const STAGGER_MS = 200;

export default function JourneyDivider() {
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
      { threshold: 0.1 }
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
      className="relative -mb-px h-[140px] w-full md:h-[220px]"
    >
      {/* The filled curve — this is the LIGHT-green area crossing into
         the dark one. Its own gradient fill replicates the Figma stops. */}
      <svg
        viewBox="0 0 1453 400"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="journey-wave"
            x1="774.585"
            y1="1.28451"
            x2="753.591"
            y2="399"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#87AF73" />
            <stop offset="1" stopColor="#87AF73" />
          </linearGradient>
        </defs>
        {/* Path is clipped to a 400-tall viewBox so we only see the
           wavy top edge of the Figma shape, not the entire bottom half. */}
        <path
          d={CURVE_PATH}
          fill="url(#journey-wave)"
          stroke="#DFF49F"
          strokeWidth="2.4"
          style={{ transform: "translateY(0)" }}
        />
      </svg>

      {/* Dots — rendered as a separate SVG so we can animate them
         cleanly without re-rendering the curve. Same viewBox so the
         coordinates line up with the curve's top edge. */}
      <svg
        viewBox="0 0 1453 400"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {DOTS.map(([x, y], i) => {
          const cx = x + 5;
          const cy = y + 5;
          const active = i < lit;
          return (
            <g key={i}>
              {active && i === lit - 1 && lit < DOTS.length ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="none"
                  stroke="#DFF49F"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill="#DFF49F"
                style={{
                  opacity: active ? 1 : 0.25,
                  transform: `scale(${active ? 1 : 0.5})`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition:
                    "opacity 380ms ease-out, transform 380ms ease-out",
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
