import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import { getWegovyContent } from "@/lib/wegovyContent";
import { styleProps } from "@/lib/sectionStyle";
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
import { textStyleProps } from "@/lib/textStyle";

export const metadata: Metadata = {
  title: "Wegovy Pills in the UK — Once-daily oral semaglutide | JoodLife",
  description:
    "UK-first Wegovy pills: once-daily oral semaglutide with clinician-led support. ~14% average weight loss at 64 weeks. No needles. Start your 2-minute clinical intake.",
  alternates: { canonical: "/wegovy-pills" },
};

/**
 * /wegovy-pills — ad landing page for the new Wegovy oral pill, rebuilt
 * pixel-for-pixel from the Figma "Ads Page" design. Reuses the global
 * Header, the shared Reviews carousel and the site Footer; every other
 * section is a bespoke component under components/wegovy/.
 */
export const dynamic = "force-dynamic";

export default async function WegovyPillsPage() {
  const c = await getWegovyContent();

  return (
    <main className="flex min-h-screen flex-col bg-white">
      {/* Announcement bar — sits above the header, per Figma */}
      <div
        {...styleProps(c.styles.announcement)}
        className="w-full bg-[#142e2a]"
      >
        <p
          {...textStyleProps(c.textStyles["announcement.text"])}
          className="mx-auto w-full max-w-[1440px] px-6 py-2 text-center font-ui text-[13px] font-semibold leading-[16.9px] tracking-[-0.02em] text-white md:px-10 lg:px-[60px]"
        >
          {c.announcement.text}
        </p>
      </div>
      <Header />
      <Hero content={c.hero} style={c.styles.hero} text={c.textStyles} />
      <UspBar content={c.uspBar} style={c.styles.uspBar} />
      <WhatIsPill content={c.whatIsPill} style={c.styles.whatIsPill} text={c.textStyles} />
      <Comparison content={c.comparison} style={c.styles.comparison} text={c.textStyles} />
      <HowItWorks content={c.howItWorks} style={c.styles.howItWorks} text={c.textStyles} />
      <Reviews />
      <RealResults content={c.realResults} style={c.styles.realResults} text={c.textStyles} />
      <Dosing content={c.dosing} style={c.styles.dosing} text={c.textStyles} />
      <WhyChoose content={c.whyChoose} style={c.styles.whyChoose} text={c.textStyles} />
      <WegovyFaq content={c.faq} style={c.styles.faq} text={c.textStyles} />
      <FinalCta content={c.finalCta} style={c.styles.finalCta} text={c.textStyles} />
      <Footer />
    </main>
  );
}
