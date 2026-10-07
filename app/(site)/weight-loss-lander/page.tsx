import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Instrument_Serif, Inter_Tight, Poppins } from "next/font/google";
import localFont from "next/font/local";

import LpHero from "@/components/lp/LpHero";
import LpTrustStrip from "@/components/lp/LpTrustStrip";
import LpStories from "@/components/lp/LpStories";
import LpResults from "@/components/lp/LpResults";
import LpExpertise from "@/components/lp/LpExpertise";
import LpHowItWorks from "@/components/lp/LpHowItWorks";
import LpJourney from "@/components/lp/LpJourney";
import LpReviews from "@/components/lp/LpReviews";
import LpFaq from "@/components/lp/LpFaq";
import LpFinal from "@/components/lp/LpFinal";
import Footer from "@/sections/home/Footer";

import { getLanderContent } from "@/lib/landerContent";

/*
 * Fonts exactly as the ads-lander Figma uses them, loaded by this page only:
 *   Saans (Displaay)  — body text, buttons, cards, steps, reviews, FAQs.
 *   Gilroy SemiBold   — headings, with ITC Clearface italic accents (site fonts).
 *   Poppins           — the Trustpilot wordmark and score in the hero/strip.
 *   Inter Tight +     — the "Weight Loss, Backed By Medical Expertise" block
 *   Instrument Serif    and the Journey button.
 * The footer is the site's shared footer and keeps the site's Outfit.
 *
 * The site's body utility (font-ui) reads --font-outfit, so pointing that
 * variable at Saans on the sections' wrapper switches all their body text
 * and nothing outside it. Saans Regular is 380 and Medium 570 in the files;
 * Medium also covers semibold (FAQ questions).
 */
const saans = localFont({
  variable: "--font-saans",
  display: "swap",
  src: [
    { path: "../../fonts/Saans-Light.woff2", weight: "300", style: "normal" },
    { path: "../../fonts/Saans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/Saans-Medium.woff2", weight: "500 600", style: "normal" },
    { path: "../../fonts/Saans-Bold.woff2", weight: "700", style: "normal" },
  ],
});
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-poppins", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-inter-tight", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument-serif",
  display: "swap",
});
const SAANS_BODY = { "--font-outfit": "var(--font-saans)" } as CSSProperties;

export const metadata: Metadata = {
  title: "The Jood Weight Loss Programme — designed around you | JoodLife",
  description:
    "Lose weight with a programme designed around you: UK-registered clinicians, a personalised plan and 24/7 WhatsApp support. Check your eligibility in about three minutes.",
  alternates: { canonical: "/weight-loss-lander" },
  // Paid-ads landing page: kept out of search results so it doesn't
  // compete with /weight-loss, and not linked from the site menu.
  robots: { index: false, follow: true },
};

// The words and pictures come from the CMS (/cms/weight-loss-lander), so the
// page renders per request like the other CMS-driven pages.
export const dynamic = "force-dynamic";

/**
 * Ads landing page (/weight-loss-lander), built from the "Ads Landing -
 * Joodlife - Next Js" Figma.
 */
export default async function WeightLossLanderPage() {
  const c = await getLanderContent();
  const s = c.styles;
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <div
        className={`${saans.variable} ${poppins.variable} ${interTight.variable} ${instrumentSerif.variable} flex flex-col font-ui`}
        style={SAANS_BODY}
      >
        <LpHero content={c.hero} style={s.hero} />
        <LpTrustStrip content={c.trust} style={s.trust} />
        <LpStories content={c.stories} style={s.stories} />
        <LpResults content={c.results} style={s.results} />
        <LpExpertise content={c.expertise} style={s.expertise} />
        <LpHowItWorks content={c.steps} style={s.steps} />
        <LpJourney content={c.journey} style={s.journey} />
        <LpReviews content={c.reviews} style={s.reviews} />
        <LpFaq content={c.faq} style={s.faq} />
        <LpFinal content={c.final} style={s.final} />
      </div>
      <Footer />
    </main>
  );
}
