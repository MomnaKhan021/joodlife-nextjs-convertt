"use client";

import Link from "next/link";
import { useState } from "react";

import type { BlogPageContent } from "@/lib/blogPageContentTypes";

import { fieldInput, fieldLabel, saveGlobal } from "../LinkFields";
import MediaPicker from "../MediaPicker";
import SectionControl from "../SectionControl";
import type { BlogPageStyleKey, SectionStyle } from "@/lib/sectionStyle";
import { LabelRow, Ts, TextStyleCtx } from "../TextStyleContext";
import type { TextStyle } from "@/lib/textStyle";

/**
 * Editor for the /blogs listing page, in page order: the photo hero, the
 * heading above the grid, the newsletter block and the closing banner.
 *
 * The articles themselves are not here — they live in Blog posts. This is
 * only the furniture around them.
 */

const card = "space-y-4 rounded-xl border border-[#e4e7de] bg-white p-5";

export default function BlogPageForm({
  initial,
}: {
  initial: BlogPageContent;
}) {
  const [styles, setStyles] = useState(initial.styles);
  const setStyle = (k: BlogPageStyleKey) => (next: SectionStyle) =>
    setStyles((st) => ({ ...st, [k]: next }));
  const [hero, setHero] = useState(initial.hero);
  const [list, setList] = useState(initial.list);
  const [newsletter, setNewsletter] = useState(initial.newsletter);
  const [cta, setCta] = useState(initial.cta);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveGlobal("blog-page", {
        styles,
        textStyles,
        hero,
        list,
        newsletter,
        cta,
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

  const [textStyles, setTextStyles] = useState<Record<string, TextStyle>>(
    initial.textStyles,
  );
  const textStyleApi = {
    get: (k: string) => textStyles[k],
    set: (k: string) => (next: TextStyle) =>
      setTextStyles((t) => ({ ...t, [k]: next })),
  };

  return (
    <TextStyleCtx.Provider value={textStyleApi}>
    <div className="mx-auto w-full max-w-[1000px]">
      <header className="mb-6">
        <Link
          href="/cms"
          className="text-[13px] text-[#616161] underline-offset-2 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-[24px] font-semibold text-[#1a1a1a]">
          Blog listing page
        </h1>
        <p className="mt-1 text-[14px] text-[#616161]">
          Live at <code className="rounded bg-[#eef1e8] px-1.5 py-0.5">/blogs</code>{" "}
          — the page around the articles. The articles themselves are in{" "}
          <Link href="/cms/blogs" className="underline underline-offset-2">
            Blog posts
          </Link>
          .
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[#e5b3b3] bg-[#fdf3f3] px-4 py-3 text-[13px] text-[#8a2b2b]">
          {error}
        </p>
      )}
      
      <div className="space-y-5">
        {/* ── 1. Hero ── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="hero" value={styles.hero} onChange={setStyle("hero")} />
          </div>
          <h2 className="text-[15px] font-medium text-[#1a1a1a]">
            1. Hero banner
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LabelRow k="hero.title" label="Title">
                <label className={fieldLabel}>Title</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="hero.titleAccent" label="Title (italic part)">
                <label className={fieldLabel}>Title (italic part)</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.titleAccent}
                onChange={(e) =>
                  setHero({ ...hero, titleAccent: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <LabelRow k="hero.body" label="Body">
                <label className={fieldLabel}>Body</label>
              </LabelRow>
              <textarea
                rows={3}
                className={`${fieldInput} mt-1`}
                value={hero.body}
                onChange={(e) => setHero({ ...hero, body: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="hero.ctaLabel" label="Button text">
                <label className={fieldLabel}>Button text</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.ctaLabel}
                onChange={(e) => setHero({ ...hero, ctaLabel: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide the button.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.ctaHref}
                onChange={(e) => setHero({ ...hero, ctaHref: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Background photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={hero.image}
                  onChange={(_id, url) => setHero({ ...hero, image: url ?? "" })}
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={hero.imageAlt}
                onChange={(e) => setHero({ ...hero, imageAlt: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Read aloud by screen readers. Describe what the photo shows.
              </p>
            </div>
          </div>
        </div>

        {/* ── 2. Listing heading ── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="list" value={styles.list} onChange={setStyle("list")} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-[#fafbf7] px-3 py-2 text-[13px] text-[#1a1a1a]">
            <span className="text-[12px] text-[#8a8a8a]">Repeated text — one setting covers every item:</span>
            {(
              [
                ["categoryTab", "Category tabs"],
                ["cardTitle", "Card titles"],
                ["cardExcerpt", "Card intros"],
                ["pageNumber", "Pagination"],
              ] as const
            ).map(([k, lbl]) => (
              <span key={k} className="flex items-center gap-2">
                {lbl}
                <Ts k={k} label={lbl} />
              </span>
            ))}
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              2. Above the articles
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The heading and intro that sit over the category tabs.
            </p>
          </div>
          <div>
            <LabelRow k="list.heading" label="Heading">
              <label className={fieldLabel}>Heading</label>
            </LabelRow>
            <input
              className={`${fieldInput} mt-1`}
              value={list.heading}
              onChange={(e) => setList({ ...list, heading: e.target.value })}
            />
          </div>
          <div>
            <LabelRow k="list.body" label="Intro">
              <label className={fieldLabel}>Intro</label>
            </LabelRow>
            <textarea
              rows={3}
              className={`${fieldInput} mt-1`}
              value={list.body}
              onChange={(e) => setList({ ...list, body: e.target.value })}
            />
          </div>
        </div>

        {/* ── 3. Newsletter ── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="newsletter" value={styles.newsletter} onChange={setStyle("newsletter")} />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              3. Newsletter block
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              Photo on the left, subscribe form on the right.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LabelRow k="newsletter.heading" label="Heading">
                <label className={fieldLabel}>Heading</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.heading}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, heading: e.target.value })
                }
              />
            </div>
            <div>
              <LabelRow k="newsletter.headingAccent" label="Heading (italic part)">
                <label className={fieldLabel}>Heading (italic part)</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.headingAccent}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, headingAccent: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <LabelRow k="newsletter.kicker" label="Bold line">
                <label className={fieldLabel}>Bold line</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.kicker}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, kicker: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <LabelRow k="newsletter.body" label="Body">
                <label className={fieldLabel}>Body</label>
              </LabelRow>
              <textarea
                rows={2}
                className={`${fieldInput} mt-1`}
                value={newsletter.body}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, body: e.target.value })
                }
              />
            </div>
            <div>
              <LabelRow k="newsletter.placeholder" label="Email box placeholder">
                <label className={fieldLabel}>Email box placeholder</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.placeholder}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, placeholder: e.target.value })
                }
              />
            </div>
            <div>
              <LabelRow k="newsletter.submitLabel" label="Submit button text">
                <label className={fieldLabel}>Submit button text</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.submitLabel}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, submitLabel: e.target.value })
                }
              />
            </div>
            <div>
              <label className={fieldLabel}>Photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={newsletter.image}
                  onChange={(_id, url) =>
                    setNewsletter({ ...newsletter, image: url ?? "" })
                  }
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={newsletter.imageAlt}
                onChange={(e) =>
                  setNewsletter({ ...newsletter, imageAlt: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* ── 4. Closing banner ── */}
        <div className={card}>
          <div className="-mb-2 flex justify-end">
            <SectionControl sectionKey="cta" value={styles.cta} onChange={setStyle("cta")} />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[#1a1a1a]">
              4. Closing banner
            </h2>
            <p className="mt-1 text-[13px] text-[#616161]">
              The last block before the footer.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <LabelRow k="cta.title" label="Heading">
                <label className={fieldLabel}>Heading</label>
              </LabelRow>
              <textarea
                rows={2}
                className={`${fieldInput} mt-1`}
                value={cta.title}
                onChange={(e) => setCta({ ...cta, title: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Press Enter for a line break — each line is centred separately.
              </p>
            </div>
            <div className="sm:col-span-2">
              <LabelRow k="cta.body" label="Body">
                <label className={fieldLabel}>Body</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.body}
                onChange={(e) => setCta({ ...cta, body: e.target.value })}
              />
            </div>
            <div>
              <LabelRow k="cta.ctaLabel" label="Button text">
                <label className={fieldLabel}>Button text</label>
              </LabelRow>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.ctaLabel}
                onChange={(e) => setCta({ ...cta, ctaLabel: e.target.value })}
              />
              <p className="mt-1 text-[12px] text-[#8a8a8a]">
                Leave empty to hide the button.
              </p>
            </div>
            <div>
              <label className={fieldLabel}>Button link</label>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.ctaHref}
                onChange={(e) => setCta({ ...cta, ctaHref: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel}>Background photo</label>
              <div className="mt-1">
                <MediaPicker
                  valueId={null}
                  valueUrl={cta.image}
                  onChange={(_id, url) => setCta({ ...cta, image: url ?? "" })}
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Photo description</label>
              <input
                className={`${fieldInput} mt-1`}
                value={cta.imageAlt}
                onChange={(e) => setCta({ ...cta, imageAlt: e.target.value })}
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
          {saving ? "Saving…" : "Save blog listing page"}
        </button>
      
        {saved ? (
          <span className="text-[13px] text-[#2f6b33]">Saved. Reload the page to see the change.</span>
        ) : null}
        {error ? (
          <span className="text-[13px] text-[#8a2b2b]">{error}</span>
        ) : null}
      </div>
    </div>
    </TextStyleCtx.Provider>
  );
}
