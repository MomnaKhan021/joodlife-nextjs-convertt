import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import UspBar from "@/components/wegovy/UspBar";

import Hero from "@/components/weight-loss-tablet/Hero";
import WhatIs from "@/components/weight-loss-tablet/WhatIs";
import Comparison from "@/components/weight-loss-tablet/Comparison";
import HowItWorks from "@/components/weight-loss-tablet/HowItWorks";
import Reviews from "@/components/weight-loss-tablet/Reviews";
import RealResults from "@/components/weight-loss-tablet/RealResults";
import Dosing from "@/components/weight-loss-tablet/Dosing";
import WhyChoose from "@/components/weight-loss-tablet/WhyChoose";
import Faq from "@/components/weight-loss-tablet/Faq";
import FinalCta from "@/components/weight-loss-tablet/FinalCta";
import { WLT } from "@/lib/weightLossTabletContent";

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.joodlife.com").replace(/\/$/, "");
const PAGE_URL = `${SITE}${WLT.meta.path}`;

/**
 * /weight-loss-tablet — the Meta ads landing page, built to the "AFTER –
 * Jood updated copy" Figma (2003:559). Per the design's SEO notes it is
 * noindex (so it doesn't compete with /weight-loss in Google) and carries
 * MedicalWebPage + FAQPage + Pharmacy structured data.
 */
export const metadata: Metadata = {
  title: { absolute: WLT.meta.title },
  description: WLT.meta.description,
  alternates: { canonical: WLT.meta.path },
  robots: { index: false, follow: true },
  openGraph: { title: WLT.meta.title, description: WLT.meta.description, url: PAGE_URL },
};

// Reviews read the live Trustpilot list from the CMS on each request.
export const dynamic = "force-dynamic";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Pharmacy",
      "@id": `${SITE}/#pharmacy`,
      name: "Jood Pharmacy",
      url: SITE,
      identifier: { "@type": "PropertyValue", propertyID: "GPhC registration", value: "9012990" },
    },
    {
      "@type": "MedicalWebPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: WLT.meta.title,
      description: WLT.meta.description,
      inLanguage: "en-GB",
      publisher: { "@id": `${SITE}/#pharmacy` },
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: WLT.faq.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function WeightLossTabletPage() {
  return (
    // overflow-x-clip: slide-in reveals start offset sideways and would
    // otherwise make the page scroll horizontally on phones (clip, unlike
    // hidden, keeps the sticky header working).
    <main className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can never close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="w-full bg-[#142e2a]">
        <p className="mx-auto flex min-h-[42px] w-full max-w-[1440px] items-center justify-center gap-2 px-4 py-2 text-center font-ui text-[12px] font-medium leading-[16.9px] text-[#b4ff9f] md:px-10 md:text-[13px] md:tracking-[-0.3px] lg:px-[60px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
            <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="1.6" strokeDasharray="2.2 2.2" />
            <path d="M12 7.5V12l3 2" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span className="md:hidden">{WLT.announcement.mobile}</span>
          <span className="hidden md:inline">{WLT.announcement.text}</span>
        </p>
      </div>
      <Header />
      <Hero />
      <UspBar content={{ items: WLT.usp }} />
      <WhatIs />
      <Comparison />
      <HowItWorks />
      <Reviews />
      <RealResults />
      <Dosing />
      <WhyChoose />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
