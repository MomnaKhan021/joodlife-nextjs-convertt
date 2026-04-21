"use client";

import Image from "next/image";
import Link from "next/link";

const JOOD_LINKS = ["Log in", "Treatments", "How it work", "Library", "Support"];
const TREATMENTS = ["Mounjaro", "Wegovy", "Saxenda"];
const POLICY = [
  "Terms & conditions",
  "Refund & Complaints Procedure",
  "Cookies policy",
];

const SOCIALS = [
  { icon: "/assets/figma/social-tiktok.svg", label: "TikTok" },
  { icon: "/assets/figma/social-facebook.svg", label: "Facebook" },
  { icon: "/assets/figma/social-instagram.svg", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-white px-5 pb-5 md:px-5">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="rounded-[20px] bg-[#142e2a] px-6 py-10 text-white md:px-10 md:py-10">
          <div className="flex flex-wrap items-start justify-between gap-8 md:gap-5">
            {/* Logo */}
            <div className="flex flex-col gap-4">
              <div className="relative h-[69px] w-[165px]">
                <Image
                  src="/assets/figma/footer-logo-2.png"
                  alt="Jood"
                  fill
                  sizes="165px"
                  className="object-contain object-left"
                />
              </div>
            </div>

            {/* Jood column */}
            <div className="flex flex-col gap-6">
              <h3 className="font-ui text-[16.3px] font-semibold text-white">
                Jood
              </h3>
              <nav>
                <ul className="flex flex-col gap-3">
                  {JOOD_LINKS.map((l) => (
                    <li key={l}>
                      <Link
                        href="#"
                        className="font-ui text-[16.3px] text-white/90"
                      >
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Treatments */}
            <div className="flex flex-col gap-6">
              <h3 className="font-ui text-[16.3px] font-semibold text-white">
                Treatments
              </h3>
              <nav>
                <ul className="flex flex-col gap-3">
                  {TREATMENTS.map((l) => (
                    <li key={l}>
                      <Link
                        href="#"
                        className="font-ui text-[16.3px] text-white/90"
                      >
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Policy */}
            <div className="flex flex-col gap-6">
              <h3 className="font-ui text-[16.3px] font-semibold text-white">
                Policy
              </h3>
              <nav>
                <ul className="flex flex-col gap-3">
                  {POLICY.map((l) => (
                    <li key={l}>
                      <Link
                        href="#"
                        className="font-ui text-[16.3px] text-white/90"
                      >
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Follow + Contact */}
            <div className="flex flex-col gap-6">
              <h3 className="font-ui text-[16.3px] font-semibold text-white">
                Follow
              </h3>
              <div className="flex items-center gap-2">
                {SOCIALS.map((s) => (
                  <Link
                    key={s.label}
                    href="#"
                    aria-label={s.label}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f9f2]"
                  >
                    <Image
                      src={s.icon}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact card */}
            <div className="flex flex-col gap-3 rounded-[10px] bg-[#f7f9f2] p-3 text-[#142e2a]">
              <h3 className="font-ui text-[22px] font-extrabold leading-[26px] text-[#142e2a] md:text-[25px]">
                Have a question?
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-[#142e2a]">
                    <span className="text-[12px] text-white">📞</span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-sans text-[14px] text-[#111]">
                      Phone
                    </span>
                    <span className="font-sans text-[14px] text-[#111]">
                      01494424435
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Image
                    src="/assets/figma/icon-chat.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6"
                    aria-hidden
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="font-ui text-[16.3px] font-semibold text-[#142e2a]">
                      Email
                    </span>
                    <span className="font-ui text-[16.3px] text-[#142e2a]">
                      Joodlife@info.com
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-[#142e2a]">
                    <span className="text-[10px] text-white">📍</span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-sans text-[14px] text-[#111]">
                      Address
                    </span>
                    <span className="font-sans text-[14px] text-[#111]">
                      8 Devonshire Pl, London W1G 6HP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3">
              <h3 className="font-ui text-[22px] font-extrabold leading-[26px] text-white md:text-[25px]">
                Sign Up For Our Newsletter
              </h3>
              <p className="font-ui text-[16.3px] text-white/90">
                Stay up to date on our news, education and offers
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex h-[58px] items-center gap-2 rounded-full bg-white/10 pl-4 pr-[10px]"
            >
              <input
                type="email"
                placeholder="Your email here"
                className="h-full flex-1 bg-transparent font-ui text-[16.3px] font-semibold text-white placeholder:text-white outline-none"
              />
              <button
                type="submit"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#d3dabe]"
                aria-label="Subscribe"
              >
                <Image
                  src="/assets/figma/newsletter-arrow.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                  aria-hidden
                />
              </button>
            </form>
          </div>

          {/* Copyright + payments */}
          <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-[587px] font-ui text-[14px] leading-[18px] text-white/80">
              © 2025 Jood. All rights reserved. Superintendent Pharmacist:
              Zahhaad Khalil (2228969) Powered by Jood Pharmacy, a
              GPhC-registered pharmacy (9012990) operating under Jood Ltd.
              Clinical, consultation and prescribing services are provided by
              UK-registered prescribers. All medicines are dispensed and
              delivered in accordance with GPhC and MHRA guidance. All Pharmacy
              operations are temporarily taking place at Weaverham Pharmacy
              (1029683).
            </p>
            <div className="flex items-center gap-3">
              <div className="relative h-[60px] w-[83px]">
                <Image
                  src="/assets/figma/footer-badge-1.png"
                  alt="Certification"
                  fill
                  sizes="83px"
                  className="object-contain"
                />
              </div>
              <div className="relative h-[50px] w-[124px]">
                <Image
                  src="/assets/figma/footer-badge-2.png"
                  alt="Certification"
                  fill
                  sizes="124px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
