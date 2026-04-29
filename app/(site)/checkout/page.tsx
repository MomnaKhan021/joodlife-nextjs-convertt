import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — JoodLife",
};

export default function CheckoutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />
      <CheckoutClient />
      <Footer />
    </main>
  );
}
