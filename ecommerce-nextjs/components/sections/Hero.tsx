import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-cream">
      <div className="max-w-[1320px] mx-auto px-5 pt-8 pb-0">
        {/* Trustpilot badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-accent-green text-lg">&#9733;</span>
          <Image src="/icons/trustpilot-logo.svg" alt="Trustpilot" width={80} height={20} />
          <Image src="/icons/trustpilot-stars.svg" alt="4.4 stars" width={86} height={16} />
          <span className="text-[18px] font-normal text-primary underline font-[family-name:var(--font-saans)]">
            4.4 <span className="text-sm">(50+) Reviews</span>
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-center font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-primary mb-6 max-w-3xl mx-auto md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          Innovative <em className="font-[family-name:var(--font-clearface)] italic font-normal">weight loss,</em>
          <br />
          made just for you.
        </h1>

        {/* Trust points */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-[16px] font-[380] tracking-[-0.32px] text-primary">
          {[
            'Lose up to 27% body weight',
            'Plans tailored to you',
            'Guidance for lasting results',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#142E2A" />
                <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center mb-10">
          <Link
            href="#get-started"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>

        {/* Before/After images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl overflow-hidden">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="/images/hero-transform.png"
              alt="Weight loss transformation - before and after"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-md text-sm font-[570]">Before</div>
            <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5 rounded-md text-sm font-[570]">After</div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="/images/product-card-1.png"
              alt="Weight loss transformation"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-md text-sm font-[570]">Before</div>
            <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1.5 rounded-md text-sm font-[570]">After</div>
          </div>
        </div>
      </div>
    </section>
  );
}
