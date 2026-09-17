"use client";

import { useEffect, useRef, useState } from "react";

import { fieldInput, fieldLabel } from "./LinkFields";
import {
  EMPTY_TEXT_STYLE,
  TEXT_SIZES,
  TEXT_WEIGHTS,
  hasTextStyle,
  type TextStyle,
} from "@/lib/textStyle";

/**
 * A text field with its own size and weight controls.
 *
 * The controls sit on the field itself rather than in a separate "styling"
 * panel: whoever writes the sentence is the person who knows it should be
 * bigger, and asking them to go and find it in another screen is how the copy
 * and its treatment drift apart.
 *
 * Collapsed to a single "Aa" button so the form still reads as a list of
 * fields. The button shows a dot when this text has been given a treatment,
 * so a page can be scanned for what has been changed.
 */
export default function TextField({
  label,
  hint,
  value,
  onChange,
  style,
  onStyle,
  rows,
  placeholder,
  id,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  /** Omit to render an ordinary field with no type controls. */
  style?: TextStyle;
  onStyle?: (next: TextStyle) => void;
  /** Renders a textarea instead of an input. */
  rows?: number;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = style ?? EMPTY_TEXT_STYLE;
  const editable = Boolean(onStyle);

  // Close on an outside click or Escape — a popover that traps the page is
  // worse than no popover.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const touched = hasTextStyle(current);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className={fieldLabel} htmlFor={id}>
          {label}
        </label>

        {editable ? (
          <div className="relative" ref={box}>
            <button
              type="button"
              aria-label={`Text size and weight for ${label}`}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] transition-colors ${
                touched
                  ? "border-[#1a1a1a] bg-[#f7f8f4] text-[#1a1a1a]"
                  : "border-[#e4e7de] text-[#8a8a8a] hover:bg-[#fafbf7]"
              }`}
            >
              <span className="font-semibold">Aa</span>
              {touched ? (
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a8c5a]" />
              ) : null}
            </button>

            {open ? (
              <div className="absolute right-0 z-20 mt-1 w-[230px] rounded-lg border border-[#e4e7de] bg-white p-3 shadow-[0_10px_30px_-12px_rgba(20,46,42,0.35)]">
                <Row
                  title="Size"
                  options={TEXT_SIZES}
                  value={current.size}
                  onPick={(v) => onStyle?.({ ...current, size: v as TextStyle["size"] })}
                />
                <Row
                  title="Weight"
                  options={TEXT_WEIGHTS}
                  value={current.weight}
                  onPick={(v) =>
                    onStyle?.({ ...current, weight: v as TextStyle["weight"] })
                  }
                />
                <p className="mt-2 text-[11px] leading-snug text-[#8a8a8a]">
                  Sizes are relative, so the text stays in proportion on phones.
                </p>
                {touched ? (
                  <button
                    type="button"
                    onClick={() => onStyle?.(EMPTY_TEXT_STYLE)}
                    className="mt-2 text-[12px] text-[#616161] underline underline-offset-2 hover:text-[#1a1a1a]"
                  >
                    Reset to the design
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {rows ? (
        <textarea
          id={id}
          rows={rows}
          className={`${fieldInput} mt-1`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={`${fieldInput} mt-1`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {hint ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{hint}</p> : null}
    </div>
  );
}

/** One labelled row of choices inside the popover. */
function Row({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
        {title}
      </p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value || "default"}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onPick(o.value)}
            className={`rounded-md border px-2 py-1 text-[12px] transition-colors ${
              value === o.value
                ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                : "border-[#e4e7de] text-[#1a1a1a] hover:bg-[#f4f6f0]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
