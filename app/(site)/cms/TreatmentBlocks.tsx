"use client";

import type {
  CategoryFeatureGrid,
  Feature,
  UspItem,
} from "@/lib/categoryPageContentTypes";

import {
  AreaField,
  cmsAddBtn,
  CtaFields,
  RowTools,
  TextField,
  moved,
} from "./FormKit";
import { fieldLabel } from "./LinkFields";
import MediaPicker from "./MediaPicker";
import { Ts } from "./TextStyleContext";

/**
 * Editors for the two blocks the treatment pages have in common: the
 * scrolling trust strip and the dark feature panel. The weight loss and
 * period delay screens each edit their own copy of them.
 */

/**
 * One size/weight control per repeated text - every tick, chip or card
 * title in a list shares it, so the list stays even.
 */
export function RepeatedText({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
      <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
      {items.map(([k, lbl]) => (
        <span key={k} className="flex items-center gap-2">
          {lbl}
          <Ts k={k} label={lbl} />
        </span>
      ))}
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className={fieldLabel}>Icon</span>
      <div className="mt-1">
        <MediaPicker valueId={null} valueUrl={value || null} onChange={(_id, url) => onChange(url ?? "")} />
      </div>
    </div>
  );
}

export function UspEditor({
  items,
  onChange,
}: {
  items: UspItem[];
  onChange: (next: UspItem[]) => void;
}) {
  return (
    <div className="space-y-3">
      <RepeatedText items={[["uspStrip.itemLabel", "Item text"]]} />
      <div className="flex justify-end">
        <button type="button" className={cmsAddBtn} onClick={() => onChange([...items, { icon: "", label: "" }])}>
          + Add item
        </button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
          <RowTools
            title="Item"
            index={i}
            count={items.length}
            horizontal
            onMove={(dir) => onChange(moved(items, i, dir))}
            onRemove={() => onChange(items.filter((_, j) => j !== i))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Text"
              value={item.label}
              onChange={(v) => onChange(items.map((u, j) => (j === i ? { ...u, label: v } : u)))}
            />
            <IconPicker
              value={item.icon}
              onChange={(v) => onChange(items.map((u, j) => (j === i ? { ...u, icon: v } : u)))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeatureGridEditor({
  value,
  onChange,
}: {
  value: CategoryFeatureGrid;
  onChange: (next: CategoryFeatureGrid) => void;
}) {
  const setFeature = (i: number, patch: Partial<Feature>) =>
    onChange({
      ...value,
      features: value.features.map((f, j) => (j === i ? { ...f, ...patch } : f)),
    });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField tsKey="featureGrid.heading" label="Heading" value={value.heading} onChange={(v) => onChange({ ...value, heading: v })} />
        <TextField
          tsKey="featureGrid.headingAccent"
          label="Heading (italic part)"
          value={value.headingAccent}
          onChange={(v) => onChange({ ...value, headingAccent: v })}
        />
      </div>
      <AreaField tsKey="featureGrid.body" label="Text" rows={2} value={value.body} onChange={(v) => onChange({ ...value, body: v })} />
      <CtaFields
        labelKey="featureGrid.ctaLabel"
        title="First button"
        label={value.ctaLabel}
        href={value.ctaHref}
        onLabel={(v) => onChange({ ...value, ctaLabel: v })}
        onHref={(v) => onChange({ ...value, ctaHref: v })}
      />
      <CtaFields
        labelKey="featureGrid.secondaryLabel"
        title="Second button"
        label={value.secondaryLabel}
        href={value.secondaryHref}
        onLabel={(v) => onChange({ ...value, secondaryLabel: v })}
        onHref={(v) => onChange({ ...value, secondaryHref: v })}
      />
      <RepeatedText
        items={[
          ["featureGrid.featureTitle", "Feature titles"],
          ["featureGrid.featureCopy", "Feature lines"],
        ]}
      />
      <div className="flex items-center justify-between">
        <span className={fieldLabel}>Features</span>
        <button
          type="button"
          className={cmsAddBtn}
          onClick={() => onChange({ ...value, features: [...value.features, { icon: "", title: "", copy: "" }] })}
        >
          + Add feature
        </button>
      </div>
      {value.features.map((f, i) => (
        <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
          <RowTools
            title="Feature"
            index={i}
            count={value.features.length}
            onMove={(dir) => onChange({ ...value, features: moved(value.features, i, dir) })}
            onRemove={() => onChange({ ...value, features: value.features.filter((_, j) => j !== i) })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Title" value={f.title} onChange={(v) => setFeature(i, { title: v })} />
            <TextField label="Small line" value={f.copy} onChange={(v) => setFeature(i, { copy: v })} />
            <IconPicker value={f.icon} onChange={(v) => setFeature(i, { icon: v })} />
          </div>
        </div>
      ))}
    </div>
  );
}
