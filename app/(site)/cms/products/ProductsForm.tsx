"use client";

import Link from "next/link";
import { useState } from "react";

import type { GraphPoint } from "@/lib/pdp-products";
import {
  howItWorksFallback,
  type ComparisonContent,
  type IconLabel,
  type ProductCopy,
  type ProductFaq,
  type ShopPageContent,
} from "@/lib/productPageContentTypes";
import type { ProductStyleKey } from "@/lib/sectionStyle";
import type { TextStyle } from "@/lib/textStyle";

import {
  AreaField,
  cmsAddBtn,
  cmsCard,
  CtaFields,
  PictureField,
  Regulated,
  RowTools,
  StringList,
  TextField,
  moved,
} from "../FormKit";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import SaveBar from "../SaveBar";
import SectionControl from "../SectionControl";
import { TextStyleCtx, Ts, type TextStyleApi } from "../TextStyleContext";
import { RepeatedText } from "../TreatmentBlocks";
import { useDirty } from "../useDirty";

/**
 * Editor for the product pages (/shop/<slug>) and the /shop heading.
 *
 * One tab per product. What is sold - name, description, photos, doses and
 * prices - is edited on the product in the dashboard; this screen edits the
 * words around it, and how they look. Each product has its own sizes and
 * colours; the comparison table and the shop heading have theirs. Everything
 * is saved together, so switching tabs never loses an edit.
 */

export type ProductTab = { slug: string; title: string };

const COLUMN_KEYS = ["wegovyTablet", "mounjaro", "wegovy"] as const;

/** A text-style context over one map, for one card. */
function tsApi(
  map: Record<string, TextStyle>,
  onChange: (next: Record<string, TextStyle>) => void,
): TextStyleApi {
  return {
    get: (k) => map[k],
    set: (k) => (next) => onChange({ ...map, [k]: next }),
  };
}

/** One "Aa" with its label, for a text that has no field of its own here. */
function StyleOnly({ k, label }: { k: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      <Ts k={k} label={label} />
    </span>
  );
}

/** A list of emoji + label pairs, as the chips and benefit lists use. */
function IconLabelList({
  label,
  items,
  onChange,
  hint,
}: {
  label: string;
  items: IconLabel[];
  onChange: (next: IconLabel[]) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className={fieldLabel}>{label}</span>
        <button type="button" className={cmsAddBtn} onClick={() => onChange([...items, { icon: "", label: "" }])}>
          + Add
        </button>
      </div>
      {hint ? <p className="mb-2 text-[12px] text-[#8a8a8a]">{hint}</p> : null}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* fieldInput carries w-full, so the emoji box is sized by its
                wrapper rather than by a competing width class. */}
            <div className="w-16 shrink-0">
              <input
                aria-label={`${label} ${i + 1} icon`}
                className={`${fieldInput} text-center`}
                value={it.icon}
                placeholder="✔"
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)))}
              />
            </div>
            <input
              aria-label={`${label} ${i + 1}`}
              className={`${fieldInput} min-w-0 flex-1`}
              value={it.label}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <button type="button" className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up" onClick={() => onChange(moved(items, i, -1))}>↑</button>
            <button type="button" className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down" onClick={() => onChange(moved(items, i, 1))}>↓</button>
            <button type="button" className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardHead({ title, note, control }: { title: string; note?: string; control?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h2>
        {note ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{note}</p> : null}
      </div>
      {control}
    </div>
  );
}

const styleBar =
  "flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]";

function clean(c: ProductCopy): ProductCopy {
  return {
    ...c,
    trustLine: c.trustLine.filter((t) => t.trim()),
    serviceChips: c.serviceChips.filter((x) => x.label.trim()),
    features: c.features.filter((x) => x.label.trim()),
    whatIsBullets: c.whatIsBullets.filter((b) => b.trim()),
    graphPoints: c.graphPoints.filter((p) => p.x.trim() && Number.isFinite(p.weight)),
    faqs: c.faqs.filter((f) => f.q.trim() && f.a.trim()),
  };
}

export default function ProductsForm({
  tabs,
  initialCopies,
  initialComparison,
  initialShop,
  untouched,
}: {
  tabs: (ProductTab & { hasShippedCopy: boolean })[];
  initialCopies: Record<string, ProductCopy>;
  initialComparison: ComparisonContent;
  initialShop: ShopPageContent;
  untouched: Record<string, unknown>;
}) {
  const [active, setActive] = useState(tabs[0]?.slug ?? "");
  const [copies, setCopies] = useState(initialCopies);
  const [comparison, setComparison] = useState(initialComparison);
  const [shop, setShop] = useState(initialShop);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tab = tabs.find((t) => t.slug === active);
  const c = copies[active];
  const set = (patch: Partial<ProductCopy>) =>
    setCopies((all) => ({ ...all, [active]: { ...all[active], ...patch } }));
  const sectionControl = (k: ProductStyleKey) =>
    c ? (
      <SectionControl
        sectionKey={k}
        value={c.styles[k]}
        onChange={(next) => set({ styles: { ...c.styles, [k]: next } })}
      />
    ) : null;

  const payload = {
    products: {
      ...untouched,
      ...Object.fromEntries(Object.entries(copies).map(([slug, copy]) => [slug, clean(copy)])),
    },
    comparison: { ...comparison, rows: comparison.rows.filter((r) => r.label.trim()) },
    shop,
  };
  const { dirty, markSaved } = useDirty(JSON.stringify(payload));

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("product-pages", payload);
      setSaved(true);
      markSaved();
      window.setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const setFaq = (i: number, patch: Partial<ProductFaq>) =>
    set({ faqs: c.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)) });
  const setPoint = (i: number, patch: Partial<GraphPoint>) =>
    set({ graphPoints: c.graphPoints.map((p, j) => (j === i ? { ...p, ...patch } : p)) });

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6">
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Product pages</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          The words on each product page and how they look. The name, description,
          photos, doses and prices are set on the product itself in the{" "}
          <Link href="/admin-tools" className="underline underline-offset-2">
            dashboard
          </Link>
          . The reviews, &ldquo;How it works&rdquo;, FAQs and closing banner at the foot
          of every product page are the Home page&apos;s sections.
        </p>
      </header>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setActive(t.slug)}
              className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                t.slug === active
                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                  : "border-[#d8ddd0] bg-white text-[#1a1a1a] hover:bg-[#f4f6f0]"
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        {tab && c ? (
          <TextStyleCtx.Provider value={tsApi(c.textStyles, (textStyles) => set({ textStyles: textStyles as ProductCopy["textStyles"] }))}>
            <div className="space-y-5">
              <Regulated>
                This is medical information about a prescription medicine. Change it
                only with the pharmacist&apos;s approval.
                {tab.hasShippedCopy
                  ? null
                  : ` ${tab.title} has no page copy yet, so its "What is", safety and question sections are hidden until they have a title.`}
              </Regulated>

              {/* 1. Beside the price */}
              <div className={cmsCard}>
                <CardHead
                  title="1. Beside the price"
                  note="The top of the page: name, description, price and the lists under it."
                  control={sectionControl("overview")}
                />
                <RepeatedText
                  items={[
                    ["trustLine", "Trust line"],
                    ["serviceChip", "Service chips"],
                    ["feature", "Benefits"],
                    ["accordionTitle", "Drop-down titles"],
                    ["accordionBody", "Drop-down text"],
                  ]}
                />
                <div className={styleBar}>
                  <span className="text-[12px] text-[#8a8a8a]">Set in the dashboard, sized here:</span>
                  <StyleOnly k="heading" label="Product name" />
                  <StyleOnly k="lede" label="Description" />
                </div>
                <TextField
                  tsKey="ratingLabel"
                  label="Rating pill"
                  value={c.ratingPillLabel}
                  onChange={(v) => set({ ratingPillLabel: v })}
                  hint="The word beside the stars above the heading."
                />
                <TextField
                  tsKey="headingAccent"
                  label="Heading — italic word after the name"
                  value={c.italicWord}
                  onChange={(v) => set({ italicWord: v })}
                  hint={`The heading reads "${tab.title} ${c.italicWord}".`}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField
                    tsKey="strengthHeading"
                    label="Above the doses"
                    value={c.strengthHeading}
                    onChange={(v) => set({ strengthHeading: v })}
                  />
                  <TextField
                    tsKey="priceNote"
                    label="Under the price"
                    value={c.priceNote}
                    onChange={(v) => set({ priceNote: v })}
                    hint="Leave empty to hide it."
                  />
                  <TextField
                    tsKey="eligibilityCta"
                    label="Button text"
                    value={c.eligibilityCta}
                    onChange={(v) => set({ eligibilityCta: v })}
                  />
                </div>
                <StringList
                  items={c.trustLine}
                  onChange={(trustLine) => set({ trustLine })}
                  label="Trust line under the price"
                  addLabel="+ Add"
                />
                <IconLabelList
                  label="Service chips"
                  items={c.serviceChips}
                  onChange={(serviceChips) => set({ serviceChips })}
                  hint="The small box on the left takes an emoji."
                />
                <TextField
                  tsKey="whyChooseTitle"
                  label="Benefits heading"
                  value={c.whyChooseTitle}
                  onChange={(v) => set({ whyChooseTitle: v })}
                  hint="Leave empty to show the list without a heading."
                />
                <IconLabelList label="Benefits" items={c.features} onChange={(features) => set({ features })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="First drop-down — title"
                    value={c.howItWorksTitle}
                    onChange={(v) => set({ howItWorksTitle: v })}
                  />
                  <AreaField
                    label="First drop-down — text"
                    rows={3}
                    value={c.howItWorksBody}
                    onChange={(v) => set({ howItWorksBody: v })}
                    hint={`Empty shows: "${howItWorksFallback(tab.title)}"`}
                  />
                </div>
                <div className={styleBar}>
                  <span className="text-[12px] text-[#8a8a8a]">
                    The second drop-down and the side-effects block use the safety text in
                    section 3. Sized here:
                  </span>
                  <StyleOnly k="sideEffectsTitle" label="Side-effects title" />
                  <StyleOnly k="sideEffectsBody" label="Side-effects text" />
                </div>
              </div>

              {/* 2. What is */}
              <div className={cmsCard}>
                <CardHead title="2. What is …?" control={sectionControl("whatIs")} />
                <RepeatedText items={[["whatIsBullet", "Points"]]} />
                <TextField
                  tsKey="whatIsTitle"
                  label="Title"
                  value={c.whatIsTitle}
                  onChange={(v) => set({ whatIsTitle: v })}
                  hint="The last word is shown in italics. Leave empty to hide this section."
                />
                <div className={styleBar}>
                  <StyleOnly k="whatIsTitleAccent" label="Italic last word of the title" />
                </div>
                <AreaField
                  tsKey="whatIsBody"
                  label="Text"
                  rows={4}
                  value={c.whatIsBody}
                  onChange={(v) => set({ whatIsBody: v })}
                  hint="Wrap words in <strong>…</strong> to make them bold."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    tsKey="whatIsCalloutTitle"
                    label="Highlighted box — title"
                    value={c.whatIsCalloutTitle}
                    onChange={(v) => set({ whatIsCalloutTitle: v })}
                  />
                  <AreaField
                    tsKey="whatIsCallout"
                    label="Highlighted box — text"
                    rows={2}
                    value={c.whatIsCallout}
                    onChange={(v) => set({ whatIsCallout: v })}
                  />
                </div>
                <StringList
                  items={c.whatIsBullets}
                  onChange={(whatIsBullets) => set({ whatIsBullets })}
                  label="Points"
                  addLabel="+ Add point"
                />
                <CtaFields
                  labelKey="whatIsCta"
                  label={c.whatIsCtaLabel}
                  href={c.whatIsCtaHref}
                  onLabel={(v) => set({ whatIsCtaLabel: v })}
                  onHref={(v) => set({ whatIsCtaHref: v })}
                />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={fieldLabel}>Graph</span>
                    <button
                      type="button"
                      className={cmsAddBtn}
                      onClick={() => set({ graphPoints: [...c.graphPoints, { x: "", weight: 100 }] })}
                    >
                      + Add point
                    </button>
                  </div>
                  <TextField
                    label="Figure on the graph"
                    value={c.graphCallout}
                    onChange={(v) => set({ graphCallout: v })}
                    placeholder="-27%"
                  />
                  <p className="mb-2 mt-3 text-[12px] text-[#8a8a8a]">
                    Each point is a label along the bottom and a weight between 70 and 100.
                    A graph needs at least two points to show.
                  </p>
                  <div className="space-y-2">
                    {c.graphPoints.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          aria-label={`Point ${i + 1} label`}
                          className={`${fieldInput} min-w-0 flex-1`}
                          value={p.x}
                          onChange={(e) => setPoint(i, { x: e.target.value })}
                        />
                        <div className="w-28 shrink-0">
                          <input
                            aria-label={`Point ${i + 1} weight`}
                            type="number"
                            className={fieldInput}
                            value={Number.isFinite(p.weight) ? p.weight : ""}
                            onChange={(e) => setPoint(i, { weight: Number(e.target.value) })}
                          />
                        </div>
                        <button
                          type="button"
                          className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                          title="Remove"
                          onClick={() => set({ graphPoints: c.graphPoints.filter((_, j) => j !== i) })}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Safety */}
              <div className={cmsCard}>
                <CardHead title="3. Safety and questions" control={sectionControl("safety")} />
                <RepeatedText
                  items={[
                    ["faqQuestion", "Questions"],
                    ["faqAnswer", "Answers"],
                  ]}
                />
                <TextField
                  tsKey="safetyTitle"
                  label="Title"
                  value={c.safetyTitle}
                  onChange={(v) => set({ safetyTitle: v })}
                  hint={'Ending in "safe?" puts that word in italics. Leave empty to hide this section.'}
                />
                <div className={styleBar}>
                  <StyleOnly k="safetyTitleAccent" label="Italic “safe?”" />
                </div>
                <AreaField tsKey="safetyBody" label="Text" rows={4} value={c.safetyBody} onChange={(v) => set({ safetyBody: v })} />
                <TextField
                  tsKey="sideEffectsHeading"
                  label="Side effects — heading"
                  value={c.sideEffectsHeading}
                  onChange={(v) => set({ sideEffectsHeading: v })}
                />
                <AreaField
                  tsKey="safetySideEffects"
                  label="Side effects — text"
                  rows={4}
                  value={c.safetySideEffects}
                  onChange={(v) => set({ safetySideEffects: v })}
                />
                <div className="flex items-center justify-between">
                  <span className={fieldLabel}>Questions</span>
                  <button
                    type="button"
                    className={cmsAddBtn}
                    onClick={() => set({ faqs: [...c.faqs, { q: "", a: "" }] })}
                  >
                    + Add question
                  </button>
                </div>
                {c.faqs.map((f, i) => (
                  <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                    <RowTools
                      title="Question"
                      index={i}
                      count={c.faqs.length}
                      onMove={(dir) => set({ faqs: moved(c.faqs, i, dir) })}
                      onRemove={() => set({ faqs: c.faqs.filter((_, j) => j !== i) })}
                    />
                    <TextField label="Question" value={f.q} onChange={(v) => setFaq(i, { q: v })} />
                    <div className="mt-3">
                      <AreaField label="Answer" rows={3} value={f.a} onChange={(v) => setFaq(i, { a: v })} />
                    </div>
                  </div>
                ))}
                <CtaFields
                  labelKey="safetyCta"
                  label={c.safetyCtaLabel}
                  href={c.safetyCtaHref}
                  onLabel={(v) => set({ safetyCtaLabel: v })}
                  onHref={(v) => set({ safetyCtaHref: v })}
                />
                <PictureField
                  label="Photo"
                  src={c.safetyImage}
                  onSrc={(v) => set({ safetyImage: v })}
                  alt={c.safetyImageAlt}
                  onAlt={(v) => set({ safetyImageAlt: v })}
                />
              </div>
            </div>
          </TextStyleCtx.Provider>
        ) : (
          <p className="text-[13px] text-[#616161]">No products found.</p>
        )}

        {/* Comparison */}
        <TextStyleCtx.Provider
          value={tsApi(comparison.textStyles, (textStyles) =>
            setComparison({ ...comparison, textStyles: textStyles as ComparisonContent["textStyles"] }),
          )}
        >
          <div className={cmsCard}>
            <CardHead
              title="Comparison table"
              note="Shared by the Mounjaro, Wegovy injection and Wegovy Pill pages - one table, with the page's own product outlined. The colour here is the table's card."
              control={
                <SectionControl
                  sectionKey="comparison"
                  value={comparison.style}
                  onChange={(style) => setComparison({ ...comparison, style })}
                />
              }
            />
            <RepeatedText
              items={[
                ["columnLabel", "Column names"],
                ["rowLabel", "Row labels"],
                ["cell", "Table cells"],
              ]}
            />
            <TextField tsKey="heading" label="Heading" value={comparison.heading} onChange={(v) => setComparison({ ...comparison, heading: v })} />
            <TextField tsKey="body" label="Text under it" value={comparison.body} onChange={(v) => setComparison({ ...comparison, body: v })} />
            <div className="grid gap-4 sm:grid-cols-3">
              {COLUMN_KEYS.map((k) => (
                <TextField
                  key={k}
                  label={`Column — ${initialComparison.columns[k]}`}
                  value={comparison.columns[k]}
                  onChange={(v) => setComparison({ ...comparison, columns: { ...comparison.columns, [k]: v } })}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className={cmsAddBtn}
                onClick={() =>
                  setComparison({
                    ...comparison,
                    rows: [...comparison.rows, { label: "", mounjaro: "", wegovy: "", wegovyTablet: "" }],
                  })
                }
              >
                + Add row
              </button>
            </div>
            {comparison.rows.map((r, i) => (
              <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                <RowTools
                  title="Row"
                  index={i}
                  count={comparison.rows.length}
                  onMove={(dir) => setComparison({ ...comparison, rows: moved(comparison.rows, i, dir) })}
                  onRemove={() => setComparison({ ...comparison, rows: comparison.rows.filter((_, j) => j !== i) })}
                />
                <div className="grid gap-3 sm:grid-cols-4">
                  <TextField
                    label="Row label"
                    value={r.label}
                    onChange={(v) =>
                      setComparison({
                        ...comparison,
                        rows: comparison.rows.map((x, j) => (j === i ? { ...x, label: v } : x)),
                      })
                    }
                  />
                  {COLUMN_KEYS.map((k) => (
                    <TextField
                      key={k}
                      label={comparison.columns[k]}
                      value={r[k] ?? ""}
                      onChange={(v) =>
                        setComparison({
                          ...comparison,
                          rows: comparison.rows.map((x, j) => (j === i ? { ...x, [k]: v } : x)),
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
            <AreaField
              tsKey="note"
              label="Line under the table"
              rows={2}
              value={comparison.note}
              onChange={(v) => setComparison({ ...comparison, note: v })}
              hint="Leave empty to hide it."
            />
          </div>
        </TextStyleCtx.Provider>

        {/* Shop listing */}
        <TextStyleCtx.Provider
          value={tsApi(shop.textStyles, (textStyles) =>
            setShop({ ...shop, textStyles: textStyles as ShopPageContent["textStyles"] }),
          )}
        >
          <div className={cmsCard}>
            <CardHead
              title="Shop page"
              note="The heading and the note under the products on /shop. The product cards come from the dashboard."
              control={
                <SectionControl
                  sectionKey="shop"
                  value={shop.style}
                  onChange={(style) => setShop({ ...shop, style })}
                />
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField tsKey="heading" label="Heading" value={shop.heading} onChange={(v) => setShop({ ...shop, heading: v })} />
              <TextField
                tsKey="headingAccent"
                label="Second line (italic)"
                value={shop.headingAccent}
                onChange={(v) => setShop({ ...shop, headingAccent: v })}
              />
            </div>
            <TextField
              label="Button on each product card"
              value={shop.cardCta}
              placeholder="Get Started"
              onChange={(v) => setShop({ ...shop, cardCta: v })}
            />
            <AreaField tsKey="footnote" label="Note under the products" rows={2} value={shop.footnote} onChange={(v) => setShop({ ...shop, footnote: v })} />
          </div>
        </TextStyleCtx.Provider>
      </div>

      <SaveBar
        onSave={() => void save()}
        saving={saving}
        dirty={dirty}
        saved={saved}
        error={error}
        label="Save product pages"
        viewHref={active ? `/shop/${active}` : "/shop"}
      />
    </div>
  );
}
