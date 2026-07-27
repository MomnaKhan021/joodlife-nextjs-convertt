import type { Metadata } from "next";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import CategoryPreview from "@/components/home/CategoryPreview";
import EdDetail from "@/components/category/EdDetail";
import EdPage, { EdCtaBanner } from "@/components/category/EdPage";
import CategoryFaq from "@/components/category/CategoryFaq";
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

/**
 * Men's Health — Erectile Dysfunction page (/erectile-dysfunction).
 *
 * Follows the Figma "Erectile dysfunction — 2026, May 26" layout: the blue
 * hero with its goals / testimonial / pill cards, then the light editorial run
 * (benefits grid, three-step "How it works", the "Confidence in the moments
 * that matter most" split, "Let's get to know you"), FAQ, and the closing CTA
 * banner. Every section is responsive: stacked on mobile, 2-up on tablet, the
 * Figma grid on desktop.
 */
export default function ErectileDysfunctionPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      {/* Blue hero + in-hero cards (pill band, goals, testimonial) */}
      <CategoryPreview category={category} priority>
        <EdDetail />
      </CategoryPreview>

      {/* Light editorial sections */}
      <div id="assessment" className="scroll-mt-28">
        <EdPage />
      </div>

      <CategoryFaq
        items={CATEGORY_FAQS["erectile-dysfunction"]}
        accent={category.theme.base}
      />

      <EdCtaBanner />
      <Footer />
    </main>
  );
}
