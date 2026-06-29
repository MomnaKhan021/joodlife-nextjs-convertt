import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import HeroGateway from "@/components/home/HeroGateway";
import CategoryPreview from "@/components/home/CategoryPreview";
import WeightLossDetail from "@/components/category/WeightLossDetail";
import EdDetail from "@/components/category/EdDetail";
import PeriodDetail from "@/components/category/PeriodDetail";
import Reviews from "@/sections/home/Reviews";
import FeatureGrid from "@/sections/home/FeatureGrid";
import HowItWorks from "@/sections/home/HowItWorks";
import Faq from "@/sections/home/Faq";
import Blog from "@/sections/home/Blog";
import CtaBanner from "@/sections/home/CtaBanner";
import Footer from "@/sections/home/Footer";

import { CATEGORIES } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForEmail } from "@/lib/accountData";

// Rendered per-request: the "Recent blog posts" section reads published
// posts from the CMS (DB), so new/edited articles appear without a rebuild.
export const dynamic = "force-dynamic";

/**
 * Home — a gateway page. The hero presents the three care categories as
 * cards that route to dedicated sub-pages; below, each category gets a
 * themed preview that links through to the same place. Shared trust /
 * how-it-works / reviews / CTA sections close the page out.
 */
export default async function HomePage() {
  // Detect returning patients so CTAs switch from "Get Started" to "Reorder".
  let isReturningPatient = false;
  const user = await getCurrentUser();
  if (user?.email) {
    const orders = await getOrdersForEmail(user.email);
    isReturningPatient = orders.some(
      (o) =>
        o.paymentStatus === "paid" ||
        o.status === "paid" ||
        o.status === "shipped" ||
        o.status === "delivered",
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <HeroGateway isReturningPatient={isReturningPatient} />

      <CategoryPreview category={CATEGORIES["weight-loss"]} priority isReturningPatient={isReturningPatient}>
        <WeightLossDetail />
      </CategoryPreview>
      <CategoryPreview category={CATEGORIES["erectile-dysfunction"]}>
        <EdDetail />
      </CategoryPreview>
      <CategoryPreview category={CATEGORIES["period-delay"]}>
        <PeriodDetail />
      </CategoryPreview>

      <Reviews />
      <FeatureGrid />
      <HowItWorks />
      <Faq />
      <Blog />
      <CtaBanner isReturningPatient={isReturningPatient} />
      <Footer />
    </main>
  );
}
