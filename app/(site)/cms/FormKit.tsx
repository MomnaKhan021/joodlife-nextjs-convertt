"use client";

import { fieldInput, fieldLabel } from "./LinkFields";
import MediaPicker from "./MediaPicker";

/**
 * Small field components shared by the page editors.
 *
 * These were being redefined inside each form's render, which made React
 * treat them as a new component type on every keystroke. Lifting them here
 * keeps them stable and stops the same markup being written five times.
 */

export const cmsCard =
  "space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5";
export const cmsIconBtn =
  "rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]";
export const cmsDelBtn =
  "rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]";
export const cmsAddBtn =
  "rounded-lg border border-[#d8ddd0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]";

/** Swap two neighbours; returns the list unchanged at either end. */
export function moved<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** A heading and its serif-italic second half, side by side. */
export function Pair({
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
export function CtaFields({
  label,
  href,
  onLabel,
  onHref,
  title = "Button",
}: {
  label: string;
  href: string;
  onLabel: (v: string) => void;
  onHref: (v: string) => void;
  title?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={fieldLabel}>{title} text</label>
        <input
          className={`${fieldInput} mt-1`}
          value={label}
          onChange={(e) => onLabel(e.target.value)}
        />
        <p className="mt-1 text-[12px] text-[#8a8a8a]">
          Leave empty to hide it.
        </p>
      </div>
      <div>
        <label className={fieldLabel}>{title} link</label>
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
export function PictureField({
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

/** A single-line text field with a label. */
export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      <input
        className={`${fieldInput} mt-1`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{hint}</p> : null}
    </div>
  );
}

/** A multi-line text field with a label. */
export function AreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      <textarea
        rows={rows}
        className={`${fieldInput} mt-1`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{hint}</p> : null}
    </div>
  );
}

/** A list of plain strings with add / reorder / remove. */
export function StringList({
  items,
  onChange,
  label,
  addLabel,
  placeholder,
  hint,
  area = false,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  label: string;
  addLabel: string;
  placeholder?: string;
  hint?: string;
  /** Use textareas — for paragraphs rather than short lines. */
  area?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className={fieldLabel}>{label}</label>
        <button
          type="button"
          className={cmsAddBtn}
          onClick={() => onChange([...items, ""])}
        >
          {addLabel}
        </button>
      </div>
      {hint ? <p className="mb-2 text-[12px] text-[#8a8a8a]">{hint}</p> : null}
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            {area ? (
              <textarea
                aria-label={`${label} ${i + 1}`}
                rows={3}
                className={fieldInput}
                value={v}
                placeholder={placeholder}
                onChange={(e) =>
                  onChange(items.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
            ) : (
              <input
                aria-label={`${label} ${i + 1}`}
                className={fieldInput}
                value={v}
                placeholder={placeholder}
                onChange={(e) =>
                  onChange(items.map((x, j) => (j === i ? e.target.value : x)))
                }
              />
            )}
            <button
              type="button"
              className={cmsIconBtn}
              title="Move up"
              onClick={() => onChange(moved(items, i, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              className={cmsIconBtn}
              title="Move down"
              onClick={() => onChange(moved(items, i, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              className={cmsDelBtn}
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

/** Header row for one item inside a repeater: label plus the three buttons. */
export function RowTools({
  title,
  index,
  count,
  onMove,
  onRemove,
  horizontal = false,
}: {
  title: string;
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  /** Use ← → instead of ↑ ↓ for things laid out in a row. */
  horizontal?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
        {title} {index + 1} of {count}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cmsIconBtn}
          title={horizontal ? "Move left" : "Move up"}
          onClick={() => onMove(-1)}
        >
          {horizontal ? "←" : "↑"}
        </button>
        <button
          type="button"
          className={cmsIconBtn}
          title={horizontal ? "Move right" : "Move down"}
          onClick={() => onMove(1)}
        >
          {horizontal ? "→" : "↓"}
        </button>
        <button
          type="button"
          className={cmsDelBtn}
          title="Remove"
          onClick={onRemove}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** Amber note marking a block whose wording is clinically regulated. */
export function Regulated({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
      {children}
    </p>
  );
}
