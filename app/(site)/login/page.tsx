import Image from "next/image";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";
import PasswordlessAuth from "@/components/auth/PasswordlessAuth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login — JoodLife",
};

type Props = {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const googleError = Array.isArray(sp.error) ? sp.error[0] : sp.error;
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
                Sign in to JoodLife
              </h1>
              <p className="mt-2 font-ui text-[14px] leading-[20px] text-[#142e2a]/70 md:text-[15px] md:leading-[22px]">
                Continue with Google or a one-time email code.
              </p>
            </header>

            <PasswordlessAuth redirectTo={next} googleError={googleError} />

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
