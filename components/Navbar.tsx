'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const logoSrc = "https://s3-alpha-sig.figma.com/img/02d9/d065/63867a93c9fe7e670103e234bb40820e?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=fDhfLYujFVKyvKxk76CvpiaUkgw-scMf0H6zhh~Wr4IWlfbAgW-y2iyPUXs0rSej3eLI1F6qCv49J4MWhTahpf5nvzhGM1AspOGgsjRv9~J~CODRHZoJjlJnMxy0fGgXXbW-ITkl6ND0USvcx3AgSZal~OkSNGNimQrG7-xB8ZKH6XWTjtSg3RYBtEF-sKXBxnlaMVceA44E4ge9Na8P-je5HdltO0XlmSvHI1b4A3PWtKn9JbF4njK2VxwY6fTlOB21iacLNvzc9AzjrWSF~yzRyHDtyK4GVCrNuhY3zhP~x5KjDe9sVvtfiCrQPDQ5NYNkUI-XycDy4Tm47MD1WA__";
const cartIconSrc = "https://s3-alpha-sig.figma.com/img/103f/2b20/9e552ee965cb9a70885a92cb0ec3943b?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=XmIh-kLSldvNr2PMwAEjF5ercG0KSWt5coDNPo41HZweRK0F3CWGVZRj8nJGMpEvjlr2q1ECOQIxfxTJ36Hb076YSxKk47E7kgFNuoUo8zDb7o2samy-oSckUxy~aSiqvOsJJuW2xZGcPBazWIEgDFsX4uarJXgMDg2vRBS3UfoL60YMLdkjeEqMGlcnKRt11OtXG4fAg4K67LmXV19iPkTe8VwpZRiB9tPoNJ39JVFzMjXa-yPLmRakQKgp9LFYmPAV0X9y0GDVqlhSTYH~64lKS6Vwj1pyXbKp6XcX1Q1BAP0t1hqAgssHseV~1ueNsbQnEehT8-LUHmd7dps2HA__";
const userIconSrc = "https://s3-alpha-sig.figma.com/img/0e69/21d1/089954238dbfedffb0a75a61419b0b48?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=s-wsuxapbt~ZMxuMqr0HoEpWd3UGB8uoAhZTYvzTcDeVnq4Lfmbz4DBFO9KcdCfb3sP-PLL~uEBMOQsT6oNURoI7oIUik~4qVGdcP6gPoUOGAOvYrXqHXBk6wIT1QF4WC8JvTheCuBpt~PdyDzXPALsmwlS086oufwSS18M8tCXkR0E5lUx2zceube89cL975vH8Pm0Mkq3tmPbbzFttYtV6Ux5umJwoX2CeKI5nMp45Mi34uhofHiGUadWoZYfCG4USgKy9T0y3kIJ3A-xCYt5cW9RDrj6Jq7QF1MqwZdC-Pu4vdCIminagF1oY7Q8-VMNlJRbrCUlev7w~aXPtRQ__";

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
