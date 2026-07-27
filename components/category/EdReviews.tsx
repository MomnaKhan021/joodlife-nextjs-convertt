"use client";

/**
 * "3000+ happy customers" review wall — Figma ED page (node 18:811).
 * Trustpilot badge, headline and a responsive grid of erectile-dysfunction
 * patient reviews. (No category tabs — this is the ED page, so every review
 * is ED-relevant.)
 */

type Review = {
  title?: string;
  body: string;
  name: string;
  initials: string;
};

const REVIEWS: Review[] = [
  {
    title: "A huge improvement overall",
    body: "I no longer worry the way I used to. I feel more in control, more relaxed, and much more confident in intimate situations.",
    name: "Mike",
    initials: "MI",
  },
  {
    body: "Discreet delivery and clear instructions. The consultation was simple and I felt supported the whole way through.",
    name: "David P.",
    initials: "DP",
  },
  {
    title: "Confidence restored",
    body: "The whole process was quick and completely private. Within weeks I felt like myself again — it's made a real difference.",
    name: "James R.",
    initials: "JR",
  },
  {
    body: "My medication always arrives well packaged and promptly, and I don't have to answer hundreds of questions to receive it.",
    name: "Hayley Churchyard",
    initials: "HC",
  },
  {
    title: "Genuinely reassuring",
    body: "The clinician took the time to recommend the right option for me. Reasonable prices and no pressure at any point.",
    name: "Daniel K.",
    initials: "DK",
  },
  {
    body: "Fast, professional and completely discreet. The ongoing support made all the difference to my confidence.",
    name: "Thomas B.",
    initials: "TB",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#00b67a] text-[9px] text-white"
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function EdReviews() {
  return (
    <section
      aria-labelledby="ed-reviews"
      className="w-full bg-white px-5 py-12 md:px-10 md:py-16 lg:px-[60px]"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-col items-center text-center">
          {/* Trustpilot */}
          <div className="flex items-center gap-2 font-ui text-[13px] text-[#142e2a]">
            <span className="font-semibold">
              <span className="text-[#00b67a]">★</span> Trustpilot
            </span>
            <Stars />
            <span className="font-semibold">
              4.4 <span className="font-normal text-[#142e2a]/60">(50+) Reviews</span>
            </span>
          </div>

          <h2
            id="ed-reviews"
            className="mt-3 font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#142e2a] md:text-[40px] md:leading-[1.1]"
          >
            3000+ happy{" "}
            <em className="font-serif font-normal italic">customers</em>
          </h2>
          <p className="mx-auto mt-3 max-w-[62ch] font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15px]">
            Thousands of men have trusted Jood for safe, clinically guided care.
            Our patients value the expert support, clear communication, and
            lasting confidence that follows.
          </p>
        </div>

        {/* Review cards */}
        <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="flex h-full flex-col rounded-[14px] border border-[#142e2a]/10 bg-[#f7f9f2] p-5"
            >
              <Stars />
              {r.title && (
                <p className="mt-3 font-ui text-[14px] font-bold leading-[19px] text-[#142e2a]">
                  {r.title}
                </p>
              )}
              <p className="mt-2 flex-1 font-ui text-[13px] leading-[20px] text-[#142e2a]/75">
                {r.body}
              </p>
              <div className="mt-4 flex items-center gap-2.5 border-t border-[#142e2a]/10 pt-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#142e2a] font-ui text-[11px] font-bold text-white">
                  {r.initials}
                </span>
                <div className="leading-tight">
                  <p className="font-ui text-[12.5px] font-semibold text-[#142e2a]">
                    {r.name}
                  </p>
                  <p className="flex items-center gap-1 font-ui text-[11px] text-[#00b67a]">
                    <span className="grid h-3 w-3 place-items-center rounded-full bg-[#00b67a] text-[7px] text-white">
                      ✓
                    </span>
                    Verified
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
