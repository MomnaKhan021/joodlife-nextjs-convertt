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

import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_FAQS } from "@/lib/categoryFaqs";

const category = CATEGORIES["period-delay"];

export const metadata: Metadata = {
  title: "Period Delay Treatment — Norethisterone, delivered discreetly | JoodLife",
  description:
    "Adjust your periods on your schedule. Clinically approved Norethisterone, reviewed by UK-registered prescribers and delivered discreetly for holidays, weddings and important events.",
  alternates: { canonical: "/period-delay" },
};

/** Women's Health — Period Delay sub-page (/period-delay). */
export default function PeriodDelayPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <CategoryPreview category={category} variant="hero" priority />
      <UspStrip />
      <div id="assessment" className="scroll-mt-28">
        <FeatureGrid />
      </div>
      <HowItWorks />
      <Reviews />
      <CategoryFaq items={CATEGORY_FAQS["period-delay"]} accent={category.theme.base} />
      <CtaBanner />
      <Footer />
    </main>
  );
}
