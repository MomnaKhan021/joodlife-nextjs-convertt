import type { Metadata } from "next";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import CategoryPreview from "@/components/home/CategoryPreview";
import UspStrip from "@/components/home/UspStrip";
import FeatureGrid from "@/sections/home/FeatureGrid";
import HowItWorks from "@/sections/home/HowItWorks";
import Reviews from "@/sections/home/Reviews";
import CategoryFaq from "@/components/category/CategoryFaq";
import CtaBanner from "@/sections/home/CtaBanner";
import Footer from "@/sections/home/Footer";

import { getCategoryPageContent } from "@/lib/categoryPageContent";
import { getCategories } from "@/lib/treatmentContent";

export const metadata: Metadata = {
  title: "Period Delay Treatment — Norethisterone, delivered discreetly | JoodLife",
  description:
    "Adjust your periods on your schedule. Clinically approved Norethisterone, reviewed by UK-registered prescribers and delivered discreetly for holidays, weddings and important events.",
  alternates: { canonical: "/period-delay" },
};

/** Women's Health — Period Delay sub-page (/period-delay). */
export const dynamic = "force-dynamic";

export default async function PeriodDelayPage() {
  // The themed hero comes from the Treatments global; everything else on
  // this page comes from the shared sub-page global.
  const categories = await getCategories();
  const category = categories["period-delay"];
  const { uspStrip, featureGrid, faqs } = await getCategoryPageContent();

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <CategoryPreview category={category} variant="hero" priority />
      <UspStrip items={uspStrip.items} />
      <div id="assessment" className="scroll-mt-28">
        <FeatureGrid content={featureGrid} />
      </div>
      <HowItWorks />
      <Reviews />
      <CategoryFaq
        items={faqs.periodDelay}
        heading={faqs.heading}
        headingAccent={faqs.headingAccent}
        accent={category.theme.base}
      />
      <CtaBanner />
      <Footer />
    </main>
  );
}
