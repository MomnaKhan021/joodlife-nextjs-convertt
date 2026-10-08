"use client";

import { useCallback, useRef, useState } from "react";

import Reveal from "@/components/ui/Reveal";
import { parseTime, type LanderJourney } from "@/lib/landerContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

import LpVideo from "./LpVideo";
import { LP_BODY, LP_GUTTER, LpCta, LpHeading, LpStepLabel } from "./shared";

/**
 * "Your Journey" — one video that explains the whole process, beside the
 * steps as a timeline (stacked on phones: video, then steps).
 *
 * A step with a time ("0:45") is a chapter: clicking it jumps the video
 * there and plays, and the step lights up while its part is playing.
 * Steps without times are a plain timeline.
 */
export default function LpJourney({ content: c, style }: { content: LanderJourney; style?: SectionStyle }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [now, setNow] = useState(-1);
  const onTime = useCallback((t: number) => setNow(t), []);

  const starts = c.items.map((s) => parseTime(s.time));
  const chapters = !!c.video && starts.some((t) => t !== null);
  // The step being explained: the last one whose start time has passed.
  const active = chapters && now >= 0 ? starts.reduce<number>((acc, t, i) => (t !== null && now >= t ? i : acc), -1) : -1;

  function jump(i: number) {
    const el = video.current;
    const t = starts[i];
    if (!el || t === null) return;
    el.currentTime = t;
    void el.play().catch(() => {});
  }

  return (
    <section className="bg-[#f6f9f2] py-[60px] lg:py-[96px]" {...styleProps(style)}>
      <div className={`mx-auto flex max-w-[1440px] flex-col items-center ${LP_GUTTER}`}>
        <Reveal className="flex flex-col items-center text-center">
          <LpHeading lead={c.heading} accent={c.headingAccent} weight="medium" />
          {c.subtitle ? <p className={`${LP_BODY} max-w-[340px] pt-[12px] text-[#142e2a] lg:max-w-none`}>{c.subtitle}</p> : null}
        </Reveal>

        {/* Full section width (1280 at desktop, like the other sections): video column, steps column */}
        <div
          className={`grid w-full gap-[24px] py-[24px] lg:items-center lg:justify-center lg:gap-[64px] lg:py-[48px] ${
            c.video || c.image ? "lg:grid-cols-[340px_minmax(0,600px)]" : ""
          }`}
        >
          {/* The one video — shown whole (9:16), never cropped */}
          {c.video || c.image ? (
            <Reveal direction="right" delay={100} className="mx-auto w-full max-w-[250px] rounded-[22px] bg-white p-[10px] md:max-w-[320px] shadow-[0_10px_30px_-12px_rgba(20,46,42,0.25)] lg:max-w-none">
              <LpVideo
                image={c.image}
                video={c.video}
                alt={c.alt}
                sizes="(max-width: 768px) 250px, (max-width: 1024px) 320px, 340px"
                // 9:16 like the clip itself, so nothing is cropped.
                className="aspect-[9/16] w-full rounded-[14px]"
                videoRef={video}
                onTime={onTime}
              />
            </Reveal>
          ) : null}

          {/* The steps — a timeline */}
          {/* Steps centred beside the video on desktop */}
          <ol className="relative flex w-full flex-col gap-[12px] lg:justify-center lg:gap-[16px]">
            <span aria-hidden className="absolute bottom-[28px] left-[15px] top-[28px] w-[2px] bg-[rgba(20,46,42,0.15)]" />
            {c.items.map((s, i) => {
              const isActive = active === i;
              const clickable = chapters && starts[i] !== null;
              const Card = clickable ? "button" : "div";
              return (
                <Reveal as="li" key={`${s.title}-${i}`} delay={150 + i * 120} direction="left" className="relative flex gap-[16px]">
                  {/* Step dot */}
                  <span
                    aria-hidden
                    className={`relative z-10 mt-[22px] flex size-[32px] shrink-0 items-center justify-center rounded-full border-2 font-ui text-[13px] font-medium transition-colors ${
                      isActive ? "border-[#142e2a] bg-[#142e2a] text-white" : "border-[#142e2a]/25 bg-white text-[#142e2a]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Card
                    {...(clickable ? { type: "button" as const, onClick: () => jump(i), "aria-label": `Play from ${s.time}: ${s.title}` } : {})}
                    className={`flex flex-1 flex-col rounded-[18px] p-[16px] text-left transition-colors lg:px-[24px] lg:py-[22px] ${
                      isActive ? "bg-white shadow-[0_6px_20px_-10px_rgba(20,46,42,0.35)] ring-1 ring-[#142e2a]/15" : "bg-white/70"
                    } ${clickable ? "cursor-pointer hover:bg-white" : ""}`}
                  >
                    <span className="flex flex-wrap items-center gap-[10px]">
                      <LpStepLabel>Step {i + 1}</LpStepLabel>
                      {s.badge ? (
                        <span className="rounded-[99px] bg-[#132d2a] px-[10px] py-[2px] font-ui text-[12px] leading-[18px] text-white">
                          {s.badge}
                        </span>
                      ) : null}
                      {clickable ? (
                        <span className="ml-auto flex items-center gap-[6px] font-ui text-[13px] text-[#142e2a]/70">
                          <span className="block h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-current" />
                          {s.time}
                        </span>
                      ) : null}
                    </span>
                    <span className="pt-[6px] font-ui text-[20px] font-medium leading-[25.6px] tracking-[-0.5px] text-[#142e2a] lg:text-[22px]">
                      {s.title}
                    </span>
                    {s.body ? (
                      <span className="pt-[6px] font-ui text-[15px] leading-[20px] tracking-[-0.3px] text-[#142e2a]/85 lg:text-[16px]">{s.body}</span>
                    ) : null}
                  </Card>
                </Reveal>
              );
            })}
          </ol>
        </div>

        <Reveal delay={150}>
          <LpCta label={c.ctaLabel} href={c.ctaHref} />
        </Reveal>
      </div>
    </section>
  );
}
