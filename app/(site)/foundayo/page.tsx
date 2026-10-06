import type { Metadata } from "next";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import UspBar from "@/components/wegovy/UspBar";

import Hero from "@/components/foundayo/Hero";
import WhatIs from "@/components/foundayo/WhatIs";
import Comparison from "@/components/foundayo/Comparison";
import HowItWorks from "@/components/foundayo/HowItWorks";
import Reviews from "@/components/foundayo/Reviews";
import RealResults from "@/components/foundayo/RealResults";
import Dosing from "@/components/foundayo/Dosing";
import WhyChoose from "@/components/foundayo/WhyChoose";
import Faq from "@/components/foundayo/Faq";
import FinalCta from "@/components/foundayo/FinalCta";
import { FOUNDAYO } from "@/lib/foundayoContent";

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || "https://www.joodlife.com").replace(/\/$/, "");
const PAGE_URL = `${SITE}${FOUNDAYO.meta.path}`;

/**
 * /foundayo — the Meta ads landing page, built to the "AFTER –
 * Jood updated copy" Figma (2003:559). Per the design's SEO notes it is
 * noindex (so it doesn't compete with /weight-loss in Google) and carries
 * MedicalWebPage + FAQPage + Pharmacy structured data.
 */
export const metadata: Metadata = {
  title: { absolute: FOUNDAYO.meta.title },
  description: FOUNDAYO.meta.description,
  alternates: { canonical: FOUNDAYO.meta.path },
  robots: { index: false, follow: true },
  openGraph: { title: FOUNDAYO.meta.title, description: FOUNDAYO.meta.description, url: PAGE_URL },
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
      name: FOUNDAYO.meta.title,
      description: FOUNDAYO.meta.description,
      inLanguage: "en-GB",
      publisher: { "@id": `${SITE}/#pharmacy` },
    },
    {
      "@type": "FAQPage",
      "@id": `${PAGE_URL}#faq`,
      mainEntity: FOUNDAYO.faq.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function FoundayoPage() {
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
      {/* The site-wide announcement bar — the same text and link as the home
          page, managed in the CMS (Home → announcement). */}
      <AnnouncementBar />
      <Header compact />
      <Hero />
      <UspBar content={{ items: FOUNDAYO.usp }} />
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
