"use client";

import type { MegaContent, MegaTreatment } from "@/lib/siteContentTypes";

import { fieldInput, fieldLabel } from "./LinkFields";

/**
 * Editor for one nav link's mega menu.
 *
 * Rendered underneath a link row in the Header screen when that link has
 * "Mega menu" ticked, so each item can have its own panel rather than the
 * whole header sharing one.
 *
 * Every field is optional — an empty panel falls back to the header-level
 * defaults, which is what a single shared mega menu looks like.
 */
export default function MegaEditor({
  value,
  onChange,
}: {
  value: MegaContent;
  onChange: (next: MegaContent) => void;
}) {
  const treatments: MegaTreatment[] = value.megaTreatments ?? [];
  const bullets: string[] = value.megaPromoBullets ?? [];

  const set = (patch: Partial<MegaContent>) => onChange({ ...value, ...patch });

  function updateTreatment(i: number, patch: Partial<MegaTreatment>) {
    set({
      megaTreatments: treatments.map((t, idx) =>
        idx === i ? { ...t, ...patch } : t,
      ),
    });
  }
  function moveTreatment(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= treatments.length) return;
    const next = [...treatments];
    [next[i], next[j]] = [next[j], next[i]];
    set({ megaTreatments: next });
  }

  return (
    <div className="mt-2 space-y-4 rounded-lg border border-[#dfe5d5] bg-[#fafbf7] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-[#1a1a1a]">
          Mega menu for this link
        </p>
        <p className="text-[11px] text-[#8a8a8a]">
          Leave empty to use the site-wide defaults
        </p>
      </div>

      <div>
        <label className={fieldLabel}>Panel heading</label>
        <input
          className={`${fieldInput} mt-1 max-w-[320px]`}
          value={value.megaHeading ?? ""}
          onChange={(e) => set({ megaHeading: e.target.value })}
          placeholder="Our Treatments"
        />
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center justify-between">
          <span className={fieldLabel}>Cards</span>
          <button
            type="button"
            onClick={() =>
              set({
                megaTreatments: [
                  ...treatments,
                  { label: "", desc: "", href: "", icon: "" },
                ],
              })
            }
            className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
          >
            + Add card
          </button>
        </div>

        {treatments.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#8a8a8a]">
            No cards — the default treatments will be shown.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {treatments.map((t, i) => (
              <div key={i} className="rounded-lg border border-[#e8ece0] bg-white p-2.5">
                <div className="mb-2 flex flex-wrap gap-2">
                  <input aria-label="Card title" className={`${fieldInput} min-w-[130px] flex-1`} value={t.label} onChange={(e) => updateTreatment(i, { label: e.target.value })} placeholder="Weight loss" />
                  <input aria-label="Card description" className={`${fieldInput} min-w-[170px] flex-[2]`} value={t.desc} onChange={(e) => updateTreatment(i, { desc: e.target.value })} placeholder="Sustainable fat reduction" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input aria-label="Card link" className={`${fieldInput} min-w-[140px] flex-1`} value={t.href} onChange={(e) => updateTreatment(i, { href: e.target.value })} placeholder="/weight-loss" />
                  <input aria-label="Icon path" className={`${fieldInput} min-w-[160px] flex-1`} value={t.icon} onChange={(e) => updateTreatment(i, { icon: e.target.value })} placeholder="/assets/megamenu/treat-wl.png" />
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveTreatment(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                    <button type="button" onClick={() => moveTreatment(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                    <button type="button" onClick={() => set({ megaTreatments: treatments.filter((_, idx) => idx !== i) })} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo card */}
      <div>
        <span className={fieldLabel}>Promo card</span>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          <input className={fieldInput} value={value.megaPromoTitle ?? ""} onChange={(e) => set({ megaPromoTitle: e.target.value })} placeholder="Title — first line" />
          <input className={fieldInput} value={value.megaPromoEmphasis ?? ""} onChange={(e) => set({ megaPromoEmphasis: e.target.value })} placeholder="Second line (italic)" />
          <input className={fieldInput} value={value.megaPromoCta ?? ""} onChange={(e) => set({ megaPromoCta: e.target.value })} placeholder="Button text" />
          <input className={fieldInput} value={value.megaPromoHref ?? ""} onChange={(e) => set({ megaPromoHref: e.target.value })} placeholder="Button link, e.g. /shop" />
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#616161]">Bullet points</span>
            <button
              type="button"
              onClick={() => set({ megaPromoBullets: [...bullets, ""] })}
              className="rounded-lg border border-[#d8ddd0] bg-white px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add bullet
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  aria-label={`Bullet ${i + 1}`}
                  className={fieldInput}
                  value={b}
                  onChange={(e) =>
                    set({
                      megaPromoBullets: bullets.map((x, idx) =>
                        idx === i ? e.target.value : x,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => set({ megaPromoBullets: bullets.filter((_, idx) => idx !== i) })}
                  className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
