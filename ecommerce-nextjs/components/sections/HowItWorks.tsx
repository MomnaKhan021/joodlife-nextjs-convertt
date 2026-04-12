import Image from 'next/image';

const steps = [
  {
    step: '1 Step',
    title: 'Health assessment',
    description: 'Fill out a quick form about your medical background, daily habits, and wellness goals.',
    image: '/images/hero-pill.png',
    label: 'Your weight-loss plan',
    sublabel: 'What is your desired weight?',
  },
  {
    step: '2 Step',
    title: 'Expert review',
    description: 'Licensed providers in your state review your info and recommend the best course of action.',
    image: '/images/certified-badge.png',
    label: null,
    sublabel: 'Certified',
  },
  {
    step: '3 Step',
    title: 'Get medication',
    description: 'Order affordable meds from vetted pharmacies or brand names.',
    image: '/images/hero-pill.png',
    label: 'Your Personalized Care',
    sublabel: 'Ready to Get Medication?',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Heading */}
        <h2 className="text-center font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-primary mb-4 md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          How it <em className="font-[family-name:var(--font-clearface)] italic font-normal">works</em>
        </h2>

        {/* Subtitle */}
        <p className="text-center text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary max-w-2xl mx-auto mb-12">
          Address symptoms, treat root causes, and adjust your behaviours, for immediate
          relief and long-term optimal health.
        </p>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.step} className="flex flex-col items-center">
              {/* Card with image */}
              <div className="bg-bg-card rounded-2xl p-6 w-full mb-6 relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
                {step.label && (
                  <div className="absolute top-4 left-4 bg-white/80 rounded-lg px-3 py-2 shadow-sm">
                    <p className="text-[12px] font-[380] tracking-[-0.2px] text-primary/60 font-[family-name:var(--font-clearface)] italic">
                      {step.label}
                    </p>
                    <p className="text-[16px] font-[790] tracking-[-0.32px] text-primary mt-1">
                      {step.sublabel}
                    </p>
                  </div>
                )}
                <div className="relative w-48 h-48">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain"
                    sizes="192px"
                  />
                </div>
                {!step.label && step.sublabel && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7.5" stroke="white" />
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[16px] font-[570] tracking-[-0.32px]">{step.sublabel}</span>
                  </div>
                )}
              </div>

              {/* Step label */}
              <div className="flex items-center justify-center w-full mb-3">
                <span className="inline-flex items-center justify-center px-3 py-1 bg-primary text-white text-[14.2px] font-[570] tracking-[-0.43px] uppercase rounded-full">
                  {step.step}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] leading-[25.62px] tracking-[-0.49px] text-primary text-center mb-2">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-center text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
