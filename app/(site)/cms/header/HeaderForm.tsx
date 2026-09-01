"use client";

import Link from "next/link";
import { useState } from "react";

import type { MegaContent, MegaTreatment, SiteLink } from "@/lib/siteContentTypes";
import {
  LinkRepeater,
  fieldInput,
  fieldLabel,
  saveGlobal,
} from "../LinkFields";
import MegaEditor from "../MegaEditor";
import MediaPicker from "../MediaPicker";

export type HeaderInitial = {
  navLinks: SiteLink[];
  megaHeading: string;
  megaTreatments: MegaTreatment[];
  megaPromoTitle: string;
  megaPromoEmphasis: string;
  megaPromoBullets: string[];
  megaPromoCta: string;
  megaPromoHref: string;
  logoDesktop: string;
  logoMobile: string;
};

/** Editor for everything in the site header, including the mega menu. */
export default function HeaderForm({ initial }: { initial: HeaderInitial }) {
  const [navLinks, setNavLinks] = useState(initial.navLinks);
  const [megaHeading, setMegaHeading] = useState(initial.megaHeading);
  const [treatments, setTreatments] = useState(initial.megaTreatments);
  const [promoTitle, setPromoTitle] = useState(initial.megaPromoTitle);
  const [promoEmphasis, setPromoEmphasis] = useState(initial.megaPromoEmphasis);
  const [bullets, setBullets] = useState(initial.megaPromoBullets);
  const [promoCta, setPromoCta] = useState(initial.megaPromoCta);
  const [promoHref, setPromoHref] = useState(initial.megaPromoHref);
  const [logoDesktop, setLogoDesktop] = useState(initial.logoDesktop);
  const [logoMobile, setLogoMobile] = useState(initial.logoMobile);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTreatment(i: number, patch: Partial<MegaTreatment>) {
    setTreatments(treatments.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function moveTreatment(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= treatments.length) return;
    const next = [...treatments];
    [next[i], next[j]] = [next[j], next[i]];
    setTreatments(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("header", {
        navLinks,
        megaHeading,
        megaTreatments: treatments,
        megaPromoTitle: promoTitle,
        megaPromoEmphasis: promoEmphasis,
        megaPromoBullets: bullets.filter((b) => b.trim()),
        megaPromoCta: promoCta,
        megaPromoHref: promoHref,
        logoDesktop,
        logoMobile,
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
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Header</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Top navigation and mega menus. Each link can have its own panel —
          tick “Mega menu” on a link and its editor appears underneath.
          Anything left empty falls back to the defaults below.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          Saved. Reload any page to see the change.
        </p>
      )}

      <div className="space-y-5">
        {/* ---- Logos ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">Logo</h2>
            <p className="text-[12px] text-[#8a8a8a]">
              Two versions — the wide one for desktop, the compact one for
              mobile and the slide-out drawer. Clear a field to restore the
              built-in logo.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={fieldLabel}>Desktop logo</span>
              <MediaPicker
                valueId={null}
                valueUrl={logoDesktop || null}
                onChange={(_id, url) => setLogoDesktop(url ?? "")}
              />
            </div>
            <div>
              <span className={fieldLabel}>Mobile logo</span>
              <MediaPicker
                valueId={null}
                valueUrl={logoMobile || null}
                onChange={(_id, url) => setLogoMobile(url ?? "")}
              />
            </div>
          </div>
        </div>

        <LinkRepeater
          title="Navigation links"
          hint='Tick "Mega menu" on any link to give it its own panel — each link can have a different one.'
          links={navLinks}
          onChange={setNavLinks}
          allowMega
          renderExtra={(link, i, update) =>
            link.mega ? (
              <MegaEditor
                value={link.megaContent ?? ({} as MegaContent)}
                onChange={(next) => update({ megaContent: next })}
              />
            ) : null
          }
        />

        {/* ---- Mega menu ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">
                Default mega menu — cards
              </h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Used by any link that has “Mega menu” ticked but no cards of
                its own.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setTreatments([...treatments, { label: "", desc: "", href: "", icon: "" }])
              }
              className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add card
            </button>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="megaHeading">Panel heading</label>
            <input id="megaHeading" className={`${fieldInput} mt-1 max-w-[320px]`} value={megaHeading} onChange={(e) => setMegaHeading(e.target.value)} />
          </div>

          {treatments.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No cards — the built-in treatments will be used.
            </p>
          ) : (
            <div className="space-y-3">
              {treatments.map((t, i) => (
                <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <input aria-label="Card title" className={`${fieldInput} min-w-[140px] flex-1`} value={t.label} onChange={(e) => updateTreatment(i, { label: e.target.value })} placeholder="Weight loss" />
                    <input aria-label="Card description" className={`${fieldInput} min-w-[180px] flex-[2]`} value={t.desc} onChange={(e) => updateTreatment(i, { desc: e.target.value })} placeholder="Sustainable fat reduction" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input aria-label="Card link" className={`${fieldInput} min-w-[150px] flex-1`} value={t.href} onChange={(e) => updateTreatment(i, { href: e.target.value })} placeholder="/weight-loss" />
                    <input aria-label="Icon path" className={`${fieldInput} min-w-[170px] flex-1`} value={t.icon} onChange={(e) => updateTreatment(i, { icon: e.target.value })} placeholder="/assets/megamenu/treat-wl.png" />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveTreatment(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                      <button type="button" onClick={() => moveTreatment(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                      <button type="button" onClick={() => setTreatments(treatments.filter((_, idx) => idx !== i))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Promo card ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              Default promo card
            </h2>
            <p className="text-[12px] text-[#8a8a8a]">
              Shown in any mega panel that doesn&apos;t set its own promo.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="promoTitle">Title (first line)</label>
              <input id="promoTitle" className={`${fieldInput} mt-1`} value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="promoEm">Second line (italic)</label>
              <input id="promoEm" className={`${fieldInput} mt-1`} value={promoEmphasis} onChange={(e) => setPromoEmphasis(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="promoCta">Button text</label>
              <input id="promoCta" className={`${fieldInput} mt-1`} value={promoCta} onChange={(e) => setPromoCta(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="promoHref">Button link</label>
              <input id="promoHref" className={`${fieldInput} mt-1`} value={promoHref} onChange={(e) => setPromoHref(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className={fieldLabel}>Bullet points</span>
              <button
                type="button"
                onClick={() => setBullets([...bullets, ""])}
                className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
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
                      setBullets(bullets.map((x, idx) => (idx === i ? e.target.value : x)))
                    }
                  />
                  <button type="button" onClick={() => setBullets(bullets.filter((_, idx) => idx !== i))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save header"}
        </button>
      </div>
    </div>
  );
}
