"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphPoint } from "@/lib/pdp-products";

interface WeightLossGraphProps {
  points: GraphPoint[];
  yLabels: number[];
  xLabels: string[];
  callout: string;
  /** A label suffix for the y-axis, e.g. "(kg)" */
  yUnit?: string;
}

/**
 * Animated weight-loss graph — Figma 3:1976.
 *
 * Smooth Bezier line tracing weight over months with a light-purple
 * area-fill underneath. The line draws on top → bottom (visually it
 * starts at the upper-left and descends to the lower-right, which is
 * the user's mental "top-down" through the data).
 *
 * On scroll-into-view we tween:
 *   - `progress` 0 → 1 which feeds stroke-dashoffset (line draw)
 *   - the area-fill clip-path width grows in sync
 *   - the -27% callout marker fades in once the curve is mostly drawn
 *
 * The animation only plays once.
 */
export default function WeightLossGraph({
  points,
  yLabels,
  xLabels,
  callout,
  yUnit = "(kg)",
}: WeightLossGraphProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState(0);
  const [progress, setProgress] = useState(0);

  // Inner chart area (excluding y-axis labels + padding)
  // Coordinate system: 800 × 400 viewBox.
  // Plot area uses x ∈ [70, 780], y ∈ [40, 360].
  const PLOT = { left: 70, right: 780, top: 40, bottom: 360 };
  const minY = Math.min(...yLabels);
  const maxY = Math.max(...yLabels);

  const plotPoints = useMemo(() => {
    return points.map((p, i) => {
      const x =
        PLOT.left +
        ((PLOT.right - PLOT.left) * i) / Math.max(1, points.length - 1);
      const y =
        PLOT.bottom -
        ((p.weight - minY) / (maxY - minY)) * (PLOT.bottom - PLOT.top);
      return { x, y, weight: p.weight };
    });
  }, [points, PLOT.left, PLOT.right, PLOT.top, PLOT.bottom, minY, maxY]);

  /** Build a smooth Catmull-Rom-style path through the points. */
  const linePath = useMemo(() => {
    if (plotPoints.length === 0) return "";
    const path: string[] = [];
    path.push(`M${plotPoints[0].x},${plotPoints[0].y}`);
    for (let i = 0; i < plotPoints.length - 1; i++) {
      const p0 = plotPoints[i - 1] ?? plotPoints[i];
      const p1 = plotPoints[i];
      const p2 = plotPoints[i + 1];
      const p3 = plotPoints[i + 2] ?? p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }
    return path.join(" ");
  }, [plotPoints]);

  /** Closed area path: line + drop to baseline + close. */
  const areaPath = useMemo(() => {
    if (plotPoints.length === 0 || !linePath) return "";
    return `${linePath} L${plotPoints[plotPoints.length - 1].x},${PLOT.bottom} L${plotPoints[0].x},${PLOT.bottom} Z`;
  }, [linePath, plotPoints, PLOT.bottom]);

  // Measure the line length once mounted
  useEffect(() => {
    if (pathRef.current) {
      setPathLen(pathRef.current.getTotalLength());
    }
  }, [linePath]);

  // Trigger the animation on intersection
  useEffect(() => {
    if (!rootRef.current) return;
    const el = rootRef.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const DURATION = 2400; // 2.4s
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / DURATION);
              // ease-out-cubic
              const eased = 1 - Math.pow(1 - t, 3);
              setProgress(eased);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const dashOffset = pathLen * (1 - progress);
  // The marker only appears once the curve is nearly complete
  const markerOpacity = progress < 0.85 ? 0 : (progress - 0.85) / 0.15;
  const lastPoint = plotPoints[plotPoints.length - 1];

  return (
    <div
      ref={rootRef}
      className="relative w-full rounded-[20px] bg-[#f7f9f2] p-6 md:p-8"
    >
      <p className="mb-2 font-ui text-[14px] font-medium tracking-[-0.01em] text-[#142e2a]/70">
        Weight {yUnit}
      </p>

      <svg
        viewBox="0 0 800 400"
        className="block h-auto w-full"
        role="img"
        aria-label={`Weight loss curve from ${points[0]?.weight}kg to ${points[points.length - 1]?.weight}kg`}
      >
        <defs>
          <linearGradient id="weight-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b89cb7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#b89cb7" stopOpacity="0.35" />
          </linearGradient>
          {/* Clip the area fill so it appears with the line draw */}
          <clipPath id="weight-area-clip">
            <rect
              x={PLOT.left}
              y={PLOT.top - 5}
              width={(PLOT.right - PLOT.left) * progress}
              height={PLOT.bottom - PLOT.top + 10}
            />
          </clipPath>
        </defs>

        {/* Y-axis labels + horizontal dashed gridlines */}
        {yLabels.map((label) => {
          const y =
            PLOT.bottom -
            ((label - minY) / (maxY - minY)) * (PLOT.bottom - PLOT.top);
          return (
            <g key={label}>
              <text
                x={PLOT.left - 16}
                y={y + 4}
                textAnchor="end"
                fontSize="14"
                fontFamily="inherit"
                fill="#142e2a"
                fillOpacity="0.7"
              >
                {label}
              </text>
              <line
                x1={PLOT.left}
                y1={y}
                x2={PLOT.right}
                y2={y}
                stroke="#142e2a"
                strokeOpacity="0.08"
                strokeDasharray="3 4"
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {plotPoints.map((p, i) => (
          <text
            key={xLabels[i] ?? i}
            x={p.x}
            y={PLOT.bottom + 28}
            textAnchor="middle"
            fontSize="14"
            fontFamily="inherit"
            fill="#142e2a"
            fillOpacity="0.85"
          >
            {xLabels[i]}
          </text>
        ))}

        {/* Area fill — clipped so it grows with the line */}
        <path
          d={areaPath}
          fill="url(#weight-area-fill)"
          clipPath="url(#weight-area-clip)"
        />

        {/* The animated line itself */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="#142e2a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLen}
          strokeDashoffset={dashOffset}
          style={{
            transition: pathLen ? "stroke-dashoffset 60ms linear" : "none",
          }}
        />

        {/* End-of-line marker */}
        {lastPoint ? (
          <g style={{ opacity: markerOpacity, transition: "opacity 240ms ease-out" }}>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={6}
              fill="#ffffff"
              stroke="#142e2a"
              strokeWidth="2"
            />
            {/* Vertical connector to the callout */}
            <line
              x1={lastPoint.x}
              y1={lastPoint.y - 8}
              x2={lastPoint.x}
              y2={lastPoint.y - 30}
              stroke="#142e2a"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {/* Callout pill */}
            <g transform={`translate(${lastPoint.x - 32}, ${lastPoint.y - 60})`}>
              <rect
                x="0"
                y="0"
                width="64"
                height="28"
                rx="6"
                fill="#142e2a"
              />
              <text
                x="32"
                y="19"
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fontFamily="inherit"
                fill="#ffffff"
              >
                {callout}
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
