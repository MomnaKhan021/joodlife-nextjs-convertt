"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "What to expect in your journey" timeline. A dashed track with a progress
 * line that fills through the three points (Today → 1–3 months → 3–6 months)
 * when the section scrolls into view. Horizontal on desktop, vertical on
 * mobile — with the copy set clear of the line (never overlapping it).
 */

export type Stage = { tag: string; title: string; body: string };

function StageText({ s }: { s: Stage }) {
  return (
    <div>
      <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 font-ui text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
        {s.tag}
      </span>
      <h3 className="mt-2.5 font-display text-[19px] font-semibold text-white md:text-[21px]">
        {s.title}
      </h3>
      <p className="mt-1.5 max-w-[38ch] font-ui text-[13px] leading-[19px] text-white/80">
        {s.body}
      </p>
    </div>
  );
}

function Node() {
  return (
    <span className="z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/30 ring-4 ring-[#3ba7d6]">
      <span className="h-2 w-2 rounded-full bg-white" />
    </span>
  );
}

export default function EdTimeline({ stages }: { stages: Stage[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setFilled(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-10">
      {/* ── Desktop: horizontal ── */}
      <div className="hidden md:block">
        <div className="relative mb-6 h-5">
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/35" />
          <div
            className="absolute left-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white transition-[width] duration-[1800ms] ease-out"
            style={{ width: filled ? "calc(100% - 16px)" : "0%" }}
          />
          <div className="relative flex justify-between">
            {stages.map((s) => (
              <Node key={s.tag} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {stages.map((s) => (
            <StageText key={s.tag} s={s} />
          ))}
        </div>
      </div>

      {/* ── Mobile: vertical ── */}
      <div className="relative md:hidden">
        {/* Track + fill live in the left gutter, behind the nodes */}
        <div className="absolute bottom-3 left-[9px] top-3 w-[2px]">
          <div className="absolute inset-0 border-l-2 border-dashed border-white/35" />
          <div
            className="absolute inset-x-0 top-0 rounded-full bg-white transition-[height] duration-[1600ms] ease-out"
            style={{ height: filled ? "100%" : "0%" }}
          />
        </div>
        <ul className="flex flex-col gap-8">
          {stages.map((s) => (
            <li key={s.tag} className="relative flex gap-4">
              <Node />
              <div className="flex-1 pt-0.5">
                <StageText s={s} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
