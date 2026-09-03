import type { Metadata } from "next";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import { EdHero, EdJourney } from "@/components/category/EdTopSections";
import EdReviews from "@/components/category/EdReviews";
import EdPage, { EdCtaBanner } from "@/components/category/EdPage";
import CategoryFaq from "@/components/category/CategoryFaq";
import Footer from "@/sections/home/Footer";

import { getCategoryPageContent } from "@/lib/categoryPageContent";
import { getEdContent } from "@/lib/edContent";

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
export const dynamic = "force-dynamic";

export default async function ErectileDysfunctionPage() {
  const [{ faqs }, ed] = await Promise.all([
    getCategoryPageContent(),
    getEdContent(),
  ]);

  return (
    <main className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <AnnouncementBar />
      <Header />

      {/* Photo hero banner */}
      <EdHero content={ed.hero} />

      {/* Social proof — 3000+ happy customers */}
      <EdReviews content={ed.reviews} />

      {/* "What to expect in your journey" teal timeline + goals + testimonial */}
      <div id="assessment" className="scroll-mt-28">
        <EdJourney content={ed.journey} />
      </div>

      {/* Light editorial sections */}
      <EdPage content={ed} />

      <CategoryFaq
        items={faqs.erectileDysfunction}
        heading={faqs.heading}
        headingAccent={faqs.headingAccent}
        accent="#142e2a"
      />

      <EdCtaBanner content={ed.banner} />
      <Footer />
    </main>
  );
}
