"use client";

import Link from "next/link";
import { useState } from "react";

import type { FooterContent } from "@/lib/siteContentTypes";
import {
  LinkRepeater,
  fieldInput,
  fieldLabel,
  saveGlobal,
} from "../LinkFields";
import MediaPicker from "../MediaPicker";
import SectionControl from "../SectionControl";
import { AreaField, TextField } from "../FormKit";
import type { FooterTextKey, TextStyle } from "@/lib/textStyle";
import { EMPTY_STYLE, type SectionStyle } from "@/lib/sectionStyle";

/** Editor for the site footer: link columns, contact card, newsletter, legal. */
export default function FooterForm({ initial }: { initial: FooterContent }) {
  const [style, setStyle] = useState<SectionStyle>(
    initial.style ?? EMPTY_STYLE,
  );
  const [textStyles, setTextStyles] = useState<Record<FooterTextKey, TextStyle>>(
    initial.textStyles,
  );
  const setText = (k: FooterTextKey) => (next: TextStyle) =>
    setTextStyles((t) => ({ ...t, [k]: next }));
  const [joodLinks, setJoodLinks] = useState(initial.joodLinks);
  const [treatmentLinks, setTreatmentLinks] = useState(initial.treatmentLinks);
  const [policyLinks, setPolicyLinks] = useState(initial.policyLinks);
  const [contactHeading, setContactHeading] = useState(initial.contactHeading);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [newsletterHeading, setNewsletterHeading] = useState(initial.newsletterHeading);
  const [newsletterSubtext, setNewsletterSubtext] = useState(initial.newsletterSubtext);
  const [legalText, setLegalText] = useState(initial.legalText);
  const [logo, setLogo] = useState(initial.logo);
  const [contactIcon, setContactIcon] = useState(initial.contactIcon);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("footer", {
        styles: { footer: style },
        textStyles,
        joodLinks,
        treatmentLinks,
        policyLinks,
        contactHeading,
        phone,
        email,
        newsletterHeading,
        newsletterSubtext,
        legalText,
        logo,
        contactIcon,
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
        {/* ---- Images ---- */}
        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">Images</h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Clear a field to restore the built-in image.
              </p>
            </div>
            {/* The footer is one band, so its appearance sits on its first card. */}
            <SectionControl sectionKey="footer" value={style} onChange={setStyle} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <span className={fieldLabel}>Footer logo</span>
              <MediaPicker
                valueId={null}
                valueUrl={logo || null}
                onChange={(_id, url) => setLogo(url ?? "")}
              />
            </div>
            <div>
              <span className={fieldLabel}>Contact icon</span>
              <p className="text-[12px] text-[#8a8a8a]">
                Shown beside the WhatsApp and Email rows.
              </p>
              <MediaPicker
                valueId={null}
                valueUrl={contactIcon || null}
                onChange={(_id, url) => setContactIcon(url ?? "")}
              />
            </div>
          </div>
        </div>

        <LinkRepeater title="“Jood” column" links={joodLinks} onChange={setJoodLinks} />
        <LinkRepeater title="“Treatments” column" links={treatmentLinks} onChange={setTreatmentLinks} />
        <LinkRepeater title="“Policy” column" links={policyLinks} onChange={setPolicyLinks} />

        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            Contact &amp; newsletter
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="contactHeading"
              label="Contact heading"
              value={contactHeading}
              onChange={setContactHeading}
              style={textStyles.contactHeading}
              onStyle={setText("contactHeading")}
            />
            <TextField
              id="phone"
              label="WhatsApp / phone"
              value={phone}
              onChange={setPhone}
              hint={"The wa.me link is rebuilt from this number automatically."}
              style={textStyles.phone}
              onStyle={setText("phone")}
            />
            <div>
              <label className={fieldLabel} htmlFor="email">Support email</label>
              <input id="email" className={`${fieldInput} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <TextField
              id="nlHeading"
              label="Newsletter heading"
              value={newsletterHeading}
              onChange={setNewsletterHeading}
              style={textStyles.newsletterHeading}
              onStyle={setText("newsletterHeading")}
            />
            <div className="sm:col-span-2">
              <TextField
                id="nlSub"
                label="Newsletter subtext"
                value={newsletterSubtext}
                onChange={setNewsletterSubtext}
                style={textStyles.newsletterSubtext}
                onStyle={setText("newsletterSubtext")}
              />
            </div>
            <div className="sm:col-span-2">
              <AreaField
                id="legal"
                label="Legal / small print"
                rows={4}
                value={legalText}
                onChange={setLegalText}
                hint={"The “© year Jood. All rights reserved.” prefix is added automatically — just the rest goes here."}
                style={textStyles.legalText}
                onStyle={setText("legalText")}
              />
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
