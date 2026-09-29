"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import "swiper/css";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { FOUNDAYO, type FoundayoCard } from "@/lib/foundayoContent";

/**
 * "What is foundayo pill?" — heading + CTA on one row, then four explainer
 * cards on a light-pink ground that peek off the right edge (manual swipe).
 * Mobile shows the CTA full-width under the cards.
 */
function Card({ c }: { c: FoundayoCard }) {
  return (
    <article className="fnd-lift flex h-full flex-col overflow-hidden rounded-2xl bg-[#fbf3ef]">
      <div className="group relative h-[300px] w-full overflow-hidden">
        <Image src={c.image} alt={c.alt} fill sizes="(max-width:1024px) 60vw, 25vw" className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105" />
        {c.badge ? (
          <div className="absolute right-6 top-[38%] rounded-xl bg-[#f6d9cf]/90 px-4 py-3 text-[#142e2a] shadow-[0_8px_24px_-12px_rgba(20,46,42,0.4)] backdrop-blur-sm">
            <p className="font-ui text-[11px] font-medium opacity-70">{c.badge.top}</p>
            <p className="mt-1 font-display text-[18px] font-semibold leading-none">{c.badge.value}</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <h3 className="font-ui text-[18px] font-semibold leading-[24px] tracking-[-0.02em] text-[#142e2a] md:text-[20px]">{c.title}</h3>
        <p className="font-ui text-[13.5px] leading-[19px] text-[#142e2a]/70 md:text-[14px]">{c.body}</p>
      </div>
    </article>
  );
}

export default function WhatIs() {
  const c = FOUNDAYO.whatIs;
  return (
    <section aria-label="What is the Foundayo pill" className="w-full bg-white py-[30px] md:py-10">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div" className="mb-7 flex flex-col items-start justify-between gap-5 md:mb-9 md:flex-row md:items-end">
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] sm:text-[36px] md:text-[48px] md:leading-[52px]">
            {c.heading} <span className="font-serif font-normal italic">{c.headingAccent}</span>
          </h2>
          <EligibilityCta
            product="weight-loss"
            href={c.ctaHref}
            label={c.ctaLabel}
            className="hidden h-[50px] shrink-0 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421] md:inline-flex"
          />
        </Reveal>
      </div>

      <Reveal as="div" delay={120}>
        <Swiper
          modules={[A11y]}
          speed={500}
          spaceBetween={20}
          slidesPerView={1.15}
          slidesOffsetAfter={0}
          breakpoints={{ 640: { slidesPerView: 2.1 }, 1024: { slidesPerView: 3.35 }, 1280: { slidesPerView: 4.2 } }}
          a11y={{ enabled: true }}
          className="!py-2 !pl-6 !pr-0 md:!pl-10 lg:!pl-[60px]"
        >
          {c.cards.map((card, i) => (
            <SwiperSlide key={card.title} className="!h-auto">
              <Reveal delay={i * 110} className="h-full">
                <Card c={card} />
              </Reveal>
            </SwiperSlide>
          ))}
        </Swiper>
      </Reveal>

      <div className="mx-auto w-full max-w-[1440px] px-6 md:hidden">
        <EligibilityCta
          product="weight-loss"
          href={c.ctaHref}
          label={c.ctaLabel}
          className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[15px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
        />
      </div>
    </section>
  );
}
