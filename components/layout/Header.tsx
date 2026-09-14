"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import CartDrawer from "@/components/layout/CartDrawer";
import MegaMenu, { TREATMENTS } from "@/components/layout/MegaMenu";

type NavLink = {
  label: string;
  href: string;
  /** Opens the full "Our Treatments" mega menu instead of a plain link. */
  mega?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Treatments", href: "/shop", mega: true },
  { label: "FAQs", href: "/#faq" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Support", href: "/support" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  // Mobile drawer: which screen is showing — main menu or the treatments panel.
  const [mobileTreat, setMobileTreat] = useState(false);
  // Signed-in state, for the Log in / Account header button. Reads a readable
  // cookie for an instant first paint, then confirms with the session API.
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let alive = true;
    const m = document.cookie.match(/(?:^|; )jl_auth=([01])/);
    if (m) queueMicrotask(() => alive && setLoggedIn(m[1] === "1"));
    fetch("/api/account/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setLoggedIn(Boolean(d?.loggedIn));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileTreat(false);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-[#142e2a]/10 bg-white"
      onMouseLeave={() => setMegaOpen(false)}
    >
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
              link.mega ? (
                <li
                  key={link.label}
                  onMouseEnter={() => setMegaOpen(true)}
                >
                  <Link
                    href={link.href}
                    className="inline-flex h-20 items-center gap-1 px-3 font-ui text-[16px] font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                  >
                    {link.label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                      className={`mt-0.5 transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ) : (
                <li
                  key={link.label}
                  onMouseEnter={() => setMegaOpen(false)}
                >
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

        <div className="flex items-center">
          <AuthPill loggedIn={loggedIn} />
        </div>
      </div>

      {/* Desktop mega menu — full-width panel below the header bar */}
      <div
        onMouseEnter={() => setMegaOpen(true)}
        className={`absolute left-0 right-0 top-full z-50 hidden md:block ${
          megaOpen
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none -translate-y-1 opacity-0"
        } transition-all duration-200`}
      >
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-10">
          <div className="rounded-2xl border border-[#142e2a]/10 bg-white p-6 shadow-[0_24px_50px_-20px_rgba(20,46,42,0.35)]">
            <MegaMenu onNavigate={() => setMegaOpen(false)} />
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
          <AuthPill loggedIn={loggedIn} mobile />

          {/* Hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileTreat(false);
              setMobileOpen((v) => !v);
            }}
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
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Mobile Menu Drawer */}
      <nav
        aria-label="Mobile"
        aria-hidden={!mobileOpen}
        className={`md:hidden fixed inset-y-0 right-0 z-50 flex h-full w-[85%] max-w-sm flex-col overflow-hidden bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Shared top bar: logo + close */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#142e2a]/10">
          <Link
            href="/"
            aria-label="JoodLife home"
            className="flex items-center"
            onClick={closeMobile}
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
            onClick={closeMobile}
            className="grid h-6 w-6 place-items-center"
          >
            <span className="flex w-full flex-col items-center justify-center gap-0 relative">
              <span className="h-0.5 w-5 bg-[#142e2a] absolute rotate-45" />
              <span className="h-0.5 w-5 bg-[#142e2a] absolute -rotate-45" />
            </span>
          </button>
        </div>

        {/* Two-screen slider: main menu ↔ treatments panel */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className={`flex h-full w-[200%] transition-transform duration-300 ease-in-out ${
              mobileTreat ? "-translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* ── Screen 1: main menu ── */}
            <div className="flex h-full w-1/2 flex-col overflow-y-auto">
              <ul className="flex flex-col gap-1 px-4 py-4">
                {NAV_LINKS.map((link) =>
                  link.mega ? (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={() => setMobileTreat(true)}
                        className="flex w-full items-center justify-between py-3 font-ui text-base font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                      >
                        <span>{link.label}</span>
                        <svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden className="text-[#142e2a]/50">
                          <path d="M2 2l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={closeMobile}
                        className="block py-3 font-ui text-base font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
                <li>
                  <Link
                    href={loggedIn ? "/profile" : "/login"}
                    onClick={closeMobile}
                    className="block py-3 font-ui text-base font-medium text-[#142e2a] transition-colors hover:text-[#142e2a]/70"
                  >
                    {loggedIn ? "Account" : "Log in"}
                  </Link>
                </li>
              </ul>

              <div className="mt-auto px-4 pb-6">
                <Link
                  href="/consultation"
                  onClick={closeMobile}
                  className="btn-cta inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-base font-bold text-white hover:bg-[#142e2a]/90"
                >
                  Get started
                </Link>
              </div>
            </div>

            {/* ── Screen 2: Our Treatments ── */}
            <div className="flex h-full w-1/2 flex-col overflow-y-auto px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileTreat(false)}
                className="flex items-center gap-1.5 self-start py-1 font-ui text-[15px] font-medium text-[#142e2a]/70 transition-colors hover:text-[#142e2a]"
              >
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden>
                  <path d="M6.5 1.5l-5 5 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>
              <p className="mt-2 mb-3 font-display text-[24px] font-bold tracking-[-0.02em] text-[#142e2a]">
                Our Treatments
              </p>
              <ul className="flex flex-col gap-1">
                {TREATMENTS.map((t) => (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      onClick={closeMobile}
                      className="flex items-center gap-3 rounded-2xl py-2 transition-colors hover:bg-[#f7f9f2]"
                    >
                      <span className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-2xl">
                        <Image src={t.icon} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-ui text-[15px] font-semibold text-[#142e2a]">
                          {t.label}
                        </span>
                        <span className="block font-ui text-[13px] text-[#142e2a]/60">
                          {t.desc}
                        </span>
                      </span>
                      <svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden className="shrink-0 text-[#142e2a]/50">
                        <path d="M2 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/shop"
                onClick={closeMobile}
                className="btn-cta mt-auto inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#142e2a] font-ui text-[15px] font-semibold text-white hover:bg-[#0c2421]"
              >
                Explore Treatment
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Cart drawer (single instance shared across desktop + mobile) */}
      <CartDrawer />
    </header>
  );
}

/** Outlined pill in the header — "Log in" for guests, "Account" (→ profile)
 *  once signed in. Branded (Jood green), responsive: smaller on mobile. */
function AuthPill({ loggedIn, mobile = false }: { loggedIn: boolean; mobile?: boolean }) {
  return (
    <Link
      href={loggedIn ? "/profile" : "/login"}
      className={`btn-cta inline-flex items-center justify-center rounded-full border border-[#142e2a]/25 font-ui font-medium text-[#142e2a] transition-colors hover:border-[#142e2a] hover:bg-[#142e2a] hover:text-white ${
        mobile ? "h-9 px-4 text-[13.5px]" : "h-10 px-6 text-[15px]"
      }`}
    >
      {loggedIn ? "Account" : "Log in"}
    </Link>
  );
}
