"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

export type BlogCardPost = {
  title: string;
  href: string;
  tag: string;
  image: string;
};

/**
 * Home "Recent blog posts" carousel. Data comes from the CMS (Posts
 * collection) via the server section; each card links to /blogs/[slug].
 * Prev/next arrows and the dot pagination are wired to the Swiper
 * instance through React state so they always reflect the active slide.
 */
export default function BlogCarousel({ posts }: { posts: BlogCardPost[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  // Loop needs enough slides to fill the largest view (3) plus a buffer.
  const canLoop = posts.length > 3;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
      <div className="flex items-center justify-between gap-4 pb-8 md:pb-10">
        <h2 className="font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
          Recent <em className="font-serif italic font-normal">blog</em> posts
        </h2>
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous slide"
            className="group grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-[#142e2a]/15 bg-white transition-colors duration-200 hover:border-[#142e2a] hover:bg-[#142e2a]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className="text-[#142e2a] transition-colors duration-200 group-hover:text-white"
            >
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next slide"
            className="group grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-[#142e2a] transition-colors duration-200 hover:bg-[#0c2421]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className="text-white"
            >
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <Swiper
        modules={[Navigation, A11y]}
        onSwiper={(s) => {
          swiperRef.current = s;
        }}
        onSlideChange={(s) => setActive(s.realIndex)}
        speed={600}
        spaceBetween={20}
        slidesPerView={1.1}
        loop={canLoop}
        breakpoints={{
          640: { slidesPerView: 1.6, spaceBetween: 20 },
          768: { slidesPerView: 2.2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
        }}
        a11y={{ enabled: true }}
        className="blog-swiper"
      >
        {posts.map((post, i) => (
          <SwiperSlide key={`${post.href}-${i}`} className="!h-auto">
            <Link
              href={post.href}
              className="blog-card group relative block h-[460px] w-full overflow-hidden rounded-2xl md:h-[520px]"
            >
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />
              <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8">
                <span className="inline-flex w-fit items-center rounded-full bg-white/25 px-3 py-1.5 font-ui text-[13px] font-semibold text-white backdrop-blur-sm md:text-[14px]">
                  {post.tag}
                </span>
                <div className="flex flex-col gap-4 rounded-xl bg-black/20 p-5 backdrop-blur-md md:p-6">
                  <h3 className="font-ui text-[17px] font-semibold leading-[22px] text-white md:text-[19px] md:leading-[24px]">
                    {post.title}
                  </h3>
                  <span className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-white/15 px-6 font-ui text-[13px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors duration-200 group-hover:bg-white group-hover:text-[#142e2a] md:h-12 md:text-[14px]">
                    Read Blog Post
                  </span>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Dot pagination — one per post, drives the carousel */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {posts.map((post, i) => (
          <button
            key={`dot-${post.href}-${i}`}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active === i}
            onClick={() =>
              canLoop
                ? swiperRef.current?.slideToLoop(i)
                : swiperRef.current?.slideTo(i)
            }
            className={`h-2 rounded-full transition-all duration-300 ${
              active === i
                ? "w-[26px] bg-[#142e2a]"
                : "w-2 bg-[#142e2a]/20 hover:bg-[#142e2a]/40"
            }`}
          />
        ))}
      </div>

      <style jsx global>{`
        .blog-swiper {
          padding-bottom: 2px;
        }
        .blog-swiper .swiper-slide {
          opacity: 0.55;
          transform: scale(0.97);
          transition:
            opacity 500ms ease,
            transform 500ms ease;
        }
        .blog-swiper .swiper-slide-active,
        .blog-swiper .swiper-slide-next,
        .blog-swiper .swiper-slide-prev,
        .blog-swiper .swiper-slide-visible {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
    </div>
  );
}
