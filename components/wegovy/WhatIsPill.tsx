"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, A11y } from "swiper/modules";
import "swiper/css";
import Reveal from "@/components/ui/Reveal";

/**
 * "What is the Wegovy pill?" — Figma node 1:1610.
 * Heading row with a CTA, then a swipeable explainer carousel: cards peek off
 * the right edge, auto-scroll, and fade shadows mask both edges.
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
    title: "The first of its kind",
    body: "is an FDA-approved semaglutide in a pill for weight loss.",
    image: "/assets/wegovy/what-pills.png",
    tag: "Powered by SNAC technology",
  },
  {
    title: "Unpacking Snac",
    body: "The SNAC molecule used by Novo Nordisk™ is the key to the GLP-1 pill.",
    image: "/assets/wegovy/what-snac.png",
  },
  {
    title: "Real results",
    body: "Lose up to 20% of your body weight without the shot.",
    image: "/assets/wegovy/what-man.png",
    badge: { label: "Year 1", value: "↓ 32 lbs" },
    line: true,
  },
  {
    title: "Lose weight your way",
    body: "With Wegovy® in a pill or pen and a range of dosages, you’ve got options.",
    image: "/assets/wegovy/what-bottle.png",
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
            className="object-contain p-2"
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
        <h3 className="font-ui text-[18px] font-semibold leading-[24px] text-[#142e2a]">
          {c.title}
        </h3>
        <p className="font-ui text-[14px] leading-[20px] text-[#142e2a]/70">
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
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="mb-9 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"
        >
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            What Is The{" "}
            <span className="font-serif italic font-normal">Wegovy Pill?</span>
          </h2>
          <a
            href="/consultation"
            className="inline-flex h-[58px] shrink-0 items-center justify-center rounded-2xl bg-[#142e2a] px-9 font-ui text-[16px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Get Started Today
          </a>
        </Reveal>
      </div>

      {/* Full-bleed carousel so cards peek off the right edge, with edge fades */}
      <Reveal as="div" delay={120} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent md:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent md:w-16" />

        <Swiper
          modules={[Autoplay, A11y]}
          speed={650}
          spaceBetween={20}
          slidesPerView={1.15}
          loop
          autoplay={{
            delay: 2600,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            640: { slidesPerView: 2.1 },
            1024: { slidesPerView: 3.3 },
          }}
          a11y={{ enabled: true }}
          className="!px-6 !py-2 md:!px-10 lg:!px-[60px]"
        >
          {CARDS.map((c) => (
            <SwiperSlide key={c.title} className="!h-auto">
              <CardView c={c} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Reveal>
    </section>
  );
}
