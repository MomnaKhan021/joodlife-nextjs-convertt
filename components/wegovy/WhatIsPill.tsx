"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import "swiper/css";
import Reveal from "@/components/ui/Reveal";
import {
  WEGOVY_DEFAULT,
  type ExplainerCard,
  type WegovyWhatIsPill,
} from "@/lib/wegovyContentTypes";

/**
 * "What is the Wegovy pill?" — Figma node 1:1610.
 * Heading row with a CTA, then a manually swipeable explainer carousel: cards
 * peek off the right edge (zero right gutter). Mobile shows the CTA full-width
 * below the cards.
 */

function CardView({ c }: { c: ExplainerCard }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#f7f9f2]">
      <div className="relative h-[300px] w-full overflow-hidden bg-[#eef2e6]">
        {c.image ? (
          <Image
            src={c.image}
            alt={c.title}
            fill
            sizes="(max-width:1024px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(135deg, #daffe0 0%, #b4ff9f 55%, #87af73 100%)",
            }}
          />
        )}

      </div>

      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <h3 className="font-ui text-[18px] font-semibold leading-[26px] tracking-[-0.02em] text-[#142e2a] md:text-[25px] md:leading-[25.6px]">
          {c.title}
        </h3>
        <p className="font-ui text-[14px] leading-[20px] text-[#142e2a]/70 md:text-[16.3px] md:leading-[19.5px]">
          {c.body}
        </p>
      </div>
    </article>
  );
}

export default function WhatIsPill({
  content = WEGOVY_DEFAULT.whatIsPill,
}: {
  content?: WegovyWhatIsPill;
}) {
  return (
    <section
      aria-label="What is the Wegovy pill"
      className="w-full bg-white py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="mb-9 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end"
        >
          <div className="max-w-[720px]">
            <h2 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#142e2a] sm:text-[34px] md:text-[48px] md:leading-[52px]">
              {content.heading}{" "}
              <span className="font-serif italic font-normal">
                {content.headingAccent}
              </span>
            </h2>
            <p className="mt-4 font-ui text-[18px] font-semibold leading-[24px] tracking-[-0.02em] text-[#142e2a] md:text-[20px]">
              {content.kicker}
            </p>
            <p className="mt-3 font-ui text-[15px] leading-[22px] text-[#142e2a]/70 md:text-[16.3px] md:leading-[24px]">
              {content.body}
            </p>
          </div>
          {content.ctaLabel ? (
            <a
              href={content.ctaHref}
              className="hidden h-[50px] shrink-0 items-center justify-center rounded-lg bg-[#142e2a] px-[50px] font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421] md:inline-flex"
            >
              {content.ctaLabel}
            </a>
          ) : null}
        </Reveal>
      </div>

      {/* Carousel: manual swipe, cards peek off the right edge with no gutter */}
      <Reveal as="div" delay={120}>
        <Swiper
          modules={[A11y]}
          speed={500}
          spaceBetween={20}
          slidesPerView={1.15}
          slidesOffsetAfter={0}
          breakpoints={{
            640: { slidesPerView: 2.1 },
            1024: { slidesPerView: 3.3 },
          }}
          a11y={{ enabled: true }}
          className="!py-2 !pl-6 !pr-0 md:!pl-10 lg:!pl-[60px]"
        >
          {content.cards.map((c) => (
            <SwiperSlide key={c.title} className="!h-auto">
              <CardView c={c} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Reveal>

      {/* Mobile CTA — full-width below the cards, per Figma */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:hidden">
        {content.ctaLabel ? (
          <a
            href={content.ctaHref}
            className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-[50px] font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
          >
            {content.ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}
