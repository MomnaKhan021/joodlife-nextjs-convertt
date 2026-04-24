"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wavy divider between the Journey section's dark-green top and
 * light-green bottom. The divider's own background is the LIGHT
 * green; we paint a DARK green wave inside it so the dark zone
 * visually extends downwards with a curved bottom edge. A yellow-
 * green dashed line sits on top of the boundary, and 11 dots light
 * up one-by-one as the section scrolls into view.
 */

// Closed path that mirrors the Figma Vector 3 — starts at top-left,
// goes across the top, curves along the wavy line, and closes back.
// Rendered in a 1453×400 viewBox so only the wavy upper ~350 units
// of the original Figma curve (which was 1212 tall) are used.
const DARK_FILL_PATH =
  "M0,0 L1453,0 L1453,345 C1272.85,361.67 1017.54,266.95 912.22,217.34 C835.74,171.94 657.66,150.65 579.41,159.63 C453.03,174.13 296.84,115.12 231.26,69.97 C162.55,22.65 49.26,4.46 1.20,1.28 L0,0 Z";

// Just the wavy stroke (matches the top edge of the fill above)
const STROKE_PATH =
  "M1.20 1.28 C 49.26 4.46 162.55 22.65 231.26 69.97 C 296.84 115.12 453.03 174.13 579.41 159.63 C 657.66 150.65 835.74 171.94 912.22 217.34 C 1017.54 266.95 1272.85 361.67 1453 345";

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
      className="relative -mb-px -mt-px h-[180px] w-full bg-[#87af73] md:h-[260px]"
    >
      <svg
        viewBox="0 0 1453 400"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Dark green shape that extends the upper zone with a wavy bottom */}
        <path d={DARK_FILL_PATH} fill="#142e2a" />
        {/* Yellow-green stroke on the wavy boundary */}
        <path
          d={STROKE_PATH}
          stroke="#DFF49F"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="none"
        />
      </svg>

      {/* Dots — separate SVG with preserveAspectRatio="none" so coords
         line up with the curve while each dot is still a real circle
         rendered at its natural size (scaling is uniform in the DOM). */}
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
                  r={18}
                  fill="none"
                  stroke="#DFF49F"
                  strokeOpacity={0.55}
                  strokeWidth={2}
                />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill="#DFF49F"
                stroke="#142e2a"
                strokeWidth={2}
                style={{
                  opacity: active ? 1 : 0.3,
                  transform: `scale(${active ? 1 : 0.55})`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition:
                    "opacity 360ms ease-out, transform 360ms ease-out",
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
