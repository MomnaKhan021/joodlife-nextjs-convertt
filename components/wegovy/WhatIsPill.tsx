"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import "swiper/css";
import Reveal from "@/components/ui/Reveal";

/**
 * "What is the Wegovy pill?" — Figma node 1:1610.
 * Heading row with a CTA, then a manually swipeable explainer carousel: cards
 * peek off the right edge (zero right gutter). Mobile shows the CTA full-width
 * below the cards.
 */

type Card = {
  title: string;
  body: string;
  image?: string;
  tag?: string;
  badge?: { label: string; value: string };
  line?: boolean;
};

const CARDS: Card[] = [
  {
    title: "Daily Treatment",
    body: "A convenient once-daily tablet for people looking to lose weight without weekly injections.",
    image: "/assets/wegovy/what-pills.png",
  },
  {
    title: "Advanced Tablet Technology",
    body: "Special absorption technology allows semaglutide to be absorbed effectively as a tablet.",
    image: "/assets/wegovy/what-snac.png",
  },
  {
    title: "Clinically Studied",
    body: "Clinical trials have shown meaningful weight loss when combined with diet and physical activity.*",
    image: "/assets/wegovy/what-man.png",
  },
];

function CardView({ c }: { c: Card }) {
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

        {/* Diagonal progress line behind the Real-results badge */}
        {c.line ? (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="6"
              y1="32"
              x2="96"
              y2="70"
              stroke="#142e2a"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="6" cy="32" r="1.1" fill="#142e2a" />
            <circle cx="96" cy="70" r="1.1" fill="#142e2a" />
          </svg>
        ) : null}

        {c.tag ? (
          <span className="absolute bottom-3 right-3 max-w-[170px] rounded-xl border border-white/70 bg-white/55 px-3.5 py-2.5 font-ui text-[12px] font-medium leading-tight text-[#142e2a] shadow-sm backdrop-blur-md">
            {c.tag}
          </span>
        ) : null}

        {c.badge ? (
          <span className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-md">
            <span className="flex items-center gap-2">
              <span className="font-ui text-[12px] font-medium text-[#142e2a]/70">
                {c.badge.label}
              </span>
              <span className="h-4 w-4 rounded-full bg-[#142e2a]/15" aria-hidden />
            </span>
            <span className="font-display text-[22px] font-semibold leading-none text-[#142e2a]">
              {c.badge.value}
            </span>
          </span>
        ) : null}
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

export default function WhatIsPill() {
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
              What is the{" "}
              <span className="font-serif italic font-normal">
                Wegovy® Tablet?
              </span>
            </h2>
            <p className="mt-4 font-ui text-[18px] font-semibold leading-[24px] tracking-[-0.02em] text-[#142e2a] md:text-[20px]">
              Daily oral weight-loss treatment.
            </p>
            <p className="mt-3 font-ui text-[15px] leading-[22px] text-[#142e2a]/70 md:text-[16.3px] md:leading-[24px]">
              The Wegovy® tablet contains semaglutide, a GLP-1 receptor agonist
              that works with your body&apos;s natural appetite signals to help
              reduce hunger, increase fullness and support sustainable weight
              loss alongside healthy lifestyle changes.
            </p>
          </div>
          <a
            href="/consultation?product=weight-loss"
            className="hidden h-[50px] shrink-0 items-center justify-center rounded-lg bg-[#142e2a] px-[50px] font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421] md:inline-flex"
          >
            Start Your Assessment
          </a>
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
          {CARDS.map((c) => (
            <SwiperSlide key={c.title} className="!h-auto">
              <CardView c={c} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Reveal>

      {/* Mobile CTA — full-width below the cards, per Figma */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:hidden">
        <a
          href="/consultation?product=weight-loss"
          className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-lg bg-[#142e2a] px-[50px] font-ui text-[16.3px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
        >
          Start Your Assessment
        </a>
      </div>
    </section>
  );
}
