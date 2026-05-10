"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";

/**
 * Quiz banner + "Feel Energetic" progress overlay.
 *
 * Per the spec, the progress bar must animate from 0 → target when it
 * comes into view. We tween both the bar fill width and a counter for
 * the displayed weight (140kg → 120kg) so the whole visual feels alive.
 */

const PROGRESS_TARGET = 0.5; // 50% — visually matches the Figma overlay
const WEIGHT_START_KG = 140;
const WEIGHT_END_KG = 120;
const DURATION_MS = 1800;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
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
      setValue(target * easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, isActive, ms]);

  return value;
}

function FeelEnergeticOverlay({ active }: { active: boolean }) {
  const progress = useAnimatedProgress(PROGRESS_TARGET, active);
  const currentWeight =
    WEIGHT_START_KG - (WEIGHT_START_KG - WEIGHT_END_KG) * (progress / PROGRESS_TARGET || 1);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6">
      <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-4 py-2 font-ui text-[16.3px] font-semibold text-white">
        Feel Energetic
      </span>
      <div className="rounded-lg bg-[#142e2a]/20 p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4 pb-4">
          <p className="font-ui text-[14px] leading-[20px] text-white md:text-[16.3px]">
            Makeing sure you are moving in the right direction by tracking your
            progress
          </p>
          <div className="flex flex-col items-end">
            <span className="font-ui text-[14px] text-white md:text-[16.3px]">
              loos up to
            </span>
            <span className="font-display text-[24px] font-medium text-white tabular-nums md:text-[32px]">
              {Math.round(WEIGHT_START_KG - WEIGHT_END_KG)}kg
            </span>
          </div>
        </div>

        {/* Progress track */}
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-[#faf8ed]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#87af73]"
            style={{
              width: `${progress * 100}%`,
              transition: "width 80ms linear",
            }}
          />
          {/* Marker dot follows the leading edge */}
          <span
            className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#b6a08c] shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
            style={{
              left: `calc(${progress * 100}% - 12px)`,
              transition: "left 80ms linear",
              opacity: progress > 0 ? 1 : 0,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between">
          {["140kg", "130kg", "120kg", "110kg", "100kg"].map((w) => (
            <span
              key={w}
              className="font-ui text-[12px] text-white md:text-[16.3px]"
            >
              {w}
            </span>
          ))}
        </div>

        {/* Hidden value used by the animation but kept around for SR users */}
        <span className="sr-only" aria-live="polite">
          Current weight target {currentWeight.toFixed(0)} kilograms
        </span>
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
      className="w-full bg-white py-16 md:py-[100px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-20">
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 pb-10 text-center"
        >
          <h2 className="font-display text-[32px] leading-[40px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Let&rsquo;s get to{" "}
            <em className="font-serif italic font-normal">know</em> you
          </h2>
          <p className="max-w-[546px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Answer a few simple questions so we can match you with the right
            treatment and support for lasting results.
          </p>
        </Reveal>

        <Reveal delay={120} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Left card */}
          <div className="flex flex-col items-center gap-8 rounded-[20px] bg-[#142e2a] px-10 py-12 text-center">
            <div className="relative h-[234px] w-[234px]">
              <div className="absolute left-0 top-0 flex h-[194px] w-[160px] flex-col items-center gap-2 rounded-[17px] bg-[#d3dabe] px-5 py-2">
                <span className="font-ui text-[12px] text-[#142e2a]">
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
              <div className="absolute right-0 bottom-0 flex h-[192px] w-[159px] flex-col items-center justify-between rounded-[17px] bg-white px-2 py-3">
                <p className="font-ui text-[16px] leading-[20px] text-[#142e2a]">
                  What is your desired weight?
                </p>
                <div className="flex w-full items-center gap-2">
                  <div className="h-[33px] flex-1 rounded-md bg-[#f4f5ef]" />
                  <div className="grid h-[28px] w-[28px] place-items-center rounded-full bg-[#142e2a]">
                    <span className="font-ui text-[12px] text-white">→</span>
                  </div>
                  <span className="font-outfit text-[14px] text-[#142e2a]">
                    lbs
                  </span>
                </div>
              </div>
            </div>

            <p className="font-ui text-[15px] leading-[22px] text-white md:text-[16.3px] md:leading-[20px]">
              Answer a few simple questions so we can match you with the right
              treatment and support for lasting results.
            </p>
            <a
              href="#quiz"
              className="inline-flex h-[50px] items-center justify-center rounded-lg bg-white px-12 font-ui text-[13px] font-semibold uppercase tracking-[-0.01em] text-[#142f2b] transition-colors duration-200 hover:bg-[#d3dabe]"
            >
              Start Quiz
            </a>
          </div>

          {/* Right: image with progress overlay */}
          <div
            ref={overlayRef}
            className="relative overflow-hidden rounded-[20px]"
          >
            <Image
              src="/assets/figma/quiz-bg.png"
              alt="Energetic woman"
              width={650}
              height={584}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[#142e2a]/20" />
            <FeelEnergeticOverlay active={overlayActive} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
