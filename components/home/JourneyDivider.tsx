"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wavy curve divider between the Timeline header and the cards.
 *
 * Per Figma 141:2349 the divider is a single thin WHITE wavy line
 * that traces across the section, with small white dots punctuating
 * its length. The bg above and below the curve is the same dark
 * green — the line is purely decorative, not a colour boundary.
 *
 * Animation: the line draws on top→bottom (along its length) and the
 * dots illuminate sequentially as it draws.
 */

// The wavy stroke path — runs left→right with two smooth bends.
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

const STAGGER_MS = 220;

export default function JourneyDivider() {
  const ref = useRef<HTMLDivElement | null>(null);
  const strokeRef = useRef<SVGPathElement | null>(null);
  const [lit, setLit] = useState(0);
  const [progress, setProgress] = useState(0);
  const [strokeLen, setStrokeLen] = useState(0);

  useEffect(() => {
    if (strokeRef.current) {
      setStrokeLen(strokeRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const start = performance.now();
            const totalDuration = STAGGER_MS * DOTS.length;
            const tick = (now: number) => {
              const elapsed = now - start;
              const n = Math.min(
                DOTS.length,
                Math.floor(elapsed / STAGGER_MS) + 1
              );
              setLit(n);
              setProgress(Math.min(1, elapsed / totalDuration));
              if (elapsed < totalDuration) raf = requestAnimationFrame(tick);
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

  const dashOffset = strokeLen * (1 - progress);

  return (
    <div
      ref={ref}
      aria-hidden
      className="relative -mb-px -mt-px h-[140px] w-full bg-[#142e2a] md:h-[200px]"
    >
      <svg
        viewBox="0 0 1453 400"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {/* Thin white wavy stroke — draws on along its length */}
        <path
          ref={strokeRef}
          d={STROKE_PATH}
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeLen}
          strokeDashoffset={dashOffset}
          style={{
            transition: strokeLen ? "stroke-dashoffset 80ms linear" : "none",
          }}
        />
      </svg>

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
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill="#ffffff"
                style={{
                  opacity: active ? 1 : 0,
                  transform: `scale(${active ? 1 : 0.6})`,
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
