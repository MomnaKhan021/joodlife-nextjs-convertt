"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import "swiper/css";
import Reveal from "@/components/ui/Reveal";
import EligibilityCta from "@/components/ui/EligibilityCta";
import { WLT, type WltCard } from "@/lib/weightLossTabletContent";
import { ACCENT, BTN_DARK, H2, WRAP } from "./type";

/**
 * "What is the daily weight loss tablet?" — Figma 2003:1332 / 2003:665.
 * Heading + 192px CTA on one row (CTA moves under the cards on mobile), then
 * four #fff8f6 cards — 426×524 desktop, 334 wide mobile — that peek off the
 * right edge. Title 25/25.6 (20/20.1 mobile), body 16.3/19.5 (16/19.2).
 */
function Card({ c }: { c: WltCard }) {
  return (
    <article className="fnd-lift flex h-full flex-col overflow-hidden rounded-xl bg-[#fff8f6]">
      {/* The art is the Figma card's top 426×416, rendered at 2x. */}
      <div className="group relative aspect-[852/832] w-full overflow-hidden">
        <Image
          src={c.image}
          alt={c.alt}
          fill
          sizes="(max-width:768px) 334px, 426px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {c.badge ? (
          // Sits exactly over the badge baked into the art (x 264, y 110 of
          // 426×416) and is wider, so "↓ Supported" reads in full — the
          // Figma frame clips it to "Supportec".
          <div
            className="absolute left-[62%] top-[26.4%] flex min-h-[22.4%] min-w-[31%] flex-col justify-between rounded-xl px-2 py-2 text-white shadow-[0_8px_24px_-12px_rgba(20,46,42,0.35)]"
            style={{ background: "linear-gradient(180deg, #eebcae 0%, #e7a998 100%)" }}
          >
            <p className="font-ui text-[11px] font-medium leading-[13.1px] tracking-[-0.2px] md:text-[14px] md:leading-[16.8px] md:tracking-[-0.3px]">{c.badge.top}</p>
            <p className="whitespace-nowrap font-ui text-[14.9px] font-medium leading-[17.8px] md:text-[19px] md:leading-[22.8px]">{c.badge.value}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-[10px] px-4 pb-6 pt-[10px]">
        <h3 className="font-ui text-[20px] !font-medium leading-[20.1px] tracking-[-0.4px] text-[#142e2a] md:text-[25px] md:leading-[25.6px] md:tracking-[-0.5px]">
          {c.title}
        </h3>
        <p className="font-ui text-[16px] leading-[19.2px] tracking-[-0.3px] text-[#142e2a] md:text-[16.3px] md:leading-[19.5px]">{c.body}</p>
      </div>
    </article>
  );
}

export default function WhatIs() {
  const c = WLT.whatIs;
  return (
    <section aria-label="What is the daily weight loss tablet" className="w-full bg-white pb-[60px] pt-[70px] md:pb-20 md:pt-20">
      <div className={WRAP}>
        <Reveal as="div" className="mb-[30px] flex flex-col items-start justify-between gap-5 md:mb-[41px] md:flex-row md:items-center">
          <h2 className={`${H2} text-[#142e2a]`}>
            {c.heading} <span className={ACCENT}>{c.headingAccent}</span>
          </h2>
          {/* Desktop only (mobile shows it under the cards). Wrapped so the
              button's own inline-flex can't override the hiding. */}
          <div className="hidden shrink-0 md:block">
            <EligibilityCta
              product="weight-loss"
              href={c.ctaHref}
              label={c.ctaLabel}
              className={`!px-[18px] md:w-[192px] ${BTN_DARK}`}
            />
          </div>
        </Reveal>
      </div>

      <Reveal as="div" delay={120}>
        <Swiper
          modules={[A11y]}
          speed={500}
          slidesPerView="auto"
          spaceBetween={12}
          breakpoints={{ 768: { spaceBetween: 20 } }}
          a11y={{ enabled: true }}
          className="!py-1 !pl-4 !pr-0 md:!pl-10 lg:!pl-[60px]"
        >
          {/* No per-card reveal: the next card only peeks in (a sliver on
              screen), too little to trigger one, so it stayed invisible —
              the carousel as a whole already fades in above. */}
          {c.cards.map((card) => (
            <SwiperSlide key={card.title} className="!h-auto !w-[334px] md:!w-[426px]">
              <Card c={card} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Reveal>

      <div className={`${WRAP} md:hidden`}>
        <EligibilityCta
          product="weight-loss"
          href={c.ctaHref}
          label={c.ctaLabel}
          className={`mt-[25px] w-full ${BTN_DARK}`}
        />
      </div>
    </section>
  );
}
