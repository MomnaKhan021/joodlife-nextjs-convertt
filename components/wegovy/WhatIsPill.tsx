import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

/**
 * "What is the Wegovy pill?" — Figma node 1:1610.
 * Heading row with a CTA, then a four-card explainer grid.
 */

type Card = {
  title: string;
  body: string;
  image?: string;
  tag?: string;
  badge?: { label: string; value: string };
};

const CARDS: Card[] = [
  {
    title: "The first of its kind",
    body: "is an FDA-approved semaglutide in a pill for weight loss.",
    image: "/assets/wegovy/what-pills.png",
    tag: "Powered by SNAC technology",
  },
  {
    title: "Unpacking Snac",
    body: "The SNAC molecule used by Novo Nordisk™ is the key to the GLP-1 pill.",
    image: "/assets/wegovy/what-snac.png",
  },
  {
    title: "Real results",
    body: "Lose up to 20% of your body weight without the shot.",
    image: "/assets/wegovy/what-man.png",
    badge: { label: "Year 1", value: "↓ 32 lbs" },
  },
  {
    title: "Lose weight your way",
    body: "With Wegovy® in a pill or pen and a range of dosages, you’ve got options.",
    image: "/assets/wegovy/what-bottle.png",
  },
];

export default function WhatIsPill() {
  return (
    <section
      aria-label="What is the Wegovy pill"
      className="w-full bg-white py-14 md:py-16 lg:py-[80px]"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-[60px]">
        <Reveal as="div" className="mb-9 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <h2 className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[48px] md:leading-[52px]">
            What Is The{" "}
            <span className="font-serif italic font-normal">Wegovy Pill?</span>
          </h2>
          <a
            href="/consultation"
            className="inline-flex h-[58px] shrink-0 items-center justify-center rounded-2xl bg-[#142e2a] px-9 font-ui text-[16px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-[#0c2421]"
          >
            Get Started Today
          </a>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <Reveal as="div" key={c.title} delay={i * 80} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-[#f7f9f2]">
                <div className="relative h-[300px] w-full overflow-hidden bg-[#eef2e6]">
                  {c.image ? (
                    <Image
                      src={c.image}
                      alt={c.title}
                      fill
                      sizes="(max-width:1024px) 50vw, 25vw"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          "linear-gradient(135deg, #daffe0 0%, #b4ff9f 55%, #87af73 100%)",
                      }}
                    />
                  )}
                  {c.tag ? (
                    <span className="absolute bottom-3 right-3 max-w-[160px] rounded-xl border border-white/70 bg-white/55 px-3 py-2 font-ui text-[11px] font-medium leading-tight text-[#142e2a] shadow-sm backdrop-blur-md">
                      {c.tag}
                    </span>
                  ) : null}
                  {c.badge ? (
                    <span className="absolute right-3 top-3 flex flex-col items-end rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-right shadow-sm backdrop-blur-md">
                      <span className="font-ui text-[10px] font-medium uppercase tracking-wide text-[#142e2a]/55">
                        {c.badge.label}
                      </span>
                      <span className="font-display text-[18px] font-semibold leading-none text-[#142e2a]">
                        {c.badge.value}
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 px-5 py-5">
                  <h3 className="font-ui text-[18px] font-semibold leading-[24px] text-[#142e2a]">
                    {c.title}
                  </h3>
                  <p className="font-ui text-[14px] leading-[20px] text-[#142e2a]/70">
                    {c.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
