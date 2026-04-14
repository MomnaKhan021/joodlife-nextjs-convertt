'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
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

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function Timeline() {
  const { ref: sectionRef, inView } = useInView({ threshold: 0.1 });
  const parallaxRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: ['start end', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section className="bg-primary text-white py-16 md:py-24 relative overflow-hidden" ref={sectionRef}>
      {/* CSS Wave background behind girl image */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute bottom-[30%] left-0 w-full h-[500px] opacity-10 wave-float"
          viewBox="0 0 1440 500"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 250C240 150 480 350 720 250C960 150 1200 350 1440 250V500H0Z"
            fill="white"
          />
        </svg>
        <svg
          className="absolute bottom-[25%] left-0 w-full h-[400px] opacity-5 wave-float-slow"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0 200C360 300 720 100 1080 200C1260 250 1380 180 1440 200V400H0Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Decorative circles */}
      <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full border border-white/5" />
      <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] rounded-full border border-white/5" />

      <div className="max-w-[1200px] mx-auto px-5 relative z-10">
        {/* Tag */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1.5 border border-white/30 rounded-full text-[14px] font-[790] uppercase tracking-[-0.32px]">
            Timeline
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="font-[family-name:var(--font-gilroy)] font-semibold tracking-[-1.2px] mb-12"
          style={{ fontSize: 'clamp(32px, 4vw + 8px, 48px)', lineHeight: 'clamp(36px, 4.5vw + 8px, 52px)' }}
        >
          What to expect in
          <br />
          <em className="font-[family-name:var(--font-clearface)] italic font-normal">your journey</em>
        </motion.h2>

        {/* Animated progress bar */}
        <div className="hidden md:block relative mb-8">
          <div className="w-full h-[2px] bg-white/20 rounded-full">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full border-2 border-white"
                initial={{ backgroundColor: '#142E2A' }}
                whileInView={{ backgroundColor: '#FFFFFF' }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.5, duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15, ease }}
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
            </motion.div>
          ))}
        </div>

        {/* Woman image with parallax */}
        <div className="flex justify-center mb-16" ref={parallaxRef}>
          <motion.div className="relative w-full max-w-[500px] aspect-[646/573]" style={{ y: imageY }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
            >
              <Image
                src="/images/woman-standing.png"
                alt="Transform with Jood"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
          >
            <h3 className="font-[family-name:var(--font-gilroy)] font-semibold text-[28px] md:text-[34px] leading-tight tracking-[-1.4px] mb-4">
              It&apos;s more than treatment,
            </h3>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
              <Image src="/images/before-1.png" alt="Transformation results" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <p className="font-[family-name:var(--font-clearface)] italic text-2xl mb-4">
              it&apos;s transformation
            </p>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white/90 mb-6">
              A provider licensed in your state will review your information, so that they can design a plan around your body&apos;s needs.
            </p>
            <Link
              href="#get-started"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-lime text-primary text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Get personalized plan
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
          >
            <h3 className="font-[family-name:var(--font-gilroy)] font-semibold text-[28px] md:text-[34px] leading-tight tracking-[-1.4px] mb-4">
              Continuous, Expert Guidance
            </h3>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
              <Image src="/images/doctor-overlay.png" alt="Expert guidance" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <p className="font-[family-name:var(--font-clearface)] italic text-2xl mb-4">
              at Every Step
            </p>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white/90 mb-6">
              Get access to qualified medical professionals who are here to support you throughout your journey whenever you need advice.
            </p>
            <Link
              href="#get-started"
              className="inline-flex items-center justify-center px-6 py-3.5 border border-white text-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:bg-white hover:text-primary transition-all cursor-pointer"
            >
              Get started
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
