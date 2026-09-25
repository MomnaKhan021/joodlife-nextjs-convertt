"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import type {
  Faq,
  HeroFeature,
  HeroIcon,
  HiwStep,
  HomeContent,
  SiteReview,
} from "@/lib/pageContentTypes";
import type { TreatmentRow } from "@/lib/treatmentContentTypes";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import { useDirty } from "../useDirty";
import TreatmentsEditor, { type TreatmentLook } from "../treatments/TreatmentsForm";
import MediaPicker from "../MediaPicker";
import SectionControl from "../SectionControl";
import { AreaField, TextField } from "../FormKit";
import { type HomeTextKey, type TextStyle } from "@/lib/textStyle";
import {
  type HomeStyleKey,
  type SectionStyle,
} from "@/lib/sectionStyle";
import TypeControl from "../TypeControl";

/**
 * Editor for the home page sections.
 *
 * Saves to the `home-page` global through Payload's REST endpoint, so the
 * admin-only rule is enforced server-side. Every field is optional — clearing
 * one restores the copy that ships in the component.
 */
export default function SectionsForm({
  initial,
  treatments,
  treatmentLook,
}: {
  initial: HomeContent;
  treatments: TreatmentRow[];
  /** Treatment band colours and text sizes, handed to the embedded editor. */
  treatmentLook?: TreatmentLook;
}) {
  const [styles, setStyles] = useState<Record<HomeStyleKey, SectionStyle>>(
    initial.styles,
  );
  const setStyle = (k: HomeStyleKey) => (next: SectionStyle) =>
    setStyles((s) => ({ ...s, [k]: next }));
  // Size/weight per text, keyed by the same field name the editor saves.
  const [textStyles, setTextStyles] = useState<Record<HomeTextKey, TextStyle>>(
    initial.textStyles,
  );
  const setText = (k: HomeTextKey) => (next: TextStyle) =>
    setTextStyles((t) => ({ ...t, [k]: next }));
  const [faqHeading, setFaqHeading] = useState(initial.faqHeading);
  const [faqEmphasis, setFaqEmphasis] = useState(initial.faqHeadingEmphasis);
  const [faqs, setFaqs] = useState<Faq[]>(initial.faqs);
  const [faqCtaLabel, setFaqCtaLabel] = useState(initial.faqCtaLabel);
  const [faqCtaHref, setFaqCtaHref] = useState(initial.faqCtaHref);

  // Owned here so the hero's right-hand cards (edited in the hero block)
  // and the treatment bands below stay in step — one piece of state.
  const [treatmentRows, setTreatmentRows] = useState<TreatmentRow[]>(treatments);
  // Filled in by the embedded treatments editor so "Save sections" can write
  // that global too — the band colours and text sizes live in its state.
  const saveTreatments = useRef<(() => Promise<void>) | null>(null);
  // The bands' colours and sizes live inside that editor. It reports them so
  // Save can tell whether one was touched — starting from the same values it
  // was given, so an unedited screen is not dirty.
  const [treatmentLookNow, setTreatmentLookNow] = useState(treatmentLook);
  const updateTreatment = (key: string, patch: Partial<TreatmentRow>) =>
    setTreatmentRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  /** The two categories that sit beside the hero, in render order. */
  const heroCards = ['erectile-dysfunction', 'period-delay'] as const;

  const [heroBadge, setHeroBadge] = useState(initial.heroBadge);
  const [heroTitle, setHeroTitle] = useState(initial.heroTitle);
  const [heroEmphasis, setHeroEmphasis] = useState(initial.heroTitleEmphasis);
  const [heroBody, setHeroBody] = useState(initial.heroBody);
  const [heroFeatures, setHeroFeatures] = useState<HeroFeature[]>(
    initial.heroFeatures,
  );
  const [heroCtaLabel, setHeroCtaLabel] = useState(initial.heroCtaLabel);
  const [heroCtaLabelReturning, setHeroCtaLabelReturning] = useState(
    initial.heroCtaLabelReturning,
  );
  const [heroCtaHref, setHeroCtaHref] = useState(initial.heroCtaHref);
  const [heroImage, setHeroImage] = useState(initial.heroImage);

  const [revHeading, setRevHeading] = useState(initial.reviewsHeading);
  const [revEmphasis, setRevEmphasis] = useState(initial.reviewsHeadingEmphasis);
  const [revIntro, setRevIntro] = useState(initial.reviewsIntro);
  const [reviews, setReviews] = useState<SiteReview[]>(initial.reviews);
  const [tpScore, setTpScore] = useState(initial.trustpilotScore);
  const [tpUrl, setTpUrl] = useState(initial.trustpilotUrl);

  const [blogHeading, setBlogHeading] = useState(initial.blogHeading);
  const [blogEmphasis, setBlogEmphasis] = useState(initial.blogHeadingEmphasis);

  const [hiwHeading, setHiwHeading] = useState(initial.hiwHeading);
  const [hiwEmphasis, setHiwEmphasis] = useState(initial.hiwHeadingEmphasis);
  const [hiwSteps, setHiwSteps] = useState<HiwStep[]>(initial.hiwSteps);

  const [ctaTitle, setCtaTitle] = useState(initial.ctaTitle);
  const [ctaEmphasis, setCtaEmphasis] = useState(initial.ctaTitleEmphasis);
  const [ctaSubtitle, setCtaSubtitle] = useState(initial.ctaSubtitle);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaLabelReturning, setCtaLabelReturning] = useState(
    initial.ctaLabelReturning,
  );
  const [ctaHref, setCtaHref] = useState(initial.ctaHref);
  const [ctaImage, setCtaImage] = useState(initial.ctaImage);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateFaq(i: number, patch: Partial<Faq>) {
    setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function moveFaq(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= faqs.length) return;
    const next = [...faqs];
    [next[i], next[j]] = [next[j], next[i]];
    setFaqs(next);
  }

  function updateFeature(i: number, patch: Partial<HeroFeature>) {
    setHeroFeatures(
      heroFeatures.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    );
  }

  function updateReview(i: number, patch: Partial<SiteReview>) {
    setReviews(reviews.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function moveReview(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= reviews.length) return;
    const next = [...reviews];
    [next[i], next[j]] = [next[j], next[i]];
    setReviews(next);
  }

  function updateStep(i: number, patch: Partial<HiwStep>) {
    setHiwSteps(hiwSteps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function moveStep(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= hiwSteps.length) return;
    const next = [...hiwSteps];
    [next[i], next[j]] = [next[j], next[i]];
    setHiwSteps(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("home-page", payload);
      // The hero's right-hand cards are edited on this screen but belong to
      // the treatments global. Saving only home-page left those edits on the
      // floor, which reads as "the CMS ignored me" — so one button writes both.
      await saveTreatments.current?.();
      setSaved(true);
      markSaved();
      // The bar never leaves the screen, so the confirmation has to.
      window.setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Everything Save would write: this screen's own fields, plus the
  // treatment bands it saves through the embedded editor.
  const payload = {
        styles,
        textStyles,
        faqHeading,
        faqHeadingEmphasis: faqEmphasis,
        faqs: faqs.filter((f) => f.q.trim() || f.a.trim()),
        faqCtaLabel,
        faqCtaHref,
        heroBadge,
        heroTitle,
        heroTitleEmphasis: heroEmphasis,
        heroBody,
        heroFeatures: heroFeatures.filter((f) => f.label.trim()),
        heroCtaLabel,
        heroCtaLabelReturning,
        heroCtaHref,
        heroImage,
        reviewsHeading: revHeading,
        reviewsHeadingEmphasis: revEmphasis,
        reviewsIntro: revIntro,
        reviews: reviews.filter((r) => r.name.trim() && r.text.trim()),
        trustpilotScore: tpScore,
        trustpilotUrl: tpUrl,
        blogHeading,
        blogHeadingEmphasis: blogEmphasis,
        hiwHeading,
        hiwHeadingEmphasis: hiwEmphasis,
        hiwSteps: hiwSteps.filter((s) => s.title.trim() || s.copy.trim()),
        ctaTitle,
        ctaTitleEmphasis: ctaEmphasis,
        ctaSubtitle,
        ctaLabel,
        ctaLabelReturning,
        ctaHref,
        ctaImage,
      };
  const { dirty, markSaved } = useDirty(
    JSON.stringify({ payload, treatmentRows, treatmentLookNow }),
  );

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6">
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Home page
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Every section of the home page, in the order it appears. Clear any
          field to restore the built-in text.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      
      <div className="space-y-5">
        {/* ---- Hero ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">
                Hero — left card
              </h2>
              <p className="text-[12px] text-[#8a8a8a]">
                The peach Foundayo card at the top of the page.
              </p>
            </div>
            <div className="ml-auto">
              <SectionControl
                sectionKey="hero"
                value={styles.hero}
                onChange={setStyle("hero")}
              />
            </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["heroFeature", "Feature labels"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <TypeControl label={lbl} value={textStyles[k]} onChange={setText(k)} />
              </span>
            ))}
          </div>
            <button
              type="button"
              onClick={() =>
                setHeroFeatures([...heroFeatures, { label: "", icon: "tablet" }])
              }
              className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add feature
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="heroBadge"
              label="Badge"
              value={heroBadge}
              onChange={setHeroBadge}
              placeholder="New"
              style={textStyles.heroBadge}
              onStyle={setText("heroBadge")}
            />
            <TextField
              id="heroTitle"
              label="Title"
              value={heroTitle}
              onChange={setHeroTitle}
              style={textStyles.heroTitle}
              onStyle={setText("heroTitle")}
            />
            <TextField
              id="heroEm"
              label="Title (italic line)"
              value={heroEmphasis}
              onChange={setHeroEmphasis}
              style={textStyles.heroTitleEmphasis}
              onStyle={setText("heroTitleEmphasis")}
            />
            <TextField
              id="heroCtaL"
              label="Button text"
              value={heroCtaLabel}
              onChange={setHeroCtaLabel}
              style={textStyles.heroCtaLabel}
              onStyle={setText("heroCtaLabel")}
            />
            <div>
              <label className={fieldLabel} htmlFor="heroCtaLR">
                Button text — returning patient
              </label>
              <input
                id="heroCtaLR"
                className={`${fieldInput} mt-1`}
                value={heroCtaLabelReturning}
                onChange={(e) => setHeroCtaLabelReturning(e.target.value)}
                placeholder="Reorder"
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Shown to someone who has ordered before — they skip the
                questionnaire and go straight to reorder. Empty keeps
                &ldquo;Reorder&rdquo;.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="heroCtaH">Button link</label>
              <input id="heroCtaH" className={`${fieldInput} mt-1`} value={heroCtaHref} onChange={(e) => setHeroCtaHref(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <AreaField
                id="heroBody"
                label="Body copy"
                rows={3}
                value={heroBody}
                onChange={setHeroBody}
                style={textStyles.heroBody}
                onStyle={setText("heroBody")}
              />
            </div>
          </div>

          <div>
            <span className={fieldLabel}>Feature list</span>
            <p className="text-[12px] text-[#8a8a8a]">
              Use a line break in the label to control where it wraps.
            </p>
            {heroFeatures.length === 0 ? (
              <p className="mt-2 text-[13px] text-[#616161]">
                No features — the built-in three will be used.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {heroFeatures.map((f, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <textarea
                      aria-label={`Feature label ${i + 1}`}
                      rows={2}
                      className={`${fieldInput} min-w-[180px] flex-1`}
                      value={f.label}
                      onChange={(e) => updateFeature(i, { label: e.target.value })}
                      placeholder={"Oral tablet\ntreatment"}
                    />
                    <select
                      aria-label={`Feature icon ${i + 1}`}
                      className={`${fieldInput} max-w-[130px]`}
                      value={f.icon}
                      onChange={(e) =>
                        updateFeature(i, { icon: e.target.value as HeroIcon })
                      }
                    >
                      <option value="tablet">Tablet</option>
                      <option value="syringe">Syringe</option>
                      <option value="heart">Heart</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setHeroFeatures(heroFeatures.filter((_, idx) => idx !== i))}
                      className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className={fieldLabel}>Product image</span>
            <MediaPicker
              valueId={null}
              valueUrl={heroImage || null}
              onChange={(_id, url) => setHeroImage(url ?? "")}
            />
          </div>
        </div>

        {/* ---- Hero: the two cards stacked to the right ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              Hero — right cards
            </h2>
            <p className="text-[12px] text-[#8a8a8a]">
              The two smaller cards stacked beside the hero. These belong to
              their treatments, so the same title and image also appear on the
              treatment&apos;s own page — editing here updates both.
            </p>
          </div>

          {heroCards.map((key) => {
            const row = treatmentRows.find((r) => r.key === key);
            if (!row) return null;
            const label =
              key === "erectile-dysfunction"
                ? "Erectile dysfunction"
                : "Period delay";
            return (
              <div
                key={key}
                className="space-y-3 rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
              >
                <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                  {label}
                </p>
                <div>
                  <label className={fieldLabel}>Label above the title</label>
                  <input
                    className={`${fieldInput} mt-1`}
                    value={row.eyebrow ?? ""}
                    onChange={(e) =>
                      updateTreatment(key, { eyebrow: e.target.value })
                    }
                    placeholder="Men's health"
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Card title</label>
                  <textarea
                    rows={2}
                    className={`${fieldInput} mt-1`}
                    value={row.cardTitle ?? ""}
                    onChange={(e) =>
                      updateTreatment(key, { cardTitle: e.target.value })
                    }
                  />
                  <p className="mt-1 text-[12px] text-[#8a8a8a]">
                    A line break controls where it wraps.
                  </p>
                </div>
                <div>
                  <label className={fieldLabel}>Button text</label>
                  <input
                    className={`${fieldInput} mt-1`}
                    value={row.cardCtaLabel ?? ""}
                    onChange={(e) =>
                      updateTreatment(key, { cardCtaLabel: e.target.value })
                    }
                    placeholder="Get Started"
                  />
                  <p className="mt-1 text-[12px] text-[#8a8a8a]">
                    Empty keeps &ldquo;Get Started&rdquo;.
                  </p>
                </div>
                <div>
                  <label className={fieldLabel}>Card link</label>
                  <input
                    className={`${fieldInput} mt-1`}
                    value={row.href ?? ""}
                    onChange={(e) =>
                      updateTreatment(key, { href: e.target.value })
                    }
                  />
                </div>
                <div>
                  <span className={fieldLabel}>Card image</span>
                  <MediaPicker
                    valueId={null}
                    valueUrl={row.cardImage || null}
                    onChange={(_id, url) =>
                      updateTreatment(key, { cardImage: url ?? "" })
                    }
                  />
                </div>
              </div>
            );
          })}

          <p className="rounded-lg border border-[#e4e7de] bg-[#fafbf7] px-3 py-2 text-[12px] leading-relaxed text-[#616161]">
            These belong to the treatments below, so editing them here changes
            the treatment&apos;s own page too. <strong>Save sections</strong>{" "}
            saves both.
          </p>
        </div>

        {/* ---- Treatment sections ---- */}
        <div className="rounded-xl border border-[#e4e7de] bg-[#fafbf7] p-4">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            Treatment sections
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#616161]">
            The three bands below the hero. The same copy is used on each
            treatment&apos;s own landing page.
          </p>
        </div>
        <TreatmentsEditor
          initial={treatments}
          look={treatmentLook}
          embedded
          rows={treatmentRows}
          onRowsChange={setTreatmentRows}
          saveRef={saveTreatments}
          onLookChange={setTreatmentLookNow}
        />

        {/* ---- Reviews ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">Reviews</h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Leave the list empty to keep the curated Trustpilot reviews
                that ship with the site.
              </p>
            </div>
            <div className="ml-auto">
              <SectionControl
                sectionKey="reviews"
                value={styles.reviews}
                onChange={setStyle("reviews")}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setReviews([...reviews, { name: "", text: "", initials: "" }])
              }
              className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add review
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["reviewText", "Review text"],
                ["reviewName", "Reviewer names"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <TypeControl label={lbl} value={textStyles[k]} onChange={setText(k)} />
              </span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="revH"
              label="Heading"
              value={revHeading}
              onChange={setRevHeading}
              style={textStyles.reviewsHeading}
              onStyle={setText("reviewsHeading")}
            />
            <TextField
              id="revE"
              label="Heading (italic part)"
              value={revEmphasis}
              onChange={setRevEmphasis}
              style={textStyles.reviewsHeadingEmphasis}
              onStyle={setText("reviewsHeadingEmphasis")}
            />
            <div className="sm:col-span-2">
              <AreaField
                id="revI"
                label="Intro"
                rows={2}
                value={revIntro}
                onChange={setRevIntro}
                style={textStyles.reviewsIntro}
                onStyle={setText("reviewsIntro")}
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="tpS">Trustpilot score</label>
              <input id="tpS" className={`${fieldInput} mt-1`} value={tpScore} onChange={(e) => setTpScore(e.target.value)} placeholder="4.4" />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="tpU">Trustpilot link</label>
              <input id="tpU" className={`${fieldInput} mt-1`} value={tpUrl} onChange={(e) => setTpUrl(e.target.value)} />
            </div>
          </div>

          <p className="rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
            These are shown as verified Trustpilot reviews. Only enter real
            ones — don&apos;t write testimonials here.
          </p>

          {reviews.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No reviews entered — the built-in Trustpilot list will be used.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                  <div className="flex flex-wrap items-start gap-2">
                    <input aria-label={`Reviewer name ${i + 1}`} className={`${fieldInput} min-w-[150px] flex-1`} value={r.name} onChange={(e) => updateReview(i, { name: e.target.value })} placeholder="Reviewer name" />
                    <input aria-label={`Initials ${i + 1}`} className={`${fieldInput} max-w-[90px]`} value={r.initials ?? ""} onChange={(e) => updateReview(i, { initials: e.target.value })} placeholder="AB" />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveReview(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                      <button type="button" onClick={() => moveReview(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                      <button type="button" onClick={() => setReviews(reviews.filter((_, idx) => idx !== i))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                    </div>
                  </div>
                  <textarea aria-label={`Review text ${i + 1}`} rows={3} className={`${fieldInput} mt-2`} value={r.text} onChange={(e) => updateReview(i, { text: e.target.value })} placeholder="Review text" />
                  <div className="mt-2">
                    <span className="text-[12px] text-[#616161]">Reviewer photo (optional)</span>
                    <MediaPicker
                      valueId={null}
                      valueUrl={r.avatar || null}
                      onChange={(_id, url) => updateReview(i, { avatar: url ?? "" })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- How it works ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">
                How it works
              </h2>
              <p className="text-[12px] text-[#8a8a8a]">
                The three-step explainer in the middle of the page.
              </p>
            </div>
            <div className="ml-auto">
              <SectionControl
                sectionKey="howItWorks"
                value={styles.howItWorks}
                onChange={setStyle("howItWorks")}
              />
            </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["hiwStepTitle", "Step titles"],
                ["hiwStepBody", "Step text"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <TypeControl label={lbl} value={textStyles[k]} onChange={setText(k)} />
              </span>
            ))}
          </div>
            <button
              type="button"
              onClick={() =>
                setHiwSteps([...hiwSteps, { step: "", title: "", copy: "", img: "" }])
              }
              className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add step
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="hiwH"
              label="Heading"
              value={hiwHeading}
              onChange={setHiwHeading}
              style={textStyles.hiwHeading}
              onStyle={setText("hiwHeading")}
            />
            <TextField
              id="hiwE"
              label="Heading (italic part)"
              value={hiwEmphasis}
              onChange={setHiwEmphasis}
              style={textStyles.hiwHeadingEmphasis}
              onStyle={setText("hiwHeadingEmphasis")}
            />
          </div>

          {hiwSteps.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No steps — the built-in three will be used.
            </p>
          ) : (
            <div className="space-y-3">
              {hiwSteps.map((s, i) => (
                <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                  <div className="flex flex-wrap items-start gap-2">
                    <input aria-label={`Step label ${i + 1}`} className={`${fieldInput} max-w-[120px]`} value={s.step} onChange={(e) => updateStep(i, { step: e.target.value })} placeholder="Step 1" />
                    <input aria-label={`Step title ${i + 1}`} className={`${fieldInput} min-w-[180px] flex-1`} value={s.title} onChange={(e) => updateStep(i, { title: e.target.value })} placeholder="Complete your assessment" />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveStep(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                      <button type="button" onClick={() => moveStep(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                      <button type="button" onClick={() => setHiwSteps(hiwSteps.filter((_, idx) => idx !== i))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                    </div>
                  </div>
                  <textarea aria-label={`Step copy ${i + 1}`} rows={2} className={`${fieldInput} mt-2`} value={s.copy} onChange={(e) => updateStep(i, { copy: e.target.value })} placeholder="Description" />
                  <div className="mt-2">
                    <span className="text-[12px] text-[#616161]">Step image</span>
                    <MediaPicker
                      valueId={null}
                      valueUrl={s.img || null}
                      onChange={(_id, url) => updateStep(i, { img: url ?? "" })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- FAQ ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">FAQ</h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Questions shown near the bottom of the home page.
              </p>
            </div>
            <div className="ml-auto">
              <SectionControl
                sectionKey="faq"
                value={styles.faq}
                onChange={setStyle("faq")}
              />
            </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["faqQuestion", "Questions"],
                ["faqAnswer", "Answers"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <TypeControl label={lbl} value={textStyles[k]} onChange={setText(k)} />
              </span>
            ))}
          </div>
            <button
              type="button"
              onClick={() => setFaqs([...faqs, { q: "", a: "" }])}
              className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add question
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="faqH"
              label="Heading"
              value={faqHeading}
              onChange={setFaqHeading}
              style={textStyles.faqHeading}
              onStyle={setText("faqHeading")}
            />
            <TextField
              id="faqE"
              label="Heading (italic part)"
              value={faqEmphasis}
              onChange={setFaqEmphasis}
              style={textStyles.faqHeadingEmphasis}
              onStyle={setText("faqHeadingEmphasis")}
            />
            <div>
              <label className={fieldLabel} htmlFor="faqBtn">
                Button text
              </label>
              <input
                id="faqBtn"
                className={`${fieldInput} mt-1`}
                value={faqCtaLabel}
                onChange={(e) => setFaqCtaLabel(e.target.value)}
                placeholder="Get started"
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                The button under the questions.
              </p>
            </div>
            <div>
              <label className={fieldLabel} htmlFor="faqBtnHref">
                Button link
              </label>
              <input
                id="faqBtnHref"
                className={`${fieldInput} mt-1`}
                value={faqCtaHref}
                onChange={(e) => setFaqCtaHref(e.target.value)}
                placeholder="/consultation"
              />
            </div>
          </div>

          {faqs.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No questions — the built-in list will be used.
            </p>
          ) : (
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                  <div className="flex items-start gap-2">
                    <input
                      aria-label={`Question ${i + 1}`}
                      className={fieldInput}
                      value={f.q}
                      onChange={(e) => updateFaq(i, { q: e.target.value })}
                      placeholder="Question"
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveFaq(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                      <button type="button" onClick={() => moveFaq(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                      <button type="button" onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                    </div>
                  </div>
                  <textarea
                    aria-label={`Answer ${i + 1}`}
                    rows={2}
                    className={`${fieldInput} mt-2`}
                    value={f.a}
                    onChange={(e) => updateFaq(i, { a: e.target.value })}
                    placeholder="Answer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Blog strip ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">
                Blog strip
              </h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Heading above the recent-posts carousel. The posts themselves
                come from the blog.
              </p>
            </div>
            <SectionControl
              sectionKey="blog"
              value={styles.blog}
              onChange={setStyle("blog")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["blogCardTitle", "Card titles"],
                ["blogCardTag", "Card tags"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <TypeControl label={lbl} value={textStyles[k]} onChange={setText(k)} />
              </span>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="blogH"
              label="Heading"
              value={blogHeading}
              onChange={setBlogHeading}
              style={textStyles.blogHeading}
              onStyle={setText("blogHeading")}
            />
            <TextField
              id="blogE"
              label="Heading (italic part)"
              value={blogEmphasis}
              onChange={setBlogEmphasis}
              style={textStyles.blogHeadingEmphasis}
              onStyle={setText("blogHeadingEmphasis")}
            />
          </div>
          <p className="text-[12px] text-[#8a8a8a]">
            Renders as: {blogHeading} <em>{blogEmphasis}</em> posts
          </p>
        </div>

        {/* ---- Closing CTA ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">
                Closing call-to-action
              </h2>
              <p className="text-[12px] text-[#8a8a8a]">
                The banner just above the footer.
              </p>
            </div>
            <SectionControl
              sectionKey="cta"
              value={styles.cta}
              onChange={setStyle("cta")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="ctaT"
              label="Title"
              value={ctaTitle}
              onChange={setCtaTitle}
              style={textStyles.ctaTitle}
              onStyle={setText("ctaTitle")}
            />
            <TextField
              id="ctaE"
              label="Title (italic part)"
              value={ctaEmphasis}
              onChange={setCtaEmphasis}
              style={textStyles.ctaTitleEmphasis}
              onStyle={setText("ctaTitleEmphasis")}
            />
            <div className="sm:col-span-2">
              <AreaField
                id="ctaS"
                label="Subtitle"
                rows={2}
                value={ctaSubtitle}
                onChange={setCtaSubtitle}
                style={textStyles.ctaSubtitle}
                onStyle={setText("ctaSubtitle")}
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="ctaL">
                Button text
              </label>
              <input
                id="ctaL"
                className={`${fieldInput} mt-1`}
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Get started"
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="ctaLR">
                Button text — returning patient
              </label>
              <input
                id="ctaLR"
                className={`${fieldInput} mt-1`}
                value={ctaLabelReturning}
                onChange={(e) => setCtaLabelReturning(e.target.value)}
                placeholder="Reorder"
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Someone who has ordered before goes straight to reorder, so the
                link below does not apply to them.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="ctaH">
                Button link
              </label>
              <input
                id="ctaH"
                className={`${fieldInput} mt-1`}
                value={ctaHref}
                onChange={(e) => setCtaHref(e.target.value)}
                placeholder="/consultation"
              />
            </div>
          </div>
          <div>
            <span className={fieldLabel}>Background image</span>
            <MediaPicker
              valueId={null}
              valueUrl={ctaImage || null}
              onChange={(_id, url) => setCtaImage(url ?? "")}
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-3 border-t border-[#e4e7de] bg-[#f7f9f2]/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save sections"}
        </button>
      
        {saved ? (
          <span className="text-[13px] text-[#2f6b33]">Saved. Reload the site to see the change.</span>
        ) : null}
        {error ? (
          <span className="text-[13px] text-[#8a2b2b]">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
