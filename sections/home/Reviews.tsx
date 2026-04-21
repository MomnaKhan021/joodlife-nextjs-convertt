import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

type Review = {
  text: string;
  name: string;
  avatar?: string;
  initials?: string;
};

const REVIEWS: Review[] = [
  {
    text: "My medication always arrives well packaged and promptly and I don't have to answer hundreds of questions to receive it",
    name: "Hayley Churchyard",
    initials: "HC",
  },
  {
    text: "Always helpful and understanding. I did find it difficult to order at first but soon got the hang of it I am a bit of a dianasor when it comes to technology!! Brilliant company ordered then collect fr...",
    name: "Gillian Rhodes",
    avatar: "/assets/figma/avatar-gillian.png",
  },
  {
    text: "I've had a fantastic experience with Jood life, quick service, support on hand 24/7, reasonable prices and no pressure to constantly buy injections",
    name: "Jacqueline Riley",
    initials: "JR",
  },
  {
    text: "For me personally it's perfect. I started at areserved 161kg (25st plus) I'm currently at 122kg (19.2st) I'm 9 months in to a 2 year program. My life has changed completely, my health is loads better...",
    name: "Mike",
    initials: "MI",
  },
];

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full w-[315px] shrink-0 flex-col justify-between rounded-lg bg-[#f7f9f2] px-3 py-6 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(20,46,42,0.12)] md:h-[301.8px]">
      <div className="flex flex-col gap-4">
        <Image
          src="/assets/figma/stars-5.svg"
          alt="5 out of 5 stars"
          width={84}
          height={16}
          className="h-4 w-auto"
        />
        <p className="font-ui text-[16.3px] leading-[22px] text-[#2a2929]">
          {review.text}
        </p>
        <div className="h-px w-28 bg-[#142e2a]/20" />
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
    <section aria-label="Reviews" className="w-full bg-white py-16 md:py-0 md:pb-[100px]">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-[60px]">
        <Reveal as="div" className="flex flex-col items-center gap-3 pb-10 text-center">
          <a
            href="https://www.trustpilot.com/review/joodlife.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Jood Life reviews on Trustpilot"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00b67a]"
          >
            <Image
              src="/assets/icons/trustpilot-logo-only.svg"
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
            3000+ happy <em className="font-serif italic font-normal">customers</em>
          </h2>
          <p className="max-w-[780px] font-ui text-[15px] font-semibold leading-[22px] text-[#142e2a] md:text-[16.3px] md:leading-[20px]">
            Thousands have trusted Jood for safe, clinically guided weight-loss
            care. Our patients value the expert support, clear communication,
            and lasting results that make every journey unique.
          </p>
        </Reveal>

        <Reveal delay={150} className="no-scrollbar -mx-6 flex gap-5 overflow-x-auto px-6 pb-4 md:mx-0 md:px-0">
          {REVIEWS.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
