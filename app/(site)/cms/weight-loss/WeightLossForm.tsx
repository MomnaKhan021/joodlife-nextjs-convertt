"use client";

import Link from "next/link";
import { useState } from "react";

import type { UspItem } from "@/lib/categoryPageContentTypes";
import type { SectionStyle, WeightLossStyleKey } from "@/lib/sectionStyle";
import type { TextStyle } from "@/lib/textStyle";
import type {
  WeightLossContent,
  WlChip,
  WlStage,
} from "@/lib/weightLossContentTypes";

import {
  AreaField,
  cmsCard,
  CtaFields,
  PictureField,
  StringList,
  TextField,
} from "../FormKit";
import { fieldLabel, saveGlobal } from "../LinkFields";
import SaveBar from "../SaveBar";
import SectionControl from "../SectionControl";
import { TextStyleCtx } from "../TextStyleContext";
import { FeatureGridEditor, RepeatedText, UspEditor } from "../TreatmentBlocks";
import { useDirty } from "../useDirty";

/**
 * Editor for /weight-loss — the six sections that belong to that page, in
 * the order a reader meets them. The reviews, "How it works", FAQs, blog
 * carousel and closing banner further down are the Home page's sections and
 * are edited there.
 *
 * Every text has its size and weight control beside its field ("Aa"); texts
 * repeated in a list share one, in the bar at the top of their section. Each
 * section's colours sit in the corner of its card.
 */

const CHIP_SIDE = ["Left, top", "Left, middle", "Left, bottom", "Right, top", "Right, middle", "Right, bottom"];
const BADGE_ICON = ["Price tag", "Person", "Headset"];

/** A heading written as three runs: plain, serif italic, plain. */
function ThreePart({
  label,
  lead,
  accent,
  tail,
  onLead,
  onAccent,
  onTail,
  keys,
}: {
  label: string;
  lead: string;
  accent: string;
  tail: string;
  onLead: (v: string) => void;
  onAccent: (v: string) => void;
  onTail: (v: string) => void;
  /** Text-style keys for the three runs. */
  keys: [string, string, string];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TextField tsKey={keys[0]} label={label} value={lead} onChange={onLead} />
      <TextField tsKey={keys[1]} label="Italic part" value={accent} onChange={onAccent} />
      <TextField tsKey={keys[2]} label="After the italic" value={tail} onChange={onTail} />
    </div>
  );
}

function SectionHead({
  n,
  title,
  note,
  control,
}: {
  n: number;
  title: string;
  note?: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">
          {n}. {title}
        </h2>
        {note ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{note}</p> : null}
      </div>
      {control}
    </div>
  );
}

export default function WeightLossForm({ initial }: { initial: WeightLossContent }) {
  const [hero, setHero] = useState(initial.hero);
  const [usp, setUsp] = useState<UspItem[]>(initial.usp.items);
  const [bmi, setBmi] = useState(initial.bmi);
  const [journey, setJourney] = useState(initial.journey);
  const [features, setFeatures] = useState(initial.features);
  const [quiz, setQuiz] = useState(initial.quiz);

  const [styles, setStyles] = useState<Record<WeightLossStyleKey, SectionStyle>>(initial.styles);
  const control = (k: WeightLossStyleKey) => (
    <SectionControl
      sectionKey={k}
      value={styles[k]}
      onChange={(next) => setStyles((prev) => ({ ...prev, [k]: next }))}
    />
  );
  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>(initial.textStyles);
  const textStyleApi = {
    get: (k: string) => textStyles[k],
    set: (k: string) => (next: TextStyle) => setTextStyles((t) => ({ ...t, [k]: next })),
  };

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStage = (i: number, patch: Partial<WlStage>) =>
    setJourney({
      ...journey,
      stages: journey.stages.map((s, j) => (j === i ? { ...s, ...patch } : s)),
    });
  const setChip = (i: number, patch: Partial<WlChip>) =>
    setJourney({
      ...journey,
      chips: journey.chips.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    });

  // What Save would send; compared with what the screen loaded with.
  const payload = {
    styles,
    textStyles,
    hero: { ...hero, bullets: hero.bullets.filter((b) => b.trim()) },
    usp: { items: usp.filter((u) => u.label.trim()) },
    bmi,
    journey,
    features: {
      ...features,
      features: features.features.filter((f) => f.title.trim()),
    },
    quiz: { ...quiz, weightLabels: quiz.weightLabels.filter((w) => w.trim()) },
  };
  const { dirty, markSaved } = useDirty(JSON.stringify(payload));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("weight-loss-page", payload);
      setSaved(true);
      markSaved();
      window.setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TextStyleCtx.Provider value={textStyleApi}>
      <div className="mx-auto w-full max-w-[1000px]">
        <header className="mb-6">
          <Link
            href="/cms"
            className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Weight loss page</h1>
          <p className="mt-1 text-[14px] text-[#616161]">
            Live at{" "}
            <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/weight-loss</code>{" "}
            — the sections below are in the order they appear. The reviews, &ldquo;How it
            works&rdquo;, FAQs, blog and closing banner further down the page are the
            Home page&apos;s sections — edit them under{" "}
            <Link href="/cms/home" className="underline underline-offset-2">
              Home page
            </Link>
            .
          </p>
        </header>

        <div className="space-y-5">
          {/* 1. Hero */}
          <div className={cmsCard}>
            <SectionHead n={1} title="Hero" note="The colour here is the dark card." control={control("hero")} />
            <RepeatedText items={[["hero.bullet", "Tick list"]]} />
            <TextField
              tsKey="hero.reviewsLabel"
              label="Trustpilot line"
              value={hero.reviewsLabel}
              onChange={(v) => setHero({ ...hero, reviewsLabel: v })}
            />
            <ThreePart
              label="Title"
              keys={["hero.title", "hero.titleAccent", "hero.titleTail"]}
              lead={hero.titleLead}
              accent={hero.titleAccent}
              tail={hero.titleTail}
              onLead={(v) => setHero({ ...hero, titleLead: v })}
              onAccent={(v) => setHero({ ...hero, titleAccent: v })}
              onTail={(v) => setHero({ ...hero, titleTail: v })}
            />
            <p className="-mt-2 text-[12px] text-[#8a8a8a]">
              The part after the italic starts a new line.
            </p>
            <StringList
              items={hero.bullets}
              onChange={(bullets) => setHero({ ...hero, bullets })}
              label="Tick list"
              addLabel="+ Add line"
            />
            <CtaFields
              labelKey="hero.ctaLabel"
              title="First button"
              label={hero.ctaLabel}
              href={hero.ctaHref}
              onLabel={(v) => setHero({ ...hero, ctaLabel: v })}
              onHref={(v) => setHero({ ...hero, ctaHref: v })}
            />
            <CtaFields
              labelKey="hero.secondaryLabel"
              title="Second button"
              label={hero.secondaryLabel}
              href={hero.secondaryHref}
              onLabel={(v) => setHero({ ...hero, secondaryLabel: v })}
              onHref={(v) => setHero({ ...hero, secondaryHref: v })}
            />
            <p className="-mt-2 text-[12px] text-[#8a8a8a]">
              The second button shows on larger screens only, as it always has.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <PictureField
                label="Photo — desktop"
                src={hero.image}
                onSrc={(v) => setHero({ ...hero, image: v })}
              />
              <PictureField
                label="Photo — phone"
                src={hero.mobileImage}
                onSrc={(v) => setHero({ ...hero, mobileImage: v })}
              />
            </div>
          </div>

          {/* 2. Trust strip */}
          <div className={cmsCard}>
            <SectionHead
              n={2}
              title="Trust strip"
              note="The scrolling line of reassurances under the hero."
              control={control("uspStrip")}
            />
            <UspEditor items={usp} onChange={setUsp} />
          </div>

          {/* 3. BMI calculator */}
          <div className={cmsCard}>
            <SectionHead
              n={3}
              title="BMI calculator"
              note="The words around the calculator. The calculation itself does not change."
              control={control("bmi")}
            />
            <RepeatedText items={[["bmi.badge", "Pills over the photo"]]} />
            <ThreePart
              label="Heading"
              keys={["bmi.heading", "bmi.headingAccent", "bmi.headingTail"]}
              lead={bmi.heading}
              accent={bmi.headingAccent}
              tail={bmi.headingTail}
              onLead={(v) => setBmi({ ...bmi, heading: v })}
              onAccent={(v) => setBmi({ ...bmi, headingAccent: v })}
              onTail={(v) => setBmi({ ...bmi, headingTail: v })}
            />
            <AreaField tsKey="bmi.body" label="Intro" rows={2} value={bmi.body} onChange={(v) => setBmi({ ...bmi, body: v })} />
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField tsKey="bmi.calcTitle" label="Calculator title" value={bmi.calcTitle} onChange={(v) => setBmi({ ...bmi, calcTitle: v })} />
              <TextField tsKey="bmi.calcSubtitle" label="Calculator subtitle" value={bmi.calcSubtitle} onChange={(v) => setBmi({ ...bmi, calcSubtitle: v })} />
              <TextField tsKey="bmi.buttonLabel" label="Button text" value={bmi.buttonLabel} onChange={(v) => setBmi({ ...bmi, buttonLabel: v })} />
            </div>
            <PictureField
              label="Middle photo"
              src={bmi.image}
              onSrc={(v) => setBmi({ ...bmi, image: v })}
              alt={bmi.imageAlt}
              onAlt={(v) => setBmi({ ...bmi, imageAlt: v })}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              {bmi.badges.map((b, i) => (
                <TextField
                  key={i}
                  label={`Pill ${i + 1} (${BADGE_ICON[i] ?? "icon"})`}
                  value={b}
                  onChange={(v) =>
                    setBmi({ ...bmi, badges: bmi.badges.map((x, j) => (j === i ? v : x)) })
                  }
                />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField tsKey="bmi.loseTitle" label="Right card title" value={bmi.loseTitle} onChange={(v) => setBmi({ ...bmi, loseTitle: v })} />
              <TextField tsKey="bmi.startTitle" label="Slider title" value={bmi.startTitle} onChange={(v) => setBmi({ ...bmi, startTitle: v })} />
            </div>
          </div>

          {/* 4. Journey */}
          <div className={cmsCard}>
            <SectionHead
              n={4}
              title="Your journey"
              note="The timeline, the photo under it, and the two cards. The colour here is the dark background."
              control={control("journey")}
            />
            <RepeatedText
              items={[
                ["journey.stagePill", "Stage pills"],
                ["journey.stageTitle", "Stage titles"],
                ["journey.stageBody", "Stage text"],
                ["journey.chipLabel", "Chip labels"],
                ["journey.chipSub", "Chip small lines"],
              ]}
            />
            <TextField tsKey="journey.badge" label="Badge" value={journey.badge} onChange={(v) => setJourney({ ...journey, badge: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField tsKey="journey.heading" label="Heading — desktop" value={journey.heading} onChange={(v) => setJourney({ ...journey, heading: v })} />
              <TextField
                tsKey="journey.headingAccent"
                label="Italic part — desktop"
                value={journey.headingAccent}
                onChange={(v) => setJourney({ ...journey, headingAccent: v })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <TextField label="Heading — phone" value={journey.mobileHeading} onChange={(v) => setJourney({ ...journey, mobileHeading: v })} />
              <TextField
                label="Italic part"
                value={journey.mobileHeadingAccent}
                onChange={(v) => setJourney({ ...journey, mobileHeadingAccent: v })}
              />
              <TextField
                label="After the italic"
                value={journey.mobileHeadingTail}
                onChange={(v) => setJourney({ ...journey, mobileHeadingTail: v })}
              />
            </div>
            <p className="-mt-2 text-[12px] text-[#8a8a8a]">
              The phone heading uses the same sizes as the desktop one.
            </p>
            <p className={fieldLabel}>Stages</p>
            <p className="-mt-3 text-[12px] text-[#8a8a8a]">
              The timeline is drawn for three stages.
            </p>
            {journey.stages.map((s, i) => (
              <div key={i} className="grid gap-3 rounded-lg border border-[#eef1e8] p-3 sm:grid-cols-2">
                <TextField label={`Stage ${i + 1} — pill`} value={s.pill} onChange={(v) => setStage(i, { pill: v })} />
                <TextField label="Title" value={s.title} onChange={(v) => setStage(i, { title: v })} />
                <AreaField label="Text — desktop" rows={2} value={s.body} onChange={(v) => setStage(i, { body: v })} />
                <AreaField label="Text — phone" rows={2} value={s.mobileBody} onChange={(v) => setStage(i, { mobileBody: v })} />
              </div>
            ))}
            <PictureField
              label="Photo over the curve"
              src={journey.image}
              onSrc={(v) => setJourney({ ...journey, image: v })}
              alt={journey.imageAlt}
              onAlt={(v) => setJourney({ ...journey, imageAlt: v })}
            />

            <div className="space-y-4 rounded-lg border border-[#e8ece0] bg-white p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                Left card — transformation
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField tsKey="journey.transformTitle" label="Heading" value={journey.transformTitle} onChange={(v) => setJourney({ ...journey, transformTitle: v })} />
                <TextField
                  tsKey="journey.transformAccent"
                  label="Italic line"
                  value={journey.transformAccent}
                  onChange={(v) => setJourney({ ...journey, transformAccent: v })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <AreaField tsKey="journey.transformBody" label="Text" rows={2} value={journey.transformBody} onChange={(v) => setJourney({ ...journey, transformBody: v })} />
                <AreaField
                  tsKey="journey.transformBodyAccent"
                  label="Green highlight after it"
                  rows={2}
                  value={journey.transformBodyAccent}
                  onChange={(v) => setJourney({ ...journey, transformBodyAccent: v })}
                />
              </div>
              <p className={fieldLabel}>Chips around the photo</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {journey.chips.map((c, i) => (
                  <div key={i} className="grid gap-2 rounded-lg border border-[#eef1e8] p-3 sm:grid-cols-2">
                    <TextField label={`${CHIP_SIDE[i] ?? `Chip ${i + 1}`}`} value={c.label} onChange={(v) => setChip(i, { label: v })} />
                    <TextField label="Small line" value={c.sub} onChange={(v) => setChip(i, { sub: v })} />
                  </div>
                ))}
              </div>
              <PictureField
                label="Photo"
                src={journey.transformImage}
                onSrc={(v) => setJourney({ ...journey, transformImage: v })}
                alt={journey.transformImageAlt}
                onAlt={(v) => setJourney({ ...journey, transformImageAlt: v })}
              />
              <CtaFields
                labelKey="journey.transformCta"
                label={journey.transformCtaLabel}
                href={journey.transformCtaHref}
                onLabel={(v) => setJourney({ ...journey, transformCtaLabel: v })}
                onHref={(v) => setJourney({ ...journey, transformCtaHref: v })}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-[#e8ece0] bg-white p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                Right card — expert guidance
              </p>
              <TextField tsKey="journey.guidanceTitle" label="Heading" value={journey.guidanceTitle} onChange={(v) => setJourney({ ...journey, guidanceTitle: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField tsKey="journey.guidanceNote" label="Left side — small line" value={journey.guidanceNote} onChange={(v) => setJourney({ ...journey, guidanceNote: v })} />
                <TextField tsKey="journey.guidanceLabel" label="Left side — large line" value={journey.guidanceLabel} onChange={(v) => setJourney({ ...journey, guidanceLabel: v })} />
                <TextField tsKey="journey.guidancePill" label="Pill on the phone" value={journey.guidancePill} onChange={(v) => setJourney({ ...journey, guidancePill: v })} />
                <TextField tsKey="journey.guidanceSide" label="Right side" value={journey.guidanceSide} onChange={(v) => setJourney({ ...journey, guidanceSide: v })} />
              </div>
              <PictureField
                label="Phone screen photo"
                src={journey.guidanceImage}
                onSrc={(v) => setJourney({ ...journey, guidanceImage: v })}
                alt={journey.guidanceImageAlt}
                onAlt={(v) => setJourney({ ...journey, guidanceImageAlt: v })}
              />
              <TextField tsKey="journey.guidanceAccent" label="Italic line under the phone" value={journey.guidanceAccent} onChange={(v) => setJourney({ ...journey, guidanceAccent: v })} />
              <div className="grid gap-4 sm:grid-cols-3">
                <AreaField tsKey="journey.guidanceBody" label="Text" rows={2} value={journey.guidanceBody} onChange={(v) => setJourney({ ...journey, guidanceBody: v })} />
                <AreaField
                  tsKey="journey.guidanceBodyAccent"
                  label="Green highlight"
                  rows={2}
                  value={journey.guidanceBodyAccent}
                  onChange={(v) => setJourney({ ...journey, guidanceBodyAccent: v })}
                />
                <AreaField
                  label="After the highlight"
                  rows={2}
                  value={journey.guidanceBodyTail}
                  onChange={(v) => setJourney({ ...journey, guidanceBodyTail: v })}
                  hint="Same size as the text."
                />
              </div>
              <CtaFields
                labelKey="journey.guidanceCta"
                label={journey.guidanceCtaLabel}
                href={journey.guidanceCtaHref}
                onLabel={(v) => setJourney({ ...journey, guidanceCtaLabel: v })}
                onHref={(v) => setJourney({ ...journey, guidanceCtaHref: v })}
              />
            </div>
          </div>

          {/* 5. Feature panel */}
          <div className={cmsCard}>
            <SectionHead
              n={5}
              title="Feature panel"
              note="The dark panel with the grid of features."
              control={control("featureGrid")}
            />
            <FeatureGridEditor value={features} onChange={setFeatures} />
          </div>

          {/* 6. Quiz banner */}
          <div className={cmsCard}>
            <SectionHead n={6} title="Let's get to know you" control={control("quiz")} />
            <RepeatedText items={[["quiz.weightLabel", "Labels under the bar"]]} />
            <ThreePart
              label="Heading"
              keys={["quiz.heading", "quiz.headingAccent", "quiz.headingTail"]}
              lead={quiz.heading}
              accent={quiz.headingAccent}
              tail={quiz.headingTail}
              onLead={(v) => setQuiz({ ...quiz, heading: v })}
              onAccent={(v) => setQuiz({ ...quiz, headingAccent: v })}
              onTail={(v) => setQuiz({ ...quiz, headingTail: v })}
            />
            <AreaField tsKey="quiz.body" label="Intro" rows={2} value={quiz.body} onChange={(v) => setQuiz({ ...quiz, body: v })} />
            <div className="space-y-4 rounded-lg border border-[#e8ece0] bg-white p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Left card</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField tsKey="quiz.planLabel" label="Small card label" value={quiz.planLabel} onChange={(v) => setQuiz({ ...quiz, planLabel: v })} />
                <TextField tsKey="quiz.question" label="Question on the white card" value={quiz.question} onChange={(v) => setQuiz({ ...quiz, question: v })} />
              </div>
              <AreaField tsKey="quiz.cardBody" label="Text" rows={2} value={quiz.cardBody} onChange={(v) => setQuiz({ ...quiz, cardBody: v })} />
              <CtaFields
                labelKey="quiz.ctaLabel"
                label={quiz.ctaLabel}
                href={quiz.ctaHref}
                onLabel={(v) => setQuiz({ ...quiz, ctaLabel: v })}
                onHref={(v) => setQuiz({ ...quiz, ctaHref: v })}
              />
            </div>
            <div className="space-y-4 rounded-lg border border-[#e8ece0] bg-white p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">Right card</p>
              <PictureField
                label="Photo"
                src={quiz.image}
                onSrc={(v) => setQuiz({ ...quiz, image: v })}
                alt={quiz.imageAlt}
                onAlt={(v) => setQuiz({ ...quiz, imageAlt: v })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField tsKey="quiz.pill" label="Pill" value={quiz.pill} onChange={(v) => setQuiz({ ...quiz, pill: v })} />
                <TextField tsKey="quiz.progressText" label="Progress text" value={quiz.progressText} onChange={(v) => setQuiz({ ...quiz, progressText: v })} />
                <TextField tsKey="quiz.progressLabel" label="Figure label" value={quiz.progressLabel} onChange={(v) => setQuiz({ ...quiz, progressLabel: v })} />
                <TextField tsKey="quiz.progressValue" label="Figure" value={quiz.progressValue} onChange={(v) => setQuiz({ ...quiz, progressValue: v })} />
              </div>
              <StringList
                items={quiz.weightLabels}
                onChange={(weightLabels) => setQuiz({ ...quiz, weightLabels })}
                label="Labels under the bar"
                addLabel="+ Add label"
              />
            </div>
          </div>
        </div>

        <SaveBar
          onSave={() => void save()}
          saving={saving}
          dirty={dirty}
          saved={saved}
          error={error}
          label="Save weight loss page"
          viewHref="/weight-loss"
        />

        <p className="mt-3 text-[12px] text-[#8a8a8a]">
          Clearing a heading or a paragraph brings back the wording the page
          ships with. Clearing a button&apos;s text hides the button, and an
          italic part or a line after it can be left empty.
        </p>
      </div>
    </TextStyleCtx.Provider>
  );
}
