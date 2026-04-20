'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const verifyIcon = "https://s3-alpha-sig.figma.com/img/1332/c477/cae928dd8b08e7669a702d7691775859?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=kCrNYb4fm6vsd444lb1bNH5yCZTUJoLGEy2QRES7y~qbe6AFiqZG97thAXzOVtMCPlpIEmSrLxAZQJcSnbKJvjU-dtQ5Rp4-heNXMh0xKE2ws1rKAlpahtg1Gz15QSnBot92yjU4CThrgx6gJptnKWEE~xifzjwDgjJWJPNAMWQASnakw5mKEIV9eiOf0uszYH0lVJeH8wqZ4s0cmKMObVseuc4X372rDKbBQuTQ4LdFrsKhnJwN5f8gQ7adytMvAQ1Vu~9mu0zdYknNZP6rAibXw-cbMF64i8CaPiQ5qYGwDpZALzBX~AKjL6s3arzoS9zKNoK6SUC00~5eOAv4gQ__";

const heroBg = "https://s3-alpha-sig.figma.com/img/0128/c350/948ec3e26db65852c6a22cf3047efc14?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=e4cf0MUrDfW7hO2KHV0XQ7iE13bnSs9ckI10GuPZXg-qfVQYfitatJGlY3sc6O36i91T~8Tr93i~D2oryL0Ybj-MB07d-N6FxvjNiPsP~rIQd0Ad71GCNwR6XeOWsfJBey2i1CLtQ-FgL~YHhSS2ZVFH57Lzcazmlo9G47ayw1dUhOAVXIH~yDkEjeYneWd3X1-knkKvG~rFZyR1HPdbq9ZsNr6pdRbj6KqErKAfThh9-RY~Sro0p4-HlZ9ZH8cxv8sffsCWd9A5SlX8FOyqqOsPoZaa~fbY2wlecp7KlLTIo4vIHx7cYb4E2ps7eOlmESVBb6A2RHlRxMSiuXPc0Q__";

const slides = [
  {
    title: 'Innovative weight loss, made just for you.',
    subtitle: 'weight loss,',
    bullets: ['Lose up to 27% body weight', 'Guidance for lasting results', 'Plans tailored to you'],
  },
  {
    title: 'Transform your health with expert care.',
    subtitle: 'expert care,',
    bullets: ['Personalized treatment plans', '24/7 medical support', 'Proven results'],
  },
  {
    title: 'Achieve lasting results with confidence.',
    subtitle: 'lasting results,',
    bullets: ['Science-backed approach', 'Sustainable lifestyle changes', 'Long-term support'],
  },
  {
    title: 'Join thousands who have transformed.',
    subtitle: 'transformed,',
    bullets: ['Real success stories', 'Community support', 'Ongoing guidance'],
  },
  {
    title: 'Your health journey starts here today.',
    subtitle: 'starts here,',
    bullets: ['Easy onboarding process', 'Personalized assessment', 'Immediate support'],
  },
  {
    title: 'Medical weight loss solutions for you.',
    subtitle: 'for you,',
    bullets: ['UK licensed medication', 'Clinically proven', 'Tailored to your needs'],
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoPlay(false);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Image - Layer 1 */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Image
          src={heroBg}
          alt="Weight loss journey"
          fill
          className="object-cover w-full h-full"
          priority
          quality={100}
          sizes="100vw"
        />
      </div>

      {/* Dark Overlay - Layer 2 */}
      <div className="absolute inset-0 z-10 bg-black/65" />

      {/* Dark Gradient Overlay - Layer 2.5 */}
      <div
        className="absolute inset-0 z-10"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(12, 36, 33, 0.4) 0%, rgba(0, 0, 0, 0.3) 100%)',
        }}
      />

      {/* Content Container - Layer 3 */}
      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-[1440px] mx-auto w-full px-[20px] sm:px-[40px] md:px-[60px] lg:px-[80px]">
          <div className="flex flex-col gap-[40px] max-w-[564px]">
            {/* Stars + Social Proof */}
            <div className="flex items-center gap-[12px]">
              <div className="flex gap-[2px]">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sage text-lg font-bold">★</span>
                ))}
              </div>
              <span
                className="text-white font-normal text-[16px]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                <strong>3K+</strong> happy customers
              </span>
            </div>

            {/* Main Headline */}
            <div className="flex flex-col gap-[19px]">
              <h1
                className="text-white text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] leading-[1.1] tracking-[-2.24px] font-bold"
                style={{ fontFamily: 'var(--font-gilroy)' }}
              >
                {slide.title.split(slide.subtitle)[0]}
                <span
                  className="text-white font-bold"
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontStyle: 'italic',
                    fontWeight: '700',
                  }}
                >
                  {slide.subtitle}
                </span>
                {slide.title.split(slide.subtitle)[1]}
              </h1>

              {/* Bullet Points */}
              <div className="flex flex-col gap-[15px] pt-[20px]">
                {slide.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-[15px]">
                    <div className="w-[24px] h-[24px] relative flex-shrink-0">
                      <Image
                        src={verifyIcon}
                        alt="Check"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span
                      className="text-white text-[14px] sm:text-[16px] lg:text-[18px] leading-[1.5] font-normal"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              className="bg-white/30 border-2 border-white rounded-full px-[40px] py-[15px] text-white font-semibold text-[18px] w-fit hover:bg-white/40 transition-colors duration-300 backdrop-blur-sm"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Get started
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-[12px] sm:left-[20px] lg:left-[80px] top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 transition-colors p-[10px] sm:p-[12px] rounded-full text-white text-[20px] sm:text-[24px]"
      >
        &#8249;
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-[12px] sm:right-[20px] lg:right-[80px] top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 transition-colors p-[10px] sm:p-[12px] rounded-full text-white text-[20px] sm:text-[24px]"
      >
        &#8250;
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 z-30 flex gap-[8px]">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`w-[10px] h-[10px] rounded-full transition-all ${
              idx === currentSlide ? 'bg-white w-[30px]' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
