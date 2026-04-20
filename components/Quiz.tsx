'use client';

import { useState } from 'react';

export default function Quiz() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
  };

  return (
    <section className="w-full bg-primary py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          <div className="flex flex-col gap-[30px]">
            <h2
              className="text-[40px] leading-[1.1] tracking-[-1.6px] text-white"
              style={{ fontFamily: 'var(--font-gilroy)' }}
            >
              Let&apos;s get to know you
            </h2>
            <p
              className="text-white/80 text-[18px] leading-[1.5]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Take our quick quiz to help us understand your weight loss goals and create a personalized plan just for you.
            </p>
          </div>

          <div className="bg-white rounded-[16px] p-[40px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]">
              <div>
                <label
                  className="block text-primary font-medium text-[16px] mb-[8px]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-[16px] py-[12px] border border-gray-300 rounded-[8px] text-primary focus:outline-none focus:ring-2 focus:ring-sage"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                />
              </div>

              <div>
                <label
                  className="block text-primary font-medium text-[16px] mb-[12px]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  How much weight would you like to lose?
                </label>
                <div className="flex flex-col gap-[8px]">
                  {['5-10 kg', '10-20 kg', '20+ kg'].map((option) => (
                    <label key={option} className="flex items-center gap-[8px] cursor-pointer">
                      <input
                        type="radio"
                        name="weight"
                        value={option}
                        className="w-[16px] h-[16px]"
                      />
                      <span
                        className="text-primary text-[16px]"
                        style={{ fontFamily: 'var(--font-outfit)' }}
                      >
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="bg-sage rounded-full py-[12px] px-[32px] text-white font-semibold text-[16px] hover:bg-sage/90 transition-colors"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Start Your Free Consultation
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
