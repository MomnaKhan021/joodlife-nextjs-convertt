import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * Reviews — Trustpilot summary only.
 *
 * There is no Trustpilot API integration in this project (no "trustpilot"
 * usage in lib/ or app/api/), so we cannot fetch live individual reviews.
 * To avoid displaying fabricated testimonials, this section shows a genuine
 * Trustpilot summary (logo + star rating) and links out to the real
 * Trustpilot profile where visitors can read verified reviews.
 */
export default function Reviews() {
  return (
    <section
      id="reviews"
      aria-label="Reviews"
      className="w-full scroll-mt-28 bg-white py-12 md:py-14 lg:py-[56px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="flex flex-col items-center gap-4 text-center"
        >
          <h2 className="font-display text-[32px] leading-[36px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            3000+ happy{" "}
            <em className="font-serif italic font-normal">customers</em>
          </h2>
          <p className="max-w-[780px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Thousands have trusted Jood for safe, clinically guided weight-loss
            care. Our patients value the expert support, clear communication,
            and lasting results that make every journey unique.
          </p>

          <a
            href="https://www.trustpilot.com/review/joodlife.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Read our reviews on Trustpilot"
            className="mt-2 inline-flex cursor-pointer flex-col items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
          >
            <span className="inline-flex items-center gap-3">
              <Image
                src="/assets/icons/trustpilot-logo-dark.svg"
                alt="Trustpilot"
                width={96}
                height={24}
                className="h-6 w-auto"
              />
              <Image
                src="/assets/icons/trustpilot-stars.svg"
                alt="Rated 4.4 out of 5 stars"
                width={110}
                height={20}
                className="h-5 w-auto"
              />
            </span>
            <span className="font-ui text-[16px] font-medium text-[#142e2a] underline underline-offset-4">
              Read our reviews on Trustpilot
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
