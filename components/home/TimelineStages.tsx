"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Timeline section header + stages — Figma node 141:2349 (Component 289).
 *
 * Exact Figma specs applied:
 *   - "Timeline" pill: 91×35, bg=white at 30% opacity, radius 55
 *     (NOT a dashed-border pill — that was the previous bug)
 *   - Heading "What to expect in / your journey" — 48px Gilroy-SemiBold,
 *     italic serif on the second line, wraps at the comma
 *   - Stages row width 1200px with 3 columns of 380px each
 *   - Stage pills: bg=white at 10% opacity, radius 24, padding 10/16,
 *     14px Saans Regular, solid (no dashed border)
 *   - Stage titles: 24px Saans Bold (weight 790), line-height 26
 *   - Stage descriptions: 16px Saans Regular, line-height 20,
 *     white at 90% opacity
 *
 * Animation: dots illuminate left → right (600ms stagger), with the
 * matching column's content rising into view a beat later.
 */

const STAGES = [
  {
    pill: "Today",
    title: "Simple assessment",
    copy: "Quick online consultation with prescription and delivery if eligible.",
  },
  {
    pill: "1 - 6 Months",
    title: "Healthy weight loss",
    copy: "Steady weight loss with ongoing clinical support.",
  },
  {
    pill: "6 - 12 Months",
    title: "Lasting change",
    copy: "Maintain results with continued guidance and care.",
  },
];

const STAGGER_MS = 600;

export default function TimelineStages() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const start = performance.now();
            const tick = (now: number) => {
              const n = Math.min(
                STAGES.length,
                Math.floor((now - start) / STAGGER_MS) + 1
              );
              setLit(n);
              if (n < STAGES.length) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Active rail fill: 0 → first dot (0%), then to second (50%), then to last (100%)
  const railPct = lit === 0 ? 0 : lit === 1 ? 0 : lit === 2 ? 50 : 100;

  return (
    <div
      ref={rootRef}
      className="flex flex-col items-center gap-8 md:items-start md:gap-12"
    >
      {/* Heading block */}
      <div className="flex flex-col items-center gap-5 text-center md:items-start md:gap-6 md:text-left">
        {/* Timeline pill — solid white at 30%, NOT dashed */}
        <span
          className="inline-flex h-[35px] items-center justify-center rounded-full bg-white/30 px-5 font-ui text-[14px] font-medium leading-[18px] tracking-[-0.02em] text-white"
        >
          Timeline
        </span>

        {/* Heading — line 1 plain, line 2 italic serif */}
        <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-white md:text-[48px] md:leading-[52px]">
          What to expect in
          <br />
          <em className="font-serif italic font-normal">your journey</em>
        </h2>
      </div>

      <div className="w-full">
        {/* Desktop rail — dashed connector + 3 dots that light up */}
        <div className="hidden md:block">
          <div aria-hidden className="relative mb-10 h-3 w-full">
            {/* Inactive dashed line */}
            <div
              className="absolute left-0 right-0 top-1/2 h-[1.5px] -translate-y-1/2"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.35) 50%, transparent 50%)",
                backgroundSize: "10px 1.5px",
                backgroundRepeat: "repeat-x",
              }}
            />
            {/* Active fill */}
            <div
              className="absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 overflow-hidden"
              style={{
                width: `${railPct}%`,
                transition: "width 600ms ease-out",
              }}
            >
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #dff49f 50%, transparent 50%)",
                  backgroundSize: "10px 1.5px",
                  backgroundRepeat: "repeat-x",
                }}
              />
            </div>
            {/* 3 dots at 0% / 50% / 100% */}
            {STAGES.map((_, i) => {
              const active = i < lit;
              const left = (i * 100) / 2;
              return (
                <span
                  key={i}
                  className="absolute top-1/2 rounded-full"
                  style={{
                    left: `${left}%`,
                    width: 10,
                    height: 10,
                    backgroundColor: active
                      ? "#dff49f"
                      : "rgba(223,244,159,0.35)",
                    transform: `translate(-50%, -50%) scale(${active ? 1 : 0.7})`,
                    transformOrigin: "center",
                    transition:
                      "transform 360ms cubic-bezier(0.34,1.56,0.64,1), background-color 360ms ease-out",
                    boxShadow: active
                      ? "0 0 0 4px rgba(223,244,159,0.22), 0 0 12px rgba(223,244,159,0.55)"
                      : "none",
                  }}
                />
              );
            })}
          </div>

          {/* 3 columns of text */}
          <div className="grid grid-cols-3 gap-10">
            {STAGES.map((s, i) => {
              const active = i < lit;
              return (
                <div
                  key={s.pill}
                  className="flex flex-col items-start gap-4 text-left"
                  style={{
                    opacity: active ? 1 : 0,
                    transform: active
                      ? "translate3d(0, 0, 0)"
                      : "translate3d(0, 12px, 0)",
                    transition:
                      "opacity 520ms ease-out, transform 520ms ease-out",
                    transitionDelay: active ? `${i * 80}ms` : "0ms",
                  }}
                >
                  {/* Stage pill — solid white/10%, radius 24, padding 10/16 */}
                  <span
                    className="inline-flex items-center justify-center rounded-3xl bg-white/10 px-4 py-[10px] font-ui text-[14px] font-medium leading-[18px] tracking-[-0.02em] text-white"
                  >
                    {s.pill}
                  </span>
                  <h3 className="font-ui text-[24px] font-bold leading-[26px] tracking-[-0.02em] text-white">
                    {s.title}
                  </h3>
                  <p className="max-w-[380px] font-ui text-[16px] font-normal leading-[20px] tracking-[-0.02em] text-white/90">
                    {s.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical list */}
        <ul className="flex flex-col gap-7 md:hidden">
          {STAGES.map((s, i) => {
            const active = i < lit;
            return (
              <li
                key={s.pill}
                className="flex flex-col gap-3"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, 12px, 0)",
                  transition:
                    "opacity 520ms ease-out, transform 520ms ease-out",
                  transitionDelay: active ? `${i * 80}ms` : "0ms",
                }}
              >
                <span className="inline-flex w-fit items-center justify-center rounded-3xl bg-white/10 px-4 py-[10px] font-ui text-[14px] font-medium leading-[18px] tracking-[-0.02em] text-white">
                  {s.pill}
                </span>
                <h3 className="font-ui text-[20px] font-bold leading-[24px] tracking-[-0.02em] text-white">
                  {s.title}
                </h3>
                <p className="font-ui text-[15px] font-normal leading-[20px] tracking-[-0.02em] text-white/90">
                  {s.copy}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
