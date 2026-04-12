import Image from 'next/image';
import Link from 'next/link';

const cards = [
  {
    icon: '/icons/treatment-delivery.svg',
    title: 'Discreet, next-day delivery',
    description: 'Next-day, unbranded, secure delivery with DPD.',
  },
  {
    icon: '/icons/treatment-support.svg',
    title: '24/7 expert support',
    description: 'Access experienced clinicians and coaches whenever you need.',
  },
  {
    icon: '/icons/treatment-trusted.svg',
    title: 'Trusted by thousands',
    description: 'Chosen by patients nationwide for safe, effective care.',
  },
  {
    icon: '/icons/treatment-effective.svg',
    title: 'Highly effective treatments',
    description: 'Modern evidence-based medication options.',
  },
  {
    icon: '/icons/treatment-consultation.svg',
    title: 'Quick, easy consultation',
    description: 'Start online in minutes: simple, private, seamless.',
  },
  {
    icon: '/icons/treatment-progress.svg',
    title: 'Track your progress',
    description: 'Monitor results and stay on track using our online customer portal.',
  },
];

export default function TreatmentPlan() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Heading */}
        <h2 className="text-center font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-primary mb-12 md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          A treatment plan that
          <br />
          <em className="font-[family-name:var(--font-clearface)] italic font-normal">works</em> with your body
        </h2>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
          {cards.map((card) => (
            <div key={card.title} className="bg-bg-card rounded-2xl p-5 flex flex-col">
              <div className="mb-4">
                <Image src={card.icon} alt="" width={40} height={40} />
              </div>
              <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[20px] md:text-[24.4px] leading-[25.62px] tracking-[-0.49px] text-primary mb-2">
                {card.title}
              </h3>
              <p className="text-[14.2px] font-[380] tracking-[-0.43px] leading-[17px] text-primary">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#get-started"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
          <Link
            href="#quiz"
            className="inline-flex items-center justify-center px-8 py-4 border-[1.5px] border-primary text-primary text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:bg-primary hover:text-white transition-all"
          >
            See if you are eligible
          </Link>
        </div>
      </div>
    </section>
  );
}
