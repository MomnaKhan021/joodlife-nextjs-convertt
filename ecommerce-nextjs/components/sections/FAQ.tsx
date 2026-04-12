'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  { question: "How does Jood's weight-loss actually work?" },
  { question: 'Is the medication safe and evidence-based?' },
  { question: 'What if I miss an injection?' },
  { question: 'What is included with my purchase?' },
  { question: 'What is included with my purchase?' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faqs" className="bg-white py-16 md:py-20">
      <div className="max-w-[800px] mx-auto px-5">
        {/* Heading */}
        <h2 className="text-center font-[family-name:var(--font-gilroy)] font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-primary mb-10 md:text-[48px] text-[32px] md:leading-[52px] leading-[36px]">
          Frequently asked{' '}
          <em className="font-[family-name:var(--font-clearface)] italic font-normal">questions</em>
        </h2>

        {/* FAQ items */}
        <div className="divide-y divide-gray-200">
          {faqs.map((faq, i) => (
            <div key={i} className="py-5">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="text-[16.3px] font-[790] tracking-[-0.32px] leading-[19.5px] text-primary pr-4">
                  {faq.question}
                </span>
                <span className="text-2xl text-primary shrink-0 w-8 h-8 flex items-center justify-center">
                  {openIndex === i ? '−' : '+'}
                </span>
              </button>
              {openIndex === i && (
                <div className="mt-3 text-[16.3px] font-[380] tracking-[-0.32px] leading-[19.5px] text-primary/80">
                  <p>
                    Jood provides clinically proven weight-loss treatments including GLP-1 receptor agonists
                    like Mounjaro, Wegovy, and Saxenda. Our medical team creates personalized plans
                    based on your health profile and goals.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-10">
          <Link
            href="#get-started"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-[16.3px] font-[790] tracking-[-0.32px] uppercase rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
