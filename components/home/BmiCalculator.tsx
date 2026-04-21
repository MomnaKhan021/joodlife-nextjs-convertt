"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const FLOATING_BADGES = [
  {
    icon: "/assets/images/icon-affordable.png",
    label: "Affordable pricing",
    opacity: 1,
  },
  {
    icon: "/assets/images/icon-personalized.png",
    label: "Personalized support",
    opacity: 0.7,
  },
  {
    icon: "/assets/images/icon-support.png",
    label: "24/7 live support",
    opacity: 0.4,
  },
];

export default function BmiCalculator() {
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("4");
  const [lbs, setLbs] = useState("98");

  const bmi = useMemo(() => {
    const totalInches = (Number(ft) || 0) * 12 + (Number(inch) || 0);
    const meters = totalInches * 0.0254;
    const kg = (Number(lbs) || 0) * 0.453592;
    if (!meters || !kg) return 0;
    return kg / (meters * meters);
  }, [ft, inch, lbs]);

  const couldLose = Math.max(0, Math.round((Number(lbs) || 0) * 0.27));

  return (
    <section
      aria-label="BMI Calculator — Jood Life"
      className="w-full bg-white"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px] py-14 md:py-20">
        {/* Heading */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8 pb-10">
          <h2 className="max-w-[680px] font-display text-[32px] leading-[40px] font-bold text-[#0b3b3c] md:text-[48px] md:leading-[52px]">
            Everyone&rsquo;s talking about&nbsp;jood life because it works.
          </h2>
          <p className="max-w-[530px] font-ui text-[15px] leading-[22px] text-[#0c2421] md:text-[16.3px] md:leading-[20px]">
            Clinically proven treatments, medically supervised guidance, and
            thousand of real transformation all one powerful program.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1: Calculator Form */}
          <div className="flex flex-col gap-8 rounded-3xl bg-[#e7ecd7] p-6 md:px-6 md:py-10">
            <p className="text-center font-outfit text-[20px] leading-[28px] font-medium text-[#142e2a] md:text-[24px]">
              See how much weight you could lose
            </p>
            <div className="flex flex-col items-center gap-5">
              <h3 className="text-center font-display text-[32px] leading-[40px] font-medium text-[#006247] md:text-[42px] md:leading-[50px]">
                Anna 29 years<br />32 lb in 4 months
              </h3>
              <p className="text-center font-ui text-[14px] italic leading-[19px] text-[#006247]">
                &ldquo; I tried countless diets and exercise before Pharmazon. With
                their weekly injections and expert guidance, I finally saw real
                progress &rdquo;
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <p className="font-ui text-[22px] leading-[26px] font-extrabold text-[#142e2a] md:text-[25px]">
                Check your
              </p>
              <p className="font-ui text-[16.3px] leading-[20px] text-[#142e2a]">
                Enter your height and weight below
              </p>
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="flex flex-col gap-2">
                <span className="font-ui text-[16.3px] font-semibold text-[#142e2a]">
                  Height
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={ft}
                      onChange={(e) => setFt(e.target.value)}
                      className="h-11 w-full rounded-lg bg-white px-3 pr-9 font-ui text-[14px] text-[#142e2a] outline-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-ui text-[16.3px] font-semibold text-[#142e2a]">
                      ft
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={inch}
                      onChange={(e) => setInch(e.target.value)}
                      className="h-11 w-full rounded-lg bg-white px-3 pr-9 font-ui text-[14px] text-[#142e2a] outline-none"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-ui text-[16.3px] font-semibold text-[#142e2a]">
                      in
                    </span>
                  </div>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-ui text-[16.3px] font-semibold text-[#142e2a]">
                  Weight
                </span>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={lbs}
                    onChange={(e) => setLbs(e.target.value)}
                    className="h-11 w-full rounded-lg bg-white px-3 pr-10 font-ui text-[14px] text-[#142e2a] outline-none"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-ui text-[16.3px] font-semibold text-[#142e2a]">
                    lbs
                  </span>
                </div>
              </label>
              <button
                type="submit"
                className="h-[50px] rounded-lg bg-[#142e2a] font-ui text-[16.3px] font-semibold text-white transition hover:bg-[#0c2421]"
              >
                Calculate BMI
              </button>
            </form>
          </div>

          {/* Card 2: Image with floating badges */}
          <div className="relative h-[420px] overflow-hidden rounded-3xl md:h-auto">
            <Image
              src="/assets/images/happy-woman-1.png"
              alt="Happy customer showing results"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority
            />
            <div className="absolute left-6 top-6 flex flex-col gap-3">
              {FLOATING_BADGES.map((b, i) => (
                <div
                  key={b.label}
                  className={classNames(
                    "flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm",
                    i === 1 && "ml-4",
                    i === 2 && "ml-8"
                  )}
                  style={{ backgroundColor: `rgba(255,255,255,${b.opacity})` }}
                >
                  <Image
                    src={b.icon}
                    alt=""
                    width={23}
                    height={23}
                    className="h-[23px] w-[23px]"
                    aria-hidden
                  />
                  <span className="font-ui text-[16.3px] leading-[20px] text-[#171717]">
                    {b.label}
                  </span>
                  <span className="ml-auto grid h-[19px] w-[19px] place-items-center rounded-full bg-[#ff7300] text-[10px] font-bold text-white">
                    ✓
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: BMI Result */}
          <div className="flex flex-col gap-8 rounded-3xl bg-[#f7f9f2] py-10 px-8">
            <div className="flex flex-col items-center gap-6">
              <p className="text-center font-ui text-[22px] leading-[26px] font-extrabold text-[#142e2a] md:text-[24.4px]">
                You could lose:
              </p>
              <div className="flex items-end gap-3">
                <span className="font-display text-[48px] leading-[56px] font-semibold text-[#0c2421] md:text-[56px]">
                  {couldLose}
                </span>
                <span className="pb-2 font-ui text-[20px] leading-[24px] font-semibold text-[#171717] md:text-[23px]">
                  lbs
                </span>
              </div>
            </div>

            {/* Progress-Bars visualization */}
            <div className="flex h-[114px] items-end justify-between gap-0 md:gap-[2px]">
              {Array.from({ length: 15 }).map((_, i) => {
                const isTall = i % 3 === 2;
                return (
                  <span
                    key={i}
                    className={classNames(
                      "w-[7.6px] rounded-full",
                      isTall ? "h-[114px] bg-[#142e2a]" : "h-[85px] bg-[#87af73]"
                    )}
                  />
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="font-ui text-[22px] leading-[26px] font-extrabold text-[#142e2a] md:text-[25px]">
                Starting weight:
              </p>
              <div className="rounded-md bg-white px-3 py-2">
                <p className="font-ui text-[22px] leading-[26px] font-extrabold text-[#142e2a] md:text-[25px]">
                  {lbs} lbs
                </p>
              </div>
              <div className="relative mt-2 w-full">
                <span className="block h-2 w-full rounded-full bg-[#142e2a]" />
                <span
                  className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white ring-2 ring-[#142e2a]"
                  style={{ left: `${Math.min(80, (bmi / 40) * 100)}%` }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
