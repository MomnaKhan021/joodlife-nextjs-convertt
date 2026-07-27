"use client";

import { useState } from "react";

/**
 * "3000+ happy customers" review wall — Figma ED page (node 18:811).
 * Trustpilot badge, headline, category filter chips and a responsive grid
 * of patient reviews. The chips filter the visible cards client-side.
 */

type Category = "Weight loss" | "Period delay" | "Erectile dysfunction";

type Review = {
  category: Category;
  title?: string;
  body: string;
  name: string;
  initials: string;
};

const REVIEWS: Review[] = [
  {
    category: "Weight loss",
    body: "My medication always arrives well packaged and promptly and I don't have to answer hundreds of questions to receive it.",
    name: "Hayley Churchyard",
    initials: "HC",
  },
  {
    category: "Period delay",
    title: "Exactly what I needed",
    body: "The process was quick, easy, and very discreet. It gave me peace of mind before an important event and everything worked exactly as expected.",
    name: "Gillian Rhodes",
    initials: "GR",
  },
  {
    category: "Weight loss",
    body: "I've had a fantastic experience with Jood — quick service, support on hand 24/7, reasonable prices and no pressure to constantly buy injections.",
    name: "Jacqueline Riley",
    initials: "JR",
  },
  {
    category: "Erectile dysfunction",
    title: "A huge improvement overall",
    body: "I no longer worry the way I used to. I feel more in control, more relaxed, and much more confident in intimate situations.",
    name: "Mike",
    initials: "MI",
  },
  {
    category: "Erectile dysfunction",
    body: "Discreet delivery and clear instructions. The consultation was simple and I felt supported the whole way through.",
    name: "David P.",
    initials: "DP",
  },
  {
    category: "Weight loss",
    title: "Genuinely life changing",
    body: "Steady, sustainable results and a team that actually checks in. I feel healthier and far more in control of my habits.",
    name: "Sarah L.",
    initials: "SL",
  },
  {
    category: "Period delay",
    body: "Ordered ahead of my holiday and it arrived in plenty of time. Straightforward, private, and exactly as described.",
    name: "Amelia T.",
    initials: "AT",
  },
  {
    category: "Erectile dysfunction",
    body: "Fast, professional and completely discreet. The ongoing support made all the difference to my confidence.",
    name: "James R.",
    initials: "JR",
  },
];

const FILTERS: { label: string; count: string; key: Category | "all" }[] = [
  { label: "All", count: "300", key: "all" },
  { label: "Weight loss", count: "38", key: "Weight loss" },
  { label: "Period delay", count: "38", key: "Period delay" },
  { label: "Erectile dysfunction", count: "24", key: "Erectile dysfunction" },
];

const TAG_STYLES: Record<Category, string> = {
  "Weight loss": "bg-[#eef3e6] text-[#3c6b2f]",
  "Period delay": "bg-[#fce8ef] text-[#b23a6a]",
  "Erectile dysfunction": "bg-[#e6f2f8] text-[#1a6f96]",
};

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
  const [filter, setFilter] = useState<Category | "all">("all");
  const shown =
    filter === "all"
      ? REVIEWS
      : REVIEWS.filter((r) => r.category === filter);

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
            className="mt-3 font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-[#142e2a] md:text-[40px]"
          >
            3000+ happy{" "}
            <em className="font-serif font-normal italic">customers</em>
          </h2>
          <p className="mx-auto mt-2.5 max-w-[62ch] font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15px]">
            Thousands have trusted Jood for safe, clinically guided care. Our
            patients value the expert support, clear communication, and lasting
            results that make every journey unique.
          </p>

          {/* Filter chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-2 font-ui text-[12.5px] font-semibold transition-colors ${
                    active
                      ? "bg-[#142e2a] text-white"
                      : "border border-[#142e2a]/15 bg-white text-[#142e2a] hover:bg-[#f7f9f2]"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Review cards */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="flex h-full flex-col rounded-[14px] border border-[#142e2a]/10 bg-[#f7f9f2] p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <Stars />
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-ui text-[10px] font-semibold ${TAG_STYLES[r.category]}`}
                >
                  {r.category}
                </span>
              </div>
              {r.title && (
                <p className="mt-3 font-ui text-[14px] font-bold leading-[19px] text-[#142e2a]">
                  {r.title}
                </p>
              )}
              <p className="mt-2 flex-1 font-ui text-[12.5px] leading-[19px] text-[#142e2a]/75">
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
