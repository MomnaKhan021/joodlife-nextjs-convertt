import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import HeroGateway from "@/components/home/HeroGateway";
import UspStrip from "@/components/home/UspStrip";
import CategoryPreview from "@/components/home/CategoryPreview";
import Reviews from "@/sections/home/Reviews";
import FeatureGrid from "@/sections/home/FeatureGrid";
import HowItWorks from "@/sections/home/HowItWorks";
import Faq from "@/sections/home/Faq";
import Blog from "@/sections/home/Blog";
import CtaBanner from "@/sections/home/CtaBanner";
import Footer from "@/sections/home/Footer";

import { CATEGORIES } from "@/lib/categories";

/**
 * Home — a gateway page. The hero presents the three care categories as
 * cards that route to dedicated sub-pages; below, each category gets a
 * themed preview that links through to the same place. Shared trust /
 * how-it-works / reviews / CTA sections close the page out.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <HeroGateway />
      <UspStrip />

      <CategoryPreview category={CATEGORIES["weight-loss"]} priority />
      <CategoryPreview category={CATEGORIES["erectile-dysfunction"]} />
      <CategoryPreview category={CATEGORIES["period-delay"]} />

      <Reviews />
      <FeatureGrid />
      <HowItWorks />
      <Faq />
      <Blog />
      <CtaBanner />
      <Footer />
    </main>
  );
}
