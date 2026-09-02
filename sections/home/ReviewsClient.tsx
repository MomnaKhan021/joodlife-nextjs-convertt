"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import Reveal from "@/components/ui/Reveal";
import { REVIEWS, TRUSTPILOT, type Review } from "@/lib/reviews";

/**
 * Reviews — a slider of real, verified 5-star reviews pulled from the
 * JoodLife Trustpilot profile (see lib/reviews.ts). No fabricated
 * testimonials and no category tags, per the client's request; each card
 * shows the reviewer's real name, their Trustpilot photo where available,
 * and links out to the live Trustpilot profile.
 */

/** Below this many cards, all fit on screen — no pagination needed. */
const PAGINATION_MIN = 4;

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className="review-card flex h-full w-full flex-col justify-between rounded-lg border border-[#142E2A]/20 bg-[#f7f9f2] px-4 py-6 md:h-[288px]"
      style={{
        transition:
          "border-color 320ms ease-out, background-color 320ms ease-out, box-shadow 320ms ease-out",
      }}
    >
      <div className="flex flex-col gap-4">
        <Image
          src="/assets/figma/stars-5.svg"
          alt="5 out of 5 stars"
          width={84}
          height={16}
          className="h-4 w-[84px] self-start"
        />
        <p className="font-ui text-[15.5px] leading-[22px] text-[#2a2929]">
          {review.text}
        </p>
        <div className="h-px w-28 bg-[#142E2A]" />
      </div>
      <div className="mt-5 flex items-center gap-2.5">
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
            <span className="font-sans text-[15px] font-medium text-[#142e2a]">
              {review.initials}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="font-ui text-[16px] font-semibold leading-[20px] text-[#142e2a]">
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
            <span className="font-ui text-[12px] font-medium text-[#00b67a]">
              Verified
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export type ReviewsContent = {
  heading?: string;
  headingEmphasis?: string;
  intro?: string;
  /** Empty falls back to the curated Trustpilot list in lib/reviews.ts. */
  reviews?: Review[];
  trustpilotScore?: string;
  trustpilotUrl?: string;
};

export default function ReviewsClient({
  heading = "Loved by our",
  headingEmphasis = "customers",
  intro = "Real reviews from real patients on Trustpilot. Our patients value the expert support, clear communication and fast, discreet delivery that make every journey unique.",
  reviews,
  trustpilotScore,
  trustpilotUrl,
}: ReviewsContent = {}) {
  const ITEMS = reviews?.length ? reviews : REVIEWS;
  const TP = {
    score: trustpilotScore || TRUSTPILOT.score,
    url: trustpilotUrl || TRUSTPILOT.url,
  };
  const showPagination = ITEMS.length >= PAGINATION_MIN;

  return (
    <section
      id="reviews"
      aria-label="Reviews"
      className="w-full scroll-mt-28 bg-white py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 pb-8 text-center"
        >
          <a
            href={TP.url}
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
              alt={`Rated ${TP.score} out of 5 stars`}
              width={86}
              height={16}
              className="h-4 w-auto"
            />
            <span className="font-inter text-[18px] text-[#142e2a]">
              {TP.score} out of 5
            </span>
          </a>
          <h2 className="font-display text-[32px] leading-[36px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            {heading}{" "}
            <em className="font-serif italic font-normal">{headingEmphasis}</em>
          </h2>
          <p className="max-w-[780px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            {intro}
          </p>
        </Reveal>

        <Reveal delay={150}>
          <Swiper
            modules={[Pagination, A11y]}
            speed={500}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.6 },
              768: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3 },
            }}
            pagination={showPagination ? { clickable: true } : false}
            a11y={{ enabled: true }}
            className="reviews-swiper !overflow-hidden !px-0.5 !py-3"
          >
            {ITEMS.map((r, i) => (
              <SwiperSlide key={i} className="!h-auto">
                <ReviewCard review={r} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Reveal>
      </div>

      <style jsx global>{`
        .reviews-swiper .swiper-pagination {
          position: static;
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .reviews-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #142e2a;
          opacity: 0.25;
          transition: opacity 200ms ease, width 200ms ease;
        }
        .reviews-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          width: 22px;
          border-radius: 999px;
        }
      `}</style>
    </section>
  );
}
