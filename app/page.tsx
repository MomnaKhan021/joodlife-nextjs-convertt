import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import UspBar from "@/components/UspBar";
import WeightTracker from "@/components/WeightTracker";
import Reviews from "@/components/Reviews";
import WhatToExpect from "@/components/WhatToExpect";
import ExpertGuidance from "@/components/ExpertGuidance";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Quiz from "@/components/Quiz";
import Faq from "@/components/Faq";
import BlogPosts from "@/components/BlogPosts";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="w-full">
      <Navbar />
      <Hero />
      <UspBar />
      <WeightTracker />
      <Reviews />
      <WhatToExpect />
      <ExpertGuidance />
      <Features />
      <HowItWorks />
      <Quiz />
      <Faq />
      <BlogPosts />
      <Footer />
    </main>
  );
}
