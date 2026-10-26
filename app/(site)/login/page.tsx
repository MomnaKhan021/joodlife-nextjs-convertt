import Image from "next/image";
import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login — JoodLife",
};

type Props = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/profile";

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <section className="mx-auto w-full max-w-[1280px] px-6 py-10 md:px-10 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">
          {/* Hero image — desktop only */}
          <div className="relative hidden aspect-[4/5] w-full overflow-hidden rounded-2xl md:block">
            <Image
              src="/assets/auth/hero.png"
              alt="A hand holding the JoodLife device"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          {/* Form column */}
          <div className="flex w-full flex-col items-center md:items-start">
            <header className="mb-8 w-full text-center md:text-left">
              <h1 className="font-display text-[28px] font-bold leading-[34px] tracking-[-0.01em] text-[#142e2a] md:text-[34px] md:leading-[40px]">
                Login to your Account
              </h1>
              <p className="mt-2 font-ui text-[14px] leading-[20px] text-[#142e2a]/70 md:text-[15px] md:leading-[22px]">
                See what is going on with your business
              </p>
            </header>

            <LoginForm redirectTo={next} />

            <p className="mt-6 w-full text-center font-ui text-[14px] text-[#142e2a]/75">
              Not Registered Yet?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#142e2a] underline underline-offset-2 decoration-[1px] hover:text-[#0c2421]"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
