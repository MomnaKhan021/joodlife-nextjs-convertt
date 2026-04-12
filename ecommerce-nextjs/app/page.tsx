import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import TrustBar from '@/components/sections/TrustBar';
import Products from '@/components/sections/Products';
import Reviews from '@/components/sections/Reviews';
import Timeline from '@/components/sections/Timeline';
import TreatmentPlan from '@/components/sections/TreatmentPlan';
import HowItWorks from '@/components/sections/HowItWorks';
import Quiz from '@/components/sections/Quiz';
import FAQ from '@/components/sections/FAQ';
import BlogPosts from '@/components/sections/BlogPosts';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <Products />
        <Reviews />
        <Timeline />
        <TreatmentPlan />
        <HowItWorks />
        <Quiz />
        <FAQ />
        <BlogPosts />
      </main>
      <Footer />
    </>
  );
}
