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
      {/* Main hero card - dark green rounded rectangle */}
      <div className="px-5 py-0">
        <div className="max-w-[1400px] mx-auto bg-primary rounded-[24px] overflow-hidden px-6 md:px-[60px] pt-16 md:pt-20 pb-10 md:pb-20">
          {/* Content area */}
          <div className="flex flex-col items-center text-center">
            {/* Trustpilot badge */}
            <div className="flex items-center gap-2 mb-5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" fill="#00B67A" />
              </svg>
              <Image src="/icons/trustpilot-logo.svg" alt="Trustpilot" width={80} height={20} className="brightness-0 invert" />
              <Image src="/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} />
              <span className="text-[14.2px] font-normal text-white/80 font-[family-name:var(--font-saans)]">
                4.4{' '}
                <span className="underline">(50+) Reviews</span>
              </span>
            </div>

            {/* Main heading - Gilroy-SemiBold 60px on desktop */}
            <h1 className="font-[family-name:var(--font-gilroy)] font-semibold text-white tracking-[-1.5px] mb-5 text-[32px] leading-[36px] md:text-[52px] md:leading-[58px] lg:text-[60px] lg:leading-[64px]">
              Innovative{' '}
              <em className="font-[family-name:var(--font-clearface)] italic font-normal">
                weight loss,
              </em>
              <br className="hidden md:block" />
              {' '}made just for you.
            </h1>

            {/* Trust points */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white">
              {[
                'Lose up to 27% body weight',
                'Plans tailored to you',
                'Guidance for lasting results',
              ].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
                    <circle cx="11" cy="11" r="11" fill="white" />
                    <path
                      d="M7 11l3 3 5-5"
                      stroke="#142E2A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA Button - white filled with dark text */}
            <Link
              href="#get-started"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity mb-10 md:mb-16"
            >
              Get started
            </Link>
          </div>

          {/* Before/After Slider - inside the dark card */}
          <div className="relative -mx-6 md:-mx-[60px]">
            {/* Edge fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />

            <Swiper
              modules={[Autoplay]}
              slidesPerView={1.1}
              spaceBetween={20}
              centeredSlides={true}
              loop={true}
              speed={400}
              autoplay={{ delay: 2000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 1.4, spaceBetween: 24 },
                768: { slidesPerView: 1.8, spaceBetween: 32 },
                1024: { slidesPerView: 2.1, spaceBetween: 40 },
              }}
            >
              {transformations.map((pair, i) => (
                <SwiperSlide key={i}>
                  <div className="flex gap-0">
                    {/* Before */}
                    <div className="relative flex-1 aspect-[299/436] rounded-l-[16px] overflow-hidden">
                      <Image
                        src={pair.before}
                        alt={`Before transformation ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 40vw, 300px"
                        priority={i === 0}
                      />
                      <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-md text-[16px] font-normal text-primary font-[family-name:var(--font-outfit)]">
                        Before
                      </div>
                    </div>
                    {/* After */}
                    <div className="relative flex-1 aspect-[299/436] rounded-r-[16px] overflow-hidden">
                      <Image
                        src={pair.after}
                        alt={`After transformation ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 40vw, 300px"
                        priority={i === 0}
                      />
                      <div className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-md text-[16px] font-normal text-primary font-[family-name:var(--font-outfit)]">
                        After
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
