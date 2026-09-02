"use client";

import Link from "next/link";
import { useState } from "react";

import type { TreatmentRow } from "@/lib/treatmentContentTypes";
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

export default function TreatmentsForm({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
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
    <div className="mx-auto w-full max-w-[1000px]">
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
