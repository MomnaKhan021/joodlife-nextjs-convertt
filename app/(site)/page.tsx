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

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />
      <HeroBanner />
      <UspStrip />
      <BmiCalculator />
      <Reviews />
      <JourneyPlan />
      <FeatureGrid />
      <HowItWorks />
      <QuizBanner />
      <Faq />
      <Blog />
      <CtaBanner />
      <Footer />
    </main>
  );
}
