"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import CartDrawer from "@/components/layout/CartDrawer";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "FAQs", href: "#faq" },
  { label: "Reviews", href: "#reviews" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <header className="w-full bg-white">
      {/* Desktop Header: 80px tall */}
      <div className="hidden md:flex mx-auto h-20 w-full max-w-[1440px] items-center justify-between px-10 lg:px-16 gap-8">
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
                  className="inline-flex h-20 items-center px-3 font-ui text-[16px] font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
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
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#142e2a] bg-white px-8 font-ui text-xs font-semibold uppercase tracking-tight text-[#142f2b] transition-colors hover:bg-[#142e2a] hover:text-white"
          >
            Get started
          </Link>
          <div className="flex items-center gap-[5px]">
            {/* Account — uses the icon-cart.svg artwork (Figma's account
               icon happens to live in this filename) */}
            <Link
              href="/profile"
              aria-label="Account"
              className="grid h-[41px] w-[36.9px] cursor-pointer place-items-center transition-opacity hover:opacity-70"
            >
              <Image
                src="/assets/icons/icon-cart.svg"
                alt=""
                width={26}
                height={28}
                className="h-7 w-auto"
                aria-hidden
              />
            </Link>
            {/* Cart — opens the slide-in drawer */}
            <button
              type="button"
              aria-label="Open cart"
              aria-expanded={cartOpen}
              onClick={() => setCartOpen(true)}
              className="grid h-[41px] w-[36.9px] cursor-pointer place-items-center transition-opacity hover:opacity-70"
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

      {/* Mobile Header: 56px tall */}
      <div className="md:hidden flex h-14 w-full items-center justify-between px-4">
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

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer — slides in from right, full height */}
      <nav
        aria-label="Mobile"
        aria-hidden={!mobileOpen}
        className={`md:hidden fixed inset-y-0 right-0 z-50 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#142e2a]/10">
          <Link
            href="/"
            aria-label="Wesmount home"
            className="flex items-center"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/assets/icons/logo-wesmount-mobile.svg"
              alt="Wesmount"
              width={77}
              height={24}
              className="h-6 w-auto"
            />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="grid h-6 w-6 place-items-center"
          >
            <span className="flex w-full flex-col items-center justify-center gap-0 relative">
              <span className="h-0.5 w-5 bg-[#142e2a] absolute rotate-45" />
              <span className="h-0.5 w-5 bg-[#142e2a] absolute -rotate-45" />
            </span>
          </button>
        </div>

        <ul className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-ui text-base font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="block py-3 font-ui text-base font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
            >
              Account
            </Link>
          </li>
        </ul>

        <div className="mt-auto px-4 pb-6">
          <Link
            href="#get-started"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-base font-bold text-white transition-colors hover:bg-[#142e2a]/90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Slide-in cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
