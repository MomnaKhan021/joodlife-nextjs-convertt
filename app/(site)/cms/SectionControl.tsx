"use client";

import { useEffect, useRef, useState } from "react";

import StyleFields from "./StyleFields";
import { isColour, isReversed, type SectionStyle } from "@/lib/sectionStyle";

/**
 * The appearance control for one section, sitting in that section's own card.
 *
 * It used to live in a single "Section colours" list at the top of the page,
 * which meant choosing a colour for the FAQ happened a long way from the FAQ's
 * own fields. Putting it in the corner of each section keeps everything about
 * that section in one place — the same reasoning as the per-text control.
 *
 * Collapsed behind a button so a card still opens as a list of content fields;
 * the dot marks a section that has been given a treatment.
 */
export default function SectionControl({
  sectionKey,
  value,
  onChange,
}: {
  sectionKey: string;
  value: SectionStyle;
  onChange: (next: SectionStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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

  const touched =
    isColour(value?.background) || isColour(value?.text) || isReversed(value);

  return (
    <div className="relative shrink-0" ref={box}>
      <button
        type="button"
        aria-label={`Appearance for this section`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors ${
          touched
            ? "border-[#1a1a1a] bg-[#f7f8f4] text-[#1a1a1a]"
            : "border-[#e4e7de] text-[#616161] hover:bg-[#fafbf7]"
        }`}
      >
        {/* Two overlapping discs read as "colour" without needing an icon set. */}
        <span className="relative inline-flex h-3.5 w-5 items-center">
          <span
            className="absolute left-0 h-3.5 w-3.5 rounded-full border border-[#c9d2c2]"
            style={{ background: isColour(value?.background) ? value.background : "#ffffff" }}
          />
          <span
            className="absolute left-1.5 h-3.5 w-3.5 rounded-full border border-[#c9d2c2]"
            style={{ background: isColour(value?.text) ? value.text : "#142e2a" }}
          />
        </span>
        Appearance
        {touched ? <span className="h-1.5 w-1.5 rounded-full bg-[#1a8c5a]" /> : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-[320px] rounded-lg border border-[#e4e7de] bg-white p-4 shadow-[0_10px_30px_-12px_rgba(20,46,42,0.35)]">
          <StyleFields sectionKey={sectionKey} value={value} onChange={onChange} />
        </div>
      ) : null}
    </div>
  );
}
