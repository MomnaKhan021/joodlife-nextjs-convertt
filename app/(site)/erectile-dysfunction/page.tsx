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

const category = CATEGORIES["erectile-dysfunction"];

export const metadata: Metadata = {
  title: "Erectile Dysfunction Treatment — Discreet & clinically approved | JoodLife",
  description:
    "Take control of erectile health safely and confidently. Clinically approved ED treatments, reviewed by UK-registered prescribers and delivered discreetly to your door.",
  alternates: { canonical: "/erectile-dysfunction" },
};

/** Men's Health — Erectile Dysfunction sub-page (/erectile-dysfunction). */
export default function ErectileDysfunctionPage() {
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
      <CategoryFaq items={CATEGORY_FAQS["erectile-dysfunction"]} accent={category.theme.base} />
      <CtaBanner />
      <Footer />
    </main>
  );
}
