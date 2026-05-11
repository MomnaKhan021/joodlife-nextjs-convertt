"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Timeline section header + stages — Figma node 141:2349.
 *
 * Critical Figma details:
 *   - "TIMELINE" badge: white at 30%, radius 55, uppercase text
 *   - Desktop heading: "What to expect in / your journey"
 *   - Mobile heading:  "What to expect in your first month with Jood"
 *     (different copy on mobile per the Figma mobile frame)
 *   - Stage pills: white-at-10%, radius 24, padding 10/16, uppercase
 *     letter-spacing, 14px Saans medium
 *   - Stage titles: 24px bold (desktop) / 20px bold (mobile)
 *   - Stage descriptions: 16px Saans regular / line-height 20
 */

const STAGES = [
  {
    pill: "Today",
    title: "Simple assessment",
    copyDesktop:
      "Quick online consultation with prescription and delivery if eligible.",
    copyMobile:
      "Quick online consultation with prescription and delivery if eligible and coaches through the app.",
  },
  {
    pill: "1 - 6 Months",
    title: "Healthy weight loss",
    copyDesktop: "Steady weight loss with ongoing clinical support.",
    copyMobile: "Steady weight loss with ongoing clinical support.",
  },
  {
    pill: "6 - 12 Months",
    title: "Lasting change",
    copyDesktop: "Maintain results with continued guidance and care.",
    copyMobile: "Maintain results with continued guidance and care.",
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

  const railPct = lit === 0 ? 0 : lit === 1 ? 0 : lit === 2 ? 50 : 100;

  return (
    <div
      ref={rootRef}
      className="flex flex-col items-start gap-8 md:gap-12"
    >
      {/* Heading block */}
      <div className="flex flex-col items-start gap-5 text-left md:gap-6">
        {/* TIMELINE pill — solid white at 30% */}
        <span className="inline-flex h-[35px] items-center justify-center rounded-full bg-white/30 px-5 font-ui text-[12px] font-medium uppercase leading-[16px] tracking-[0.08em] text-white">
          Timeline
        </span>

        {/* Desktop heading */}
        <h2 className="hidden font-display text-[48px] font-semibold leading-[52px] tracking-[-0.025em] text-white md:block">
          What to expect in
          <br />
          <em className="font-serif italic font-normal">your journey</em>
        </h2>

        {/* Mobile heading — different copy per Figma mobile frame */}
        <h2 className="font-display text-[28px] font-semibold leading-[34px] tracking-[-0.025em] text-white md:hidden">
          What to expect{" "}
          <em className="font-serif italic font-normal">in your first month</em>{" "}
          with Jood
        </h2>
      </div>

      <div className="w-full">
        {/* Desktop rail */}
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
            {/* 3 dots */}
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
                  {/* Stage pill — white/10%, uppercase, tracking */}
                  <span className="inline-flex items-center justify-center rounded-3xl bg-white/10 px-4 py-[10px] font-ui text-[12px] font-medium uppercase leading-[14px] tracking-[0.08em] text-white">
                    {s.pill}
                  </span>
                  <h3 className="font-ui text-[24px] font-bold leading-[26px] tracking-[-0.02em] text-white">
                    {s.title}
                  </h3>
                  <p className="max-w-[380px] font-ui text-[16px] font-normal leading-[20px] tracking-[-0.02em] text-white/90">
                    {s.copyDesktop}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical list — each stage stacked */}
        <ul className="flex flex-col gap-7 md:hidden">
          {STAGES.map((s, i) => {
            const active = i < lit;
            return (
              <li
                key={s.pill}
                className="flex flex-col items-start gap-3"
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
                <span className="inline-flex w-fit items-center justify-center rounded-3xl bg-white/10 px-4 py-[10px] font-ui text-[12px] font-medium uppercase leading-[14px] tracking-[0.08em] text-white">
                  {s.pill}
                </span>
                <h3 className="font-ui text-[22px] font-bold leading-[26px] tracking-[-0.02em] text-white">
                  {s.title}
                </h3>
                <p className="font-ui text-[15px] font-normal leading-[20px] tracking-[-0.02em] text-white/90">
                  {s.copyMobile}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
