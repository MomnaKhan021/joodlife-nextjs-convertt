"use client";

import Link from "next/link";
import { useState } from "react";

import type { FooterContent } from "@/lib/siteContent";
import {
  LinkRepeater,
  fieldInput,
  fieldLabel,
  saveGlobal,
} from "../LinkFields";

/** Editor for the site footer: link columns, contact card, newsletter, legal. */
export default function FooterForm({ initial }: { initial: FooterContent }) {
  const [joodLinks, setJoodLinks] = useState(initial.joodLinks);
  const [treatmentLinks, setTreatmentLinks] = useState(initial.treatmentLinks);
  const [policyLinks, setPolicyLinks] = useState(initial.policyLinks);
  const [contactHeading, setContactHeading] = useState(initial.contactHeading);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [newsletterHeading, setNewsletterHeading] = useState(initial.newsletterHeading);
  const [newsletterSubtext, setNewsletterSubtext] = useState(initial.newsletterSubtext);
  const [legalText, setLegalText] = useState(initial.legalText);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("footer", {
        joodLinks,
        treatmentLinks,
        policyLinks,
        contactHeading,
        phone,
        email,
        newsletterHeading,
        newsletterSubtext,
        legalText,
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
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">Footer</h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Footer link columns, contact card, newsletter copy and small print.
          Leave a list empty to fall back to the built-in defaults.
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
        <LinkRepeater title="“Jood” column" links={joodLinks} onChange={setJoodLinks} />
        <LinkRepeater title="“Treatments” column" links={treatmentLinks} onChange={setTreatmentLinks} />
        <LinkRepeater title="“Policy” column" links={policyLinks} onChange={setPolicyLinks} />

        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            Contact &amp; newsletter
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="contactHeading">Contact heading</label>
              <input id="contactHeading" className={`${fieldInput} mt-1`} value={contactHeading} onChange={(e) => setContactHeading(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="phone">WhatsApp / phone</label>
              <input id="phone" className={`${fieldInput} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                The wa.me link is rebuilt from this number automatically.
              </p>
            </div>
            <div>
              <label className={fieldLabel} htmlFor="email">Support email</label>
              <input id="email" className={`${fieldInput} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="nlHeading">Newsletter heading</label>
              <input id="nlHeading" className={`${fieldInput} mt-1`} value={newsletterHeading} onChange={(e) => setNewsletterHeading(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="nlSub">Newsletter subtext</label>
              <input id="nlSub" className={`${fieldInput} mt-1`} value={newsletterSubtext} onChange={(e) => setNewsletterSubtext(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="legal">Legal / small print</label>
              <textarea id="legal" rows={4} className={`${fieldInput} mt-1`} value={legalText} onChange={(e) => setLegalText(e.target.value)} />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                The “© year Jood. All rights reserved.” prefix is added
                automatically — just the rest goes here.
              </p>
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
          {saving ? "Saving…" : "Save footer"}
        </button>
      </div>
    </div>
  );
}
