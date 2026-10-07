import type { CSSProperties } from "react";
import type { Metadata } from "next";
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

// Saans (Displaay) — the body face in the ads-lander Figma, used on this page
// only. Headings stay Gilroy and the italic parts Clearface. The site's
// body-font utility (font-ui) reads --font-outfit, so pointing that variable
// at Saans inside <main> switches every body text on the page — and nothing
// outside it. Regular is 380 and Medium 570 in the files; Medium also covers
// semibold (the FAQ questions, as on the main site's FAQ).
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
    <main className={`${saans.variable} flex min-h-screen flex-col bg-white font-ui`} style={SAANS_BODY}>
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
      <Footer />
    </main>
  );
}
