import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

type Category = "Weight loss" | "Period delay" | "Erectile dysfunction";

type Review = {
  text: string;
  name: string;
  category: Category;
  avatar?: string;
  initials?: string;
};

const REVIEWS: Review[] = [
  {
    text: "My medication always arrives well packaged and promptly and I don't have to answer hundreds of questions to receive it",
    name: "Hayley Churchyard",
    category: "Weight loss",
    initials: "HC",
  },
  {
    text: "“Exactly what I needed” The process was quick, easy, and very discreet. It gave me peace of mind before an important event and everything worked exactly as expected.",
    name: "Gillian Rhodes",
    category: "Period delay",
    avatar: "/assets/figma/avatar-gillian.png",
  },
  {
    text: "I've had a fantastic experience with Jood life, quick service, support on hand 24/7, reasonable prices and no pressure to constantly buy injections",
    name: "Jacqueline Riley",
    category: "Weight loss",
    initials: "JR",
  },
  {
    text: "“A huge improvement overall” I no longer worry the way I used to. I feel more in control, more relaxed, and more confident in intimate situations.",
    name: "Mike",
    category: "Erectile dysfunction",
    initials: "MI",
  },
];

const TABS: { label: string; count: number }[] = [
  { label: "All", count: 100 },
  { label: "Weight loss", count: 38 },
  { label: "Period delay", count: 38 },
  { label: "Erectile dysfunction", count: 24 },
];

const TAG_STYLES: Record<Category, string> = {
  "Weight loss": "bg-[#daffe0] text-[#142e2a]",
  "Period delay": "bg-[#ffe0ec] text-[#142e2a]",
  "Erectile dysfunction": "bg-[#d8ecff] text-[#142e2a]",
};

function ReviewCard({ review }: { review: Review }) {
  return (
    <article
      className="review-card flex h-full w-[315px] shrink-0 flex-col justify-between rounded-lg border border-[#142E2A]/20 bg-[#f7f9f2] px-4 py-6 md:h-[301.8px]"
      style={{
        transition:
          "border-color 320ms ease-out, background-color 320ms ease-out, box-shadow 320ms ease-out",
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <Image
            src="/assets/figma/stars-5.svg"
            alt="5 out of 5 stars"
            width={84}
            height={16}
            className="h-4 w-auto"
          />
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 font-ui text-[11px] font-medium leading-none ${TAG_STYLES[review.category]}`}
          >
            {review.category}
          </span>
        </div>
        <p className="font-ui text-[16.3px] leading-[22px] text-[#2a2929]">
          {review.text}
        </p>
        <div className="h-px w-28 bg-[#142E2A]" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        {review.avatar ? (
          <Image
            src={review.avatar}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#daffe0]">
            <span className="font-sans text-[16px] text-[#142e2a]">
              {review.initials}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="font-ui text-[16.3px] font-semibold leading-[20px] text-[#142e2a]">
            {review.name}
          </p>
          <div className="flex items-center gap-1.5">
            <Image
              src="/assets/figma/verified-tick.svg"
              alt=""
              width={13}
              height={13}
              className="h-[13px] w-[13px] flex-shrink-0"
              aria-hidden
            />
            <span className="font-ui text-[12px] text-[#00b67a] font-medium">
              Verified
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Reviews() {
  return (
    <section
      id="reviews"
      aria-label="Reviews"
      className="w-full scroll-mt-28 bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 pb-7 text-center"
        >
          <a
            href="https://www.trustpilot.com/review/joodlife.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Jood Life reviews on Trustpilot"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
          >
            <Image
              src="/assets/icons/trustpilot-logo-dark.svg"
              alt="Trustpilot"
              width={80}
              height={20}
              className="h-5 w-auto"
            />
            <Image
              src="/assets/icons/trustpilot-stars.svg"
              alt="5 stars"
              width={86}
              height={16}
              className="h-4 w-auto"
            />
            <span className="font-inter text-[18px] text-[#142e2a]">
              4.4 (50+) Reviews
            </span>
          </a>
          <h2 className="font-display text-[32px] leading-[36px] font-semibold tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            3000+ happy{" "}
            <em className="font-serif italic font-normal">customers</em>
          </h2>
          <p className="max-w-[780px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Thousands have trusted Jood for safe, clinically guided weight-loss
            care. Our patients value the expert support, clear communication,
            and lasting results that make every journey unique.
          </p>
        </Reveal>

        {/* Filter tabs (All / per-category) — first is active, matching Figma */}
        <Reveal
          as="div"
          delay={80}
          className="mb-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          {TABS.map((t, i) => (
            <span
              key={t.label}
              className={`rounded-full px-4 py-2 font-ui text-[13px] font-medium transition-colors md:text-[14px] ${
                i === 0
                  ? "bg-[#142e2a] text-white"
                  : "border border-[#142e2a]/15 bg-white text-[#142e2a]"
              }`}
            >
              {t.label} ({t.count})
            </span>
          ))}
        </Reveal>

        {/* Outer wrapper adds vertical padding so the card box-shadow is
            never clipped by the overflow-x-auto track. */}
        <Reveal
          delay={150}
          className="no-scrollbar -mx-6 flex gap-5 overflow-x-auto overflow-y-visible px-6 pb-6 pt-3 md:mx-0 md:px-1 md:py-4"
        >
          {REVIEWS.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </Reveal>

        {/* Carousel dots */}
        <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-2 rounded-full ${i === 0 ? "w-5 bg-[#142e2a]" : "w-2 bg-[#142e2a]/25"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
