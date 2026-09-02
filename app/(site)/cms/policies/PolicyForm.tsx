"use client";

import Link from "next/link";
import { useState } from "react";

import type { PolicyBlock, PolicySection } from "@/app/(site)/policies/PolicyPage";
import type { PolicySlug } from "@/lib/policyDefaults";
import {
  POLICY_FIELD,
  POLICY_LABEL,
  type PolicyDoc,
} from "@/lib/policyContentTypes";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";

/**
 * Editor for one policy page.
 *
 * A policy is a list of numbered sections, each holding paragraphs,
 * sub-headings and bullet lists — so the editor is a repeater of sections,
 * each with a repeater of blocks, in document order.
 *
 * Saving writes only this policy's field on the shared global, so editing
 * one page can't disturb the other two.
 */

const BLOCK_LABEL: Record<PolicyBlock["type"], string> = {
  p: "Paragraph",
  h: "Sub-heading",
  list: "Bullet list",
};

export default function PolicyForm({
  slug,
  initial,
}: {
  slug: PolicySlug;
  initial: PolicyDoc;
}) {
  const [title, setTitle] = useState(initial.title);
  const [titleAccent, setTitleAccent] = useState(initial.titleAccent);
  const [intro, setIntro] = useState(initial.intro);
  const [updated, setUpdated] = useState(initial.updated);
  const [sections, setSections] = useState<PolicySection[]>(initial.sections);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setSection(si: number, patch: Partial<PolicySection>) {
    setSections(sections.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  }
  function moveSection(si: number, dir: -1 | 1) {
    const j = si + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[si], next[j]] = [next[j], next[si]];
    setSections(next);
  }
  function setBlock(si: number, bi: number, block: PolicyBlock) {
    setSection(si, {
      blocks: sections[si].blocks.map((b, i) => (i === bi ? block : b)),
    });
  }
  function moveBlock(si: number, bi: number, dir: -1 | 1) {
    const j = bi + dir;
    const blocks = sections[si].blocks;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[bi], next[j]] = [next[j], next[bi]];
    setSection(si, { blocks: next });
  }
  function addBlock(si: number, type: PolicyBlock["type"]) {
    const block: PolicyBlock =
      type === "list" ? { type: "list", items: [""] } : { type, text: "" };
    setSection(si, { blocks: [...sections[si].blocks, block] });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("policies", {
        [POLICY_FIELD[slug]]: {
          title,
          titleAccent,
          intro,
          updated,
          sections: sections.filter((s) => s.heading.trim() || s.blocks.length),
        },
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
          {POLICY_LABEL[slug]}
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/policies/{slug}</code>
        </p>
        <p className="mt-2 rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
          This is a legal document the pharmacy operates under. Changes take
          effect on the live site as soon as they&apos;re saved — have them
          reviewed before publishing, and update the &ldquo;last updated&rdquo;
          date below when the terms actually change.
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
        {/* Page header */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">Page header</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Title</label>
              <input className={`${fieldInput} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel}>Title (italic part)</label>
              <input className={`${fieldInput} mt-1`} value={titleAccent} onChange={(e) => setTitleAccent(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel}>Intro</label>
              <textarea rows={2} className={`${fieldInput} mt-1`} value={intro} onChange={(e) => setIntro(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel}>Last updated</label>
              <input className={`${fieldInput} mt-1`} value={updated} onChange={(e) => setUpdated(e.target.value)} placeholder="11 August 2026" />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            Sections ({sections.length})
          </h2>
          <button
            type="button"
            onClick={() => setSections([...sections, { heading: "", blocks: [] }])}
            className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
          >
            + Add section
          </button>
        </div>

        {sections.map((s, si) => (
          <details key={si} className="rounded-xl border border-[#e4e7de] bg-white p-5">
            <summary className="cursor-pointer text-[14px] font-medium text-[#1a1a1a]">
              {s.heading || `Section ${si + 1}`}
              <span className="ml-2 text-[12px] font-normal text-[#8a8a8a]">
                {s.blocks.length} block{s.blocks.length === 1 ? "" : "s"}
              </span>
            </summary>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  aria-label="Section heading"
                  className={`${fieldInput} flex-1`}
                  value={s.heading}
                  onChange={(e) => setSection(si, { heading: e.target.value })}
                  placeholder="1. About us"
                />
                <button type="button" onClick={() => moveSection(si, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                <button type="button" onClick={() => moveSection(si, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                <button type="button" onClick={() => setSections(sections.filter((_, i) => i !== si))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove section">✕</button>
              </div>

              {s.blocks.map((b, bi) => (
                <div key={bi} className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      {BLOCK_LABEL[b.type]}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(si, bi, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                      <button type="button" onClick={() => moveBlock(si, bi, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                      <button type="button" onClick={() => setSection(si, { blocks: s.blocks.filter((_, i) => i !== bi) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove block">✕</button>
                    </div>
                  </div>

                  {b.type === "list" ? (
                    <div className="space-y-2">
                      {b.items.map((item, ii) => (
                        <div key={ii} className="flex items-center gap-2">
                          <input
                            aria-label={`Item ${ii + 1}`}
                            className={fieldInput}
                            value={item}
                            onChange={(e) =>
                              setBlock(si, bi, {
                                type: "list",
                                items: b.items.map((x, i) => (i === ii ? e.target.value : x)),
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setBlock(si, bi, {
                                type: "list",
                                items: b.items.filter((_, i) => i !== ii),
                              })
                            }
                            className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBlock(si, bi, { type: "list", items: [...b.items, ""] })}
                        className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
                      >
                        + Add item
                      </button>
                    </div>
                  ) : (
                    <textarea
                      aria-label={BLOCK_LABEL[b.type]}
                      rows={b.type === "h" ? 1 : 4}
                      className={fieldInput}
                      value={b.text}
                      onChange={(e) => setBlock(si, bi, { type: b.type, text: e.target.value })}
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                {(["p", "h", "list"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addBlock(si, t)}
                    className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
                  >
                    + {BLOCK_LABEL[t]}
                  </button>
                ))}
              </div>
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
          {saving ? "Saving…" : `Save ${POLICY_LABEL[slug]}`}
        </button>
      </div>
    </div>
  );
}
