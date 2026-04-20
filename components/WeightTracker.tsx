'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const circleGraphSrc = "https://www.figma.com/api/mcp/asset/a404a661-e2ef-4bdc-be3e-45e81dc8a0a9";
const productBoxSrc = "https://www.figma.com/api/mcp/asset/ba5c4ca6-fe31-4af1-bc8c-0b1f8b7c545d";

export default function WeightTracker() {
  const [weight, setWeight] = useState(0);
  const [targetReached, setTargetReached] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !targetReached) {
          let currentWeight = 0;
          const interval = setInterval(() => {
            if (currentWeight < 98) {
              currentWeight += 2;
              setWeight(currentWeight);
            } else {
              setTargetReached(true);
              clearInterval(interval);
            }
          }, 30);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [targetReached]);

  return (
    <section ref={sectionRef} className="bg-white w-full py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="relative bg-sage-light rounded-[24px] p-[80px] flex gap-[51px] items-center min-h-[500px]">
          <div className="flex-1 flex flex-col items-center gap-[54px]">
            <div className="relative w-[420px] h-[420px]">
              <Image
                src={circleGraphSrc}
                alt="Weight tracker"
                fill
                className="object-contain"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[20px]">
                <div className="flex flex-col items-center gap-[8px]">
                  <p
                    className="text-primary font-medium text-[18px]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    Your Starting Weight
                  </p>
                  <div className="flex items-baseline gap-[7px]">
                    <p
                      className="text-primary text-[56px] font-normal"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      {Math.round(weight * 0.98)}
                    </p>
                    <p
                      className="text-sage text-[27px] font-normal"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      kg
                    </p>
                  </div>
                </div>

                <div className="w-[243px] h-[22px] bg-white rounded-[8px] flex items-center relative">
                  <div
                    className="absolute h-[4px] bg-primary rounded-[8px] transition-all duration-300"
                    style={{
                      width: `${(weight / 98) * 100}%`,
                      left: 0,
                    }}
                  />
                  <div
                    className="absolute w-[24px] h-[24px] bg-primary rounded-full shadow-lg transition-all duration-300 -top-1"
                    style={{
                      left: `calc(${(weight / 98) * 100}% - 12px)`,
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-white m-1" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-[8px]">
                  <p
                    className="text-primary font-medium text-[18px]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    In one year, you could lose:
                  </p>
                  <div className="flex items-baseline gap-[7px]">
                    <p
                      className="text-primary text-[56px] font-normal"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      20
                    </p>
                    <p
                      className="text-sage text-[27px] font-normal"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      kg
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p
              className="text-primary text-[18px] leading-[1.1] tracking-[-0.72px] text-center w-[340px]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              People lost on average 20% of their weight loss over a year using our weight loss programme
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-[52px]">
            <h2
              className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary"
              style={{ fontFamily: 'var(--font-gilroy)' }}
            >
              Achieve{' '}
              <span style={{ fontFamily: 'var(--font-outfit)' }}>your </span>
              <span
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontStyle: 'italic',
                }}
              >
                weight loss goals{' '}
              </span>
              with jood
            </h2>

            <div className="bg-black/20 rounded-[10px] p-[25px] w-[288px] flex flex-col gap-[30px]">
              <div className="flex items-center gap-[12px]">
                <p
                  className="text-white text-[130px] font-bold tracking-[-5.2px] leading-none"
                  style={{ fontFamily: 'var(--font-gilroy)' }}
                >
                  27
                </p>
                <div className="bg-sage rounded-full w-[53px] h-[53px] flex items-center justify-center">
                  <p
                    className="text-white text-[32px] font-medium"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    %
                  </p>
                </div>
              </div>

              <p
                className="text-white text-[15px] leading-[1.14] tracking-[-0.607px]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Average weight loss over 6 month period
              </p>

              <button
                className="bg-white rounded-full py-[16px] px-[23px] text-primary font-normal text-[15px] hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Get Started
              </button>
            </div>
          </div>

          <div className="absolute right-[80px] bottom-[80px] w-[400px] h-[250px]">
            <Image
              src={productBoxSrc}
              alt="JoodLife product"
              fill
              className="object-contain"
              style={{ transform: 'rotate(-0.54deg)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
