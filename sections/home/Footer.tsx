"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

const JOOD_LINKS = ["Log in", "Treatments", "How it work", "Library", "Support"];
const TREATMENTS = ["Mounjaro", "Wegovy", "Saxenda"];
const POLICY = [
  "Terms & conditions",
  "Refund & Complaints Procedure",
  "Cookies policy",
];

const SOCIALS = [
  { icon: "/assets/figma/social-tiktok.svg", label: "TikTok", href: "#" },
  { icon: "/assets/figma/social-facebook.svg", label: "Facebook", href: "#" },
  { icon: "/assets/figma/social-instagram.svg", label: "Instagram", href: "#" },
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

function FooterLinks({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((l) => (
        <li key={l}>
          <a
            href="#"
            className="font-ui text-[15px] leading-[22px] text-white/85 transition-colors hover:text-white md:text-[16px]"
          >
            {l}
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
  items: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 md:cursor-default md:py-0"
      >
        <h3 className="font-ui text-[16px] font-semibold leading-[22px] text-white md:text-[16.3px] md:leading-[20px]">
          {title}
        </h3>
        <span className="md:hidden">
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out md:!grid-rows-[1fr] md:!opacity-100 md:mt-6 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 md:pb-0">
            <FooterLinks items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialColumn() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 md:cursor-default md:py-0"
      >
        <h3 className="font-ui text-[16px] font-semibold leading-[22px] text-white md:text-[16.3px] md:leading-[20px]">
          Follow
        </h3>
        <span className="md:hidden">
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out md:!grid-rows-[1fr] md:!opacity-100 md:mt-6 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-3 pb-5 md:pb-0">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="transition-transform duration-200 hover:scale-105"
              >
                <Image
                  src={s.icon}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9"
                  aria-hidden
                />
              </a>
            ))}
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
    <footer className="w-full bg-white px-4 pb-5 md:px-5">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="rounded-[20px] bg-[#142e2a] text-white">
          <div className="flex flex-col gap-8 border-b border-white/10 px-6 py-10 md:flex-row md:items-start md:gap-10 md:px-10 md:py-12">
            <div className="flex-shrink-0">
              <Image
                src="/assets/figma/footer-logo-2.png"
                alt="Jood"
                width={130}
                height={50}
                className="h-[44px] w-auto md:h-[50px]"
                priority={false}
              />
            </div>

            <div className="flex flex-1 flex-col md:grid md:grid-cols-4 md:gap-10 md:pl-6">
              <AccordionColumn title="Jood" items={JOOD_LINKS} />
              <AccordionColumn title="Treatments" items={TREATMENTS} />
              <AccordionColumn title="Policy" items={POLICY} />
              <SocialColumn />
            </div>

            <div className="flex flex-col gap-3 rounded-[14px] bg-white/8 px-5 py-5 md:w-[260px]">
              <h3 className="font-ui text-[18px] font-extrabold leading-[24px] text-white md:text-[20px]">
                Have a question?
              </h3>
              <div className="flex items-start gap-2">
                <Image
                  src="/assets/figma/icon-chat.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="mt-0.5 h-5 w-5 brightness-0 invert"
                  aria-hidden
                />
                <div className="flex flex-col">
                  <span className="font-ui text-[14px] font-semibold leading-[20px] text-white">
                    Email
                  </span>
                  <a
                    href="mailto:Joodlife@info.com"
                    className="font-ui text-[14px] leading-[20px] text-white/85 transition-colors hover:text-white"
                  >
                    Joodlife@info.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 border-b border-white/10 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-10">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-ui text-[20px] font-extrabold leading-[26px] text-white md:text-[24px] md:leading-[30px]">
                Sign Up For Our Newsletter
              </h3>
              <p className="font-ui text-[14px] leading-[20px] text-white/80 md:text-[15.5px] md:leading-[22px]">
                Stay up to date on our news, education and offers
              </p>
            </div>
            <div className="flex flex-col gap-2 md:w-[520px]">
              <form
                onSubmit={handleSubscribe}
                className="flex h-[54px] w-full items-center gap-2 rounded-full bg-white/5 pl-5 pr-1.5 ring-1 ring-white/15 focus-within:ring-white/40 transition-shadow md:h-[58px]"
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
                  className="h-full flex-1 bg-transparent font-ui text-[14px] text-white placeholder:text-white/65 outline-none md:text-[16px]"
                />
                <button
                  type="submit"
                  className="grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-full bg-white transition-colors hover:bg-[#d3dabe] md:h-[46px] md:w-[46px]"
                  aria-label="Subscribe"
                >
                  <svg
                    width="16"
                    height="12"
                    viewBox="0 0 16 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path
                      d="M1 6h14m0 0L10 1m5 5l-5 5"
                      stroke="#142e2a"
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

          <div className="flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-8">
            <p className="max-w-[620px] font-ui text-[11.5px] leading-[17px] text-white/70 md:text-[12.5px] md:leading-[18px]">
              © 2025 Jood. All rights reserved. Superintendent Pharmacist:
              Zahhaad Khalil (2228969) Powered by Jood Pharmacy, a
              GPhC-registered pharmacy (9012990) operating under Jood Ltd.
              Clinical, consultation and prescribing services are provided by
              UK-registered prescribers. All medicines are dispensed and
              delivered in accordance with GPhC and MHRA guidance. All Pharmacy
              operations are temporarily taking place at Weaverham Pharmacy
              (1029683).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-[60px] w-[70px]">
                <Image
                  src="/assets/figma/footer-badge-1.png"
                  alt="LegitScript Certified"
                  fill
                  sizes="70px"
                  className="object-contain"
                />
              </div>
              <div className="relative h-[50px] w-[110px]">
                <Image
                  src="/assets/figma/footer-badge-2.png"
                  alt="Registered Pharmacy"
                  fill
                  sizes="110px"
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M10.8 6.4c0-.4-.1-.8-.2-1.2H7v2.3h2.1c-.1.6-.4 1.1-.9 1.4v1.1h1.4c.8-.7 1.2-1.8 1.2-3.6z"
                    fill="#000"
                  />
                </svg>
                <span className="font-ui text-[11px] font-semibold text-black">
                  Pay
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5">
                <span className="font-ui text-[11px] font-bold" style={{ color: "#4285F4" }}>G</span>
                <span className="font-ui text-[11px] font-bold" style={{ color: "#EA4335" }}>P</span>
                <span className="font-ui text-[11px] font-bold" style={{ color: "#FBBC04" }}>a</span>
                <span className="font-ui text-[11px] font-bold" style={{ color: "#34A853" }}>y</span>
              </div>
              <div className="rounded-md bg-white px-2.5 py-1.5">
                <span
                  className="font-ui text-[11px] font-bold italic"
                  style={{ color: "#635BFF" }}
                >
                  stripe
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
