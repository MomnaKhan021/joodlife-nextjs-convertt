"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GraphPoint } from "@/lib/pdp-products";

interface WeightLossGraphProps {
  points: GraphPoint[];
  yLabels: number[];
  xLabels: string[];
  callout: string;
  yUnit?: string;
}

/**
 * Animated weight-loss graph — Figma 3:1976.
 *
 * Animates with direct DOM manipulation + requestAnimationFrame so it
 * doesn't depend on React state synchronisation. The line "draws on"
 * via stroke-dashoffset, the purple area-fill grows underneath via a
 * clipPath rect that expands left → right, and the marker + callout
 * fade in once the curve is mostly drawn.
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
  const clipRectRef = useRef<SVGRectElement | null>(null);
  const markerGroupRef = useRef<SVGGElement | null>(null);

  // Plot geometry — coordinate system 800 × 400
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
  }, [points, minY, maxY]);

  /** Smooth Catmull-Rom-style Bezier path through the points. */
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

  const areaPath = useMemo(() => {
    if (plotPoints.length === 0 || !linePath) return "";
    return `${linePath} L${plotPoints[plotPoints.length - 1].x},${PLOT.bottom} L${plotPoints[0].x},${PLOT.bottom} Z`;
  }, [linePath, plotPoints]);

  const lastPoint = plotPoints[plotPoints.length - 1];

  useEffect(() => {
    const path = pathRef.current;
    const clipRect = clipRectRef.current;
    const marker = markerGroupRef.current;
    const root = rootRef.current;
    if (!path || !root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const totalLen = path.getTotalLength();
    const plotWidth = PLOT.right - PLOT.left;

    // Initialize the line in a fully-undrawn state
    path.style.strokeDasharray = `${totalLen}`;
    path.style.strokeDashoffset = `${reduce ? 0 : totalLen}`;
    if (clipRect) clipRect.setAttribute("width", `${reduce ? plotWidth : 0}`);
    if (marker) marker.style.opacity = reduce ? "1" : "0";

    if (reduce) return;

    let rafId = 0;
    let started = false;
    let startTs = 0;
    const DURATION = 2400;

    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const t = Math.min(1, (now - startTs) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      path.style.strokeDashoffset = `${totalLen * (1 - eased)}`;
      if (clipRect) clipRect.setAttribute("width", `${plotWidth * eased}`);
      if (marker) {
        const op = eased < 0.85 ? 0 : (eased - 0.85) / 0.15;
        marker.style.opacity = `${op}`;
      }
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    const isInView = () => {
      const r = root.getBoundingClientRect();
      const visible =
        Math.max(0, Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top));
      return visible / Math.max(1, r.height) > 0.2;
    };

    const start = () => {
      if (started) return;
      started = true;
      rafId = requestAnimationFrame(tick);
    };

    if (isInView()) {
      start();
    } else {
      const onScroll = () => {
        if (isInView()) {
          start();
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      // Also try after a short delay as a safety net for embedded
      // browsers that don't fire scroll on initial mount.
      const safety = setTimeout(() => {
        if (!started && isInView()) start();
      }, 600);
      return () => {
        window.removeEventListener("scroll", onScroll);
        clearTimeout(safety);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [linePath]);

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
            <stop offset="0%" stopColor="#b89cb7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b89cb7" stopOpacity="0.35" />
          </linearGradient>
          <clipPath id="weight-area-clip">
            <rect
              ref={clipRectRef}
              x={PLOT.left}
              y={PLOT.top - 5}
              width="0"
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

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#weight-area-fill)"
          clipPath="url(#weight-area-clip)"
        />

        {/* Animated line */}
        <path
          ref={pathRef}
          d={linePath}
          fill="none"
          stroke="#142e2a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End-of-line marker + callout */}
        {lastPoint ? (
          <g ref={markerGroupRef} style={{ opacity: 0 }}>
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={6}
              fill="#ffffff"
              stroke="#142e2a"
              strokeWidth="2"
            />
            <line
              x1={lastPoint.x}
              y1={lastPoint.y - 8}
              x2={lastPoint.x}
              y2={lastPoint.y - 30}
              stroke="#142e2a"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <g transform={`translate(${lastPoint.x - 32}, ${lastPoint.y - 60})`}>
              <rect x="0" y="0" width="64" height="28" rx="6" fill="#142e2a" />
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
