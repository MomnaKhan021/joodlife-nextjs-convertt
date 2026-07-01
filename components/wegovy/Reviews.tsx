"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Reveal from "@/components/ui/Reveal";

/**
 * Wegovy reviews — Figma node 1:1746.
 * Swipeable row of review cards (no filter tabs): five-star rating, quote,
 * divider, then author with verified tick, plus swiper pagination dots.
 */

type Review = {
  text: string;
  name: string;
  avatar?: string;
  initials?: string;
};

const REVIEWS: Review[] = [
  {
    text: "My medication always arrives well packaged and promptly and I don't have to answer hundreds of questions to receive it",
    name: "Hayley Churchyard",
    initials: "HC",
  },
  {
    text: "“Exactly what I needed” The process was quick, easy, and very discreet. It gave me peace of mind before an important event and everything worked exactly as expected.",
    name: "Gillian Rhodes",
    avatar: "/assets/figma/avatar-gillian.png",
  },
  {
    text: "I've had a fantastic experience with Jood life, quick service, support on hand 24/7, reasonable prices and no pressure to constantly buy injections",
    name: "Jacqueline Riley",
    initials: "JR",
  },
  {
    text: "“A huge improvement overall” I no longer worry the way I used to. I feel more in control, more relaxed, and more confident in intimate situations.",
    name: "Mike",
    initials: "MI",
  },
  {
    text: "The pill option made a real difference for me — no needles, easy to take, and the weekly check-ins kept me on track the whole way through.",
    name: "Sarah Bennett",
    initials: "SB",
  },
  {
    text: "Brilliant from start to finish. The clinical team answered every question and my order arrived faster than I expected.",
    name: "David Owusu",
    initials: "DO",
  },
  {
    text: "I was nervous about starting, but the guidance was clear and reassuring. Down two dress sizes and feeling so much better.",
    name: "Priya Sharma",
    initials: "PS",
  },
  {
    text: "Genuinely the easiest healthcare experience I've had. Discreet packaging, fair pricing and no pushy upsells.",
    name: "Tom Fletcher",
    initials: "TF",
  },
  {
    text: "Steady, sustainable results without the stress. The support team feels like they actually care about your progress.",
    name: "Amelia Clarke",
    initials: "AC",
  },
];

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full w-full flex-col justify-between rounded-lg bg-[#f7f9f2] px-5 py-6 md:h-[301.8px]">
      <div className="flex flex-col gap-4">
        <Image
          src="/assets/figma/stars-5.svg"
          alt="5 out of 5 stars"
          width={84}
          height={16}
          className="h-4 w-auto"
        />
        <p className="font-ui text-[15px] leading-[22px] text-[#2a2929] md:text-[16.3px]">
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
          <p className="font-ui text-[16.3px] font-semibold leading-[20px] text-[#142e2a]">
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
            <span className="font-ui text-[12px] font-normal text-[#142e2a]">
              Verified
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Reviews() {
  return (
    <section
      id="reviews"
      aria-label="Reviews"
      className="w-full scroll-mt-28 bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 pb-9 text-center"
        >
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
          <h2 className="font-display text-[36px] font-semibold leading-[43.2px] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            3000+ Happy{" "}
            <em className="font-serif italic font-normal">Customers</em>
          </h2>
          <p className="max-w-[780px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Thousands have trusted Jood for safe, clinically guided weight-loss
            care. Our patients value the expert support, clear communication,
            and lasting results that make every journey unique.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <Swiper
            modules={[Pagination, A11y]}
            speed={500}
            spaceBetween={20}
            slidesPerView={1.1}
            breakpoints={{
              640: { slidesPerView: 1.6 },
              768: { slidesPerView: 2.2 },
              1024: { slidesPerView: 4 },
            }}
            pagination={{ clickable: true }}
            a11y={{ enabled: true }}
            className="reviews-swiper !overflow-hidden !px-0.5 !py-3"
          >
            {REVIEWS.map((r, i) => (
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
          margin: 0 !important;
          background: #142e2a;
          opacity: 0.2;
          border-radius: 9999px;
          transition: width 0.3s ease, opacity 0.3s ease;
        }
        .reviews-swiper .swiper-pagination-bullet:hover {
          opacity: 0.45;
        }
        .reviews-swiper .swiper-pagination-bullet-active {
          width: 26px;
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
