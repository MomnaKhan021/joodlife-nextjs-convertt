import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import UspBar from "@/components/wegovy/UspBar";
import WegovyFaq from "@/components/wegovy/WegovyFaq";

import Hero from "@/components/foundayo/Hero";
import WhatIs from "@/components/foundayo/WhatIs";
import Comparison from "@/components/foundayo/Comparison";
import HowItWorks from "@/components/foundayo/HowItWorks";
import Reviews from "@/components/foundayo/Reviews";
import RealResults from "@/components/foundayo/RealResults";
import Dosing from "@/components/foundayo/Dosing";
import WhyChoose from "@/components/foundayo/WhyChoose";
import FinalCta from "@/components/foundayo/FinalCta";
import { FOUNDAYO } from "@/lib/foundayoContent";

export const metadata: Metadata = {
  title: "Foundayo Pills in the UK — Once-daily oral orforglipron | JoodLife",
  description:
    "UK-first Foundayo pills: a once-daily GLP-1 tablet with clinician-led support. No needles, no fasting, no fridge. 12.4% average weight loss at 72 weeks. Start your 2-minute clinical intake.",
  alternates: { canonical: "/foundayo" },
};

/**
 * /foundayo — landing page for the Foundayo (orforglipron) tablet, built to the
 * "Foundayo Pill - Next Js" Figma (desktop frame 1:1505 + mobile frame).
 * Reuses the global Header, the trust marquee, the shared reviews slider, the
 * FAQ accordion and the site Footer; everything else lives in components/foundayo.
 */
export const dynamic = "force-dynamic";

export default function FoundayoPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <div className="w-full bg-[#142e2a]">
        <p className="mx-auto flex w-full max-w-[1440px] items-center justify-center gap-2 px-6 py-2 text-center font-ui text-[12.5px] font-medium leading-[17px] tracking-[-0.01em] text-white md:px-10 lg:px-[60px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0"><circle cx="12" cy="12" r="9" stroke="#b4ff9f" strokeWidth="1.8" /><path d="M12 7.5V12l3 2" stroke="#b4ff9f" strokeWidth="1.8" strokeLinecap="round" /></svg>
          <span className="font-semibold text-[#b4ff9f]">{FOUNDAYO.announcement.badge}</span> {FOUNDAYO.announcement.text}
        </p>
      </div>
      <Header />
      <Hero />
      <UspBar content={{ items: FOUNDAYO.usp }} />
      <WhatIs />
      <Comparison />
      <HowItWorks />
      <Reviews />
      <RealResults />
      <Dosing />
      <WhyChoose />
      <WegovyFaq content={FOUNDAYO.faq} />
      <FinalCta />
      <Footer />
    </main>
  );
}
