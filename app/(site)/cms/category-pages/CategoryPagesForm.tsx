"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  CategoryPageContent,
  Faq,
} from "@/lib/categoryPageContentTypes";

import {
  AreaField,
  cmsAddBtn,
  cmsCard,
  CtaFields,
  Pair,
  RowTools,
  moved,
} from "../FormKit";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";

/**
 * Editor for the furniture shared by the treatment sub-pages: the scrolling
 * trust strip, the dark "more than treatment" panel, and one FAQ list per
 * treatment.
 *
 * The themed hero at the top of each page is not here — it comes from the
 * treatment cards on the Home page tab, so it stays in one place.
 */

const FAQ_TABS = [
  { key: "weightLoss", label: "Weight loss", path: "/weight-loss" },
  {
    key: "erectileDysfunction",
    label: "Erectile dysfunction",
    path: "/erectile-dysfunction",
  },
  { key: "periodDelay", label: "Period delay", path: "/period-delay" },
] as const;

type FaqKey = (typeof FAQ_TABS)[number]["key"];

export default function CategoryPagesForm({
  initial,
}: {
  initial: CategoryPageContent;
}) {
  const [uspStrip, setUspStrip] = useState(initial.uspStrip);
  const [featureGrid, setFeatureGrid] = useState(initial.featureGrid);
  const [faqs, setFaqs] = useState(initial.faqs);
  const [tab, setTab] = useState<FaqKey>("weightLoss");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items: Faq[] = faqs[tab];

  function setItems(next: Faq[]) {
    setFaqs({ ...faqs, [tab]: next });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("category-pages", {
        uspStrip: { items: uspStrip.items.filter((i) => i.label.trim()) },
        featureGrid: {
          ...featureGrid,
          features: featureGrid.features.filter((f) => f.title.trim()),
        },
        faqs: {
          ...faqs,
          weightLoss: faqs.weightLoss.filter((f) => f.q.trim() && f.a.trim()),
          erectileDysfunction: faqs.erectileDysfunction.filter(
            (f) => f.q.trim() && f.a.trim(),
          ),
          periodDelay: faqs.periodDelay.filter((f) => f.q.trim() && f.a.trim()),
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
        <Link
          href="/cms"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Treatment pages
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Shared by{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/weight-loss</code>,{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">
            /erectile-dysfunction
          </code>{" "}
          and{" "}
          <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/period-delay</code>.
          The coloured hero at the top of each page is edited with its treatment
          card on the{" "}
          <Link href="/cms/home" className="underline underline-offset-2">
            Home page
          </Link>{" "}
          tab.
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
        {/* 1. Trust strip */}
        <div className={cmsCard}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              1. Scrolling trust strip
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The thin marquee under the hero. Each row has an icon and a line
              of text.
            </p>
          </div>
          <div className="space-y-2">
            {uspStrip.items.map((it, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
              >
                <RowTools
                  title="Item"
                  index={i}
                  count={uspStrip.items.length}
                  onMove={(d) =>
                    setUspStrip({ items: moved(uspStrip.items, i, d) })
                  }
                  onRemove={() =>
                    setUspStrip({
                      items: uspStrip.items.filter((_, j) => j !== i),
                    })
                  }
                />
                <input
                  aria-label={`Item ${i + 1} text`}
                  className={fieldInput}
                  value={it.label}
                  onChange={(e) =>
                    setUspStrip({
                      items: uspStrip.items.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                />
                <div className="mt-2 flex items-center gap-3">
                  {it.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.icon}
                      alt=""
                      className="h-8 w-8 shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  <input
                    aria-label={`Item ${i + 1} icon path`}
                    className={fieldInput}
                    value={it.icon}
                    placeholder="/assets/figma/usp-licensed.svg"
                    onChange={(e) =>
                      setUspStrip({
                        items: uspStrip.items.map((x, j) =>
                          j === i ? { ...x, icon: e.target.value } : x,
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
              setUspStrip({ items: [...uspStrip.items, { icon: "", label: "" }] })
            }
          >
            + Add item
          </button>
        </div>

        {/* 2. Feature panel */}
        <div className={cmsCard}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              2. Dark feature panel
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The green block with the six cards.
            </p>
          </div>
          <Pair
            label="Heading"
            first={featureGrid.heading}
            second={featureGrid.headingAccent}
            onFirst={(v) => setFeatureGrid({ ...featureGrid, heading: v })}
            onSecond={(v) => setFeatureGrid({ ...featureGrid, headingAccent: v })}
          />
          <AreaField
            label="Body"
            rows={2}
            value={featureGrid.body}
            onChange={(v) => setFeatureGrid({ ...featureGrid, body: v })}
          />
          <CtaFields
            title="First button"
            label={featureGrid.ctaLabel}
            href={featureGrid.ctaHref}
            onLabel={(v) => setFeatureGrid({ ...featureGrid, ctaLabel: v })}
            onHref={(v) => setFeatureGrid({ ...featureGrid, ctaHref: v })}
          />
          <CtaFields
            title="Second button"
            label={featureGrid.secondaryLabel}
            href={featureGrid.secondaryHref}
            onLabel={(v) => setFeatureGrid({ ...featureGrid, secondaryLabel: v })}
            onHref={(v) => setFeatureGrid({ ...featureGrid, secondaryHref: v })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={fieldLabel}>Cards</label>
              <button
                type="button"
                className={cmsAddBtn}
                onClick={() =>
                  setFeatureGrid({
                    ...featureGrid,
                    features: [
                      ...featureGrid.features,
                      { icon: "", title: "", copy: "" },
                    ],
                  })
                }
              >
                + Add card
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {featureGrid.features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
                >
                  <RowTools
                    title="Card"
                    index={i}
                    count={featureGrid.features.length}
                    onMove={(d) =>
                      setFeatureGrid({
                        ...featureGrid,
                        features: moved(featureGrid.features, i, d),
                      })
                    }
                    onRemove={() =>
                      setFeatureGrid({
                        ...featureGrid,
                        features: featureGrid.features.filter((_, j) => j !== i),
                      })
                    }
                  />
                  <input
                    aria-label={`Card ${i + 1} title`}
                    className={fieldInput}
                    value={f.title}
                    placeholder="Medication"
                    onChange={(e) =>
                      setFeatureGrid({
                        ...featureGrid,
                        features: featureGrid.features.map((x, j) =>
                          j === i ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Card ${i + 1} body`}
                    className={`${fieldInput} mt-2`}
                    value={f.copy}
                    placeholder="Clinically appropriate treatment"
                    onChange={(e) =>
                      setFeatureGrid({
                        ...featureGrid,
                        features: featureGrid.features.map((x, j) =>
                          j === i ? { ...x, copy: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    aria-label={`Card ${i + 1} icon path`}
                    className={`${fieldInput} mt-2`}
                    value={f.icon}
                    placeholder="/assets/figma/feature-support.svg"
                    onChange={(e) =>
                      setFeatureGrid({
                        ...featureGrid,
                        features: featureGrid.features.map((x, j) =>
                          j === i ? { ...x, icon: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. FAQs */}
        <div className={cmsCard}>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              3. Frequently asked questions
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The heading is shared; each treatment has its own questions.
            </p>
          </div>
          <Pair
            label="Heading"
            first={faqs.heading}
            second={faqs.headingAccent}
            onFirst={(v) => setFaqs({ ...faqs, heading: v })}
            onSecond={(v) => setFaqs({ ...faqs, headingAccent: v })}
          />

          <div className="flex flex-wrap gap-2 border-t border-[#eef1e8] pt-4">
            {FAQ_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === t.key
                    ? "bg-[#1a1a1a] text-white"
                    : "border border-[#d8ddd0] bg-white text-[#1a1a1a] hover:bg-[#f4f6f0]"
                }`}
              >
                {t.label}{" "}
                <span
                  className={
                    tab === t.key ? "text-white/60" : "text-[#8a8a8a]"
                  }
                >
                  {faqs[t.key].length}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[#8a8a8a]">
            Editing{" "}
            <code className="rounded bg-[#eef1e8] px-1">
              {FAQ_TABS.find((t) => t.key === tab)?.path}
            </code>
          </p>

          <div className="space-y-3">
            {items.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-3"
              >
                <RowTools
                  title="Question"
                  index={i}
                  count={items.length}
                  onMove={(d) => setItems(moved(items, i, d))}
                  onRemove={() => setItems(items.filter((_, j) => j !== i))}
                />
                <input
                  aria-label={`Question ${i + 1}`}
                  className={fieldInput}
                  value={f.q}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i ? { ...x, q: e.target.value } : x,
                      ),
                    )
                  }
                />
                <textarea
                  aria-label={`Answer ${i + 1}`}
                  rows={3}
                  className={`${fieldInput} mt-2`}
                  value={f.a}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i ? { ...x, a: e.target.value } : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className={cmsAddBtn}
            onClick={() => setItems([...items, { q: "", a: "" }])}
          >
            + Add question
          </button>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save treatment pages"}
        </button>
      </div>

      <p className="mt-3 text-[12px] text-[#8a8a8a]">
        Clearing a field restores the wording the pages ship with, rather than
        leaving it blank.
      </p>
    </div>
  );
}
