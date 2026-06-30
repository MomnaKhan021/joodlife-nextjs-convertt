import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

import Hero from "@/components/wegovy/Hero";
import UspBar from "@/components/wegovy/UspBar";
import WhatIsPill from "@/components/wegovy/WhatIsPill";
import Comparison from "@/components/wegovy/Comparison";
import Reviews from "@/components/wegovy/Reviews";
import HowItWorks from "@/components/wegovy/HowItWorks";
import RealResults from "@/components/wegovy/RealResults";
import Dosing from "@/components/wegovy/Dosing";
import WhyChoose from "@/components/wegovy/WhyChoose";
import WegovyFaq from "@/components/wegovy/WegovyFaq";
import FinalCta from "@/components/wegovy/FinalCta";

export const metadata: Metadata = {
  title: "Wegovy® Pills in the UK — Once-daily oral semaglutide | JoodLife",
  description:
    "UK-first Wegovy® pills: once-daily oral semaglutide with clinician-led support. ~14% average weight loss at 64 weeks. No needles. Start your 2-minute clinical intake.",
  alternates: { canonical: "/wegovy-pills" },
};

/**
 * /wegovy-pills — ad landing page for the new Wegovy oral pill, rebuilt
 * pixel-for-pixel from the Figma "Ads Page" design. Reuses the global
 * Header, the shared Reviews carousel and the site Footer; every other
 * section is a bespoke component under components/wegovy/.
 */
export default function WegovyPillsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Announcement bar — sits above the header, per Figma */}
      <div className="w-full bg-[#142e2a]">
        <p className="mx-auto w-full max-w-[1440px] px-6 py-2 text-center font-ui text-[12px] font-medium tracking-[0.01em] text-white/90 md:px-10 lg:px-16">
          New Wegovy® Pills treatment in the UK
        </p>
      </div>
      <Header />
      <Hero />
      <UspBar />
      <WhatIsPill />
      <Comparison />
      <HowItWorks />
      <Reviews />
      <RealResults />
      <Dosing />
      <WhyChoose />
      <WegovyFaq />
      <FinalCta />
      <Footer />
    </main>
  );
}
