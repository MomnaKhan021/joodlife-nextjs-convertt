import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import HeroGateway from "@/components/home/HeroGateway";
import UspStrip from "@/components/home/UspStrip";
import WeightLossPreview from "@/components/home/WeightLossPreview";
import EdPreview from "@/components/home/EdPreview";
import PeriodDelayPreview from "@/components/home/PeriodDelayPreview";
import Reviews from "@/sections/home/Reviews";
import FeatureGrid from "@/sections/home/FeatureGrid";
import HowItWorks from "@/sections/home/HowItWorks";
import Faq from "@/sections/home/Faq";
import Blog from "@/sections/home/Blog";
import CtaBanner from "@/sections/home/CtaBanner";
import Footer from "@/sections/home/Footer";

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

      <WeightLossPreview />
      <EdPreview />
      <PeriodDelayPreview />

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
