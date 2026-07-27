"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import PaymentBadges from "@/components/footer/PaymentBadges";

/**
 * Footer — Figma node 141:2887.
 *
 * 1440×592 wrapper, inner card 1400×572, bg #142e2a, radius 20.
 * Three stacked rows separated by hairline white dividers:
 *   1. Logo + 4 link columns + "Have a question?" card (cream)
 *   2. Sign-up-for-newsletter + email pill input
 *   3. Copyright text + payment / trust badges
 *
 * Mobile collapses each link column into an accordion.
 */

type FooterLink = { label: string; href: string; external?: boolean };

const JOOD_LINKS: FooterLink[] = [
  { label: "Log in", href: "/login" },
  { label: "Treatments", href: "/shop" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Library", href: "/blogs" },
  { label: "Support", href: "/support" },
];
const TREATMENTS: FooterLink[] = [
  { label: "Mounjaro", href: "/weight-loss" },
  { label: "Wegovy", href: "/weight-loss" },
  { label: "Wegovy Pills", href: "/wegovy-pills" },
];
const POLICY: FooterLink[] = [
  { label: "Terms & conditions", href: "https://joodlife.com/policies/terms-of-service", external: true },
  { label: "Refund & Complaints Procedure", href: "https://joodlife.com/policies/refund-policy", external: true },
  { label: "Cookies policy", href: "https://joodlife.com/policies/privacy-policy", external: true },
];

const STORAGE_KEY = "jood:newsletter-subscribers";

function saveSubscriber(email: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: { email: string; ts: string }[] = raw ? JSON.parse(raw) : [];
    if (!list.find((e) => e.email.toLowerCase() === email.toLowerCase())) {
      list.push({ email, ts: new Date().toISOString() });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // swallow — localStorage may be unavailable
  }
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0 transition-transform duration-300 ease-out"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FooterLinks({ items }: { items: FooterLink[] }) {
  return (
    <ul className="flex flex-col gap-3 md:gap-[14px]">
      {items.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-block font-ui text-[15px] leading-[20px] tracking-[-0.02em] text-white/85 transition-colors duration-200 hover:text-white md:text-[16.3px]"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function AccordionColumn({
  title,
  items,
}: {
  title: string;
  items: FooterLink[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 lg:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 lg:cursor-default lg:py-0"
      >
        <h3 className="font-ui text-[16px] font-semibold leading-[22px] text-white lg:text-[16.3px] lg:leading-[20px]">
          {title}
        </h3>
        <span className="lg:hidden">
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out lg:!grid-rows-[1fr] lg:!opacity-100 lg:mt-5 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 lg:pb-0">
            <FooterLinks items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Social icon — 35×35 cream-coloured circle with the dark-green
 * brand mark inside. Hover brightens the background (no transform,
 * which previously glitched/clipped inside the accordion wrapper).
 */
function SocialButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-[35px] w-[35px] cursor-pointer items-center justify-center rounded-full bg-[#f7f9f2] text-[#142e2a] transition-colors duration-200 ease-out hover:bg-white"
    >
      <span className="block h-[15px] w-[15px]">{children}</span>
    </a>
  );
}

function SocialColumn() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 lg:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 lg:cursor-default lg:py-0"
      >
        <h3 className="font-ui text-[16px] font-semibold leading-[22px] text-white lg:text-[16.3px] lg:leading-[20px]">
          Follow
        </h3>
        <span className="lg:hidden">
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out lg:!grid-rows-[1fr] lg:!opacity-100 lg:mt-5 lg:overflow-visible ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden lg:overflow-visible">
          {/* py on desktop gives the hover lift + shadow room so icons
              aren't clipped by the accordion wrappers. */}
          <div className="flex items-center gap-3 pb-5 lg:pb-0 lg:py-1.5">
            <SocialButton href="https://www.tiktok.com/@myjoodlife" label="TikTok">
              <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4 0H8.6v10.7c0 1.3-1 2.3-2.3 2.3a2.3 2.3 0 0 1-2.3-2.3A2.3 2.3 0 0 1 6.3 8.4V5.6A5.1 5.1 0 0 0 1.2 10.7 5.1 5.1 0 0 0 6.3 15.8a5.1 5.1 0 0 0 5.1-5.1V5.3c.9.6 2 1 3.2 1V3.5a3.6 3.6 0 0 1-3.2-3.5z" />
              </svg>
            </SocialButton>
            <SocialButton href="https://www.facebook.com/myjoodlife/" label="Facebook">
              <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 8a8 8 0 1 0-9.25 7.9V10.3H4.72V8h2.03V6.24c0-2 1.2-3.1 3-3.1.87 0 1.78.15 1.78.15v1.96h-1c-.99 0-1.3.61-1.3 1.25V8h2.2l-.35 2.3H9.23v5.6A8 8 0 0 0 16 8z" />
              </svg>
            </SocialButton>
            <SocialButton href="https://www.instagram.com/myjoodlife?igsh=eWFnOXl0ZzVja2Vh&utm_source=qr" label="Instagram">
              <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1.4c2.13 0 2.39 0 3.23.05.78.04 1.2.17 1.49.28.37.14.64.32.92.6.28.27.46.54.6.91.11.29.24.71.28 1.5.04.84.05 1.1.05 3.22 0 2.14 0 2.39-.05 3.23-.04.78-.17 1.2-.28 1.49-.14.37-.32.64-.6.92a2.48 2.48 0 0 1-.92.6c-.29.11-.71.24-1.49.28-.84.04-1.1.05-3.23.05-2.14 0-2.39 0-3.23-.05-.78-.04-1.2-.17-1.49-.28-.37-.14-.64-.32-.92-.6a2.48 2.48 0 0 1-.6-.92c-.11-.29-.24-.71-.28-1.49C1.4 10.4 1.4 10.13 1.4 8c0-2.14 0-2.39.05-3.23.04-.78.17-1.2.28-1.49.14-.37.32-.64.6-.92.27-.28.54-.46.91-.6.29-.11.71-.24 1.5-.28C5.6 1.4 5.86 1.4 8 1.4M8 0C5.83 0 5.55 0 4.7.05c-.85.04-1.43.17-1.94.37-.53.2-.97.48-1.42.92-.44.45-.72.9-.92 1.42-.2.51-.33 1.09-.37 1.94C0 5.55 0 5.83 0 8c0 2.17 0 2.45.05 3.3.04.85.17 1.43.37 1.94.2.53.48.97.92 1.42.45.44.9.72 1.42.92.51.2 1.09.33 1.94.37C5.55 16 5.83 16 8 16c2.17 0 2.45 0 3.3-.05.85-.04 1.43-.17 1.94-.37.53-.2.97-.48 1.42-.92.44-.45.72-.9.92-1.42.2-.51.33-1.09.37-1.94.05-.85.05-1.13.05-3.3 0-2.17 0-2.45-.05-3.3-.04-.85-.17-1.43-.37-1.94a3.88 3.88 0 0 0-.92-1.42 3.88 3.88 0 0 0-1.42-.92c-.51-.2-1.09-.33-1.94-.37C10.45 0 10.17 0 8 0zM8 3.9a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2zm0 6.77a2.67 2.67 0 1 1 0-5.34 2.67 2.67 0 0 1 0 5.34zm5.22-6.93a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0z" />
              </svg>
            </SocialButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const year = new Date().getFullYear();

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isValid) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    saveSubscriber(value);
    setStatus("ok");
    setMessage("Thanks for subscribing!");
    setEmail("");
  };

  return (
    <footer className="w-full bg-[#142e2a] text-white">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-[60px]">
        <div>
          {/* ───── ROW 1 — logo + columns + Have-a-question card ───── */}
          <div className="flex flex-col gap-8 py-10 lg:flex-row lg:items-start lg:gap-10 lg:py-[60px]">
            <div className="flex-shrink-0">
              <Image
                src="/assets/figma/footer-logo-2.png"
                alt="Jood"
                width={165}
                height={69}
                quality={95}
                className="h-[50px] w-auto lg:h-[69px]"
                priority={false}
              />
            </div>

            <div className="flex flex-1 flex-col lg:grid lg:grid-cols-4 lg:gap-8 lg:pl-6 lg:gap-10">
              <AccordionColumn title="Jood" items={JOOD_LINKS} />
              <AccordionColumn title="Treatments" items={TREATMENTS} />
              <AccordionColumn title="Policy" items={POLICY} />
              <SocialColumn />
            </div>

            {/* Have-a-question card — cream bg per Figma */}
            <div className="flex flex-col gap-3 rounded-[10px] bg-[#f7f9f2] px-5 py-4 md:w-[228px]">
              <h3 className="font-display text-[20px] font-semibold leading-[26px] tracking-[-0.01em] text-[#142e2a] md:text-[25px]">
                Have a question?
              </h3>
              <div className="flex items-start gap-2">
                <Image src="/assets/figma/icon-chat.svg" alt="" width={20} height={20} className="mt-0.5 h-5 w-5" aria-hidden />
                <div className="flex flex-col">
                  <span className="font-ui text-[14px] font-semibold leading-[20px] text-[#142e2a]">
                    WhatsApp
                  </span>
                  <a
                    href="https://wa.me/447756099075"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-ui text-[14px] leading-[20px] text-[#142e2a]/80 transition-colors duration-200 hover:text-[#142e2a]"
                  >
                    07756 099075
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Image src="/assets/figma/icon-chat.svg" alt="" width={20} height={20} className="mt-0.5 h-5 w-5" aria-hidden />
                <div className="flex flex-col">
                  <span className="font-ui text-[14px] font-semibold leading-[20px] text-[#142e2a]">
                    Email
                  </span>
                  <a
                    href="mailto:support@joodlife.com"
                    className="font-ui text-[14px] leading-[20px] text-[#142e2a]/80 transition-colors duration-200 hover:text-[#142e2a]"
                  >
                    support@joodlife.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ───── ROW 2 — newsletter ───── */}
          <div className="border-t border-white/10 py-8 md:py-10 lg:py-[40px]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-10">
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-[22px] font-semibold leading-[28px] tracking-[-0.01em] text-white md:text-[28px] md:leading-[34px]">
                  Sign Up For Our Newsletter
                </h3>
                <p className="font-ui text-[14px] leading-[20px] tracking-[-0.02em] text-white/70 md:text-[16.3px] md:leading-[20px]">
                  Stay up to date on our news, education and offers
                </p>
              </div>

              <div className="flex flex-col gap-2 md:w-[659px]">
                <form
                  onSubmit={handleSubscribe}
                  className="group flex h-[54px] w-full items-center gap-2 rounded-full border border-white/60 bg-transparent pl-6 pr-1.5 transition-colors duration-200 focus-within:border-white md:h-[58px]"
                  aria-label="Subscribe to newsletter"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") setStatus("idle");
                    }}
                    placeholder="Your email here"
                    aria-label="Your email"
                    className="h-full flex-1 bg-transparent font-ui text-[14px] tracking-[-0.02em] text-white placeholder:text-white/70 outline-none md:text-[16.3px]"
                  />
                  <button
                    type="submit"
                    className="grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-full bg-[#d3dabe] text-[#142e2a] transition-[transform,background-color] duration-200 hover:-translate-x-0.5 hover:bg-white md:h-[44px] md:w-[44px]"
                    aria-label="Subscribe"
                  >
                    <svg
                      width="18"
                      height="14"
                      viewBox="0 0 18 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        d="M1 7h15m0 0l-5-5m5 5l-5 5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
                {status !== "idle" && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`px-2 font-ui text-[13px] ${
                      status === "ok" ? "text-[#b5e6b5]" : "text-[#fca5a5]"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ───── ROW 3 — copyright + payment badges ───── */}
          <div className="flex flex-col gap-6 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:py-8">
            <p className="max-w-[620px] font-ui text-[12px] leading-[18px] tracking-[-0.01em] text-white/65 md:text-[13px] md:leading-[18px]">
              © {year} Jood. All rights reserved. Superintendent Pharmacist:
              Zahhaad Khalil (2228969) Powered by Jood Pharmacy, a
              GPhC-registered pharmacy (9012990) operating under Jood Ltd.
              Clinical, consultation and prescribing services are provided by
              UK-registered prescribers. All medicines are dispensed and
              delivered in accordance with GPhC and MHRA guidance.
            </p>
            <PaymentBadges />
          </div>
        </div>
      </div>
    </footer>
  );
}
