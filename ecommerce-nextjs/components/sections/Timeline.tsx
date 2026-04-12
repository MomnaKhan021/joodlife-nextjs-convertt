import Image from 'next/image';
import Link from 'next/link';

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
  return (
    <section className="bg-primary text-white py-16 md:py-24 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full border border-white/10" />
      <div className="absolute bottom-40 left-[-100px] w-[300px] h-[300px] rounded-full border border-white/10" />

      <div className="max-w-[1320px] mx-auto px-5 relative z-10">
        {/* Tag */}
        <div className="mb-6">
          <span className="inline-block px-4 py-1.5 border border-white/30 rounded-full text-[14px] font-[790] uppercase tracking-[-0.32px]">
            Timeline
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] mb-12 md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          What to expect in
          <br />
          <em className="font-[family-name:var(--font-clearface)] italic font-normal">your journey</em>
        </h2>

        {/* Timeline steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Progress line */}
          <div className="hidden md:block absolute top-[280px] left-[60px] right-[60px] h-0.5 bg-white/20">
            <div className="absolute left-0 top-0 w-1/3 h-full bg-white" />
            {steps.map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
                style={{ left: `${i * 50}%` }}
              />
            ))}
          </div>

          {steps.map((step) => (
            <div key={step.label} className="relative">
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
          <div className="relative w-full max-w-[500px] aspect-[3/4]">
            <Image
              src="/images/certified-badge.png"
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
            <h3 className="font-[family-name:var(--font-gilroy)] font-semibold text-[34px] leading-tight tracking-[-1.4px] mb-4">
              It&apos;s more than treatment,
            </h3>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
              <Image
                src="/images/product-card-3.png"
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
            <h3 className="font-[family-name:var(--font-gilroy)] font-semibold text-[34px] leading-tight tracking-[-1.4px] mb-4">
              Continuous, Expert Guidance
            </h3>
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4">
              <Image
                src="/images/quiz-section.png"
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
