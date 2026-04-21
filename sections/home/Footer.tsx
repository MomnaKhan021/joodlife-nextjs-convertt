"use client";

import Image from "next/image";

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

function JoodLogo() {
  return (
    <svg
      width="156"
      height="64"
      viewBox="0 0 156 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Jood"
    >
      <text
        x="0"
        y="48"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontSize="48"
        fontWeight="700"
        letterSpacing="-0.02em"
        fill="white"
      >
        JOOD
      </text>
    </svg>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-ui text-[16.3px] font-semibold leading-[20px] text-white">
        {title}
      </h3>
      <nav>
        <ul className="flex flex-col gap-3">
          {items.map((l) => (
            <li key={l}>
              <a
                href="#"
                className="font-ui text-[16.3px] leading-[20px] text-white/85 transition hover:text-white"
              >
                {l}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-white px-5 pb-5">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="rounded-[20px] bg-[#142e2a] text-white">
          {/* Top: Logo + columns + Contact */}
          <div className="flex flex-col gap-10 border-b border-white/10 px-6 py-10 md:flex-row md:items-start md:justify-between md:gap-8 md:px-10 md:py-12">
            {/* Logo */}
            <div className="flex-shrink-0">
              <JoodLogo />
            </div>

            {/* Columns */}
            <div className="grid grid-cols-2 gap-8 md:flex md:flex-1 md:justify-between md:gap-8 md:pl-4">
              <FooterColumn title="Jood" items={JOOD_LINKS} />
              <FooterColumn title="Treatments" items={TREATMENTS} />
              <FooterColumn title="Policy" items={POLICY} />
              <div className="flex flex-col gap-6">
                <h3 className="font-ui text-[16.3px] font-semibold leading-[20px] text-white">
                  Follow
                </h3>
                <div className="flex items-center gap-3">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href="#"
                      aria-label={s.label}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                    >
                      <Image
                        src={s.icon}
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4 brightness-0 invert"
                        aria-hidden
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact card */}
            <div className="flex flex-col gap-3 rounded-[12px] bg-white/8 px-5 py-5 md:w-[260px]">
              <h3 className="font-ui text-[20px] font-extrabold leading-[24px] text-white md:text-[22px]">
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
                    className="font-ui text-[14px] leading-[20px] text-white/85 transition hover:text-white"
                  >
                    Joodlife@info.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Newsletter */}
          <div className="flex flex-col gap-6 border-b border-white/10 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-12 md:px-10 md:py-10">
            <div className="flex flex-col gap-2">
              <h3 className="font-ui text-[22px] font-extrabold leading-[26px] text-white md:text-[25px]">
                Sign Up For Our Newsletter
              </h3>
              <p className="font-ui text-[15px] leading-[20px] text-white/80 md:text-[16.3px]">
                Stay up to date on our news, education and offers
              </p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex h-[58px] w-full items-center gap-2 rounded-full bg-white/5 pl-5 pr-2 ring-1 ring-white/15 md:w-[520px]"
            >
              <input
                type="email"
                placeholder="Your email here"
                className="h-full flex-1 bg-transparent font-ui text-[15px] text-white placeholder:text-white/70 outline-none md:text-[16.3px]"
              />
              <button
                type="submit"
                className="grid h-[42px] w-[42px] place-items-center rounded-full bg-white transition hover:bg-[#d3dabe]"
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
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>

          {/* Bottom: Copyright + Certification badges */}
          <div className="flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-8">
            <p className="max-w-[620px] font-ui text-[12px] leading-[18px] text-white/75 md:text-[13px]">
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
              <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1">
                <span className="font-ui text-[12px] font-semibold text-black"></span>
                <span className="font-ui text-[12px] font-semibold text-black">Pay</span>
              </div>
              <div className="flex items-center gap-1 rounded-md bg-white px-2 py-1">
                <span className="font-ui text-[10px] font-bold" style={{color:'#4285f4'}}>G</span>
                <span className="font-ui text-[10px] font-bold" style={{color:'#ea4335'}}>P</span>
                <span className="font-ui text-[10px] font-bold" style={{color:'#34a853'}}>a</span>
                <span className="font-ui text-[10px] font-bold" style={{color:'#fbbc04'}}>y</span>
              </div>
              <div className="rounded-md bg-white px-2 py-1">
                <span
                  className="font-ui text-[12px] font-bold italic"
                  style={{ color: "#635bff" }}
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
