import Link from "next/link";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import {
  POLICY_CONTACT_DEFAULT,
  POLICY_EYEBROW_DEFAULT,
  type PolicyContact,
} from "@/lib/policyDefaults";
import Footer from "@/sections/home/Footer";
import type {
  PolicyStyleKey,
  PolicyTextKey,
} from "@/lib/policyContentTypes";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";
import { textStyleProps, type TextStyle } from "@/lib/textStyle";

type PolicyText = Partial<Record<PolicyTextKey, TextStyle>>;

/**
 * Shared branded shell for JoodLife policy pages
 * (Terms, Refund & Complaints, Privacy & Cookies).
 *
 * These pages replace the old off-site links that pointed at
 * joodlife.com — everything now lives on joodlife.shop with the
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

function Blocks({
  blocks,
  text = {},
}: {
  blocks: PolicyBlock[];
  text?: PolicyText;
}) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h") {
          return (
            <h3
              key={i}
              {...textStyleProps(text.subHeading)}
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
                  {...textStyleProps(text.listItem)}
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
            {...textStyleProps(text.paragraph)}
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
  textStyles = {},
  styles,
  title,
  titleAccent,
  intro,
  updated,
  sections,
  eyebrow = POLICY_EYEBROW_DEFAULT,
  contact = POLICY_CONTACT_DEFAULT,
}: {
  title: string;
  titleAccent?: string;
  intro: string;
  updated: string;
  /** Per-text size/weight — optional so a bare render stays unchanged. */
  textStyles?: PolicyText;
  /** Per-section appearance — optional for the same reason. */
  styles?: Partial<Record<PolicyStyleKey, SectionStyle>>;
  sections: PolicySection[];
  /** Small label above the title. */
  eyebrow?: string;
  /** The help card at the foot of the page. */
  contact?: PolicyContact;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />

      <main className="w-full bg-white">
        {/* ───── Hero ───── */}
        <section {...styleProps(styles?.hero)} className="w-full bg-[#f7f9f2]">
          <div className="mx-auto w-full max-w-[860px] px-6 pb-12 pt-12 md:px-10 md:pb-16 md:pt-16">
            <p {...textStyleProps(textStyles.eyebrow)} className="font-ui text-[13px] font-semibold uppercase tracking-[0.14em] text-[#142e2a]/55">
              {eyebrow}
            </p>
            <h1 {...textStyleProps(textStyles.title)} className="mt-3 font-display text-[34px] font-bold leading-[1.06] tracking-[-0.02em] text-[#142e2a] md:text-[52px]">
              {title}
              {titleAccent ? (
                <>
                  {" "}
                  <em {...textStyleProps(textStyles.titleAccent)} className="font-serif font-normal italic">
                    {titleAccent}
                  </em>
                </>
              ) : null}
            </h1>
            <p {...textStyleProps(textStyles.intro)} className="mt-4 max-w-[620px] font-ui text-[15px] leading-[25px] text-[#142e2a]/70 md:text-[16.3px]">
              {intro}
            </p>
            <p {...textStyleProps(textStyles.updated)} className="mt-5 font-ui text-[13px] text-[#142e2a]/55">
              Last updated: {updated}
            </p>
          </div>
        </section>

        {/* ───── Body ───── */}
        <section {...styleProps(styles?.body)} className="w-full bg-white">
          <div className="mx-auto w-full max-w-[860px] px-6 py-12 md:px-10 md:py-16">
            <div className="flex flex-col gap-10">
              {sections.map((s) => (
                <div key={s.heading}>
                  <h2 {...textStyleProps(textStyles.sectionHeading)} className="font-display text-[22px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#142e2a] md:text-[26px]">
                    {s.heading}
                  </h2>
                  <div className="mt-2">
                    <Blocks blocks={s.blocks} text={textStyles} />
                  </div>
                </div>
              ))}
            </div>

            {/* Contact / help card */}
            <div {...styleProps(styles?.contact)} className="mt-12 rounded-3xl bg-[#f7f9f2] p-6 md:p-8">
              <h2 {...textStyleProps(textStyles.contactHeading)} className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#142e2a] md:text-[24px]">
                {contact.heading}
              </h2>
              <p {...textStyleProps(textStyles.contactBody)} className="mt-2 font-ui text-[15px] leading-[25px] text-[#142e2a]/75 md:text-[16px]">
                {contact.body}
              </p>
              <div className="mt-4 flex flex-col gap-2 font-ui text-[15px] text-[#142e2a]/80 md:text-[16px]">
                {contact.links.map((l, i) => {
                  // mailto: and tel: stay in-page; a real URL opens away.
                  const external = /^https?:\/\//i.test(l.href);
                  return (
                    <a
                      key={i}
                      className="w-fit underline decoration-[#142e2a]/30 underline-offset-4 transition-colors hover:text-[#142e2a] hover:decoration-[#142e2a]"
                      href={l.href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {l.label}
                    </a>
                  );
                })}
              </div>
              {contact.ctaLabel ? (
                <Link
                  href={contact.ctaHref}
                  className="mt-6 inline-flex h-[48px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
                >
                  {contact.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
