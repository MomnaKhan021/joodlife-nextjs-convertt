"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  Chip,
  FeatureRow,
  Testimonial,
  TreatmentRow,
} from "@/lib/treatmentContentTypes";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import MediaPicker from "../MediaPicker";
import SectionControl from "../SectionControl";
import { LabelRow, Ts, TextStyleCtx } from "../TextStyleContext";
import {
  TREATMENT_STYLE_KEYS,
  mergeStyles,
  type SectionStyle,
} from "@/lib/sectionStyle";
import {
  TREATMENT_TEXT_KEYS,
  mergeTextStyles,
  type TextStyle,
} from "@/lib/textStyle";

/** Per-category band colours and text sizes, as stored on the global. */
export type TreatmentLook = {
  styles: Record<string, SectionStyle>;
  textStyles: Record<string, TextStyle>;
};

/**
 * Editor for the three treatment categories.
 *
 * These drive the two cards beside the home hero, the three home page
 * preview sections, and the treatment landing pages — so a change here shows
 * up in several places at once. The form says so.
 *
 * Fields arrive pre-filled from the built-in copy, so an editor sees the
 * current text rather than empty boxes. Clearing a field restores the
 * built-in value on save.
 */

type Row = TreatmentRow;

const LABELS: Record<string, string> = {
  "weight-loss": "Weight loss",
  "erectile-dysfunction": "Erectile dysfunction",
  "period-delay": "Period delay",
};

/** The repeated texts each band draws. Keyed by band, because the three
    bands show different lists. */
const REPEATED_TEXTS: Record<string, readonly (readonly [string, string])[]> = {
  "weight-loss": [
    ["featureTitle", "Feature titles"],
    ["featureSub", "Feature subtitles"],
    ["chipLabel", "Chip labels"],
    ["chipSub", "Chip subtitles"],
  ],
  "erectile-dysfunction": [
    ["goal", "Goal chips"],
    ["testimonialQuote", "Quotes"],
    ["testimonialName", "Names"],
    ["testimonialMeta", "Name subtitles"],
  ],
  "period-delay": [["tag", "Tag cloud"]],
};

export default function TreatmentsForm({
  initial,
  embedded = false,
  rows: controlledRows,
  onRowsChange,
  look,
}: {
  initial: Row[];
  /** Band colours and text sizes; saved with the rest by this editor's own button. */
  look?: TreatmentLook;
  /** Rendered inside the Home page screen — drop the page chrome. */
  embedded?: boolean;
  /**
   * Controlled mode. The Home page screen owns the rows so the hero's
   * right-hand cards can be edited up in the hero block and stay in step
   * with the bands down here — two editors, one piece of state.
   */
  rows?: Row[];
  onRowsChange?: (next: Row[]) => void;
}) {
  const [ownRows, setOwnRows] = useState<Row[]>(initial);
  const rows = controlledRows ?? ownRows;
  const setRows = (next: Row[]) => {
    if (onRowsChange) onRowsChange(next);
    else setOwnRows(next);
  };
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateDetail(i: number, patch: Partial<Row["detail"]>) {
    update(i, { detail: { ...rows[i].detail, ...patch } });
  }
  function updateChip(
    i: number,
    side: "chipsLeft" | "chipsRight",
    ci: number,
    patch: Partial<Chip>,
  ) {
    const list = rows[i].detail[side] ?? [];
    updateDetail(i, {
      [side]: list.map((c, idx) => (idx === ci ? { ...c, ...patch } : c)),
    });
  }
  function updateFeatureRow(i: number, fi: number, patch: Partial<FeatureRow>) {
    const list = rows[i].detail.card1Features ?? [];
    updateDetail(i, {
      card1Features: list.map((f, idx) => (idx === fi ? { ...f, ...patch } : f)),
    });
  }
  function updateTestimonial(i: number, ti: number, patch: Partial<Testimonial>) {
    const list = rows[i].detail.testimonials ?? [];
    updateDetail(i, {
      testimonials: list.map((t, idx) => (idx === ti ? { ...t, ...patch } : t)),
    });
  }

  function updateBullet(i: number, b: number, value: string) {
    update(i, {
      bullets: rows[i].bullets.map((x, idx) => (idx === b ? value : x)),
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("treatments", {
        styles,
        textStyles,
        categories: rows.map((r) => ({
          ...r,
          bullets: r.bullets.filter((b) => b.trim()),
        })),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const [styles, setStyles] = useState<Record<string, SectionStyle>>(
    look?.styles ?? mergeStyles(null, TREATMENT_STYLE_KEYS),
  );
  const setStyle = (k: string) => (next: SectionStyle) =>
    setStyles((st) => ({ ...st, [k]: next }));
  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>(
    look?.textStyles ?? mergeTextStyles(null, TREATMENT_TEXT_KEYS),
  );
  const textStyleApi = {
    get: (k: string) => textStyles[k],
    set: (k: string) => (next: TextStyle) =>
      setTextStyles((t) => ({ ...t, [k]: next })),
  };

  return (
    <TextStyleCtx.Provider value={textStyleApi}>
    <div className={embedded ? "" : "mx-auto w-full max-w-[1000px]"}>
      {!embedded && (
      <header className="mb-6">
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Treatments
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Copy and imagery for the three treatment categories.
        </p>
        <p className="mt-2 rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
          These appear in three places: the two cards beside the home hero, the
          three preview sections further down the home page, and the treatment
          landing pages. Editing one changes all of them.
        </p>
      </header>
      )}

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          Saved. Reload the site to see the change.
        </p>
      )}

      <div className="space-y-5">
        {rows.map((r, i) => (
          <details
            key={r.key}
            open={i === 0}
            className="rounded-xl border border-[#e4e7de] bg-white p-5"
          >
            <summary className="cursor-pointer text-[15px] font-medium text-[#1a1a1a]">
              {LABELS[r.key] ?? r.key}
            </summary>

            <div className="mt-4 space-y-4">
              <div className="flex justify-end">
                <SectionControl sectionKey={r.key} value={styles[r.key]} onChange={setStyle(r.key)} />
              </div>
              {(REPEATED_TEXTS[r.key] ?? []).length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
                  <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
                  {(REPEATED_TEXTS[r.key] ?? []).map(([k, lbl]) => (
                    <span key={k} className="flex items-center gap-2">
                      {lbl}
                      <Ts k={`${r.key}.${k}`} label={lbl} />
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <LabelRow k={`${r.key}.eyebrow`} label="Eyebrow">
                    <label className={fieldLabel}>Eyebrow</label>
                  </LabelRow>
                  <input className={`${fieldInput} mt-1`} value={r.eyebrow ?? ""} onChange={(e) => update(i, { eyebrow: e.target.value })} />
                </div>
                <div>
                  <LabelRow k={`${r.key}.ctaLabel`} label="Button text">
                    <label className={fieldLabel}>Button text</label>
                  </LabelRow>
                  <input className={`${fieldInput} mt-1`} value={r.ctaLabel ?? ""} onChange={(e) => update(i, { ctaLabel: e.target.value })} placeholder="Get started" />
                </div>
                <div>
                  <LabelRow k={`${r.key}.title`} label="Title">
                    <label className={fieldLabel}>Title</label>
                  </LabelRow>
                  <input className={`${fieldInput} mt-1`} value={r.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} />
                </div>
                <div>
                  <LabelRow k={`${r.key}.titleAccent`} label="Title (accent part)">
                    <label className={fieldLabel}>Title (accent part)</label>
                  </LabelRow>
                  <input className={`${fieldInput} mt-1`} value={r.titleAccent ?? ""} onChange={(e) => update(i, { titleAccent: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={fieldLabel}>Hero card title</label>
                  <textarea rows={2} className={`${fieldInput} mt-1`} value={r.cardTitle ?? ""} onChange={(e) => update(i, { cardTitle: e.target.value })} />
                  <p className="mt-1 text-[12px] text-[#8a8a8a]">
                    Shown on the small card beside the hero. A line break
                    controls where it wraps.
                    {embedded && r.key !== "weight-loss" ? (
                      <> Also editable under <strong>Hero — right cards</strong> above; the two stay in step.</>
                    ) : null}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <LabelRow k={`${r.key}.blurb`} label="Blurb">
                    <label className={fieldLabel}>Blurb</label>
                  </LabelRow>
                  <textarea rows={2} className={`${fieldInput} mt-1`} value={r.blurb ?? ""} onChange={(e) => update(i, { blurb: e.target.value })} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className={fieldLabel}>Bullet points</span>
                  <button
                    type="button"
                    onClick={() => update(i, { bullets: [...r.bullets, ""] })}
                    className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
                  >
                    + Add bullet
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {r.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2">
                      <input
                        aria-label={`Bullet ${bi + 1}`}
                        className={fieldInput}
                        value={b}
                        onChange={(e) => updateBullet(i, bi, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => update(i, { bullets: r.bullets.filter((_, x) => x !== bi) })}
                        className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <span className={fieldLabel}>Hero card image</span>
                  <p className="text-[12px] text-[#8a8a8a]">Small card beside the hero, at the top of the page.</p>
                  <MediaPicker
                    valueId={null}
                    valueUrl={r.cardImage || null}
                    onChange={(_id, url) => update(i, { cardImage: url ?? "" })}
                  />
                </div>
                <div>
                  <span className={fieldLabel}>Section portrait</span>
                  <p className="text-[12px] text-[#8a8a8a]">The large photo at the top of this band.</p>
                  <MediaPicker
                    valueId={null}
                    valueUrl={r.heroImage || null}
                    onChange={(_id, url) => update(i, { heroImage: url ?? "" })}
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabel}>Image alt text</label>
                <input className={`${fieldInput} mt-1`} value={r.imageAlt ?? ""} onChange={(e) => update(i, { imageAlt: e.target.value })} />
                <p className="mt-1 text-[12px] text-[#8a8a8a]">
                  Describes the image for screen readers and when it fails to load.
                </p>
              </div>

              {/* Panel content — listed in the order it reads down the page. */}
              {r.key === "weight-loss" && (
                <div className="space-y-4 rounded-lg border border-[#eef1e8] p-3">
                  <div>
                    <p className="text-[13px] font-medium text-[#1a1a1a]">
                      Panel content
                    </p>
                    <p className="text-[12px] text-[#8a8a8a]">
                      In page order. Wrap a phrase in{" "}
                      <code className="rounded bg-[#eef1e8] px-1">**stars**</code>{" "}
                      to give it the green accent.
                    </p>
                  </div>

                  {/* Card 1 — the wide banner */}
                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      1 · Top banner
                    </p>
                    <div>
                      <LabelRow k={`${r.key}.card1Title`} label="Heading">
                        <label className={fieldLabel}>Heading</label>
                      </LabelRow>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card1Title ?? ""} onChange={(e) => updateDetail(i, { card1Title: e.target.value })} />
                      <p className="mt-1 text-[12px] text-[#8a8a8a]">A line break splits it across two lines.</p>
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.card1Body`} label="Body">
                        <label className={fieldLabel}>Body</label>
                      </LabelRow>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card1Body ?? ""} onChange={(e) => updateDetail(i, { card1Body: e.target.value })} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={fieldLabel}>Feature rows</span>
                        <button type="button" onClick={() => updateDetail(i, { card1Features: [...(r.detail.card1Features ?? []), { title: "", sub: "" }] })} className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]">+ Add row</button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {(r.detail.card1Features ?? []).map((f, fi) => (
                          <div key={fi} className="flex flex-wrap items-center gap-2">
                            <input aria-label="Feature title" className={`${fieldInput} min-w-[140px] flex-1`} value={f.title} onChange={(e) => updateFeatureRow(i, fi, { title: e.target.value })} placeholder="Personalised Assessment" />
                            <input aria-label="Feature subtitle" className={`${fieldInput} min-w-[180px] flex-[2]`} value={f.sub} onChange={(e) => updateFeatureRow(i, fi, { sub: e.target.value })} placeholder="Every treatment starts with a clinical review." />
                            <button type="button" onClick={() => updateDetail(i, { card1Features: (r.detail.card1Features ?? []).filter((_, x) => x !== fi) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.card1Cta`} label="Button text">
                        <label className={fieldLabel}>Button text</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.card1Cta ?? ""} onChange={(e) => updateDetail(i, { card1Cta: e.target.value })} />
                    </div>
                    <div>
                      <span className={fieldLabel}>Image</span>
                      <MediaPicker valueId={null} valueUrl={r.detail.card1Image || null} onChange={(_id, url) => updateDetail(i, { card1Image: url ?? "" })} />
                    </div>
                  </div>

                  {/* Card 2 — bottom left */}
                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      2 · Bottom-left card
                    </p>
                    <div>
                      <LabelRow k={`${r.key}.card2Title`} label="Heading">
                        <label className={fieldLabel}>Heading</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1`} value={r.detail.card2Title ?? ""} onChange={(e) => updateDetail(i, { card2Title: e.target.value })} />
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.card2Body`} label="Body">
                        <label className={fieldLabel}>Body</label>
                      </LabelRow>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card2Body ?? ""} onChange={(e) => updateDetail(i, { card2Body: e.target.value })} />
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.ctaPrimary`} label="Button text">
                        <label className={fieldLabel}>Button text</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.ctaPrimary ?? ""} onChange={(e) => updateDetail(i, { ctaPrimary: e.target.value })} />
                    </div>
                    <div>
                      <span className={fieldLabel}>Portrait</span>
                      <MediaPicker valueId={null} valueUrl={r.detail.card2Image || null} onChange={(_id, url) => updateDetail(i, { card2Image: url ?? "" })} />
                    </div>
                  </div>

                  {/* Card 3 — bottom right */}
                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      3 · Bottom-right card
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <LabelRow k={`${r.key}.card3Title`} label="Heading">
                          <label className={fieldLabel}>Heading</label>
                        </LabelRow>
                        <input className={`${fieldInput} mt-1`} value={r.detail.card3Title ?? ""} onChange={(e) => updateDetail(i, { card3Title: e.target.value })} />
                      </div>
                      <div>
                        <LabelRow k={`${r.key}.card3Em`} label="Italic line">
                          <label className={fieldLabel}>Italic line</label>
                        </LabelRow>
                        <input className={`${fieldInput} mt-1`} value={r.detail.card3Em ?? ""} onChange={(e) => updateDetail(i, { card3Em: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.card3Body`} label="Body">
                        <label className={fieldLabel}>Body</label>
                      </LabelRow>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card3Body ?? ""} onChange={(e) => updateDetail(i, { card3Body: e.target.value })} />
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.ctaSecondary`} label="Button text">
                        <label className={fieldLabel}>Button text</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.ctaSecondary ?? ""} onChange={(e) => updateDetail(i, { ctaSecondary: e.target.value })} />
                    </div>
                    <div>
                      <span className={fieldLabel}>Check-in widget image</span>
                      <MediaPicker valueId={null} valueUrl={r.detail.card3Image || null} onChange={(_id, url) => updateDetail(i, { card3Image: url ?? "" })} />
                    </div>
                  </div>

                  <p className="text-[13px] font-medium text-[#1a1a1a]">
                    4 · Feature chips
                  </p>
                  {(["chipsLeft", "chipsRight"] as const).map((side) => (
                    <div key={side}>
                      <div className="flex items-center justify-between">
                        <span className={fieldLabel}>
                          {side === "chipsLeft" ? "Left chips" : "Right chips"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateDetail(i, {
                              [side]: [...(r.detail[side] ?? []), { label: "", sub: "", iconSrc: "" }],
                            })
                          }
                          className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
                        >
                          + Add chip
                        </button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {(r.detail[side] ?? []).map((c, ci) => (
                          <div key={ci} className="flex flex-wrap items-center gap-2">
                            <input aria-label="Chip label" className={`${fieldInput} min-w-[110px] flex-1`} value={c.label} onChange={(e) => updateChip(i, side, ci, { label: e.target.value })} placeholder="Medication" />
                            <input aria-label="Chip subtitle" className={`${fieldInput} min-w-[130px] flex-1`} value={c.sub} onChange={(e) => updateChip(i, side, ci, { sub: e.target.value })} placeholder="Clinically-backed" />
                            <input aria-label="Chip icon" className={`${fieldInput} min-w-[150px] flex-1`} value={c.iconSrc} onChange={(e) => updateChip(i, side, ci, { iconSrc: e.target.value })} placeholder="/assets/icons/chip-…svg" />
                            <button type="button" onClick={() => updateDetail(i, { [side]: (r.detail[side] ?? []).filter((_, x) => x !== ci) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {r.key === "erectile-dysfunction" && (
                <div className="space-y-4 rounded-lg border border-[#eef1e8] p-3">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">
                    Panel content
                  </p>

                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      1 · Intro card
                    </p>
                    <div>
                      <LabelRow k={`${r.key}.card1Body`} label="Body">
                        <label className={fieldLabel}>Body</label>
                      </LabelRow>
                      <textarea rows={3} className={`${fieldInput} mt-1`} value={r.detail.card1Body ?? ""} onChange={(e) => updateDetail(i, { card1Body: e.target.value })} />
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.card1Cta`} label="Button text">
                        <label className={fieldLabel}>Button text</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.card1Cta ?? ""} onChange={(e) => updateDetail(i, { card1Cta: e.target.value })} />
                    </div>
                    <div>
                      <span className={fieldLabel}>Image</span>
                      <MediaPicker valueId={null} valueUrl={r.detail.card1Image || null} onChange={(_id, url) => updateDetail(i, { card1Image: url ?? "" })} />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      2 · Goals card
                    </p>
                    <div>
                      <LabelRow k={`${r.key}.goalsTitle`} label="Heading">
                        <label className={fieldLabel}>Heading</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1`} value={r.detail.goalsTitle ?? ""} onChange={(e) => updateDetail(i, { goalsTitle: e.target.value })} />
                    </div>
                    <div>
                      <span className={fieldLabel}>Background image</span>
                      <MediaPicker valueId={null} valueUrl={r.detail.card2Image || null} onChange={(_id, url) => updateDetail(i, { card2Image: url ?? "" })} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className={fieldLabel}>Goal options</span>
                      <button type="button" onClick={() => updateDetail(i, { goals: [...(r.detail.goals ?? []), ""] })} className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]">
                        + Add goal
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {(r.detail.goals ?? []).map((g, gi) => (
                        <div key={gi} className="flex items-center gap-2">
                          <input aria-label={`Goal ${gi + 1}`} className={fieldInput} value={g} onChange={(e) => updateDetail(i, { goals: (r.detail.goals ?? []).map((x, y) => (y === gi ? e.target.value : x)) })} />
                          <button type="button" onClick={() => updateDetail(i, { goals: (r.detail.goals ?? []).filter((_, x) => x !== gi) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className={fieldLabel}>Testimonials</span>
                      <button type="button" onClick={() => updateDetail(i, { testimonials: [...(r.detail.testimonials ?? []), { quote: "", name: "", meta: "" }] })} className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]">
                        + Add testimonial
                      </button>
                    </div>
                    <p className="mt-1 rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
                      These are shown as patient outcomes for a prescription
                      medicine. Only publish quotes from real, consenting
                      patients — invented ones breach ASA and MHRA rules for a
                      registered pharmacy.
                    </p>
                    <div className="mt-2 space-y-3">
                      {(r.detail.testimonials ?? []).map((t, ti) => (
                        <div key={ti} className="rounded-lg border border-[#e8ece0] p-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <input aria-label="Name" className={`${fieldInput} min-w-[120px] flex-1`} value={t.name} onChange={(e) => updateTestimonial(i, ti, { name: e.target.value })} placeholder="Name, age" />
                            <input aria-label="Meta" className={`${fieldInput} min-w-[140px] flex-1`} value={t.meta} onChange={(e) => updateTestimonial(i, ti, { meta: e.target.value })} placeholder="2 months into treatment" />
                            <button type="button" onClick={() => updateDetail(i, { testimonials: (r.detail.testimonials ?? []).filter((_, x) => x !== ti) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                          </div>
                          <textarea aria-label="Quote" rows={2} className={`${fieldInput} mt-2`} value={t.quote} onChange={(e) => updateTestimonial(i, ti, { quote: e.target.value })} placeholder="Quote" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {r.key === "period-delay" && (
                <div className="space-y-4 rounded-lg border border-[#eef1e8] p-3">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">
                    Panel content
                  </p>

                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      1 · Intro card
                    </p>
                    <div>
                      <LabelRow k={`${r.key}.card1Body`} label="Body">
                        <label className={fieldLabel}>Body</label>
                      </LabelRow>
                      <textarea rows={3} className={`${fieldInput} mt-1`} value={r.detail.card1Body ?? ""} onChange={(e) => updateDetail(i, { card1Body: e.target.value })} />
                    </div>
                    <div>
                      <span className={fieldLabel}>Image</span>
                      <MediaPicker valueId={null} valueUrl={r.detail.card1Image || null} onChange={(_id, url) => updateDetail(i, { card1Image: url ?? "" })} />
                    </div>
                  </div>

                  <div>
                    <span className={fieldLabel}>2 · Tags card portrait</span>
                    <MediaPicker valueId={null} valueUrl={r.detail.card2Image || null} onChange={(_id, url) => updateDetail(i, { card2Image: url ?? "" })} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <LabelRow k={`${r.key}.tagsTitle`} label="Tags card heading">
                        <label className={fieldLabel}>Tags card heading</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1`} value={r.detail.tagsTitle ?? ""} onChange={(e) => updateDetail(i, { tagsTitle: e.target.value })} />
                    </div>
                    <div>
                      <LabelRow k={`${r.key}.ctaSecondary`} label="Button text">
                        <label className={fieldLabel}>Button text</label>
                      </LabelRow>
                      <input className={`${fieldInput} mt-1`} value={r.detail.ctaSecondary ?? ""} onChange={(e) => updateDetail(i, { ctaSecondary: e.target.value })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={fieldLabel}>Topic tags</span>
                    <button type="button" onClick={() => updateDetail(i, { tags: [...(r.detail.tags ?? []), ""] })} className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]">
                      + Add tag
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(r.detail.tags ?? []).map((t, ti) => (
                      <div key={ti} className="flex items-center gap-1">
                        <input aria-label={`Tag ${ti + 1}`} className={`${fieldInput} max-w-[160px]`} value={t} onChange={(e) => updateDetail(i, { tags: (r.detail.tags ?? []).map((x, y) => (y === ti ? e.target.value : x)) })} />
                        <button type="button" onClick={() => updateDetail(i, { tags: (r.detail.tags ?? []).filter((_, x) => x !== ti) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="rounded-lg border border-[#e4e7de] p-3">
                <summary className="cursor-pointer text-[13px] font-medium text-[#1a1a1a]">
                  Links (advanced)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>Main link</label>
                    <input className={`${fieldInput} mt-1`} value={r.href ?? ""} onChange={(e) => update(i, { href: e.target.value })} />
                  </div>
                  <div>
                    <label className={fieldLabel}>&ldquo;Learn more&rdquo; link</label>
                    <input className={`${fieldInput} mt-1`} value={r.learnMoreHref ?? ""} onChange={(e) => update(i, { learnMoreHref: e.target.value })} />
                  </div>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#8a6100]">
                  These point at real pages. A typo here sends visitors to a
                  404 — change them only if the page has actually moved.
                </p>
              </details>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save treatments"}
        </button>
      </div>
    </div>
    </TextStyleCtx.Provider>
  );
}
