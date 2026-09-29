"use client";

import { AreaField, cmsCard, TextField } from "./FormKit";

/**
 * A card of small fixed words - button texts, labels, placeholders.
 *
 * Each field shows its shipped wording as the placeholder, and a cleared
 * field brings that wording back on the site, so a button can never end up
 * blank by accident.
 */
export type LabelSpec = {
  key: string;
  label: string;
  /** A paragraph rather than a single line. */
  area?: boolean;
  hint?: string;
};

export default function LabelsCard<T extends Record<string, string>>({
  title,
  note,
  fields,
  value,
  defaults,
  onChange,
}: {
  title: string;
  note?: string;
  fields: LabelSpec[];
  value: T;
  defaults: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className={`${cmsCard} mt-5`}>
      <div>
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h2>
        {note ? <p className="mt-1 text-[12px] text-[#8a8a8a]">{note}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.area ? (
            <div key={f.key} className="sm:col-span-2">
              <AreaField
                label={f.label}
                rows={2}
                value={value[f.key] ?? ""}
                onChange={(v) => onChange({ ...value, [f.key]: v })}
                hint={f.hint ?? `Empty shows: "${defaults[f.key]}"`}
              />
            </div>
          ) : (
            <TextField
              key={f.key}
              label={f.label}
              value={value[f.key] ?? ""}
              placeholder={defaults[f.key]}
              onChange={(v) => onChange({ ...value, [f.key]: v })}
              hint={f.hint}
            />
          ),
        )}
      </div>
    </div>
  );
}
