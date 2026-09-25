"use client";

import Link from "next/link";
import { useState } from "react";

import {
  SOCIAL_PLATFORMS,
  type FooterContent,
  type SocialLink,
  type SocialPlatform,
} from "@/lib/siteContentTypes";
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
import TypeControl from "../TypeControl";

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
  const [joodTitle, setJoodTitle] = useState(initial.joodTitle);
  const [treatmentsTitle, setTreatmentsTitle] = useState(initial.treatmentsTitle);
  const [policyTitle, setPolicyTitle] = useState(initial.policyTitle);
  const [followTitle, setFollowTitle] = useState(initial.followTitle);
  const [socials, setSocials] = useState<SocialLink[]>(initial.socials);
  const [copyrightLine, setCopyrightLine] = useState(initial.copyrightLine);
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
        joodTitle,
        treatmentsTitle,
        policyTitle,
        followTitle,
        socials: socials.filter((sn) => sn.href.trim()),
        copyrightLine,
        legalText,
        logo,
        contactIcon,
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["columnTitle", "Column titles"],
                ["linkLabel", "Link labels"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <TypeControl label={lbl} value={textStyles[k]} onChange={setText(k)} />
              </span>
            ))}
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

        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              Column headings
            </h2>
            <p className="text-[12px] text-[#8a8a8a]">
              The words above each list of links, and above the social icons.
              Leaving one empty restores the heading the site ships with.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="joodTitle"
              label="First column"
              value={joodTitle}
              onChange={setJoodTitle}
              style={textStyles.columnTitle}
              onStyle={setText("columnTitle")}
            />
            <TextField
              id="treatmentsTitle"
              label="Second column"
              value={treatmentsTitle}
              onChange={setTreatmentsTitle}
            />
            <TextField
              id="policyTitle"
              label="Third column"
              value={policyTitle}
              onChange={setPolicyTitle}
            />
            <TextField
              id="followTitle"
              label="Above the social icons"
              value={followTitle}
              onChange={setFollowTitle}
            />
          </div>
          <p className="rounded-lg border border-[#e4e7de] bg-[#fafbf7] px-3 py-2 text-[12px] leading-relaxed text-[#616161]">
            The size and weight control on the first field applies to all four
            headings — they are drawn the same way.
          </p>
        </div>

        <LinkRepeater title="“Jood” column" links={joodLinks} onChange={setJoodLinks} />
        <LinkRepeater title="“Treatments” column" links={treatmentLinks} onChange={setTreatmentLinks} />
        <LinkRepeater title="“Policy” column" links={policyLinks} onChange={setPolicyLinks} />

        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-[#1a1a1a]">
                Social icons
              </h2>
              <p className="text-[12px] text-[#8a8a8a]">
                Shown under the heading above. The platform picks which icon is
                drawn; remove them all to hide the icons entirely.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSocials([...socials, { platform: "instagram", href: "" }])
              }
              className="shrink-0 rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {socials.map((sn, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Social ${i + 1} platform`}
                  className={`${fieldInput} w-auto`}
                  value={sn.platform}
                  onChange={(e) =>
                    setSocials(
                      socials.map((x, j) =>
                        j === i
                          ? { ...x, platform: e.target.value as SocialPlatform }
                          : x,
                      ),
                    )
                  }
                >
                  {SOCIAL_PLATFORMS.map((pl) => (
                    <option key={pl.value} value={pl.value}>
                      {pl.label}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`Social ${i + 1} link`}
                  className={`${fieldInput} flex-1 min-w-[220px]`}
                  value={sn.href}
                  placeholder="https://…"
                  onChange={(e) =>
                    setSocials(
                      socials.map((x, j) =>
                        j === i ? { ...x, href: e.target.value } : x,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setSocials(socials.filter((_, j) => j !== i))}
                  className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
            {socials.length === 0 ? (
              <p className="text-[12px] text-[#8a8a8a]">
                No icons — the heading above them is hidden too.
              </p>
            ) : null}
          </div>
        </div>

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
              <TextField
                id="copyright"
                label="Copyright line"
                value={copyrightLine}
                onChange={setCopyrightLine}
                hint={"Sits before the small print. {year} becomes the current year."}
              />
            </div>
            <div className="sm:col-span-2">
              <AreaField
                id="legal"
                label="Legal / small print"
                rows={4}
                value={legalText}
                onChange={setLegalText}
                hint={"Registration and compliance wording, shown after the copyright line. Clearing it restores the wording the site ships with."}
                style={textStyles.legalText}
                onStyle={setText("legalText")}
              />
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
          {saving ? "Saving…" : "Save footer"}
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
