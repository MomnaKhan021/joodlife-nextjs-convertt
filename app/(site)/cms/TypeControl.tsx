"use client";

import { useEffect, useRef, useState } from "react";

import {
  EMPTY_TEXT_STYLE,
  MAX_PX,
  MIN_PX,
  TEXT_WEIGHTS,
  cleanPx,
  hasTextStyle,
  type TextStyle,
} from "@/lib/textStyle";

/**
 * The "Aa" button that sits on a field's label line and opens size and weight.
 *
 * It lives on the field rather than in a separate styling screen: whoever
 * writes the sentence is the one who knows it should be bigger, and sending
 * them to another page is how copy and its treatment drift apart.
 *
 * The dot on the button marks a text that has been given a treatment, so a
 * long form can be scanned for what has been changed.
 */
export default function TypeControl({
  label,
  value,
  onChange,
}: {
  /** Used for the accessible name only. */
  label: string;
  value?: TextStyle;
  onChange: (next: TextStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = value ?? EMPTY_TEXT_STYLE;
  const touched = hasTextStyle(current);

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

  const setPx = (k: "px" | "pxMobile") => (raw: string) => {
    const next = { ...current };
    if (raw.trim() === "") delete next[k];
    else {
      const n = cleanPx(raw);
      if (n === undefined) return; // ignore junk rather than store it
      next[k] = n;
    }
    onChange(next);
  };

  return (
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
        {touched ? <span className="h-1.5 w-1.5 rounded-full bg-[#1a8c5a]" /> : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-[248px] rounded-lg border border-[#e4e7de] bg-white p-3 shadow-[0_10px_30px_-12px_rgba(20,46,42,0.35)]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
            Size
          </p>
          <div className="flex items-center gap-2">
            <Px
              label="Desktop"
              value={current.px}
              onChange={setPx("px")}
            />
            <Px
              label="Mobile"
              value={current.pxMobile}
              onChange={setPx("pxMobile")}
            />
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[#8a8a8a]">
            In pixels, {MIN_PX}-{MAX_PX}. Leave blank to keep the designed size.
            Mobile is optional — blank means the same size everywhere.
          </p>

          <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
            Weight
          </p>
          <div className="flex flex-wrap gap-1">
            {TEXT_WEIGHTS.map((w) => (
              <button
                key={w.value || "default"}
                type="button"
                aria-pressed={current.weight === w.value}
                onClick={() => onChange({ ...current, weight: w.value })}
                className={`rounded-md border px-2 py-1 text-[12px] transition-colors ${
                  current.weight === w.value
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                    : "border-[#e4e7de] text-[#1a1a1a] hover:bg-[#f4f6f0]"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {touched ? (
            <button
              type="button"
              onClick={() => onChange(EMPTY_TEXT_STYLE)}
              className="mt-3 text-[12px] text-[#616161] underline underline-offset-2 hover:text-[#1a1a1a]"
            >
              Reset to the design
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Px({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="flex-1">
      <span className="block text-[11px] text-[#616161]">{label}</span>
      <span className="mt-0.5 flex items-center gap-1 rounded-md border border-[#e4e7de] px-2 py-1">
        <input
          type="number"
          min={MIN_PX}
          max={MAX_PX}
          value={value ?? ""}
          placeholder="—"
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-[13px] outline-none"
        />
        <span className="text-[11px] text-[#8a8a8a]">px</span>
      </span>
    </label>
  );
}
