'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Top announcement bar */}
      <div className="bg-primary text-white py-2.5">
        <div className="max-w-[1320px] mx-auto px-5 flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
            <circle cx="9" cy="9" r="8" stroke="white" strokeWidth="1.5" />
            <path d="M9 5v4l3 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-[13px] font-normal tracking-[-0.32px] leading-[17px] font-[family-name:var(--font-outfit)]">
            Limited-Time Offer: Buy 1 Month, Get 1 Month FREE!
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-[1320px] mx-auto px-5 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image src="/icons/jood-logo.svg" alt="JOOD" width={95} height={30} priority />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-0">
          {['Home', 'Shop', 'FAQs', 'Reviews'].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-3 py-2.5 text-[16px] font-[570] tracking-[-0.32px] leading-[19px] text-primary hover:opacity-70 transition-opacity"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            href="#get-started"
            className="hidden md:inline-flex items-center justify-center px-6 py-3.5 text-[16.3px] font-[790] tracking-[-0.32px] uppercase border-[1.5px] border-primary rounded-lg hover:bg-primary hover:text-white transition-all"
          >
            Get started
          </Link>
          <div className="flex items-center gap-2">
            <button aria-label="Account" className="p-1">
              <Image src="/icons/header-user.svg" alt="" width={21} height={25} />
            </button>
            <button aria-label="Cart" className="p-1">
              <Image src="/icons/header-cart.svg" alt="" width={21} height={23} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
