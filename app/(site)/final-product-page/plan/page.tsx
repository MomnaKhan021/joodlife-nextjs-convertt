import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

import PlanClient from "./PlanClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Choose your frequency — JoodLife",
};

/**
 * "Choose your frequency" — the step between treatment selection and
 * checkout. Uses a minimal centred-logo header to keep the user focused
 * on completing their purchase (mirrors the checkout chrome).
 */
export default function PlanPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white font-ui text-[#142e2a]">
      <header className="flex h-[72px] shrink-0 items-center justify-center border-b border-[#142e2a]/10 bg-white">
        <Link href="/" aria-label="JoodLife home">
          <Image
            src="/assets/icons/logo-wesmount.svg"
            alt="JOOD"
            width={95}
            height={30}
            priority
          />
        </Link>
      </header>

      <Suspense
        fallback={
          <div className="px-5 py-16 text-center font-ui text-[14px] text-[#142e2a]/60">
            Loading…
          </div>
        }
      >
        <PlanClient />
      </Suspense>
    </main>
  );
}
