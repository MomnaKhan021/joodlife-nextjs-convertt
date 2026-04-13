'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

export default function Products() {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const weightValue = useCountUp({ end: 98, duration: 2000, enabled: inView, suffix: 'kg' });
  const lossValue = useCountUp({ end: 26, duration: 2000, enabled: inView, prefix: '-', suffix: 'kg' });
  const percentValue = useCountUp({ end: 27, duration: 2500, enabled: inView });

  return (
    <section className="bg-white py-16 md:py-20" ref={ref}>
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
          <h2 className="font-[family-name:var(--font-clearface)] font-bold text-[32px] leading-[36px] md:text-[48px] md:leading-[52px] tracking-[-1.2px] text-primary-light max-w-xl">
            Everyone&apos;s talking about{' '}
            <em className="italic">jood life</em> because it works.
          </h2>
          <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary-dark max-w-[280px] md:text-right">
            Clinically proven treatments, medically supervised guidance, and thousand
            of real transformation all one powerful program.
          </p>
        </div>

        {/* Three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Weight Calculator Card */}
          <div className="bg-bg-card rounded-2xl p-7 flex flex-col">
            <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] leading-[25.62px] tracking-[-0.49px] text-primary mb-4">
              See how much weight you could lose
            </h3>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-primary mb-1">Your Starting Weight</p>
            <div className="font-[family-name:var(--font-saans)] text-[44.7px] font-[570] tracking-[-1.34px] text-primary mb-3">
              {weightValue}
            </div>
            <div className="flex gap-2 mb-5">
              <span className="px-5 py-1.5 bg-primary text-white rounded-full text-[16px] font-[500] font-[family-name:var(--font-outfit)]">
                kg
              </span>
              <span className="px-5 py-1.5 text-primary/60 rounded-full text-[16px] font-[500] font-[family-name:var(--font-outfit)]">
                lb
              </span>
            </div>
            {/* Slider track */}
            <div className="relative w-full h-[6px] bg-primary/15 rounded-full mb-1">
              <div
                className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-[2s] ease-out"
                style={{ width: inView ? '33%' : '0%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-md transition-all duration-[2s] ease-out"
                style={{ left: inView ? '33%' : '0%' }}
              />
            </div>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-primary mt-4 mb-2">
              Estimated weight loss over 12 months
            </p>
            <div className="bg-primary text-white rounded-xl px-6 py-4 text-center">
              <span className="font-[family-name:var(--font-saans)] text-[44.7px] font-[570] tracking-[-1.34px]">
                {lossValue}
              </span>
            </div>
          </div>

          {/* Quick Consultation Card */}
          <div className="relative rounded-2xl overflow-hidden min-h-[400px] md:min-h-0">
            <Image
              src="/images/consultation-woman.png"
              alt="Quick, Easy Consultation"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute top-6 left-6 right-6">
              <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] leading-[25.62px] tracking-[-0.49px] text-white">
                Quick, Easy Consultation
              </h3>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-[16.3px] font-[380] w-fit">
                12% fat loss
              </span>
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-[16.3px] font-[380] w-fit">
                Medical-grade care
              </span>
            </div>
          </div>

          {/* 27% Stats Card */}
          <div className="bg-bg-card rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            {/* Circular progress */}
            <div className="relative w-[160px] h-[160px] mb-4">
              <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E5E0" strokeWidth="8" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#142E2A"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={inView ? `${2 * Math.PI * 70 * (1 - 0.75)}` : `${2 * Math.PI * 70}`}
                  className="transition-all duration-[2.5s] ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-[family-name:var(--font-gilroy)] font-semibold text-[64px] md:text-[80px] leading-none tracking-[-1.3px] text-primary-dark">
                  {percentValue}
                </span>
                <div className="ml-0.5 mt-2">
                  <div className="w-8 h-8 rounded-full bg-accent-green flex items-center justify-center">
                    <span className="text-white text-[12px] font-[600]">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trend line */}
            <div className="w-full mb-5">
              <svg viewBox="0 0 240 50" className="w-full max-w-[220px] mx-auto">
                <path
                  d="M10 40 Q60 38 120 22 T230 8"
                  fill="none"
                  stroke="#142E2A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="300"
                  strokeDashoffset={inView ? '0' : '300'}
                  className="transition-all duration-[2s] ease-out delay-500"
                />
              </svg>
            </div>

            <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] leading-[25.62px] tracking-[-0.49px] text-primary-dark mb-3">
              Achieve your weight loss goals with jood
            </h3>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-primary-dark">
              People lost on average 20% of their weight loss over a year using our weight loss programme
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
