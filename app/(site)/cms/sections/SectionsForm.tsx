"use client";

import Link from "next/link";
import { useState } from "react";

import type { Faq, HomeContent } from "@/lib/pageContentTypes";
import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import MediaPicker from "../MediaPicker";

/**
 * Editor for the home page sections.
 *
 * Saves to the `home-page` global through Payload's REST endpoint, so the
 * admin-only rule is enforced server-side. Every field is optional — clearing
 * one restores the copy that ships in the component.
 */
export default function SectionsForm({ initial }: { initial: HomeContent }) {
  const [badge, setBadge] = useState(initial.announcementBadge);
  const [annText, setAnnText] = useState(initial.announcementText);
  const [annHref, setAnnHref] = useState(initial.announcementHref);
  const [annHidden, setAnnHidden] = useState(initial.announcementHidden);

  const [faqHeading, setFaqHeading] = useState(initial.faqHeading);
  const [faqEmphasis, setFaqEmphasis] = useState(initial.faqHeadingEmphasis);
  const [faqs, setFaqs] = useState<Faq[]>(initial.faqs);

  const [ctaTitle, setCtaTitle] = useState(initial.ctaTitle);
  const [ctaEmphasis, setCtaEmphasis] = useState(initial.ctaTitleEmphasis);
  const [ctaSubtitle, setCtaSubtitle] = useState(initial.ctaSubtitle);
  const [ctaImage, setCtaImage] = useState(initial.ctaImage);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateFaq(i: number, patch: Partial<Faq>) {
    setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function moveFaq(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= faqs.length) return;
    const next = [...faqs];
    [next[i], next[j]] = [next[j], next[i]];
    setFaqs(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("home-page", {
        announcementBadge: badge,
        announcementText: annText,
        announcementHref: annHref,
        announcementHidden: annHidden,
        faqHeading,
        faqHeadingEmphasis: faqEmphasis,
        faqs: faqs.filter((f) => f.q.trim() || f.a.trim()),
        ctaTitle,
        ctaTitleEmphasis: ctaEmphasis,
        ctaSubtitle,
        ctaImage,
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
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Page sections
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Copy and imagery for the home page. Clear any field to restore the
          built-in text.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      {saved && (
        <p className="mb-4 rounded-lg border border-[#bcd9b8] bg-[#f1f8ef] px-4 py-3 text-[13px] text-[#2f6b33]">
          Saved. Reload the site to see the change.
        </p>
      )}

      <div className="space-y-5">
        {/* ---- Announcement bar ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              Announcement bar
            </h2>
            <p className="text-[12px] text-[#8a8a8a]">
              The dark strip above the header — shown on every page.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={fieldLabel} htmlFor="badge">Badge</label>
              <input id="badge" className={`${fieldInput} mt-1`} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="New" />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">Blank hides the pill.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="annHref">Links to</label>
              <input id="annHref" className={`${fieldInput} mt-1`} value={annHref} onChange={(e) => setAnnHref(e.target.value)} placeholder="/wegovy-pills" />
            </div>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="annText">Message</label>
            <textarea id="annText" rows={2} className={`${fieldInput} mt-1`} value={annText} onChange={(e) => setAnnText(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
            <input type="checkbox" checked={annHidden} onChange={(e) => setAnnHidden(e.target.checked)} />
            Hide the announcement bar entirely
          </label>
        </div>

        {/* ---- FAQ ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">FAQ</h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Questions shown near the bottom of the home page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFaqs([...faqs, { q: "", a: "" }])}
              className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add question
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="faqH">Heading</label>
              <input id="faqH" className={`${fieldInput} mt-1`} value={faqHeading} onChange={(e) => setFaqHeading(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="faqE">Heading (italic part)</label>
              <input id="faqE" className={`${fieldInput} mt-1`} value={faqEmphasis} onChange={(e) => setFaqEmphasis(e.target.value)} />
            </div>
          </div>

          {faqs.length === 0 ? (
            <p className="text-[13px] text-[#616161]">
              No questions — the built-in list will be used.
            </p>
          ) : (
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <div key={i} className="rounded-lg border border-[#eef1e8] p-3">
                  <div className="flex items-start gap-2">
                    <input
                      aria-label={`Question ${i + 1}`}
                      className={fieldInput}
                      value={f.q}
                      onChange={(e) => updateFaq(i, { q: e.target.value })}
                      placeholder="Question"
                    />
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveFaq(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">↑</button>
                      <button type="button" onClick={() => moveFaq(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">↓</button>
                      <button type="button" onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))} className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]" title="Remove">✕</button>
                    </div>
                  </div>
                  <textarea
                    aria-label={`Answer ${i + 1}`}
                    rows={2}
                    className={`${fieldInput} mt-2`}
                    value={f.a}
                    onChange={(e) => updateFaq(i, { a: e.target.value })}
                    placeholder="Answer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- Closing CTA ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              Closing call-to-action
            </h2>
            <p className="text-[12px] text-[#8a8a8a]">
              The banner just above the footer.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="ctaT">Title</label>
              <input id="ctaT" className={`${fieldInput} mt-1`} value={ctaTitle} onChange={(e) => setCtaTitle(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="ctaE">Title (italic part)</label>
              <input id="ctaE" className={`${fieldInput} mt-1`} value={ctaEmphasis} onChange={(e) => setCtaEmphasis(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="ctaS">Subtitle</label>
              <textarea id="ctaS" rows={2} className={`${fieldInput} mt-1`} value={ctaSubtitle} onChange={(e) => setCtaSubtitle(e.target.value)} />
            </div>
          </div>
          <div>
            <span className={fieldLabel}>Background image</span>
            <MediaPicker
              valueId={null}
              valueUrl={ctaImage || null}
              onChange={(_id, url) => setCtaImage(url ?? "")}
            />
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
          {saving ? "Saving…" : "Save sections"}
        </button>
      </div>
    </div>
  );
}
