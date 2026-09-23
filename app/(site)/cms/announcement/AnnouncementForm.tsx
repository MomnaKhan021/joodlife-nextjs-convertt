"use client";

import Link from "next/link";
import { useState } from "react";

import type { HomeContent } from "@/lib/pageContentTypes";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import SectionControl from "../SectionControl";
import { AreaField, TextField } from "../FormKit";
import {
  textStyleProps,
  type HomeTextKey,
  type TextStyle,
} from "@/lib/textStyle";
import { styleProps, type SectionStyle } from "@/lib/sectionStyle";

/**
 * Editor for the announcement bar.
 *
 * Its own screen because the bar is sitewide — it sits above the header on
 * every page, not just the home page — so grouping it with the home page
 * sections was misleading.
 */
export default function AnnouncementForm({
  initial,
}: {
  initial: HomeContent;
}) {
  const [style, setStyle] = useState<SectionStyle>(
    initial.styles.announcement,
  );
  const [textStyles, setTextStyles] = useState<Record<HomeTextKey, TextStyle>>(
    initial.textStyles,
  );
  const setTextStyle = (k: HomeTextKey) => (next: TextStyle) =>
    setTextStyles((t) => ({ ...t, [k]: next }));
  const [badge, setBadge] = useState(initial.announcementBadge);
  const [text, setText] = useState(initial.announcementText);
  const [href, setHref] = useState(initial.announcementHref);
  const [hidden, setHidden] = useState(initial.announcementHidden);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("home-page", {
        // The home editor keeps its section colours in this same object,
        // so send it back whole — sending only ours would wipe them.
        styles: { ...initial.styles, announcement: style },
        // Same column as the home editor's text sizes: send it whole,
        // or saving here would wipe the home page's.
        textStyles,
        announcementBadge: badge,
        announcementText: text,
        announcementHref: href,
        announcementHidden: hidden,
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
    <div className="mx-auto w-full max-w-[820px]">
      <header className="mb-6">
        <Link href="/cms" className="text-[13px] text-[#616161] underline-offset-2 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Announcement bar
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          The dark strip above the header. It appears on{" "}
          <strong>every page</strong>, not just the home page.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      
      {/* Live-ish preview so the effect is obvious before saving. */}
      <div className="mb-5 overflow-hidden rounded-xl border border-[#e4e7de]">
        <p className="border-b border-[#e4e7de] bg-[#fafbf7] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#8a8a8a]">
          Preview
        </p>
        {hidden ? (
          <p className="bg-white px-4 py-4 text-[13px] text-[#8a8a8a]">
            Hidden — the bar won&apos;t render.
          </p>
        ) : (
          <div
            {...styleProps(style)}
            className="flex items-center justify-center gap-3 bg-[#142e2a] px-4 py-3 text-white"
          >
            {badge ? (
              <span
                {...textStyleProps(textStyles.announcementBadge)}
                className="rounded-md bg-[#ffcebf] px-2.5 py-0.5 text-[12px] font-semibold text-[#142e2a]"
              >
                {badge}
              </span>
            ) : null}
            <span {...textStyleProps(textStyles.announcementText)} className="text-[13px]">
              {text}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">Announcement</h2>
          <SectionControl sectionKey="announcement" value={style} onChange={setStyle} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <TextField
              id="badge"
              label="Badge"
              value={badge}
              onChange={setBadge}
              placeholder="New"
              style={textStyles.announcementBadge}
              onStyle={setTextStyle("announcementBadge")}
            />
            <p className="mt-1 text-[12px] text-[#8a8a8a]">Blank hides the pill.</p>
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel} htmlFor="href">Links to</label>
            <input id="href" className={`${fieldInput} mt-1`} value={href} onChange={(e) => setHref(e.target.value)} placeholder="/wegovy-pills" />
          </div>
        </div>
        <AreaField
          id="text"
          label="Message"
          rows={2}
          value={text}
          onChange={setText}
          style={textStyles.announcementText}
          onStyle={setTextStyle("announcementText")}
        />
        <label className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          Hide the announcement bar entirely
        </label>
      </div>

      <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-3 border-t border-[#e4e7de] bg-[#f7f9f2]/95 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save announcement"}
        </button>
      
        {saved ? (
          <span className="text-[13px] text-[#2f6b33]">Saved. Reload the site to see the change.</span>
        ) : null}
        {error ? (
          <span className="text-[13px] text-[#8a2b2b]">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
