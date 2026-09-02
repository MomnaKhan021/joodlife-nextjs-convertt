import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/sections/home/Footer";

/**
 * Shared branded shell for JoodLife policy pages
 * (Terms, Refund & Complaints, Privacy & Cookies).
 *
 * These pages replace the old off-site links that pointed at
 * joodlife.com — everything now lives on our own site with the
 * site's own typography and branding (dark-green #142e2a, cream
 * #f7f9f2, font-display / font-serif / font-ui).
 */

export type PolicyBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] };

export type PolicySection = {
  heading: string;
  blocks: PolicyBlock[];
};

function Blocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h") {
          return (
            <h3
              key={i}
              className="mt-7 font-ui text-[16px] font-semibold leading-[24px] text-[#142e2a] md:text-[17px]"
            >
              {b.text}
            </h3>
          );
        }
        if (b.type === "list") {
          return (
            <ul
              key={i}
              className="mt-3 flex flex-col gap-2 pl-5 [list-style:disc]"
            >
              {b.items.map((it, j) => (
                <li
                  key={j}
                  className="font-ui text-[15px] leading-[26px] text-[#142e2a]/80 md:text-[16px]"
                >
                  {it}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="mt-3 font-ui text-[15px] leading-[26px] text-[#142e2a]/80 md:text-[16px]"
          >
            {b.text}
          </p>
        );
      })}
    </>
  );
}

export default function PolicyPage({
  title,
  titleAccent,
  intro,
  updated,
  sections,
}: {
  title: string;
  titleAccent?: string;
  intro: string;
  updated: string;
  sections: PolicySection[];
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />

      <main className="w-full bg-white">
        {/* ───── Hero ───── */}
        <section className="w-full bg-[#f7f9f2]">
          <div className="mx-auto w-full max-w-[860px] px-6 pb-12 pt-12 md:px-10 md:pb-16 md:pt-16">
            <p className="font-ui text-[13px] font-semibold uppercase tracking-[0.14em] text-[#142e2a]/55">
              Legal
            </p>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[1.06] tracking-[-0.02em] text-[#142e2a] md:text-[52px]">
              {title}
              {titleAccent ? (
                <>
                  {" "}
                  <em className="font-serif font-normal italic">
                    {titleAccent}
                  </em>
                </>
              ) : null}
            </h1>
            <p className="mt-4 max-w-[620px] font-ui text-[15px] leading-[25px] text-[#142e2a]/70 md:text-[16.3px]">
              {intro}
            </p>
            <p className="mt-5 font-ui text-[13px] text-[#142e2a]/55">
              Last updated: {updated}
            </p>
          </div>
        </section>

        {/* ───── Body ───── */}
        <section className="w-full bg-white">
          <div className="mx-auto w-full max-w-[860px] px-6 py-12 md:px-10 md:py-16">
            <div className="flex flex-col gap-10">
              {sections.map((s) => (
                <div key={s.heading}>
                  <h2 className="font-display text-[22px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#142e2a] md:text-[26px]">
                    {s.heading}
                  </h2>
                  <div className="mt-2">
                    <Blocks blocks={s.blocks} />
                  </div>
                </div>
              ))}
            </div>

            {/* Contact / help card */}
            <div className="mt-12 rounded-3xl bg-[#f7f9f2] p-6 md:p-8">
              <h2 className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#142e2a] md:text-[24px]">
                Questions about this policy?
              </h2>
              <p className="mt-2 font-ui text-[15px] leading-[25px] text-[#142e2a]/75 md:text-[16px]">
                Our care team is here to help. Contact us and a member of the
                team will be happy to assist you.
              </p>
              <div className="mt-4 flex flex-col gap-2 font-ui text-[15px] text-[#142e2a]/80 md:text-[16px]">
                <a
                  className="w-fit underline decoration-[#142e2a]/30 underline-offset-4 transition-colors hover:text-[#142e2a] hover:decoration-[#142e2a]"
                  href="mailto:support@joodlife.com"
                >
                  support@joodlife.com
                </a>
                <a
                  className="w-fit underline decoration-[#142e2a]/30 underline-offset-4 transition-colors hover:text-[#142e2a] hover:decoration-[#142e2a]"
                  href="tel:01494424435"
                >
                  01494 424435
                </a>
                <a
                  className="w-fit underline decoration-[#142e2a]/30 underline-offset-4 transition-colors hover:text-[#142e2a] hover:decoration-[#142e2a]"
                  href="https://wa.me/447756099075"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: 07756 099075
                </a>
              </div>
              <Link
                href="/support"
                className="mt-6 inline-flex h-[48px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
              >
                Visit our Support centre
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
