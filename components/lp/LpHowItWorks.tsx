"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import type { LanderSteps } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import { LP_ASSETS, LP_GUTTER, LpCta, LpHeading, LpStepLabel, rawImage } from "./shared";

/**
 * "How The Programme Works" — step accordion with a progress rail
 * (Figma 20:475; mobile 20:1004). Opening a step fills the rail down to it.
 * Each step's image is optional: a step without one opens to its text only.
 */
export default function LpHowItWorks({ content: c, style }: { content: LanderSteps; style?: SectionStyle }) {
  const [open, setOpen] = useState(0);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const list = useRef<HTMLDivElement>(null);
  const [rail, setRail] = useState({ dots: [] as number[], fill: 0, end: 0 });
  const count = c.items.length;

  // Dots sit at each card's top edge; the fill runs to the card after the
  // open one (or the end of the last card).
  useLayoutEffect(() => {
    const measure = () => {
      const els = items.current.slice(0, count);
      const tops = els.map((el) => el?.offsetTop ?? 0);
      const last = els[els.length - 1];
      const end = last ? last.offsetTop + Math.min(last.offsetHeight, 52) : 0;
      const next = els[open + 1];
      const fill = next ? next.offsetTop - 10 : end;
      setRail({ dots: tops, fill, end });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, [open, count]);

  return (
    <section id="how-it-works" className="overflow-hidden bg-white py-[40px] lg:rounded-t-[40px] lg:py-[80px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col gap-[32px] lg:flex-row lg:items-start lg:gap-[50px] ${LP_GUTTER}`}>
        <div className="flex flex-col items-center gap-[32px] text-center lg:w-[551px] lg:shrink-0 lg:items-start lg:text-left">
          <div className="flex flex-col gap-[12px]">
            <LpHeading lead={c.heading} accent={c.headingAccent} className="lg:w-[396px]" />
            {c.subtitle ? (
              <p className="font-ui text-[14px] leading-[19.5px] tracking-[-0.32px] text-[#142e2a] lg:text-[16.3px]">{c.subtitle}</p>
            ) : null}
          </div>
          <div className="hidden lg:block">
            <LpCta label={c.ctaLabel} href={c.ctaHref} />
          </div>
        </div>

        <div className="flex flex-col gap-[24px] lg:flex-1">
          <div ref={list} className="relative flex flex-col gap-[16px] pl-[32px] lg:pl-[48px]">
            {/* Rail */}
            <div
              aria-hidden
              className="absolute left-[6px] top-[11px] w-[2px] bg-[rgba(20,46,42,0.2)] lg:left-[18px]"
              style={{ height: Math.max(rail.end - 11, 0) }}
            >
              <div className="w-full bg-[#142e2a] transition-[height] duration-300" style={{ height: Math.max(rail.fill - 11, 0) }} />
            </div>
            {rail.dots.map((top, i) => {
              const done = i <= open;
              return (
                <span
                  key={i}
                  aria-hidden
                  className={`absolute left-[0px] flex size-[14px] items-center justify-center rounded-[7px] lg:left-[12px] ${
                    done ? "bg-[rgba(20,46,42,0.4)]" : "border-[0.5px] border-[#bfb9c2] bg-white"
                  }`}
                  style={{ top }}
                >
                  <span className={`size-[10px] rounded-[5px] ${done ? "bg-[#142e2a]" : "bg-[rgba(20,46,42,0.3)]"}`} />
                </span>
              );
            })}

            {c.items.map((s, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={`${s.title}-${i}`}
                  ref={(el) => {
                    items.current[i] = el;
                  }}
                  className="rounded-[20px] bg-[#f7f9f2] p-[12px] lg:p-[20px]"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-expanded={isOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                  >
                    <span className="flex flex-col gap-[4px]">
                      <LpStepLabel>Step {i + 1}</LpStepLabel>
                      <span className="font-ui text-[20px] font-medium leading-[25.6px] tracking-[-0.5px] text-[#142e2a] lg:text-[24px]">
                        {s.title}
                      </span>
                    </span>
                    <Image
                      src={`${LP_ASSETS}/chevron.svg`}
                      alt=""
                      width={22}
                      height={12}
                      unoptimized
                      className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (s.body || s.image) ? (
                    <div className="flex flex-col gap-[24px] pt-[12px]">
                      {s.body ? (
                        <p className="font-ui text-[16px] leading-[20px] tracking-[-0.427px] text-[#142e2a]">{s.body}</p>
                      ) : null}
                      {s.image ? (
                        <div className="relative h-[160px] w-full overflow-hidden rounded-[16px] lg:h-[270px]">
                          <Image
                            src={s.image}
                            alt=""
                            fill
                            unoptimized={rawImage(s.image)}
                            sizes="(max-width: 1024px) 90vw, 620px"
                            className="object-cover object-[50%_8%]"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="lg:hidden">
            <LpCta label={c.ctaLabel} href={c.ctaHref} />
          </div>
        </div>
      </div>
    </section>
  );
}
