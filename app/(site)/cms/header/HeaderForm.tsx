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
import SectionControl from "../SectionControl";
import TypeControl from "../TypeControl";
import { TextField } from "../FormKit";
import type { HeaderTextKey, TextStyle } from "@/lib/textStyle";
import {
  DEFAULT_HEADER_SETTINGS,
  HEADER_LAYOUTS,
  type HeaderLayout,
  type HeaderSettings,
} from "@/lib/headerLayout";
import { EMPTY_STYLE, type SectionStyle } from "@/lib/sectionStyle";

/**
 * A little drawing of the bar, so the choice can be made by eye. The three
 * shapes are the arrangement itself, not decoration: logo block, nav lines,
 * and the Log in pill.
 */
function LayoutThumb({ layout }: { layout: HeaderLayout }) {
  const logo = <rect width="26" height="8" rx="2" fill="currentColor" />;
  const line = (w: number) => <rect width={w} height="4" rx="2" fill="currentColor" opacity="0.35" />;
  return (
    <svg viewBox="0 0 120 28" className="h-8 w-full text-[#1a1a1a]" role="presentation">
      <rect x="0.5" y="0.5" width="119" height="27" rx="4" fill="#fff" stroke="#e4e7de" />
      <g transform="translate(0 10)">
        {layout === "logo-left" ? (
          <>
            <g transform="translate(8 0)">{logo}</g>
            <g transform="translate(40 2)">{line(14)}</g>
            <g transform="translate(58 2)">{line(14)}</g>
            <g transform="translate(76 2)">{line(10)}</g>
          </>
        ) : layout === "logo-centre" ? (
          <>
            <g transform="translate(8 2)">{line(14)}</g>
            <g transform="translate(26 2)">{line(14)}</g>
            <g transform="translate(47 0)">{logo}</g>
          </>
        ) : (
          <>
            <g transform="translate(8 -2)">{line(12)}</g>
            <g transform="translate(8 2)">{line(12)}</g>
            <g transform="translate(8 6)">{line(12)}</g>
            <g transform="translate(47 0)">{logo}</g>
          </>
        )}
        <rect x="92" y="0" width="22" height="8" rx="4" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      </g>
    </svg>
  );
}

function LayoutPicker({
  value,
  onChange,
}: {
  value: HeaderLayout;
  onChange: (next: HeaderLayout) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {HEADER_LAYOUTS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              active
                ? "border-[#1a1a1a] bg-[#f7f8f4]"
                : "border-[#e4e7de] hover:bg-[#fafbf7]"
            }`}
          >
            <LayoutThumb layout={option.value} />
            <span className="mt-2 block text-[13px] font-medium text-[#1a1a1a]">
              {option.label}
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[#8a8a8a]">
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type HeaderInitial = {
  /** Background / text colour for the header bar. */
  style?: SectionStyle;
  /** Layout preset and sticky behaviour. */
  settings?: HeaderSettings;
  /** Per-text size and weight, keyed by the field name. */
  textStyles: Record<HeaderTextKey, TextStyle>;
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
  const [style, setStyle] = useState<SectionStyle>(
    initial.style ?? EMPTY_STYLE,
  );
  const [settings, setSettings] = useState<HeaderSettings>(
    initial.settings ?? DEFAULT_HEADER_SETTINGS,
  );
  const [textStyles, setTextStyles] = useState<Record<HeaderTextKey, TextStyle>>(
    initial.textStyles,
  );
  const setText = (k: HeaderTextKey) => (next: TextStyle) =>
    setTextStyles((t) => ({ ...t, [k]: next }));
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
        styles: { header: style },
        settings,
        textStyles,
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
      // The bar never leaves the screen, so the confirmation has to.
      window.setTimeout(() => setSaved(false), 4000);
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
      
      <div className="space-y-5">
        {/* ---- Layout ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">Layout</h2>
              <p className="mt-1 text-[13px] text-[#616161]">
                Where the logo and the links sit on desktop. Phones always use
                the menu button, whichever you pick.
              </p>
            </div>
            <SectionControl sectionKey="header" value={style} onChange={setStyle} />
          </div>
          <LayoutPicker
            value={settings.layout}
            onChange={(layout) => setSettings({ ...settings, layout })}
          />
          <label className="flex items-start gap-2 text-[13px] text-[#1a1a1a]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={settings.sticky}
              onChange={(e) =>
                setSettings({ ...settings, sticky: e.target.checked })
              }
            />
            <span>
              Keep the header on screen while the page scrolls
              <span className="block text-[12px] text-[#8a8a8a]">
                The bar stays at the top instead of scrolling away with the
                page.
              </span>
            </span>
          </label>
        </div>

        {/* ---- Repeated text: one setting covers every instance ---- */}
        <div className="space-y-3 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">Repeated text</h2>
            <p className="text-[12px] text-[#8a8a8a]">
              Each setting applies to every one of them — all the navigation
              links, all the mega-menu cards, all the promo bullets.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {(
              [
                ["navLink", "Navigation links"],
                ["megaItemLabel", "Menu card titles"],
                ["megaItemDesc", "Menu card descriptions"],
                ["promoBullet", "Promo bullets"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
                {label}
                <TypeControl label={label} value={textStyles[k]} onChange={setText(k)} />
              </div>
            ))}
          </div>
        </div>

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

          <TextField
            id="megaHeading"
            label="Panel heading"
            value={megaHeading}
            onChange={setMegaHeading}
            style={textStyles.megaHeading}
            onStyle={setText("megaHeading")}
          />

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
            <TextField
              id="promoTitle"
              label="Title (first line)"
              value={promoTitle}
              onChange={setPromoTitle}
              style={textStyles.promoTitle}
              onStyle={setText("promoTitle")}
            />
            <TextField
              id="promoEm"
              label="Second line (italic)"
              value={promoEmphasis}
              onChange={setPromoEmphasis}
              style={textStyles.promoEmphasis}
              onStyle={setText("promoEmphasis")}
            />
            <TextField
              id="promoCta"
              label="Button text"
              value={promoCta}
              onChange={setPromoCta}
              style={textStyles.promoCta}
              onStyle={setText("promoCta")}
            />
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

      <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-3 border-t border-[#e4e7de] bg-[#f7f9f2]/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save header"}
        </button>
      
        {saved ? (
          <span className="text-[13px] text-[#2f6b33]">Saved. Reload any page to see the change.</span>
        ) : null}
        {error ? (
          <span className="text-[13px] text-[#8a2b2b]">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
