"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import Reveal from "@/components/ui/Reveal";
import { REVIEWS, TRUSTPILOT, type Review } from "@/lib/reviews";
import SliderArrow from "./SliderArrow";
import { ACCENT, WRAP } from "./type";

/**
 * Reviews slider for /foundayo, styled to the Figma "Reviews" frame
 * (2003:1465): four 315×302 cards per view on desktop, #fff8f6 with a 1px
 * #d0cfcd border and 24/12 padding; review text 16.3/19.5 in #2a2929, name
 * 16.3/19.5 medium, grey "Verified" label; outline-circle pagination dots
 * with a filled pill for the active one. Trustpilot row reads "4.4 (50+)
 * Reviews" as in the design. Same real review data as the home page.
 * Desktop gets prev/next arrows that only show where there is somewhere to go.
 */
const PAGINATION_MIN = 4;

function Card({ review }: { review: Review }) {
  return (
    <article className="flex h-full w-full flex-col justify-between rounded-lg border border-[#d0cfcd] bg-[#fff8f6] px-3 py-6 md:h-[302px]">
      <div className="flex flex-col gap-4">
        <Image src="/assets/figma/stars-5.svg" alt="5 out of 5 stars" width={84} height={16} className="h-4 w-[84px] self-start" />
        <p className="font-ui text-[16.3px] leading-[19.5px] tracking-[-0.3px] text-[#2a2929]">{review.text}</p>
        <div className="h-px w-[122px] bg-[#142e2a]" />
      </div>
      <div className="mt-5 flex items-center gap-[10px]">
        {review.avatar ? (
          <Image src={review.avatar} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#daffe0]">
            <span className="font-sans text-[16px] text-[#142e2a]">{review.initials}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.3px] text-[#142e2a]">{review.name}</p>
          <div className="flex items-center gap-1.5">
            <Image src="/assets/figma/verified-tick.svg" alt="" width={13} height={13} className="h-[13px] w-[13px] shrink-0" aria-hidden />
            <span className="font-ui text-[12px] leading-[15.6px] tracking-[-0.2px] text-[#2a2929]">Verified</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ReviewsSlider({
  heading,
  headingAccent,
  intro,
  reviews,
  trustpilotScore,
  trustpilotUrl,
}: {
  heading: string;
  headingAccent: string;
  intro: string;
  reviews?: Review[];
  trustpilotScore?: string;
  trustpilotUrl?: string;
}) {
  const ITEMS = reviews?.length ? reviews : REVIEWS;
  const score = trustpilotScore || TRUSTPILOT.score;
  const url = trustpilotUrl || TRUSTPILOT.url;
  const showPagination = ITEMS.length >= PAGINATION_MIN;

  return (
    <section id="reviews" aria-label="Reviews" className="w-full scroll-mt-28 bg-white py-[60px] md:py-20">
      <div className={WRAP}>
        <Reveal as="div" className="flex flex-col items-center gap-[10px] pb-[30px] text-center md:pb-10">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Jood Life reviews on Trustpilot"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
          >
            <Image src="/assets/icons/trustpilot-logo-dark.svg" alt="Trustpilot" width={80} height={20} className="h-5 w-auto" />
            <Image src="/assets/icons/trustpilot-stars.svg" alt={`Rated ${score} out of 5 stars`} width={86} height={16} className="h-4 w-auto" />
            <span className="font-ui text-[14.2px] leading-[17px] tracking-[-0.4px] text-[#142e2a]">
              <strong className="font-bold">{score}</strong> (50+) Reviews
            </span>
          </a>
          <h2 className="font-display text-[32px] !font-semibold leading-[36px] tracking-[-1px] text-[#142e2a] md:text-[48px] md:leading-[52px] md:tracking-[-1.2px]">
            {heading} <em className={ACCENT}>{headingAccent}</em>
          </h2>
          <p className="max-w-[900px] font-ui text-[16.3px] font-medium leading-[19.5px] tracking-[-0.3px] text-[#142e2a]">{intro}</p>
        </Reveal>

        <Reveal delay={150} className="relative">
          <Swiper
            modules={[Pagination, Navigation, A11y]}
            speed={500}
            spaceBetween={20}
            slidesPerView={1.05}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } }}
            pagination={showPagination ? { clickable: true } : false}
            navigation={{ prevEl: "#fnd-reviews-prev", nextEl: "#fnd-reviews-next" }}
            a11y={{ enabled: true }}
            className="fnd-reviews !overflow-hidden !px-0.5 !py-1"
          >
            {ITEMS.map((r, i) => (
              <SwiperSlide key={i} className="!h-auto">
                <Card review={r} />
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Centred on the cards, not the whole block (the dots sit below). */}
          <SliderArrow dir="prev" id="fnd-reviews-prev" className="!top-[151px] -left-[22px]" />
          <SliderArrow dir="next" id="fnd-reviews-next" className="!top-[151px] -right-[22px]" />
        </Reveal>
      </div>

      <style jsx global>{`
        .fnd-reviews .swiper-pagination {
          position: static;
          margin-top: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .fnd-reviews .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: transparent;
          border: 1.5px solid #142e2a;
          opacity: 1;
          transition: width 200ms ease, background-color 200ms ease;
        }
        .fnd-reviews .swiper-pagination-bullet-active {
          width: 22px;
          border-radius: 999px;
          background: #142e2a;
        }
      `}</style>
    </section>
  );
}
