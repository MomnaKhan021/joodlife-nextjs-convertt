import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order placed — JoodLife",
};

type Props = {
  searchParams: Promise<{ order?: string | string[] }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderRaw = Array.isArray(sp.order) ? sp.order[0] : sp.order;
  const orderNumber = orderRaw && /^[A-Za-z0-9-]+$/.test(orderRaw) ? orderRaw : null;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />
      {orderNumber ? (
        <SuccessClient orderNumber={orderNumber} />
      ) : (
        <section className="mx-auto w-full max-w-[640px] px-6 py-16 text-center md:py-24">
          <h1 className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[32px] md:leading-[40px]">
            We can&apos;t find that order
          </h1>
          <p className="mt-3 font-ui text-[15px] text-[#142e2a]/75">
            The order reference is missing or invalid. Have a look at the shop or
            contact our support team.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[13px] font-semibold uppercase tracking-[0.04em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Browse shop
          </Link>
        </section>
      )}
      <Footer />
    </main>
  );
}
