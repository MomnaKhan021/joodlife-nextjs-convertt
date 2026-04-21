"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "#shop" },
  { label: "FAQs", href: "#faq" },
  { label: "Reviews", href: "#reviews" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-white">
      {/* Desktop Header: 80px tall */}
      <div className="hidden md:flex mx-auto h-20 w-full max-w-[1440px] items-center justify-between px-10 lg:px-16">
        <Link href="/" aria-label="Wesmount home" className="flex items-center">
          <Image
            src="/assets/icons/logo-wesmount.svg"
            alt="Wesmount"
            width={95}
            height={30}
            priority
            className="h-[30px] w-auto"
          />
        </Link>

        <nav aria-label="Primary" className="flex items-center">
          <ul className="flex items-center">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="inline-flex h-[44.8px] items-center px-3 font-ui text-[16px] font-medium leading-[12px] text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="#get-started"
            className="inline-flex h-[44px] items-center justify-center rounded-lg border border-[#142e2a] bg-white px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.14em] text-[#142f2b] transition hover:bg-[#142e2a] hover:text-white"
          >
            Get started
          </Link>
          <div className="flex items-center gap-[5px]">
            <button
              aria-label="Cart"
              type="button"
              className="grid h-[41px] w-[36.9px] place-items-center"
            >
              <Image
                src="/assets/icons/icon-cart.svg"
                alt=""
                width={26}
                height={28}
                className="h-7 w-auto"
                aria-hidden
              />
            </button>
            <button
              aria-label="Account"
              type="button"
              className="grid h-[41px] w-[36.9px] place-items-center"
            >
              <Image
                src="/assets/icons/icon-user.svg"
                alt=""
                width={25}
                height={30}
                className="h-[30px] w-auto"
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header: 50px tall */}
      <div className="md:hidden flex h-[50px] w-full items-center justify-between px-4">
        <Link href="/" aria-label="Wesmount home" className="flex items-center">
          <Image
            src="/assets/icons/logo-wesmount-mobile.svg"
            alt="Wesmount"
            width={77}
            height={24}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="grid h-6 w-[21px] place-items-center"
        >
          <span className="flex w-full flex-col items-end gap-[5px]">
            <span className="h-[2.6px] w-full bg-[#142e2a]" />
            <span className="h-[2.6px] w-full bg-[#142e2a]" />
            <span className="h-[2.6px] w-[62%] bg-[#142e2a]" />
          </span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile"
          className="md:hidden border-t border-[#142e2a]/10 bg-white px-4 py-3"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 font-ui text-[16px] font-medium text-[#142e2a]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-3">
              <Link
                href="#get-started"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] px-6 font-ui text-[16.3px] font-extrabold text-white"
              >
                Get started
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
