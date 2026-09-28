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
import SectionControl from "../SectionControl";
import { TextStyleCtx, type TextStyleApi } from "../TextStyleContext";
import { FeatureGridEditor, RepeatedText, UspEditor } from "../TreatmentBlocks";
import { useDirty } from "../useDirty";

/**
 * Editor for /period-delay, in page order.
 *
 * The hero is the period delay row of the treatments document, which is also
 * the period delay band on the home page - one set of words, colours and
 * sizes for both. The trust strip, feature panel and questions are on the
 * document the treatment pages share. Each document is written back whole
 * with only the period delay parts replaced.
 */

/** The hero's text sizes live on the treatments document, keyed per band. */
const HERO_PREFIX = "period-delay.";

function CardHead({ title, note, control }: { title: string; note?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h2>
        {note ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{note}</p> : null}
      </div>
      {control}
    </div>
  );
}

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

  // Colours and sizes, one map per document.
  const [heroLook, setHeroLook] = useState(look);
  const [sharedStyles, setSharedStyles] = useState(shared.styles);
  const [sharedText, setSharedText] = useState<Record<string, TextStyle>>(shared.textStyles);

  // One "Aa" context for the whole screen: hero keys go to the treatments
  // document, everything else to the shared one. The key sets do not overlap.
  const textStyleApi: TextStyleApi = {
    get: (k) => (k.startsWith(HERO_PREFIX) ? heroLook.textStyles[k] : sharedText[k]),
    set: (k) => (next) =>
      k.startsWith(HERO_PREFIX)
        ? setHeroLook((l) => ({ ...l, textStyles: { ...l.textStyles, [k]: next } }))
        : setSharedText((t) => ({ ...t, [k]: next })),
  };
  const sharedControl = (k: keyof CategoryPageContent["styles"]) => (
    <SectionControl
      sectionKey={k}
      value={sharedStyles[k]}
      onChange={(next) => setSharedStyles((s) => ({ ...s, [k]: next }))}
    />
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The treatments document exactly as the Treatments screen would save it,
  // with only the period delay row and its look replaced.
  const treatmentsPayload = {
    styles: heroLook.styles,
    textStyles: heroLook.textStyles,
    categories: rows.map((r, i) => {
      const row = i === pdIndex ? hero : r;
      return { ...row, bullets: row.bullets.filter((b) => b.trim()) };
    }),
  };
  const sharedPayload = {
    ...shared,
    styles: sharedStyles,
    textStyles: sharedText,
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
    <TextStyleCtx.Provider value={textStyleApi}>
      <div className="mx-auto w-full max-w-[1000px]">
        <header className="mb-6">
          <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Period delay page</h1>
          <p className="mt-1 text-[14px] text-[#616161]">
            Live at{" "}
            <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/period-delay</code>{" "}
            — the sections below are in the order they appear. &ldquo;How it works&rdquo;,
            the reviews and the closing banner on this page are the Home page&apos;s
            sections — edit them under{" "}
            <Link href="/cms/home" className="underline underline-offset-2">
              Home page
            </Link>
            .
          </p>
        </header>

        <div className="space-y-5">
          {/* 1. Hero */}
          <div className={cmsCard}>
            <CardHead
              title="1. Hero"
              note="These words, colours and sizes are also the period delay band on the home page — changing them here changes both."
              control={
                <SectionControl
                  sectionKey="period-delay"
                  value={heroLook.styles["period-delay"]}
                  onChange={(next) =>
                    setHeroLook((l) => ({ ...l, styles: { ...l.styles, "period-delay": next } }))
                  }
                />
              }
            />
            <TextField tsKey="period-delay.eyebrow" label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField tsKey="period-delay.title" label="Title" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} />
              <TextField
                tsKey="period-delay.titleAccent"
                label="Title (italic part)"
                value={hero.titleAccent}
                onChange={(v) => setHero({ ...hero, titleAccent: v })}
              />
            </div>
            <AreaField
              tsKey="period-delay.blurb"
              label="Line under the hero"
              rows={2}
              value={hero.blurb}
              onChange={(v) => setHero({ ...hero, blurb: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                tsKey="period-delay.ctaLabel"
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
            <CardHead title="2. Trust strip" control={sharedControl("uspStrip")} />
            <UspEditor items={usp} onChange={setUsp} />
          </div>

          {/* 3. Feature panel */}
          <div className={cmsCard}>
            <CardHead title="3. Feature panel" control={sharedControl("featureGrid")} />
            <FeatureGridEditor value={features} onChange={setFeatures} />
          </div>

          {/* 4. Questions */}
          <div className={cmsCard}>
            <CardHead
              title="4. Frequently asked questions"
              note="The heading, colours and sizes here are shared with the questions on the ED page."
              control={sharedControl("faqs")}
            />
            <RepeatedText
              items={[
                ["faqs.question", "Questions"],
                ["faqs.answer", "Answers"],
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField tsKey="faqs.heading" label="Heading" value={faqHeading} onChange={setFaqHeading} />
              <TextField tsKey="faqs.headingAccent" label="Heading (italic part)" value={faqAccent} onChange={setFaqAccent} />
            </div>
            <div className="flex justify-end">
              <button type="button" className={cmsAddBtn} onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>
                + Add question
              </button>
            </div>
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
    </TextStyleCtx.Provider>
  );
}
