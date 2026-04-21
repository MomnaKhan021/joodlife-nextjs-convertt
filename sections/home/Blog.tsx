"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const POSTS = [
  {
    tag: "Jood Updates",
    image: "/assets/figma/quiz-overlay.png",
    title: "How Weight Loss Medications Are Changing Everyday Lives",
  },
  {
    tag: "Health & Diet",
    image: "/assets/figma/blog-2.png",
    title: "How Weight Loss Medications Are Changing Everyday Lives",
  },
  {
    tag: "Health & Diet",
    image: "/assets/figma/blog-3.png",
    title: "How Weight Loss Medications Are Changing Everyday Lives",
  },
];

export default function Blog() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const scroll = (dir: -1 | 1) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
    setPageIndex((p) => Math.max(0, Math.min(POSTS.length - 1, p + dir)));
  };

  return (
    <section
      aria-label="Recent blog posts"
      className="w-full bg-white py-16 md:py-[100px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <div className="flex items-end justify-between gap-4 pb-10">
          <h2 className="font-display text-[32px] leading-[40px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            Recent <em className="font-serif italic font-normal">blog</em> posts
          </h2>
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous"
              className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#142e2a]/10"
            >
              <Image
                src="/assets/figma/arrow-left.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next"
              className="grid h-[50px] w-[50px] place-items-center rounded-full bg-[#142e2a]"
            >
              <Image
                src="/assets/figma/arrow-right.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 invert"
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-5 overflow-x-auto scroll-smooth pb-4"
        >
          {POSTS.map((post, i) => (
            <article
              key={i}
              className="relative h-[520px] w-[calc(100%-20px)] shrink-0 overflow-hidden rounded-lg md:w-[426px]"
            >
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 426px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
              <div className="relative z-10 flex h-full flex-col justify-between p-8">
                <span className="inline-flex w-fit items-center rounded-full bg-white/20 px-3 py-2 font-ui text-[14px] font-semibold text-white md:text-[16.3px]">
                  {post.tag}
                </span>
                <div className="rounded-lg bg-black/10 p-6 backdrop-blur-sm">
                  <h3 className="font-ui text-[18px] font-semibold leading-[22px] text-white">
                    {post.title}
                  </h3>
                  <Link
                    href="#"
                    className="mt-6 inline-flex h-[50px] items-center justify-center rounded-lg bg-white/10 px-12 font-ui text-[16.3px] font-semibold text-white"
                  >
                    Read Blog Post
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-2 pt-8">
          {POSTS.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === pageIndex
                  ? "w-[26px] bg-[#142e2a]"
                  : "w-2 bg-[#142e2a]/20"
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}
