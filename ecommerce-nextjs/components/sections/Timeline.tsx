'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useInView } from '@/hooks/useInView';

const steps = [
  {
    label: 'Today',
    title: 'Simple assessment',
    description: 'Quick online consultation with prescription and delivery if eligible.',
  },
  {
    label: '1 - 6 Months',
    title: 'Healthy weight loss',
    description: 'Steady weight loss with ongoing clinical support.',
  },
  {
    label: '6 - 12 Months',
    title: 'Lasting change',
    description: 'Maintain results with continued guidance and care.',
  },
];

export default function Timeline() {
  const { ref, inView } = useInView({ threshold: 0.15 });

  return (
    <section className="bg-primary text-white py-16 md:py-24 relative overflow-hidden" ref={ref}>
      {/* Background decorative elements */}
      <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full border border-white/5" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] rounded-full border border-white/5" />

      <div className="max-w-[1200px] mx-auto px-5 relative z-10">
        {/* Tag */}
        <div className="mb-6">
          <span className="inline-block px-4 py-1.5 border border-white/30 rounded-full text-[14px] font-[790] uppercase tracking-[-0.32px]">
            Timeline
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-[family-name:var(--font-gilroy)] font-semibold text-[32px] leading-[36px] md:text-[48px] md:leading-[52px] tracking-[-1.2px] mb-12">
          What to expect in
          <br />
          <em className="font-[family-name:var(--font-clearface)] italic font-normal">your journey</em>
        </h2>

        {/* Animated progress bar with dots */}
        <div className="hidden md:block relative mb-8">
          <div className="w-full h-[2px] bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-[2s] ease-out"
              style={{ width: inView ? '100%' : '0%' }}
            />
          </div>
          <div className="flex justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0">
            {steps.map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border-2 border-white bg-primary transition-all duration-500"
                style={{
                  transitionDelay: inView ? `${i * 700}ms` : '0ms',
                  backgroundColor: inView ? 'white' : 'var(--color-primary)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Timeline steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="opacity-0 translate-y-4 transition-all duration-700"
              style={{
                transitionDelay: inView ? `${i * 300}ms` : '0ms',
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0)' : 'translateY(16px)',
              }}
            >
              <span className="inline-block px-3 py-1 border border-white/30 rounded-full text-[14px] font-[790] uppercase tracking-[-0.32px] mb-4">
                {step.label}
              </span>
              <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] leading-[25.62px] tracking-[-0.49px] mb-2">
                {step.title}
              </h3>
              <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white/90">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Woman image */}
        <div className="flex justify-center mb-16">
          <div className="relative w-full max-w-[500px] aspect-[646/573]">
            <Image
              src="/images/woman-standing.png"
              alt="Transform with Jood"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 - Treatment */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="font-[family-name:var(--font-gilroy)] font-semibold text-[28px] md:text-[34px] leading-tight tracking-[-1.4px] mb-4">
              It&apos;s more than treatment,
            </h3>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
              <Image
                src="/images/before-1.png"
                alt="Transformation results"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <p className="font-[family-name:var(--font-clearface)] italic text-2xl mb-4">
              it&apos;s transformation
            </p>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white/90 mb-6">
              A provider licensed in your state will review your information, so that they can design a
              plan around your body&apos;s needs.
            </p>
            <Link
              href="#get-started"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-lime text-primary text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity"
            >
              Get personalized plan
            </Link>
          </div>

          {/* Card 2 - Guidance */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="font-[family-name:var(--font-gilroy)] font-semibold text-[28px] md:text-[34px] leading-tight tracking-[-1.4px] mb-4">
              Continuous, Expert Guidance
            </h3>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
              <Image
                src="/images/doctor-overlay.png"
                alt="Expert guidance"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <p className="font-[family-name:var(--font-clearface)] italic text-2xl mb-4">
              at Every Step
            </p>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white/90 mb-6">
              Get access to qualified medical professionals who are here to support you throughout your journey
              whenever you need advice.
            </p>
            <Link
              href="#get-started"
              className="inline-flex items-center justify-center px-6 py-3.5 border border-white text-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:bg-white hover:text-primary transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
