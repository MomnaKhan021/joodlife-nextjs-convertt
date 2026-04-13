'use client';

import Image from 'next/image';
import Link from 'next/link';

const transformations = [
  { before: '/images/before-1.png', after: '/images/after-1.png' },
  { before: '/images/before-2.png', after: '/images/after-2.png' },
  { before: '/images/before-3.png', after: '/images/after-3.png' },
  { before: '/images/before-1.png', after: '/images/after-1.png' },
  { before: '/images/before-2.png', after: '/images/after-2.png' },
  { before: '/images/before-3.png', after: '/images/after-3.png' },
];

export default function Hero() {
  return (
    <section className="bg-white">
      <div className="px-5">
        <div className="max-w-[1400px] mx-auto bg-primary rounded-[24px] overflow-hidden pt-16 md:pt-20 pb-10 md:pb-16">
          {/* Content area */}
          <div className="flex flex-col items-center text-center px-6 md:px-[60px]">
            {/* Trustpilot badge - Inter 14.2px */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" fill="#00B67A" />
              </svg>
              <Image src="/icons/trustpilot-logo.svg" alt="Trustpilot" width={80} height={20} className="brightness-0 invert" />
              <Image src="/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} />
              <span
                className="font-normal text-white"
                style={{ fontFamily: 'Inter, var(--font-saans)', fontSize: '14.2px', letterSpacing: '-0.43px', lineHeight: '17px' }}
              >
                4.4{' '}
                <span className="underline">(50+) Reviews</span>
              </span>
            </div>

            {/* Main heading - Gilroy-SemiBold, 60px desktop, clamp for responsive */}
            <h1
              className="font-[family-name:var(--font-gilroy)] font-semibold text-white text-center mb-5 max-w-[684px]"
              style={{
                fontSize: 'clamp(32px, 5vw + 8px, 60px)',
                lineHeight: 'clamp(38px, 5.5vw + 10px, 68px)',
                letterSpacing: '-1.6px',
              }}
            >
              Innovative{' '}
              <em className="font-[family-name:var(--font-clearface)] italic font-normal">
                weight loss,
              </em>
              <br className="hidden md:block" />
              {' '}made just for you.
            </h1>

            {/* Trust points - Saans 16.3px, color #D3DABE (muted green-white) */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
              {[
                'Lose up to 27% body weight',
                'Plans tailored to you',
                'Guidance for lasting results',
              ].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0">
                    <circle cx="11" cy="11" r="11" fill="#D3DABE" />
                    <path d="M7 11l3 3 5-5" stroke="#142E2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span
                    className="font-[family-name:var(--font-saans)]"
                    style={{ fontSize: '16.3px', fontWeight: 380, letterSpacing: '-0.32px', lineHeight: '19.5px', color: '#D3DABE' }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button - Saans Bold 16.3px, uppercase */}
            <Link
              href="#get-started"
              className="inline-flex items-center justify-center bg-white text-primary uppercase rounded-lg hover:opacity-90 transition-opacity mb-10 md:mb-16"
              style={{ padding: '14px 32px', fontSize: '16.3px', fontWeight: 790, letterSpacing: '-0.32px', lineHeight: '19.5px' }}
            >
              Get started
            </Link>
          </div>

          {/* Before/After horizontal scroll slider */}
          <div className="relative">
            {/* Left blur/fade overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none" />
            {/* Right blur/fade overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-10 md:w-16 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />

            {/* Scrollable track */}
            <div
              className="flex gap-[22px] overflow-x-auto px-4 md:px-[60px] pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
              style={{ scrollbarWidth: 'none' }}
            >
              {transformations.map((pair, i) => (
                <div
                  key={i}
                  className="hero-slide flex rounded-[24px] overflow-hidden snap-start"
                >
                  {/* Before image */}
                  <div className="relative flex-1 aspect-[298/436]">
                    <Image
                      src={pair.before}
                      alt={`Before transformation ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 70vw, 300px"
                      priority={i < 2}
                    />
                    <div
                      className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-md text-primary font-[family-name:var(--font-outfit)]"
                      style={{ fontSize: '16px', fontWeight: 400 }}
                    >
                      Before
                    </div>
                  </div>
                  {/* After image */}
                  <div className="relative flex-1 aspect-[298/436]">
                    <Image
                      src={pair.after}
                      alt={`After transformation ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 70vw, 300px"
                      priority={i < 2}
                    />
                    <div
                      className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-md text-primary font-[family-name:var(--font-outfit)]"
                      style={{ fontSize: '16px', fontWeight: 400 }}
                    >
                      After
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
