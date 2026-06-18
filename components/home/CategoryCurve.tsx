"use client";

import { useEffect, useRef } from "react";

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

// Dot coordinates (viewBox 1444 × 372). A gentle, near-horizontal wave that
// enters at the left edge and exits at the right edge at mid-height — so the
// connector spans the full width and visibly touches both screen edges
// (matching the Figma), rather than running corner-to-corner.
const DOTS: ReadonlyArray<readonly [number, number]> = [
  [60, 70],
  [210, 96],
  [360, 118],
  [510, 132],
  [665, 162],
  [820, 184],
  [975, 212],
  [1120, 240],
  [1265, 264],
  [1390, 286],
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
  [-80, 56],
  ...DOTS,
  [VB_W + 80, 300],
];

const PATH = buildPath(LINE_POINTS);

export default function CategoryCurve({
  color = "#ffffff",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const dotsRef = useRef<Array<SVGCircleElement | null>>([]);

  // Scroll-LINKED draw: the connector draws progressively as the reader
  // scrolls down through its section — starting at the top of the section
  // and completing as they move down it (top → bottom), rather than a
  // one-shot reveal. Honours prefers-reduced-motion (renders fully drawn).
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    // Track the enclosing category <section> so progress is tied to "this
    // section", not just the thin curve element at its top.
    const section = (svg.closest("section") as HTMLElement | null) ?? svg;

    const apply = (raw: number) => {
      const progress = Math.max(0, Math.min(1, raw));
      if (pathRef.current) {
        pathRef.current.style.strokeDashoffset = String(1 - progress);
      }
      const n = DOTS.length;
      for (let i = 0; i < n; i++) {
        const dot = dotsRef.current[i];
        if (!dot) continue;
        const frac = n > 1 ? i / (n - 1) : 0;
        const lit = progress >= frac - 0.02;
        dot.style.opacity = lit ? "1" : "0";
        dot.style.transform = lit ? "scale(1)" : "scale(0.3)";
      }
    };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      apply(1);
      return;
    }

    let raf = 0;
    const compute = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the section's top sits at the bottom of the viewport (i.e. the
      // reader has just reached the top of the section); 1 after scrolling
      // ~min(sectionHeight, 1.2 viewport) further down it.
      const span = Math.min(r.height, vh * 1.2) || vh;
      apply((vh - r.top) / span);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
        ref={pathRef}
        d={PATH}
        pathLength={1}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          // Small smoothing between rAF scroll samples so the draw isn't jittery.
          transition: "stroke-dashoffset 120ms linear",
        }}
      />
      {DOTS.map(([cx, cy], i) => (
        <circle
          key={`${cx}-${cy}`}
          ref={(el) => {
            dotsRef.current[i] = el;
          }}
          cx={cx}
          cy={cy}
          r={5}
          fill={color}
          style={{
            opacity: 0,
            transform: "scale(0.3)",
            transformOrigin: `${cx}px ${cy}px`,
            transition:
              "opacity 200ms ease-out, transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      ))}
    </svg>
  );
}
