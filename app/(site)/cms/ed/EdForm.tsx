"use client";

import Link from "next/link";
import { useState } from "react";

import {
  BENEFIT_ICONS,
  type BenefitIcon,
  type EdContent,
} from "@/lib/edContentTypes";

import {
  AreaField,
  cmsAddBtn,
  cmsCard,
  CtaFields,
  Pair,
  PictureField,
  Regulated,
  RowTools,
  StringList,
  TextField,
  moved,
} from "../FormKit";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import SectionControl from "../SectionControl";
import {
  type EdStyleKey,
  type SectionStyle,
} from "@/lib/sectionStyle";
import { LabelRow, TextStyleCtx } from "../TextStyleContext";
import type { TextStyle } from "@/lib/textStyle";

/**
 * Editor for /erectile-dysfunction — eight sections, in the order a reader
 * meets them. The questions near the foot of the page are shared with the
 * other treatment pages and live under Treatment pages instead.
 */

const BENEFIT_ICON_LABEL: Record<BenefitIcon, string> = {
  delivery: "Delivery box",
  support: "Clock",
  trusted: "Person",
  effective: "Heart",
  consult: "Message bubble",
  progress: "Chart",
};

export default function EdForm({ initial }: { initial: EdContent }) {
  const [styles, setStyles] = useState<Record<EdStyleKey, SectionStyle>>(
    initial.styles,
  );
  const setStyle = (k: EdStyleKey) => (next: SectionStyle) =>
    setStyles((prev) => ({ ...prev, [k]: next }));
  const [hero, setHero] = useState(initial.hero);
  const [reviews, setReviews] = useState(initial.reviews);
  const [journey, setJourney] = useState(initial.journey);
  const [plan, setPlan] = useState(initial.plan);
  const [steps, setSteps] = useState(initial.steps);
  const [confidence, setConfidence] = useState(initial.confidence);
  const [know, setKnow] = useState(initial.know);
  const [banner, setBanner] = useState(initial.banner);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("ed-page", {
        styles,
        textStyles,
        hero: { ...hero, checks: hero.checks.filter((c) => c.trim()) },
        reviews: {
          ...reviews,
          reviews: reviews.reviews.filter((r) => r.body.trim() && r.name.trim()),
        },
        journey: {
          ...journey,
          stages: journey.stages.filter((s) => s.title.trim()),
          goals: journey.goals.filter((g) => g.trim()),
          testimonials: journey.testimonials.filter(
            (t) => t.quote.trim() && t.name.trim(),
          ),
        },
        plan: { ...plan, benefits: plan.benefits.filter((b) => b.title.trim()) },
        steps: { ...steps, steps: steps.steps.filter((s) => s.title.trim()) },
        confidence: {
          ...confidence,
          paragraphs: confidence.paragraphs.filter((p) => p.trim()),
          checks: confidence.checks.filter((c) => c.trim()),
        },
        know: {
          ...know,
          progressStages: know.progressStages.filter((s) => s.trim()),
        },
        banner,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>(
    initial.textStyles,
  );
  const textStyleApi = {
    get: (k: string) => textStyles[k],
    set: (k: string) => (next: TextStyle) =>
      setTextStyles((t) => ({ ...t, [k]: next })),
  };

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
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Erectile dysfunction page
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">
            /erectile-dysfunction
          </code>{" "}
          — the sections below are in the order they appear. The questions near
          the foot of the page are under{" "}
          <Link
            href="/cms/category-pages"
            className="underline underline-offset-2"
          >
            Treatment pages
          </Link>
          .
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          Saved. Reload the page to see the change.
        </p>
      )}

      <div className="space-y-5">
        {/* 1. Hero */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="hero" value={styles.hero} onChange={setStyle("hero")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">1. Hero</h2>
          <Pair
            firstKey="hero.title"
            secondKey="hero.titleAccent"
            label="Title"
            first={hero.title}
            second={hero.titleAccent}
            onFirst={(v) => setHero({ ...hero, title: v })}
            onSecond={(v) => setHero({ ...hero, titleAccent: v })}
          />
          <TextField
            tsKey="hero.reviewsLabel"
            label="Trustpilot line"
            value={hero.reviewsLabel}
            onChange={(v) => setHero({ ...hero, reviewsLabel: v })}
          />
          <StringList
            items={hero.checks}
            onChange={(checks) => setHero({ ...hero, checks })}
            label="Tick list"
            addLabel="+ Add line"
            placeholder="Private online consultation"
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
          <PictureField
            label="Background photo"
            src={hero.image}
            onSrc={(v) => setHero({ ...hero, image: v })}
            alt={hero.imageAlt}
            onAlt={(v) => setHero({ ...hero, imageAlt: v })}
          />
        </div>

        {/* 2. Review wall */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="reviews" value={styles.reviews} onChange={setStyle("reviews")} />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              2. Review wall
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The swipeable cards under the hero.
            </p>
          </div>
          <Pair
            firstKey="reviews.heading"
            secondKey="reviews.headingAccent"
            label="Heading"
            first={reviews.heading}
            second={reviews.headingAccent}
            onFirst={(v) => setReviews({ ...reviews, heading: v })}
            onSecond={(v) => setReviews({ ...reviews, headingAccent: v })}
          />
          <TextField
            tsKey="reviews.reviewsLabel"
            label="Trustpilot line"
            value={reviews.reviewsLabel}
            onChange={(v) => setReviews({ ...reviews, reviewsLabel: v })}
          />
          <AreaField
            tsKey="reviews.body"
            label="Intro"
            rows={2}
            value={reviews.body}
            onChange={(v) => setReviews({ ...reviews, body: v })}
          />
          <Regulated>
            These are presented to visitors as real patient reviews, each marked
            &ldquo;Verified&rdquo;. Only publish wording a real patient actually
            gave you, and keep a record of where it came from.
          </Regulated>
          <div className="space-y-3">
            {reviews.reviews.map((r, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
              >
                <RowTools
                  title="Review"
                  index={i}
                  count={reviews.reviews.length}
                  onMove={(d) =>
                    setReviews({
                      ...reviews,
                      reviews: moved(reviews.reviews, i, d),
                    })
                  }
                  onRemove={() =>
                    setReviews({
                      ...reviews,
                      reviews: reviews.reviews.filter((_, j) => j !== i),
                    })
                  }
                />
                <input
                  aria-label={`Review ${i + 1} headline`}
                  className={fieldInput}
                  value={r.title}
                  placeholder="Headline (optional)"
                  onChange={(e) =>
                    setReviews({
                      ...reviews,
                      reviews: reviews.reviews.map((x, j) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <textarea
                  aria-label={`Review ${i + 1} text`}
                  rows={3}
                  className={`${fieldInput} mt-2`}
                  value={r.body}
                  onChange={(e) =>
                    setReviews({
                      ...reviews,
                      reviews: reviews.reviews.map((x, j) =>
                        j === i ? { ...x, body: e.target.value } : x,
                      ),
                    })
                  }
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_120px]">
                  <input
                    aria-label={`Review ${i + 1} name`}
                    className={fieldInput}
                    value={r.name}
                    placeholder="Name"
                    onChange={(e) =>
                      setReviews({
                        ...reviews,
                        reviews: reviews.reviews.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Review ${i + 1} initials`}
                    className={fieldInput}
                    value={r.initials}
                    maxLength={2}
                    placeholder="Initials"
                    onChange={(e) =>
                      setReviews({
                        ...reviews,
                        reviews: reviews.reviews.map((x, j) =>
                          j === i
                            ? { ...x, initials: e.target.value.toUpperCase() }
                            : x,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={cmsAddBtn}
            onClick={() =>
              setReviews({
                ...reviews,
                reviews: [
                  ...reviews.reviews,
                  { title: "", body: "", name: "", initials: "" },
                ],
              })
            }
          >
            + Add review
          </button>
        </div>

        {/* 3. Journey */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="journey" value={styles.journey} onChange={setStyle("journey")} />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              3. Journey timeline
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The blue block: timeline, treatment card, goals and testimonials.
            </p>
          </div>
          <TextField
            tsKey="journey.badge"
            label="Pill above the heading"
            value={journey.badge}
            onChange={(v) => setJourney({ ...journey, badge: v })}
          />
          <Pair
            firstKey="journey.heading"
            secondKey="journey.headingAccent"
            label="Heading"
            first={journey.heading}
            second={journey.headingAccent}
            onFirst={(v) => setJourney({ ...journey, heading: v })}
            onSecond={(v) => setJourney({ ...journey, headingAccent: v })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Timeline stages</label>
              <button
                type="button"
                className={cmsAddBtn}
                onClick={() =>
                  setJourney({
                    ...journey,
                    stages: [
                      ...journey.stages,
                      { tag: "", title: "", body: "" },
                    ],
                  })
                }
              >
                + Add stage
              </button>
            </div>
            <div className="space-y-3">
              {journey.stages.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <RowTools
                    title="Stage"
                    index={i}
                    count={journey.stages.length}
                    onMove={(d) =>
                      setJourney({
                        ...journey,
                        stages: moved(journey.stages, i, d),
                      })
                    }
                    onRemove={() =>
                      setJourney({
                        ...journey,
                        stages: journey.stages.filter((_, j) => j !== i),
                      })
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      aria-label={`Stage ${i + 1} when`}
                      className={fieldInput}
                      value={s.tag}
                      placeholder="1–3 MONTHS"
                      onChange={(e) =>
                        setJourney({
                          ...journey,
                          stages: journey.stages.map((x, j) =>
                            j === i ? { ...x, tag: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label={`Stage ${i + 1} title`}
                      className={fieldInput}
                      value={s.title}
                      placeholder="Early results"
                      onChange={(e) =>
                        setJourney({
                          ...journey,
                          stages: journey.stages.map((x, j) =>
                            j === i ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </div>
                  <textarea
                    aria-label={`Stage ${i + 1} body`}
                    rows={2}
                    className={`${fieldInput} mt-2`}
                    value={s.body}
                    onChange={(e) =>
                      setJourney({
                        ...journey,
                        stages: journey.stages.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <PictureField
            label="Cut-out photo"
            src={journey.image}
            onSrc={(v) => setJourney({ ...journey, image: v })}
            alt={journey.imageAlt}
            onAlt={(v) => setJourney({ ...journey, imageAlt: v })}
          />
          <CtaFields
            labelKey="journey.ctaLabel"
            title="First button"
            label={journey.ctaLabel}
            href={journey.ctaHref}
            onLabel={(v) => setJourney({ ...journey, ctaLabel: v })}
            onHref={(v) => setJourney({ ...journey, ctaHref: v })}
          />
          <CtaFields
            labelKey="journey.secondaryLabel"
            title="Second button"
            label={journey.secondaryLabel}
            href={journey.secondaryHref}
            onLabel={(v) => setJourney({ ...journey, secondaryLabel: v })}
            onHref={(v) => setJourney({ ...journey, secondaryHref: v })}
          />

          <div className="border-t border-[#eef1e8] pt-4">
            <p className="mb-2 text-[13px] font-medium text-[#1a1a1a]">
              Treatment card
            </p>
            <AreaField
            tsKey="journey.cardBody"
              label="Body"
              rows={3}
              value={journey.cardBody}
              onChange={(v) => setJourney({ ...journey, cardBody: v })}
            />
            <div className="mt-4">
              <PictureField
                label="Tablet photo"
                src={journey.cardImage}
                onSrc={(v) => setJourney({ ...journey, cardImage: v })}
                alt={journey.cardImageAlt}
                onAlt={(v) => setJourney({ ...journey, cardImageAlt: v })}
              />
            </div>
            <div className="mt-4">
              <CtaFields
            labelKey="journey.cardCtaLabel"
                title="Card button"
                label={journey.cardCtaLabel}
                href={journey.cardCtaHref}
                onLabel={(v) => setJourney({ ...journey, cardCtaLabel: v })}
                onHref={(v) => setJourney({ ...journey, cardCtaHref: v })}
              />
            </div>
          </div>

          <div className="border-t border-[#eef1e8] pt-4">
            <p className="mb-2 text-[13px] font-medium text-[#1a1a1a]">
              Goals card
            </p>
            <TextField
            tsKey="journey.goalsHeading"
              label="Heading"
              value={journey.goalsHeading}
              onChange={(v) => setJourney({ ...journey, goalsHeading: v })}
            />
            <div className="mt-4">
              <StringList
                items={journey.goals}
                onChange={(goals) => setJourney({ ...journey, goals })}
                label="Goal chips"
                addLabel="+ Add goal"
              />
            </div>
            <div className="mt-4">
              <PictureField
                label="Photo"
                src={journey.goalsImage}
                onSrc={(v) => setJourney({ ...journey, goalsImage: v })}
                alt={journey.goalsImageAlt}
                onAlt={(v) => setJourney({ ...journey, goalsImageAlt: v })}
              />
            </div>
          </div>

          <div className="border-t border-[#eef1e8] pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                Testimonials
              </p>
              <button
                type="button"
                className={cmsAddBtn}
                onClick={() =>
                  setJourney({
                    ...journey,
                    testimonials: [
                      ...journey.testimonials,
                      { quote: "", name: "", meta: "" },
                    ],
                  })
                }
              >
                + Add testimonial
              </button>
            </div>
            <Regulated>
              These are shown as real patients describing a prescription
              treatment. Only publish wording a real patient gave you, and keep
              a record of where it came from.
            </Regulated>
            <div className="mt-3 space-y-3">
              {journey.testimonials.map((t, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <RowTools
                    title="Testimonial"
                    index={i}
                    count={journey.testimonials.length}
                    onMove={(d) =>
                      setJourney({
                        ...journey,
                        testimonials: moved(journey.testimonials, i, d),
                      })
                    }
                    onRemove={() =>
                      setJourney({
                        ...journey,
                        testimonials: journey.testimonials.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  />
                  <textarea
                    aria-label={`Testimonial ${i + 1} quote`}
                    rows={3}
                    className={fieldInput}
                    value={t.quote}
                    onChange={(e) =>
                      setJourney({
                        ...journey,
                        testimonials: journey.testimonials.map((x, j) =>
                          j === i ? { ...x, quote: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input
                      aria-label={`Testimonial ${i + 1} name`}
                      className={fieldInput}
                      value={t.name}
                      placeholder="Jordan, 42"
                      onChange={(e) =>
                        setJourney({
                          ...journey,
                          testimonials: journey.testimonials.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label={`Testimonial ${i + 1} detail`}
                      className={fieldInput}
                      value={t.meta}
                      placeholder="2 months into treatment"
                      onChange={(e) =>
                        setJourney({
                          ...journey,
                          testimonials: journey.testimonials.map((x, j) =>
                            j === i ? { ...x, meta: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Treatment plan */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="plan" value={styles.plan} onChange={setStyle("plan")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            4. Treatment plan
          </h2>
          <Pair
            firstKey="plan.heading"
            secondKey="plan.headingAccent"
            label="Heading"
            first={plan.heading}
            second={plan.headingAccent}
            onFirst={(v) => setPlan({ ...plan, heading: v })}
            onSecond={(v) => setPlan({ ...plan, headingAccent: v })}
          />
          <TextField
            tsKey="plan.headingTail"
            label="Words after the italic part"
            value={plan.headingTail}
            onChange={(v) => setPlan({ ...plan, headingTail: v })}
            placeholder="around you"
          />
          <AreaField
            tsKey="plan.body"
            label="Body"
            rows={2}
            value={plan.body}
            onChange={(v) => setPlan({ ...plan, body: v })}
          />
          <CtaFields
            labelKey="plan.ctaLabel"
            title="First button"
            label={plan.ctaLabel}
            href={plan.ctaHref}
            onLabel={(v) => setPlan({ ...plan, ctaLabel: v })}
            onHref={(v) => setPlan({ ...plan, ctaHref: v })}
          />
          <CtaFields
            labelKey="plan.secondaryLabel"
            title="Second button"
            label={plan.secondaryLabel}
            href={plan.secondaryHref}
            onLabel={(v) => setPlan({ ...plan, secondaryLabel: v })}
            onHref={(v) => setPlan({ ...plan, secondaryHref: v })}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Benefit cards</label>
              <button
                type="button"
                className={cmsAddBtn}
                onClick={() =>
                  setPlan({
                    ...plan,
                    benefits: [
                      ...plan.benefits,
                      { title: "", body: "", icon: "delivery" },
                    ],
                  })
                }
              >
                + Add card
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.benefits.map((b, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <RowTools
                    title="Card"
                    index={i}
                    count={plan.benefits.length}
                    onMove={(d) =>
                      setPlan({ ...plan, benefits: moved(plan.benefits, i, d) })
                    }
                    onRemove={() =>
                      setPlan({
                        ...plan,
                        benefits: plan.benefits.filter((_, j) => j !== i),
                      })
                    }
                  />
                  <input
                    aria-label={`Card ${i + 1} title`}
                    className={fieldInput}
                    value={b.title}
                    onChange={(e) =>
                      setPlan({
                        ...plan,
                        benefits: plan.benefits.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Card ${i + 1} body`}
                    className={`${fieldInput} mt-2`}
                    value={b.body}
                    onChange={(e) =>
                      setPlan({
                        ...plan,
                        benefits: plan.benefits.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <select
                    aria-label={`Card ${i + 1} icon`}
                    className={`${fieldInput} mt-2`}
                    value={b.icon}
                    onChange={(e) =>
                      setPlan({
                        ...plan,
                        benefits: plan.benefits.map((x, j) =>
                          j === i
                            ? { ...x, icon: e.target.value as BenefitIcon }
                            : x,
                        ),
                      })
                    }
                  >
                    {BENEFIT_ICONS.map((k) => (
                      <option key={k} value={k}>
                        {BENEFIT_ICON_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Steps */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="steps" value={styles.steps} onChange={setStyle("steps")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            5. How it works
          </h2>
          <Pair
            firstKey="steps.heading"
            secondKey="steps.headingAccent"
            label="Heading"
            first={steps.heading}
            second={steps.headingAccent}
            onFirst={(v) => setSteps({ ...steps, heading: v })}
            onSecond={(v) => setSteps({ ...steps, headingAccent: v })}
          />
          <AreaField
            tsKey="steps.body"
            label="Intro"
            rows={2}
            value={steps.body}
            onChange={(v) => setSteps({ ...steps, body: v })}
          />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Steps</label>
              <button
                type="button"
                className={cmsAddBtn}
                onClick={() =>
                  setSteps({
                    ...steps,
                    steps: [...steps.steps, { step: "", title: "", body: "" }],
                  })
                }
              >
                + Add step
              </button>
            </div>
            <p className="mb-2 text-[12px] text-[#8a8a8a]">
              Each step keeps its own illustration, which follows its position
              rather than its wording.
            </p>
            <div className="space-y-3">
              {steps.steps.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <RowTools
                    title="Step"
                    index={i}
                    count={steps.steps.length}
                    onMove={(d) =>
                      setSteps({ ...steps, steps: moved(steps.steps, i, d) })
                    }
                    onRemove={() =>
                      setSteps({
                        ...steps,
                        steps: steps.steps.filter((_, j) => j !== i),
                      })
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      aria-label={`Step ${i + 1} pill`}
                      className={fieldInput}
                      value={s.step}
                      placeholder="Step 1"
                      onChange={(e) =>
                        setSteps({
                          ...steps,
                          steps: steps.steps.map((x, j) =>
                            j === i ? { ...x, step: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label={`Step ${i + 1} title`}
                      className={fieldInput}
                      value={s.title}
                      placeholder="Health assessment"
                      onChange={(e) =>
                        setSteps({
                          ...steps,
                          steps: steps.steps.map((x, j) =>
                            j === i ? { ...x, title: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </div>
                  <textarea
                    aria-label={`Step ${i + 1} body`}
                    rows={2}
                    className={`${fieldInput} mt-2`}
                    value={s.body}
                    onChange={(e) =>
                      setSteps({
                        ...steps,
                        steps: steps.steps.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          <CtaFields
            labelKey="steps.ctaLabel"
            label={steps.ctaLabel}
            href={steps.ctaHref}
            onLabel={(v) => setSteps({ ...steps, ctaLabel: v })}
            onHref={(v) => setSteps({ ...steps, ctaHref: v })}
          />
        </div>

        {/* 6. Confidence */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="confidence" value={styles.confidence} onChange={setStyle("confidence")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            6. Confidence split
          </h2>
          <TextField
            tsKey="confidence.eyebrow"
            label="Small label above the heading"
            value={confidence.eyebrow}
            onChange={(v) => setConfidence({ ...confidence, eyebrow: v })}
          />
          <Pair
            firstKey="confidence.heading"
            secondKey="confidence.headingAccent"
            label="Heading"
            first={confidence.heading}
            second={confidence.headingAccent}
            onFirst={(v) => setConfidence({ ...confidence, heading: v })}
            onSecond={(v) =>
              setConfidence({ ...confidence, headingAccent: v })
            }
          />
          <Regulated>
            This describes a medical condition and what can be prescribed for
            it. The percentage below is presented as a patient-reported outcome.
          </Regulated>
          <StringList
            items={confidence.paragraphs}
            onChange={(paragraphs) =>
              setConfidence({ ...confidence, paragraphs })
            }
            label="Paragraphs"
            addLabel="+ Add paragraph"
            area
          />
          <StringList
            items={confidence.checks}
            onChange={(checks) => setConfidence({ ...confidence, checks })}
            label="Tick list"
            addLabel="+ Add line"
          />
          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div>
              <LabelRow k="confidence.statValue" label="Percentage">
                <label className={fieldLabel}>Percentage</label>
              </LabelRow>
              <input
                type="number"
                min={0}
                max={100}
                className={`${fieldInput} mt-1`}
                value={confidence.statValue}
                onChange={(e) =>
                  setConfidence({
                    ...confidence,
                    statValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <TextField
            tsKey="confidence.statCaption"
              label="Caption under it"
              value={confidence.statCaption}
              onChange={(v) => setConfidence({ ...confidence, statCaption: v })}
            />
          </div>
          <PictureField
            label="Photo"
            src={confidence.image}
            onSrc={(v) => setConfidence({ ...confidence, image: v })}
            alt={confidence.imageAlt}
            onAlt={(v) => setConfidence({ ...confidence, imageAlt: v })}
          />
          <CtaFields
            labelKey="confidence.ctaLabel"
            title="First button"
            label={confidence.ctaLabel}
            href={confidence.ctaHref}
            onLabel={(v) => setConfidence({ ...confidence, ctaLabel: v })}
            onHref={(v) => setConfidence({ ...confidence, ctaHref: v })}
          />
          <CtaFields
            labelKey="confidence.secondaryLabel"
            title="Second button"
            label={confidence.secondaryLabel}
            href={confidence.secondaryHref}
            onLabel={(v) => setConfidence({ ...confidence, secondaryLabel: v })}
            onHref={(v) => setConfidence({ ...confidence, secondaryHref: v })}
          />
        </div>

        {/* 7. Get to know you */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="know" value={styles.know} onChange={setStyle("know")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            7. Let&rsquo;s get to know you
          </h2>
          <Pair
            firstKey="know.heading"
            secondKey="know.headingAccent"
            label="Heading"
            first={know.heading}
            second={know.headingAccent}
            onFirst={(v) => setKnow({ ...know, heading: v })}
            onSecond={(v) => setKnow({ ...know, headingAccent: v })}
          />
          <TextField
            tsKey="know.headingTail"
            label="Words after the italic part"
            value={know.headingTail}
            onChange={(v) => setKnow({ ...know, headingTail: v })}
            placeholder="you"
          />
          <AreaField
            tsKey="know.body"
            label="Intro"
            rows={2}
            value={know.body}
            onChange={(v) => setKnow({ ...know, body: v })}
          />
          <div className="border-t border-[#eef1e8] pt-4">
            <p className="mb-2 text-[13px] font-medium text-[#1a1a1a]">
              Quiz card
            </p>
            <AreaField
            tsKey="know.quizBody"
              label="Body"
              rows={2}
              value={know.quizBody}
              onChange={(v) => setKnow({ ...know, quizBody: v })}
            />
            <div className="mt-4">
              <CtaFields
            labelKey="know.quizCtaLabel"
                label={know.quizCtaLabel}
                href={know.quizCtaHref}
                onLabel={(v) => setKnow({ ...know, quizCtaLabel: v })}
                onHref={(v) => setKnow({ ...know, quizCtaHref: v })}
              />
            </div>
          </div>
          <div className="border-t border-[#eef1e8] pt-4">
            <p className="mb-2 text-[13px] font-medium text-[#1a1a1a]">
              Progress card
            </p>
            <PictureField
              label="Photo"
              src={know.progressImage}
              onSrc={(v) => setKnow({ ...know, progressImage: v })}
              alt={know.progressImageAlt}
              onAlt={(v) => setKnow({ ...know, progressImageAlt: v })}
            />
            <div className="mt-4">
              <AreaField
            tsKey="know.progressBody"
                label="Body"
                rows={2}
                value={know.progressBody}
                onChange={(v) => setKnow({ ...know, progressBody: v })}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <TextField
            tsKey="know.progressNote"
                label="Small note"
                value={know.progressNote}
                onChange={(v) => setKnow({ ...know, progressNote: v })}
              />
              <TextField
            tsKey="know.progressNoteStrong"
                label="Small note (bold line)"
                value={know.progressNoteStrong}
                onChange={(v) => setKnow({ ...know, progressNoteStrong: v })}
              />
              <div>
                <label className={fieldLabel}>Bar fill %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${fieldInput} mt-1`}
                  value={know.progressPercent}
                  onChange={(e) =>
                    setKnow({
                      ...know,
                      progressPercent: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mt-4">
              <StringList
                items={know.progressStages}
                onChange={(progressStages) =>
                  setKnow({ ...know, progressStages })
                }
                label="Labels under the bar"
                addLabel="+ Add label"
              />
            </div>
          </div>
        </div>

        {/* 8. Closing banner */}
        <div className={cmsCard}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="banner" value={styles.banner} onChange={setStyle("banner")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            8. Closing banner
          </h2>
          <Pair
            firstKey="banner.heading"
            secondKey="banner.headingAccent"
            label="Heading"
            first={banner.heading}
            second={banner.headingAccent}
            onFirst={(v) => setBanner({ ...banner, heading: v })}
            onSecond={(v) => setBanner({ ...banner, headingAccent: v })}
          />
          <AreaField
            tsKey="banner.body"
            label="Body"
            rows={2}
            value={banner.body}
            onChange={(v) => setBanner({ ...banner, body: v })}
          />
          <CtaFields
            labelKey="banner.ctaLabel"
            label={banner.ctaLabel}
            href={banner.ctaHref}
            onLabel={(v) => setBanner({ ...banner, ctaLabel: v })}
            onHref={(v) => setBanner({ ...banner, ctaHref: v })}
          />
          <PictureField
            label="Photo"
            src={banner.image}
            onSrc={(v) => setBanner({ ...banner, image: v })}
            alt={banner.imageAlt}
            onAlt={(v) => setBanner({ ...banner, imageAlt: v })}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save ED page"}
        </button>
        <a
          href="/erectile-dysfunction"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          View the page ↗
        </a>
      </div>

      <p className="mt-3 text-[12px] text-[#8a8a8a]">
        Clearing a field restores the wording the page ships with, rather than
        leaving it blank.
      </p>
    </div>
    </TextStyleCtx.Provider>
  );
}
