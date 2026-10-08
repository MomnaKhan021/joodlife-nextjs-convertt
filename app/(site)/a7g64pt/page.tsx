import type { Metadata } from "next";

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

export const metadata: Metadata = {
  title: "The Jood Weight Loss Programme — designed around you | JoodLife",
  description:
    "Lose weight with a programme designed around you: UK-registered clinicians, a personalised plan and 24/7 WhatsApp support. Check your eligibility in about three minutes.",
  alternates: { canonical: "/a7g64pt" },
  // Paid-ads landing page: kept out of search results so it doesn't
  // compete with /weight-loss, and not linked from the site menu.
  robots: { index: false, follow: true },
};

// The words and pictures come from the CMS (/cms/weight-loss-lander), so the
// page renders per request like the other CMS-driven pages.
export const dynamic = "force-dynamic";

/**
 * The weight-loss ads landing page (/a7g64pt — /weight-loss-lander redirects
 * here), built from the "Ads Landing - Joodlife - Next Js" Figma and styled
 * like /foundayo: the live site's fonts (Gilroy, ITC Clearface, Outfit, all
 * loaded by the site layout), scroll reveals and hover lifts.
 */
export default async function WeightLossLanderPage() {
  const c = await getLanderContent();
  const s = c.styles;
  return (
    <main className="flex min-h-screen flex-col bg-white">
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
