"use client";

import Link from "next/link";
import { useState } from "react";

import type { SiteLink } from "@/lib/siteContent";

/**
 * Editor for the Header and Footer globals.
 *
 * Saves through Payload's REST endpoints for globals
 * (POST /api/globals/header, /api/globals/footer), so the admin-only
 * update rule is enforced server-side.
 *
 * Link lists are stored as JSON; this renders them as a proper repeater so
 * nobody has to hand-write JSON.
 */

const label = "block text-[13px] font-medium text-[#1a1a1a]";
const input =
  "w-full rounded-lg border border-[#d8ddd0] bg-white px-3 py-2 text-[14px] text-[#1a1a1a] outline-none focus:border-[#1a1a1a]";

function LinkRepeater({
  title,
  hint,
  links,
  onChange,
  allowMega,
}: {
  title: string;
  hint?: string;
  links: SiteLink[];
  onChange: (next: SiteLink[]) => void;
  allowMega?: boolean;
}) {
  function update(i: number, patch: Partial<SiteLink>) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="rounded-xl border border-[#e4e7de] bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-[#1a1a1a]">{title}</h2>
        <button
          type="button"
          onClick={() => onChange([...links, { label: "", href: "" }])}
          className="rounded-lg border border-[#d8ddd0] px-3 py-1 text-[12px] font-medium text-[#1a1a1a] transition-colors hover:bg-[#f4f6f0]"
        >
          + Add link
        </button>
      </div>
      {hint && <p className="mb-3 text-[12px] text-[#8a8a8a]">{hint}</p>}

      {links.length === 0 ? (
        <p className="text-[13px] text-[#616161]">
          No links — the built-in defaults will be used.
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                aria-label="Label"
                className={`${input} min-w-[130px] flex-1`}
                value={l.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Label"
              />
              <input
                aria-label="Link URL"
                className={`${input} min-w-[160px] flex-1`}
                value={l.href}
                onChange={(e) => update(i, { href: e.target.value })}
                placeholder="/path or https://…"
              />
              {allowMega && (
                <label className="flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#616161]">
                  <input
                    type="checkbox"
                    checked={Boolean(l.mega)}
                    onChange={(e) => update(i, { mega: e.target.checked })}
                  />
                  Mega menu
                </label>
              )}
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} className="rounded px-1.5 py-1 text-[13px] text-[#616161] hover:bg-[#f0f2ec]" title="Move down">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(links.filter((_, idx) => idx !== i))}
                  className="rounded px-1.5 py-1 text-[13px] text-[#8a2b2b] hover:bg-[#fdf3f3]"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type NavigationInitial = {
  navLinks: SiteLink[];
  joodLinks: SiteLink[];
  treatmentLinks: SiteLink[];
  policyLinks: SiteLink[];
  contactHeading: string;
  phone: string;
  email: string;
  newsletterHeading: string;
  newsletterSubtext: string;
  legalText: string;
};

export default function NavigationForm({
  initial,
}: {
  initial: NavigationInitial;
}) {
  const [navLinks, setNavLinks] = useState(initial.navLinks);
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

  async function saveGlobal(slug: string, body: unknown) {
    const res = await fetch(`/api/globals/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(
        json?.errors?.[0]?.message ||
          json?.message ||
          `Saving ${slug} failed (HTTP ${res.status})`,
      );
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("header", { navLinks });
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
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Header &amp; Footer
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Navigation links and footer content, used on every page. Leave a list
          empty to fall back to the built-in defaults.
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
        <LinkRepeater
          title="Header navigation"
          hint='Top nav. Tick "Mega menu" on the item that opens the Treatments panel.'
          links={navLinks}
          onChange={setNavLinks}
          allowMega
        />
        <LinkRepeater title="Footer — Jood column" links={joodLinks} onChange={setJoodLinks} />
        <LinkRepeater title="Footer — Treatments column" links={treatmentLinks} onChange={setTreatmentLinks} />
        <LinkRepeater title="Footer — Policy column" links={policyLinks} onChange={setPolicyLinks} />

        <div className="space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5">
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            Contact &amp; newsletter
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="contactHeading">Contact heading</label>
              <input id="contactHeading" className={`${input} mt-1`} value={contactHeading} onChange={(e) => setContactHeading(e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="phone">WhatsApp / phone</label>
              <input id="phone" className={`${input} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="email">Support email</label>
              <input id="email" className={`${input} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={label} htmlFor="nlHeading">Newsletter heading</label>
              <input id="nlHeading" className={`${input} mt-1`} value={newsletterHeading} onChange={(e) => setNewsletterHeading(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="nlSub">Newsletter subtext</label>
              <input id="nlSub" className={`${input} mt-1`} value={newsletterSubtext} onChange={(e) => setNewsletterSubtext(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="legal">Legal / small print</label>
              <textarea id="legal" rows={4} className={`${input} mt-1`} value={legalText} onChange={(e) => setLegalText(e.target.value)} />
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
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
