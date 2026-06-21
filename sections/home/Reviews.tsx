"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import Reveal from "@/components/ui/Reveal";

type Review = {
  text: string;
  name: string;
  category: "Weight loss" | "Period delay" | "Erectile dysfunction";
  avatar?: string;
  initials?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Weight loss": "#142E2A",
  "Period delay": "#EC1F63",
  "Erectile dysfunction": "#1A8EC1",
};

const REVIEWS: Review[] = [
  {
    text: "My medication always arrives well packaged and promptly and I don't have to answer hundreds of questions to receive it",
    name: "Hayley Churchyard",
    category: "Weight loss",
    initials: "HC",
  },
  {
    text: "\"Exactly what I needed\" The process was quick, easy, and very discreet. It gave me peace of mind before an important event and everything worked exactly as expected.",
    name: "Gillian Rhodes",
    category: "Period delay",
    avatar: "/assets/figma/avatar-gillian.png",
  },
  {
    text: "I've had a fantastic experience with Jood life, quick service, support on hand 24/7, reasonable prices and no pressure to constantly buy injections",
    name: "Jacqueline Riley",
    category: "Weight loss",
    initials: "JR",
  },
  {
    text: "\"A huge improvement overall\" I no longer worry the way I used to. I feel more in control, more relaxed, and more confident in intimate situations.",
    name: "Mike",
    category: "Erectile dysfunction",
    initials: "MI",
  },
];

const TABS = ["All", "Weight loss", "Period delay", "Erectile dysfunction"] as const;
type Tab = (typeof TABS)[number];

const TAB_COUNTS: Record<Tab, number> = {
  All: 100,
  "Weight loss": 38,
  "Period delay": 38,
  "Erectile dysfunction": 24,
};

function ReviewCard({ review }: { review: Review }) {
  const color = CATEGORY_COLORS[review.category];
  return (
    <article className="flex h-full w-full flex-col justify-between rounded-lg border border-[#142E2A]/20 bg-[#f7f9f2] px-4 py-6">
      <div className="flex flex-col gap-4">
        <span
          className="inline-block self-start rounded-full px-3 py-1 font-ui text-[14px] font-normal leading-[18.5px]"
          style={{ color, border: `1px solid ${color}33` }}
        >
          {review.category}
        </span>
        <Image
          src="/assets/figma/stars-5.svg"
          alt="5 out of 5 stars"
          width={84}
          height={16}
          className="h-4 w-auto"
        />
        <p className="font-outfit text-[16px] leading-[22px] text-[#292828]">
          {review.text}
        </p>
        <div className="h-px w-28 bg-[#142E2A]" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        {review.avatar ? (
          <Image
            src={review.avatar}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#daffe0]">
            <span className="font-sans text-[16px] text-[#142e2a]">
              {review.initials}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="font-outfit text-[14px] font-normal leading-[20px] text-[#142e2a]">
            {review.name}
          </p>
          <div className="flex items-center gap-1.5">
            <Image
              src="/assets/figma/verified-tick.svg"
              alt=""
              width={13}
              height={13}
              className="h-[13px] w-[13px] flex-shrink-0"
              aria-hidden
            />
            <span className="font-outfit text-[12px] font-normal text-[#142e2a]">
              Verified
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Reviews() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const swiperRef = useRef<SwiperType | null>(null);

  const filtered =
    activeTab === "All"
      ? REVIEWS
      : REVIEWS.filter((r) => r.category === activeTab);

  return (
    <section
      id="reviews"
      aria-label="Reviews"
      className="w-full scroll-mt-28 bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        {/* Header */}
        <Reveal as="div" className="flex flex-col items-center gap-3 pb-8 text-center">
          <a
            href="https://www.trustpilot.com/review/joodlife.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Jood Life reviews on Trustpilot"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
          >
            <Image
              src="/assets/icons/trustpilot-logo-dark.svg"
              alt="Trustpilot"
              width={80}
              height={20}
              className="h-5 w-auto"
            />
            <Image
              src="/assets/icons/trustpilot-stars.svg"
              alt="5 stars"
              width={86}
              height={16}
              className="h-4 w-auto"
            />
            <span className="font-inter text-[18px] text-[#142e2a]">
              4.4 (50+) Reviews
            </span>
          </a>
          <h2 className="font-display text-[32px] leading-[36px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            3000+ happy{" "}
            <em className="font-serif italic font-normal">customers</em>
          </h2>
          <p className="max-w-[780px] font-ui text-[15px] font-normal leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Thousands have trusted Jood for safe, clinically guided weight-loss
            care. Our patients value the expert support, clear communication,
            and lasting results that make every journey unique.
          </p>
        </Reveal>

        {/* Filter tabs */}
        <Reveal delay={100} className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                swiperRef.current?.slideTo(0);
              }}
              className={`inline-flex items-center rounded-full px-4 py-2 font-ui text-[14px] font-normal leading-[18.5px] transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-[#142e2a] text-white"
                  : "border border-[#142e2a]/20 bg-white text-[#142e2a] hover:bg-[#f7f9f2]"
              }`}
            >
              {tab} ({TAB_COUNTS[tab]})
            </button>
          ))}
        </Reveal>

        {/* Swiper with custom nav */}
        <Reveal delay={150} className="relative">
          <Swiper
            modules={[Navigation, A11y]}
            onBeforeInit={(swiper) => { swiperRef.current = swiper; }}
            speed={500}
            spaceBetween={20}
            slidesPerView={1.1}
            breakpoints={{
              640: { slidesPerView: 1.6 },
              768: { slidesPerView: 2.2 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
            }}
            a11y={{ enabled: true }}
            className="reviews-swiper !pb-2"
          >
            {filtered.map((r, i) => (
              <SwiperSlide key={`${activeTab}-${i}`} className="!h-auto">
                <ReviewCard review={r} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom nav arrows */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous reviews"
              className="group grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-[#142e2a]/15 bg-white transition-colors duration-200 hover:border-[#142e2a] hover:bg-[#142e2a]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden
                className="text-[#142e2a] transition-colors duration-200 group-hover:text-white">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next reviews"
              className="group grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-[#142e2a] transition-colors duration-200 hover:bg-[#0c2421]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="text-white">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
