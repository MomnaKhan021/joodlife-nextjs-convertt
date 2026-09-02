"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  SUPPORT_FAQ_DEFAULT,
  type FaqItem as QA,
  type SupportFaqContent,
} from "@/lib/supportContentTypes";

/**
 * Interactive FAQ block for the Support page.
 *
 * Mirrors the Figma design: a row of category filter pills across the top,
 * then a set of themed sections. Each section has a two-word heading with the
 * second word in serif italic, a "Get In Touch" button, and an accordion list
 * of questions on the right. Selecting a filter pill scrolls focus to the
 * matching section list.
 *
 * Presentational — the content arrives as a prop from the server page, which
 * reads it from the Support global. The shipped copy is the default, so the
 * block still renders on its own.
 */

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

export default function SupportFaq({
  content = SUPPORT_FAQ_DEFAULT,
}: {
  content?: SupportFaqContent;
}) {
  const SECTIONS = content.sections;
  const [activePill, setActivePill] = useState<string>("all");
  // Track open item as "sectionId:index" so each section manages one open row.
  const [openKey, setOpenKey] = useState<string | null>(
    SECTIONS.length ? `${SECTIONS[0].id}:0` : null,
  );

  const visibleSections = useMemo(
    () =>
      activePill === "all"
        ? SECTIONS
        : SECTIONS.filter((s) => s.id === activePill),
    [activePill, SECTIONS],
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
            label={content.allLabel}
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
                {content.ctaLabel ? (
                  <a
                    href={content.ctaHref}
                    {...(/^https?:\/\//i.test(content.ctaHref)
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="mt-6 inline-flex h-[46px] items-center justify-center rounded-lg bg-[#142e2a] px-8 font-ui text-[14px] font-semibold text-white transition-colors hover:bg-[#0c2421]"
                  >
                    {content.ctaLabel}
                  </a>
                ) : null}
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
