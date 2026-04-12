import Image from 'next/image';

export default function Products() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
          <h2 className="font-[family-name:var(--font-clearface)] font-bold text-[48px] leading-[52px] tracking-[-1.2px] text-primary-light max-w-xl md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
            Everyone&apos;s talking about{' '}
            <em className="italic">jood life</em> because it works.
          </h2>
          <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary-dark max-w-xs md:text-right">
            Clinically proven treatments, medically supervised guidance, and thousand
            of real transformation all one powerful program.
          </p>
        </div>

        {/* Three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Weight Calculator Card */}
          <div className="bg-bg-card rounded-2xl p-8 flex flex-col">
            <h3 className="font-[family-name:var(--font-saans)] font-[790] text-[24.4px] leading-[25.62px] tracking-[-0.49px] text-primary mb-4">
              See how much weight you could lose
            </h3>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-primary mb-2">Your Starting Weight</p>
            <div className="text-[44.7px] font-[570] tracking-[-1.34px] text-primary mb-4">98kg</div>
            <div className="flex gap-2 mb-6">
              <span className="px-4 py-1.5 bg-primary text-white rounded-full text-[16px] font-[500]">kg</span>
              <span className="px-4 py-1.5 text-primary/80 rounded-full text-[16px] font-[500]">lb</span>
            </div>
            <div className="w-full h-1 bg-primary/20 rounded-full mb-2">
              <div className="w-1/3 h-full bg-primary rounded-full" />
            </div>
            <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-primary mt-4 mb-2">
              Estimated weight loss over 12 months
            </p>
            <div className="bg-primary text-white rounded-xl px-6 py-4 text-center">
              <span className="text-[44.7px] font-[570] tracking-[-1.34px]">-26kg</span>
            </div>
          </div>

          {/* Quick Consultation Card */}
          <div className="relative rounded-2xl overflow-hidden min-h-[400px]">
            <Image
              src="/images/consultation-woman.png"
              alt="Quick, Easy Consultation"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
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
            <div className="flex items-start mb-4">
              <span className="font-[family-name:var(--font-gilroy)] font-semibold text-[80px] md:text-[101px] leading-none tracking-[-1.3px] text-primary-dark">
                27
              </span>
              <div className="mt-4 ml-1">
                <div className="w-10 h-10 rounded-full border-4 border-primary flex items-center justify-center">
                  <span className="font-[family-name:var(--font-outfit)] font-[500] text-[16px] text-primary">%</span>
                </div>
              </div>
            </div>
            <div className="w-full mb-6">
              <svg viewBox="0 0 200 40" className="w-full max-w-[200px] mx-auto">
                <path d="M0 35 Q50 35 100 20 T200 5" fill="none" stroke="#142E2A" strokeWidth="3" strokeLinecap="round" />
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
