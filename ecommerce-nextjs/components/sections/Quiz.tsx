import Image from 'next/image';
import Link from 'next/link';

export default function Quiz() {
  return (
    <section id="quiz" className="bg-white py-16 md:py-20">
      <div className="max-w-[1320px] mx-auto px-5">
        {/* Heading */}
        <h2 className="text-center font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-primary mb-4 md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          Let&apos;s get to <em className="font-[family-name:var(--font-clearface)] italic font-normal">know</em> you
        </h2>

        <p className="text-center text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary max-w-xl mx-auto mb-10">
          Answer a few simple questions so we can match you with the right treatment
          and support for lasting results.
        </p>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quiz card - dark */}
          <div className="bg-primary rounded-2xl p-8 md:p-10 text-white flex flex-col justify-between min-h-[450px]">
            <div>
              {/* Floating weight card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-6 max-w-[280px]">
                <p className="text-[12px] font-[380] tracking-[-0.2px] text-white/60 font-[family-name:var(--font-clearface)] italic mb-2">
                  Your weight-loss plan
                </p>
                <p className="text-[16.3px] font-[790] tracking-[-0.32px] text-white mb-3">
                  What is your desired weight?
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-[380] text-white/80">lbs</span>
                  <div className="w-8 h-8 rounded-full bg-primary border border-white/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6 2v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-white/90 mb-8">
                Answer a few simple questions so we can match you with the right treatment
                and support for lasting results.
              </p>
            </div>

            <Link
              href="#start-quiz"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity w-fit"
            >
              Start Quiz
            </Link>
          </div>

          {/* Image card */}
          <div className="relative rounded-2xl overflow-hidden min-h-[450px]">
            <Image
              src="/images/quiz-section.png"
              alt="Feel Energetic"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            {/* Top label */}
            <div className="absolute top-6 left-6">
              <span className="inline-flex items-center px-4 py-2 bg-lime text-primary text-[16.3px] font-[790] tracking-[-0.32px] rounded-full">
                Feel Energetic
              </span>
            </div>

            {/* Bottom stats */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[16.3px] font-[380] tracking-[-0.32px] text-white">
                    Makeing sure you are moving in the right direction
                    by tracking your progress
                  </p>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[12px] font-[380] text-white/60">loos up to</p>
                    <p className="text-[24px] font-[500] text-white font-[family-name:var(--font-outfit)]">20<span className="text-sm">kg</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {['140kg', '130kg', '120kg', '110kg', '100kg'].map((val) => (
                    <span key={val} className="text-[14px] font-[380] text-white/70">{val}</span>
                  ))}
                </div>
                <div className="w-full h-1.5 bg-white/20 rounded-full mt-2">
                  <div className="w-3/4 h-full bg-gradient-to-r from-lime to-primary rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
