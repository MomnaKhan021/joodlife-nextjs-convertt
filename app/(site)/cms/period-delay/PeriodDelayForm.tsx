"use client";

import Link from "next/link";
import { useState } from "react";

import type { CategoryPageContent, Faq } from "@/lib/categoryPageContentTypes";
import type { SectionStyle } from "@/lib/sectionStyle";
import type { TextStyle } from "@/lib/textStyle";
import type { TreatmentRow } from "@/lib/treatmentContentTypes";

import {
  AreaField,
  cmsAddBtn,
  cmsCard,
  PictureField,
  RowTools,
  TextField,
  moved,
} from "../FormKit";
import { saveGlobal } from "../LinkFields";
import SaveBar from "../SaveBar";
import { FeatureGridEditor, UspEditor } from "../TreatmentBlocks";
import { useDirty } from "../useDirty";

/**
 * Editor for /period-delay, in page order.
 *
 * The hero is the period delay row of the treatments document, which is also
 * the period delay band on the home page - one set of words for both. The
 * trust strip, feature panel and questions are on the document the treatment
 * pages share. Each document is written back whole with only the period
 * delay parts replaced.
 */
export default function PeriodDelayForm({
  rows,
  look,
  shared,
}: {
  rows: TreatmentRow[];
  look: { styles: Record<string, SectionStyle>; textStyles: Record<string, TextStyle> };
  shared: CategoryPageContent;
}) {
  const pdIndex = rows.findIndex((r) => r.key === "period-delay");
  const [hero, setHero] = useState<TreatmentRow>(rows[pdIndex]);
  const [usp, setUsp] = useState(shared.uspStrip.items);
  const [features, setFeatures] = useState(shared.featureGrid);
  const [faqHeading, setFaqHeading] = useState(shared.faqs.heading);
  const [faqAccent, setFaqAccent] = useState(shared.faqs.headingAccent);
  const [faqs, setFaqs] = useState<Faq[]>(shared.faqs.periodDelay);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The treatments document exactly as the Treatments screen would save it,
  // with only the period delay row replaced.
  const treatmentsPayload = {
    styles: look.styles,
    textStyles: look.textStyles,
    categories: rows.map((r, i) => {
      const row = i === pdIndex ? hero : r;
      return { ...row, bullets: row.bullets.filter((b) => b.trim()) };
    }),
  };
  const sharedPayload = {
    ...shared,
    uspStrip: { items: usp.filter((u) => u.label.trim()) },
    featureGrid: { ...features, features: features.features.filter((f) => f.title.trim()) },
    faqs: {
      ...shared.faqs,
      heading: faqHeading,
      headingAccent: faqAccent,
      periodDelay: faqs.filter((f) => f.q.trim() && f.a.trim()),
    },
  };
  const { dirty, markSaved } = useDirty(JSON.stringify({ treatmentsPayload, sharedPayload }));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("treatments", treatmentsPayload);
      await saveGlobal("category-pages", sharedPayload);
      setSaved(true);
      markSaved();
      window.setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (pdIndex < 0) {
    return <p className="text-[13px] text-[#8a2b2b]">The period delay row is missing.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6">
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Period delay page</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/period-delay</code>{" "}
          — the sections below are in the order they appear. &ldquo;How it works&rdquo;, the reviews
          and the closing banner on this page are the Home page&apos;s sections — edit them
          under{" "}
          <Link href="/cms/home" className="underline underline-offset-2">
            Home page
          </Link>
          .
        </p>
      </header>

      <div className="space-y-5">
        {/* 1. Hero */}
        <div className={cmsCard}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">1. Hero</h2>
          <p className="-mt-2 text-[12px] text-[#8a8a8a]">
            These words are also the period delay band on the home page — changing them
            here changes both.
          </p>
          <TextField label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Title" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} />
            <TextField
              label="Title (italic part)"
              value={hero.titleAccent}
              onChange={(v) => setHero({ ...hero, titleAccent: v })}
            />
          </div>
          <AreaField
            label="Line under the hero"
            rows={2}
            value={hero.blurb}
            onChange={(v) => setHero({ ...hero, blurb: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Button text"
              value={hero.ctaLabel}
              onChange={(v) => setHero({ ...hero, ctaLabel: v })}
              placeholder="Get Started"
            />
            <TextField
              label="“Learn More” link"
              value={hero.learnMoreHref}
              onChange={(v) => setHero({ ...hero, learnMoreHref: v })}
              placeholder={hero.href}
            />
          </div>
          <PictureField
            label="Portrait"
            src={hero.heroImage}
            onSrc={(v) => setHero({ ...hero, heroImage: v })}
            alt={hero.imageAlt}
            onAlt={(v) => setHero({ ...hero, imageAlt: v })}
          />
        </div>

        {/* 2. Trust strip */}
        <div className={cmsCard}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">2. Trust strip</h2>
          <UspEditor items={usp} onChange={setUsp} />
        </div>

        {/* 3. Feature panel */}
        <div className={cmsCard}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">3. Feature panel</h2>
          <FeatureGridEditor value={features} onChange={setFeatures} />
        </div>

        {/* 4. Questions */}
        <div className={cmsCard}>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">4. Frequently asked questions</h2>
            <button type="button" className={cmsAddBtn} onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>
              + Add question
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Heading" value={faqHeading} onChange={setFaqHeading} />
            <TextField label="Heading (italic part)" value={faqAccent} onChange={setFaqAccent} />
          </div>
          <p className="-mt-2 text-[12px] text-[#8a8a8a]">
            The heading is shared with the questions on the ED page.
          </p>
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
              <RowTools
                title="Question"
                index={i}
                count={faqs.length}
                onMove={(dir) => setFaqs(moved(faqs, i, dir))}
                onRemove={() => setFaqs(faqs.filter((_, j) => j !== i))}
              />
              <TextField
                label="Question"
                value={f.q}
                onChange={(v) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, q: v } : x)))}
              />
              <div className="mt-3">
                <AreaField
                  label="Answer"
                  rows={3}
                  value={f.a}
                  onChange={(v) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, a: v } : x)))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SaveBar
        onSave={() => void save()}
        saving={saving}
        dirty={dirty}
        saved={saved}
        error={error}
        label="Save period delay page"
        viewHref="/period-delay"
      />
    </div>
  );
}
