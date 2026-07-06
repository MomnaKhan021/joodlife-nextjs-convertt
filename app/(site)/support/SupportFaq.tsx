"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Interactive FAQ block for the Support page.
 *
 * Mirrors the Figma design: a row of category filter pills across the top,
 * then a set of themed sections. Each section has a two-word heading with the
 * second word in serif italic, a "Get In Touch" button, and an accordion list
 * of questions on the right. Selecting a filter pill scrolls focus to the
 * matching section list.
 */

type QA = { q: string; a: string };

type FaqSection = {
  /** Filter-pill / anchor id. */
  id: string;
  /** Short pill label (e.g. "About Jood"). */
  pill: string;
  /** First word of the display heading. */
  headStart: string;
  /** Second word — rendered in serif italic. */
  headAccent: string;
  items: QA[];
};

const SECTIONS: FaqSection[] = [
  {
    id: "about-jood",
    pill: "About Jood",
    headStart: "About",
    headAccent: "Jood",
    items: [
      {
        q: "What is Jood?",
        a: "Jood is a fully remote private weight-loss clinic providing clinically guided care through licensed UK prescribers. Our treatments are dispensed from a GPhC-registered pharmacy and delivered discreetly across the UK.",
      },
      {
        q: "Who is behind Jood?",
        a: "Jood is operated by Jood Pharmacy, a GPhC-registered pharmacy. Consultations and prescribing are overseen by UK-registered prescribers and a superintendent pharmacist, so every part of your treatment is clinically supervised.",
      },
      {
        q: "Is Jood a legitimate clinic?",
        a: "Yes. Jood Pharmacy is registered with the General Pharmaceutical Council (9012990) and all medicines are dispensed and delivered in line with GPhC and MHRA guidance.",
      },
    ],
  },
  {
    id: "medication-treatment",
    pill: "Medication & Treatment",
    headStart: "Medication and",
    headAccent: "treatment",
    items: [
      {
        q: "What treatments do you offer?",
        a: "Jood provides access to licensed GLP-1 medications, including Mounjaro (tirzepatide), the Wegovy injection and the Wegovy Pill (oral semaglutide), prescribed only when clinically appropriate. All treatments are reviewed and dispensed safely under prescriber supervision.",
      },
      {
        q: "How do these medications work?",
        a: "GLP-1 medications mimic a hormone your body releases after eating. They help regulate appetite, slow digestion and reduce cravings, making it easier to eat less and lose weight steadily alongside diet and lifestyle changes.",
      },
      {
        q: "Are these medications safe?",
        a: "The medications we prescribe are MHRA-licensed and are only supplied after a UK-registered prescriber has reviewed your full health assessment. Our clinical team monitors your progress and is available if you have any concerns.",
      },
      {
        q: "What if I experience side effects?",
        a: "Mild side effects such as nausea usually ease as your body adjusts. If symptoms persist or worry you, contact our clinical team and they will review your dose and advise on the safest next step.",
      },
      {
        q: "Can I switch between medications?",
        a: "Yes, if your prescriber agrees it is clinically appropriate. We will help review your progress and recommend the best next step for you.",
      },
    ],
  },
  {
    id: "consultations-eligibility",
    pill: "Consultations & Eligibility",
    headStart: "Consultations and",
    headAccent: "eligibility",
    items: [
      {
        q: "Who is eligible for treatment?",
        a: "You may be eligible if your BMI is 30 or higher, or 27 or higher with certain weight-related health conditions. Eligibility is confirmed after completing your online consultation with a UK-licensed prescriber.",
      },
      {
        q: "Do I need a GP referral?",
        a: "No referral is needed. You complete a secure online consultation and, where appropriate, we may contact your GP to help keep your wider care safe and joined up.",
      },
      {
        q: "How does the consultation work?",
        a: "You answer a short set of medical questions online. A UK-registered prescriber reviews your responses to confirm whether treatment is suitable before anything is prescribed or dispensed.",
      },
      {
        q: "How long does approval take?",
        a: "Most consultations are reviewed within one working day. If the prescriber needs more information, they will get in touch before approving your treatment.",
      },
    ],
  },
  {
    id: "delivery-payments",
    pill: "Delivery & Payments",
    headStart: "Delivery and",
    headAccent: "payments",
    items: [
      {
        q: "How will my medication be delivered?",
        a: "All parcels are sent via DPD, arriving in plain, unbranded packaging for complete privacy. You'll receive live tracking updates once your order is shipped.",
      },
      {
        q: "Is delivery free?",
        a: "Yes. Free, discreet delivery is included with your treatment — no names, no logos and no delivery fee.",
      },
      {
        q: "How much does treatment cost?",
        a: "Pricing depends on the medication and dose your prescriber recommends. You'll see the full cost clearly before you check out, with no hidden fees.",
      },
      {
        q: "Can I cancel or pause my plan?",
        a: "Yes — you're always in control of your treatment. You can pause or cancel at any time from your account, with no cancellation charges.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major debit and credit cards, as well as Apple Pay and Google Pay. All payments are processed securely.",
      },
    ],
  },
  {
    id: "support-follow-up",
    pill: "Support & Follow-up",
    headStart: "Support and",
    headAccent: "follow-up",
    items: [
      {
        q: "What kind of support will I receive?",
        a: "Your care doesn't stop at delivery. You'll receive ongoing access to Jood clinicians and health coaches for check-ins, motivation and progress tracking.",
      },
      {
        q: "Can I speak to someone directly?",
        a: "Yes. You can message our care team through your account or get in touch by phone and email, and a clinician will respond to any clinical questions.",
      },
      {
        q: "How do I track my progress?",
        a: "You can log your weight and check-ins through your account. Your care team reviews your progress and adjusts your plan where clinically appropriate.",
      },
      {
        q: "What if I miss an injection?",
        a: "Don't worry — contact our clinical team and they'll advise you on the safest way to get back on schedule. It's never a problem we can't solve.",
      },
      {
        q: "Can I continue treatment long-term?",
        a: "Yes. Many patients continue treatment for as long as it remains clinically beneficial. Your prescriber will review this with you at regular intervals.",
      },
      {
        q: "How is my personal information protected?",
        a: "Your data is handled in line with UK GDPR and stored securely. We only share information where clinically necessary and with your knowledge.",
      },
    ],
  },
];

function PlusIcon({ open }: { open: boolean }) {
  return (
    <span
      className="grid h-7 w-7 shrink-0 place-items-center transition-transform duration-300 ease-out"
      style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
      aria-hidden
    >
      <Image
        src="/assets/figma/faq-plus.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7"
      />
    </span>
  );
}

function AccordionItem({
  qa,
  open,
  onToggle,
  id,
}: {
  qa: QA;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <li className="border-b border-[#142e2a]/12">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        id={`${id}-trigger`}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-ui text-[15px] font-medium leading-[22px] text-[#142e2a] md:text-[16.3px]">
          {qa.q}
        </span>
        <PlusIcon open={open} />
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-[560px] pb-5 font-ui text-[14px] leading-[22px] text-[#142e2a]/70 md:text-[15.5px] md:leading-[24px]">
            {qa.a}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function SupportFaq() {
  const [activePill, setActivePill] = useState<string>("all");
  // Track open item as "sectionId:index" so each section manages one open row.
  const [openKey, setOpenKey] = useState<string | null>(
    `${SECTIONS[0].id}:0`,
  );

  const visibleSections = useMemo(
    () =>
      activePill === "all"
        ? SECTIONS
        : SECTIONS.filter((s) => s.id === activePill),
    [activePill],
  );

  return (
    <section
      id="faq"
      aria-label="Support frequently asked questions"
      className="w-full scroll-mt-28 bg-[#f7f9f2] py-[30px] md:py-10"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 md:px-10 lg:px-[60px]">
        {/* Filter pills */}
        <div className="mb-10 flex flex-wrap items-center gap-2 md:mb-14 md:gap-3">
          <FilterPill
            label="All"
            active={activePill === "all"}
            onClick={() => setActivePill("all")}
          />
          {SECTIONS.map((s) => (
            <FilterPill
              key={s.id}
              label={s.pill}
              active={activePill === s.id}
              onClick={() => setActivePill(s.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-16 md:gap-24">
          {visibleSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="grid scroll-mt-32 gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-16 lg:gap-24"
            >
              <div className="md:pt-1">
                <h3 className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.02em] text-[#142e2a] md:text-[40px]">
                  {section.headStart}{" "}
                  <em className="font-serif font-normal italic">
                    {section.headAccent}
                  </em>
                </h3>
                <Link
                  href="/consultation"
                  className="mt-6 inline-flex h-[46px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
                >
                  Get In Touch
                </Link>
              </div>

              <ul className="flex w-full flex-col border-t border-[#142e2a]/12">
                {section.items.map((qa, i) => {
                  const key = `${section.id}:${i}`;
                  return (
                    <AccordionItem
                      key={key}
                      id={key.replace(":", "-")}
                      qa={qa}
                      open={openKey === key}
                      onToggle={() =>
                        setOpenKey((prev) => (prev === key ? null : key))
                      }
                    />
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 cursor-pointer items-center rounded-full px-4 font-ui text-[13px] font-medium transition-colors md:text-[14px] ${
        active
          ? "bg-[#142e2a] text-white"
          : "bg-white text-[#142e2a] hover:bg-[#142e2a]/5 border border-[#142e2a]/12"
      }`}
    >
      {label}
    </button>
  );
}
