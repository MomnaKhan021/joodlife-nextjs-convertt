"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Timeline stages — three horizontal milestones that light up one
 * after the other as the section scrolls into view. Each stage has
 *   1. A pill label (Today / 1-6 Months / 6-12 Months)
 *   2. A bold title (Simple assessment / Healthy weight loss / Lasting change)
 *   3. A short description
 *
 * The dashed connecting line + 3 dots above them animates left-to-
 * right, illuminating each dot a moment before its text fades in.
 * Per the Figma the timeline reads chronologically (Today on the left
 * → 6-12 months on the right) and each beat lands ~600ms apart.
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
    <div ref={rootRef} className="flex flex-col items-center gap-8 md:items-start md:gap-10">
      <div className="flex flex-col items-center gap-4 text-center md:items-start md:gap-5 md:text-left">
        <span className="inline-flex items-center rounded-full border border-dashed border-white/60 px-5 py-1.5 font-ui text-[13px] font-medium tracking-[-0.02em] text-white">
          Timeline
        </span>
        <h2 className="font-display text-[32px] font-semibold leading-[38px] tracking-[-0.025em] text-white md:text-[48px] md:leading-[52px]">
          What to expect in{" "}
          <em className="font-serif italic font-normal">your journey</em>
        </h2>
      </div>

      <div className="w-full">
        {/* Desktop rail — dashed line + 3 dots that light up one by one */}
        <div className="hidden md:block">
          <div
            aria-hidden
            className="relative mb-10 h-3 w-full"
          >
            {/* Inactive dashed line */}
            <div
              className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.4) 50%, transparent 50%)",
                backgroundSize: "12px 2px",
                backgroundRepeat: "repeat-x",
              }}
            />
            {/* Active fill — same dash pattern but with the brand
                yellow-green. Width animates as stages light up. */}
            <div
              className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden"
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
                  backgroundSize: "12px 2px",
                  backgroundRepeat: "repeat-x",
                }}
              />
            </div>
            {/* 3 dots */}
            {STAGES.map((_, i) => {
              const active = i < lit;
              const left = (i * 100) / 2; // 0, 50, 100
              return (
                <span
                  key={i}
                  className="absolute top-1/2 rounded-full"
                  style={{
                    left: `${left}%`,
                    width: 12,
                    height: 12,
                    backgroundColor: active ? "#dff49f" : "rgba(223,244,159,0.35)",
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

          {/* 3 columns of text — fade in as the matching dot lights up */}
          <div className="grid grid-cols-3 gap-8">
            {STAGES.map((s, i) => {
              const active = i < lit;
              return (
                <div
                  key={s.pill}
                  className="flex flex-col items-start gap-3 text-left"
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
                  <span className="inline-flex items-center rounded-full border border-dashed border-white/60 px-4 py-1.5 font-ui text-[12px] font-medium tracking-[-0.02em] text-white">
                    {s.pill}
                  </span>
                  <h3 className="font-ui text-[22px] font-bold leading-[26px] tracking-[-0.02em] text-white">
                    {s.title}
                  </h3>
                  <p className="max-w-[300px] font-ui text-[14px] font-medium leading-[20px] tracking-[-0.02em] text-white/85">
                    {s.copy}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical list — each stage fades in one by one */}
        <ul className="flex flex-col gap-6 md:hidden">
          {STAGES.map((s, i) => {
            const active = i < lit;
            return (
              <li
                key={s.pill}
                className="flex flex-col gap-2"
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
                <span className="inline-flex w-fit items-center rounded-full border border-dashed border-white/60 px-4 py-1.5 font-ui text-[12px] font-medium tracking-[-0.02em] text-white">
                  {s.pill}
                </span>
                <h3 className="font-ui text-[18px] font-bold leading-[22px] tracking-[-0.02em] text-white">
                  {s.title}
                </h3>
                <p className="font-ui text-[14px] font-medium leading-[20px] tracking-[-0.02em] text-white/80">
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
