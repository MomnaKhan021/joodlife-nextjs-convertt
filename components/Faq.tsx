'use client';

import { useState } from 'react';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Is JoodLife safe?',
      answer: 'Yes, JoodLife uses only UK licensed medications prescribed by registered healthcare professionals. All treatments are clinically proven and undergo rigorous safety testing.',
    },
    {
      question: 'How long does it take to see results?',
      answer: 'Most patients begin to see results within 4-6 weeks. However, results vary based on individual factors, lifestyle, and adherence to the program.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Absolutely. We believe in flexible subscriptions with no long-term commitments. You can cancel anytime without penalties.',
    },
    {
      question: 'What if the medication doesn\'t work for me?',
      answer: 'Our medical team monitors your progress and adjusts your treatment plan accordingly. If a medication isn\'t working, we explore alternative options.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a satisfaction guarantee. If you\'re not satisfied with your results after 30 days, contact our support team for options.',
    },
  ];

  return (
    <section className="w-full bg-cream py-[80px] px-[80px]">
      <div className="max-w-[800px] mx-auto">
        <h2
          className="text-[40px] leading-[1.1] tracking-[-1.6px] text-primary mb-[60px] text-center"
          style={{ fontFamily: 'var(--font-gilroy)' }}
        >
          Frequently asked questions
        </h2>

        <div className="flex flex-col gap-[16px]">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-sage rounded-[8px] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between bg-white hover:bg-gray-50 px-[24px] py-[20px] transition-colors"
              >
                <h3
                  className="text-primary font-semibold text-[18px] text-left"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {faq.question}
                </h3>
                <span
                  className={`text-sage text-[24px] font-bold transition-transform duration-300 flex-shrink-0 ml-4 ${
                    openIndex === idx ? 'rotate-45' : ''
                  }`}
                >
                  +
                </span>
              </button>

              {openIndex === idx && (
                <div className="bg-white px-[24px] py-[16px] border-t border-sage">
                  <p
                    className="text-dark-text text-[16px] leading-[1.6]"
                    style={{ fontFamily: 'var(--font-outfit)' }}
                  >
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
