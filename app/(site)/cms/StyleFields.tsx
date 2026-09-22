"use client";

import {
  BRAND_COLOURS,
  EMPTY_STYLE,
  isColour,
  REVERSIBLE,
  type SectionStyle,
} from "@/lib/sectionStyle";

import { fieldInput, fieldLabel } from "./LinkFields";

/**
 * Background / text colour and column order for one section.
 *
 * The palette is fixed rather than a free colour wheel. This is a designed
 * pharmacy site, and the realistic edit is "make this section the dark green
 * one", not "invent a colour" — offering swatches makes the likely choice a
 * single click and the unlikely one still possible via the hex box.
 *
 * "Default" is a first-class option, not the absence of one. Clearing a
 * colour has to be as easy as setting it, or a section can be styled into a
 * corner with no way back to the design.
 */

function Swatch({
  colour,
  selected,
  onPick,
  title,
}: {
  colour: string;
  selected: boolean;
  onPick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={selected}
      onClick={onPick}
      className={`h-7 w-7 rounded-full border transition-transform ${
        selected
          ? "border-[#1a1a1a] ring-2 ring-[#1a1a1a] ring-offset-1"
          : "border-[#d8ddd0] hover:scale-110"
      }`}
      style={{ backgroundColor: colour }}
    />
  );
}

function ColourRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  const isDefault = !isColour(value);

  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          aria-pressed={isDefault}
          className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
            isDefault
              ? "bg-[#1a1a1a] text-white"
              : "border border-[#d8ddd0] bg-white text-[#1a1a1a] hover:bg-[#f4f6f0]"
          }`}
        >
          Default
        </button>
        {BRAND_COLOURS.map((c) => (
          <Swatch
            key={c.value}
            colour={c.value}
            title={c.label}
            selected={value.toLowerCase() === c.value.toLowerCase()}
            onPick={() => onChange(c.value)}
          />
        ))}
        <input
          aria-label={`${label} — custom colour`}
          className={`${fieldInput} w-[120px]`}
          value={value}
          placeholder="#rrggbb"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="mt-1 text-[12px] text-[#8a8a8a]">
        {hint}
        {value && !isColour(value)
          ? " — that isn’t a valid colour yet, so the default still applies."
          : ""}
      </p>
    </div>
  );
}

export default function StyleFields({
  sectionKey,
  value,
  onChange,
}: {
  /** Used only to decide whether swapping columns means anything here. */
  sectionKey: string;
  value: SectionStyle;
  onChange: (next: SectionStyle) => void;
}) {
  const v = value ?? EMPTY_STYLE;
  const canReverse = REVERSIBLE.has(sectionKey);
  const untouched = !v.background && !v.text && !v.reverse;

  return (
    <div className="space-y-4 rounded-lg border border-[#eef1e8] bg-[#fafbf7] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#1a1a1a]">Styling</p>
        {!untouched && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_STYLE })}
            className="text-[12px] text-[#616161] underline-offset-2 hover:underline"
          >
            Reset to the design
          </button>
        )}
      </div>

      <ColourRow
        label="Background"
        value={v.background}
        onChange={(background) => onChange({ ...v, background })}
        hint="Default keeps whatever the design uses for this section."
      />

      <ColourRow
        label="Text colour"
        value={v.text}
        onChange={(text) => onChange({ ...v, text })}
        hint="Set this when a dark background needs light text, or the reverse."
      />

      {canReverse && (
        <label className="flex items-start gap-2 text-[13px] text-[#1a1a1a]">
          <input
            type="checkbox"
            checked={v.reverse}
            onChange={(e) => onChange({ ...v, reverse: e.target.checked })}
            className="mt-[3px]"
          />
          <span>
            Swap the two columns
            <span className="block text-[12px] text-[#8a8a8a]">
              Puts the right-hand side first on desktop. Mobile stacks the same
              either way.
            </span>
          </span>
        </label>
      )}

      {v.background && isColour(v.background) && !v.text && (
        <p className="rounded-lg border border-[#f0e2c0] bg-[#fffaf0] px-3 py-2 text-[12px] leading-relaxed text-[#8a6100]">
          You’ve set a background but left the text on its default. Check the
          section still reads clearly — a dark background usually needs light
          text.
        </p>
      )}
    </div>
  );
}
