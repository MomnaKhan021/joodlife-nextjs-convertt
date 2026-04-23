"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background SVG extracted from Figma Component 94 (Vector 3 + 11
 * dots). The wavy light-green shape covers the bottom portion of
 * the section so it reads as two shades of green separated by a
 * dashed curve. Dots light up sequentially from point 0 to the
 * last one when the section scrolls into view.
 */

// Dot positions copied straight from the Figma export (each matrix
// translate is the (x, y) of the circle's top-left; offset by +5 for
// the centre since r=5).
const DOTS: Array<[number, number]> = [
  [59.22 + 5, 14.6 + 5],
  [193.25 + 5, 55.61 + 5],
  [326.29 + 5, 125.63 + 5],
  [461.32 + 5, 161.64 + 5],
  [584.35 + 5, 163.64 + 5],
  [727.39 + 5, 172.64 + 5],
  [862.42 + 5, 202.65 + 5],
  [993.46 + 5, 260.66 + 5],
  [1128.49 + 5, 305.68 + 5],
  [1261.53 + 5, 337.68 + 5],
  [1394.56 + 5, 351.69 + 5],
];

// Per-dot stagger in ms (total animation ~2s)
const STAGGER_MS = 180;

export default function JourneyBackground() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0); // how many dots are lit

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let observer: IntersectionObserver | null = null;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start staggered reveal
            const start = performance.now();
            const total = DOTS.length;

            const tick = (now: number) => {
              const elapsed = now - start;
              const lit = Math.min(
                total,
                Math.floor(elapsed / STAGGER_MS) + 1
              );
              setActive(lit);
              if (lit < total) raf = requestAnimationFrame(tick);
            };

            raf = requestAnimationFrame(tick);
            observer?.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] md:rounded-3xl"
    >
      {/* Wavy light-green shape covering the lower half + dashed
         dotted curve along its top edge */}
      <svg
        viewBox="0 0 1453 1212"
        preserveAspectRatio="xMidYMid slice"
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
        <path
          d="M231.258 69.9654C162.548 22.6519 49.2585 4.46418 1.20246 1.28451V1210.8H1451.57V343.735C1272.85 361.668 1017.54 266.946 912.222 217.343C835.742 171.937 657.66 150.654 579.409 159.632C453.031 174.131 296.836 115.122 231.258 69.9654Z"
          fill="url(#journey-wave)"
          stroke="#DFF49F"
          strokeWidth="2.40401"
        />

        {/* Dots, lit sequentially on scroll-into-view */}
        {DOTS.map(([cx, cy], i) => {
          const lit = i < active;
          return (
            <g
              key={i}
              style={{
                opacity: lit ? 1 : 0.25,
                transform: lit ? "scale(1)" : "scale(0.6)",
                transformOrigin: `${cx}px ${cy}px`,
                transition:
                  "opacity 350ms ease-out, transform 350ms ease-out",
              }}
            >
              <circle cx={cx} cy={cy} r={5} fill="#DFF49F" />
              {/* Soft glow ring that appears on the last lit dot */}
              {lit && i === active - 1 && i !== DOTS.length - 1 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={12}
                  fill="none"
                  stroke="#DFF49F"
                  strokeOpacity={0.4}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
