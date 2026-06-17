import Image from "next/image";
import Link from "next/link";

import CheckoutClient from "./CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — JoodLife",
};

/**
 * Focused, conversion-optimised checkout (matches the Figma design):
 * a minimal centred-logo header, the checkout body, and a Trustpilot
 * footer — no site nav / announcement bar / mega-footer to distract.
 */
export default function CheckoutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#fbfbf6] font-ui text-[#142e2a]">
      {/* ── Header: centred JOOD wordmark ── */}
      <header className="flex h-[84px] shrink-0 items-center justify-center border-b border-[#142e2a]/10 bg-white">
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

      {/* ── Body ── */}
      <CheckoutClient />

      {/* ── Footer: Trustpilot rating ── */}
      <footer className="mt-auto flex items-center justify-center gap-3 px-6 py-10">
        <Image
          src="/assets/icons/trustpilot-logo.svg"
          alt="Trustpilot"
          width={92}
          height={22}
          className="h-[22px] w-auto"
        />
        <Image
          src="/assets/icons/trustpilot-stars.svg"
          alt=""
          width={110}
          height={22}
          className="h-[22px] w-auto"
        />
        <span className="font-ui text-[16px] font-semibold text-[#142e2a]">
          4.4{" "}
          <span className="font-normal text-[#142e2a]/70">(50+) Reviews</span>
        </span>
      </footer>
    </main>
  );
}
