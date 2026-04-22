"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

const FLOATING_BADGES = [
  { icon: "/assets/images/icon-affordable.png", label: "Affordable pricing" },
  { icon: "/assets/images/icon-personalized.png", label: "Personalized support" },
  { icon: "/assets/images/icon-support.png", label: "24/7 live support" },
];

type BmiStatus = {
  label: string;
  color: string;
  bg: string;
};

function getBmiStatus(bmi: number): BmiStatus {
  if (bmi <= 0) return { label: "—", color: "#6b7280", bg: "#e5e7eb" };
  if (bmi < 18.5) return { label: "Underweight", color: "#2563eb", bg: "#dbeafe" };
  if (bmi < 25) return { label: "Normal", color: "#00b67a", bg: "#d1fadf" };
  if (bmi < 30) return { label: "Overweight", color: "#d97706", bg: "#fef3c7" };
  return { label: "Obese", color: "#dc2626", bg: "#fee2e2" };
}

function calculateBmi(ft: number, inches: number, lbs: number): number {
  const totalInches = ft * 12 + inches;
  const meters = totalInches * 0.0254;
  const kg = lbs * 0.453592;
  if (!meters || !kg) return 0;
  return Math.round((kg / (meters * meters)) * 10) / 10;
}

function useInView<T extends HTMLElement>(
  ref: RefObject<T | null>,
  threshold = 0.25
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
        else if (!entry.isIntersecting && entry.intersectionRatio === 0) {
          setInView(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}

function useAnimatedNumber(target: number, isActive: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const currentRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      currentRef.current = 0;
      setValue(0);
      return;
    }

    const startValue = currentRef.current;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;
      currentRef.current = current;
      setValue(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, isActive, duration]);

  return value;
}

const WEIGHT_MIN = 50;
const WEIGHT_MAX = 400;
const DEFAULT_WEIGHT = 98;

export default function BmiCalculator() {
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("8");
  const [lbs, setLbs] = useState("98");

  const [sliderWeight, setSliderWeight] = useState(DEFAULT_WEIGHT);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(sectionRef, 0.2);

  const ftNum = Math.max(0, Number(ft) || 0);
  const inchNum = Math.max(0, Math.min(11, Number(inch) || 0));
  const lbsNum = Math.max(0, Number(lbs) || 0);

  const bmi = useMemo(
    () => calculateBmi(ftNum, inchNum, lbsNum),
    [ftNum, inchNum, lbsNum]
  );

  const animatedBmi = useAnimatedNumber(bmi, inView, 1400);
  const couldLoseTarget = Math.max(0, Math.round(sliderWeight * 0.27));
  const animatedCouldLose = useAnimatedNumber(couldLoseTarget, inView, 1600);
  const animatedStartingWeight = useAnimatedNumber(sliderWeight, inView, 1800);

  const status = getBmiStatus(animatedBmi);

  const handleInputChange = useCallback(
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "" || /^\d+$/.test(raw)) setter(raw);
    },
    []
  );

  const sliderPct = Math.max(
    0,
    Math.min(
      100,
      ((sliderWeight - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * 100
    )
  );

  const bmiDisplay = animatedBmi > 0 ? animatedBmi.toFixed(1) : "0.0";

  return (
    <section
      aria-label="BMI Calculator — Jood Life"
      className="w-full bg-white"
      ref={sectionRef}
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px] py-14 md:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8 pb-10">
          <h2 className="max-w-[680px] font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Everyone&rsquo;s talking about{" "}
            <em className="font-serif italic font-normal">jood life</em> because
            it works.
          </h2>
          <p className="max-w-[530px] font-ui text-[15px] leading-[22px] tracking-[-0.005em] text-[#142e2a]/80 md:text-[16px] md:leading-[24px]">
            Clinically proven treatments, medically supervised guidance, and
            thousand of real transformation all one powerful program.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
          <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-[#e7ecd7] p-8 md:min-h-[580px]">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em] text-[#142e2a] md:text-[26px] md:leading-[32px]">
                Check your
              </p>
              <p className="font-ui text-[14px] leading-[20px] tracking-[-0.005em] text-[#142e2a]/75 md:text-[15px] md:leading-[22px]">
                Enter your height and weight below
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-2"
              aria-live="polite"
            >
              <span className="inline-flex items-baseline gap-2">
                <span className="font-display text-[48px] leading-none font-semibold tracking-[-0.02em] tabular-nums text-[#142e2a] md:text-[56px]">
                  {bmiDisplay}
                </span>
                <span className="font-ui text-[16px] font-bold uppercase tracking-[0.04em] text-[#142e2a]/65 md:text-[18px]">
                  BMI
                </span>
              </span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors duration-300 md:text-[12px]"
                style={{ color: status.color, backgroundColor: status.bg }}
              >
                {status.label}
              </span>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="flex flex-col gap-2">
                <span className="font-ui text-[13px] font-semibold tracking-[-0.005em] text-[#142e2a] md:text-[14px]">
                  Height
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Height in feet"
                      value={ft}
                      onChange={handleInputChange(setFt)}
                      className="h-11 w-full rounded-lg bg-white px-3 pr-9 font-ui text-[14px] tracking-[-0.005em] text-[#142e2a] outline-none focus:ring-2 focus:ring-[#142e2a]/30"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-ui text-[13px] font-semibold text-[#142e2a]/55">
                      ft
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Height in inches"
                      value={inch}
                      onChange={handleInputChange(setInch)}
                      className="h-11 w-full rounded-lg bg-white px-3 pr-9 font-ui text-[14px] tracking-[-0.005em] text-[#142e2a] outline-none focus:ring-2 focus:ring-[#142e2a]/30"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-ui text-[13px] font-semibold text-[#142e2a]/55">
                      in
                    </span>
                  </div>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-ui text-[13px] font-semibold tracking-[-0.005em] text-[#142e2a] md:text-[14px]">
                  Weight
                </span>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Weight in pounds"
                    value={lbs}
                    onChange={handleInputChange(setLbs)}
                    className="h-11 w-full rounded-lg bg-white px-3 pr-10 font-ui text-[14px] tracking-[-0.005em] text-[#142e2a] outline-none focus:ring-2 focus:ring-[#142e2a]/30"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-ui text-[13px] font-semibold text-[#142e2a]/55">
                    lbs
                  </span>
                </div>
              </label>

              <button
                type="button"
                className="mt-auto h-[50px] rounded-lg bg-[#142e2a] font-ui text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#0c2421]"
              >
                Calculate BMI
              </button>
            </form>
          </div>

          <div className="relative h-full overflow-hidden rounded-3xl bg-[#e7ecd7] md:min-h-[580px]">
            <Image
              src="/assets/figma/happy-woman-2.png"
              alt="Happy customer showing results"
              fill
              sizes="(max-width: 768px) 100vw, 440px"
              className="object-cover object-[center_30%]"
              priority
            />
            <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-3 md:left-5">
              {FLOATING_BADGES.map((b, i) => (
                <div
                  key={b.label}
                  className="flex items-center gap-3 rounded-full pl-4 pr-5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm"
                  style={{
                    marginLeft: `${i * 18}px`,
                    backgroundColor:
                      i === 0
                        ? "rgba(255,255,255,0.95)"
                        : i === 1
                          ? "rgba(255,255,255,0.78)"
                          : "rgba(255,255,255,0.62)",
                  }}
                >
                  <Image
                    src={b.icon}
                    alt=""
                    width={22}
                    height={22}
                    className="h-[22px] w-[22px]"
                    aria-hidden
                  />
                  <span className="font-ui text-[13px] font-medium leading-[18px] tracking-[-0.005em] text-[#171717] md:text-[14.5px] md:leading-[20px]">
                    {b.label}
                  </span>
                  <span className="ml-auto grid h-[18px] w-[18px] place-items-center rounded-full bg-[#ff7300] text-[10px] font-bold text-white">
                    ✓
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex h-full flex-col justify-between gap-6 rounded-3xl bg-[#f7f9f2] p-8 md:min-h-[580px]">
            <div className="flex flex-col items-center gap-1.5">
              <p className="font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em] text-[#142e2a] md:text-[26px] md:leading-[32px]">
                You could lose:
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[48px] leading-none font-semibold tracking-[-0.02em] tabular-nums text-[#142e2a] md:text-[56px]">
                  {Math.round(animatedCouldLose)}
                </span>
                <span className="font-ui text-[16px] font-bold uppercase tracking-[0.04em] text-[#142e2a]/65 md:text-[18px]">
                  lbs
                </span>
              </div>
            </div>

            <div className="flex h-[114px] items-end justify-center gap-[3px]">
              {Array.from({ length: 24 }).map((_, i) => {
                const isTall = i % 3 === 2;
                const threshold = (i / 24) * 100;
                const isActive = threshold <= sliderPct;
                return (
                  <span
                    key={i}
                    className={[
                      "w-[6.5px] rounded-full transition-colors duration-300",
                      isTall ? "h-[114px]" : "h-[85px]",
                      isActive
                        ? isTall
                          ? "bg-[#142e2a]"
                          : "bg-[#87af73]"
                        : "bg-[#d5dcc3]",
                    ].join(" ")}
                  />
                );
              })}
            </div>

            <div className="mt-auto flex flex-col items-center gap-3">
              <p className="font-display text-[20px] leading-[26px] font-bold tracking-[-0.01em] text-[#142e2a] md:text-[24px] md:leading-[30px]">
                Starting weight:
              </p>
              <div className="rounded-md bg-white px-4 py-2 shadow-sm">
                <p className="font-display text-[22px] leading-[28px] font-bold tracking-[-0.01em] tabular-nums text-[#142e2a] md:text-[26px] md:leading-[32px]">
                  {Math.round(animatedStartingWeight)} lbs
                </p>
              </div>

              <div className="relative mt-3 w-full px-1">
                <div className="relative h-2 w-full rounded-full bg-[#142e2a]/15">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#142e2a] transition-[width] duration-150 ease-out"
                    style={{ width: `${sliderPct}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={WEIGHT_MIN}
                  max={WEIGHT_MAX}
                  step={1}
                  value={sliderWeight}
                  onChange={(e) => setSliderWeight(Number(e.target.value))}
                  aria-label="Adjust starting weight"
                  className="bmi-slider absolute inset-0 w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing"
                />
                <div className="mt-2 flex justify-between font-ui text-[11px] font-semibold tracking-[0.02em] text-[#142e2a]/55">
                  <span>{WEIGHT_MIN}</span>
                  <span>{WEIGHT_MAX}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bmi-slider {
          height: 2rem;
          margin: -0.75rem 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .bmi-slider::-webkit-slider-runnable-track {
          height: 0.5rem;
          background: transparent;
        }
        .bmi-slider::-moz-range-track {
          height: 0.5rem;
          background: transparent;
        }
        .bmi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #142e2a;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          cursor: grab;
          margin-top: -7px;
          transition: transform 0.15s ease;
        }
        .bmi-slider:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .bmi-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #142e2a;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          cursor: grab;
          transition: transform 0.15s ease;
        }
        .bmi-slider:active::-moz-range-thumb {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .bmi-slider:focus-visible::-webkit-slider-thumb {
          outline: 2px solid #142e2a;
          outline-offset: 2px;
        }
        .bmi-slider:focus-visible::-moz-range-thumb {
          outline: 2px solid #142e2a;
          outline-offset: 2px;
        }
        @media (max-width: 640px) {
          .bmi-slider::-webkit-slider-thumb {
            width: 28px;
            height: 28px;
            margin-top: -10px;
          }
          .bmi-slider::-moz-range-thumb {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </section>
  );
}
