"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const POSTS = [
  {
    tag: "Jood Updates",
    image: "/assets/figma/quiz-overlay.png",
    title: "How Weight Loss Medications Are Changing Everyday Lives",
  },
  {
    tag: "Health & Diet",
    image: "/assets/figma/blog-2.png",
    title: "The Science Behind GLP-1 and Sustainable Results",
  },
  {
    tag: "Health & Diet",
    image: "/assets/figma/blog-3.png",
    title: "Daily Habits That Accelerate Your Weight Loss Journey",
  },
  {
    tag: "Wellness",
    image: "/assets/figma/quiz-overlay.png",
    title: "Mindful Eating: Small Shifts With Big Impact",
  },
  {
    tag: "Jood Updates",
    image: "/assets/figma/blog-2.png",
    title: "Real Patient Stories: Transformations That Last",
  },
];

export default function Blog() {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section
      aria-label="Recent blog posts"
      className="w-full bg-white py-14 md:py-[100px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <div className="flex items-center justify-between gap-4 pb-8 md:pb-10">
          <h2 className="font-display text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Recent{" "}
            <em className="font-serif italic font-normal">blog</em> posts
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
                xmlns="http://www.w3.org/2000/svg"
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
                xmlns="http://www.w3.org/2000/svg"
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
          modules={[Navigation, Pagination, A11y]}
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper;
          }}
          speed={700}
          spaceBetween={20}
          slidesPerView={1.1}
          pagination={{
            el: ".blog-pagination",
            clickable: true,
            bulletClass: "blog-bullet",
            bulletActiveClass: "blog-bullet-active",
          }}
          breakpoints={{
            640: { slidesPerView: 1.6, spaceBetween: 20 },
            768: { slidesPerView: 2.2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
          }}
          a11y={{ enabled: true }}
          className="blog-swiper"
        >
          {POSTS.map((post, i) => (
            <SwiperSlide key={i} className="!h-auto">
              <article className="blog-card relative h-[460px] w-full overflow-hidden rounded-2xl md:h-[520px]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out"
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
                    <Link
                      href="#"
                      className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-white/15 px-6 font-ui text-[13px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors duration-200 hover:bg-white hover:text-[#142e2a] md:h-12 md:text-[14px]"
                    >
                      Read Blog Post
                    </Link>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="blog-pagination mt-8 flex items-center justify-center gap-2" />
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
        .blog-card:hover img {
          transform: scale(1.04);
        }
        .blog-bullet {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background-color: rgba(20, 46, 42, 0.2);
          cursor: pointer;
          transition:
            width 300ms ease,
            background-color 300ms ease;
        }
        .blog-bullet-active {
          width: 26px;
          background-color: #142e2a;
        }
      `}</style>
    </section>
  );
}
