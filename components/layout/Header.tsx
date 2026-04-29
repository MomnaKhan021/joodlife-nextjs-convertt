"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import CartDrawer from "@/components/layout/CartDrawer";
import { useCart } from "@/components/cart/CartContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "FAQs", href: "#faq" },
  { label: "Reviews", href: "#reviews" },
];

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
            href="/consultation"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#142e2a] bg-white px-8 font-ui text-xs font-semibold uppercase tracking-tight text-[#142f2b] transition-colors hover:bg-[#142e2a] hover:text-white"
          >
            Get started
          </Link>
          <div className="flex items-center gap-[5px]">
            {/* Account */}
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
            {/* Cart trigger */}
            <CartButton onClick={openDrawer} count={itemCount} />
          </div>
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

        <div className="flex items-center gap-2">
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
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M6 6h15l-1.5 9h-12L4 3H2"
          stroke="#142e2a"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1.5" stroke="#142e2a" strokeWidth="1.7" />
        <circle cx="18" cy="20" r="1.5" stroke="#142e2a" strokeWidth="1.7" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-[#142e2a] px-1 font-ui text-[10px] font-semibold leading-[18px] text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
