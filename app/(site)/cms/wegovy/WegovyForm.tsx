"use client";

import Link from "next/link";
import { useState } from "react";

import {
  USP_ICONS,
  type ComparisonRow,
  type UspIcon,
  type WegovyContent,
} from "@/lib/wegovyContentTypes";

import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import MediaPicker from "../MediaPicker";

/**
 * Editor for /wegovy-pills — eleven sections, in the order a reader meets
 * them.
 *
 * Several sections carry regulated copy: efficacy figures, MHRA status,
 * dosing and pricing, and the safety notice. The banner at the top says so,
 * and the sections that carry it are flagged individually rather than
 * relying on the editor to remember which is which.
 */

const card = "space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5";
const iconBtn =
  "rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]";
const delBtn =
  "rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]";
const addBtn =
  "rounded-lg border border-[#d8ddd0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]";

const USP_ICON_LABEL: Record<UspIcon, string> = {
  delivery: "Delivery box",
  medication: "Medication",
  cancel: "Cancel / refresh",
  support: "Message bubble",
  customers: "Person",
};

/** Amber note marking a block whose wording is clinically regulated. */
function Regulated({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
      {children}
    </p>
  );
}

function moved<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** A heading and its serif-italic second half, side by side. */
function Pair({
  label,
  first,
  second,
  onFirst,
  onSecond,
}: {
  label: string;
  first: string;
  second: string;
  onFirst: (v: string) => void;
  onSecond: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={fieldLabel}>{label}</label>
        <input
          className={`${fieldInput} mt-1`}
          value={first}
          onChange={(e) => onFirst(e.target.value)}
        />
      </div>
      <div>
        <label className={fieldLabel}>{label} (italic part)</label>
        <input
          className={`${fieldInput} mt-1`}
          value={second}
          onChange={(e) => onSecond(e.target.value)}
        />
      </div>
    </div>
  );
}

/** Button text + link. An empty label hides the button on the page. */
function CtaFields({
  label,
  href,
  onLabel,
  onHref,
}: {
  label: string;
  href: string;
  onLabel: (v: string) => void;
  onHref: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={fieldLabel}>Button text</label>
        <input
          className={`${fieldInput} mt-1`}
          value={label}
          onChange={(e) => onLabel(e.target.value)}
        />
        <p className="mt-1 text-[12px] text-[#8a8a8a]">
          Leave empty to hide the button.
        </p>
      </div>
      <div>
        <label className={fieldLabel}>Button link</label>
        <input
          className={`${fieldInput} mt-1`}
          value={href}
          onChange={(e) => onHref(e.target.value)}
        />
      </div>
    </div>
  );
}

/** Media picker plus its alt text. Omit onAlt for decorative backdrops. */
function PictureField({
  label,
  src,
  onSrc,
  alt,
  onAlt,
}: {
  label: string;
  src: string;
  onSrc: (v: string) => void;
  alt?: string;
  onAlt?: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={fieldLabel}>{label}</label>
        <div className="mt-1">
          <MediaPicker
            valueId={null}
            valueUrl={src}
            onChange={(_id, url) => onSrc(url ?? "")}
          />
        </div>
      </div>
      {onAlt ? (
        <div>
          <label className={fieldLabel}>Photo description</label>
          <input
            className={`${fieldInput} mt-1`}
            value={alt ?? ""}
            onChange={(e) => onAlt(e.target.value)}
          />
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            Read aloud by screen readers.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** A list of plain strings with add / reorder / remove. */
function StringList({
  items,
  onChange,
  label,
  addLabel,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  label: string;
  addLabel: string;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className={fieldLabel}>{label}</label>
        <button
          type="button"
          className={addBtn}
          onClick={() => onChange([...items, ""])}
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              aria-label={`${label} ${i + 1}`}
              className={fieldInput}
              value={v}
              placeholder={placeholder}
              onChange={(e) =>
                onChange(items.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
            <button
              type="button"
              className={iconBtn}
              title="Move up"
              onClick={() => onChange(moved(items, i, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              className={iconBtn}
              title="Move down"
              onClick={() => onChange(moved(items, i, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className={delBtn}
              title="Remove"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One comparison column's rows. */
function RowEditor({
  rows,
  onChange,
  title,
}: {
  rows: ComparisonRow[];
  onChange: (next: ComparisonRow[]) => void;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
          {title}
        </span>
        <button
          type="button"
          className={addBtn}
          onClick={() => onChange([...rows, { label: "", mark: "check" }])}
        >
          + Add row
        </button>
      </div>
      <p className="mb-2 text-[12px] text-[#8a8a8a]">
        The first row is the dosing cadence and is always shown bold, with no
        tick.
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              aria-label={`${title} row ${i + 1}`}
              className={`${fieldInput} min-w-[160px] flex-1`}
              value={r.label}
              onChange={(e) =>
                onChange(
                  rows.map((x, j) =>
                    j === i ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
            />
            <select
              aria-label={`${title} row ${i + 1} marker`}
              className={`${fieldInput} w-[120px]`}
              value={r.mark}
              onChange={(e) =>
                onChange(
                  rows.map((x, j) =>
                    j === i
                      ? { ...x, mark: e.target.value as ComparisonRow["mark"] }
                      : x,
                  ),
                )
              }
            >
              <option value="check">Tick</option>
              <option value="minus">Dash</option>
              <option value="none">Nothing</option>
            </select>
            <button
              type="button"
              className={iconBtn}
              title="Move up"
              onClick={() => onChange(moved(rows, i, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              className={iconBtn}
              title="Move down"
              onClick={() => onChange(moved(rows, i, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className={delBtn}
              title="Remove row"
              onClick={() => onChange(rows.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WegovyForm({ initial }: { initial: WegovyContent }) {
  const [announcement, setAnnouncement] = useState(initial.announcement);
  const [hero, setHero] = useState(initial.hero);
  const [uspBar, setUspBar] = useState(initial.uspBar);
  const [whatIsPill, setWhatIsPill] = useState(initial.whatIsPill);
  const [comparison, setComparison] = useState(initial.comparison);
  const [howItWorks, setHowItWorks] = useState(initial.howItWorks);
  const [realResults, setRealResults] = useState(initial.realResults);
  const [dosing, setDosing] = useState(initial.dosing);
  const [whyChoose, setWhyChoose] = useState(initial.whyChoose);
  const [faq, setFaq] = useState(initial.faq);
  const [finalCta, setFinalCta] = useState(initial.finalCta);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("wegovy-page", {
        announcement,
        hero: { ...hero, stats: hero.stats.filter((s) => s.trim()) },
        uspBar: { items: uspBar.items.filter((i) => i.label.trim()) },
        whatIsPill: {
          ...whatIsPill,
          cards: whatIsPill.cards.filter((c) => c.title.trim()),
        },
        comparison: {
          ...comparison,
          pillRows: comparison.pillRows.filter((r) => r.label.trim()),
          penRows: comparison.penRows.filter((r) => r.label.trim()),
        },
        howItWorks,
        realResults,
        dosing: { ...dosing, doses: dosing.doses.filter((d) => d.mg.trim()) },
        whyChoose: {
          ...whyChoose,
          benefits: whyChoose.benefits.filter((b) => b.trim()),
        },
        faq: { ...faq, items: faq.items.filter((f) => f.q.trim() && f.a.trim()) },
        finalCta,
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
        <Link
          href="/cms"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Wegovy Pills page
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">
            /wegovy-pills
          </code>{" "}
          — the sections below are in the order they appear on the page.
        </p>
        <p className="mt-2 rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
          This page advertises a prescription medicine. The efficacy figures,
          the MHRA claim, the dosing and pricing table and the safety notice
          are all regulated — changing them is a clinical and advertising
          decision, not a copy tweak. Blocks that carry regulated wording are
          marked below. Have changes reviewed before saving.
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
        {/* 1. Announcement */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            1. Strip above the header
          </h2>
          <input
            aria-label="Announcement text"
            className={fieldInput}
            value={announcement.text}
            onChange={(e) => setAnnouncement({ text: e.target.value })}
          />
          <p className="text-[12px] text-[#8a8a8a]">
            This page has its own strip — it does not use the sitewide
            announcement bar.
          </p>
        </div>

        {/* 2. Hero */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">2. Hero</h2>
          <Pair
            label="Title"
            first={hero.title}
            second={hero.titleAccent}
            onFirst={(v) => setHero({ ...hero, title: v })}
            onSecond={(v) => setHero({ ...hero, titleAccent: v })}
          />
          <div>
            <label className={fieldLabel}>Body</label>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={hero.body}
              onChange={(e) => setHero({ ...hero, body: e.target.value })}
            />
          </div>
          <div>
            <label className={fieldLabel}>Trustpilot line</label>
            <input
              className={`${fieldInput} mt-1`}
              value={hero.reviewsLabel}
              onChange={(e) =>
                setHero({ ...hero, reviewsLabel: e.target.value })
              }
            />
          </div>
          <CtaFields
            label={hero.ctaLabel}
            href={hero.ctaHref}
            onLabel={(v) => setHero({ ...hero, ctaLabel: v })}
            onHref={(v) => setHero({ ...hero, ctaHref: v })}
          />
          <PictureField
            label="Background photo"
            src={hero.image}
            onSrc={(v) => setHero({ ...hero, image: v })}
            alt={hero.imageAlt}
            onAlt={(v) => setHero({ ...hero, imageAlt: v })}
          />
          <Regulated>
            The three claim lines below sit under the headline. They state
            efficacy and MHRA status.
          </Regulated>
          <StringList
            items={hero.stats}
            onChange={(stats) => setHero({ ...hero, stats })}
            label="Claim lines"
            addLabel="+ Add line"
            placeholder="MHRA-approved in the UK"
          />
        </div>

        {/* 3. Trust strip */}
        <div className={card}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              3. Scrolling trust strip
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The thin marquee under the hero. Pick an icon per row.
            </p>
          </div>
          <div className="space-y-2">
            {uspBar.items.map((it, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  aria-label={`Trust item ${i + 1}`}
                  className={`${fieldInput} min-w-[180px] flex-1`}
                  value={it.label}
                  onChange={(e) =>
                    setUspBar({
                      items: uspBar.items.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                />
                <select
                  aria-label={`Trust item ${i + 1} icon`}
                  className={`${fieldInput} w-[160px]`}
                  value={it.icon}
                  onChange={(e) =>
                    setUspBar({
                      items: uspBar.items.map((x, j) =>
                        j === i ? { ...x, icon: e.target.value as UspIcon } : x,
                      ),
                    })
                  }
                >
                  {USP_ICONS.map((k) => (
                    <option key={k} value={k}>
                      {USP_ICON_LABEL[k]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={iconBtn}
                  title="Move up"
                  onClick={() => setUspBar({ items: moved(uspBar.items, i, -1) })}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  title="Move down"
                  onClick={() => setUspBar({ items: moved(uspBar.items, i, 1) })}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={delBtn}
                  title="Remove"
                  onClick={() =>
                    setUspBar({ items: uspBar.items.filter((_, j) => j !== i) })
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={addBtn}
            onClick={() =>
              setUspBar({
                items: [...uspBar.items, { label: "", icon: "delivery" }],
              })
            }
          >
            + Add item
          </button>
        </div>

        {/* 4. What is the tablet */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            4. What is the tablet
          </h2>
          <Pair
            label="Heading"
            first={whatIsPill.heading}
            second={whatIsPill.headingAccent}
            onFirst={(v) => setWhatIsPill({ ...whatIsPill, heading: v })}
            onSecond={(v) => setWhatIsPill({ ...whatIsPill, headingAccent: v })}
          />
          <div>
            <label className={fieldLabel}>Bold line</label>
            <input
              className={`${fieldInput} mt-1`}
              value={whatIsPill.kicker}
              onChange={(e) =>
                setWhatIsPill({ ...whatIsPill, kicker: e.target.value })
              }
            />
          </div>
          <div>
            <label className={fieldLabel}>Body</label>
            <textarea
              rows={4}
              className={`${fieldInput} mt-1`}
              value={whatIsPill.body}
              onChange={(e) =>
                setWhatIsPill({ ...whatIsPill, body: e.target.value })
              }
            />
          </div>
          <CtaFields
            label={whatIsPill.ctaLabel}
            href={whatIsPill.ctaHref}
            onLabel={(v) => setWhatIsPill({ ...whatIsPill, ctaLabel: v })}
            onHref={(v) => setWhatIsPill({ ...whatIsPill, ctaHref: v })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Cards</label>
              <button
                type="button"
                className={addBtn}
                onClick={() =>
                  setWhatIsPill({
                    ...whatIsPill,
                    cards: [
                      ...whatIsPill.cards,
                      { title: "", body: "", image: "" },
                    ],
                  })
                }
              >
                + Add card
              </button>
            </div>
            <div className="space-y-3">
              {whatIsPill.cards.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      Card {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move left"
                        onClick={() =>
                          setWhatIsPill({
                            ...whatIsPill,
                            cards: moved(whatIsPill.cards, i, -1),
                          })
                        }
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move right"
                        onClick={() =>
                          setWhatIsPill({
                            ...whatIsPill,
                            cards: moved(whatIsPill.cards, i, 1),
                          })
                        }
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className={delBtn}
                        title="Remove card"
                        onClick={() =>
                          setWhatIsPill({
                            ...whatIsPill,
                            cards: whatIsPill.cards.filter((_, j) => j !== i),
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <input
                    aria-label={`Card ${i + 1} title`}
                    className={fieldInput}
                    value={c.title}
                    onChange={(e) =>
                      setWhatIsPill({
                        ...whatIsPill,
                        cards: whatIsPill.cards.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <textarea
                    aria-label={`Card ${i + 1} body`}
                    rows={2}
                    className={`${fieldInput} mt-2`}
                    value={c.body}
                    onChange={(e) =>
                      setWhatIsPill({
                        ...whatIsPill,
                        cards: whatIsPill.cards.map((x, j) =>
                          j === i ? { ...x, body: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <div className="mt-2">
                    <MediaPicker
                      valueId={null}
                      valueUrl={c.image}
                      onChange={(_id, url) =>
                        setWhatIsPill({
                          ...whatIsPill,
                          cards: whatIsPill.cards.map((x, j) =>
                            j === i ? { ...x, image: url ?? "" } : x,
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

        {/* 5. Comparison */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            5. Tablet vs injection
          </h2>
          <Pair
            label="Heading"
            first={comparison.heading}
            second={comparison.headingAccent}
            onFirst={(v) => setComparison({ ...comparison, heading: v })}
            onSecond={(v) => setComparison({ ...comparison, headingAccent: v })}
          />
          <div>
            <label className={fieldLabel}>Intro</label>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={comparison.body}
              onChange={(e) =>
                setComparison({ ...comparison, body: e.target.value })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Left card title</label>
              <input
                className={`${fieldInput} mt-1`}
                value={comparison.pillTitle}
                onChange={(e) =>
                  setComparison({ ...comparison, pillTitle: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Right card title</label>
              <input
                className={`${fieldInput} mt-1`}
                value={comparison.penTitle}
                onChange={(e) =>
                  setComparison({ ...comparison, penTitle: e.target.value })
                }
              />
            </div>
          </div>
          <Regulated>
            Both columns compare licensed medicines. Keep the rows aligned —
            the cards sit side by side and read across.
          </Regulated>
          <div className="grid gap-3 lg:grid-cols-2">
            <RowEditor
              title="Left card rows"
              rows={comparison.pillRows}
              onChange={(pillRows) => setComparison({ ...comparison, pillRows })}
            />
            <RowEditor
              title="Right card rows"
              rows={comparison.penRows}
              onChange={(penRows) => setComparison({ ...comparison, penRows })}
            />
          </div>
          <CtaFields
            label={comparison.ctaLabel}
            href={comparison.ctaHref}
            onLabel={(v) => setComparison({ ...comparison, ctaLabel: v })}
            onHref={(v) => setComparison({ ...comparison, ctaHref: v })}
          />
        </div>

        {/* 6. How it works */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            6. How it works
          </h2>
          <Pair
            label="Heading"
            first={howItWorks.heading}
            second={howItWorks.headingAccent}
            onFirst={(v) => setHowItWorks({ ...howItWorks, heading: v })}
            onSecond={(v) => setHowItWorks({ ...howItWorks, headingAccent: v })}
          />
          <div>
            <label className={fieldLabel}>Intro</label>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={howItWorks.intro}
              onChange={(e) =>
                setHowItWorks({ ...howItWorks, intro: e.target.value })
              }
            />
          </div>
          <div>
            <label className={fieldLabel}>Four callouts</label>
            <p className="mt-1 text-[12px] text-[#8a8a8a]">
              One per corner of the tablet image — always four, in this order:
              top-left, top-right, bottom-left, bottom-right. Press Enter for a
              line break; two short lines fit best.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {howItWorks.callouts.map((v, i) => (
                <textarea
                  key={i}
                  aria-label={`Callout ${i + 1}`}
                  rows={2}
                  className={fieldInput}
                  value={v}
                  onChange={(e) =>
                    setHowItWorks({
                      ...howItWorks,
                      callouts: howItWorks.callouts.map((x, j) =>
                        j === i ? e.target.value : x,
                      ),
                    })
                  }
                />
              ))}
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Body below the image</label>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={howItWorks.body}
              onChange={(e) =>
                setHowItWorks({ ...howItWorks, body: e.target.value })
              }
            />
          </div>
          <CtaFields
            label={howItWorks.ctaLabel}
            href={howItWorks.ctaHref}
            onLabel={(v) => setHowItWorks({ ...howItWorks, ctaLabel: v })}
            onHref={(v) => setHowItWorks({ ...howItWorks, ctaHref: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Second button text</label>
              <input
                className={`${fieldInput} mt-1`}
                value={howItWorks.secondaryLabel}
                onChange={(e) =>
                  setHowItWorks({
                    ...howItWorks,
                    secondaryLabel: e.target.value,
                  })
                }
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide it.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Second button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={howItWorks.secondaryHref}
                onChange={(e) =>
                  setHowItWorks({
                    ...howItWorks,
                    secondaryHref: e.target.value,
                  })
                }
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                <code className="rounded bg-[#eef1e8] px-1">#faq</code> jumps to
                the questions further down this page.
              </p>
            </div>
          </div>
          <PictureField
            label="Background image"
            src={howItWorks.image}
            onSrc={(v) => setHowItWorks({ ...howItWorks, image: v })}
          />
        </div>

        {/* 7. Real results */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            7. Real results
          </h2>
          <Regulated>
            This whole block states clinical trial outcomes. The big number is
            animated on screen and the asterisk points at the disclaimer in
            section 11 — if you change one, check the other.
          </Regulated>
          <Pair
            label="Heading"
            first={realResults.heading}
            second={realResults.headingAccent}
            onFirst={(v) => setRealResults({ ...realResults, heading: v })}
            onSecond={(v) => setRealResults({ ...realResults, headingAccent: v })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={fieldLabel}>Above the number</label>
              <input
                className={`${fieldInput} mt-1`}
                value={realResults.statPrefix}
                onChange={(e) =>
                  setRealResults({ ...realResults, statPrefix: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>The number</label>
              <input
                type="number"
                step="0.1"
                className={`${fieldInput} mt-1`}
                value={realResults.statValue}
                onChange={(e) =>
                  setRealResults({
                    ...realResults,
                    statValue: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>After the number</label>
              <input
                className={`${fieldInput} mt-1`}
                value={realResults.statSuffix}
                onChange={(e) =>
                  setRealResults({ ...realResults, statSuffix: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Caption under the number</label>
            <input
              className={`${fieldInput} mt-1`}
              value={realResults.statCaption}
              onChange={(e) =>
                setRealResults({ ...realResults, statCaption: e.target.value })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Study card title</label>
              <input
                className={`${fieldInput} mt-1`}
                value={realResults.studyTitle}
                onChange={(e) =>
                  setRealResults({ ...realResults, studyTitle: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Study card body</label>
              <textarea
                rows={3}
                className={`${fieldInput} mt-1`}
                value={realResults.studyBody}
                onChange={(e) =>
                  setRealResults({ ...realResults, studyBody: e.target.value })
                }
              />
            </div>
          </div>
          <PictureField
            label="Left panel backdrop"
            src={realResults.panelImage}
            onSrc={(v) => setRealResults({ ...realResults, panelImage: v })}
          />
          <PictureField
            label="Right photo"
            src={realResults.photo}
            onSrc={(v) => setRealResults({ ...realResults, photo: v })}
            alt={realResults.photoAlt}
            onAlt={(v) => setRealResults({ ...realResults, photoAlt: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel}>Overlay card title</label>
              <input
                className={`${fieldInput} mt-1`}
                value={realResults.overlayTitle}
                onChange={(e) =>
                  setRealResults({
                    ...realResults,
                    overlayTitle: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Overlay card body</label>
              <textarea
                rows={4}
                className={`${fieldInput} mt-1`}
                value={realResults.overlayBody}
                onChange={(e) =>
                  setRealResults({ ...realResults, overlayBody: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* 8. Dosing */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            8. Dosing &amp; pricing
          </h2>
          <Regulated>
            Doses and prices shown to patients. Only one card should carry the
            &ldquo;start here&rdquo; flag.
          </Regulated>
          <Pair
            label="Heading (this half is italic)"
            first={dosing.heading}
            second={dosing.headingAccent}
            onFirst={(v) => setDosing({ ...dosing, heading: v })}
            onSecond={(v) => setDosing({ ...dosing, headingAccent: v })}
          />
          <div>
            <label className={fieldLabel}>Body</label>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={dosing.body}
              onChange={(e) => setDosing({ ...dosing, body: e.target.value })}
            />
          </div>
          <PictureField
            label="Photo"
            src={dosing.image}
            onSrc={(v) => setDosing({ ...dosing, image: v })}
            alt={dosing.imageAlt}
            onAlt={(v) => setDosing({ ...dosing, imageAlt: v })}
          />
          <div>
            <label className={fieldLabel}>&ldquo;Start here&rdquo; flag text</label>
            <input
              className={`${fieldInput} mt-1`}
              value={dosing.startBadge}
              onChange={(e) =>
                setDosing({ ...dosing, startBadge: e.target.value })
              }
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Doses</label>
              <button
                type="button"
                className={addBtn}
                onClick={() =>
                  setDosing({
                    ...dosing,
                    doses: [
                      ...dosing.doses,
                      { mg: "", label: "", days: "", price: "", start: false },
                    ],
                  })
                }
              >
                + Add dose
              </button>
            </div>
            <div className="space-y-3">
              {dosing.doses.map((d, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      Dose {i + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move left"
                        onClick={() =>
                          setDosing({ ...dosing, doses: moved(dosing.doses, i, -1) })
                        }
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        title="Move right"
                        onClick={() =>
                          setDosing({ ...dosing, doses: moved(dosing.doses, i, 1) })
                        }
                      >
                        →
                      </button>
                      <button
                        type="button"
                        className={delBtn}
                        title="Remove dose"
                        onClick={() =>
                          setDosing({
                            ...dosing,
                            doses: dosing.doses.filter((_, j) => j !== i),
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["mg", "Dose"],
                        ["label", "Name"],
                        ["days", "When"],
                        ["price", "Price"],
                      ] as const
                    ).map(([k, lbl]) => (
                      <div key={k}>
                        <label className={fieldLabel}>{lbl}</label>
                        <input
                          className={`${fieldInput} mt-1`}
                          value={d[k]}
                          onChange={(e) =>
                            setDosing({
                              ...dosing,
                              doses: dosing.doses.map((x, j) =>
                                j === i ? { ...x, [k]: e.target.value } : x,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[13px] text-[#1a1a1a]">
                    <input
                      type="checkbox"
                      checked={d.start}
                      onChange={(e) =>
                        setDosing({
                          ...dosing,
                          // Only one card carries the flag, so ticking one
                          // clears the others rather than letting two show.
                          doses: dosing.doses.map((x, j) => ({
                            ...x,
                            start: e.target.checked ? j === i : x.start && j !== i,
                          })),
                        })
                      }
                    />
                    Show the &ldquo;start here&rdquo; flag on this dose
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9. Why choose */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            9. Why choose Jood
          </h2>
          <Pair
            label="Heading"
            first={whyChoose.heading}
            second={whyChoose.headingAccent}
            onFirst={(v) => setWhyChoose({ ...whyChoose, heading: v })}
            onSecond={(v) => setWhyChoose({ ...whyChoose, headingAccent: v })}
          />
          <StringList
            items={whyChoose.benefits}
            onChange={(benefits) => setWhyChoose({ ...whyChoose, benefits })}
            label="Benefits"
            addLabel="+ Add benefit"
            placeholder="UK clinician review"
          />
          <Regulated>
            The safety notice below is required wording. Do not remove it.
          </Regulated>
          <div>
            <label className={fieldLabel}>Safety notice title</label>
            <input
              className={`${fieldInput} mt-1`}
              value={whyChoose.safetyTitle}
              onChange={(e) =>
                setWhyChoose({ ...whyChoose, safetyTitle: e.target.value })
              }
            />
          </div>
          <div>
            <label className={fieldLabel}>Safety notice body</label>
            <textarea
              rows={4}
              className={`${fieldInput} mt-1`}
              value={whyChoose.safetyBody}
              onChange={(e) =>
                setWhyChoose({ ...whyChoose, safetyBody: e.target.value })
              }
            />
          </div>
          <PictureField
            label="Background photo"
            src={whyChoose.image}
            onSrc={(v) => setWhyChoose({ ...whyChoose, image: v })}
            alt={whyChoose.imageAlt}
            onAlt={(v) => setWhyChoose({ ...whyChoose, imageAlt: v })}
          />
        </div>

        {/* 10. FAQ */}
        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              10. Questions ({faq.items.length})
            </h2>
            <button
              type="button"
              className={addBtn}
              onClick={() =>
                setFaq({ ...faq, items: [...faq.items, { q: "", a: "" }] })
              }
            >
              + Add question
            </button>
          </div>
          <Pair
            label="Heading"
            first={faq.heading}
            second={faq.headingAccent}
            onFirst={(v) => setFaq({ ...faq, heading: v })}
            onSecond={(v) => setFaq({ ...faq, headingAccent: v })}
          />
          <Regulated>
            Answers here describe how a prescription medicine is taken and what
            its side effects are.
          </Regulated>
          <div className="space-y-3">
            {faq.items.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                    Question {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={iconBtn}
                      title="Move up"
                      onClick={() =>
                        setFaq({ ...faq, items: moved(faq.items, i, -1) })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={iconBtn}
                      title="Move down"
                      onClick={() =>
                        setFaq({ ...faq, items: moved(faq.items, i, 1) })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={delBtn}
                      title="Remove question"
                      onClick={() =>
                        setFaq({
                          ...faq,
                          items: faq.items.filter((_, j) => j !== i),
                        })
                      }
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <input
                  aria-label={`Question ${i + 1}`}
                  className={fieldInput}
                  value={f.q}
                  onChange={(e) =>
                    setFaq({
                      ...faq,
                      items: faq.items.map((x, j) =>
                        j === i ? { ...x, q: e.target.value } : x,
                      ),
                    })
                  }
                />
                <textarea
                  aria-label={`Answer ${i + 1}`}
                  rows={3}
                  className={`${fieldInput} mt-2`}
                  value={f.a}
                  onChange={(e) =>
                    setFaq({
                      ...faq,
                      items: faq.items.map((x, j) =>
                        j === i ? { ...x, a: e.target.value } : x,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* 11. Final CTA */}
        <div className={card}>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            11. Closing card
          </h2>
          <Pair
            label="Heading"
            first={finalCta.heading}
            second={finalCta.headingAccent}
            onFirst={(v) => setFinalCta({ ...finalCta, heading: v })}
            onSecond={(v) => setFinalCta({ ...finalCta, headingAccent: v })}
          />
          <div>
            <label className={fieldLabel}>Body</label>
            <textarea
              rows={2}
              className={`${fieldInput} mt-1`}
              value={finalCta.body}
              onChange={(e) =>
                setFinalCta({ ...finalCta, body: e.target.value })
              }
            />
          </div>
          <CtaFields
            label={finalCta.ctaLabel}
            href={finalCta.ctaHref}
            onLabel={(v) => setFinalCta({ ...finalCta, ctaLabel: v })}
            onHref={(v) => setFinalCta({ ...finalCta, ctaHref: v })}
          />
          <PictureField
            label="Photo"
            src={finalCta.image}
            onSrc={(v) => setFinalCta({ ...finalCta, image: v })}
            alt={finalCta.imageAlt}
            onAlt={(v) => setFinalCta({ ...finalCta, imageAlt: v })}
          />
          <Regulated>
            The small print below carries the asterisks used by the claims
            higher up the page. Removing it leaves those figures unqualified.
          </Regulated>
          <div>
            <label className={fieldLabel}>Small print</label>
            <textarea
              rows={4}
              className={`${fieldInput} mt-1`}
              value={finalCta.disclaimer}
              onChange={(e) =>
                setFinalCta({ ...finalCta, disclaimer: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Wegovy Pills page"}
        </button>
        <a
          href="/wegovy-pills"
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
  );
}
