'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const logoSrc = "https://www.figma.com/api/mcp/asset/78c1f8c0-627b-4721-9154-89e29ce30cdb";
const cartIconSrc = "https://www.figma.com/api/mcp/asset/1ae82000-7535-48c4-b31c-9fa8b825bb77";
const userIconSrc = "https://www.figma.com/api/mcp/asset/189160ec-9378-4e0c-a4fa-d74ffa69a451";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md py-3'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-[80px] flex items-center justify-between">
        {/* Logo */}
        <div className="h-[30px] w-[95px] relative">
          <Image
            src={logoSrc}
            alt="JOOD"
            fill
            className="object-contain"
          />
        </div>

        {/* Center Navigation */}
        <div className="hidden md:flex gap-[30px] absolute left-1/2 transform -translate-x-1/2">
          {['Home', 'Shop', 'FAQs', 'Reviews'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-white font-medium text-[16px] tracking-[0.6px] hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right Side - CTA + Icons */}
        <div className="flex items-center gap-[20px]">
          <button
            className="hidden md:flex bg-white/30 border border-white rounded-full px-[24px] py-[12px] text-white font-medium text-[14px] hover:bg-white/40 transition-colors"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Get started
          </button>

          {/* User Icon */}
          <div className="w-[32px] h-[32px] relative cursor-pointer hover:opacity-80">
            <Image
              src={userIconSrc}
              alt="User"
              fill
              className="object-contain"
            />
          </div>

          {/* Cart Icon */}
          <div className="w-[32px] h-[32px] relative cursor-pointer hover:opacity-80">
            <Image
              src={cartIconSrc}
              alt="Cart"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
