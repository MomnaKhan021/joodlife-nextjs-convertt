"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";

/**
 * Quiz banner — "Let's get to know you" + "Feel Energetic"
 * Figma node 141:2739 (Updated Home Page, 2026 Apr 22).
 *
 * Desktop geometry (1440 frame):
 *  - Outer section bg: white, height 927
 *  - Heading frame: 1280×103 (centered)
 *  - Two cards: each 650×584, gap 20, dark-green #142e2a
 *  - Right-card "Feel Energetic" pill: 125×36, white/16% bg, radius 40
 *  - Right-card progress overlay: 602×179, #142e2a/20 bg, radius 8,
 *      backdrop-blur 40, padding 24/12, contains:
 *        * top row 578×64 (text + "loos up to 20kg")
 *        * progress track 578×20, white bg, radius 60
 *        * progress fill 302×20 (52%), #142e2a, radius 60
 *        * marker ellipse 24×24, #d9d9d9
 *        * 5 weight labels evenly spaced
 *
 * Animation: the progress overlay tweens from 0 → target (52%) the
 * first time it scrolls into view (1.8s ease-out cubic).
 */

const PROGRESS_TARGET = 0.52; // 302/578 from Figma
// Premium, deliberate feel — the bar slowly fills as if it were
// charting the user's weight loss over months, not whipping across
// the card in a split second.
const DURATION_MS = 3800;

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function useAnimatedProgress(target: number, isActive: boolean, ms = DURATION_MS) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ms);
      setValue(target * easeOutQuart(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, isActive, ms]);

  return value;
}

const WEIGHT_LABELS = ["140kg", "130kg", "120kg", "110kg", "100kg"];

function FeelEnergeticOverlay({ active }: { active: boolean }) {
  const progress = useAnimatedProgress(PROGRESS_TARGET, active);
  const pct = progress * 100;

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">
      {/* Feel Energetic pill — 125×36, white at 16%, radius 40 */}
      <span
        className="inline-flex w-fit items-center justify-center rounded-[40px] bg-white/[0.16] backdrop-blur-md"
        style={{ height: 36, padding: "8px 14px" }}
      >
        <span className="font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-white">
          Feel Energetic
        </span>
      </span>

      {/* Progress overlay — 602×179, dark green at 20%, radius 8, blur 40 */}
      <div
        className="rounded-lg"
        style={{
          backgroundColor: "rgba(20, 46, 42, 0.20)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          padding: "24px 12px",
        }}
      >
        {/* Top row: copy + "loos up to 20kg" */}
        <div className="flex items-start justify-between gap-4 pb-5">
          <p className="max-w-[352px] font-ui text-[14.5px] leading-[19px] tracking-[-0.02em] text-white md:text-[16.3px] md:leading-[20px]">
            Makeing sure you are moving in the right direction by tracking your
            progress
          </p>
          <div className="flex flex-col items-end leading-none">
            <span className="font-ui text-[14.5px] leading-[20px] tracking-[-0.02em] text-white md:text-[16.3px]">
              loos up to
            </span>
            <span
              className="mt-1 font-display font-medium leading-none tabular-nums text-white"
              style={{ fontSize: 32, letterSpacing: "0.04em" }}
            >
              20kg
            </span>
          </div>
        </div>

        {/* Progress track + fill + marker dot */}
        <div className="relative h-5 w-full overflow-visible rounded-full bg-white">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#142e2a]"
            style={{
              width: `${pct}%`,
              transition: "width 160ms linear",
            }}
          />
          {/* Marker ellipse — sits on the track edge of the fill */}
          <span
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#d9d9d9] ring-1 ring-black/5 shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
            style={{
              left: `calc(${pct}% - 12px)`,
              transition: "left 160ms linear",
              opacity: progress > 0 ? 1 : 0,
            }}
          />
        </div>

        {/* Weight labels — evenly spaced */}
        <div className="mt-2 flex justify-between font-ui text-[12px] font-medium text-white md:text-[16.3px] md:leading-[20px]">
          {WEIGHT_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuizBanner() {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [overlayActive, setOverlayActive] = useState(false);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setOverlayActive(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label="Personalization quiz"
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        {/* Heading frame — 48px Gilroy-SemiBold / 16.3px Saans body */}
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 pb-10 text-center md:pb-[60px]"
        >
          <h2 className="font-display text-[32px] leading-[36px] font-semibold tracking-[-0.025em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Let&rsquo;s get to{" "}
            <em className="font-serif italic font-normal">know</em> you
          </h2>
          <p className="max-w-[546px] font-ui text-[15px] leading-[22px] tracking-[-0.02em] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Answer a few simple questions so we can match you with the right
            treatment and support for lasting results.
          </p>
        </Reveal>

        {/* Cards row — 650×584 each on desktop, 20px gap */}
        <Reveal delay={120} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Left card — quiz preview */}
          <div className="flex flex-col items-center gap-8 rounded-[20px] bg-[#142e2a] px-8 py-10 text-center md:h-[584px] md:px-12 md:py-12">
            <div className="relative h-[234px] w-[234px]">
              <div className="absolute left-0 top-0 flex h-[194px] w-[160px] flex-col items-center gap-2 rounded-[17px] bg-[#d3dabe] px-5 py-2">
                <span className="font-ui text-[12px] leading-[14px] text-[#142e2a]">
                  Your weight- loss plan
                </span>
                <div className="relative h-[128px] w-[134px]">
                  <div className="absolute inset-0 grid grid-cols-9 gap-[5px]">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="flex flex-col justify-end gap-1">
                        <div className="h-[7px] rounded-full bg-[#87af73]" />
                        <div className="h-[7px] rounded-full bg-[#87af73]" />
                        <div className="h-[7px] rounded-full bg-[#142e2a]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 flex h-[192px] w-[159px] flex-col items-center justify-between rounded-[17px] bg-white px-3 py-3">
                <p className="font-ui text-[16.3px] leading-[20px] text-[#142e2a]">
                  What is your desired weight?
                </p>
                <div className="flex w-full items-center gap-2">
                  <div className="h-[33px] flex-1 rounded-md bg-[#f4f5ef]" />
                  <div className="grid h-[28px] w-[28px] place-items-center rounded-full bg-[#142e2a]">
                    <span className="font-ui text-[12px] text-white">→</span>
                  </div>
                  <span className="font-outfit text-[14px] leading-[18px] text-[#142e2a]">
                    lbs
                  </span>
                </div>
              </div>
            </div>

            <p className="max-w-[500px] font-ui text-[15px] leading-[22px] tracking-[-0.02em] text-white md:text-[16.3px] md:leading-[20px]">
              Answer a few simple questions so we can match you with the right
              treatment and support for lasting results.
            </p>

            <a
              href="#quiz"
              className="btn-cta inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-10 font-ui text-[16.3px] font-semibold leading-[20px] tracking-[-0.02em] text-[#142f2b] hover:bg-[#d3dabe]"
            >
              Start Quiz
            </a>
          </div>

          {/* Right card — image with Feel Energetic overlay */}
          <div
            ref={overlayRef}
            className="relative overflow-hidden rounded-[20px] bg-[#142e2a] md:h-[584px]"
          >
            <Image
              src="/assets/figma/quiz-feel-energetic.png"
              alt="Energetic customer enjoying a daily walk"
              fill
              sizes="(max-width: 768px) 100vw, 650px"
              className="object-cover object-center"
              priority={false}
            />
            <FeelEnergeticOverlay active={overlayActive} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
