import type { Metadata } from "next";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import HeroBanner from "@/components/home/HeroBanner";
import UspStrip from "@/components/home/UspStrip";
import BmiCalculator from "@/components/home/BmiCalculator";
import Reviews from "@/sections/home/Reviews";
import JourneyPlan from "@/sections/home/JourneyPlan";
import FeatureGrid from "@/sections/home/FeatureGrid";
import HowItWorks from "@/sections/home/HowItWorks";
import QuizBanner from "@/sections/home/QuizBanner";
import Faq from "@/sections/home/Faq";
import Blog from "@/sections/home/Blog";
import CtaBanner from "@/sections/home/CtaBanner";
import Footer from "@/sections/home/Footer";

import { getWeightLossContent } from "@/lib/weightLossContent";

export const metadata: Metadata = {
  title: "Weight Loss Treatment — Clinically guided GLP-1 plans | JoodLife",
  description:
    "Lose up to 27% body weight with clinically guided GLP-1 treatment plans tailored to your body, plus ongoing expert support for results that last.",
  alternates: { canonical: "/weight-loss" },
};

/**
 * Weight Loss sub-page (/weight-loss). Builds on the established
 * weight-loss landing sections: hero, BMI assessment, journey plan,
 * treatment plan, how-it-works, social proof and CTA.
 */
// The copy comes from the CMS, so the page renders per request like the
// other treatment pages rather than being frozen at build time.
export const dynamic = "force-dynamic";

export default async function WeightLossPage() {
  const { hero, usp, bmi, journey, features, quiz, styles, textStyles } =
    await getWeightLossContent();
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <HeroBanner content={hero} style={styles.hero} text={textStyles} />
      <UspStrip items={usp.items} style={styles.uspStrip} text={textStyles} />
      <div id="assessment" className="scroll-mt-28">
        <BmiCalculator content={bmi} style={styles.bmi} text={textStyles} />
      </div>
      <Reviews />
      <JourneyPlan content={journey} style={styles.journey} text={textStyles} />
      <FeatureGrid content={features} style={styles.featureGrid} text={textStyles} />
      <HowItWorks />
      <QuizBanner content={quiz} style={styles.quiz} text={textStyles} />
      <Faq />
      <Blog />
      <CtaBanner />
      <Footer />
    </main>
  );
}
