"use client";

import Link from "next/link";
import { useState } from "react";

import {
  type FaqItem,
  type FaqSection,
  type SupportContent,
  type SupportFaqContent,
  type SupportHero,
  type SupportStories,
} from "@/lib/supportContentTypes";

import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import MediaPicker from "../MediaPicker";
import SectionControl from "../SectionControl";
import {
  type SupportStyleKey,
  type SectionStyle,
} from "@/lib/sectionStyle";
import { LabelRow, Ts, TextStyleCtx } from "../TextStyleContext";
import type { TextStyle } from "@/lib/textStyle";

/**
 * Editor for the Support page, in page order: the hero and its quick-help
 * card, the FAQ accordions, then the success-story strip.
 *
 * Everything falls back to the shipped copy, so clearing a field restores
 * what the page ships with rather than blanking it.
 */

const card = "space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5";
const iconBtn =
  "rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]";
const delBtn =
  "rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]";
const addBtn =
  "rounded-lg border border-[#d8ddd0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]";

/** Swap two neighbours; returns the list unchanged at either end. */
function moved<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export default function SupportForm({ initial }: { initial: SupportContent }) {
  const [styles, setStyles] = useState<Record<SupportStyleKey, SectionStyle>>(
    initial.styles,
  );
  const setStyle = (k: SupportStyleKey) => (next: SectionStyle) =>
    setStyles((prev) => ({ ...prev, [k]: next }));
  const [hero, setHero] = useState<SupportHero>(initial.hero);
  const [faq, setFaq] = useState<SupportFaqContent>(initial.faq);
  const [stories, setStories] = useState<SupportStories>(initial.stories);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── hero ─────────────────────────────────────────────── */
  function setPoint(i: number, patch: Partial<SupportHero["helpPoints"][number]>) {
    setHero({
      ...hero,
      helpPoints: hero.helpPoints.map((p, x) => (x === i ? { ...p, ...patch } : p)),
    });
  }

  /* ── faq ──────────────────────────────────────────────── */
  function setSection(si: number, patch: Partial<FaqSection>) {
    setFaq({
      ...faq,
      sections: faq.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)),
    });
  }
  function setItem(si: number, ii: number, patch: Partial<FaqItem>) {
    setSection(si, {
      items: faq.sections[si].items.map((q, i) =>
        i === ii ? { ...q, ...patch } : q,
      ),
    });
  }

  /* ── stories ──────────────────────────────────────────── */
  function setStory(i: number, patch: Partial<SupportStories["items"][number]>) {
    setStories({
      ...stories,
      items: stories.items.map((s, x) => (x === i ? { ...s, ...patch } : s)),
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("support", {
        styles,
        textStyles,
        hero: {
          ...hero,
          helpPoints: hero.helpPoints.filter((p) => p.title.trim() || p.body.trim()),
        },
        faq: {
          ...faq,
          sections: faq.sections
            .map((s) => ({
              ...s,
              items: s.items.filter((q) => q.q.trim() && q.a.trim()),
            }))
            .filter((s) => s.pill.trim() && s.items.length),
        },
        stories: {
          ...stories,
          items: stories.items.filter((s) => s.src.trim()),
        },
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
          Support page
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/support</code> —
          the sections below are in the order they appear on the page.
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
        {/* ─────────── 1. Hero ─────────── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="hero" value={styles.hero} onChange={setStyle("hero")} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
              ["hero.helpTitle", "Card titles"],
              ["hero.helpBody", "Card text"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <Ts k={k} label={lbl} />
              </span>
            ))}
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">1. Hero</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LabelRow k="hero.title" label="Title">
                <label className={fieldLabel}>Title</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="hero.titleAccent" label="Title (italic part)">
                <label className={fieldLabel}>Title (italic part)</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.titleAccent}
                onChange={(e) => setHero({ ...hero, titleAccent: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <LabelRow k="hero.body" label="Body">
                <label className={fieldLabel}>Body</label>
              </LabelRow>
              <textarea
                rows={2}
                className={`${fieldInput} mt-1`}
                value={hero.body}
                onChange={(e) => setHero({ ...hero, body: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="hero.ctaLabel" label="Button text">
                <label className={fieldLabel}>Button text</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.ctaLabel}
                onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide the button.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.ctaHref}
                onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Hero photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={hero.image}
                  onChange={(_id, url) => setHero({ ...hero, image: url ?? "" })}
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.imageAlt}
                onChange={(e) => setHero({ ...hero, imageAlt: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Read aloud by screen readers. Describe what the photo shows.
              </p>
            </div>
          </div>
        </div>

        {/* ─────────── 2. Quick-help card ─────────── */}
        <div className={card}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              2. Quick-help card
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The green box beside the hero photo.
            </p>
          </div>
          <div>
            <LabelRow k="hero.cardPill" label="Pill label">
              <label className={fieldLabel}>Pill label</label>
            </LabelRow>
            <input
              className={`${fieldInput} mt-1`}
              value={hero.cardPill}
              onChange={(e) => setHero({ ...hero, cardPill: e.target.value })}
              placeholder="How we support you"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Points</label>
              <button
                type="button"
                className={addBtn}
                onClick={() =>
                  setHero({
                    ...hero,
                    helpPoints: [...hero.helpPoints, { title: "", body: "" }],
                  })
                }
              >
                + Add point
              </button>
            </div>
            <div className="space-y-2">
              {hero.helpPoints.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <input
                    aria-label={`Point ${i + 1} title`}
                    className={`${fieldInput} min-w-[180px] flex-1`}
                    value={p.title}
                    onChange={(e) => setPoint(i, { title: e.target.value })}
                    placeholder="Ongoing clinical support"
                  />
                  <input
                    aria-label={`Point ${i + 1} body`}
                    className={`${fieldInput} min-w-[180px] flex-[1.4]`}
                    value={p.body}
                    onChange={(e) => setPoint(i, { body: e.target.value })}
                    placeholder="Access expert clinicians and medical advice."
                  />
                  <button
                    type="button"
                    className={iconBtn}
                    title="Move up"
                    onClick={() =>
                      setHero({ ...hero, helpPoints: moved(hero.helpPoints, i, -1) })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={iconBtn}
                    title="Move down"
                    onClick={() =>
                      setHero({ ...hero, helpPoints: moved(hero.helpPoints, i, 1) })
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={delBtn}
                    title="Remove point"
                    onClick={() =>
                      setHero({
                        ...hero,
                        helpPoints: hero.helpPoints.filter((_, x) => x !== i),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────── 3. FAQs ─────────── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="faq" value={styles.faq} onChange={setStyle("faq")} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
              ["faq.pill", "Filter pills"],
              ["faq.sectionHeading", "Group headings"],
              ["faq.question", "Questions"],
              ["faq.answer", "Answers"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <Ts k={k} label={lbl} />
              </span>
            ))}
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              3. Frequently asked questions
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              Each group becomes a filter pill and a block of questions.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <LabelRow k="faq.allLabel" label="“Show all” pill">
                <label className={fieldLabel}>“Show all” pill</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={faq.allLabel}
                onChange={(e) => setFaq({ ...faq, allLabel: e.target.value })}
                placeholder="All"
              />
            </div>
            <div>
              <LabelRow k="faq.ctaLabel" label="Button text">
                <label className={fieldLabel}>Button text</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={faq.ctaLabel}
                onChange={(e) => setFaq({ ...faq, ctaLabel: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={faq.ctaHref}
                onChange={(e) => setFaq({ ...faq, ctaHref: e.target.value })}
              />
            </div>
          </div>
          <p className="text-[12px] text-[#8a8a8a]">
            The button repeats beside every group heading.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            FAQ groups ({faq.sections.length})
          </h2>
          <button
            type="button"
            className={addBtn}
            onClick={() =>
              setFaq({
                ...faq,
                sections: [
                  ...faq.sections,
                  { id: "", pill: "", headStart: "", headAccent: "", items: [] },
                ],
              })
            }
          >
            + Add group
          </button>
        </div>

        {faq.sections.map((s, si) => (
          <details key={si} className="rounded-xl border border-[#e4e7de] bg-white p-5">
            <summary className="cursor-pointer text-[14px] font-medium text-[#1a1a1a]">
              {s.pill || `Group ${si + 1}`}
              <span className="ml-2 text-[12px] font-normal text-[#8a8a8a]">
                {s.items.length} question{s.items.length === 1 ? "" : "s"}
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={fieldLabel}>Pill label</label>
                  <input
                    className={`${fieldInput} mt-1`}
                    value={s.pill}
                    onChange={(e) => setSection(si, { pill: e.target.value })}
                    placeholder="About Jood"
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Heading</label>
                  <input
                    className={`${fieldInput} mt-1`}
                    value={s.headStart}
                    onChange={(e) => setSection(si, { headStart: e.target.value })}
                    placeholder="About"
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Heading (italic part)</label>
                  <input
                    className={`${fieldInput} mt-1`}
                    value={s.headAccent}
                    onChange={(e) => setSection(si, { headAccent: e.target.value })}
                    placeholder="Jood"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={iconBtn}
                  title="Move group up"
                  onClick={() => setFaq({ ...faq, sections: moved(faq.sections, si, -1) })}
                >
                  ↑ Move up
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  title="Move group down"
                  onClick={() => setFaq({ ...faq, sections: moved(faq.sections, si, 1) })}
                >
                  ↓ Move down
                </button>
                <button
                  type="button"
                  className={delBtn}
                  title="Remove group"
                  onClick={() =>
                    setFaq({
                      ...faq,
                      sections: faq.sections.filter((_, i) => i !== si),
                    })
                  }
                >
                  ✕ Remove group
                </button>
              </div>

              {s.items.map((qa, ii) => (
                <div key={ii} className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      Question {ii + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move up"
                        onClick={() => setSection(si, { items: moved(s.items, ii, -1) })}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move down"
                        onClick={() => setSection(si, { items: moved(s.items, ii, 1) })}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={delBtn}
                        title="Remove question"
                        onClick={() =>
                          setSection(si, { items: s.items.filter((_, i) => i !== ii) })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label={`Question ${ii + 1}`}
                    className={fieldInput}
                    value={qa.q}
                    onChange={(e) => setItem(si, ii, { q: e.target.value })}
                    placeholder="What is Jood?"
                  />
                  <textarea
                    aria-label={`Answer ${ii + 1}`}
                    rows={3}
                    className={`${fieldInput} mt-2`}
                    value={qa.a}
                    onChange={(e) => setItem(si, ii, { a: e.target.value })}
                  />
                </div>
              ))}

              <button
                type="button"
                className={addBtn}
                onClick={() => setSection(si, { items: [...s.items, { q: "", a: "" }] })}
              >
                + Add question
              </button>
            </div>
          </details>
        ))}

        {/* ─────────── 4. Success stories ─────────── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="stories" value={styles.stories} onChange={setStyle("stories")} />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              4. Success stories
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The last section, above the footer.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LabelRow k="stories.heading" label="Heading">
                <label className={fieldLabel}>Heading</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={stories.heading}
                onChange={(e) => setStories({ ...stories, heading: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="stories.headingAccent" label="Heading (italic part)">
                <label className={fieldLabel}>Heading (italic part)</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={stories.headingAccent}
                onChange={(e) =>
                  setStories({ ...stories, headingAccent: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <LabelRow k="stories.body" label="Body">
                <label className={fieldLabel}>Body</label>
              </LabelRow>
              <textarea
                rows={2}
                className={`${fieldInput} mt-1`}
                value={stories.body}
                onChange={(e) => setStories({ ...stories, body: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="stories.ctaLabel" label="Button text">
                <label className={fieldLabel}>Button text</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={stories.ctaLabel}
                onChange={(e) => setStories({ ...stories, ctaLabel: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide the button.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={stories.ctaHref}
                onChange={(e) => setStories({ ...stories, ctaHref: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Photos</label>
              <button
                type="button"
                className={addBtn}
                onClick={() =>
                  setStories({ ...stories, items: [...stories.items, { src: "", alt: "" }] })
                }
              >
                + Add photo
              </button>
            </div>
            <p className="mb-2 text-[12px] text-[#8a8a8a]">
              Shown four across on desktop, two on mobile.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {stories.items.map((s, i) => (
                <div key={i} className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      Photo {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move left"
                        onClick={() =>
                          setStories({ ...stories, items: moved(stories.items, i, -1) })
                        }
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move right"
                        onClick={() =>
                          setStories({ ...stories, items: moved(stories.items, i, 1) })
                        }
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className={delBtn}
                        title="Remove photo"
                        onClick={() =>
                          setStories({
                            ...stories,
                            items: stories.items.filter((_, x) => x !== i),
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <MediaPicker
                    valueId={null}
                    valueUrl={s.src}
                    onChange={(_id, url) => setStory(i, { src: url ?? "" })}
                  />
                  <input
                    aria-label={`Photo ${i + 1} description`}
                    className={`${fieldInput} mt-2`}
                    value={s.alt}
                    onChange={(e) => setStory(i, { alt: e.target.value })}
                    placeholder="Jood patient success story"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Support page"}
        </button>
      </div>
    </div>
    </TextStyleCtx.Provider>
  );
}
