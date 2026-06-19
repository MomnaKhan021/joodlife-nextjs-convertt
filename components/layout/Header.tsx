"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import CartDrawer from "@/components/layout/CartDrawer";
import { useCart } from "@/components/cart/CartContext";

type NavLink = {
  label: string;
  href: string;
  dropdown?: { label: string; href: string }[];
};

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  {
    label: "Treatment",
    href: "/weight-loss",
    dropdown: [
      { label: "Weight loss", href: "/weight-loss" },
      { label: "Erectile dysfunction", href: "/erectile-dysfunction" },
      { label: "Period delay", href: "/period-delay" },
    ],
  },
  { label: "FAQs", href: "/#faq" },
  { label: "Reviews", href: "/#reviews" },
];

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.4" stroke="#142e2a" strokeWidth="1.7" />
      <path
        d="M5.5 19.5c0-3.3 2.9-5.8 6.5-5.8s6.5 2.5 6.5 5.8"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 7h12l1 13H5L6 7z"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V6.5a3 3 0 0 1 6 0V9"
        stroke="#142e2a"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="w-full bg-white">
      {/* Desktop Header: 80px tall */}
      <div className="hidden md:flex mx-auto h-20 w-full max-w-[1440px] items-center justify-between px-10 lg:px-16 gap-8">
        <Link href="/" aria-label="JoodLife home" className="flex items-center">
          <Image
            src="/assets/icons/logo-wesmount.svg"
            alt="JoodLife"
            width={95}
            height={30}
            priority
            className="h-[30px] w-auto"
          />
        </Link>

        <nav aria-label="Primary" className="flex items-center">
          <ul className="flex items-center gap-2">
            {NAV_LINKS.map((link) =>
              link.dropdown ? (
                <li key={link.label} className="group/nav relative">
                  <Link
                    href={link.href}
                    className="inline-flex h-20 items-center gap-1 px-3 font-ui text-[16px] font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                  >
                    {link.label}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="mt-0.5">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <div className="invisible absolute left-1/2 top-[68px] z-50 w-56 -translate-x-1/2 translate-y-1 rounded-xl border border-[#142e2a]/10 bg-white p-2 opacity-0 shadow-[0_12px_30px_-10px_rgba(20,46,42,0.25)] transition-all duration-200 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
                    {link.dropdown.map((d) => (
                      <Link
                        key={d.href}
                        href={d.href}
                        className="block rounded-lg px-3 py-2.5 font-ui text-[15px] font-medium text-[#142e2a] transition-colors hover:bg-[#f7f9f2]"
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                </li>
              ) : (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-flex h-20 items-center px-3 font-ui text-[16px] font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                  >
                    {link.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {/* Account */}
          <Link
            href="/profile"
            aria-label="Account"
            className="grid h-10 w-10 cursor-pointer place-items-center transition-opacity hover:opacity-70"
          >
            <PersonIcon />
          </Link>
          {/* Cart trigger */}
          <CartButton onClick={openDrawer} count={itemCount} />
        </div>
      </div>

      {/* Mobile Header: 56px tall */}
      <div className="md:hidden flex h-14 w-full items-center justify-between px-4">
        <Link href="/" aria-label="JoodLife home" className="flex items-center">
          <Image
            src="/assets/icons/logo-wesmount-mobile.svg"
            alt="JoodLife"
            width={77}
            height={24}
            priority
            className="h-6 w-auto"
          />
        </Link>

        <div className="flex items-center gap-1.5">
          {/* Cart trigger (mobile) */}
          <CartButton onClick={openDrawer} count={itemCount} />

          {/* Hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center"
          >
            <span className="flex w-[21px] flex-col items-end gap-[5px]">
              <span className="h-[2.6px] w-full bg-[#142e2a]" />
              <span className="h-[2.6px] w-full bg-[#142e2a]" />
              <span className="h-[2.6px] w-[62%] bg-[#142e2a]" />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-in-out ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer */}
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
            aria-label="JoodLife home"
            className="flex items-center"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/assets/icons/logo-wesmount-mobile.svg"
              alt="JoodLife"
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
              {link.dropdown ? (
                <ul className="mb-1 ml-3 flex flex-col border-l border-[#142e2a]/10 pl-3">
                  {link.dropdown.map((d) => (
                    <li key={d.href}>
                      <Link
                        href={d.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2 font-ui text-[15px] text-[#142e2a]/80 transition-colors hover:text-[#142e2a]"
                      >
                        {d.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
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
          <li>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openDrawer();
              }}
              className="flex w-full items-center justify-between py-3 font-ui text-base font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
            >
              <span>Cart</span>
              <span className="rounded-full bg-[#142e2a] px-2 py-0.5 font-ui text-[11px] font-semibold text-white">
                {itemCount}
              </span>
            </button>
          </li>
        </ul>

        <div className="mt-auto px-4 pb-6">
          <Link
            href="/consultation"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-base font-bold text-white transition-colors hover:bg-[#142e2a]/90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Cart drawer (single instance shared across desktop + mobile) */}
      <CartDrawer />
    </header>
  );
}

function CartButton({
  onClick,
  count,
}: {
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-label="Open cart"
      onClick={onClick}
      className="relative grid h-10 w-10 cursor-pointer place-items-center transition-opacity hover:opacity-70"
    >
      <BagIcon />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#142e2a] px-1 font-ui text-[10px] font-semibold leading-[18px] text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
