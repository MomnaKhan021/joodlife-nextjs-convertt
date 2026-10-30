import Image from "next/image";
import Link from "next/link";

import CheckoutClient from "./CheckoutClient";
import CheckoutCartButton from "@/components/checkout/CheckoutCartButton";
import CheckoutResults from "@/components/checkout/CheckoutResults";
import { getLanderContent } from "@/lib/landerContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — JoodLife",
};

/**
 * Focused, conversion-optimised checkout (matches the Figma design):
 * a minimal centred-logo header, the checkout body, and a Trustpilot
 * footer — no site nav / announcement bar / mega-footer to distract.
 */
export default async function CheckoutPage() {
  // The before/after cards come from the ads lander's CMS content, so the
  // checkout shows the same real-patient results as /a7g64pt.
  const lander = await getLanderContent();
  return (
    <main className="flex min-h-screen flex-col bg-[#fbfbf6] font-ui text-[#142e2a]">
      {/* ── Header: centred JOOD wordmark ── */}
      {/* Shorter on phones; the inner row matches the body's width and
          gutters so the cart icon lines up with the content's right edge on
          wide screens instead of sitting against the window edge. */}
      <header className="shrink-0 border-b border-[#142e2a]/10 bg-white">
        <div className="relative mx-auto flex h-16 w-full max-w-[1327px] items-center justify-center px-5 md:h-[84px] md:px-8">
          <Link href="/" aria-label="JoodLife home" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#142e2a]">
            <Image
              src="/assets/icons/logo-wesmount.svg"
              alt="JOOD"
              width={95}
              height={30}
              priority
              className="h-[26px] w-auto md:h-[30px]"
            />
          </Link>
          {/* Top-right cart icon — opens the drawer so items can be reviewed
              or removed without leaving checkout. */}
          <CheckoutCartButton />
        </div>
      </header>

      {/* ── Body ── */}
      <CheckoutClient results={<CheckoutResults content={lander.results} />} />

      {/* ── Footer: Trustpilot rating ──
          Centred, wraps cleanly on narrow screens (logo+stars on one line,
          rating text on the next) so it never overflows or looks crammed. */}
      <footer className="mt-auto px-6 py-10">
        <a
          href="https://www.trustpilot.com/review/joodlife.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Jood Life reviews on Trustpilot"
          className="mx-auto flex max-w-fit flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-md text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
        >
          {/* Logo already includes the star + wordmark + 5 stars, so no
              separate stars image (that caused a duplicate row of stars). */}
          <Image
            src="/assets/icons/trustpilot-logo.svg"
            alt="Trustpilot — rated 4.4 out of 5"
            width={175}
            height={20}
            loading="eager"
            className="h-5 w-auto shrink-0"
          />
          <span className="font-ui text-[14px] font-semibold text-[#142e2a] md:text-[16px]">
            4.4 <span className="font-normal text-[#142e2a]/70">(50+) Reviews</span>
          </span>
        </a>
      </footer>
    </main>
  );
}
