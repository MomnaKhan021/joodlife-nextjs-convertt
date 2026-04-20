'use client';

import { useState } from 'react';
import Image from 'next/image';

const logoSrc = "https://www.figma.com/api/mcp/asset/78c1f8c0-627b-4721-9154-89e29ce30cdb";

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  const footerLinks = {
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Product: ['How It Works', 'Pricing', 'FAQs', 'Contact'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
    Connect: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn'],
  };

  return (
    <footer className="w-full bg-primary text-white py-[80px] px-[80px]">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-[60px] mb-[80px]">
          <div className="flex flex-col gap-[20px]">
            <div className="h-[40px] w-[120px] relative">
              <Image
                src={logoSrc}
                alt="JOOD"
                fill
                className="object-contain brightness-0 invert"
              />
            </div>
            <p
              className="text-white/70 text-[14px] leading-[1.6]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Your personalized weight loss journey starts here.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="font-semibold text-[14px] mb-[16px] uppercase tracking-[0.5px]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                {category}
              </h4>
              <ul className="flex flex-col gap-[12px]">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/70 hover:text-white text-[14px] transition-colors"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white/10 rounded-[12px] p-[40px] mb-[60px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] items-center">
            <div>
              <h3
                className="text-white text-[24px] font-semibold mb-[12px]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Sign Up For Our Newsletter
              </h3>
              <p
                className="text-white/70 text-[16px]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Get updates about weight loss tips, new treatments, and special offers.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="flex gap-[12px]">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 px-[16px] py-[12px] rounded-[8px] bg-white text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sage"
                style={{ fontFamily: 'var(--font-outfit)' }}
              />
              <button
                type="submit"
                className="bg-sage rounded-[8px] px-[24px] py-[12px] text-white font-semibold hover:bg-sage/90 transition-colors whitespace-nowrap"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/20 pt-[40px] flex flex-col md:flex-row justify-between items-center gap-[20px]">
          <p
            className="text-white/70 text-[14px]"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            © 2025 JoodLife. All rights reserved.
          </p>

          <div className="flex items-center gap-[20px]">
            <span className="text-white/70 text-[14px]">We accept:</span>
            <div className="flex gap-[12px]">
              {['💳', '🏦', '💰'].map((icon, idx) => (
                <div key={idx} className="text-[20px]">
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
