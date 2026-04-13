'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

const transformations = [
  { before: '/images/before-1.png', after: '/images/after-1.png' },
  { before: '/images/before-2.png', after: '/images/after-2.png' },
  { before: '/images/before-3.png', after: '/images/after-3.png' },
];

export default function Hero() {
  return (
    <section className="bg-white">
      {/* Top content area */}
      <div className="px-5 pt-6 pb-8 md:pt-8 md:pb-10">
        {/* Trustpilot badge */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" fill="#00B67A" />
          </svg>
          <Image src="/icons/trustpilot-logo.svg" alt="Trustpilot" width={80} height={20} />
          <Image src="/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} />
          <span className="text-[18px] font-normal text-primary font-[family-name:var(--font-saans)]">
            4.4{' '}
            <span className="text-[14px] underline">(50+) Reviews</span>
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-center font-[family-name:var(--font-gilroy)] font-semibold tracking-[-1.2px] text-primary mb-5 max-w-[700px] mx-auto text-[32px] leading-[36px] md:text-[48px] md:leading-[52px]">
          Innovative{' '}
          <em className="font-[family-name:var(--font-clearface)] italic font-normal">
            weight loss,
          </em>
          <br />
          made just for you.
        </h1>

        {/* Trust points */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-[16px] font-[380] tracking-[-0.32px] leading-[19px] text-primary">
          {[
            'Lose up to 27% body weight',
            'Plans tailored to you',
            'Guidance for lasting results',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
                <circle cx="11" cy="11" r="11" fill="#142E2A" />
                <path
                  d="M7 11l3 3 5-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button - outline style matching Figma */}
        <div className="flex justify-center mb-0">
          <Link
            href="#get-started"
            className="inline-flex items-center justify-center px-8 py-3.5 border-[1.5px] border-primary text-primary bg-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:bg-primary hover:text-white transition-all"
          >
            Get started
          </Link>
        </div>
      </div>

      {/* Before/After slider - dark background */}
      <div className="bg-primary relative overflow-hidden">
        {/* Edge fade overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />

        <div className="py-10 md:py-16">
          <Swiper
            modules={[Autoplay]}
            slidesPerView={1.2}
            spaceBetween={16}
            centeredSlides={true}
            loop={true}
            speed={800}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 1.5, spaceBetween: 20 },
              768: { slidesPerView: 2.2, spaceBetween: 24 },
              1024: { slidesPerView: 2.5, spaceBetween: 28 },
            }}
          >
            {transformations.map((pair, i) => (
              <SwiperSlide key={i}>
                <div className="flex gap-2 md:gap-3">
                  {/* Before */}
                  <div className="relative flex-1 aspect-[299/436] rounded-[16px] overflow-hidden">
                    <Image
                      src={pair.before}
                      alt={`Before transformation ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 40vw, 300px"
                      priority={i === 0}
                    />
                    <div className="absolute bottom-3 left-3 bg-white px-3 py-1 rounded-md text-[13px] font-[570] text-primary shadow-sm">
                      Before
                    </div>
                  </div>
                  {/* After */}
                  <div className="relative flex-1 aspect-[299/436] rounded-[16px] overflow-hidden">
                    <Image
                      src={pair.after}
                      alt={`After transformation ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 40vw, 300px"
                      priority={i === 0}
                    />
                    <div className="absolute bottom-3 right-3 bg-white px-3 py-1 rounded-md text-[13px] font-[570] text-primary shadow-sm">
                      After
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
