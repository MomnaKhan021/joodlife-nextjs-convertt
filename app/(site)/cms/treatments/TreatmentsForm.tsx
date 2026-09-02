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

export default function TreatmentsForm({
  initial,
  embedded = false,
}: {
  initial: Row[];
  /** Rendered inside the Home page screen — drop the page chrome. */
  embedded?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
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

  return (
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel}>Eyebrow</label>
                  <input className={`${fieldInput} mt-1`} value={r.eyebrow ?? ""} onChange={(e) => update(i, { eyebrow: e.target.value })} />
                </div>
                <div>
                  <label className={fieldLabel}>Button text</label>
                  <input className={`${fieldInput} mt-1`} value={r.ctaLabel ?? ""} onChange={(e) => update(i, { ctaLabel: e.target.value })} placeholder="Get started" />
                </div>
                <div>
                  <label className={fieldLabel}>Title</label>
                  <input className={`${fieldInput} mt-1`} value={r.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} />
                </div>
                <div>
                  <label className={fieldLabel}>Title (accent part)</label>
                  <input className={`${fieldInput} mt-1`} value={r.titleAccent ?? ""} onChange={(e) => update(i, { titleAccent: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={fieldLabel}>Card title</label>
                  <textarea rows={2} className={`${fieldInput} mt-1`} value={r.cardTitle ?? ""} onChange={(e) => update(i, { cardTitle: e.target.value })} />
                  <p className="mt-1 text-[12px] text-[#8a8a8a]">
                    Shown on the hero card. A line break controls where it wraps.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className={fieldLabel}>Blurb</label>
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
                  <span className={fieldLabel}>Card image</span>
                  <MediaPicker
                    valueId={null}
                    valueUrl={r.cardImage || null}
                    onChange={(_id, url) => update(i, { cardImage: url ?? "" })}
                  />
                </div>
                <div>
                  <span className={fieldLabel}>Section image</span>
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
                      <label className={fieldLabel}>Heading</label>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card1Title ?? ""} onChange={(e) => updateDetail(i, { card1Title: e.target.value })} />
                      <p className="mt-1 text-[12px] text-[#8a8a8a]">A line break splits it across two lines.</p>
                    </div>
                    <div>
                      <label className={fieldLabel}>Body</label>
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
                      <label className={fieldLabel}>Button text</label>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.card1Cta ?? ""} onChange={(e) => updateDetail(i, { card1Cta: e.target.value })} />
                    </div>
                  </div>

                  {/* Card 2 — bottom left */}
                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      2 · Bottom-left card
                    </p>
                    <div>
                      <label className={fieldLabel}>Heading</label>
                      <input className={`${fieldInput} mt-1`} value={r.detail.card2Title ?? ""} onChange={(e) => updateDetail(i, { card2Title: e.target.value })} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Body</label>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card2Body ?? ""} onChange={(e) => updateDetail(i, { card2Body: e.target.value })} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Button text</label>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.ctaPrimary ?? ""} onChange={(e) => updateDetail(i, { ctaPrimary: e.target.value })} />
                    </div>
                  </div>

                  {/* Card 3 — bottom right */}
                  <div className="space-y-3 rounded-lg border border-[#e8ece0] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      3 · Bottom-right card
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={fieldLabel}>Heading</label>
                        <input className={`${fieldInput} mt-1`} value={r.detail.card3Title ?? ""} onChange={(e) => updateDetail(i, { card3Title: e.target.value })} />
                      </div>
                      <div>
                        <label className={fieldLabel}>Italic line</label>
                        <input className={`${fieldInput} mt-1`} value={r.detail.card3Em ?? ""} onChange={(e) => updateDetail(i, { card3Em: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className={fieldLabel}>Body</label>
                      <textarea rows={2} className={`${fieldInput} mt-1`} value={r.detail.card3Body ?? ""} onChange={(e) => updateDetail(i, { card3Body: e.target.value })} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Button text</label>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.ctaSecondary ?? ""} onChange={(e) => updateDetail(i, { ctaSecondary: e.target.value })} />
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
                      <label className={fieldLabel}>Body</label>
                      <textarea rows={3} className={`${fieldInput} mt-1`} value={r.detail.card1Body ?? ""} onChange={(e) => updateDetail(i, { card1Body: e.target.value })} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Button text</label>
                      <input className={`${fieldInput} mt-1 max-w-[240px]`} value={r.detail.card1Cta ?? ""} onChange={(e) => updateDetail(i, { card1Cta: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>2 · Goals card heading</label>
                    <input className={`${fieldInput} mt-1`} value={r.detail.goalsTitle ?? ""} onChange={(e) => updateDetail(i, { goalsTitle: e.target.value })} />
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
                      <label className={fieldLabel}>Body</label>
                      <textarea rows={3} className={`${fieldInput} mt-1`} value={r.detail.card1Body ?? ""} onChange={(e) => updateDetail(i, { card1Body: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={fieldLabel}>2 · Tags card heading</label>
                      <input className={`${fieldInput} mt-1`} value={r.detail.tagsTitle ?? ""} onChange={(e) => updateDetail(i, { tagsTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className={fieldLabel}>Button text</label>
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
  );
}
