import Image from "next/image";
import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

import SupportFaq from "./SupportFaq";

export const metadata = {
  title: "Support — JoodLife",
  description:
    "Get the support you need. Contact the Jood care team and browse answers to common questions about treatment, eligibility, delivery and ongoing clinical support.",
};

/** Quick-help highlights shown on the hero chat card. */
const HELP_POINTS = [
  {
    title: "Ongoing clinical support",
    body: "Access expert clinicians and medical advice.",
  },
  {
    title: "Pause or cancel any time",
    body: "You're always in control of your treatment.",
  },
  {
    title: "Free, discreet delivery",
    body: "No names, no logos, no delivery fee.",
  },
];

/** Real success-story portraits exported from the Figma design. */
const STORIES = [
  { src: "/assets/figma/support/story-1.png", alt: "Jood patient success story" },
  { src: "/assets/figma/support/story-2.png", alt: "Jood patient success story" },
  { src: "/assets/figma/support/story-3.png", alt: "Jood patient success story" },
  { src: "/assets/figma/support/story-4.png", alt: "Jood patient success story" },
];

function ChatBubbleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 3.5V16H5.5A1.5 1.5 0 0 1 4 14.5v-9z"
        stroke="#142e2a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SupportPage() {
  return (
    <>
      <AnnouncementBar />
      <Header />

      <main className="w-full bg-white">
        {/* ───── Hero ───── */}
        <section className="w-full bg-white">
          <div className="mx-auto w-full max-w-[1320px] px-6 pb-10 pt-12 md:px-10 md:pb-14 md:pt-16 lg:px-[60px]">
            <div className="mx-auto max-w-[720px] text-center">
              <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-[#142e2a] md:text-[56px]">
                Get the support{" "}
                <em className="font-serif font-normal italic">you need</em>
              </h1>
              <p className="mx-auto mt-4 max-w-[480px] font-ui text-[15px] leading-[24px] text-[#142e2a]/70 md:text-[16.3px]">
                Can&rsquo;t find what you&rsquo;re looking for? Get in touch and a
                member of our team will be happy to assist you.
              </p>
              <a
                href="https://wa.me/447756099075"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-[50px] items-center justify-center rounded-lg bg-[#142e2a] px-10 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
              >
                Get In Touch
              </a>
            </div>

            {/* Quick-help card + photo */}
            <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-[minmax(0,443px)_minmax(0,1fr)]">
              <div className="flex flex-col justify-center gap-4 rounded-3xl bg-[#f7f9f2] p-6 md:p-8">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5">
                  <ChatBubbleIcon />
                  <span className="font-ui text-[13px] font-semibold text-[#142e2a]">
                    How we support you
                  </span>
                </div>
                <ul className="flex flex-col gap-3">
                  {HELP_POINTS.map((p) => (
                    <li
                      key={p.title}
                      className="rounded-2xl bg-white px-4 py-3.5"
                    >
                      <p className="font-ui text-[15px] font-semibold text-[#142e2a]">
                        {p.title}
                      </p>
                      <p className="mt-0.5 font-ui text-[13.5px] leading-[20px] text-[#142e2a]/65">
                        {p.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative min-h-[280px] overflow-hidden rounded-3xl md:min-h-[438px]">
                <Image
                  src="/assets/figma/support/hero.png"
                  alt="A Jood patient checking their treatment updates on their phone"
                  fill
                  sizes="(max-width: 768px) 100vw, 857px"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ───── FAQ accordions ───── */}
        <SupportFaq />

        {/* ───── Success stories ───── */}
        <section
          aria-label="Success stories"
          className="w-full bg-white py-[30px] md:py-10"
        >
          <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10 lg:px-[60px]">
            <div className="mx-auto max-w-[640px] text-center">
              <h2 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[44px]">
                Thousands of success stories.{" "}
                <em className="font-serif font-normal italic">
                  Support at every step.
                </em>
              </h2>
              <p className="mx-auto mt-4 max-w-[540px] font-ui text-[15px] leading-[24px] text-[#142e2a]/70 md:text-[16.3px]">
                Our dedicated care team provides ongoing guidance, progress
                monitoring, and personalised adjustments to ensure every patient
                achieves lasting results.
              </p>
              <Link
                href="/consultation"
                className="mt-6 inline-flex h-[50px] items-center justify-center rounded-lg bg-[#142e2a] px-10 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
              >
                Get started
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 md:mt-14 md:grid-cols-4 md:gap-6">
              {STORIES.map((s) => (
                <div
                  key={s.src}
                  className="relative aspect-[340/569] overflow-hidden rounded-3xl"
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 320px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
