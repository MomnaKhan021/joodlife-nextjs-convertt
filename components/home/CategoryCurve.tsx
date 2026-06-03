"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Decorative wavy connector line for the category preview sections —
 * Figma "Group 1000004231" (Vector 3 + 11 dots) inside Components
 * 289 / 290 / 291. The line gently descends left→right across the top
 * of each section.
 *
 * When the section scrolls into view the stroke "draws on" from its
 * start to its end (top → bottom of the descending curve) and the
 * eleven dots light up one-by-one along it. Honours
 * prefers-reduced-motion by rendering the final state immediately.
 *
 * The path declares pathLength={1} so the draw-on animation works via a
 * normalised stroke-dasharray of 1 — no runtime measurement, no race.
 */

// Dot coordinates sampled from Figma (viewBox 1444 × 372).
const DOTS: ReadonlyArray<readonly [number, number]> = [
  [63, 8],
  [196, 50],
  [329, 122],
  [463, 159],
  [586, 161],
  [728, 170],
  [862, 201],
  [993, 261],
  [1127, 307],
  [1260, 340],
  [1392, 354],
];

const VB_W = 1444;
const VB_H = 372;

/** Smooth Catmull-Rom path through the sampled points. */
function buildPath(pts: ReadonlyArray<readonly [number, number]>): string {
  const d: string[] = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

// The visible line runs edge-to-edge: anchor points just outside the
// viewBox on each side (extrapolated from the end dots) make the stroke
// reach the very left and right of the section. The dots themselves stay
// at the sampled positions.
const LINE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [-60, -12],
  ...DOTS,
  [VB_W + 60, 366],
];

const PATH = buildPath(LINE_POINTS);
const DRAW_MS = 1800;

export default function CategoryCurve({
  color = "#ffffff",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [active, setActive] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    let done = false;
    const check = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      // fire once the curve's top edge enters the lower 90% of the viewport
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
        done = true;
        setActive(true);
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  const drawn = active || reduced;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={PATH}
        pathLength={1}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: drawn ? 0 : 1,
          transition: reduced
            ? "none"
            : `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      />
      {DOTS.map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={5}
          fill={color}
          style={{
            opacity: drawn ? 1 : 0,
            transform: drawn ? "scale(1)" : "scale(0.3)",
            transformOrigin: `${cx}px ${cy}px`,
            transition: reduced
              ? "none"
              : "opacity 320ms ease-out, transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            // light up in sequence as the line reaches each dot
            transitionDelay: `${Math.round((i / (DOTS.length - 1)) * DRAW_MS * 0.85)}ms`,
          }}
        />
      ))}
    </svg>
  );
}
